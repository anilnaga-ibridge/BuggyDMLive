import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_asset_image_widget.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/common/widgets/custom_ink_well.dart';
import 'package:sixam_mart/features/cart/controllers/cart_controller.dart';
import 'package:sixam_mart/features/cart/domain/models/cart_model.dart';
import 'package:sixam_mart/features/item/domain/models/item_model.dart';
import 'package:sixam_mart/features/language/controllers/language_controller.dart';
import 'package:sixam_mart/common/widgets/item_new_bottom_sheet.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

void _handleRemoveWithUndo({
  required BuildContext context,
  required int cartIndex,
  required CartModel cart,
}) {
  final CartController cartController = Get.find<CartController>();
  cartController.removeWithUndo(
    cartIndex,
    item: cart.item,
    onUndoAvailable: (removedCart) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(Dimensions.paddingSizeDefault),
          backgroundColor: const Color(0xFF1E293B),
          elevation: 6,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
          ),
          duration: const Duration(milliseconds: 3200),
          content: Row(
            children: [
              const Icon(
                Icons.check_circle_outline,
                color: Color(0xFF10B981),
                size: 18,
              ),
              const SizedBox(width: Dimensions.paddingSizeSmall),
              Expanded(
                child: Text(
                  '${removedCart.item?.name ?? 'item'.tr} ${'removed_from_cart'.tr}',
                  style: robotoMedium.copyWith(
                    color: Colors.white,
                    fontSize: Dimensions.fontSizeSmall,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: Dimensions.paddingSizeSmall),
              InkWell(
                onTap: () {
                  ScaffoldMessenger.of(context).hideCurrentSnackBar();
                  cartController.undoRemove(removedCart.id!);
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  child: Text(
                    'undo'.tr,
                    style: robotoBold.copyWith(
                      color: const Color(0xFFFFB800),
                      fontSize: Dimensions.fontSizeSmall,
                    ),
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

class CartItemWidget extends StatefulWidget {
  final CartModel cart;
  final int cartIndex;
  final List<AddOns> addOns;
  final bool isAvailable;
  final bool showDivider;
  const CartItemWidget({
    super.key,
    required this.cart,
    required this.cartIndex,
    required this.isAvailable,
    required this.addOns,
    required this.showDivider,
  });

  @override
  State<CartItemWidget> createState() => _CartItemWidgetState();
}

class _CartItemWidgetState extends State<CartItemWidget> {
  bool showAddonsVariations = false;

  @override
  Widget build(BuildContext context) {
    double? startingPrice = _calculatePrice(item: widget.cart.item);
    double? endingPrice = _calculatePrice(
      item: widget.cart.item,
      isStartingPrice: false,
    );
    String? variationText = _setupVariationText(cart: widget.cart).$1;
    String addOnText = _setupAddonsText(cart: widget.cart) ?? '';

    double? discount = widget.cart.item!.discount;
    String? discountType = widget.cart.item!.discountType;
    String genericName = '';

    if (widget.cart.item!.genericName != null &&
        widget.cart.item!.genericName!.isNotEmpty) {
      for (String name in widget.cart.item!.genericName!) {
        genericName += name;
      }
    }

    final bool isDesktop = ResponsiveHelper.isDesktop(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 0),
      child: Slidable(
        key: ValueKey('${widget.cart.id}_${widget.cart.item?.id}'),
        endActionPane: ActionPane(
          motion: const ScrollMotion(),
          extentRatio: 0.2,
          children: [
            SlidableAction(
              onPressed: (context) {
                _handleRemoveWithUndo(
                  context: context,
                  cartIndex: widget.cartIndex,
                  cart: widget.cart,
                );
              },
              backgroundColor: Theme.of(context).colorScheme.error,
              borderRadius: BorderRadius.horizontal(
                right: Radius.circular(
                  Get.find<LocalizationController>().isLtr
                      ? Dimensions.radiusDefault
                      : 0,
                ),
                left: Radius.circular(
                  Get.find<LocalizationController>().isLtr
                      ? 0
                      : Dimensions.radiusDefault,
                ),
              ),
              foregroundColor: Colors.white,
              icon: CupertinoIcons.delete,
            ),
          ],
        ),
        child: Container(
          decoration: BoxDecoration(
            color: showAddonsVariations
                ? const Color(0xFFF8FAFC)
                : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: const Color(0xFFF1F5F9),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: CustomInkWell(
            onTap: () {
              ResponsiveHelper.isMobile(context)
                  ? showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (con) => ItemNewBottomSheet(
                        itemId: widget.cart.item!.id!,
                        cartIndex: widget.cartIndex,
                        cart: widget.cart,
                      ),
                    )
                  : showDialog(
                      context: context,
                      builder: (con) => Dialog(
                        child: ItemNewBottomSheet(
                          itemId: widget.cart.item!.id!,
                          cartIndex: widget.cartIndex,
                          cart: widget.cart,
                        ),
                      ),
                    );
            },
            radius: Dimensions.radiusDefault,
            padding: const EdgeInsets.symmetric(
              vertical: Dimensions.paddingSizeSmall,
              horizontal: Dimensions.paddingSizeExtraSmall,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isDesktop)
                  const SizedBox(height: Dimensions.paddingSizeSmall),

                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product image
                    Stack(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: const Color(0xFFE2E8F0),
                              width: 1,
                            ),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(11),
                            child: CustomImage(
                              image: '${widget.cart.item!.imageFullUrl}',
                              height: 68,
                              width: 68,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        if (!widget.isAvailable)
                          Positioned(
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            child: Container(
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(
                                  Dimensions.radiusDefault,
                                ),
                                color: Colors.black.withValues(alpha: 0.6),
                              ),
                              child: Text(
                                'not_available_now_break'.tr,
                                textAlign: TextAlign.center,
                                style: robotoRegular.copyWith(
                                  color: Colors.white,
                                  fontSize: 8,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(width: Dimensions.paddingSizeSmall),

                    // Text content + quantity pill
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Name row + quantity pill
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            widget.cart.item!.name!,
                                            style: robotoMedium.copyWith(
                                              fontSize:
                                                  Dimensions.fontSizeDefault,
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(
                                          width:
                                              Dimensions.paddingSizeExtraSmall,
                                        ),

                                        // Unit/veg badge
                                        if (widget.cart.item!.unitType != null &&
                                            widget.cart.item!.unitType!.isNotEmpty)
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              vertical: 2,
                                              horizontal: 6,
                                            ),
                                            decoration: BoxDecoration(
                                              borderRadius: BorderRadius.circular(6),
                                              color: const Color(0xFFE8F8EE),
                                            ),
                                            child: Text(
                                              widget.cart.item!.unitType!,
                                              style: robotoBold.copyWith(
                                                fontSize: 10,
                                                color: const Color(0xFF16A34A),
                                              ),
                                            ),
                                          ),

                                        const SizedBox(width: 8),

                                        // Wishlist Heart Icon
                                        const Icon(
                                          Icons.favorite_border_rounded,
                                          size: 18,
                                          color: Color(0xFF64748B),
                                        ),

                                        // Halal tag
                                        if (widget.cart.item!.isStoreHalalActive == true &&
                                            widget.cart.item!.isHalalItem == true) ...[
                                          const SizedBox(width: 6),
                                          const CustomAssetImageWidget(
                                            Images.halalTag,
                                            height: 13,
                                            width: 13,
                                          ),
                                        ],
                                      ],
                                    ),

                                    // Selected variant pill
                                    if (variationText != null &&
                                        variationText.isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 3),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                            vertical: 1.5,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Theme.of(context)
                                                .disabledColor
                                                .withValues(alpha: 0.08),
                                            borderRadius: BorderRadius.circular(
                                              Dimensions.radiusSmall,
                                            ),
                                          ),
                                          child: Text(
                                            variationText,
                                            style: robotoRegular.copyWith(
                                              fontSize:
                                                  Dimensions.fontSizeExtraSmall,
                                              color: Theme.of(
                                                context,
                                              ).disabledColor,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ),

                                    // Generic name
                                    if (genericName.isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 2),
                                        child: Text(
                                          genericName,
                                          style: robotoRegular.copyWith(
                                            fontSize: Dimensions.fontSizeSmall,
                                            color: Theme.of(
                                              context,
                                            ).disabledColor,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),

                                    // Tag chips
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4, bottom: 4),
                                      child: Wrap(
                                        spacing: 5,
                                        runSpacing: 4,
                                        children: [
                                          if (widget.cart.item!.veg == 1)
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 6,
                                                vertical: 2,
                                              ),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFE8F8EE),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                'Eco Friendly',
                                                style: robotoBold.copyWith(
                                                  fontSize: 9.5,
                                                  color: const Color(0xFF16A34A),
                                                ),
                                              ),
                                            ),
                                          if (discount! > 0)
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 6,
                                                vertical: 2,
                                              ),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFFEE2E2),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                discountType == 'percent'
                                                    ? '${discount.toInt()}% OFF'
                                                    : '${PriceConverter.convertPrice(discount)} OFF',
                                                style: robotoBold.copyWith(
                                                  fontSize: 9.5,
                                                  color: const Color(0xFFEF4444),
                                                ),
                                              ),
                                            ),
                                          if ((widget.cart.item!.name?.toLowerCase().contains('drink') == true) ||
                                              (widget.cart.item!.name?.toLowerCase().contains('cool') == true) ||
                                              (widget.cart.item!.name?.toLowerCase().contains('ice') == true))
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 6,
                                                vertical: 2,
                                              ),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFEFF6FF),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                'Chilled Product',
                                                style: robotoBold.copyWith(
                                                  fontSize: 9.5,
                                                  color: const Color(0xFF2563EB),
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),

                                    const SizedBox(height: 4),

                                    // Row 4: Price on left, Quantity selector on right
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      children: [
                                        Wrap(
                                          crossAxisAlignment:
                                              WrapCrossAlignment.center,
                                          children: [
                                            Text(
                                              '${PriceConverter.convertPrice(startingPrice, discount: discount, discountType: discountType)}'
                                              '${endingPrice != null ? ' - ${PriceConverter.convertPrice(endingPrice, discount: discount, discountType: discountType)}' : ''}',
                                              style: robotoBold.copyWith(
                                                fontSize: 16,
                                                color: const Color(0xFF0F172A),
                                              ),
                                              textDirection: TextDirection.ltr,
                                            ),
                                            if (discount! > 0) ...[
                                              const SizedBox(
                                                width: Dimensions
                                                    .paddingSizeExtraSmall,
                                              ),
                                              Text(
                                                '${PriceConverter.convertPrice(startingPrice)}'
                                                '${endingPrice != null ? ' - ${PriceConverter.convertPrice(endingPrice)}' : ''}',
                                                textDirection: TextDirection.ltr,
                                                style: robotoRegular.copyWith(
                                                  color: const Color(0xFF94A3B8),
                                                  decoration:
                                                      TextDecoration.lineThrough,
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),

                                        // Quantity Pill
                                        GetBuilder<CartController>(
                                          builder: (cartController) =>
                                              _CartItemQuantityPill(
                                                cart: widget.cart,
                                                cartIndex: widget.cartIndex,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),

                          // Prescription note
                          if (widget.cart.item!.isPrescriptionRequired!)
                            Padding(
                              padding: EdgeInsets.only(
                                top: isDesktop
                                    ? Dimensions.paddingSizeExtraSmall
                                    : 2,
                              ),
                              child: Text(
                                '* ${'prescription_required'.tr}',
                                style: robotoRegular.copyWith(
                                  fontSize: Dimensions.fontSizeExtraSmall,
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),

                // Variation / addon toggle row — full width, starts from card edge
                if (addOnText.isNotEmpty || variationText!.isNotEmpty)
                  InkWell(
                    onTap: () => setState(
                      () => showAddonsVariations = !showAddonsVariations,
                    ),
                    child: Padding(
                      padding: const EdgeInsets.only(
                        top: Dimensions.paddingSizeExtraSmall,
                      ),
                      child: Row(
                        children: [
                          if (!showAddonsVariations)
                            Expanded(
                              child: Text(
                                _buildToggleText(variationText, addOnText),
                                style: robotoRegular.copyWith(
                                  fontSize: Dimensions.fontSizeSmall,
                                  color: Theme.of(context).disabledColor,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            )
                          else
                            const Spacer(),
                          // Show button if: both addons AND variations exist, OR if either is substantial
                          if ((addOnText.isNotEmpty &&
                                  variationText!.isNotEmpty) ||
                              addOnText.length > 40 ||
                              variationText!.length > 40) ...[
                            const SizedBox(
                              width: Dimensions.paddingSizeExtraSmall,
                            ),
                            Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.grey.shade200,
                              ),
                              child: Icon(
                                showAddonsVariations
                                    ? Icons.keyboard_arrow_up_outlined
                                    : Icons.keyboard_arrow_down_outlined,
                                size: 18,
                                color: showAddonsVariations
                                    ? Theme.of(context).primaryColor
                                    : Theme.of(context).disabledColor,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),

                // Expanded addon/variation details — animated
                AnimatedSize(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                  child: showAddonsVariations
                      ? Padding(
                          padding: const EdgeInsets.only(
                            top: Dimensions.paddingSizeExtraSmall,
                          ),
                          child: Column(
                            children: [
                              if (addOnText.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(
                                    top: Dimensions.paddingSizeExtraSmall,
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${'addons'.tr}: ',
                                        style: robotoMedium.copyWith(
                                          fontSize: Dimensions.fontSizeSmall,
                                        ),
                                      ),
                                      Flexible(
                                        child: Text(
                                          addOnText,
                                          style: robotoRegular.copyWith(
                                            fontSize: Dimensions.fontSizeSmall,
                                            color: Theme.of(
                                              context,
                                            ).disabledColor,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              if (variationText!.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(
                                    top: Dimensions.paddingSizeExtraSmall,
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${'variations'.tr}: ',
                                        style: robotoMedium.copyWith(
                                          fontSize: Dimensions.fontSizeSmall,
                                        ),
                                      ),
                                      Flexible(
                                        child: Text(
                                          variationText,
                                          style: robotoRegular.copyWith(
                                            fontSize: Dimensions.fontSizeSmall,
                                            color: Theme.of(
                                              context,
                                            ).disabledColor,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        )
                      : const SizedBox(),
                ),

                if (widget.showDivider && !isDesktop)
                  Padding(
                    padding: const EdgeInsets.only(
                      top: Dimensions.paddingSizeSmall,
                    ),
                    child: Divider(
                      height: 1,
                      thickness: 0.5,
                      color: Theme.of(
                        context,
                      ).disabledColor.withValues(alpha: 0.3),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _buildToggleText(String? variationText, String addOnText) {
    final List<String> parts = [];
    if (variationText != null && variationText.isNotEmpty) {
      parts.add(variationText);
    }
    if (addOnText.isNotEmpty) {
      parts.add('${'addons'.tr}: $addOnText');
    }
    return parts.join(' ; ');
  }

  double? _calculatePrice({required Item? item, bool isStartingPrice = true}) {
    double? startingPrice;
    double? endingPrice;
    bool newVariation =
        Get.find<SplashController>()
            .getModuleConfig(item!.moduleType)
            .newVariation ??
        false;

    if (item.variations!.isNotEmpty && !newVariation) {
      List<double?> priceList = [];
      for (var variation in item.variations!) {
        priceList.add(variation.price);
      }
      priceList.sort((a, b) => a!.compareTo(b!));
      startingPrice = priceList[0];
      if (priceList[0]! < priceList[priceList.length - 1]!) {
        endingPrice = priceList[priceList.length - 1];
      }
    } else {
      startingPrice = item.price;
    }
    if (isStartingPrice) {
      return startingPrice;
    } else {
      return endingPrice;
    }
  }

  (String?, int) _setupVariationText({required CartModel cart}) {
    String? variationText = '';
    int count = 0;

    if (Get.find<SplashController>()
        .getModuleConfig(cart.item!.moduleType)
        .newVariation!) {
      if (cart.foodVariations!.isNotEmpty) {
        for (int index = 0; index < cart.foodVariations!.length; index++) {
          if (cart.foodVariations![index].contains(true)) {
            variationText =
                '${variationText!}${variationText.isNotEmpty ? ', ' : ''}${cart.item!.foodVariations![index].name} (';
            for (int i = 0; i < cart.foodVariations![index].length; i++) {
              if (cart.foodVariations![index][i]!) {
                variationText =
                    '${variationText!}${variationText.endsWith('(') ? '' : ', '}${cart.item!.foodVariations![index].variationValues![i].level}';
                count++;
              }
            }
            variationText = '${variationText!})';
          }
        }
      }
    } else {
      if (cart.variation!.isNotEmpty) {
        List<String> variationTypes = cart.variation![0].type!.split('-');
        if (variationTypes.length == cart.item!.choiceOptions!.length) {
          int index0 = 0;
          for (var choice in cart.item!.choiceOptions!) {
            variationText =
                '${variationText!}${(index0 == 0) ? '' : ',  '}${choice.title} - ${variationTypes[index0]}';
            index0 = index0 + 1;
            count++;
          }
        } else {
          variationText = cart.item!.variations![0].type;
        }
      }
    }
    return (variationText, count);
  }

  String? _setupAddonsText({required CartModel cart}) {
    String addOnText = '';
    int index0 = 0;
    List<int?> ids = [];
    List<int?> qtys = [];
    for (var addOn in cart.addOnIds!) {
      ids.add(addOn.id);
      qtys.add(addOn.quantity);
    }
    for (var addOn in cart.item!.addOns!) {
      if (ids.contains(addOn.id)) {
        addOnText =
            '$addOnText${(index0 == 0) ? '' : ',  '}${addOn.name} (${qtys[index0]})';
        index0 = index0 + 1;
      }
    }
    return addOnText;
  }
}

class _CartItemQuantityPill extends StatelessWidget {
  final CartModel cart;
  final int cartIndex;
  const _CartItemQuantityPill({required this.cart, required this.cartIndex});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 36,
      decoration: BoxDecoration(
        color: const Color(0xFFE8F8EE),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: const Color(0xFFC6F0D6),
          width: 1.2,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          InkWell(
            onTap: () {
              if (cart.quantity! > 1) {
                Get.find<CartController>().changeQuantity(
                  false,
                  cartIndex,
                  cart.stock,
                  cart.quantityLimit,
                );
              } else {
                _handleRemoveWithUndo(
                  context: context,
                  cartIndex: cartIndex,
                  cart: cart,
                );
              }
            },
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(10),
              bottomLeft: Radius.circular(10),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: cart.quantity! == 1
                  ? const Icon(
                      Icons.delete_outline_rounded,
                      size: 16,
                      color: Color(0xFF334155),
                    )
                  : const Icon(
                      Icons.remove_rounded,
                      size: 16,
                      color: Color(0xFF0F172A),
                    ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              cart.quantity.toString(),
              style: robotoBold.copyWith(
                fontSize: 14,
                color: const Color(0xFF0F172A),
              ),
            ),
          ),

          InkWell(
            onTap: () {
              if (cart.item?.moduleId != null) {
                Get.find<CartController>().forcefullySetModule(
                  cart.item!.moduleId!,
                );
              }
              Get.find<CartController>().changeQuantity(
                true,
                cartIndex,
                cart.stock,
                cart.quantityLimit,
              );
            },
            borderRadius: const BorderRadius.only(
              topRight: Radius.circular(10),
              bottomRight: Radius.circular(10),
            ),
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Icon(
                Icons.add_rounded,
                size: 16,
                color: Color(0xFF16A34A),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
