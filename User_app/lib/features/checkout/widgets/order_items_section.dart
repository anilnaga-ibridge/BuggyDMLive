import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/features/cart/domain/models/cart_model.dart';
import 'package:sixam_mart/features/checkout/widgets_new/custom_card_checkout.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class OrderItemsSection extends StatelessWidget {
  final List<CartModel?>? cartList;
  final VoidCallback? onEditCart;

  const OrderItemsSection({
    super.key,
    required this.cartList,
    this.onEditCart,
  });

  @override
  Widget build(BuildContext context) {
    if (cartList == null || cartList!.isEmpty) {
      return const SizedBox.shrink();
    }

    final int itemCount = cartList!.length;

    return CustomCardCheckout(
      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: const BoxDecoration(
                  color: Color(0xFFE8F8EE),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.shopping_bag_outlined,
                  color: Color(0xFF16A34A),
                  size: 18,
                ),
              ),
              const SizedBox(width: Dimensions.paddingSizeSmall),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Order Items ($itemCount ${itemCount == 1 ? 'item' : 'items'})',
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeDefault,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Review your items before placing order',
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeExtraSmall,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: onEditCart ?? () {
                  if (Navigator.canPop(context)) {
                    Navigator.pop(context);
                  } else {
                    Get.toNamed(RouteHelper.getCartRoute());
                  }
                },
                borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                child: Padding(
                  padding: const EdgeInsets.all(4.0),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.edit_outlined,
                        size: 16,
                        color: Color(0xFF16A34A),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Edit Cart',
                        style: robotoMedium.copyWith(
                          fontSize: Dimensions.fontSizeSmall,
                          color: const Color(0xFF16A34A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const Padding(
            padding: EdgeInsets.symmetric(vertical: Dimensions.paddingSizeSmall),
            child: Divider(color: Color(0xFFF1F5F9), height: 1, thickness: 1),
          ),

          // Items List
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: cartList!.length,
            separatorBuilder: (_, index) => const Padding(
              padding: EdgeInsets.symmetric(vertical: Dimensions.paddingSizeSmall),
              child: Divider(color: Color(0xFFF8FAFC), height: 1, thickness: 1),
            ),
            itemBuilder: (context, index) {
              final CartModel? cart = cartList![index];
              if (cart == null || cart.item == null) return const SizedBox.shrink();

              final item = cart.item!;
              final double actualPrice = cart.discountedPrice ?? cart.price ?? 0;
              final double originalPrice = cart.price ?? 0;
              final bool hasDiscount = (cart.discountedPrice != null && cart.discountedPrice! < originalPrice) ||
                  ((item.discount ?? 0) > 0);

              // Subtitle: unit / variation info
              String subtitleText = '';
              if (item.unitType != null && item.unitType!.isNotEmpty) {
                subtitleText = item.unitType!;
              } else if (item.foodVariations != null && item.foodVariations!.isNotEmpty) {
                List<String> variations = [];
                for (var v in item.foodVariations!) {
                  if (v.name != null && v.name!.isNotEmpty) {
                    variations.add(v.name!);
                  }
                }
                subtitleText = variations.join(' • ');
              }

              return Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Product Thumbnail
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CustomImage(
                      image: item.imageFullUrl ?? '',
                      height: 52,
                      width: 52,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: Dimensions.paddingSizeSmall),

                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.name ?? '',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: robotoMedium.copyWith(
                            fontSize: Dimensions.fontSizeSmall,
                            color: const Color(0xFF0F172A),
                            height: 1.25,
                          ),
                        ),
                        if (subtitleText.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            subtitleText,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: robotoRegular.copyWith(
                              fontSize: Dimensions.fontSizeExtraSmall,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                              PriceConverter.convertPrice(actualPrice),
                              style: robotoBold.copyWith(
                                fontSize: Dimensions.fontSizeDefault,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                            if (hasDiscount) ...[
                              const SizedBox(width: 6),
                              Text(
                                PriceConverter.convertPrice(originalPrice),
                                style: robotoRegular.copyWith(
                                  fontSize: Dimensions.fontSizeExtraSmall,
                                  color: const Color(0xFF94A3B8),
                                  decoration: TextDecoration.lineThrough,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: Dimensions.paddingSizeSmall),

                  // Quantity pill
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F8EE),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      'Qty: ${cart.quantity}',
                      style: robotoMedium.copyWith(
                        fontSize: Dimensions.fontSizeExtraSmall,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
