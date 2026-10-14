import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/features/order/domain/models/order_details_model.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/grocery_stepper_widget.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

class Screen2StorePreparing extends StatelessWidget {
  final OrderModel? order;
  final List<OrderDetailsModel>? orderDetails;
  final VoidCallback? onBack;
  final VoidCallback? onNextStage;

  const Screen2StorePreparing({
    super.key,
    this.order,
    this.orderDetails,
    this.onBack,
    this.onNextStage,
  });

  @override
  Widget build(BuildContext context) {
    DateTime confirmedTime = DateTime.now();
    if (order?.createdAt != null) {
      try {
        confirmedTime = DateTime.parse(order!.createdAt!).toLocal();
      } catch (_) {}
    }
    final formattedConfirmedTime = DateFormat('hh:mm a').format(confirmedTime);

    final List<StepperStepData> steps = [
      StepperStepData(label: 'Confirmed', subtext: formattedConfirmedTime, isCompleted: true),
      const StepperStepData(label: 'Preparing', subtext: 'Now', isActive: true, isSubtextGreen: true),
      const StepperStepData(label: 'Out for Delivery', subtext: ''),
      const StepperStepData(label: 'Delivered', subtext: ''),
    ];

    final items = (orderDetails != null && orderDetails!.isNotEmpty) ? orderDetails! : null;
    final int itemsCount = items != null ? items.length : 2;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1F2937), size: 20),
          onPressed: onBack ?? () => Navigator.of(context).maybePop(),
        ),
        title: Column(
          children: [
            Text(
              'Order Confirmed',
              style: robotoBold.copyWith(fontSize: 18, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 2),
            Text(
              'The store is preparing your items',
              style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF6B7280)),
            ),
          ],
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Horizontal Stepper
            GroceryStepperWidget(steps: steps),
            const SizedBox(height: 16),

            // 2. Hero Illustration (Store worker packing box)
            Container(
              height: 220,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: const Color(0xFFF9FAFB),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: Image.asset(
                Images.storePackingGrocery,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: const Color(0xFFECFDF5),
                  child: const Center(
                    child: Icon(Icons.storefront_rounded, size: 80, color: Color(0xFF10B981)),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 18),

            // 3. Headline & Description
            Text(
              'Your order is being prepared',
              textAlign: TextAlign.center,
              style: robotoBold.copyWith(fontSize: 20, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 6),
            Text(
              'The store is picking and packing your items with care.',
              textAlign: TextAlign.center,
              style: robotoRegular.copyWith(fontSize: 13, color: const Color(0xFF6B7280)),
            ),
            const SizedBox(height: 24),

            // 4. Order Items Card
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header: Bag icon + "Order Items (2)", right: "View All"
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.shopping_bag_outlined, color: Color(0xFF00A651), size: 18),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Order Items ($itemsCount)',
                        style: robotoBold.copyWith(fontSize: 15, color: const Color(0xFF111827)),
                      ),
                      const Spacer(),
                      Text(
                        'View All',
                        style: robotoMedium.copyWith(fontSize: 13, color: const Color(0xFF00A651)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(height: 1, color: Color(0xFFF3F4F6)),
                  const SizedBox(height: 12),

                  // Item rows
                  if (items != null)
                    ...items.take(3).map((detail) => _buildRealItemRow(detail))
                  else ...[
                    _buildFallbackItemRow(
                      name: 'Koparo Clean Natural All-Purpose Cleaner',
                      variant: '3 x 500ml • Multi Pack',
                      qty: 'Qty: 1',
                      icon: Icons.cleaning_services_rounded,
                      iconColor: Colors.teal,
                    ),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: Color(0xFFF3F4F6)),
                    const SizedBox(height: 12),
                    _buildFallbackItemRow(
                      name: 'Cool Drinks',
                      variant: '1 Litre • Assorted',
                      qty: 'Qty: 1',
                      icon: Icons.local_drink_rounded,
                      iconColor: Colors.deepOrange,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildRealItemRow(OrderDetailsModel detail) {
    final String imageUrl = detail.imageFullUrl ?? '';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: CustomImage(
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
                  detail.itemDetails?.unitType ?? 'Standard Pack',
                  style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF9CA3AF)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
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
    required String variant,
    required String qty,
    required IconData icon,
    required Color iconColor,
  }) {
    return Row(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 28),
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
                variant,
                style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF9CA3AF)),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
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
