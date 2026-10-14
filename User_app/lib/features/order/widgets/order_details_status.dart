part of '../screens/order_details_new_screen.dart';

class _OrderDetailsStatus extends StatelessWidget {
  final OrderModel order;
  final bool ongoing;

  const _OrderDetailsStatus({required this.order, required this.ongoing});

  void _showHistorySheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => OrderStatusHistorySheet(order: order),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isFood = order.moduleType == 'food';
    final showTimer = isFood && ongoing && DateConverter.isBeforeTime(order.scheduleAt)
        && (Get.find<SplashController>().getModuleConfig(order.moduleType).newVariation ?? false);

    final bool isParcel = order.orderType == 'parcel';
    final _StatusContent content = _StatusContent.resolve(order.orderType, order.orderStatus);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: Dimensions.paddingSizeDefault),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Modern 4-Step Stepper (Screen 2 & 3 flow)
          _buildModernStepper(context),

          // 2. Hero Packing Card (Store preparing items)
          if (!isParcel && _isPreparingState(order.orderStatus))
            _buildPreparingHeroCard(context),

          // 3. Store / Hotel Information Card
          if (!isParcel && order.store != null)
            _buildStoreCard(context),

          const SizedBox(height: Dimensions.paddingSizeSmall),

          // 4. Status Details & History Trigger Banner
          Material(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: () => _showHistorySheet(context),
              child: Padding(
                padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
                child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                  SizedBox(
                    width: order.orderStatus == 'pending' || (order.orderStatus == 'processing' && order.moduleType == 'food') ? 80 : 60,
                    height: order.orderStatus == 'pending' || (order.orderStatus == 'processing' && order.moduleType == 'food') ? 80 : 60,
                    child: Image.asset(
                      _StatusBannerImage.resolve(order.moduleType, order.orderStatus),
                      fit: order.orderStatus == 'pending' ? BoxFit.cover : BoxFit.contain,
                    ),
                  ),
                  SizedBox(width: order.orderStatus == 'pending' ? 0 : Dimensions.paddingSizeDefault),

                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      if (showTimer)
                        _RestaurantTimer(order: order)
                      else if (order.orderStatus == 'pending' && !isParcel)
                        const SizedBox.shrink()
                      else
                        Text(
                          content.title,
                          style: robotoBold.copyWith(fontSize: Dimensions.fontSizeExtraLarge),
                        ),

                      const SizedBox(height: Dimensions.paddingSizeExtraSmall),

                      Text(
                        content.sentence,
                        style: robotoRegular.copyWith(
                          fontSize: Dimensions.fontSizeSmall,
                          color: Theme.of(context).disabledColor,
                        ),
                      ),
                    ]),
                  ),

                  Icon(
                    Get.find<LocalizationController>().isLtr ? Icons.arrow_forward : Icons.arrow_back,
                    color: Theme.of(context).primaryColor,
                    size: 20,
                  ),
                ]),
              ),
            ),
          ),
        ],
      ),
    );
  }

  bool _isPreparingState(String? status) {
    return status == 'pending' || status == 'confirmed' || status == 'accepted' || status == 'processing';
  }

  Widget _buildModernStepper(BuildContext context) {
    int currentStep = 1;
    switch (order.orderStatus) {
      case 'pending':
        currentStep = 0;
        break;
      case 'confirmed':
      case 'accepted':
        currentStep = 1;
        break;
      case 'processing':
        currentStep = 1;
        break;
      case 'handover':
      case 'picked_up':
        currentStep = 2;
        break;
      case 'delivered':
        currentStep = 3;
        break;
      default:
        currentStep = 1;
    }

    String confirmedTime = '';
    if (order.createdAt != null) {
      try {
        confirmedTime = DateFormat('hh:mm a').format(DateTime.parse(order.createdAt!).toLocal());
      } catch (_) {}
    }

    final steps = [
      {'title': 'Confirmed', 'time': confirmedTime.isNotEmpty ? confirmedTime : 'Placed'},
      {'title': 'Preparing', 'time': currentStep == 1 ? 'Now' : (currentStep > 1 ? 'Done' : '')},
      {'title': 'Out for Delivery', 'time': currentStep == 2 ? 'Now' : (currentStep > 2 ? 'Done' : '')},
      {'title': 'Delivered', 'time': currentStep == 3 ? 'Done' : ''},
    ];

    return Container(
      margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).disabledColor.withValues(alpha: 0.14)),
      ),
      child: Row(
        children: [
          for (int i = 0; i < steps.length; i++) ...[
            Expanded(
              child: Column(
                children: [
                  // Circle and Line Row
                  Row(
                    children: [
                      // Left line
                      Expanded(
                        child: Container(
                          height: 2,
                          color: i == 0 ? Colors.transparent : (currentStep >= i ? const Color(0xFF10B981) : Colors.grey.shade300),
                        ),
                      ),
                      // Step Circle
                      _buildStepCircle(i, currentStep),
                      // Right line
                      Expanded(
                        child: Container(
                          height: 2,
                          color: i == steps.length - 1 ? Colors.transparent : (currentStep > i ? const Color(0xFF10B981) : Colors.grey.shade300),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Step Title
                  Text(
                    steps[i]['title']!,
                    style: robotoMedium.copyWith(
                      fontSize: 10.5,
                      color: currentStep >= i ? Theme.of(context).textTheme.bodyLarge?.color : Theme.of(context).disabledColor,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),

                  // Step Time or "Now"
                  if (steps[i]['time']!.isNotEmpty)
                    Text(
                      steps[i]['time']!,
                      style: robotoRegular.copyWith(
                        fontSize: 9.5,
                        color: steps[i]['time'] == 'Now' ? const Color(0xFF10B981) : Theme.of(context).disabledColor,
                        fontWeight: steps[i]['time'] == 'Now' ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStepCircle(int index, int currentStep) {
    if (currentStep > index) {
      // Completed step
      return Container(
        width: 20,
        height: 20,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: Color(0xFF10B981),
        ),
        child: const Icon(Icons.check_rounded, color: Colors.white, size: 14),
      );
    } else if (currentStep == index) {
      // Current active step
      return Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0xFF10B981),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF10B981).withValues(alpha: 0.35),
              blurRadius: 6,
              spreadRadius: 2,
            ),
          ],
        ),
        child: const Icon(Icons.check_rounded, color: Colors.white, size: 14),
      );
    } else {
      // Pending step
      return Container(
        width: 18,
        height: 18,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.grey.shade400, width: 1.5),
          color: Colors.white,
        ),
        child: Center(
          child: Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.grey.shade400,
            ),
          ),
        ),
      );
    }
  }

  Widget _buildPreparingHeroCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE8F5E9), Color(0xFFF1F8E9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFC8E6C9)),
      ),
      child: Row(
        children: [
          Image.asset(
            Images.trackOrderPreparing,
            width: 70,
            height: 70,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) => Image.asset(
              Images.preparingGroceryOrderDetails,
              width: 70,
              height: 70,
              fit: BoxFit.contain,
              errorBuilder: (ctx, err, stack) => const Icon(Icons.inventory_2_rounded, size: 48, color: Color(0xFF2E7D32)),
            ),
          ),
          const SizedBox(width: Dimensions.paddingSizeDefault),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Your order is being prepared',
                  style: robotoBold.copyWith(fontSize: 15, color: const Color(0xFF1B5E20)),
                ),
                const SizedBox(height: 4),
                Text(
                  'The store is picking and packing your items with care.',
                  style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF2E7D32)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStoreCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).disabledColor.withValues(alpha: 0.16)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: CustomImage(
              image: order.store!.logoFullUrl ?? '',
              height: 46,
              width: 46,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: Dimensions.paddingSizeSmall),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order.store!.name ?? '',
                  style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  order.store!.address ?? '',
                  style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).disabledColor),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          if (order.store!.phone != null && order.store!.phone!.isNotEmpty)
            InkWell(
              onTap: () async {
                final phone = order.store!.phone!;
                if (await canLaunchUrlString('tel:$phone')) {
                  await launchUrlString('tel:$phone', mode: LaunchMode.externalApplication);
                }
              },
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.phone_rounded, color: Color(0xFF10B981), size: 18),
              ),
            ),
        ],
      ),
    );
  }
}

