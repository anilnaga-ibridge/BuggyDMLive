import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

class Screen6OrderDelivered extends StatelessWidget {
  final OrderModel? order;
  final String? orderId;
  final VoidCallback? onBack;
  final VoidCallback? onViewDetails;
  final VoidCallback? onBackHome;

  const Screen6OrderDelivered({
    super.key,
    this.order,
    this.orderId,
    this.onBack,
    this.onViewDetails,
    this.onBackHome,
  });

  @override
  Widget build(BuildContext context) {
    final String displayId = orderId ?? (order?.id != null ? order!.id.toString() : '100003');

    DateTime deliveryDate = DateTime.now();
    if (order?.createdAt != null) {
      try {
        deliveryDate = DateTime.parse(order!.createdAt!).toLocal().add(const Duration(minutes: 28));
      } catch (_) {}
    }
    final formattedDeliveredOn = DateFormat('dd MMM yyyy, hh:mm a').format(deliveryDate);

    final double totalAmount = order?.orderAmount ?? 889.0;
    final paymentMethod = order?.paymentMethod ?? 'cash_on_delivery';

    String paymentMethodName = 'Cash on Delivery';
    IconData paymentIcon = Icons.payments_outlined;
    if (paymentMethod == 'wallet') {
      paymentMethodName = 'Wallet';
      paymentIcon = Icons.account_balance_wallet_outlined;
    } else if (paymentMethod == 'digital_payment') {
      paymentMethodName = 'Digital Payment';
      paymentIcon = Icons.credit_card_rounded;
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1F2937), size: 20),
          onPressed: onBack ?? () => Navigator.of(context).maybePop(),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Hero Celebration Illustration (Paper bag overflowing with fresh groceries + check badge)
            Center(
              child: Container(
                height: 200,
                width: 200,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                ),
                child: Image.asset(
                  Images.groceryBagDelivered,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Container(
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0xFFECFDF5),
                    ),
                    child: const Center(
                      child: Icon(Icons.check_circle_rounded, size: 90, color: Color(0xFF00A651)),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 2. Headline & Subtitle
            Text(
              'Order Delivered!',
              textAlign: TextAlign.center,
              style: robotoBold.copyWith(fontSize: 22, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 4),
            Text(
              'Hope you enjoy your order 🍃',
              textAlign: TextAlign.center,
              style: robotoRegular.copyWith(fontSize: 13, color: const Color(0xFF6B7280)),
            ),
            const SizedBox(height: 24),

            // 3. Order Summary Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Order ID
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Order ID', style: robotoRegular.copyWith(fontSize: 13, color: const Color(0xFF6B7280))),
                      Row(
                        children: [
                          Text(
                            '#BGY$displayId',
                            style: robotoBold.copyWith(fontSize: 14, color: const Color(0xFF111827)),
                          ),
                          const SizedBox(width: 8),
                          InkWell(
                            onTap: () {
                              Clipboard.setData(ClipboardData(text: displayId));
                              showCustomSnackBar('Order ID copied to clipboard', isError: false);
                            },
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Icon(Icons.copy_rounded, size: 14, color: Color(0xFF6B7280)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Divider(height: 22, color: Color(0xFFF3F4F6)),

                  // Delivered On
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Delivered On', style: robotoRegular.copyWith(fontSize: 13, color: const Color(0xFF6B7280))),
                      Text(
                        formattedDeliveredOn,
                        style: robotoMedium.copyWith(fontSize: 13, color: const Color(0xFF374151)),
                      ),
                    ],
                  ),
                  const Divider(height: 22, color: Color(0xFFF3F4F6)),

                  // Total Paid
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Total Paid', style: robotoRegular.copyWith(fontSize: 13, color: const Color(0xFF6B7280))),
                      Row(
                        children: [
                          Text(
                            PriceConverter.convertPrice(totalAmount),
                            style: robotoBold.copyWith(fontSize: 16, color: const Color(0xFF111827)),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE8F5E9),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Paid',
                              style: robotoMedium.copyWith(fontSize: 11, color: const Color(0xFF00A651)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Divider(height: 22, color: Color(0xFFF3F4F6)),

                  // Payment Method
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Payment Method', style: robotoRegular.copyWith(fontSize: 13, color: const Color(0xFF6B7280))),
                      Row(
                        children: [
                          Icon(paymentIcon, size: 16, color: const Color(0xFF374151)),
                          const SizedBox(width: 6),
                          Text(
                            paymentMethodName,
                            style: robotoMedium.copyWith(fontSize: 13, color: const Color(0xFF374151)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 4. Green Success Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFC8E6C9)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0xFF00A651),
                    ),
                    child: const Icon(Icons.check_rounded, color: Colors.white, size: 16),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Your items have been delivered',
                          style: robotoBold.copyWith(fontSize: 13, color: const Color(0xFF1B5E20)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Thank you for shopping with us!',
                          style: robotoRegular.copyWith(fontSize: 11, color: const Color(0xFF2E7D32)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 5. Buttons: "View Order Details" & "Back to Home"
            CustomButton(
              buttonText: 'View Order Details',
              color: const Color(0xFF00A651),
              radius: 12,
              height: 50,
              onPressed: onViewDetails ?? () {},
            ),
            const SizedBox(height: 10),

            TextButton.icon(
              onPressed: onBackHome ?? () => Get.offAllNamed(RouteHelper.getInitialRoute()),
              icon: const Icon(Icons.home_outlined, size: 18, color: Color(0xFF4B5563)),
              label: Text(
                'Back to Home',
                style: robotoMedium.copyWith(fontSize: 14, color: const Color(0xFF4B5563)),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
