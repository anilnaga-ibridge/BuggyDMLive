import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:sixam_mart/api/api_client.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/features/cart/controllers/cart_controller.dart';
import 'package:sixam_mart/features/cart/domain/models/cart_model.dart';
import 'package:sixam_mart/features/checkout/domain/models/place_order_body_model.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_decoration_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/helper/grocery_config_cache.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_section_shimmer.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryCuratedProductGridController extends GetxController {
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
    config = GroceryConfigCache.load('curated_products');
    fetchDynamicConfig();
  }

  Future<void> fetchDynamicConfig() async {
    try {
      // 1. First priority: Use ApiClient
      if (Get.isRegistered<ApiClient>()) {
        try {
          final res = await Get.find<ApiClient>().getData(
            '/api/v1/grocery/curated-products',
          );
          if (res.statusCode == 200 && res.body != null) {
            final dynamic body = res.body;
            final dynamic rawData = (body is Map)
                ? body['data']
                : _parseConfig(body)?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              config = parsed;
              GroceryConfigCache.save('curated_products', parsed);
              update();
              if (kDebugMode) {
                print('[CuratedProducts] Loaded from ApiClient successfully');
              }
              return;
            }
          }
        } catch (e) {
          if (kDebugMode) {
            print('[CuratedProducts] ApiClient fetch error: $e');
          }
        }
      }

      // 2. Direct HTTP fallbacks
      final host = (GetPlatform.isWeb && Uri.base.host.isNotEmpty)
          ? Uri.base.host
          : '127.0.0.1';
      final endpoints = [
        'http://$host:3000/BuggyDm/api/grocery/curated-products',
        'http://localhost:3000/BuggyDm/api/grocery/curated-products',
        'http://127.0.0.1:3000/BuggyDm/api/grocery/curated-products',
        '${AppConstants.baseUrl}/api/v1/grocery/curated-products',
        'http://127.0.0.1:8000/api/v1/grocery/curated-products',
      ];
      for (final endpoint in endpoints) {
        try {
          final res = await http
              .get(Uri.parse(endpoint))
              .timeout(const Duration(seconds: 3));
          if (res.statusCode == 200) {
            final dynamic body = _parseConfig(res.body);
            final dynamic rawData = body?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              config = parsed;
              GroceryConfigCache.save('curated_products', parsed);
              update();
              if (kDebugMode) {
                print('[CuratedProducts] Loaded from endpoint $endpoint');
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
  final defaultError =
      errorWidget ??
      Container(
        width: width,
        height: height,
        color: const Color(0xFFF1F5F9),
        child: const Center(
          child: Icon(
            Icons.shopping_bag_outlined,
            color: Colors.grey,
            size: 24,
          ),
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
    cacheWidth: 400,
    filterQuality: FilterQuality.medium,
    errorBuilder: (context, error, stackTrace) => defaultError,
  );
}

class GroceryCuratedProductGridWidget extends StatefulWidget {
  const GroceryCuratedProductGridWidget({super.key});

  @override
  State<GroceryCuratedProductGridWidget> createState() =>
      _GroceryCuratedProductGridWidgetState();
}

class _GroceryCuratedProductGridWidgetState
    extends State<GroceryCuratedProductGridWidget> {
  // Local quantity tracking for responsive immediate user interaction
  final Map<int, int> _quantities = {};

  void _addItemToCart(int index, Map<String, dynamic> prod, int qty) async {
    if (!Get.isRegistered<CartController>()) return;
    final cartController = Get.find<CartController>();

    final String name = prod['name']?.toString() ?? '';
    final num priceNum = (prod['price'] is num)
        ? prod['price']
        : (num.tryParse(prod['price']?.toString() ?? '0') ?? 0);
    final double price = priceNum.toDouble();
    final int itemId = (prod['id'] is int)
        ? prod['id']
        : (int.tryParse(
                prod['id']?.toString().replaceAll(RegExp(r'[^0-9]'), '') ?? '',
              ) ??
              (5000 + index));

    final int cartIndex = cartController.cartList.indexWhere(
      (c) => c.item?.name == name || c.item?.id == itemId,
    );

    if (qty <= 0) {
      if (cartIndex != -1) {
        cartController.removeFromCart(cartIndex);
      }
      return;
    }

    if (cartIndex != -1) {
      final CartModel existingCart = cartController.cartList[cartIndex];
      final bool isIncrement = qty > (existingCart.quantity ?? 0);
      cartController.changeQuantity(
        isIncrement,
        cartIndex,
        existingCart.stock,
        existingCart.quantityLimit,
      );
      return;
    }

    final int activeStoreId = (prod['store_id'] is int)
        ? prod['store_id'] as int
        : (cartController.cartList.isNotEmpty
                  ? cartController.cartList.first.item?.storeId
                  : null) ??
              (prod['storeId'] is int ? prod['storeId'] as int : null) ??
              2;

    final OnlineCart onlineCart = OnlineCart(
      null,
      itemId,
      null,
      price.toString(),
      '',
      null,
      null,
      qty,
      [],
      [],
      [],
      'Item',
    );

    final bool success = await cartController.addToCartOnline(
      onlineCart,
      storeId: activeStoreId,
    );
    if (!success) {
      if (mounted) {
        setState(() {
          _quantities[index] = 0;
        });
      }
      showCustomSnackBar('something_went_wrong'.tr);
    }
  }

  static const List<Map<String, dynamic>> _defaultCuratedProducts = [
    {
      'name': 'Fresh Tomato',
      'unit': '1 kg',
      'price': 557,
      'originalPrice': 576,
      'image': 'assets/image/curated_tomato.png',
      'searchQuery': 'Fresh Tomato',
    },
    {
      'name': 'Aashirvaad Atta / Godihittu – Whole Wheat',
      'unit': '5 kg',
      'price': 306,
      'originalPrice': 318,
      'image': 'assets/image/curated_atta.png',
      'searchQuery': 'Aashirvaad Atta',
    },
    {
      'name': 'Fortune Sun Lite – Sunflower Refined Oil',
      'unit': '1 L',
      'price': 113,
      'originalPrice': 125,
      'image': 'assets/image/curated_oil.png',
      'searchQuery': 'Fortune Sun Lite Oil',
    },
    {
      'name': 'Britannia Good Day Butter Cookies',
      'unit': '300 g',
      'price': 67,
      'originalPrice': 103,
      'image': 'assets/image/curated_cookies.png',
      'searchQuery': 'Britannia Good Day',
    },
    {
      'name': 'India Gate Basmati Rice Mini Mogra',
      'unit': '1 kg',
      'price': 339,
      'originalPrice': 375,
      'image': 'assets/image/curated_rice.png',
      'searchQuery': 'India Gate Basmati Rice',
    },
    {
      'name': 'Beauty Essentials',
      'unit': '1 unit',
      'price': 199,
      'originalPrice': 211,
      'image': 'assets/image/curated_beauty.png',
      'searchQuery': 'Beauty Cosmetics',
    },
  ];

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryCuratedProductGridController>()) {
      Get.put(GroceryCuratedProductGridController());
    }

    return GetBuilder<GroceryCuratedProductGridController>(
      builder: (controller) {
        final cfg = controller.config;

        if (cfg == null) {
          return const GrocerySectionShimmer(height: 340);
        }

        final bool enabled = cfg['enabled'] ?? true;

        if (!enabled) {
          return const SizedBox.shrink();
        }

        final title = (cfg['title'] as String?)?.isNotEmpty == true
            ? cfg['title']
            : 'Curated for you';
        final subtitle = (cfg['subtitle'] as String?)?.isNotEmpty == true
            ? cfg['subtitle']
            : 'Handpicked products just for you';
        final viewAllText = (cfg['viewAllText'] as String?)?.isNotEmpty == true
            ? cfg['viewAllText']
            : 'View All';
        final viewAllQuery =
            (cfg['viewAllQuery'] as String?)?.isNotEmpty == true
            ? cfg['viewAllQuery']
            : 'Curated';

        final List rawProducts =
            (cfg['products'] is List && (cfg['products'] as List).isNotEmpty)
            ? cfg['products']
            : _defaultCuratedProducts;
        final products = rawProducts
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();

        final theme = context.cxpTheme;

        return Padding(
          padding: EdgeInsets.symmetric(horizontal: theme.spacingMd),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: theme.surface,
              borderRadius: BorderRadius.circular(theme.cardRadius),
              border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ---------------------------------------------------------------------
                // Header: Crown icon + "Curated for you" + "View All >"
                // ---------------------------------------------------------------------
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
                                color: theme.accent.withValues(alpha: 0.14),
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

                      // View All > Pill Button
                      InkWell(
                        onTap: () => Get.toNamed(
                          RouteHelper.getSearchRoute(queryText: viewAllQuery),
                        ),
                        borderRadius: BorderRadius.circular(theme.buttonRadius),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 11,
                            vertical: 5.5,
                          ),
                          decoration: BoxDecoration(
                            color: theme.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(
                              theme.buttonRadius,
                            ),
                            border: Border.all(
                              color: theme.primary.withValues(alpha: 0.25),
                              width: 1.2,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                viewAllText,
                                style: robotoBold.copyWith(
                                  color: theme.primary,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                Icons.arrow_forward_ios_rounded,
                                size: 11,
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

                // ---------------------------------------------------------------------
                // 3-Column Product Grid
                // ---------------------------------------------------------------------
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Column(
                    children: [
                      for (int r = 0; r < products.length; r += 3) ...[
                        if (r > 0) const SizedBox(height: 10),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            for (int c = 0; c < 3; c++) ...[
                              if (c > 0) const SizedBox(width: 8),
                              Expanded(
                                child: (r + c < products.length)
                                    ? _buildProductCard(context, r + c, products[r + c])
                                    : const SizedBox.shrink(),
                              ),
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

  Widget _buildProductCard(
    BuildContext context,
    int index,
    Map<String, dynamic> prod,
  ) {
    final String name = prod['name']?.toString() ?? '';
    int qty = _quantities[index] ?? 0;
    if (Get.isRegistered<CartController>()) {
      final cartItem = Get.find<CartController>().cartList.firstWhereOrNull(
        (c) => c.item?.name == name,
      );
      if (cartItem != null && (cartItem.quantity ?? 0) > 0) {
        qty = cartItem.quantity!;
        _quantities[index] = qty;
      }
    }
    final String unit = prod['unit']?.toString() ?? '';
    final num price = (prod['price'] is num)
        ? prod['price']
        : (num.tryParse(prod['price']?.toString() ?? '0') ?? 0);
    final num origPrice = (prod['originalPrice'] is num)
        ? prod['originalPrice']
        : (num.tryParse(prod['originalPrice']?.toString() ?? '0') ?? price);
    final String image = prod['image']?.toString() ?? '';
    final String searchQuery =
        (prod['searchQuery']?.toString().isNotEmpty == true)
        ? prod['searchQuery'].toString()
        : name;

    final cxp = context.cxpTheme;

    final card = Container(
      decoration: BoxDecoration(
        color: cxp.surface,
        borderRadius: BorderRadius.circular(cxp.cardRadius),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.035),
            blurRadius: 8,
            offset: const Offset(0, 2.5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Top Section: Image Tile with Aspect Ratio
          InkWell(
            onTap: () =>
                Get.toNamed(RouteHelper.getSearchRoute(queryText: searchQuery)),
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(cxp.cardRadius),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(cxp.cardRadius),
              ),
              child: AspectRatio(
                aspectRatio: 238 / 235,
                child: Container(
                  color: const Color(0xFFF8FAFC),
                  padding: const EdgeInsets.all(4),
                  child: _buildSafeImage(image, fit: BoxFit.contain),
                ),
              ),
            ),
          ),

          // Details Section
          Padding(
            padding: const EdgeInsets.fromLTRB(6, 4, 6, 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Product Name (2 Lines Max)
                SizedBox(
                  height: 28,
                  child: Text(
                    name,
                    style: robotoBold.copyWith(
                      fontSize: 10.5,
                      color: cxp.textPrimary,
                      height: 1.15,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),

                const SizedBox(height: 2),

                // Unit / Pack size
                Text(
                  unit,
                  style: robotoRegular.copyWith(
                    fontSize: 9.5,
                    color: cxp.textSecondary,
                  ),
                ),

                const SizedBox(height: 3),

                // Price Row
                Row(
                  children: [
                    Text(
                      '₹ $price',
                      style: robotoBold.copyWith(
                        fontSize: 12,
                        color: const Color(0xFF15803D),
                      ),
                    ),
                    if (origPrice > price) ...[
                      const SizedBox(width: 4),
                      Text(
                        '₹$origPrice',
                        style: robotoRegular.copyWith(
                          fontSize: 9.5,
                          color: const Color(0xFF94A3B8),
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                    ],
                  ],
                ),

                const SizedBox(height: 6),

                // Action Control: full-width ADD button toggling to Stepper
                qty > 0
                    ? Container(
                        height: 26,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(cxp.buttonRadius),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            InkWell(
                              onTap: () {
                                if (qty > 1) {
                                  setState(() => _quantities[index] = qty - 1);
                                  _addItemToCart(index, prod, qty - 1);
                                } else {
                                  setState(() => _quantities.remove(index));
                                  _addItemToCart(index, prod, 0);
                                }
                              },
                              borderRadius: const BorderRadius.horizontal(
                                left: Radius.circular(8),
                              ),
                              child: const Padding(
                                padding: EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                child: Text(
                                  '−',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            Text(
                              '$qty',
                              style: robotoBold.copyWith(
                                fontSize: 11,
                                color: cxp.textPrimary,
                              ),
                            ),
                            InkWell(
                              onTap: () {
                                setState(() => _quantities[index] = qty + 1);
                                _addItemToCart(index, prod, qty + 1);
                              },
                              borderRadius: const BorderRadius.horizontal(
                                right: Radius.circular(8),
                              ),
                              child: const Padding(
                                padding: EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                child: Text(
                                  '+',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    : InkWell(
                        onTap: () {
                          setState(() => _quantities[index] = 1);
                          _addItemToCart(index, prod, 1);
                          showCustomSnackBar(
                            '$name added to cart',
                            isError: false,
                          );
                        },
                        borderRadius: BorderRadius.circular(cxp.buttonRadius),
                        child: Container(
                          height: 26,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                cxp.primary.withValues(alpha: 0.85),
                                cxp.primary,
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(
                              cxp.buttonRadius,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: cxp.primary.withValues(alpha: 0.25),
                                blurRadius: 4,
                                offset: const Offset(0, 1.5),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.shopping_cart_outlined,
                                size: 11,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'ADD',
                                style: robotoBold.copyWith(
                                  fontSize: 10,
                                  color: Colors.white,
                                  letterSpacing: 0.3,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
              ],
            ),
          ),
        ],
      ),
    );

    final cardDecs = cxp.getProductCardDecorations();
    if (cardDecs.isEmpty) {
      return RepaintBoundary(child: card);
    }

    return RepaintBoundary(
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          card,
          ...cardDecs.where((d) => d.mobile).map((d) {
            final isLeft = d.positionX.toLowerCase() == 'left';
            final isBottom = d.positionY.toLowerCase() == 'bottom';
            return Positioned(
              left: isLeft ? 4 : null,
              right: !isLeft ? 4 : null,
              top: !isBottom ? 4 : null,
              bottom: isBottom ? 4 : null,
              child: CxpDecorationWidget(decoration: d),
            );
          }),
        ],
      ),
    );
  }
}
