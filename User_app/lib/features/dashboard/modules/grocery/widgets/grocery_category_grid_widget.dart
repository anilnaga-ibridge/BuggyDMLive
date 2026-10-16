import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:sixam_mart/api/api_client.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/helper/grocery_config_cache.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_section_shimmer.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryCategoryGridController extends GetxController {
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
    config = GroceryConfigCache.load('category_grids');
    fetchDynamicConfig();
  }

  Future<void> fetchDynamicConfig() async {
    try {
      // 1. First priority: Use ApiClient
      if (Get.isRegistered<ApiClient>()) {
        try {
          final res = await Get.find<ApiClient>().getData('/api/v1/grocery/category-grids');
          if (res.statusCode == 200 && res.body != null) {
            final dynamic body = res.body;
            final dynamic rawData = (body is Map) ? body['data'] : _parseConfig(body)?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              config = parsed;
              GroceryConfigCache.save('category_grids', parsed);
              update();
              if (kDebugMode) {
                print('[CategoryGrids] Loaded from ApiClient successfully');
              }
              return;
            }
          }
        } catch (e) {
          if (kDebugMode) {
            print('[CategoryGrids] ApiClient fetch error: $e');
          }
        }
      }

      // 2. Direct HTTP fallbacks
      final host = (GetPlatform.isWeb && Uri.base.host.isNotEmpty)
          ? Uri.base.host
          : '127.0.0.1';
      final endpoints = [
        'http://$host:3000/BuggyDm/api/grocery/category-grids',
        'http://localhost:3000/BuggyDm/api/grocery/category-grids',
        'http://127.0.0.1:3000/BuggyDm/api/grocery/category-grids',
        '${AppConstants.baseUrl}/api/v1/grocery/category-grids',
        'http://127.0.0.1:8000/api/v1/grocery/category-grids',
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
              GroceryConfigCache.save('category_grids', parsed);
              update();
              if (kDebugMode) {
                print('[CategoryGrids] Loaded from endpoint $endpoint');
              }
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
      errorBuilder: (context, error, stackTrace) => defaultError,
    );
  }

  return Image.asset(
    resolved,
    width: width,
    height: height,
    fit: fit,
    cacheWidth: 500,
    filterQuality: FilterQuality.medium,
    errorBuilder: (context, error, stackTrace) => defaultError,
  );
}

class GroceryCategoryGridWidget extends StatelessWidget {
  const GroceryCategoryGridWidget({super.key});

  static const List<Map<String, dynamic>> _defaultRow1 = [
    {
      'title': 'Fruits & Vegetables',
      'image': 'assets/image/gkFruitsVeg.png',
      'searchKeyword': 'Fruits and Vegetables',
    },
    {
      'title': 'Dairy, Bread & Eggs',
      'image': 'assets/image/gkDairyBread.png',
      'searchKeyword': 'Dairy Bread and Eggs',
    },
    {
      'title': 'Atta, Rice & Dals',
      'image': 'assets/image/gkAttaRice.png',
      'searchKeyword': 'Atta Rice Oil Dals',
    },
    {
      'title': 'Meat, Fish & Eggs',
      'image': 'assets/image/gkMeatFish.png',
      'searchKeyword': 'Meat Fish and Eggs',
    },
  ];

  static const List<Map<String, dynamic>> _defaultRow2 = [
    {
      'title': 'Masala & Dry Fruits',
      'image': 'assets/image/gkMasalaDryFruits.png',
      'searchKeyword': 'Masala Dry Fruits',
    },
    {
      'title': 'Breakfast & Sauces',
      'image': 'assets/image/gkBreakfastSauces.png',
      'searchKeyword': 'Breakfast Sauces',
    },
    {
      'title': 'Packaged Food',
      'image': 'assets/image/gkPackagedFood.png',
      'searchKeyword': 'Packaged Food',
    },
    {
      'title': 'Cooking Essentials',
      'image': 'assets/image/gkCookingEssentials.png',
      'searchKeyword': 'Cooking Essentials',
    },
  ];

  static const List<Map<String, dynamic>> _defaultShowcaseBanners = [
    {
      'title': 'Cafe Specials',
      'image': 'assets/image/sdBannerCafe.png',
      'searchKeyword': 'Cafe Specials',
    },
    {
      'title': 'Ice Creams & More',
      'image': 'assets/image/sdBannerIceCreams.png',
      'searchKeyword': 'Ice Creams and Desserts',
    },
  ];

