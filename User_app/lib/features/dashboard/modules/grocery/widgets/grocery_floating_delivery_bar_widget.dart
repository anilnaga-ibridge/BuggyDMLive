import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/cart/controllers/cart_controller.dart';
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
        final int itemCount = cartController.allCartsItemCount > 0
            ? cartController.allCartsItemCount
            : cartController.cartList.length;
        final double cartTotal = cartController.calculationCart() > 0
            ? cartController.calculationCart()
            : cartController.subTotal;

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
        final bool hasItems = itemCount > 0;

        return Positioned(
          left: 16,
          right: 16,
          bottom: 84,
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
                onTap: () => Get.toNamed(RouteHelper.getCartRoute()),
                borderRadius: BorderRadius.circular(27),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: hasItems
                        ? const Color(0xFF0F172A)
                        : const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(27),
                    border: hasItems
                        ? Border.all(
                            color: const Color(
                              0xFF16A34A,
                            ).withValues(alpha: 0.5),
                            width: 1.2,
                          )
                        : null,
                    boxShadow: [
                      BoxShadow(
                        color: hasItems
                            ? const Color(0xFF16A34A).withValues(alpha: 0.2)
                            : Colors.black.withValues(alpha: 0.2),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Cart / Delivery Icon
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: hasItems
                              ? const Color(0xFF16A34A)
                              : const Color(0xFF334155),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          hasItems
                              ? Icons.shopping_cart_rounded
                              : Icons.moped_rounded,
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
                              hasItems
                                  ? '$itemCount ${itemCount == 1 ? 'item' : 'items'}  •  ${PriceConverter.convertPrice(cartTotal)}'
                                  : (isUnlocked
                                        ? 'Free delivery unlocked! 🎉'
                                        : 'Unlock free delivery'),
                              style: robotoBold.copyWith(
                                fontSize: hasItems ? 14 : 13,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              isUnlocked
                                  ? 'Free delivery unlocked! 🎉'
                                  : (adminThreshold != null
                                        ? 'Add ${PriceConverter.convertPrice(remaining > 0 ? remaining : 0)} for free delivery'
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
                          color: hasItems
                              ? const Color(0xFF16A34A)
                              : const Color(0xFFE11D48),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              hasItems ? 'View Cart' : 'View Cart',
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
        );
      },
    );
  }
}