class _RestaurantTimer extends StatelessWidget {
  final OrderModel order;

  const _RestaurantTimer({required this.order});

  @override
  Widget build(BuildContext context) {
    final minutes = DateConverter.differenceInMinute(
      order.store!.deliveryTime,
      order.createdAt,
      order.processingTime,
      order.scheduleAt,
    );
    final range = minutes < 5 ? '1 - 5' : '${minutes - 5} - $minutes';

    return Text(
      "$range ${'mins'.tr}".capitalize!,
      style: robotoBold.copyWith(fontSize: Dimensions.fontSizeExtraLarge),
      textDirection: TextDirection.ltr,
    );
  }
}

class _StatusBannerImage {
  static String resolve(String? moduleType, String? status) {
    print('==========>> status: [$status],  moduleType: [$moduleType] <<==========');

    if (status == 'pending') {
      return Images.pendingOrderDetails;
    } else if (status == 'confirmed' || status == 'accepted') {
      return Images.confirmedGif;
    } else if (status == 'processing') {
      if (moduleType == 'food') {
        return Images.preparingFoodOrderDetails;
      } else if (moduleType == 'grocery') {
        return Images.preparingGroceryOrderDetails;
      } else {
        return Images.processingGif;
      }
    } else if (status == 'handover' || status == 'picked_up') {
      return Images.onTheWayGif;
    } else if (status == 'delivered') {
      return Images.taxiCompletedGif;
    } else if (status == 'canceled') {
      return Images.cancelGif;
    } else if (status == 'failed') {
      return Images.unverifiedIcon;
    }

    return Images.ongoingAnimation;
  }
}

