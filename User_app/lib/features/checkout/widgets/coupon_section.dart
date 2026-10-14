import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/features/checkout/controllers/checkout_controller.dart';
import 'package:sixam_mart/features/checkout/widgets/coupon_bottom_sheet.dart';
import 'package:sixam_mart/features/checkout/widgets_new/custom_card_checkout.dart';
import 'package:sixam_mart/features/coupon/controllers/coupon_controller.dart';
import 'package:sixam_mart/features/coupon/domain/models/coupon_model.dart';
import 'package:sixam_mart/features/store/controllers/store_controller.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class CouponSection extends StatelessWidget {
  final int? storeId;
  final CheckoutController checkoutController;
  final double total;
  final double price;
  final double discount;
  final double addOns;
  final double deliveryCharge;
  final double variationPrice;
  const CouponSection({
    super.key,
    this.storeId,
    required this.checkoutController,
    required this.total,
    required this.price,
    required this.discount,
    required this.addOns,
    required this.deliveryCharge,
    required this.variationPrice,
  });

  Future<bool> _applyCoupon(String code) async {
    final couponCtrl = Get.find<CouponController>();
    final couponDiscount = await couponCtrl.applyCoupon(
      code,
      (price - discount) + addOns + variationPrice,
      deliveryCharge,
      Get.find<StoreController>().store!.id,
    );
    if ((couponDiscount ?? 0) > 0) {
      showCustomSnackBar(
        '${'you_got_discount_of'.tr} ${PriceConverter.convertPrice(couponDiscount)}',
        isError: false,
      );
      if (checkoutController.isPartialPay || checkoutController.paymentMethodIndex == 1) {
        checkoutController.checkBalanceStatus(total - couponDiscount!, couponDiscount);
      }
      return true;
    }
    return couponCtrl.freeDelivery;
  }

  void _removeCoupon() {
    final couponCtrl = Get.find<CouponController>();
    final double currentDiscount = couponCtrl.discount ?? 0;
    couponCtrl.removeCouponData(true);
    checkoutController.couponController.text = '';
    if (checkoutController.isPartialPay || checkoutController.paymentMethodIndex == 1) {
      checkoutController.checkBalanceStatus(total + currentDiscount, 0);
    }
  }

  void _openSheet(BuildContext context) {
    final sheet = CouponBottomSheet(
      storeId: Get.find<StoreController>().store!.id,
      checkoutController: checkoutController,
      onCouponSelected: _applyCoupon,
    );
    if (ResponsiveHelper.isDesktop(context)) {
      Get.dialog(Dialog(child: sheet));
    } else {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => sheet,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (storeId != null) {
      return const SizedBox();
    }

    return GetBuilder<CouponController>(builder: (couponController) {
      final bool applied = (couponController.discount ?? 0) > 0 || couponController.freeDelivery;

      return Column(children: [
        CustomCardCheckout(
          padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Row 1: Add Coupon with green % badge + Apply Coupon > button
              InkWell(
                onTap: () => _openSheet(context),
                borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2.0),
                  child: Row(
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
                          Icons.percent,
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
                              'Add Coupon',
                              style: robotoBold.copyWith(
                                fontSize: Dimensions.fontSizeSmall,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Save more on your order',
                              style: robotoRegular.copyWith(
                                fontSize: Dimensions.fontSizeExtraSmall,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: Dimensions.paddingSizeSmall),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8F8EE),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              applied ? 'Change' : 'Apply Coupon',
                              style: robotoMedium.copyWith(
                                color: const Color(0xFF16A34A),
                                fontSize: Dimensions.fontSizeExtraSmall,
                              ),
                            ),
                            const SizedBox(width: 2),
                            const Icon(
                              Icons.chevron_right,
                              size: 16,
                              color: Color(0xFF16A34A),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              if (applied && couponController.coupon != null) ...[
                const SizedBox(height: Dimensions.paddingSizeSmall),
                _AppliedCouponBox(
                  coupon: couponController.coupon!,
                  freeDelivery: couponController.freeDelivery,
                  onCancel: _removeCoupon,
                ),
              ],

              const Padding(
                padding: EdgeInsets.symmetric(vertical: 10.0),
                child: Divider(color: Color(0xFFF1F5F9), height: 1, thickness: 1),
              ),

              // Row 2: Available offers with green tag badge + chevron
              InkWell(
                onTap: () => _openSheet(context),
                borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2.0),
                  child: Row(
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
                          Icons.local_offer_outlined,
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
                              'Available offers',
                              style: robotoBold.copyWith(
                                fontSize: Dimensions.fontSizeSmall,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'View all applicable coupons and offers',
                              style: robotoRegular.copyWith(
                                fontSize: Dimensions.fontSizeExtraSmall,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right,
                        size: 20,
                        color: Color(0xFF94A3B8),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: Dimensions.paddingSizeLarge),
      ]);
    });
  }
}

class _AppliedCouponBox extends StatelessWidget {
  final CouponModel coupon;
  final bool freeDelivery;
  final VoidCallback onCancel;

  const _AppliedCouponBox({required this.coupon, required this.freeDelivery, required this.onCancel});

  bool get _isNumericDiscountLabel => !(freeDelivery || coupon.couponType == 'free_delivery') && coupon.discount != null;

  String _discountLabel(BuildContext context) {
    if (freeDelivery || coupon.couponType == 'free_delivery') {
      return 'free_delivery'.tr;
    }
    if (coupon.discount == null) return '';
    if (coupon.discountType == 'percent') {
      return '${coupon.discount!.toInt()}% ${'off'.tr}';
    }
    return '${PriceConverter.convertPrice(coupon.discount)} ${'off'.tr}';
  }

  String _formattedExpiry() {
    final raw = coupon.expireDate;
    if (raw == null || raw.isEmpty) return '';
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return raw;
    return DateFormat('dd MMM yy, h:mma').format(parsed).toLowerCase();
  }

  @override
  Widget build(BuildContext context) {
    final String expiry = _formattedExpiry();
    return CustomPaint(
      painter: _TicketShapePainter(
        backgroundColor: const Color(0xFFE8F8EE),
        dashColor: const Color(0xFF16A34A).withValues(alpha: 0.5),
        cornerRadius: Dimensions.radiusDefault,
        notchRadius: 8,
        notchYRatio: 0.5,
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: Dimensions.paddingSizeSmall),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
              Expanded(
                child: Text(
                  coupon.title ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: robotoBold.copyWith(
                    fontSize: Dimensions.fontSizeSmall,
                    color: const Color(0xFF0F172A),
                  ),
                ),
              ),
              const SizedBox(width: Dimensions.paddingSizeSmall),
              Text(
                _discountLabel(context),
                textDirection: _isNumericDiscountLabel ? TextDirection.ltr : null,
                style: robotoBold.copyWith(
                  fontSize: Dimensions.fontSizeSmall,
                  color: const Color(0xFF16A34A),
                ),
              ),
            ]),

            if (expiry.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                '${'valid_till'.tr}: $expiry',
                style: robotoRegular.copyWith(
                  fontSize: Dimensions.fontSizeExtraSmall,
                  color: const Color(0xFF64748B),
                ),
              ),
            ],

            const SizedBox(height: Dimensions.paddingSizeSmall),

            Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
              Expanded(
                child: Text(
                  coupon.code ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: robotoBold.copyWith(
                    fontSize: Dimensions.fontSizeSmall,
                    color: const Color(0xFF16A34A),
                  ),
                ),
              ),
              const SizedBox(width: Dimensions.paddingSizeSmall),
              InkWell(
                onTap: onCancel,
                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Dimensions.paddingSizeSmall,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.error,
                    borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  ),
                  child: Text(
                    'cancel'.tr,
                    style: robotoMedium.copyWith(
                      fontSize: Dimensions.fontSizeExtraSmall,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ]),
          ],
        ),
      ),
    );
  }
}

