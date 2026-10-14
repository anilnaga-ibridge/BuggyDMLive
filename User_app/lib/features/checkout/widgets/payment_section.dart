import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/features/checkout/controllers/checkout_controller.dart';
import 'package:sixam_mart/features/checkout/widgets/payment_method_bottom_sheet.dart';
import 'package:sixam_mart/features/profile/controllers/profile_controller.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/helper/string_extension.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class PaymentSection extends StatelessWidget {
  final int? storeId;
  final bool isCashOnDeliveryActive;
  final bool isDigitalPaymentActive;
  final bool isWalletActive;
  final double total;
  final CheckoutController checkoutController;
  final bool isOfflinePaymentActive;
  const PaymentSection({
    super.key,
    this.storeId,
    required this.isCashOnDeliveryActive,
    required this.isDigitalPaymentActive,
    required this.isWalletActive,
    required this.total,
    required this.checkoutController,
    required this.isOfflinePaymentActive,
  });

  bool get _anyMethodActive =>
      isCashOnDeliveryActive || isDigitalPaymentActive || isWalletActive || isOfflinePaymentActive;

  void _openPicker(BuildContext context) {
    if (!_anyMethodActive) {
      showCustomSnackBar('no_payment_method_found'.tr);
      return;
    }
    final sheet = PaymentMethodBottomSheet(
      isCashOnDeliveryActive: isCashOnDeliveryActive,
      isDigitalPaymentActive: isDigitalPaymentActive,
      totalPrice: total,
      isOfflinePaymentActive: isOfflinePaymentActive,
    );
    if (ResponsiveHelper.isDesktop(context)) {
      Get.dialog(Dialog(backgroundColor: Colors.transparent, child: sheet));
    } else {
      Get.bottomSheet(sheet, backgroundColor: Colors.transparent, isScrollControlled: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CheckoutController>(builder: (controller) {
      final bool isReorderCod = storeId != null && controller.paymentMethodIndex == 0;
      final bool methodSelected = controller.paymentMethodIndex != -1;
      final bool partial = controller.isPartialPay;
      final double displayTotal = controller.viewTotalPrice ?? total;

      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header Row: Green card icon + Title + Subtitle + Change button
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
                Icons.credit_card_outlined,
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
                    'Payment Method',
                    style: robotoBold.copyWith(
                      fontSize: Dimensions.fontSizeDefault,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Choose a payment option',
                    style: robotoRegular.copyWith(
                      fontSize: Dimensions.fontSizeExtraSmall,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            InkWell(
              onTap: () => _openPicker(context),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F8EE),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Change',
                  style: robotoMedium.copyWith(
                    color: const Color(0xFF16A34A),
                    fontSize: Dimensions.fontSizeExtraSmall,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: Dimensions.paddingSizeDefault),

        // Method Display Card
        if (!methodSelected && !isReorderCod)
          _PaymentEmptyButton(onTap: () => _openPicker(context))
        else if (partial)
          _PaymentPartialCard(controller: controller, total: displayTotal)
        else
          _PaymentSelectedCard(
            title: _PaymentRowHelper.labelForIndex(controller),
            subtitle: _PaymentRowHelper.subtitleForIndex(controller),
            amount: displayTotal,
            onTap: () => _openPicker(context),
          ),
      ]);
    });
  }
}

class _PaymentSelectedCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final double amount;
  final VoidCallback onTap;

  const _PaymentSelectedCard({
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FAF5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFF86EFAC),
            width: 1.2,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Green cash icon badge
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFF16A34A),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(
                Icons.payments_outlined,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: Dimensions.paddingSizeSmall),

            // Title & Subtitle
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: robotoBold.copyWith(
                      fontSize: Dimensions.fontSizeSmall,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: robotoRegular.copyWith(
                      fontSize: Dimensions.fontSizeExtraSmall,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: Dimensions.paddingSizeSmall),

            // Amount
            Text(
              PriceConverter.convertPrice(amount),
              textDirection: TextDirection.ltr,
              style: robotoBold.copyWith(
                fontSize: Dimensions.fontSizeDefault,
                color: const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(width: 10),

            // Green Checkmark
            Container(
              width: 20,
              height: 20,
              decoration: const BoxDecoration(
                color: Color(0xFF16A34A),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check,
                size: 13,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentPartialCard extends StatelessWidget {
  final CheckoutController controller;
  final double total;

  const _PaymentPartialCard({required this.controller, required this.total});

  @override
  Widget build(BuildContext context) {
    final double walletBalance = Get.find<ProfileController>().userInfoModel?.walletBalance ?? 0;
    final double walletShare = walletBalance.clamp(0, total).toDouble();
    final double remainder = (total - walletShare).clamp(0, total).toDouble();

    return Column(
      children: [
        _PaymentSelectedCard(
          title: 'wallet_payment'.tr,
          subtitle: 'Paid using your wallet balance',
          amount: walletShare,
          onTap: () {},
        ),
        const SizedBox(height: Dimensions.paddingSizeSmall),
        _PaymentSelectedCard(
          title: _PaymentRowHelper.labelForIndex(controller),
          subtitle: _PaymentRowHelper.subtitleForIndex(controller),
          amount: remainder,
          onTap: () {},
        ),
      ],
    );
  }
}

class _PaymentEmptyButton extends StatelessWidget {
  final VoidCallback onTap;

  const _PaymentEmptyButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.add_circle_outline, size: 20, color: Color(0xFF16A34A)),
            const SizedBox(width: Dimensions.paddingSizeSmall),
            Text(
              'Select Payment Method',
              style: robotoBold.copyWith(
                fontSize: Dimensions.fontSizeSmall,
                color: const Color(0xFF16A34A),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentRowHelper {
  static String labelForIndex(CheckoutController c) {
    switch (c.paymentMethodIndex) {
      case 0:
        return 'Cash on Delivery';
      case 1:
        return 'wallet_payment'.tr;
      case 2:
        final String name = c.digitalPaymentName?.replaceAll('_', ' ').toTitleCase() ?? '';
        if (name.isEmpty) return 'Digital Payment';
        return name;
      case 3:
        final List? methods = c.offlineMethodList;
        final int idx = c.selectedOfflineBankIndex;
        final String methodName = (methods != null && idx >= 0 && idx < methods.length)
            ? (methods[idx].methodName ?? '')
            : '';
        return methodName.isNotEmpty ? 'Offline Payment ($methodName)' : 'Offline Payment';
      default:
        return 'Cash on Delivery';
    }
  }

  static String subtitleForIndex(CheckoutController c) {
    switch (c.paymentMethodIndex) {
      case 0:
        return 'Pay with cash when your order arrives';
      case 1:
        return 'Deducted directly from wallet balance';
      case 2:
        return 'Pay instantly with UPI / card / netbanking';
      case 3:
        return 'Pay using offline bank transfer';
      default:
        return 'Pay when your order arrives';
    }
  }
}
