import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/common/widgets/footer_view.dart';
import 'package:sixam_mart/common/widgets/menu_drawer.dart';
import 'package:sixam_mart/common/widgets/web_menu_bar.dart';
import 'package:sixam_mart/features/checkout/screens/digital_payment_failed_screen.dart';
import 'package:sixam_mart/features/order/controllers/order_controller.dart';
import 'package:sixam_mart/features/order/domain/models/order_details_model.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

class OrderSuccessfulScreen extends StatefulWidget {
  final String? orderID;
  final String? contactPersonNumber;
  final bool? createAccount;
  final String guestId;
  const OrderSuccessfulScreen({
    super.key,
    required this.orderID,
    this.contactPersonNumber,
    this.createAccount = false,
    required this.guestId,
  });

  @override
  State<OrderSuccessfulScreen> createState() => _OrderSuccessfulScreenState();
}

class _OrderSuccessfulScreenState extends State<OrderSuccessfulScreen> {
  String? orderId;

  @override
  void initState() {
    super.initState();

    orderId = widget.orderID ?? '';
    if (orderId!.contains('?')) {
      final parts = orderId!.split('?');
      orderId = parts[0].trim();
    }

    if (orderId!.isNotEmpty) {
      final orderController = Get.find<OrderController>();
      orderController.trackOrder(orderId!, null, false, contactNumber: widget.contactPersonNumber);
      orderController.getOrderDetails(orderId!);
      if (GetPlatform.isWeb) {
        orderController.getPaymentFailedDetails(orderId!);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        await Get.offAllNamed(RouteHelper.getInitialRoute());
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).cardColor,
        appBar: ResponsiveHelper.isDesktop(context)
            ? const WebMenuBar()
            : AppBar(
                backgroundColor: Theme.of(context).cardColor,
                elevation: 0,
                leading: IconButton(
                  icon: Icon(Icons.arrow_back_ios_new_rounded, color: Theme.of(context).textTheme.bodyLarge?.color, size: 20),
                  onPressed: () => Get.offAllNamed(RouteHelper.getInitialRoute()),
                ),
                title: Text('order_confirmation'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge)),
                centerTitle: true,
              ),
        endDrawer: const MenuDrawer(),
        endDrawerEnableOpenDragGesture: false,
        body: GetBuilder<OrderController>(builder: (orderController) {
          final order = orderController.trackModel;
          final paymentModel = orderController.paymentModel;

          bool isFailed = false;
          if (GetPlatform.isWeb && paymentModel != null) {
            final status = paymentModel.paymentStatus;
            final method = paymentModel.paymentMethod;
            final isSuccess = status == 'paid' || method == 'cash_on_delivery' || method == 'wallet' || method == 'offline_payment';
            if (!isSuccess) {
              isFailed = true;
            }
          }

          if (isFailed) {
            return SingleChildScrollView(
              child: FooterView(
                child: SizedBox(
                  width: Dimensions.webMaxWidth,
                  child: const PaymentIncompleteView(),
                ),
              ),
            );
          }

          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: FooterView(
              child: Center(
                child: SizedBox(
                  width: Dimensions.webMaxWidth,
                  child: _buildPaymentSuccessContent(context, order, orderController.orderDetails),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildPaymentSuccessContent(BuildContext context, OrderModel? order, List<OrderDetailsModel>? details) {
    final double amount = order?.orderAmount ?? (orderControllerOrderAmount());
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

    String paymentMethodName = 'cash_on_delivery'.tr;
    IconData paymentIcon = Icons.payments_outlined;
    if (paymentMethod == 'wallet') {
      paymentMethodName = 'wallet'.tr;
      paymentIcon = Icons.account_balance_wallet_outlined;
    } else if (paymentMethod == 'digital_payment') {
      paymentMethodName = 'digital_payment'.tr;
      paymentIcon = Icons.credit_card_rounded;
    } else if (paymentMethod == 'offline_payment') {
      paymentMethodName = 'offline_payment'.tr;
      paymentIcon = Icons.account_balance_outlined;
    }

    return Container(
      constraints: const BoxConstraints(maxWidth: 480),
      margin: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: Dimensions.paddingSizeLarge),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // 1. Confetti & Celebration Checkmark
          CustomPaint(
            painter: _ConfettiPainter(),
            child: Container(
              width: 140,
              height: 120,
              alignment: Alignment.center,
              child: Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF10B981),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withValues(alpha: 0.35),
                      blurRadius: 22,
                      spreadRadius: 3,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: const Icon(Icons.check_rounded, color: Colors.white, size: 48),
              ),
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeSmall),

          // Title & Subtitle
          Text(
            'Payment Successful!',
            style: robotoBold.copyWith(
              fontSize: 24,
              color: Theme.of(context).textTheme.bodyLarge?.color,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Your order has been placed',
            style: robotoRegular.copyWith(
              fontSize: Dimensions.fontSizeDefault,
              color: Theme.of(context).disabledColor,
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeExtraLarge),

          // 2. Order Information Card
          Container(
            padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).disabledColor.withValues(alpha: 0.18)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                // Order ID Row
                _buildInfoRow(
                  label: 'Order ID',
                  valueWidget: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SelectableText(
                        '#BGY${orderId ?? ''}',
                        style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault, color: Theme.of(context).textTheme.bodyLarge?.color),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () {
                          if (orderId != null && orderId!.isNotEmpty) {
                            Clipboard.setData(ClipboardData(text: orderId!));
                            showCustomSnackBar('order_id_copied'.tr, isError: false);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Theme.of(context).disabledColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Icon(Icons.copy_rounded, size: 14, color: Theme.of(context).disabledColor),
                        ),
                      ),
                    ],
                  ),
                ),
                Divider(height: 22, thickness: 1, color: Theme.of(context).dividerColor.withValues(alpha: 0.08)),

                // Order Date Row
                _buildInfoRow(
                  label: 'Order Date',
                  valueWidget: Text(
                    formattedDate,
                    style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).textTheme.bodyLarge?.color),
                  ),
                ),
                Divider(height: 22, thickness: 1, color: Theme.of(context).dividerColor.withValues(alpha: 0.08)),

                // Total Paid Row
                _buildInfoRow(
                  label: 'Total Paid',
                  valueWidget: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        PriceConverter.convertPrice(amount),
                        style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge, color: Theme.of(context).textTheme.bodyLarge?.color),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isPaid ? const Color(0xFFE8F5E9) : const Color(0xFFFFF3E0),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          isPaid ? 'Paid' : 'Unpaid',
                          style: robotoMedium.copyWith(
                            fontSize: 11,
                            color: isPaid ? const Color(0xFF2E7D32) : const Color(0xFFEF6C00),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Divider(height: 22, thickness: 1, color: Theme.of(context).dividerColor.withValues(alpha: 0.08)),

                // Payment Method Row
                _buildInfoRow(
                  label: 'Payment Method',
                  valueWidget: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(paymentIcon, size: 16, color: Theme.of(context).textTheme.bodyLarge?.color),
                      const SizedBox(width: 6),
                      Text(
                        paymentMethodName,
                        style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).textTheme.bodyLarge?.color),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeDefault),

          // 3. Loyalty / Coins Rewards Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFDF5),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFFE082)),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFFFB300).withValues(alpha: 0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'You will earn',
                        style: robotoRegular.copyWith(fontSize: 12, color: Colors.grey.shade700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '+ $displayCoins Coins',
                        style: robotoBold.copyWith(fontSize: 18, color: const Color(0xFFE65100)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'on delivery',
                        style: robotoRegular.copyWith(fontSize: 11, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
                Image.asset(
                  Images.loyaltyIcon,
                  width: 44,
                  height: 44,
                  errorBuilder: (context, error, stackTrace) => Container(
                    width: 42,
                    height: 42,
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
          const SizedBox(height: Dimensions.paddingSizeDefault),

          // 4. Store & Items Quick Preview (Screen 2 preview)
          if (order?.store != null || (details != null && details.isNotEmpty))
            _buildStoreAndItemsPreview(context, order?.store, details),

          const SizedBox(height: Dimensions.paddingSizeLarge),

          // 5. Primary Button: "View Order Details →"
          CustomButton(
            width: double.infinity,
            height: 52,
            radius: 12,
            buttonText: 'View Order Details  →',
            color: const Color(0xFF10B981),
            fontSize: Dimensions.fontSizeLarge,
            textColor: Colors.white,
            onPressed: () {
              if (orderId != null && orderId!.isNotEmpty) {
                final int parsedId = int.tryParse(orderId!) ?? 0;
                Get.toNamed(RouteHelper.getOrderDetailsRoute(parsedId, contactNumber: widget.contactPersonNumber));
              }
            },
          ),
          const SizedBox(height: Dimensions.paddingSizeSmall),

          // 6. Secondary Button: "Back to Home"
          TextButton.icon(
            onPressed: () => Get.offAllNamed(RouteHelper.getInitialRoute()),
            icon: Icon(Icons.home_outlined, size: 18, color: Theme.of(context).textTheme.bodyLarge?.color?.withValues(alpha: 0.7)),
            label: Text(
              'Back to Home',
              style: robotoMedium.copyWith(
                fontSize: Dimensions.fontSizeDefault,
                color: Theme.of(context).textTheme.bodyLarge?.color?.withValues(alpha: 0.8),
              ),
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeLarge),
        ],
      ),
    );
  }

  Widget _buildInfoRow({required String label, required Widget valueWidget}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: robotoRegular.copyWith(
            fontSize: Dimensions.fontSizeSmall,
            color: Theme.of(context).disabledColor,
          ),
        ),
        valueWidget,
      ],
    );
  }

  Widget _buildStoreAndItemsPreview(BuildContext context, dynamic store, List<OrderDetailsModel>? details) {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).disabledColor.withValues(alpha: 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Store / Hotel header
          if (store != null)
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CustomImage(
                    image: store.logoFullUrl ?? '',
                    height: 36,
                    width: 36,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: Dimensions.paddingSizeSmall),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        store.name ?? '',
                        style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'Your order is being prepared',
                        style: robotoRegular.copyWith(fontSize: 11, color: const Color(0xFF10B981)),
                      ),
                    ],
                  ),
                ),
              ],
            ),

          if (store != null && details != null && details.isNotEmpty)
            Divider(height: 20, thickness: 1, color: Theme.of(context).dividerColor.withValues(alpha: 0.08)),

          // Items preview list
          if (details != null && details.isNotEmpty)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Order Items (${details.length})',
                  style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).disabledColor),
                ),
                const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                for (int i = 0; i < (details.length > 2 ? 2 : details.length); i++)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: CustomImage(
                            image: details[i].imageFullUrl ?? '',
                            height: 32,
                            width: 32,
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(width: Dimensions.paddingSizeSmall),
                        Expanded(
                          child: Text(
                            details[i].itemDetails?.name ?? '',
                            style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8F5E9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Qty: ${details[i].quantity ?? 1}',
                            style: robotoMedium.copyWith(fontSize: 11, color: const Color(0xFF2E7D32)),
                          ),
                        ),
                      ],
                    ),
                  ),
                if (details.length > 2)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      '+ ${details.length - 2} more items',
                      style: robotoRegular.copyWith(fontSize: 11, color: Theme.of(context).disabledColor),
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }

  double orderControllerOrderAmount() {
    try {
      final orderController = Get.find<OrderController>();
      if (orderController.trackModel?.orderAmount != null) {
        return orderController.trackModel!.orderAmount!;
      }
    } catch (_) {}
    return 0.0;
  }
}