class _TicketShapePainter extends CustomPainter {
  final Color backgroundColor;
  final Color dashColor;
  final double cornerRadius;
  final double notchRadius;
  final double notchYRatio;

  _TicketShapePainter({
    required this.backgroundColor,
    required this.dashColor,
    required this.cornerRadius,
    required this.notchRadius,
    required this.notchYRatio,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final double r = cornerRadius;
    final double n = notchRadius;
    final double ny = size.height * notchYRatio;

    final Path path = Path()
      ..moveTo(r, 0)
      ..lineTo(size.width - r, 0)
      ..arcToPoint(Offset(size.width, r), radius: Radius.circular(r))
      ..lineTo(size.width, ny - n)
      ..arcToPoint(Offset(size.width, ny + n), radius: Radius.circular(n), clockwise: false)
      ..lineTo(size.width, size.height - r)
      ..arcToPoint(Offset(size.width - r, size.height), radius: Radius.circular(r))
      ..lineTo(r, size.height)
      ..arcToPoint(Offset(0, size.height - r), radius: Radius.circular(r))
      ..lineTo(0, ny + n)
      ..arcToPoint(Offset(0, ny - n), radius: Radius.circular(n), clockwise: false)
      ..lineTo(0, r)
      ..arcToPoint(Offset(r, 0), radius: Radius.circular(r))
      ..close();

    canvas.drawPath(path, Paint()..color = backgroundColor..style = PaintingStyle.fill);

    const double dashWidth = 6;
    const double dashGap = 8;
    final Paint dashPaint = Paint()
      ..color = dashColor
      ..strokeWidth = 1
      ..strokeCap = StrokeCap.round;
    double x = n + 4;
    final double end = size.width - n - 4;
    while (x < end) {
      canvas.drawLine(Offset(x, ny), Offset(x + dashWidth, ny), dashPaint);
      x += dashWidth + dashGap;
    }
  }

  @override
  bool shouldRepaint(covariant _TicketShapePainter old) {
    return old.backgroundColor != backgroundColor
        || old.dashColor != dashColor
        || old.cornerRadius != cornerRadius
        || old.notchRadius != notchRadius
        || old.notchYRatio != notchYRatio;
  }
}
