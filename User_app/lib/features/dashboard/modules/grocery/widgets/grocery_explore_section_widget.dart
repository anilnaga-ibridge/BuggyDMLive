import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:sixam_mart/api/api_client.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/helper/grocery_config_cache.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_section_shimmer.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryFeaturedOffersController extends GetxController {
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
    config = GroceryConfigCache.load('featured_offers');
    fetchDynamicConfig();
  }

  Future<void> fetchDynamicConfig() async {
    try {
      // 1. First priority: Use ApiClient
      if (Get.isRegistered<ApiClient>()) {
        try {
          final res = await Get.find<ApiClient>().getData('/api/v1/grocery/featured-offers');
          if (res.statusCode == 200 && res.body != null) {
            final dynamic body = res.body;
            final dynamic rawData = (body is Map) ? body['data'] : _parseConfig(body)?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              config = parsed;
              GroceryConfigCache.save('featured_offers', parsed);
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
        'http://$host:3000/BuggyDm/api/grocery/featured-offers',
        'http://localhost:3000/BuggyDm/api/grocery/featured-offers',
        'http://127.0.0.1:3000/BuggyDm/api/grocery/featured-offers',
        '${AppConstants.baseUrl}/api/v1/grocery/featured-offers',
        'http://127.0.0.1:8000/api/v1/grocery/featured-offers',
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
              GroceryConfigCache.save('featured_offers', parsed);
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
      cacheWidth: 300,
      filterQuality: FilterQuality.low,
      errorBuilder: (_, __, ___) => defaultError,
    );
  }

  return Image.asset(
    resolved,
    width: width,
    height: height,
    fit: fit,
    cacheWidth: 300,
    filterQuality: FilterQuality.medium,
    errorBuilder: (_, __, ___) => defaultError,
  );
}

class GroceryExploreSectionWidget extends StatelessWidget {
  const GroceryExploreSectionWidget({super.key});

  static const List<Map<String, dynamic>> _defaultRow1Cards = [
    {'image': 'assets/image/featGrocery.png', 'searchKeyword': 'Grocery', 'name': 'Grocery'},
    {'image': 'assets/image/featFood.png', 'searchKeyword': 'Food Burger', 'name': 'Food'},
    {'image': 'assets/image/featDineout.png', 'searchKeyword': 'Dineout Restaurant', 'name': 'Dineout'},
    {'image': 'assets/image/featPharmacy.png', 'searchKeyword': 'Pharmacy Medicine', 'name': 'Pharmacy'},
    {'image': 'assets/image/featMeatSeafood.png', 'searchKeyword': 'Meat Seafood', 'name': 'Meat & Seafood'},
  ];

  static const List<Map<String, dynamic>> _defaultRow2Cards = [
    {'image': 'assets/image/featFresh.png', 'searchKeyword': 'Fresh Fruits', 'name': 'Fresh'},
    {'image': 'assets/image/featBeauty.png', 'searchKeyword': 'Beauty Cosmetics', 'name': 'Beauty'},
    {'image': 'assets/image/featFlowers.png', 'searchKeyword': 'Flowers Bouquet', 'name': 'Flowers'},
    {'image': 'assets/image/featParcel.png', 'searchKeyword': 'Parcel Courier', 'name': 'Parcel'},
    {'image': 'assets/image/featServices.png', 'searchKeyword': 'Services Repair', 'name': 'Services'},
  ];

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryFeaturedOffersController>()) {
      Get.put(GroceryFeaturedOffersController());
    }

    return GetBuilder<GroceryFeaturedOffersController>(
      builder: (controller) {
        if (controller.config == null) {
          return const GrocerySectionShimmer(height: 220);
        }

        final config = controller.config?['featured'];
        if (config != null && config['enabled'] == false) {
          return const SizedBox.shrink();
        }

        final String title = config?['title']?.toString() ?? 'Featured';
        final String subtitle =
            config?['subtitle']?.toString() ?? 'Everything you need, in one place';
        final String topCategoriesText =
            config?['topCategoriesText']?.toString() ?? 'TOP CATEGORIES';

        final List allCards = (config?['cards'] as List?) ?? [];
        final List row1Cards = allCards.isNotEmpty
            ? allCards.sublist(0, allCards.length >= 5 ? 5 : allCards.length)
            : _defaultRow1Cards;
        final List row2Cards = allCards.length > 5
            ? allCards.sublist(5, allCards.length >= 10 ? 10 : allCards.length)
            : (allCards.isEmpty ? _defaultRow2Cards : []);

        final theme = context.cxpTheme;

        return Padding(
          padding: EdgeInsets.symmetric(horizontal: theme.spacingMd),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: theme.surface,
              borderRadius: BorderRadius.circular(theme.cardRadius),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
                width: 1,
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
                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(5),
                              decoration: BoxDecoration(
                                color: theme.accent.withOpacity(0.14),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Text(
                                '👑',
                                style: TextStyle(fontSize: 18),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: robotoBold.copyWith(
                                      fontSize: 21,
                                      color: theme.textPrimary,
                                      letterSpacing: -0.4,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    subtitle,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: robotoRegular.copyWith(
                                      fontSize: 11.5,
                                      color: theme.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),

                      // TOP CATEGORIES pill button
                      InkWell(
                        onTap: () => Get.toNamed(RouteHelper.getCategoryRoute()),
                        borderRadius: BorderRadius.circular(theme.buttonRadius),
                        child: Container(
                          padding:
                              const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: theme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(theme.buttonRadius),
                            border: Border.all(
                                color: theme.primary.withOpacity(0.25), width: 1.2),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                topCategoriesText,
                                style: robotoBold.copyWith(
                                  color: theme.primary,
                                  fontSize: 10.5,
                                  letterSpacing: 0.3,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                Icons.arrow_forward_rounded,
                                size: 13,
                                color: theme.primary,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // 10 Featured Squircle Category Cards (2 Rows of 5 Cards)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Row 1
                      Row(
                        children: [
                          for (int i = 0; i < row1Cards.length; i++) ...[
                            if (i > 0) const SizedBox(width: 8),
                            _buildFeaturedCard(context, row1Cards[i]),
                          ],
                        ],
                      ),

                      if (row2Cards.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        // Row 2
                        Row(
                          children: [
                            for (int i = 0; i < row2Cards.length; i++) ...[
                              if (i > 0) const SizedBox(width: 8),
                              _buildFeaturedCard(context, row2Cards[i]),
                            ],
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFeaturedCard(BuildContext context, dynamic cardData, {double width = 86}) {
    final Map card = cardData is Map ? cardData : {};
    final dynamic image = card['image'] ?? 'assets/image/featGrocery.png';
    final String keyword = card['searchKeyword']?.toString() ??
        card['name']?.toString() ??
        'Grocery';
    final theme = context.cxpTheme;

    return InkWell(
      onTap: () => Get.toNamed(RouteHelper.getSearchRoute(queryText: keyword)),
      borderRadius: BorderRadius.circular(theme.cardRadius),
      child: Container(
        width: width,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(theme.cardRadius),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(theme.cardRadius - 1),
          child: AspectRatio(
            aspectRatio: 174 / 176,
            child: _buildSafeImage(
              image,
              fit: BoxFit.fill,
              errorWidget: Container(
                color: const Color(0xFFF1F5F9),
                child: const Center(
                  child: Icon(Icons.category_outlined, color: Colors.grey, size: 28),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