// Confetti painter for celebration sparkles
class _ConfettiPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final colors = [
      const Color(0xFFFF5252),
      const Color(0xFFFFB74D),
      const Color(0xFF42A5F5),
      const Color(0xFF66BB6A),
      const Color(0xFFAB47BC),
      const Color(0xFFFF4081),
      const Color(0xFF26A69A),
    ];
    final paint = Paint()..style = PaintingStyle.fill;
    final center = Offset(size.width / 2, size.height / 2);

    final offsets = [
      Offset(center.dx - 54, center.dy - 34),
      Offset(center.dx + 52, center.dy - 36),
      Offset(center.dx - 58, center.dy + 16),
      Offset(center.dx + 60, center.dy + 14),
      Offset(center.dx - 32, center.dy - 52),
      Offset(center.dx + 34, center.dy - 50),
      Offset(center.dx - 22, center.dy + 54),
      Offset(center.dx + 26, center.dy + 56),
      Offset(center.dx - 66, center.dy - 6),
      Offset(center.dx + 68, center.dy - 4),
    ];

    for (int i = 0; i < offsets.length; i++) {
      paint.color = colors[i % colors.length];
      if (i % 2 == 0) {
        canvas.drawCircle(offsets[i], 3.5, paint);
      } else {
        canvas.save();
        canvas.translate(offsets[i].dx, offsets[i].dy);
        canvas.rotate((i * 45) * 3.14159 / 180);
        canvas.drawRRect(
          RRect.fromRectAndRadius(const Rect.fromLTWH(-3, -7, 6, 14), const Radius.circular(3)),
          paint,
        );
        canvas.restore();
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
