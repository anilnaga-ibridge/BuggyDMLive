import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:just_the_tooltip/just_the_tooltip.dart';
import 'package:sixam_mart/common/controllers/theme_controller.dart';
import 'package:sixam_mart/common/models/config_model.dart';
import 'package:sixam_mart/features/cart/controllers/cart_controller.dart';
import 'package:sixam_mart/features/checkout/controllers/checkout_controller.dart';
import 'package:sixam_mart/features/checkout/widgets/coupon_section.dart';
import 'package:sixam_mart/features/checkout/widgets_new/custom_card_checkout.dart';
import 'package:sixam_mart/features/pro/widgets/pro_coupon_benefit_banner_widget.dart';
import 'package:sixam_mart/features/checkout/widgets/extra_discount_view_widget.dart';
import 'package:sixam_mart/features/checkout/widgets/upload_prescription_widget.dart';
import 'package:sixam_mart/features/coupon/controllers/coupon_controller.dart';
import 'package:sixam_mart/features/profile/controllers/profile_controller.dart';
import 'package:sixam_mart/features/pro/controllers/pro_controller.dart';
import 'package:sixam_mart/features/pro/domain/models/pro_active_offer_model.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class BottomSection extends StatelessWidget {
  final CheckoutController checkoutController;
  final double total;
  final Module module;
  final double subTotal;
  final double discount;
  final CouponController couponController;
  final bool taxIncluded;
  final double tax;
  final double deliveryCharge;
  final bool todayClosed;
  final bool tomorrowClosed;
  final double orderAmount;
  final double? maxCodOrderAmount;
  final int? storeId;
  final double? taxPercent;
  final double price;
  final double addOns;
  final Widget? checkoutButton;
  final bool isPrescriptionRequired;
  final double referralDiscount;
  final double proDiscount;
  final double proDeliveryDiscount;
  final double variationPrice;
  final double extraDiscount;
  final JustTheController tooltipController1;
  final JustTheController tooltipController2;
  final String deliveryChargeForView;
  final double extraChargeForToolTip;

  const BottomSection({
    super.key,
    required this.checkoutController,
    required this.total,
    required this.module,
    required this.subTotal,
    required this.discount,
    required this.couponController,
    required this.taxIncluded,
    required this.tax,
    required this.deliveryCharge,
    required this.todayClosed,
    required this.tomorrowClosed,
    required this.orderAmount,
    this.maxCodOrderAmount,
    this.storeId,
    this.taxPercent,
    required this.price,
    required this.addOns,
    this.checkoutButton,
    required this.isPrescriptionRequired,
    required this.referralDiscount,
    required this.proDiscount,
    required this.proDeliveryDiscount,
    required this.variationPrice,
    required this.extraDiscount,
    required this.tooltipController1,
    required this.tooltipController2,
    required this.deliveryChargeForView,
    required this.extraChargeForToolTip,
  });

  @override
  Widget build(BuildContext context) {
    bool takeAway = checkoutController.orderType == 'take_away';
    bool isDesktop = ResponsiveHelper.isDesktop(context);
    bool isGuestLoggedIn = AuthHelper.isGuestLoggedIn();
    bool uploadPredcription = (storeId != null || Get.find<SplashController>().configModel!.moduleConfig!.module!.orderAttachment!);

    return Container(
      decoration: isDesktop ? BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5, spreadRadius: 1)],
      ) : null,
      padding: const EdgeInsets.only(top: Dimensions.paddingSizeSmall),
      child: Column(children: [
        isDesktop ? pricingView(context: context, takeAway: takeAway) : const SizedBox(),

        SizedBox(height: isDesktop && !isGuestLoggedIn ? Dimensions.paddingSizeSmall : 0),

        /// Coupon on Desktop
        isDesktop && !isGuestLoggedIn ? CouponSection(
          storeId: storeId, checkoutController: checkoutController, total: total, price: price,
          discount: discount, addOns: addOns, deliveryCharge: deliveryCharge, variationPrice: variationPrice,
        ) : const SizedBox(),

        Padding(
          padding: EdgeInsets.fromLTRB(
            0, isDesktop && !isGuestLoggedIn ? Dimensions.paddingSizeDefault : 0,
            0, isDesktop ? Dimensions.paddingSizeDefault : 0,
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const SizedBox.shrink(),

            !isDesktop ? pricingView(context: context, takeAway: takeAway) : const SizedBox(),
            SizedBox(height: uploadPredcription ? Dimensions.paddingSizeLarge : 0),

            uploadPredcription ? Padding(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
              child: UploadPrescriptionWidget(
                checkoutController: checkoutController,
                storeId: storeId,
                isPrescriptionRequired: isPrescriptionRequired,
                tooltipController1: tooltipController1,
                tooltipController2: tooltipController2,
              ),
            ) : const SizedBox.shrink(),

            uploadPredcription ? const SizedBox(height: Dimensions.paddingSizeDefault) : const SizedBox.shrink(),

            if (extraDiscount > 0)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
                child: ExtraDiscountViewWidget(extraDiscount: extraDiscount),
              ),
            if (extraDiscount > 0) const SizedBox(height: Dimensions.paddingSizeDefault),

            isDesktop ? Padding(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('total_amount'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge, color: Theme.of(context).primaryColor)),
                        ((checkoutController.taxIncluded == 1) || ((checkoutController.orderTax ?? 0) > 0)) ? Text(' ${'vat_tax_inc'.tr}', style: robotoMedium.copyWith(
                          fontSize: Dimensions.fontSizeExtraSmall,
                        )) : const SizedBox(),
                      ],
                    ),
                  ],
                ),
                PriceConverter.convertAnimationPrice(
                  checkoutController.viewTotalPrice,
                  textStyle: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge, color: checkoutController.isPartialPay ? Theme.of(context).textTheme.bodyMedium!.color : Theme.of(context).primaryColor),
                ),
              ]),
            ) : const SizedBox(),
          ]),
        ),

        isDesktop ? Padding(
          padding: const EdgeInsets.only(top: Dimensions.paddingSizeLarge),
          child: checkoutButton,
        ) : const SizedBox(),
      ]),
    );
  }

  Widget pricingView({required BuildContext context, required bool takeAway}) {
    final ProActiveBenefit? proBenefit = Get.find<ProController>().activeOfferModel?.benefit;
    final bool isPro = (Get.find<ProfileController>().userInfoModel?.proStatus ?? false);

    final saverDeliveryOption = checkoutController.selectedSaverDeliveryOption;
    final String? saverDeliveryType = saverDeliveryOption?.deliveryType;
    final bool showSaverDeliveryOption = !takeAway && checkoutController.orderType != 'dine_in'
        && checkoutController.store?.selfDeliverySystem != 1
        && (saverDeliveryType == 'express' || saverDeliveryType == 'slightly_delay');
    final double saverDeliveryAdjustment = checkoutController.getEffectiveSaverDeliveryAdjustment(
      deliveryCharge: deliveryCharge - proDeliveryDiscount,
      deliveryOption: saverDeliveryOption,
    ).abs();

    final int itemCount = Get.find<CartController>().cartList.length;

    // Total savings
    final double totalSavings = (discount > 0 ? discount : 0) +
        (proDiscount > 0 ? proDiscount : 0) +
        ((couponController.discount ?? 0) > 0 ? couponController.discount! : 0) +
        (referralDiscount > 0 ? referralDiscount : 0);

    return Column(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: ResponsiveHelper.isDesktop(context) ? Dimensions.paddingSizeLarge : 0),
          child: const ProCouponBenefitBanner(),
        ),

        CustomCardCheckout(
          padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row: Green receipt badge + "Billing Summary" + Savings Badge
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
                      Icons.receipt_long_outlined,
                      color: Color(0xFF16A34A),
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: Dimensions.paddingSizeSmall),
                  Text(
                    'Billing Summary',
                    style: robotoBold.copyWith(
                      fontSize: Dimensions.fontSizeDefault,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const Spacer(),
                  if (totalSavings > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F8EE),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '🎉 You are saving ${PriceConverter.convertPrice(totalSavings)} on this order!',
                            style: robotoMedium.copyWith(
                              color: const Color(0xFF16A34A),
                              fontSize: 10.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: Dimensions.paddingSizeDefault),

              // Item Price
              if (storeId == null) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Item Price ($itemCount ${itemCount == 1 ? 'item' : 'items'})',
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF334155),
                      ),
                    ),
                    Text(
                      PriceConverter.convertPrice(subTotal),
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF0F172A),
                      ),
                      textDirection: TextDirection.ltr,
                    ),
                  ],
                ),
                const SizedBox(height: Dimensions.paddingSizeSmall),
              ],

              // Item Discount
              if (storeId == null && discount > 0) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Item Discount',
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF334155),
                      ),
                    ),
                    Text(
                      '- ${PriceConverter.convertPrice(discount)}',
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF16A34A),
                      ),
                      textDirection: TextDirection.ltr,
                    ),
                  ],
                ),
                const SizedBox(height: Dimensions.paddingSizeSmall),
              ],

              // Pro Discount
              if (isPro && proBenefit?.type == ProBenefitType.discount && proDiscount > 0) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'discount_pro'.tr,
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF334155),
                      ),
                    ),
                    Text(
                      '- ${PriceConverter.convertPrice(proDiscount)}',
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF16A34A),
                      ),
                      textDirection: TextDirection.ltr,
                    ),
                  ],
                ),
                const SizedBox(height: Dimensions.paddingSizeSmall),
              ],

              // Coupon Discount
              if (couponController.discount! > 0 || couponController.freeDelivery) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      couponController.coupon?.couponType == 'pro_customer'
                          ? 'coupon_discount_pro'.tr
                          : 'Coupon Discount',
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF334155),
                      ),
                    ),
                    (couponController.coupon != null && couponController.coupon!.couponType == 'free_delivery')
                        ? Text(
                            'free_delivery'.tr,
                            style: robotoBold.copyWith(
                              fontSize: Dimensions.fontSizeSmall,
                              color: const Color(0xFF16A34A),
                            ),
                          )
                        : Text(
                            '- ${PriceConverter.convertPrice(couponController.discount)}',
                            style: robotoBold.copyWith(
                              fontSize: Dimensions.fontSizeSmall,
                              color: const Color(0xFF16A34A),
                            ),
                            textDirection: TextDirection.ltr,
                          ),
                  ],
                ),
                const SizedBox(height: Dimensions.paddingSizeSmall),
              ],

              // Referral Discount
              if (referralDiscount > 0) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'referral_discount'.tr,
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF334155),
                      ),
                    ),
                    Text(
                      '- ${PriceConverter.convertPrice(referralDiscount)}',
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF16A34A),
                      ),
                      textDirection: TextDirection.ltr,
                    ),
                  ],
                ),
                const SizedBox(height: Dimensions.paddingSizeSmall),
              ],

              // Delivery Fee
              if (!(AuthHelper.isGuestLoggedIn() && checkoutController.guestAddress == null)) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Delivery Fee',
                          style: robotoRegular.copyWith(
                            fontSize: Dimensions.fontSizeSmall,
                            color: const Color(0xFF334155),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.info_outline, size: 14, color: Color(0xFF94A3B8)),
                      ],
                    ),
                    checkoutController.distance == -1
                        ? Text(
                            'Calculated at checkout',
                            style: robotoRegular.copyWith(
                              fontSize: Dimensions.fontSizeSmall,
                              color: const Color(0xFF64748B),
                            ),
                          )
                        : (deliveryCharge == 0 || (couponController.coupon != null && couponController.coupon!.couponType == 'free_delivery'))
                            ? Text(
                                'Free',
                                style: robotoBold.copyWith(
                                  fontSize: Dimensions.fontSizeSmall,
                                  color: const Color(0xFF16A34A),
                                ),
                              )
                            : Text(
                                PriceConverter.convertPrice(deliveryCharge),
                                style: robotoMedium.copyWith(
                                  fontSize: Dimensions.fontSizeSmall,
                                  color: const Color(0xFF0F172A),
                                ),
                                textDirection: TextDirection.ltr,
                              ),
                  ],
                ),
                const SizedBox(height: Dimensions.paddingSizeSmall),
              ],

              // Saver Delivery Option
              if (showSaverDeliveryOption) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${saverDeliveryType!.tr.replaceAll('_', ' ').capitalize} ${'delivery'.tr}',
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF334155),
                      ),
                    ),
                    Text(
                      '${saverDeliveryType == 'express' ? '(+) ' : '(-) '}${PriceConverter.convertPrice(saverDeliveryAdjustment)}',
                      style: robotoMedium.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF0F172A),
                      ),
                      textDirection: TextDirection.ltr,
                    ),
                  ],
                ),
                const SizedBox(height: Dimensions.paddingSizeSmall),
              ],

              // Taxes & Handling
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Taxes & Handling',
                        style: robotoRegular.copyWith(
                          fontSize: Dimensions.fontSizeSmall,
                          color: const Color(0xFF334155),
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.info_outline, size: 14, color: Color(0xFF94A3B8)),
                    ],
                  ),
                  (tax > 0)
                      ? Text(
                          PriceConverter.convertPrice(tax),
                          style: robotoMedium.copyWith(
                            fontSize: Dimensions.fontSizeSmall,
                            color: const Color(0xFF0F172A),
                          ),
                          textDirection: TextDirection.ltr,
                        )
                      : Text(
                          'Calculated at checkout',
                          style: robotoRegular.copyWith(
                            fontSize: Dimensions.fontSizeSmall,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                ],
              ),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              // Tips
              if (!takeAway && Get.find<SplashController>().configModel!.dmTipsStatus == 1 && (checkoutController.tips > 0)) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'delivery_man_tips'.tr,
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF334155),
                      ),
                    ),
                    Text(
                      '(+) ${PriceConverter.convertPrice(checkoutController.tips)}',
                      style: robotoMedium.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF0F172A),
                      ),
                      textDirection: TextDirection.ltr,
                    ),
                  ],
                ),
                const SizedBox(height: Dimensions.paddingSizeSmall),
              ],

              // Extra Packaging
              if (storeId == null && checkoutController.store?.extraPackagingStatus == true && Get.find<CartController>().needExtraPackage) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'extra_packaging'.tr,
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF334155),
                      ),
                    ),
                    Text(
                      '(+) ${PriceConverter.convertPrice(checkoutController.store!.extraPackagingAmount!)}',
                      style: robotoMedium.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF0F172A),
                      ),
                      textDirection: TextDirection.ltr,
                    ),
                  ],
                ),
                const SizedBox(height: Dimensions.paddingSizeSmall),
              ],

              // Divider
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 6.0),
                child: Divider(color: Color(0xFFF1F5F9), height: 1, thickness: 1),
              ),
              const SizedBox(height: 6),

              // Total Payable Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Total Payable (Incl. Taxes)',
                          style: robotoBold.copyWith(
                            fontSize: Dimensions.fontSizeDefault,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Final amount will be shown after delivery charges and taxes',
                          style: robotoRegular.copyWith(
                            fontSize: 10.5,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: Dimensions.paddingSizeSmall),
                  Text(
                    PriceConverter.convertPrice(checkoutController.viewTotalPrice ?? total),
                    style: robotoBold.copyWith(
                      fontSize: 18,
                      color: const Color(0xFF0F172A),
                    ),
                    textDirection: TextDirection.ltr,
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: Dimensions.paddingSizeDefault),

        // Policy Agreement Box
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
          child: _PolicyAgreementBox(),
        ),
      ],
    );
  }
}

