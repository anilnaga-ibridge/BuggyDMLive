import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/features/chat/domain/models/conversation_model.dart';
import 'package:sixam_mart/features/notification/domain/models/notification_body_model.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';
import 'package:url_launcher/url_launcher_string.dart';

class DeliveryManSection extends StatelessWidget {
  final OrderModel order;

  const DeliveryManSection({super.key, required this.order});

  Future<void> _call() async {
    final phone = order.deliveryMan?.phone;
    if (phone == null || phone.isEmpty) {
      showCustomSnackBar('${'can_not_launch'.tr} -');
      return;
    }
    if (await canLaunchUrlString('tel:$phone')) {
      await launchUrlString('tel:$phone', mode: LaunchMode.externalApplication);
    } else {
      showCustomSnackBar('${'can_not_launch'.tr} $phone');
    }
  }

  Future<void> _chat() async {
    final dm = order.deliveryMan;
    if (dm == null) return;
    await Get.toNamed(RouteHelper.getChatRoute(
      notificationBody: NotificationBodyModel(deliverymanId: dm.id, orderId: int.tryParse(order.id.toString())),
      user: User(id: dm.id, fName: dm.fName, lName: dm.lName, imageFullUrl: dm.imageFullUrl),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final deliveryMan = order.deliveryMan!;
    final name = '${deliveryMan.fName ?? ''} ${deliveryMan.lName ?? ''}'.trim();
    final disabled = Theme.of(context).disabledColor;

    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).disabledColor.withValues(alpha: 0.16)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Delivery Partner Assigned',
                style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault, color: Theme.of(context).textTheme.bodyLarge?.color),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 6, height: 6, decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF10B981))),
                    const SizedBox(width: 4),
                    Text(
                      'Live',
                      style: robotoMedium.copyWith(fontSize: 11, color: const Color(0xFF166534)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: Dimensions.paddingSizeSmall),

          // Rider Profile Row
          Row(
            children: [
              // Avatar with green border
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF10B981), width: 2),
                ),
                child: ClipOval(
                  child: CustomImage(
                    image: deliveryMan.imageFullUrl ?? '',
                    height: 48,
                    width: 48,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(width: Dimensions.paddingSizeSmall),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name.isEmpty ? 'Delivery Partner' : name.capitalize!,
                      style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Colors.amber, size: 16),
                        const SizedBox(width: 2),
                        Text(
                          (deliveryMan.avgRating ?? 4.8).toStringAsFixed(1),
                          style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '(${deliveryMan.ratingCount ?? 120} deliveries)',
                          style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeExtraSmall, color: disabled),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Action buttons: Call & Message
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _actionButton(
                    icon: Icons.phone_rounded,
                    color: const Color(0xFF10B981),
                    onTap: _call,
                  ),
                  const SizedBox(width: 8),
                  _actionButton(
                    icon: Icons.chat_bubble_rounded,
                    color: Theme.of(context).primaryColor,
                    onTap: _chat,
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: Dimensions.paddingSizeSmall),
          Divider(height: 16, thickness: 1, color: Theme.of(context).dividerColor.withValues(alpha: 0.08)),

          // Vehicle & ETA Info Row
          Row(
            children: [
              Icon(Icons.two_wheeler_rounded, size: 18, color: Theme.of(context).disabledColor),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Bajaj Pulsar • Active Rider',
                  style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: disabled),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFF10B981)),
                  const SizedBox(width: 4),
                  Text(
                    '12-18 mins away',
                    style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: const Color(0xFF10B981)),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _actionButton({required IconData icon, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 18),
      ),
    );
  }
}
