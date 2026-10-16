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

class GroceryStealDealsController extends GetxController {
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
    config = GroceryConfigCache.load('steal_deals');
    fetchDynamicConfig();
  }

  Future<void> fetchDynamicConfig() async {
    try {
      // 1. First priority: Use ApiClient which handles base URL and web proxy/headers
      if (Get.isRegistered<ApiClient>()) {
        try {
          final res = await Get.find<ApiClient>().getData('/api/v1/grocery/steal-deals');
          if (res.statusCode == 200 && res.body != null) {
            final dynamic body = res.body;
            final dynamic rawData = (body is Map) ? body['data'] : _parseConfig(body)?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              config = parsed;
              GroceryConfigCache.save('steal_deals', parsed);
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
        'http://$host:3000/BuggyDm/api/grocery/steal-deals',
        'http://localhost:3000/BuggyDm/api/grocery/steal-deals',
        'http://127.0.0.1:3000/BuggyDm/api/grocery/steal-deals',
        '${AppConstants.baseUrl}/api/v1/grocery/steal-deals',
        'http://127.0.0.1:8000/api/v1/grocery/steal-deals',
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
              GroceryConfigCache.save('steal_deals', parsed);
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

class GroceryStealDealsShelfWidget extends StatefulWidget {
  const GroceryStealDealsShelfWidget({super.key});

  @override
  State<GroceryStealDealsShelfWidget> createState() => _GroceryStealDealsShelfWidgetState();
}

class _GroceryStealDealsShelfWidgetState extends State<GroceryStealDealsShelfWidget> {
  int _selectedStoreIndex = 0;
  int _selectedCategoryIndex = 0;

  static const List<Map<String, dynamic>> _defaultStoreTabs = [
    {
      'isTrending': true,
      'title': 'Trending',
      'icon': 'assets/image/steal_hot_deal.png',
    },
    {
      'isTrending': false,
      'price': '₹9',
      'label': 'Store',
      'icon': 'assets/image/steal_tab_gift.png',
    },
    {
      'isTrending': false,
      'price': '₹19',
      'label': 'Store',
      'icon': 'assets/image/steal_tab_basket.png',
    },
    {
      'isTrending': false,
      'price': '₹29',
      'label': 'Store',
      'icon': 'assets/image/steal_tab_bag.png',
    },
  ];

  static const List<Map<String, dynamic>> _defaultCategories = [
    {
      'name': 'ALL',
      'isAll': true,
    },
    {
      'name': 'Cold Drinks & Juices',
      'isAll': false,
      'icon': 'assets/image/steal_cat_drinks_new.png',
    },
    {
      'name': 'Skincare',
      'isAll': false,
      'icon': 'assets/image/steal_cat_skincare_new.png',
    },
    {
      'name': 'Masala & Dry Fruits',
      'isAll': false,
      'icon': 'assets/image/steal_cat_dryfruit_new.png',
    },
    {
      'name': 'Snacks',
      'isAll': false,
      'icon': 'assets/image/steal_cat_snack_new.png',
    },
  ];

  static const List<Map<String, dynamic>> _defaultRow1Products = [
    {
      'title': 'Aaha Tiramisu | Rich Coffee Dessert',
      'unit': '80 g',
      'price': '₹59',
      'mrp': '₹150',
      'discount': '₹91 OFF',
      'image': 'assets/image/steal_tiramisu.png',
    },
    {
      'title': 'Sunfeast Dark Fantasy Choco Fills',
      'unit': '1 pack (237 g)',
      'price': '₹39',
      'mrp': '₹98',
      'discount': '₹59 OFF',
      'image': 'assets/image/steal_dark_fantasy.png',
    },
    {
      'title': 'MOM – Makhana Chikki Bar',
      'unit': '1 pack (17 g)',
      'price': '₹9',
      'mrp': '₹20',
      'discount': '₹11 OFF',
      'image': 'assets/image/steal_makhana.png',
    },
  ];

  static const List<Map<String, dynamic>> _defaultRow2Products = [
    {
      'title': 'Lakme Absolute Glow Toner',
      'unit': '100 ml',
      'price': '₹199',
      'mrp': '₹345',
      'discount': '₹146 OFF',
      'image': 'assets/image/steal_lakme.png',
    },
    {
      'title': 'Rage Whey Protein Banana Flavour',
      'unit': '400 g',
      'price': '₹229',
      'mrp': '₹369',
      'discount': '₹140 OFF',
      'image': 'assets/image/steal_rage.png',
    },
    {
      'title': 'St.Botanica Brightening Face Wash',
      'unit': '100 ml',
      'price': '₹149',
      'mrp': '₹299',
      'discount': '₹150 OFF',
      'image': 'assets/image/steal_botanica.png',
    },
  ];

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryStealDealsController>()) {
      Get.put(GroceryStealDealsController());
    }

    return GetBuilder<GroceryStealDealsController>(
      builder: (controller) {
        final config = controller.config;

        if (config == null) {
          return const GrocerySectionShimmer(height: 320);
        }

        if (config['enabled'] == false) {
          return const SizedBox.shrink();
        }

        final String title = config['title']?.toString() ?? 'Steal Deals';
        final String subtitle = config['subtitle']?.toString() ?? 'Add Any 10 Items';
        final String viewAllText = config['viewAllLinkText']?.toString() ?? 'View All';
        final dynamic lightningIcon = config['lightningIcon'] ?? 'assets/image/steal_lightning.png';

        final List storeTabs = (config['storeTabs'] as List?) ?? _defaultStoreTabs;
        final List categories = (config['categories'] as List?) ?? _defaultCategories;
        final List row1Products = (config['row1Products'] as List?) ?? _defaultRow1Products;
        final List row2Products = (config['row2Products'] as List?) ?? _defaultRow2Products;

        final theme = context.cxpTheme;

        return Padding(
          padding: EdgeInsets.symmetric(horizontal: theme.spacingMd),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
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
                // 1. Header with Lightning Bolt and "View All >"
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      _buildSafeImage(
                        lightningIcon,
                        height: 32,
                        width: 26,
                        fit: BoxFit.contain,
                        errorWidget: Icon(
                          Icons.bolt_rounded,
                          color: theme.primary,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: robotoBold.copyWith(
                                fontSize: 21,
                                color: theme.textPrimary,
                                letterSpacing: -0.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 1),
                            Text(
                              subtitle,
                              style: robotoMedium.copyWith(
                                fontSize: 12.5,
                                color: theme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      InkWell(
                        onTap: () {
                          Get.toNamed(RouteHelper.getSearchRoute(queryText: title));
                        },
                        borderRadius: BorderRadius.circular(theme.buttonRadius),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: theme.primary.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(theme.buttonRadius),
                            border: Border.all(color: theme.primary.withOpacity(0.24), width: 1),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                viewAllText,
                                style: robotoBold.copyWith(
                                  fontSize: 12.5,
                                  color: theme.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 2),
                              Icon(
                                Icons.chevron_right_rounded,
                                size: 16,
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

                // 2. Store Tabs (Trending / ₹9 Store / ₹19 Store / ₹29 Store)
                SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: [
                      for (int index = 0; index < storeTabs.length; index++) ...[
                        if (index > 0) const SizedBox(width: 10),
                        _buildStoreTab(storeTabs[index], index),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // 3. Category Filter Chips (ALL, Cold Drinks, Skincare, Masala, Snacks)
                SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: [
                      for (int index = 0; index < categories.length; index++) ...[
                        if (index > 0) const SizedBox(width: 8),
                        _buildCategoryChip(categories[index], index),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // 4. Products Row 1 (Exact 3-Column Grid)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (int i = 0; i < row1Products.length; i++) ...[
                        if (i > 0) const SizedBox(width: 8),
                        Expanded(
                          child: _StealProductCard(product: row1Products[i]),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 10),

                // 5. Products Row 2 (Exact 3-Column Grid)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (int i = 0; i < row2Products.length; i++) ...[
                        if (i > 0) const SizedBox(width: 8),
                        Expanded(
                          child: _StealProductCard(product: row2Products[i]),
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

  Widget _buildStoreTab(dynamic tabData, int index) {
    final Map tab = tabData is Map ? tabData : {};
    final bool isTrending = tab['isTrending'] == true;
    final bool isSelected = _selectedStoreIndex == index;
    final theme = context.cxpTheme;

    if (isTrending) {
      final String tabTitle = tab['title']?.toString() ?? 'Trending';
      final dynamic tabIcon = tab['icon'] ?? 'assets/image/steal_hot_deal.png';

      return InkWell(
        onTap: () {
          setState(() => _selectedStoreIndex = index);
        },
        borderRadius: BorderRadius.circular(theme.cardRadius),
        child: Container(
          width: 108,
          height: 66,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [theme.secondary, theme.primary],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(theme.cardRadius),
            boxShadow: [
              BoxShadow(
                color: theme.secondary.withOpacity(0.28),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildSafeImage(
                    tabIcon,
                    height: 20,
                    width: 20,
                    fit: BoxFit.contain,
                    errorWidget: const Icon(
                      Icons.local_fire_department_rounded,
                      color: Color(0xFFFDE047),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    tabTitle,
                    style: robotoBold.copyWith(
                      fontSize: 12.5,
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Container(
                width: 22,
                height: 3,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final String price = tab['price']?.toString() ?? '';
    final String label = tab['label']?.toString() ?? 'Store';
    final dynamic icon = tab['icon'];

    return InkWell(
      onTap: () {
        setState(() => _selectedStoreIndex = index);
      },
      borderRadius: BorderRadius.circular(theme.cardRadius),
      child: Container(
        width: 100,
        height: 66,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? theme.primary.withOpacity(0.12) : theme.surfaceElevated,
          borderRadius: BorderRadius.circular(theme.cardRadius),
          border: Border.all(
            color: isSelected ? theme.primary : theme.textSecondary.withValues(alpha: 0.15),
            width: isSelected ? 1.6 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  price,
                  style: robotoBold.copyWith(
                    fontSize: 16,
                    color: isSelected ? theme.primary : theme.textPrimary,
                    fontWeight: FontWeight.w800,
                    height: 1.1,
                  ),
                ),
                Text(
                  label,
                  style: robotoMedium.copyWith(
                    fontSize: 11,
                    color: theme.textSecondary,
                  ),
                ),
              ],
            ),
            if (icon != null && icon.toString().isNotEmpty)
              _buildSafeImage(
                icon,
                height: 36,
                width: 36,
                fit: BoxFit.contain,
                errorWidget: const SizedBox(width: 32),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChip(dynamic catData, int index) {
    final Map cat = catData is Map ? catData : {};
    final bool isSelected = _selectedCategoryIndex == index;
    final bool isAll = cat['isAll'] == true;
    final String name = cat['name']?.toString() ?? '';
    final dynamic icon = cat['icon'];
    final theme = context.cxpTheme;

    return InkWell(
      onTap: () {
        setState(() => _selectedCategoryIndex = index);
      },
      borderRadius: BorderRadius.circular(theme.radiusSm),
      child: Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? theme.primary.withOpacity(0.12) : theme.surfaceElevated,
          borderRadius: BorderRadius.circular(theme.radiusSm),
          border: Border.all(
            color: isSelected ? theme.primary : theme.textSecondary.withValues(alpha: 0.15),
            width: isSelected ? 1.4 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isAll) ...[
              Icon(
                Icons.grid_view_rounded,
                size: 16,
                color: theme.primary,
              ),
              const SizedBox(width: 6),
            ] else if (icon != null && icon.toString().isNotEmpty) ...[
              _buildSafeImage(
                icon,
                height: 20,
                width: 20,
                fit: BoxFit.contain,
                errorWidget: const SizedBox(width: 4),
              ),
              const SizedBox(width: 6),
            ],
            Text(
              name,
              style: isSelected
                  ? robotoBold.copyWith(
                      fontSize: 12,
                      color: const Color(0xFFE11D48),
                      fontWeight: FontWeight.w700,
                    )
                  : robotoMedium.copyWith(
                      fontSize: 12,
                      color: const Color(0xFF1E293B),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StealProductCard extends StatelessWidget {
  final dynamic product;

  const _StealProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    final Map prod = product is Map ? product : {};
    final String title = prod['title']?.toString() ?? '';
    final String unit = prod['unit']?.toString() ?? '';
    final String price = prod['price']?.toString() ?? '';
    final String mrp = prod['mrp']?.toString() ?? '';
    final String discount = prod['discount']?.toString() ?? '';
    final dynamic image = prod['image'];
    final dynamic id = prod['id'];

    return RepaintBoundary(
      child: InkWell(
        onTap: () {
        if (id != null && id.toString().isNotEmpty && id != 'null') {
          final int? itemId = int.tryParse(id.toString());
          if (itemId != null && itemId > 0) {
            Get.toNamed(RouteHelper.getItemDetailsRoute(
              itemId,
              false,
              title,
              slug: prod['slug']?.toString() ?? '',
            ));
            return;
          }
        }
        Get.toNamed(RouteHelper.getSearchRoute(queryText: title));
      },
      borderRadius: BorderRadius.circular(context.cxpTheme.cardRadius),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: context.cxpTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(context.cxpTheme.cardRadius),
          border: Border.all(color: context.cxpTheme.textSecondary.withValues(alpha: 0.15), width: 1.2),
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
            // Top Image Area (Product Image)
            ClipRRect(
              borderRadius: BorderRadius.circular(context.cxpTheme.cardRadius - 6),
              child: AspectRatio(
                aspectRatio: 1.22,
                child: _buildSafeImage(
                  image,
                  fit: BoxFit.cover,
                  errorWidget: Container(
                    color: const Color(0xFFF1F5F9),
                    child: const Center(
                      child: Icon(Icons.shopping_bag_outlined, color: Colors.grey, size: 36),
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 6),

            // Price & MRP
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: context.cxpTheme.primary,
                    borderRadius: BorderRadius.circular(context.cxpTheme.radiusSm),
                  ),
                  child: Text(
                    price,
                    style: robotoBold.copyWith(
                      fontSize: 11,
                      color: Colors.white,
                      height: 1.1,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  mrp,
                  style: robotoRegular.copyWith(
                    fontSize: 11,
                    color: const Color(0xFF94A3B8),
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 2),

            // Discount Tag (e.g. ₹91 OFF)
            Text(
              discount,
              style: robotoBold.copyWith(
                fontSize: 11,
                color: const Color(0xFF00875A),
                fontWeight: FontWeight.w800,
              ),
            ),

            const SizedBox(height: 2),

            // Product Title
            SizedBox(
              height: 28,
              child: Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: robotoMedium.copyWith(
                  fontSize: 10,
                  height: 1.2,
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),

            const SizedBox(height: 1),

            // Pack / Unit Size
            Text(
              unit,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: robotoRegular.copyWith(
                fontSize: 9.5,
                color: const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }
}