class _StatusContent {
  final String title;
  final String sentence;
  const _StatusContent({required this.title, required this.sentence});

  static _StatusContent resolve(String? orderType, String? status) {
    if (orderType == 'parcel') {
      return _StatusContent(title: _parcelTitle(status), sentence: _parcelSentence(status));
    }
    return _StatusContent(title: _StatusTitle.resolve(status), sentence: _StatusSentence.resolve(status));
  }

  static String _parcelTitle(String? status) {
    switch (status) {
      case 'pending':
        return 'request_placed'.tr;
      case 'delivered':
        return 'delivered'.tr;
      case 'canceled':
        return 'request_cancelled'.tr;
      case 'failed':
        return 'order_cancelled'.tr;
      default:
        return (status ?? '').tr;
    }
  }

  static String _parcelSentence(String? status) {
    switch (status) {
      case 'pending':
        return 'we_are_processing_your_request_confirmation_coming_soon'.tr;
      case 'confirmed':
      case 'accepted':
      case 'processing':
      case 'handover':
        return 'your_request_is_confirmed_a_rider_will_pick_it_up_soon'.tr;
      case 'picked_up':
      case 'out_for_delivery':
        return 'your_parcel_is_on_the_way_to_the_destination'.tr;
      case 'delivered':
        return 'reached_your_destination_thanks_for_choosing'.tr;
      case 'canceled':
        return 'your_delivery_request_has_been_cancelled'.tr;
      case 'failed':
        return 'order_cancelled'.tr;
      default:
        return (status ?? '').tr;
    }
  }
}

class _StatusTitle {
  static String resolve(String? status) {
    if (status == 'delivered') return 'order_delivered'.tr;
    return (status ?? '').tr;
  }
}

class _StatusSentence {
  static String resolve(String? status) {
    switch (status) {
      case 'pending':
        return 'your_order_has_been_placed_waiting_for_confirmation'.tr;
      case 'confirmed':
      case 'accepted':
      case 'processing':
      case 'handover':
        return 'your_order_is_confirmed_and_being_prepared'.tr;
      case 'picked_up':
        return 'order_picked_up_on_the_way'.tr;
      case 'delivered':
        return 'enjoy_your_food'.tr;
      case 'canceled':
      case 'failed':
        return 'order_cancelled'.tr;
      default:
        return (status ?? '').tr;
    }
  }
}
