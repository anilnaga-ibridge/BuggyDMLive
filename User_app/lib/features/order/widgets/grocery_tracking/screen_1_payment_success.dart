import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

class Screen1PaymentSuccess extends StatelessWidget {
  final OrderModel? order;
  final String? orderId;
  final VoidCallback? onBack;
  final VoidCallback? onViewOrderDetails;
  final VoidCallback? onBackHome;

  const Screen1PaymentSuccess({
    super.key,
    this.order,
    this.orderId,
    this.onBack,
    this.onViewOrderDetails,
    this.onBackHome,
  });

  @override
  Widget build(BuildContext context) {
    final String displayId = orderId ?? (order?.id != null ? order!.id.toString() : '728912');
    final double amount = order?.orderAmount ?? 889.0;

    final splash = Get.find<SplashController>();
    final double purchasePointRate = splash.configModel?.loyaltyPointItemPurchasePoint ?? 1.0;
    final int coinsEarned = ((amount / 100) * purchasePointRate).floor();
    final int displayCoins = coinsEarned > 0 ? coinsEarned : 45;

    DateTime orderDate = DateTime.now();
    if (order?.createdAt != null) {
      try {
        orderDate = DateTime.parse(order!.createdAt!).toLocal();
      } catch (_) {}
    }
    final formattedDate = DateFormat('dd MMM yyyy, hh:mm a').format(orderDate);

    final paymentMethod = order?.paymentMethod ?? 'cash_on_delivery';
    final paymentStatus = order?.paymentStatus ?? 'paid';
    final isPaid = paymentStatus.toLowerCase() == 'paid';

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
          onPressed: onBack ?? () => Get.offAllNamed(RouteHelper.getInitialRoute()),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: 8),
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Confetti & Green Check Badge
                Center(
                  child: CustomPaint(
                    painter: _ConfettiParticlesPainter(),
                    child: Container(
                      width: 140,
                      height: 120,
                      alignment: Alignment.center,
                      child: Container(
                        width: 76,
                        height: 76,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF00A651),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF00A651).withValues(alpha: 0.35),
                              blurRadius: 22,
                              spreadRadius: 2,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.check_rounded, color: Colors.white, size: 48),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Title & Subtitle
                Text(
                  'Payment Successful!',
                  textAlign: TextAlign.center,
                  style: robotoBold.copyWith(fontSize: 22, color: const Color(0xFF111827)),
                ),
                const SizedBox(height: 4),
                Text(
                  'Your order has been placed',
                  textAlign: TextAlign.center,
                  style: robotoRegular.copyWith(fontSize: 13, color: const Color(0xFF6B7280)),
                ),
                const SizedBox(height: 24),

                // 2. Order ID Details Card
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
                      // Order ID Row
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

                      // Order Date
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Order Date', style: robotoRegular.copyWith(fontSize: 13, color: const Color(0xFF6B7280))),
                          Text(
                            formattedDate,
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
                                PriceConverter.convertPrice(amount),
                                style: robotoBold.copyWith(fontSize: 16, color: const Color(0xFF111827)),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isPaid ? const Color(0xFFE8F5E9) : const Color(0xFFFFF3E0),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  isPaid ? 'Paid' : 'Unpaid',
                                  style: robotoMedium.copyWith(
                                    fontSize: 11,
                                    color: isPaid ? const Color(0xFF00A651) : const Color(0xFFF57C00),
                                  ),
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

                // 3. Rewards / Loyalty Coins Card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'You will earn',
                              style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF92400E)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '+ $displayCoins Coins',
                              style: robotoBold.copyWith(fontSize: 16, color: const Color(0xFFD97706)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'on delivery',
                              style: robotoRegular.copyWith(fontSize: 11, color: const Color(0xFFB45309)),
                            ),
                          ],
                        ),
                      ),
                      Image.asset(
                        Images.loyaltyIcon,
                        width: 44,
                        height: 44,
                        errorBuilder: (context, error, stackTrace) => Container(
                          width: 44,
                          height: 44,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(colors: [Color(0xFFFFD54F), Color(0xFFFF8F00)]),
                          ),
                          child: const Icon(Icons.monetization_on_rounded, color: Colors.white, size: 28),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // 4. Primary Button: "View Order Details →"
                CustomButton(
                  buttonText: 'View Order Details  →',
                  color: const Color(0xFF00A651),
                  radius: 12,
                  height: 52,
                  onPressed: onViewOrderDetails ?? () {},
                ),
                const SizedBox(height: 10),

                // 5. Secondary Button: "Back to Home"
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
        ),
      ),
    );
  }
}

class _ConfettiParticlesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final colors = [
      const Color(0xFF3B82F6), // blue
      const Color(0xFFF59E0B), // amber
      const Color(0xFFEC4899), // pink
      const Color(0xFF10B981), // emerald
      const Color(0xFF8B5CF6), // purple
      const Color(0xFFEF4444), // red
    ];

    final random = Random(42);
    final center = Offset(size.width / 2, size.height / 2);

    for (int i = 0; i < 28; i++) {
      final angle = (i / 28) * 2 * pi + random.nextDouble() * 0.2;
      final distance = 46.0 + random.nextDouble() * 26.0;
      final pos = Offset(
        center.dx + cos(angle) * distance,
        center.dy + sin(angle) * distance,
      );

      final color = colors[i % colors.length];
      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.fill;

      if (i % 3 == 0) {
        // Star or square
        canvas.drawRect(Rect.fromCenter(center: pos, width: 4.5, height: 4.5), paint);
      } else {
        // Circle dot
        canvas.drawCircle(pos, 2.5 + random.nextDouble() * 1.5, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