  static const List<Map<String, dynamic>> _defaultBottomCards = [
    {
      'title': 'Tea & Coffee',
      'image': 'assets/image/sdTeaCoffee.png',
      'searchKeyword': 'Tea and Coffee',
    },
    {
      'title': 'Frozen Food',
      'image': 'assets/image/sdFrozenFood.png',
      'searchKeyword': 'Frozen Food',
    },
    {
      'title': 'Sweet Cravings',
      'image': 'assets/image/sdSweetCravings.png',
      'searchKeyword': 'Sweet Cravings Chocolates',
    },
    {
      'title': 'Cold Drinks & Juices',
      'image': 'assets/image/sdColdDrinks.png',
      'searchKeyword': 'Cold Drinks and Juices',
    },
    {
      'title': 'Munchies',
      'image': 'assets/image/sdMunchies.png',
      'searchKeyword': 'Munchies Chips Snacks',
    },
    {
      'title': 'Biscuits & Cookies',
      'image': 'assets/image/sdBiscuitsCookies.png',
      'searchKeyword': 'Biscuits and Cookies',
    },
  ];

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryCategoryGridController>()) {
      Get.put(GroceryCategoryGridController());
    }

    return GetBuilder<GroceryCategoryGridController>(
      builder: (controller) {
        final cfg = controller.config;

        if (cfg == null) {
          return const GrocerySectionShimmer(height: 380);
        }

        final theme = context.cxpTheme;

        final gk = (cfg['groceryKitchen'] is Map)
            ? Map<String, dynamic>.from(cfg['groceryKitchen'])
            : null;
        final sd = (cfg?['snacksDrinks'] is Map)
            ? Map<String, dynamic>.from(cfg!['snacksDrinks'])
            : null;

        final gkEnabled = gk?['enabled'] ?? true;
        final sdEnabled = sd?['enabled'] ?? true;

        if (!gkEnabled && !sdEnabled) {
          return const SizedBox.shrink();
        }

        // Grocery Kitchen Data
        final gkTitle = (gk?['title'] as String?)?.isNotEmpty == true
            ? gk!['title']
            : 'Grocery & Kitchen';
        final gkSubtitle = (gk?['subtitle'] as String?)?.isNotEmpty == true
            ? gk!['subtitle']
            : 'Fresh essentials for your daily needs';
        final gkBackToTop = (gk?['backToTopText'] as String?)?.isNotEmpty == true
            ? gk!['backToTopText']
            : 'Back to top';

        final heroBannerData = (gk?['heroBanner'] is Map)
            ? Map<String, dynamic>.from(gk!['heroBanner'])
            : null;
        final heroEnabled = heroBannerData?['enabled'] ?? true;
        final heroImage = (heroBannerData?['image'] as String?)?.isNotEmpty == true
            ? heroBannerData!['image']
            : 'assets/image/gkHeroBanner.png';
        final heroSearchKeyword = (heroBannerData?['searchKeyword'] as String?)?.isNotEmpty == true
            ? heroBannerData!['searchKeyword']
            : 'Farm Fresh Fruits and Vegetables';

        final List rawRow1 = (gk?['row1Cards'] is List && (gk!['row1Cards'] as List).isNotEmpty)
            ? gk['row1Cards']
            : _defaultRow1;
        final row1Cards = rawRow1
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();

        final List rawRow2 = (gk?['row2Cards'] is List && (gk!['row2Cards'] as List).isNotEmpty)
            ? gk['row2Cards']
            : _defaultRow2;
        final row2Cards = rawRow2
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();

        // Snacks Drinks Data
        final sdTitle1 = (sd?['title1'] as String?)?.isNotEmpty == true
            ? sd!['title1']
            : 'Snacks ';
        final sdTitle2 = (sd?['title2'] as String?)?.isNotEmpty == true
            ? sd!['title2']
            : '& Drinks';
        final sdSubtitle = (sd?['subtitle'] as String?)?.isNotEmpty == true
            ? sd!['subtitle']
            : 'Tasty treats for every moment';
        final sdViewAllText = (sd?['viewAllText'] as String?)?.isNotEmpty == true
            ? sd!['viewAllText']
            : 'View All';
        final sdViewAllKeyword = (sd?['viewAllKeyword'] as String?)?.isNotEmpty == true
            ? sd!['viewAllKeyword']
            : 'Snacks and Drinks';

        final List rawBanners = (sd?['banners'] is List && (sd!['banners'] as List).isNotEmpty)
            ? sd['banners']
            : _defaultShowcaseBanners;
        final banners = rawBanners
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();

        final List rawBottom = (sd?['bottomCards'] is List && (sd!['bottomCards'] as List).isNotEmpty)
            ? sd['bottomCards']
            : _defaultBottomCards;
        final bottomCards = rawBottom
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =====================================================================
            // 1. SECTION: GROCERY & KITCHEN
            // =====================================================================
            if (gkEnabled) ...[
              Padding(
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
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: theme.accent.withOpacity(0.14),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(
                                      Icons.eco_rounded,
                                      color: theme.accent,
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          gkTitle,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: robotoBold.copyWith(
                                            fontSize: 20,
                                            color: theme.textPrimary,
                                            letterSpacing: -0.4,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          gkSubtitle,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: robotoRegular.copyWith(
                                            fontSize: 11,
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

                            // Back to top pill button
                            InkWell(
                              onTap: () {
                                PrimaryScrollController.maybeOf(context)?.animateTo(
                                  0,
                                  duration: const Duration(milliseconds: 500),
                                  curve: Curves.easeOut,
                                );
                              },
                              borderRadius: BorderRadius.circular(theme.buttonRadius),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: theme.primary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(theme.buttonRadius),
                                  border: Border.all(color: theme.primary.withOpacity(0.25), width: 1.2),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      gkBackToTop,
                                      style: robotoMedium.copyWith(
                                        color: theme.primary,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Icon(
                                      Icons.arrow_upward_rounded,
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

                      const SizedBox(height: 12),

                      // Farm Fresh Hero Banner
                      if (heroEnabled) ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: InkWell(
                            onTap: () => Get.toNamed(RouteHelper.getSearchRoute(queryText: heroSearchKeyword)),
                            borderRadius: BorderRadius.circular(theme.cardRadius),
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(theme.cardRadius),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.06),
                                    blurRadius: 12,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(theme.cardRadius),
                                child: AspectRatio(
                                  aspectRatio: 662 / 206,
                                  child: _buildSafeImage(
                                    heroImage,
                                    fit: BoxFit.fill,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],

                      // Grocery Cards Row 1 (Fruits & Veg, Dairy/Bread, Atta/Rice, Meat/Fish)
                      if (row1Cards.isNotEmpty) ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Row(
                            children: [
                              for (int i = 0; i < row1Cards.length; i++) ...[
                                if (i > 0) const SizedBox(width: 8),
                                Flexible(
                                  child: _buildSquircleCard(
                                    context: context,
                                    imagePath: row1Cards[i]['image'] ?? '',
                                    title: row1Cards[i]['title'] ?? '',
                                    onTap: () => Get.toNamed(
                                      RouteHelper.getSearchRoute(
                                        queryText: row1Cards[i]['searchKeyword'] ?? row1Cards[i]['title'] ?? '',
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],

                      // Grocery Cards Row 2 (Masala, Breakfast, Packaged Food, Cooking Essentials)
                      if (row2Cards.isNotEmpty) ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Row(
                            children: [
                              for (int i = 0; i < row2Cards.length; i++) ...[
                                if (i > 0) const SizedBox(width: 8),
                                Flexible(
                                  child: _buildSquircleCard(
                                    context: context,
                                    imagePath: row2Cards[i]['image'] ?? '',
                                    title: row2Cards[i]['title'] ?? '',
                                    onTap: () => Get.toNamed(
                                      RouteHelper.getSearchRoute(
                                        queryText: row2Cards[i]['searchKeyword'] ?? row2Cards[i]['title'] ?? '',
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Section Divider with Fork & Knife Icon
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 1,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.transparent,
                              Color(0xFFE2E8F0),
                              Color(0xFFCBD5E1),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Container(
                        padding: const EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: const Icon(
                          Icons.restaurant_rounded,
                          size: 14,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                    ),
                    Expanded(
                      child: Container(
                        height: 1,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Color(0xFFCBD5E1),
                              Color(0xFFE2E8F0),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),
            ],

            // =====================================================================
            // 2. SECTION: SNACKS & DRINKS
            // =====================================================================
            if (sdEnabled) ...[
              Padding(
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
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  RichText(
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    text: TextSpan(
                                      children: [
                                        TextSpan(
                                          text: sdTitle1,
                                          style: robotoBold.copyWith(
                                            fontSize: 21,
                                            color: theme.textPrimary,
                                            letterSpacing: -0.4,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                        TextSpan(
                                          text: sdTitle2,
                                          style: robotoBold.copyWith(
                                            fontSize: 21,
                                            color: theme.primary,
                                            letterSpacing: -0.4,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    sdSubtitle,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: robotoRegular.copyWith(
                                      fontSize: 11,
                                      color: theme.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),

                            // View All pill button
                            InkWell(
                              onTap: () => Get.toNamed(RouteHelper.getSearchRoute(queryText: sdViewAllKeyword)),
                              borderRadius: BorderRadius.circular(theme.buttonRadius),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: theme.primary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(theme.buttonRadius),
                                  border: Border.all(color: theme.primary.withOpacity(0.25), width: 1.2),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      sdViewAllText,
                                      style: robotoMedium.copyWith(
                                        color: theme.primary,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
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

                      const SizedBox(height: 12),

                      // 2 Side-by-Side Showcase Banners: Cafe Specials & Ice Creams & More
                      if (banners.isNotEmpty) ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Row(
                            children: [
                              for (int i = 0; i < banners.length && i < 2; i++) ...[
                                if (i > 0) const SizedBox(width: 10),
                                Expanded(
                                  child: InkWell(
                                    onTap: () => Get.toNamed(
                                      RouteHelper.getSearchRoute(
                                        queryText: banners[i]['searchKeyword'] ?? banners[i]['title'] ?? '',
                                      ),
                                    ),
                                    borderRadius: BorderRadius.circular(theme.cardRadius),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(theme.cardRadius),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(0.06),
                                            blurRadius: 10,
                                            offset: const Offset(0, 3),
                                          ),
                                        ],
                                      ),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(theme.cardRadius),
                                        child: AspectRatio(
                                          aspectRatio: 321 / 161,
                                          child: _buildSafeImage(
                                            banners[i]['image'] ?? '',
                                            fit: BoxFit.fill,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Snacks Bottom Category Cards (Horizontal smooth scroll)
                      if (bottomCards.isNotEmpty) ...[
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Row(
                            children: [
                              for (int i = 0; i < bottomCards.length; i++) ...[
                                if (i > 0) const SizedBox(width: 8),
                                _buildSnackSmallCard(
                                  context: context,
                                  imagePath: bottomCards[i]['image'] ?? '',
                                  title: bottomCards[i]['title'] ?? '',
                                  onTap: () => Get.toNamed(
                                    RouteHelper.getSearchRoute(
                                      queryText: bottomCards[i]['searchKeyword'] ?? bottomCards[i]['title'] ?? '',
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildSquircleCard({
    required BuildContext context,
    required String imagePath,
    required String title,
    required VoidCallback onTap,
  }) {
    final cxp = context.cxpTheme;
    final bool isCustomProduct = imagePath.contains('/storage/') ||
        imagePath.contains('/uploads/') ||
        imagePath.startsWith('http');

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(cxp.cardRadius),
      child: Container(
        decoration: BoxDecoration(
          color: cxp.surface,
          borderRadius: BorderRadius.circular(cxp.cardRadius),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(cxp.cardRadius),
          child: AspectRatio(
            aspectRatio: 161 / 156,
            child: isCustomProduct
                ? Column(
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(6),
                          child: _buildSafeImage(
                            imagePath,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 3),
                        color: cxp.surface,
                        child: Text(
                          title,
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: robotoMedium.copyWith(
                            fontSize: 10,
                            color: cxp.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  )
                : _buildSafeImage(
                    imagePath,
                    fit: BoxFit.fill,
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildSnackSmallCard({
    required BuildContext context,
    required String imagePath,
    required String title,
    required VoidCallback onTap,
  }) {
    final cxp = context.cxpTheme;
    final bool isCustomProduct = imagePath.contains('/storage/') ||
        imagePath.contains('/uploads/') ||
        imagePath.startsWith('http');

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(cxp.cardRadius),
      child: Container(
        width: 96,
        decoration: BoxDecoration(
          color: cxp.surface,
          borderRadius: BorderRadius.circular(cxp.cardRadius),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(cxp.cardRadius),
          child: AspectRatio(
            aspectRatio: 109 / 136,
            child: isCustomProduct
                ? Column(
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(6),
                          child: _buildSafeImage(
                            imagePath,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 3),
                        color: cxp.surface,
                        child: Text(
                          title,
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: robotoMedium.copyWith(
                            fontSize: 9.5,
                            color: cxp.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  )
                : _buildSafeImage(
                    imagePath,
                    fit: BoxFit.fill,
                  ),
          ),
        ),
      ),
    );
  }
}
