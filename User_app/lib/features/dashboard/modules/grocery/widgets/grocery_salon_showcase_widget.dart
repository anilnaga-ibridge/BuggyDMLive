import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:video_player/video_player.dart';
import 'package:sixam_mart/api/api_client.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/helper/grocery_config_cache.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_section_shimmer.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/styles.dart';

class GrocerySalonShowcaseController extends GetxController {
  Map<String, dynamic>? config;
  bool isLoading = false;

  Map<String, dynamic>? _parseConfig(dynamic raw) {
    if (raw == null) return null;
    dynamic current = raw;
    while (current is String) {
      try {
        current = jsonDecode(current);
      } catch (_) {
        break;
      }
    }
    if (current is Map) {
      return Map<String, dynamic>.from(current);
    }
    return null;
  }

  @override
  void onInit() {
    super.onInit();
    config = GroceryConfigCache.load('salon_showcase');
    fetchDynamicConfig();
  }

  Future<void> fetchDynamicConfig() async {
    try {
      // 1. First priority: Use ApiClient
      if (Get.isRegistered<ApiClient>()) {
        try {
          final res = await Get.find<ApiClient>().getData('/api/v1/grocery/salon-showcase');
          if (res.statusCode == 200 && res.body != null) {
            final dynamic body = res.body;
            final dynamic rawData = (body is Map) ? body['data'] : _parseConfig(body)?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              config = parsed;
              GroceryConfigCache.save('salon_showcase', parsed);
              update();
              return;
            }
          }
        } catch (_) {}
      }

      // 2. Direct HTTP fallbacks
      final host = (GetPlatform.isWeb && Uri.base.host.isNotEmpty)
          ? Uri.base.host
          : '127.0.0.1';
      final endpoints = [
        'http://$host:3000/BuggyDm/api/grocery/salon-showcase',
        'http://localhost:3000/BuggyDm/api/grocery/salon-showcase',
        'http://127.0.0.1:3000/BuggyDm/api/grocery/salon-showcase',
        '${AppConstants.baseUrl}/api/v1/grocery/salon-showcase',
        'http://127.0.0.1:8000/api/v1/grocery/salon-showcase',
      ];
      for (final endpoint in endpoints) {
        try {
          final res =
              await http.get(Uri.parse(endpoint)).timeout(const Duration(seconds: 3));
          if (res.statusCode == 200) {
            final dynamic body = _parseConfig(res.body);
            final dynamic rawData = body?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              config = parsed;
              GroceryConfigCache.save('salon_showcase', parsed);
              update();
              break;
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
}

String _resolveImageUrl(dynamic rawUrl) => resolveGroceryImageUrl(rawUrl);

Widget _buildSafeImage(
  dynamic rawUrl, {
  double? width,
  double? height,
  BoxFit fit = BoxFit.cover,
  Widget? errorWidget,
}) {
  final resolved = _resolveImageUrl(rawUrl);
  final defaultError = errorWidget ??
      Container(
        width: width,
        height: height,
        color: const Color(0xFFF1F5F9),
        child: const Center(
          child: Icon(Icons.shopping_bag_outlined, color: Colors.grey, size: 24),
        ),
      );

  if (resolved.isEmpty) {
    return defaultError;
  }

  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return Image.network(
      resolved,
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (_, __, ___) => defaultError,
    );
  }

  return Image.asset(
    resolved,
    width: width,
    height: height,
    fit: fit,
    cacheWidth: 400,
    filterQuality: FilterQuality.medium,
    errorBuilder: (_, __, ___) => defaultError,
  );
}

class GrocerySalonShowcaseWidget extends StatelessWidget {
  const GrocerySalonShowcaseWidget({super.key});

  static const List<Map<String, dynamic>> _defaultMiniCards = [
    {
      'title': 'Premium Hair Care Range',
      'badgeText': 'UP TO 50% OFF',
      'image': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
      'searchKeyword': 'Premium Hair Care',
    },
    {
      'title': 'Daily Hair Care',
      'badgeText': 'UP TO 70% OFF',
      'image': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
      'searchKeyword': 'Daily Hair Care',
    },
    {
      'title': 'Hair Colour & Styling',
      'badgeText': 'UP TO 65% OFF',
      'image': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&auto=format&fit=crop&q=80',
      'searchKeyword': 'Hair Colour',
    },
    {
      'title': 'Hair Growth & Supplement',
      'badgeText': 'UP TO 45% OFF',
      'image': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
      'searchKeyword': 'Hair Growth Supplement',
    },
  ];

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GrocerySalonShowcaseController>()) {
      Get.put(GrocerySalonShowcaseController());
    }

    return GetBuilder<GrocerySalonShowcaseController>(
      builder: (controller) {
        if (controller.config == null) {
          return const GrocerySectionShimmer(height: 360);
        }

        final salonConfig = controller.config?['salon'];
        final bloomConfig = controller.config?['bloom'];

        final bool isSalonEnabled = salonConfig?['enabled'] != false;
        final bool isBloomEnabled = bloomConfig?['enabled'] != false;

        final String title = salonConfig?['title']?.toString() ?? 'Salon at Home';
        final String sponsorText =
            salonConfig?['sponsorText']?.toString() ?? 'Powered by';
        final String sponsorName =
            salonConfig?['sponsorName']?.toString() ?? "L'ORÉAL";

        final Map heroDeal =
            (salonConfig?['heroDeal'] as Map?) ?? {
          'itemName': "L'Oreal Absolut Repair",
          'originalPrice': 795,
          'discountedPrice': 715,
          'itemImage': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80',
        };

        final List miniCards =
            (salonConfig?['miniCards'] as List?) ?? _defaultMiniCards;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // -----------------------------------------------------------------
            // 1. SALON AT HOME SHOWCASE CARD
            // -----------------------------------------------------------------
            if (isSalonEnabled)
              Padding(
                padding: EdgeInsets.symmetric(
                    horizontal: context.cxpTheme.spacingMd),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFE0F2FE), Color(0xFFF0F9FF), Colors.white],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: BorderRadius.circular(context.cxpTheme.cardRadius),
                    border: Border.all(color: const Color(0xFFBAE6FD), width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0284C7).withOpacity(0.08),
                        blurRadius: 14,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Text('✦',
                                        style: TextStyle(
                                            color: Color(0xFF0284C7),
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold)),
                                    const SizedBox(width: 3),
                                    Text(
                                      title,
                                      style: robotoBold.copyWith(
                                        fontSize: 21,
                                        fontStyle: FontStyle.italic,
                                        color: const Color(0xFF0C4A6E),
                                        letterSpacing: -0.4,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                    const SizedBox(width: 3),
                                    const Text('✦',
                                        style: TextStyle(
                                            color: Color(0xFF0284C7),
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Text(
                                      sponsorText,
                                      style: robotoRegular.copyWith(
                                        fontSize: 11,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 1.5),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(
                                            color: const Color(0xFFCBD5E1),
                                            width: 0.8),
                                      ),
                                      child: Text(
                                        sponsorName,
                                        style: robotoBold.copyWith(
                                          fontSize: 10,
                                          color: const Color(0xFF0F172A),
                                          letterSpacing: 0.5,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),

                            // Mini Header Product Silhouette
                            Container(
                              height: 48,
                              width: 80,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.8),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                    color: const Color(0xFFBAE6FD), width: 0.8),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.asset(
                                  'assets/image/salon_at_home_card.png',
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) =>
                                      const SizedBox.shrink(),
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 12),

                        // Body Grid: Left Deals Corner + Right 2x2 Mini Cards
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Left: Deals Corner Hero Card
                            Expanded(
                              flex: 4,
                              child: _buildDealsCornerCard(context, heroDeal),
                            ),

                            const SizedBox(width: 8),

                            // Right: 2x2 Mini Cards Grid
                            Expanded(
                              flex: 8,
                              child: Column(
                                children: [
                                  // Row 1 of Mini Cards
                                  Row(
                                    children: [
                                      if (miniCards.isNotEmpty)
                                        Expanded(
                                            child: _buildMiniCard(context, miniCards[0])),
                                      if (miniCards.length > 1) ...[
                                        const SizedBox(width: 8),
                                        Expanded(
                                            child: _buildMiniCard(context, miniCards[1])),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  // Row 2 of Mini Cards
                                  Row(
                                    children: [
                                      if (miniCards.length > 2)
                                        Expanded(
                                            child: _buildMiniCard(context, miniCards[2])),
                                      if (miniCards.length > 3) ...[
                                        const SizedBox(width: 8),
                                        Expanded(
                                            child: _buildMiniCard(context, miniCards[3])),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // -----------------------------------------------------------------
            // 2. BLOOM FRESH FRUIT PROMOTIONAL BANNER (IMAGE & VIDEO SUPPORT)
            // -----------------------------------------------------------------
            if (isBloomEnabled) ...[
              const SizedBox(height: 14),
              BloomPromotionalBannerWidget(
                bloomData: (bloomConfig is Map) ? bloomConfig : {},
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildDealsCornerCard(BuildContext context, Map heroDeal) {
    final String itemName =
        heroDeal['itemName']?.toString() ?? "L'Oreal Absolut Repair";
    final String originalPrice = heroDeal['originalPrice']?.toString() ?? '795';
    final String discountedPrice =
        heroDeal['discountedPrice']?.toString() ?? '715';
    final dynamic image = heroDeal['itemImage'];
    final dynamic id = heroDeal['itemId'];
    final theme = context.cxpTheme;

    return InkWell(
      onTap: () {
        if (id != null && id.toString().isNotEmpty && id != 'null') {
          final int? itemId = int.tryParse(id.toString());
          if (itemId != null && itemId > 0) {
            Get.toNamed(RouteHelper.getItemDetailsRoute(
              itemId,
              false,
              itemName,
              slug: heroDeal['slug']?.toString() ?? '',
            ));
            return;
          }
        }
        Get.toNamed(RouteHelper.getSearchRoute(queryText: itemName));
      },
      borderRadius: BorderRadius.circular(theme.cardRadius),
      child: Container(
        padding: const EdgeInsets.all(7),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(theme.cardRadius),
          border: Border.all(color: const Color(0xFFBAE6FD), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              'DEALS\nCorner',
              textAlign: TextAlign.center,
              style: robotoBold.copyWith(
                fontSize: 10.5,
                color: const Color(0xFF0C4A6E),
                height: 1.1,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            SizedBox(
              height: 72,
              width: 72,
              child: _buildSafeImage(
                image,
                fit: BoxFit.contain,
                errorWidget: Image.asset(
                  'assets/image/steal_lakme.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF0284C7),
                borderRadius: BorderRadius.circular(theme.radiusSm),
              ),
              child: Column(
                children: [
                  Text(
                    '₹$originalPrice',
                    style: robotoRegular.copyWith(
                      fontSize: 9.5,
                      color: Colors.white.withOpacity(0.8),
                      decoration: TextDecoration.lineThrough,
                      height: 1.0,
                    ),
                  ),
                  Text(
                    '₹$discountedPrice',
                    style: robotoBold.copyWith(
                      fontSize: 13,
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      height: 1.1,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniCard(BuildContext context, dynamic cardData) {
    final Map card = cardData is Map ? cardData : {};
    final String title = card['title']?.toString() ?? 'Hair Care';
    final String badgeText = card['badgeText']?.toString() ?? 'UP TO 50% OFF';
    final dynamic image = card['image'];
    final String keyword =
        card['searchKeyword']?.toString() ?? title;
    final theme = context.cxpTheme;

    return InkWell(
      onTap: () => Get.toNamed(RouteHelper.getSearchRoute(queryText: keyword)),
      borderRadius: BorderRadius.circular(theme.cardRadius),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(theme.cardRadius),
          border: Border.all(color: const Color(0xFFBAE6FD), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              height: 24,
              child: Text(
                title,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: robotoBold.copyWith(
                  fontSize: 9.5,
                  color: const Color(0xFF0F172A),
                  height: 1.1,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(height: 3),
            SizedBox(
              height: 38,
              width: 38,
              child: _buildSafeImage(
                image,
                fit: BoxFit.contain,
                errorWidget: const Icon(Icons.spa_outlined,
                    color: Color(0xFF0284C7), size: 24),
              ),
            ),
            const SizedBox(height: 4),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 2.5),
              decoration: BoxDecoration(
                color: const Color(0xFF0284C7),
                borderRadius: BorderRadius.circular(theme.radiusSm),
              ),
              child: Text(
                badgeText,
                textAlign: TextAlign.center,
                style: robotoBold.copyWith(
                  fontSize: 8.5,
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BloomPromotionalBannerWidget extends StatefulWidget {
  final Map bloomData;

  const BloomPromotionalBannerWidget({super.key, required this.bloomData});

  @override
  State<BloomPromotionalBannerWidget> createState() =>
      _BloomPromotionalBannerWidgetState();
}

class _BloomPromotionalBannerWidgetState
    extends State<BloomPromotionalBannerWidget> {
  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;
  bool _isMuted = true;
  bool _isPlaying = true;
  String _lastVideoUrl = '';

  @override
  void initState() {
    super.initState();
    _initMedia();
  }

  @override
  void didUpdateWidget(covariant BloomPromotionalBannerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    final String currentUrl = _extractVideoUrl();
    if (currentUrl != _lastVideoUrl) {
      _initMedia();
    }
  }

  String _extractVideoUrl() {
    final String mediaType =
        widget.bloomData['mediaType']?.toString().toLowerCase() ?? 'image';
    final String videoUrl = widget.bloomData['videoUrl']?.toString() ?? '';
    final String image = widget.bloomData['image']?.toString() ?? '';

    if (mediaType == 'video' && videoUrl.isNotEmpty) {
      return _resolveImageUrl(videoUrl);
    }
    if (image.endsWith('.mp4') ||
        image.endsWith('.webm') ||
        image.endsWith('.mov')) {
      return _resolveImageUrl(image);
    }
    return '';
  }

  void _initMedia() {
    final videoUrl = _extractVideoUrl();
    if (videoUrl.isEmpty) {
      _disposeVideo();
      return;
    }

    _lastVideoUrl = videoUrl;
    _disposeVideo();

    try {
      final uri = Uri.parse(videoUrl);
      _videoController = VideoPlayerController.networkUrl(uri)
        ..initialize().then((_) {
          if (mounted) {
            setState(() {
              _isVideoInitialized = true;
            });
            final bool autoPlay = widget.bloomData['autoPlay'] ?? true;
            final bool loop = widget.bloomData['loop'] ?? true;
            final bool muted = widget.bloomData['muted'] ?? true;

            _isMuted = muted;
            _videoController?.setLooping(loop);
            _videoController?.setVolume(muted ? 0 : 1);
            if (autoPlay) {
              _videoController?.play();
              _isPlaying = true;
            }
          }
        }).catchError((_) {
          if (mounted) {
            setState(() {
              _isVideoInitialized = false;
            });
          }
        });
    } catch (_) {
      _isVideoInitialized = false;
    }
  }

  void _disposeVideo() {
    _videoController?.pause();
    _videoController?.dispose();
    _videoController = null;
    _isVideoInitialized = false;
  }

  @override
  void dispose() {
    _disposeVideo();
    super.dispose();
  }

  void _togglePlayPause() {
    if (_videoController == null || !_isVideoInitialized) return;
    setState(() {
      if (_videoController!.value.isPlaying) {
        _videoController?.pause();
        _isPlaying = false;
      } else {
        _videoController?.play();
        _isPlaying = true;
      }
    });
  }

  void _toggleMute() {
    if (_videoController == null || !_isVideoInitialized) return;
    setState(() {
      _isMuted = !_isMuted;
      _videoController?.setVolume(_isMuted ? 0 : 1);
    });
  }

  @override
  Widget build(BuildContext context) {
    final String bloomImage = widget.bloomData['image']?.toString() ??
        'assets/image/bloom_fruit_banner.png';
    final String bloomKeyword = widget.bloomData['searchKeyword']?.toString() ??
        'Fresh Fruits and Vegetables';
    final bool hasVideo = _extractVideoUrl().isNotEmpty;

    return Padding(
      padding:
          EdgeInsets.symmetric(horizontal: context.cxpTheme.spacingMd),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(context.cxpTheme.cardRadius),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(context.cxpTheme.cardRadius),
          child: AspectRatio(
            aspectRatio: 751 / 277,
            child: Stack(
              children: [
                // Video or Image Background
                Positioned.fill(
                  child: Material(
                    color: const Color(0xFF0F172A),
                    child: InkWell(
                      onTap: () {
                        if (hasVideo && _isVideoInitialized) {
                          _togglePlayPause();
                        } else {
                          Get.toNamed(RouteHelper.getSearchRoute(
                              queryText: bloomKeyword));
                        }
                      },
                      child: hasVideo &&
                              _isVideoInitialized &&
                              _videoController != null
                          ? FittedBox(
                              fit: BoxFit.cover,
                              clipBehavior: Clip.hardEdge,
                              child: SizedBox(
                                width: _videoController!.value.size.width > 0
                                    ? _videoController!.value.size.width
                                    : 751,
                                height: _videoController!.value.size.height > 0
                                    ? _videoController!.value.size.height
                                    : 277,
                                child: VideoPlayer(_videoController!),
                              ),
                            )
                          : _buildSafeImage(
                              bloomImage,
                              fit: BoxFit.fill,
                              errorWidget: Image.asset(
                                'assets/image/bloom_fruit_banner.png',
                                fit: BoxFit.fill,
                              ),
                            ),
                    ),
                  ),
                ),

                // Video Controls Overlay (Mute / Unmute & Play/Pause Badge & Route Button)
                if (hasVideo && _isVideoInitialized) ...[
                  // Bottom Bar with Mute & Shop Now CTA
                  Positioned(
                    bottom: 8,
                    left: 10,
                    right: 10,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Sound Toggle Button
                        InkWell(
                          onTap: _toggleMute,
                          borderRadius: BorderRadius.circular(context.cxpTheme.buttonRadius),
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.55),
                              shape: BoxShape.circle,
                              border: Border.all(
                                  color: Colors.white.withOpacity(0.2), width: 1),
                            ),
                            child: Icon(
                              _isMuted
                                  ? Icons.volume_off_rounded
                                  : Icons.volume_up_rounded,
                              size: 16,
                              color: Colors.white,
                            ),
                          ),
                        ),

                        // Shop Now Button
                        InkWell(
                          onTap: () => Get.toNamed(RouteHelper.getSearchRoute(
                              queryText: bloomKeyword)),
                          borderRadius: BorderRadius.circular(context.cxpTheme.buttonRadius),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFF15803D),
                              borderRadius: BorderRadius.circular(context.cxpTheme.buttonRadius),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.2),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Explore Deals',
                                  style: robotoBold.copyWith(
                                    fontSize: 11,
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.arrow_forward_rounded,
                                  size: 13,
                                  color: Colors.white,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Center Play Overlay Icon when paused
                  if (!_isPlaying)
                    Center(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.6),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.play_arrow_rounded,
                          size: 32,
                          color: Colors.white,
                        ),
                      ),
                    ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
