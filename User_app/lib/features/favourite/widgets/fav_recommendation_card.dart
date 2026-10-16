import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/cart_count_view.dart';
import 'package:sixam_mart/common/widgets/custom_asset_image_widget.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/common/widgets/custom_ink_well.dart';
import 'package:sixam_mart/common/widgets/store_verified_avatar.dart';
import 'package:sixam_mart/features/favourite/controllers/favourite_controller.dart';
import 'package:sixam_mart/features/item/controllers/item_controller.dart';
import 'package:sixam_mart/features/item/domain/models/item_model.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

class FavRecommendationCard extends StatelessWidget {
  final Item item;
  final int? index;
  final int orderCount;
  final bool isFromOrderHistory;

  const FavRecommendationCard({
    super.key,
    required this.item,
    this.index,
    this.orderCount = 0,
    this.isFromOrderHistory = false,
  });

  @override
  Widget build(BuildContext context) {
    final double? startingPrice = Get.find<ItemController>().getStartingPrice(item);
    final bool hasDiscount = (item.discount ?? 0) > 0;
    final String currentPrice = PriceConverter.convertPrice(
      startingPrice,
      discount: item.discount,
      discountType: item.discountType,
    );
    final String originalPrice = hasDiscount ? PriceConverter.convertPrice(startingPrice) : '';

    final double discount = item.discount ?? 0;
    final String discountType = item.discountType ?? '';
    final bool isRightSide = Get.find<SplashController>().configModel?.currencySymbolDirection == 'right';
    final String currencySymbol = Get.find<SplashController>().configModel?.currencySymbol ?? '\$';
    final String discountText = discount > 0
        ? '${(isRightSide || discountType == 'percent') ? '' : currencySymbol}$discount${discountType == 'percent' ? '%' : isRightSide ? currencySymbol : ''} OFF'
        : '';

    final bool showHalal = (item.isStoreHalalActive ?? false) && (item.isHalalItem ?? false);
    final bool isVeg = item.veg == 1;

    return Container(
      margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
        border: Border.all(
          color: Theme.of(context).disabledColor.withValues(alpha: 0.12),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: CustomInkWell(
        radius: Dimensions.radiusLarge,
        onTap: () {
          Get.find<ItemController>().navigateToItemPage(item, context);
        },
        child: Padding(
          padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Left Thumbnail with Badges
              SizedBox(
                width: 110,
                height: 110,
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                            border: Border.all(
                              color: Theme.of(context).disabledColor.withValues(alpha: 0.12),
                              width: 0.8,
                            ),
                          ),
                          child: (item.imageFullUrl != null && item.imageFullUrl!.isNotEmpty)
                              ? CustomImage(
                                  image: item.imageFullUrl!,
                                  fit: BoxFit.cover,
                                  placeholder: Images.placeholder,
                                )
                              : Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        Theme.of(context).primaryColor.withValues(alpha: 0.05),
                                        Theme.of(context).primaryColor.withValues(alpha: 0.12),
                                      ],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                  ),
                                  child: Center(
                                    child: Icon(
                                      Icons.shopping_bag_outlined,
                                      size: 38,
                                      color: Theme.of(context).primaryColor.withValues(alpha: 0.45),
                                    ),
                                  ),
                                ),
                        ),
                      ),
                    ),

                    // Top-Left Badge: Order History Badge or Discount Badge
                    if (isFromOrderHistory || orderCount > 0)
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(6),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.2),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.history_rounded, size: 10, color: Colors.white),
                              const SizedBox(width: 3),
                              Text(
                                orderCount > 1 ? 'Ordered ${orderCount}x' : 'Past Order',
                                style: robotoBold.copyWith(fontSize: 9, color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                      )
                    else if (discountText.isNotEmpty)
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFFF5252), Color(0xFFFF7A00)],
                            ),
                            borderRadius: BorderRadius.circular(6),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.2),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Text(
                            discountText,
                            style: robotoBold.copyWith(fontSize: 9, color: Colors.white),
                          ),
                        ),
                      ),

                    // Bottom-Left Tags: Veg / Halal
                    if (isVeg || showHalal)
                      Positioned(
                        bottom: 6,
                        left: 6,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (showHalal)
                              Container(
                                width: 18,
                                height: 18,
                                margin: const EdgeInsets.only(right: 4),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).cardColor,
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: const CustomAssetImageWidget(Images.halalTag, width: 14, height: 14),
                              ),
                            if (isVeg)
                              Container(
                                width: 18,
                                height: 18,
                                decoration: BoxDecoration(
                                  color: Theme.of(context).cardColor,
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: const CustomAssetImageWidget(Images.vegTag, width: 14, height: 14),
                              ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(width: Dimensions.paddingSizeSmall),

              // 2. Right Info & Action Controls
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Store Info
                    if ((item.storeName ?? '').isNotEmpty)
                      Row(
                        children: [
                          StoreVerifiedAvatar(
                            imageUrl: item.storeLogoFullUrl ?? item.storeImageFullUrl ?? '',
                            isVerified: item.verifiedSeller == 1,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              item.storeName ?? '',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: robotoRegular.copyWith(
                                fontSize: Dimensions.fontSizeExtraSmall,
                                color: Theme.of(context).disabledColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    const SizedBox(height: 2),

                    // Product Name
                    Text(
                      item.name ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: robotoMedium.copyWith(
                        fontSize: Dimensions.fontSizeDefault,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 4),

                    // Rating
                    if (item.avgRating != null && item.avgRating! > 0)
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, size: 14, color: Color(0xFFF5A623)),
                          const SizedBox(width: 2),
                          Text(
                            item.avgRating!.toStringAsFixed(1),
                            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall),
                          ),
                          if (item.ratingCount != null && item.ratingCount! > 0) ...[
                            const SizedBox(width: 3),
                            Text(
                              '(${item.ratingCount})',
                              style: robotoRegular.copyWith(
                                fontSize: Dimensions.fontSizeExtraSmall,
                                color: Theme.of(context).disabledColor,
                              ),
                            ),
                          ],
                        ],
                      ),
                    const SizedBox(height: 6),

                    // Price & Actions Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Price
                        Expanded(
                          child: Wrap(
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 6,
                            children: [
                              Text(
                                currentPrice,
                                style: robotoBold.copyWith(
                                  fontSize: Dimensions.fontSizeLarge,
                                  color: Theme.of(context).primaryColor,
                                ),
                              ),
                              if (originalPrice.isNotEmpty)
                                Text(
                                  originalPrice,
                                  style: robotoRegular.copyWith(
                                    fontSize: Dimensions.fontSizeSmall,
                                    color: Theme.of(context).disabledColor,
                                    decoration: TextDecoration.lineThrough,
                                  ),
                                ),
                            ],
                          ),
                        ),

                        // Action 1: Add to Wishlist / Favourite
                        GetBuilder<FavouriteController>(builder: (favController) {
                          final bool isWished = favController.wishItemIdList.contains(item.id);
                          return InkWell(
                            borderRadius: BorderRadius.circular(50),
                            onTap: () {
                              if (isWished) {
                                favController.removeFromFavouriteList(item.id, false);
                              } else {
                                favController.addToFavouriteList(item, null, false);
                              }
                            },
                            child: Container(
                              width: 34,
                              height: 34,
                              margin: const EdgeInsets.only(right: 8),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isWished
                                    ? Colors.redAccent.withValues(alpha: 0.12)
                                    : Theme.of(context).disabledColor.withValues(alpha: 0.08),
                                border: Border.all(
                                  color: isWished
                                      ? Colors.redAccent.withValues(alpha: 0.35)
                                      : Theme.of(context).disabledColor.withValues(alpha: 0.2),
                                ),
                              ),
                              child: Icon(
                                isWished ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                                size: 18,
                                color: isWished ? Colors.redAccent : Theme.of(context).disabledColor,
                              ),
                            ),
                          );
                        }),

                        // Action 2: Add to Cart with reactive quantity controls
                        CartCountView(
                          item: item,
                          index: index,
                          child: Container(
                            height: 34,
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Theme.of(context).primaryColor,
                                  Theme.of(context).primaryColor.withValues(alpha: 0.85),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(50),
                              boxShadow: [
                                BoxShadow(
                                  color: Theme.of(context).primaryColor.withValues(alpha: 0.3),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.shopping_bag_outlined, size: 14, color: Colors.white),
                                const SizedBox(width: 4),
                                Text(
                                  'ADD',
                                  style: robotoBold.copyWith(
                                    color: Colors.white,
                                    fontSize: Dimensions.fontSizeSmall,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
