import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/cart/controllers/cart_controller.dart';
import 'package:sixam_mart/features/cart/domain/models/cart_model.dart';
import 'package:sixam_mart/features/store/controllers/store_controller.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryFloatingDeliveryBarWidget extends StatelessWidget {
  const GroceryFloatingDeliveryBarWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CartController>(
      builder: (cartController) {
        // Absolutely guarantee: if active cartList is empty, do NOT show the delivery bar!
        if (cartController.cartList.isEmpty) {
          return const SizedBox.shrink();
        }

        final int itemCount = cartController.cartList.fold<int>(
          0,
          (sum, item) => sum + (item.quantity ?? 1),
        );
        if (itemCount <= 0) {
          return const SizedBox.shrink();
        }

        double cartTotal = cartController.calculationCart();
        if (cartTotal <= 0) {
          cartTotal = cartController.subTotal;
        }
        if (cartTotal <= 0) {
          for (final item in cartController.cartList) {
            final double price = item.discountedPrice ?? item.price ?? 0;
            final int qty = item.quantity ?? 1;
            cartTotal += (price * qty);
          }
        }

        final int? currentStoreId = cartController.cartList.firstOrNull?.item?.storeId;

        final double? adminThreshold =
            cartController.adminFreeDeliveryThreshold;
        final bool isFreeToAll = cartController.isFreeDeliveryToAllStore;
        final bool storeFreeDelivery =
            (Get.isRegistered<StoreController>() &&
                (Get.find<StoreController>().store?.freeDelivery ?? false)) ||
            (cartController.cartList.isNotEmpty &&
                (cartController.cartList.first.item?.freeDelivery ?? false));
        final bool isUnlocked =
            isFreeToAll ||
            storeFreeDelivery ||
            (adminThreshold != null && cartTotal >= adminThreshold);
        final double remaining = isFreeToAll
            ? 0.0
            : (adminThreshold != null ? (adminThreshold - cartTotal) : 0.0);

        return Positioned(
          left: 16,
          right: 16,
          bottom: 84,
          child: TweenAnimationBuilder<double>(
            tween: Tween<double>(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 260),
            curve: Curves.easeOutCubic,
            builder: (context, val, child) {
              return Transform.translate(
                offset: Offset(0, (1 - val) * 24),
                child: Opacity(
                  opacity: val.clamp(0.0, 1.0),
                  child: child,
                ),
              );
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top "Offers ^" tag
                InkWell(
                  onTap: () => Get.toNamed(RouteHelper.getCouponRoute()),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE11D48),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Offers',
                          style: robotoBold.copyWith(
                            fontSize: 10,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 2),
                        const Icon(
                          Icons.keyboard_arrow_up_rounded,
                          color: Colors.white,
                          size: 14,
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 2),

                // Main Floating Pill
                InkWell(
                  onTap: () => Get.toNamed(RouteHelper.getCartRoute(storeId: currentStoreId)),
                  borderRadius: BorderRadius.circular(27),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(27),
                      border: Border.all(
                        color: const Color(0xFF16A34A).withValues(alpha: 0.5),
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF16A34A).withValues(alpha: 0.2),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        // Cart Icon
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Color(0xFF16A34A),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.shopping_cart_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),

                        const SizedBox(width: 12),

                        // Status Text & Totals
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '$itemCount ${itemCount == 1 ? 'item' : 'items'}  •  ${PriceConverter.convertPrice(cartTotal)}',
                                style: robotoBold.copyWith(
                                  fontSize: 14,
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                isUnlocked
                                    ? 'Free delivery unlocked! 🎉'
                                    : (adminThreshold != null && remaining > 0
                                          ? 'Add ${PriceConverter.convertPrice(remaining)} for free delivery'
                                          : 'Standard delivery charges apply'),
                                style: robotoRegular.copyWith(
                                  fontSize: 11,
                                  color: const Color(0xFF94A3B8),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // View Cart button action
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 7,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF16A34A),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'View Cart',
                                style: robotoBold.copyWith(
                                  fontSize: 12,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.arrow_forward_rounded,
                                color: Colors.white,
                                size: 13,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
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
