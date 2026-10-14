import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:sixam_mart/api/api_client.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_decoration_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/helper/grocery_config_cache.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_section_shimmer.dart';
import 'package:sixam_mart/features/item/controllers/item_controller.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryHeroFestController extends GetxController {
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
    config = GroceryConfigCache.load('hero_fest');
    fetchDynamicConfig();
  }

  Future<void> fetchDynamicConfig() async {
    try {
      // 1. First priority: Use ApiClient
      if (Get.isRegistered<ApiClient>()) {
        try {
          final res = await Get.find<ApiClient>().getData('/api/v1/grocery/hero-fest');
          if (res.statusCode == 200 && res.body != null) {
            final dynamic body = res.body;
            final dynamic rawData = (body is Map) ? body['data'] : _parseConfig(body)?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              config = parsed;
              GroceryConfigCache.save('hero_fest', parsed);
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
        'http://$host:3000/BuggyDm/api/grocery/hero-fest',
        'http://localhost:3000/BuggyDm/api/grocery/hero-fest',
        'http://127.0.0.1:3000/BuggyDm/api/grocery/hero-fest',
        '${AppConstants.baseUrl}/api/v1/grocery/hero-fest',
        'http://127.0.0.1:8000/api/v1/grocery/hero-fest',
      ];
      for (final endpoint in endpoints) {
        try {
          final res = await http.get(Uri.parse(endpoint)).timeout(const Duration(seconds: 3));
          if (res.statusCode == 200) {
            final dynamic body = _parseConfig(res.body);
            final dynamic rawData = body?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              config = parsed;
              GroceryConfigCache.save('hero_fest', parsed);
              update();
              break;
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
}

class GroceryHeroFestWidget extends StatelessWidget {
  const GroceryHeroFestWidget({super.key});

  Color _parseHexColor(String? hex, Color fallback) {
    if (hex == null || hex.isEmpty) return fallback;
    try {
      final clean = hex.replaceAll('#', '');
      if (clean.length == 6) {
        return Color(int.parse('0xFF$clean'));
      } else if (clean.length == 8) {
        return Color(int.parse('0x$clean'));
      }
    } catch (_) {}
    return fallback;
  }

  String _resolveImageUrl(dynamic rawUrl) => resolveGroceryImageUrl(rawUrl);

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryHeroFestController>()) {
      Get.put(GroceryHeroFestController());
    }

    return GetBuilder<GroceryHeroFestController>(
      builder: (controller) {
        final config = controller.config;

        if (config == null) {
          return const GrocerySectionShimmer(height: 290);
        }

        if (config['enabled'] == false) {
          return const SizedBox.shrink();
        }

        final String title = config['title'] ?? 'Hot Sips & Snack Fest';
        final String headerEmoji = config?['headerEmoji'] ?? '🫖';
        final List sponsors = config?['sponsors'] as List? ?? [
          {'label': 'Powered By', 'name': 'Red Label', 'badgeColor': '#DC2626'},
          {'label': '', 'name': 'Maggi', 'badgeColor': '#CA8A04'},
          {'label': 'Co-powered By', 'name': 'Nescafe', 'badgeColor': '#78350F'},
        ];

        final Map<String, dynamic>? dealsZone =
            config?['dealsZone'] as Map<String, dynamic>?;

        final List miniCards = config?['miniCards'] as List? ?? [
          {
            'title': 'Hot Sips & Mixes',
            'priceText': 'Starts at ₹40',
            'emoji': '☕',
            'searchKeyword': 'tea coffee',
          },
          {
            'title': 'Frozen Bites',
            'priceText': 'Starts at ₹129',
            'emoji': '🍟',
            'searchKeyword': 'frozen snacks',
          },
          {
            'title': 'Munch & Slurp',
            'priceText': 'Starts at ₹15',
            'emoji': '🍜',
            'searchKeyword': 'noodles pasta',
          },
          {
            'title': 'Cookies & Cake',
            'priceText': 'Starts at ₹15',
            'emoji': '🍪',
            'searchKeyword': 'biscuits cookies',
          },
        ];

        final cxp = context.cxpTheme;
        final heroDecs = cxp.getHeroDecorations();

        return Container(
          margin: EdgeInsets.symmetric(
            horizontal: cxp.spacingMd,
            vertical: Dimensions.paddingSizeExtraSmall,
          ),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF380018),
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFF380018),
                Color(0xFF280012),
              ],
            ),
            borderRadius: BorderRadius.circular(cxp.cardRadius),
            border: Border.all(color: const Color(0xFF6B0033), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              for (final dec in heroDecs)
                Positioned.fill(
                  child: Align(
                    alignment: CxpDecorationWidget.alignmentFor(dec.positionX, dec.positionY),
                    child: CxpDecorationWidget(decoration: dec),
                  ),
                ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
              // Banner Top Headline with Sponsors & Icon
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: robotoBold.copyWith(
                            fontSize: 20,
                            color: Colors.white,
                            letterSpacing: -0.5,
                            height: 1.1,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 4,
                          runSpacing: 3,
                          children: [
                            for (final sp in sponsors) ...[
                              if ((sp['label']?.toString() ?? '').isNotEmpty)
                                Text(
                                  '${sp['label']} ',
                                  style: robotoRegular.copyWith(
                                    fontSize: 10,
                                    color: const Color(0xFFFFD8A8),
                                  ),
                                ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 5,
                                  vertical: 1.5,
                                ),
                                decoration: BoxDecoration(
                                  color: _parseHexColor(
                                    sp['badgeColor']?.toString(),
                                    const Color(0xFFDC2626),
                                  ),
                                  borderRadius: BorderRadius.circular(3),
                                ),
                                child: Text(
                                  sp['name']?.toString() ?? '',
                                  style: robotoBold.copyWith(
                                    fontSize: 8.5,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Header Icon / Teapot
                  Container(
                    width: 48,
                    height: 44,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.55),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFFFD8A8)),
                    ),
                    child: Text(headerEmoji, style: const TextStyle(fontSize: 26)),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Deals Grid (Left: Deals Zone, Right: 2x2 Mini Cards)
              GetBuilder<ItemController>(
                builder: (itemController) {
                  final items = itemController.discountedItemList ??
                      itemController.popularItemList;
                  final featuredItem =
                      (items != null && items.isNotEmpty) ? items.first : null;

                  final String dealsZoneTitle =
                      dealsZone?['title'] ?? 'Deals\nZone';
                  final String dealsZoneName = dealsZone?['itemName'] ??
                      featuredItem?.name ??
                      'Aashirvaad Svasti Cow Ghee';
                  final double originalPrice = double.tryParse(
                          dealsZone?['originalPrice']?.toString() ?? '') ??
                      (featuredItem?.price ?? 185.0);
                  final double discountedPrice = double.tryParse(
                          dealsZone?['discountedPrice']?.toString() ?? '') ??
                      ((featuredItem?.price ?? 185.0) -
                          (featuredItem?.discount ?? 99.0));
                  final String? customImage = _resolveImageUrl(dealsZone?['itemImage']);

                  return SizedBox(
                    height: 245,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Left Column: Deals Zone
                        Expanded(
                          flex: 4,
                          child: InkWell(
                            onTap: () {
                              final dynamic rawItemId = dealsZone?['itemId'];
                              final int? linkedId = (rawItemId != null)
                                  ? int.tryParse(rawItemId.toString())
                                  : null;
                              if (linkedId != null && linkedId > 0) {
                                Get.toNamed(RouteHelper.getItemDetailsRoute(
                                  linkedId,
                                  false,
                                  dealsZoneName,
                                  slug: dealsZone?['slug']?.toString() ?? '',
                                ));
                              } else if (featuredItem != null) {
                                Get.toNamed(RouteHelper.getItemDetailsRoute(
                                  featuredItem.id,
                                  false,
                                  featuredItem.name ?? '',
                                  slug: featuredItem.slug ?? '',
                                ));
                              } else {
                                Get.toNamed(RouteHelper.getSearchRoute(
                                  queryText: dealsZoneName,
                                ));
                              }
                            },
                            borderRadius: BorderRadius.circular(cxp.cardRadius),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: cxp.surfaceElevated,
                                borderRadius: BorderRadius.circular(cxp.cardRadius),
                                border: Border.all(
                                  color: cxp.accent.withValues(alpha: 0.5),
                                  width: 1.2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.04),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    dealsZoneTitle,
                                    style: robotoBold.copyWith(
                                      fontSize: 14,
                                      color: cxp.textPrimary,
                                      height: 1.15,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const Spacer(),

                                  // Product Image + Price Badge
                                  Center(
                                    child: Stack(
                                      clipBehavior: Clip.none,
                                      alignment: Alignment.bottomRight,
                                      children: [
                                        ClipRRect(
                                          borderRadius:
                                              BorderRadius.circular(10),
                                          child: SizedBox(
                                            height: 110,
                                            width: 90,
                                            child: (customImage != null &&
                                                    customImage.isNotEmpty &&
                                                    customImage.startsWith('http'))
                                                ? Image.network(
                                                    customImage,
                                                    height: 110,
                                                    width: 90,
                                                    fit: BoxFit.contain,
                                                    errorBuilder: (context, error, stackTrace) {
                                                      return Container(
                                                        height: 110,
                                                        width: 90,
                                                        alignment: Alignment.center,
                                                        child: const Text('🧈',
                                                            style: TextStyle(fontSize: 40)),
                                                      );
                                                    },
                                                  )
                                                : (featuredItem?.imageFullUrl != null
                                                    ? CustomImage(
                                                        image: featuredItem!.imageFullUrl!,
                                                        height: 110,
                                                        width: 90,
                                                        fit: BoxFit.contain,
                                                      )
                                                    : Container(
                                                        height: 110,
                                                        width: 90,
                                                        alignment: Alignment.center,
                                                        child: const Text('🧈',
                                                            style: TextStyle(fontSize: 40)),
                                                      )),
                                          ),
                                        ),

                                        // Scalloped Badge
                                        Positioned(
                                          right: -4,
                                          bottom: -2,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 6,
                                              vertical: 3,
                                            ),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFFFBEB),
                                              borderRadius:
                                                  BorderRadius.circular(cxp.radiusSm),
                                              border: Border.all(
                                                color:
                                                    const Color(0xFFF59E0B),
                                                width: 1.1,
                                              ),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.black
                                                      .withOpacity(0.08),
                                                  blurRadius: 3,
                                                  offset: const Offset(0, 1),
                                                ),
                                              ],
                                            ),
                                            child: Column(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Text(
                                                  PriceConverter.convertPrice(
                                                      originalPrice),
                                                  style:
                                                      robotoRegular.copyWith(
                                                    fontSize: 8.5,
                                                    color: const Color(
                                                        0xFF94A3B8),
                                                    decoration: TextDecoration
                                                        .lineThrough,
                                                  ),
                                                ),
                                                Text(
                                                  PriceConverter.convertPrice(
                                                      discountedPrice),
                                                  style: robotoBold.copyWith(
                                                    fontSize: 11,
                                                    color:
                                                        const Color(0xFFB45309),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                  const Spacer(),
                                  Text(
                                    dealsZoneName,
                                    style: robotoMedium.copyWith(
                                      fontSize: 11,
                                      color: const Color(0xFF1E293B),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(width: 8),

                        // Right Column: 2x2 Grid
                        Expanded(
                          flex: 6,
                          child: Column(
                            children: [
                              Expanded(
                                child: Row(
                                  children: [
                                    _buildMiniDealCard(
                                      title: miniCards.isNotEmpty
                                          ? (miniCards[0]['title'] ?? '')
                                          : 'Hot Sips & Mixes',
                                      priceText: miniCards.isNotEmpty
                                          ? (miniCards[0]['priceText'] ?? '')
                                          : 'Starts at ₹40',
                                      emoji: miniCards.isNotEmpty
                                          ? (miniCards[0]['emoji'] ?? '☕')
                                          : '☕',
                                      imageUrl: miniCards.isNotEmpty
                                          ? _resolveImageUrl(miniCards[0]['image'])
                                          : null,
                                      onTap: () => Get.toNamed(
                                        RouteHelper.getSearchRoute(
                                          queryText: miniCards.isNotEmpty
                                              ? miniCards[0]['searchKeyword']
                                              : null,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    _buildMiniDealCard(
                                      title: miniCards.length > 1
                                          ? (miniCards[1]['title'] ?? '')
                                          : 'Frozen Bites',
                                      priceText: miniCards.length > 1
                                          ? (miniCards[1]['priceText'] ?? '')
                                          : 'Starts at ₹129',
                                      emoji: miniCards.length > 1
                                          ? (miniCards[1]['emoji'] ?? '🍟')
                                          : '🍟',
                                      imageUrl: miniCards.length > 1
                                          ? _resolveImageUrl(miniCards[1]['image'])
                                          : null,
                                      onTap: () => Get.toNamed(
                                        RouteHelper.getSearchRoute(
                                          queryText: miniCards.length > 1
                                              ? miniCards[1]['searchKeyword']
                                              : null,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 6),
                              Expanded(
                                child: Row(
                                  children: [
                                    _buildMiniDealCard(
                                      title: miniCards.length > 2
                                          ? (miniCards[2]['title'] ?? '')
                                          : 'Munch & Slurp',
                                      priceText: miniCards.length > 2
                                          ? (miniCards[2]['priceText'] ?? '')
                                          : 'Starts at ₹15',
                                      emoji: miniCards.length > 2
                                          ? (miniCards[2]['emoji'] ?? '🍜')
                                          : '🍜',
                                      imageUrl: miniCards.length > 2
                                          ? _resolveImageUrl(miniCards[2]['image'])
                                          : null,
                                      onTap: () => Get.toNamed(
                                        RouteHelper.getSearchRoute(
                                          queryText: miniCards.length > 2
                                              ? miniCards[2]['searchKeyword']
                                              : null,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    _buildMiniDealCard(
                                      title: miniCards.length > 3
                                          ? (miniCards[3]['title'] ?? '')
                                          : 'Cookies & Cake',
                                      priceText: miniCards.length > 3
                                          ? (miniCards[3]['priceText'] ?? '')
                                          : 'Starts at ₹15',
                                      emoji: miniCards.length > 3
                                          ? (miniCards[3]['emoji'] ?? '🍪')
                                          : '🍪',
                                      imageUrl: miniCards.length > 3
                                          ? _resolveImageUrl(miniCards[3]['image'])
                                          : null,
                                      onTap: () => Get.toNamed(
                                        RouteHelper.getSearchRoute(
                                          queryText: miniCards.length > 3
                                              ? miniCards[3]['searchKeyword']
                                              : null,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
      },
    );
  }

  Widget _buildMiniDealCard({
    required String title,
    required String priceText,
    required String emoji,
    String? imageUrl,
    required VoidCallback onTap,
  }) {
    final String safeEmoji = emoji.trim().isNotEmpty ? emoji.trim() : '☕';
    final bool hasValidImage = imageUrl != null &&
        imageUrl.trim().isNotEmpty &&
        imageUrl.trim().startsWith('http');

    final cxp = Get.context != null ? Get.context!.cxpTheme : BuggyCxpThemeExtension.defaultTheme;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(cxp.cardRadius),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          decoration: BoxDecoration(
            color: cxp.surfaceElevated,
            borderRadius: BorderRadius.circular(cxp.cardRadius),
            border: Border.all(color: cxp.textSecondary.withValues(alpha: 0.15)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: robotoBold.copyWith(
                  fontSize: 11,
                  color: cxp.textPrimary,
                  height: 1.1,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),

              Center(
                child: SizedBox(
                  width: 36,
                  height: 36,
                  child: hasValidImage
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            imageUrl!,
                            width: 36,
                            height: 36,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) {
                              return Center(
                                child: Text(safeEmoji, style: const TextStyle(fontSize: 24)),
                              );
                            },
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return const Center(
                                child: SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              );
                            },
                          ),
                        )
                      : Center(
                          child: Text(safeEmoji, style: const TextStyle(fontSize: 24)),
                        ),
                ),
              ),

              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444),
                  borderRadius: BorderRadius.circular(cxp.radiusSm),
                ),
                child: Text(
                  priceText,
                  style: robotoBold.copyWith(
                    fontSize: 9,
                    color: Colors.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
