import 'package:flutter/material.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/grocery_stepper_widget.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';
import 'package:url_launcher/url_launcher_string.dart';

class Screen5RiderNearby extends StatelessWidget {
  final OrderModel? order;
  final VoidCallback? onBack;
  final VoidCallback? onOpenChat;
  final VoidCallback? onCallRider;

  const Screen5RiderNearby({
    super.key,
    this.order,
    this.onBack,
    this.onOpenChat,
    this.onCallRider,
  });

  @override
  Widget build(BuildContext context) {
    final List<StepperStepData> steps = const [
      StepperStepData(label: 'Confirmed', subtext: '10:24 AM', isCompleted: true),
      StepperStepData(label: 'Preparing', subtext: '10:28 AM', isCompleted: true),
      StepperStepData(label: 'Out for Delivery', subtext: 'Now', isActive: true, isSubtextGreen: true),
      StepperStepData(label: 'Delivered', subtext: ''),
    ];

    final dm = order?.deliveryMan;
    final String riderName = (dm != null && dm.fName != null) ? '${dm.fName} ${dm.lName ?? ''}'.trim() : 'Rohit Kumar';
    final String riderPhone = dm?.phone ?? '';

    final String deliveryAddress = order?.deliveryAddress?.address ?? 'H.No. 45, Sector 62, Noida 201301';

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
              'Almost There!',
              style: robotoBold.copyWith(fontSize: 18, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 2),
            Text(
              '$riderName will arrive at your location soon',
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

            // 2. Hero Graphic (Rider on Scooter with "3 min away" floating badge)
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  height: 220,
                  width: double.infinity,
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
                    Images.riderScooterDelivering,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: const Color(0xFFECFDF5),
                      child: const Center(
                        child: Icon(Icons.two_wheeler_rounded, size: 80, color: Color(0xFF10B981)),
                      ),
                    ),
                  ),
                ),

                // Floating "3 min away" pill badge
                Positioned(
                  top: 14,
                  right: 14,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '3 min',
                          style: robotoBold.copyWith(fontSize: 15, color: const Color(0xFF00A651)),
                        ),
                        Text(
                          'away',
                          style: robotoRegular.copyWith(fontSize: 10, color: const Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 3. Rider Info Card
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                  // Call
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
                  // Message
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

            // 4. Alert Banner: "Rider is nearby"
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.notifications_active_rounded, color: Color(0xFFD97706), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Rider is nearby',
                          style: robotoBold.copyWith(fontSize: 14, color: const Color(0xFF92400E)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Get ready to receive your order',
                          style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFFB45309)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 5. Delivery Address Card
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Delivery Address',
                        style: robotoBold.copyWith(fontSize: 14, color: const Color(0xFF111827)),
                      ),
                      Text(
                        'Edit',
                        style: robotoMedium.copyWith(fontSize: 13, color: const Color(0xFF00A651)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
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
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
