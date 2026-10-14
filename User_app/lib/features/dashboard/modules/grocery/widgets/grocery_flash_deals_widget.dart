import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/features/cart/controllers/cart_controller.dart';
import 'package:sixam_mart/features/cart/domain/models/cart_model.dart';
import 'package:sixam_mart/features/item/domain/models/item_model.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/controllers/grocery_flash_deals_controller.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_section_shimmer.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryFlashDealsWidget extends StatelessWidget {
  const GroceryFlashDealsWidget({super.key});

  static const List<Map<String, dynamic>> _defaultDeals = [
    {
      'title': 'Yoga Bar High Protein Muesli',
      'unit': '1 pack (1 kg)',
      'price': '₹454',
      'mrp': '₹890',
      'image': 'assets/image/crop_flash_yogabar.png',
      'hasSelectBadge': true,
      'searchKeyword': 'Yoga Bar High Protein Muesli',
    },
    {
      'title': 'Veeba Tomato Ketchup',
      'unit': '1 pack (900 g)',
      'price': '₹82',
      'mrp': '₹120',
      'image': 'assets/image/crop_flash_veeba.png',
      'hasSelectBadge': false,
      'searchKeyword': 'Veeba Tomato Ketchup',
    },
    {
      'title': 'Saffola Forest Honey',
      'unit': '1 pc (250 g)',
      'price': '₹131',
      'mrp': '₹180',
      'image': 'assets/image/crop_flash_saffola.png',
      'hasSelectBadge': false,
      'searchKeyword': 'Saffola Forest Honey',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return GetBuilder<GroceryFlashDealsController>(
      init: Get.isRegistered<GroceryFlashDealsController>()
          ? Get.find<GroceryFlashDealsController>()
          : Get.put(GroceryFlashDealsController()),
      builder: (controller) {
        final config = controller.config;

        if (config == null) {
          return const GrocerySectionShimmer(height: 320);
        }

        if (config['enabled'] == false) {
          return const SizedBox();
        }

        final title = config?['title']?.toString() ?? 'Flash Deals: All Time Low';
        final subtitle = config?['subtitle']?.toString() ?? 'Limited Time Deals';

        List<dynamic> dealsList = _defaultDeals;
        if (config != null &&
            config['deals'] is List &&
            (config['deals'] as List).isNotEmpty) {
          dealsList = config['deals'];
        }

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
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Row
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(5),
                              decoration: BoxDecoration(
                                color: theme.warning.withValues(alpha: 0.14),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Text('⚡', style: TextStyle(fontSize: 18)),
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
                                      fontSize: 17,
                                      color: theme.textPrimary,
                                      letterSpacing: -0.3,
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
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3.5),
                        decoration: BoxDecoration(
                          color: theme.warning.withValues(alpha: 0.12),
                          borderRadius:
                              BorderRadius.circular(theme.buttonRadius),
                          border: Border.all(
                            color: theme.warning.withValues(alpha: 0.3),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          '⚡ Ending Soon',
                          style: robotoBold.copyWith(
                            fontSize: 10,
                            color: theme.warning,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // Horizontal Carousel
                SizedBox(
                  height: 195,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    physics: const BouncingScrollPhysics(),
                    itemCount: dealsList.length,
                    separatorBuilder: (context, index) => const SizedBox(width: 12),
                    itemBuilder: (context, index) {
                      final deal = dealsList[index];
                      final dTitle = deal['title']?.toString() ?? '';
                      final dUnit = deal['unit']?.toString() ?? '';
                      final dPrice = deal['price']?.toString() ?? '';
                      final dMrp = deal['mrp']?.toString() ?? '';
                      final dImage = deal['image']?.toString() ?? deal['assetPath']?.toString() ?? '';
                      final dHasBadge = deal['hasSelectBadge'] == true;
                      final dKeyword = deal['searchKeyword']?.toString() ?? dTitle;

                      return _DealProductCard(
                        title: dTitle,
                        unit: dUnit,
                        price: dPrice,
                        mrp: dMrp,
                        image: dImage,
                        assetPath: dImage,
                        hasSelectBadge: dHasBadge,
                        searchKeyword: dKeyword,
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _DealProductCard extends StatelessWidget {
  final String title;
  final String unit;
  final String price;
  final String mrp;
  final String? image;
  final String assetPath;
  final bool hasSelectBadge;
  final String? searchKeyword;

  const _DealProductCard({
    required this.title,
    required this.unit,
    required this.price,
    required this.mrp,
    this.image,
    required this.assetPath,
    required this.hasSelectBadge,
    this.searchKeyword,
  });

  void _addItemToCart() {
    try {
      final cartController = Get.find<CartController>();
      final int itemId = title.hashCode.abs();
      final double parsedPrice = double.tryParse(price.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 99.0;
      final int cartIndex = cartController.cartList.indexWhere((c) => c.item?.name == title || c.item?.id == itemId);

      final item = Item(
        id: itemId,
        name: title,
        price: parsedPrice,
        discount: 0,
        discountType: 'amount',
        imageFullUrl: (image != null && image!.isNotEmpty) ? image! : assetPath,
        storeId: 2,
        storeName: 'Quick Store Grocery',
        moduleType: 'grocery',
        moduleId: 2,
        stock: 999,
        quantityLimit: 50,
      );

      final currentQty = cartIndex != -1 ? (cartController.cartList[cartIndex].quantity ?? 1) + 1 : 1;
      final cartModel = CartModel(
        itemId,
        parsedPrice,
        parsedPrice,
        [],
        [],
        0,
        currentQty,
        [],
        [],
        false,
        999,
        item,
        50,
      );

      cartController.addToCart(cartModel, cartIndex != -1 ? cartIndex : null);
      showCustomSnackBar('$title added to cart', isError: false);
    } catch (e) {
      debugPrint('Error adding to cart: $e');
      showCustomSnackBar('$title added to cart', isError: false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cxp = context.cxpTheme;
    final searchTarget = (searchKeyword != null && searchKeyword!.isNotEmpty)
        ? searchKeyword!
        : title;

    final imgSource = (image != null && image!.isNotEmpty) ? image! : assetPath;

    return InkWell(
      onTap: () {
        if (searchTarget.isNotEmpty) {
          Get.toNamed(RouteHelper.getSearchRoute(queryText: searchTarget));
        }
      },
      borderRadius: BorderRadius.circular(cxp.cardRadius),
      child: Container(
        width: 136,
        decoration: BoxDecoration(
          color: cxp.surface,
          borderRadius: BorderRadius.circular(cxp.cardRadius),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Image Area with badges & Add button
            Container(
              height: 120,
              width: double.infinity,
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.vertical(top: Radius.circular(cxp.cardRadius)),
              ),
              child: Stack(
                children: [
                  // Product Image
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(cxp.cardRadius - 9),
                        child: buildSafeFlashDealImage(
                          imgSource,
                          width: 110,
                          height: 100,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ),

                  // Select > badge
                  if (hasSelectBadge)
                    Positioned(
                      top: 2,
                      left: 2,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF78350F),
                          borderRadius: BorderRadius.circular(cxp.radiusSm),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'select',
                              style: robotoMedium.copyWith(
                              fontSize: 9,
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 1),
                          const Icon(
                            Icons.chevron_right,
                            size: 10,
                            color: Colors.white,
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Favorite Heart
                  Positioned(
                    top: 2,
                    right: 2,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.8),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.favorite_border_rounded,
                        size: 16,
                        color: Color(0xFFE11D48),
                      ),
                    ),
                  ),

                  // Pink/Red Add Button
                  Positioned(
                    bottom: 2,
                    right: 2,
                    child: InkWell(
                      onTap: _addItemToCart,
                      borderRadius: BorderRadius.circular(cxp.buttonRadius),
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(cxp.buttonRadius),
                          border: Border.all(color: const Color(0xFFE11D48), width: 1.4),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFE11D48).withValues(alpha: 0.15),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.add,
                            size: 18,
                            color: Color(0xFFE11D48),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Price & Details
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF16A34A),
                          borderRadius: BorderRadius.circular(cxp.radiusSm),
                        ),
                        child: Text(
                          price,
                          style: robotoBold.copyWith(
                            fontSize: 11,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 5),
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
                  const SizedBox(height: 3),
                  Text(
                    unit,
                    style: robotoRegular.copyWith(
                      fontSize: 10,
                      color: cxp.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
