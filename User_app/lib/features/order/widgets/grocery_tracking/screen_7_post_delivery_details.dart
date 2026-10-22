import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/features/order/domain/models/order_details_model.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/grocery_stepper_widget.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';
import 'package:url_launcher/url_launcher_string.dart';

class Screen7PostDeliveryDetails extends StatelessWidget {
  final OrderModel? order;
  final List<OrderDetailsModel>? orderDetails;
  final VoidCallback? onBack;
  final VoidCallback? onOpenRating;
  final VoidCallback? onOpenChat;
  final VoidCallback? onCallRider;

  const Screen7PostDeliveryDetails({
    super.key,
    this.order,
    this.orderDetails,
    this.onBack,
    this.onOpenRating,
    this.onOpenChat,
    this.onCallRider,
  });

  @override
  Widget build(BuildContext context) {
    final String displayId = order?.id != null ? order!.id.toString() : '100003';

    DateTime confirmedDate = DateTime.now().subtract(const Duration(minutes: 30));
    DateTime preparingDate = confirmedDate.add(const Duration(minutes: 4));
    DateTime outDate = confirmedDate.add(const Duration(minutes: 18));
    DateTime deliveredDate = confirmedDate.add(const Duration(minutes: 28));

    if (order?.createdAt != null) {
      try {
        confirmedDate = DateTime.parse(order!.createdAt!).toLocal();
        preparingDate = confirmedDate.add(const Duration(minutes: 4));
        outDate = confirmedDate.add(const Duration(minutes: 18));
        deliveredDate = confirmedDate.add(const Duration(minutes: 28));
      } catch (_) {}
    }

    final formattedDeliveredHeader = DateFormat('dd MMM yyyy, hh:mm a').format(deliveredDate);

    final List<StepperStepData> steps = [
      StepperStepData(label: 'Confirmed', subtext: DateFormat('hh:mm a').format(confirmedDate), isCompleted: true),
      StepperStepData(label: 'Preparing', subtext: DateFormat('hh:mm a').format(preparingDate), isCompleted: true),
      StepperStepData(label: 'Out for Delivery', subtext: DateFormat('hh:mm a').format(outDate), isCompleted: true),
      StepperStepData(label: 'Delivered', subtext: DateFormat('hh:mm a').format(deliveredDate), isCompleted: true),
    ];

    final dm = order?.deliveryMan;
    final String riderName = (dm != null && dm.fName != null) ? '${dm.fName} ${dm.lName ?? ''}'.trim() : 'Rohit Kumar';
    final String riderPhone = dm?.phone ?? '';

    final store = order?.store;
    final String storeName = store?.name ?? 'Quick Store Grocery';
    final String deliveryAddress = order?.deliveryAddress?.address ?? 'H.No. 45, Sector 62, Noida 201301';

    final items = (orderDetails != null && orderDetails!.isNotEmpty) ? orderDetails! : null;
    final int itemsCount = items != null ? items.length : (order?.detailsCount ?? order?.itemCount ?? 1);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1F2937), size: 20),
          onPressed: onBack ?? () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else if (Get.key.currentState?.canPop() ?? false) {
              Get.back();
            } else {
              Get.offAllNamed(RouteHelper.getInitialRoute());
            }
          },
        ),
        title: Text(
          'Order Details',
          style: robotoBold.copyWith(fontSize: 18, color: const Color(0xFF111827)),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Store Header Card
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
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: (store?.logoFullUrl != null && store!.logoFullUrl!.isNotEmpty)
                        ? CustomImage(
                            image: store.logoFullUrl!,
                            fit: BoxFit.cover,
                          )
                        : const Icon(Icons.storefront_rounded, color: Color(0xFF00A651), size: 28),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          storeName,
                          style: robotoBold.copyWith(fontSize: 15, color: const Color(0xFF111827)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Order #BGY$displayId',
                          style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF6B7280)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          formattedDeliveredHeader,
                          style: robotoRegular.copyWith(fontSize: 11, color: const Color(0xFF9CA3AF)),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Delivered',
                      style: robotoMedium.copyWith(fontSize: 11, color: const Color(0xFF00A651)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 2. Completed Stepper (all 4 steps green)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: GroceryStepperWidget(steps: steps),
            ),
            const SizedBox(height: 14),

            // 3. Delivery Partner Card
            Text(
              'Delivery Partner',
              style: robotoBold.copyWith(fontSize: 14, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: Image.asset(
                      Images.riderAvatarPortrait,
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 48,
                        height: 48,
                        color: const Color(0xFFECFDF5),
                        child: const Icon(Icons.person, color: Color(0xFF10B981)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          riderName,
                          style: robotoBold.copyWith(fontSize: 15, color: const Color(0xFF111827)),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 16),
                            const SizedBox(width: 4),
                            Text(
                              '4.8 (320 deliveries)',
                              style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF6B7280)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Call button
                  InkWell(
                    onTap: () {
                      if (onCallRider != null) {
                        onCallRider!();
                      } else if (riderPhone.isNotEmpty) {
                        launchUrlString('tel:$riderPhone');
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(9),
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFFF3F4F6),
                      ),
                      child: const Icon(Icons.phone_rounded, color: Color(0xFF1F2937), size: 18),
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Message button
                  InkWell(
                    onTap: onOpenChat ?? () {},
                    child: Container(
                      padding: const EdgeInsets.all(9),
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFFF3F4F6),
                      ),
                      child: const Icon(Icons.chat_bubble_rounded, color: Color(0xFF1F2937), size: 18),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 4. Delivery Address Card
            Text(
              'Delivery Address',
              style: robotoBold.copyWith(fontSize: 14, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.location_on_rounded, color: Color(0xFF00A651), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      deliveryAddress,
                      style: robotoRegular.copyWith(fontSize: 13, color: const Color(0xFF4B5563), height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 5. Order Items Card
            Text(
              'Order Items ($itemsCount)',
              style: robotoBold.copyWith(fontSize: 14, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                children: [
                  if (items != null)
                    ...items.map((detail) => _buildRealItemRow(detail))
                  else if (order != null && (order!.detailsCount ?? 0) > 0)
                    ...List.generate(order!.detailsCount!.clamp(1, 3), (index) => _buildShimmerItemRow())
                  else ...[
                    _buildFallbackItemRow(
                      name: 'Cool Drinks',
                      price: '₹ 20',
                      qty: 'Qty: 1',
                      icon: Icons.local_drink_rounded,
                      iconColor: Colors.deepOrange,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 6. Action button to Rate Experience
            CustomButton(
              buttonText: 'Rate Your Experience  ★',
              color: const Color(0xFF00A651),
              radius: 12,
              height: 50,
              onPressed: onOpenRating ?? () {},
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmerItemRow() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 130,
                  height: 14,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  width: 60,
                  height: 12,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 48,
            height: 22,
            decoration: BoxDecoration(
              color: const Color(0xFFE8F5E9),
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRealItemRow(OrderDetailsModel detail) {
    final String imageUrl = detail.imageFullUrl ?? '';
    final double price = (detail.price ?? 0) * (detail.quantity ?? 1);
    final String itemKey = detail.id?.toString() ?? detail.itemDetails?.id?.toString() ?? imageUrl;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: CustomImage(
              key: ValueKey(itemKey.isNotEmpty ? itemKey : 'detail_${detail.hashCode}'),
              image: imageUrl,
              height: 50,
              width: 50,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  detail.itemDetails?.name ?? 'Item',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: robotoMedium.copyWith(fontSize: 14, color: const Color(0xFF1F2937)),
                ),
                const SizedBox(height: 2),
                Text(
                  PriceConverter.convertPrice(price),
                  style: robotoBold.copyWith(fontSize: 13, color: const Color(0xFF111827)),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFE8F5E9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              'Qty: ${detail.quantity ?? 1}',
              style: robotoMedium.copyWith(fontSize: 11, color: const Color(0xFF00A651)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFallbackItemRow({
    required String name,
    required String price,
    required String qty,
    required IconData icon,
    required Color iconColor,
  }) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 26),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: robotoMedium.copyWith(fontSize: 14, color: const Color(0xFF1F2937)),
              ),
              const SizedBox(height: 2),
              Text(
                price,
                style: robotoBold.copyWith(fontSize: 13, color: const Color(0xFF111827)),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFFE8F5E9),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            qty,
            style: robotoMedium.copyWith(fontSize: 11, color: const Color(0xFF00A651)),
          ),
        ),
      ],
    );
  }
}