class _PolicyAgreementBox extends StatefulWidget {
  const _PolicyAgreementBox();

  @override
  State<_PolicyAgreementBox> createState() => _PolicyAgreementBoxState();
}

class _PolicyAgreementBoxState extends State<_PolicyAgreementBox> {
  late final TapGestureRecognizer _privacyTap;
  late final TapGestureRecognizer _termsTap;
  late final TapGestureRecognizer _refundTap;

  @override
  void initState() {
    super.initState();
    _privacyTap = TapGestureRecognizer()..onTap = () => Get.toNamed(RouteHelper.getPrivacyPolicyRoute());
    _termsTap = TapGestureRecognizer()..onTap = () => Get.toNamed(RouteHelper.getTermsAndConditionRoute());
    _refundTap = TapGestureRecognizer()..onTap = () => Get.toNamed(RouteHelper.getRefundPolicyRoute());
  }

  @override
  void dispose() {
    _privacyTap.dispose();
    _termsTap.dispose();
    _refundTap.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Color bodyColor = Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black;
    final TextStyle linkStyle = robotoBold.copyWith(
      fontSize: Dimensions.fontSizeExtraSmall,
      color: bodyColor,
      decoration: TextDecoration.underline,
    );
    final TextStyle baseStyle = robotoRegular.copyWith(
      fontSize: Dimensions.fontSizeExtraSmall,
      color: bodyColor,
      height: 1.4,
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: Dimensions.paddingSizeSmall),
      decoration: BoxDecoration(
        color: Get.find<ThemeController>().darkTheme ? Theme.of(context).cardColor : const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
      ),
      child: Text.rich(
        TextSpan(style: baseStyle, children: [
          TextSpan(text: '${'by_continuing_you_will_agree_with'.tr} '),
          TextSpan(text: 'privacy_policy'.tr, style: linkStyle, recognizer: _privacyTap),
          const TextSpan(text: ', '),
          TextSpan(text: 'terms_and_conditions'.tr, style: linkStyle, recognizer: _termsTap),
          TextSpan(text: ' ${'and'.tr} '),
          TextSpan(text: 'refund_policy'.tr, style: linkStyle, recognizer: _refundTap),
        ]),
      ),
    );
  }
}
