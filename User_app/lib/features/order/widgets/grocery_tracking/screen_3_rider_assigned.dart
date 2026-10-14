import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/grocery_stepper_widget.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';
import 'package:url_launcher/url_launcher_string.dart';

class Screen3RiderAssigned extends StatelessWidget {
  final OrderModel? order;
  final VoidCallback? onBack;
  final VoidCallback? onOpenLiveMap;
  final VoidCallback? onOpenChat;
  final VoidCallback? onCallRider;

  const Screen3RiderAssigned({
    super.key,
    this.order,
    this.onBack,
    this.onOpenLiveMap,
    this.onOpenChat,
    this.onCallRider,
  });

  @override
  Widget build(BuildContext context) {
    DateTime confirmedTime = DateTime.now().subtract(const Duration(minutes: 20));
    DateTime preparingTime = DateTime.now().subtract(const Duration(minutes: 15));
    DateTime deliveryTime = DateTime.now().add(const Duration(minutes: 15));
    if (order?.createdAt != null) {
      try {
        confirmedTime = DateTime.parse(order!.createdAt!).toLocal();
        preparingTime = confirmedTime.add(const Duration(minutes: 4));
        deliveryTime = confirmedTime.add(const Duration(minutes: 25));
      } catch (_) {}
    }

    final formattedConfirmedTime = DateFormat('hh:mm a').format(confirmedTime);
    final formattedPreparingTime = DateFormat('hh:mm a').format(preparingTime);
    final formattedDeliveryEstimate = DateFormat('hh:mm a').format(deliveryTime);

    final List<StepperStepData> steps = [
      StepperStepData(label: 'Confirmed', subtext: formattedConfirmedTime, isCompleted: true),
      StepperStepData(label: 'Preparing', subtext: formattedPreparingTime, isCompleted: true),
      StepperStepData(label: 'Out for Delivery', subtext: '10:42 AM', isActive: true, isSubtextGreen: true),
      const StepperStepData(label: 'Delivered', subtext: ''),
    ];

    final dm = order?.deliveryMan;
    final String riderName = (dm != null && dm.fName != null) ? '${dm.fName} ${dm.lName ?? ''}'.trim() : 'Rohit Kumar';
    final String riderPhone = dm?.phone ?? '';

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
              'Rider Assigned',
              style: robotoBold.copyWith(fontSize: 18, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 2),
            Text(
              'Your order is on the way!',
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
            const SizedBox(height: 24),

            // 2. Rider Circular Profile
            Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 106,
                    height: 106,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.35), width: 3),
                    ),
                  ),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(50),
                    child: Image.asset(
                      Images.riderAvatarPortrait,
                      width: 96,
                      height: 96,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 96,
                        height: 96,
                        color: const Color(0xFFECFDF5),
                        child: const Icon(Icons.person, size: 48, color: Color(0xFF10B981)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Rider Name & Rating
            Text(
              riderName,
              textAlign: TextAlign.center,
              style: robotoBold.copyWith(fontSize: 18, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 18),
                const SizedBox(width: 4),
                Text(
                  '4.8 (320 deliveries)',
                  style: robotoRegular.copyWith(fontSize: 13, color: const Color(0xFF6B7280)),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // 3. Quick Action Buttons Row (Call, Message, Share, Tip)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildCircularActionButton(
                  icon: Icons.phone_outlined,
                  label: 'Call',
                  onTap: () {
                    if (onCallRider != null) {
                      onCallRider!();
                    } else if (riderPhone.isNotEmpty) {
                      launchUrlString('tel:$riderPhone');
                    }
                  },
                ),
                _buildCircularActionButton(
                  icon: Icons.chat_bubble_outline_rounded,
                  label: 'Message',
                  onTap: onOpenChat ?? () {},
                ),
                _buildCircularActionButton(
                  icon: Icons.share_outlined,
                  label: 'Share',
                  onTap: () {},
                ),
                _buildCircularActionButton(
                  icon: Icons.volunteer_activism_outlined,
                  label: 'Tip',
                  onTap: () {},
                ),
              ],
            ),
            const SizedBox(height: 24),

            // 4. Vehicle Details Card
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
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.electric_moped_rounded, color: Color(0xFF374151), size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'DL 01 AB 1234',
                          style: robotoBold.copyWith(fontSize: 15, color: const Color(0xFF111827)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Bajaj Pulsar • Green',
                          style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.asset(
                      Images.greenDeliveryBike,
                      width: 58,
                      height: 48,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(Icons.two_wheeler_rounded, size: 40, color: Color(0xFF10B981)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 5. Estimated Delivery Card
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
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F4F6),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.access_time_rounded, color: Color(0xFF374151), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Estimated Delivery',
                              style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF6B7280)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '12-18 minutes',
                              style: robotoBold.copyWith(fontSize: 16, color: const Color(0xFF111827)),
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
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(0xFF00A651),
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              'Live',
                              style: robotoBold.copyWith(fontSize: 11, color: const Color(0xFF00A651)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Divider(height: 1, color: Color(0xFFF3F4F6)),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Arriving by $formattedDeliveryEstimate',
                      style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF6B7280)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Button to View Map
            CustomButton(
              buttonText: 'View Live Tracking Map  →',
              color: const Color(0xFF00A651),
              radius: 12,
              height: 50,
              onPressed: onOpenLiveMap ?? () {},
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildCircularActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(30),
      child: Column(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFF9FAFB),
              border: Border.all(color: const Color(0xFFE5E7EB)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(icon, color: const Color(0xFF374151), size: 22),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF4B5563)),
          ),
        ],
      ),
    );
  }
}
