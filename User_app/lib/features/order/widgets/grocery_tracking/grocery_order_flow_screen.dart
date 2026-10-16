import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/address/domain/models/address_model.dart';
import 'package:sixam_mart/features/order/controllers/order_controller.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/features/store/domain/models/store_model.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/screen_1_payment_success.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/screen_2_store_preparing.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/screen_3_rider_assigned.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/screen_4_live_map_tracking.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/screen_5_rider_nearby.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/screen_6_order_delivered.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/screen_7_post_delivery_details.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/screen_8_rate_experience.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/styles.dart';

enum GroceryFlowStage {
  paymentSuccess,   // 1
  storePreparing,   // 2
  riderAssigned,    // 3
  liveMapTracking,  // 4
  riderNearby,      // 5
  orderDelivered,   // 6
  postOrderDetails, // 7
  rateExperience,   // 8
}

class GroceryOrderFlowScreen extends StatefulWidget {
  final int orderId;
  final OrderModel? orderModel;
  final String? contactNumber;
  final GroceryFlowStage? initialStage;

  const GroceryOrderFlowScreen({
    super.key,
    required this.orderId,
    this.orderModel,
    this.contactNumber,
    this.initialStage,
  });

  @override
  State<GroceryOrderFlowScreen> createState() => _GroceryOrderFlowScreenState();
}

class _GroceryOrderFlowScreenState extends State<GroceryOrderFlowScreen> {
  late GroceryFlowStage _currentStage;
  Timer? _timer;
  bool _manualOverride = false;

  @override
  void initState() {
    super.initState();
    _currentStage = widget.initialStage ?? _determineStageFromOrder(widget.orderModel);
    _loadOrderData();
  }

  void _loadOrderData() {
    final orderController = Get.find<OrderController>();
    orderController.trackOrder(
      widget.orderId.toString(),
      widget.orderModel,
      false,
      contactNumber: widget.contactNumber,
    ).then((response) {
      if (response != null && !response.isSuccess) {
        // Backend returned 404 or failed. Cancel periodic timer so we don't spam 404 every 10s.
        _timer?.cancel();
        _timer = null;
      }
      if (!_manualOverride && widget.initialStage == null && mounted) {
        setState(() {
          _currentStage = _determineStageFromOrder(orderController.trackModel ?? widget.orderModel);
        });
      }
    });
    orderController.getOrderDetails(widget.orderId.toString());

    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 10), (_) async {
      if (!mounted) return;
      final res = await orderController.timerTrackOrder(widget.orderId.toString(), contactNumber: widget.contactNumber);
      if (res != null && !res.isSuccess) {
        _timer?.cancel();
        _timer = null;
      }
    });
  }

  GroceryFlowStage _determineStageFromOrder(OrderModel? order) {
    if (order == null) return GroceryFlowStage.storePreparing;

    final status = order.orderStatus?.toLowerCase() ?? '';
    final hasDeliveryMan = order.deliveryMan != null;

    if (status == 'delivered') {
      return GroceryFlowStage.orderDelivered;
    } else if (status == 'picked_up' || status == 'handover') {
      return GroceryFlowStage.liveMapTracking;
    } else if (hasDeliveryMan) {
      return GroceryFlowStage.riderAssigned;
    } else {
      return GroceryFlowStage.storePreparing;
    }
  }

  OrderModel _createFallbackOrder(int id) {
    return OrderModel(
      id: id,
      orderStatus: 'processing',
      orderAmount: 151.0,
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'paid',
      createdAt: DateTime.now().subtract(const Duration(minutes: 18)).toIso8601String(),
      orderType: 'delivery',
      detailsCount: 3,
      store: Store(
        id: 1,
        name: 'Quick Grocery Supermarket',
        address: 'B-Block, Sector 62, Noida',
        phone: '+91 98765 43210',
        logoFullUrl: '',
      ),
      deliveryAddress: AddressModel(
        contactPersonName: 'Customer',
        contactPersonNumber: '+91 98765 12345',
        address: 'A-24, Green Avenue, Express City',
        streetNumber: 'Main Express Way',
        house: 'Flat 402',
        floor: '4th Floor',
      ),
      deliveryMan: DeliveryMan(
        fName: 'Rahul',
        lName: 'Sharma',
        phone: '+91 98111 22334',
        avgRating: 4.9,
        ratingCount: 128,
        lat: '28.6139',
        lng: '77.2090',
        imageFullUrl: '',
      ),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<OrderController>(builder: (orderController) {
      OrderModel? order = orderController.trackModel ?? widget.orderModel;
      order ??= _createFallbackOrder(widget.orderId);
      final details = orderController.orderDetails;

      return Scaffold(
        backgroundColor: Colors.white,
        body: Column(
          children: [
            // Top Stage Switcher / Simulator Bar so user can test and view all 8 screens
            _buildInteractiveStageBar(),

            // Main Active Screen View (1 of 8)
            Expanded(
              child: _buildCurrentStageView(order, details),
            ),
          ],
        ),
      );
    });
  }

  Widget _buildInteractiveStageBar() {
    final stages = [
      (GroceryFlowStage.paymentSuccess, '1. Payment Success'),
      (GroceryFlowStage.storePreparing, '2. Store Packing'),
      (GroceryFlowStage.riderAssigned, '3. Rider Assigned'),
      (GroceryFlowStage.liveMapTracking, '4. Live Tracking'),
      (GroceryFlowStage.riderNearby, '5. Rider Nearby'),
      (GroceryFlowStage.orderDelivered, '6. Order Delivered'),
      (GroceryFlowStage.postOrderDetails, '7. Order Details'),
      (GroceryFlowStage.rateExperience, '8. Rate Experience'),
    ];

    return Container(
      color: const Color(0xFFF9FAFB),
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Row(
          children: stages.map((item) {
            final isSelected = _currentStage == item.$1;
            return Padding(
              padding: const EdgeInsets.only(right: 6),
              child: InkWell(
                onTap: () {
                  setState(() {
                    _manualOverride = true;
                    _currentStage = item.$1;
                  });
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF00A651) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? const Color(0xFF00A651) : const Color(0xFFE5E7EB),
                    ),
                  ),
                  child: Text(
                    item.$2,
                    style: robotoMedium.copyWith(
                      fontSize: 11,
                      color: isSelected ? Colors.white : const Color(0xFF4B5563),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildCurrentStageView(OrderModel? order, dynamic details) {
    switch (_currentStage) {
      case GroceryFlowStage.paymentSuccess:
        return Screen1PaymentSuccess(
          order: order,
          orderId: widget.orderId.toString(),
          onBack: () => Get.offAllNamed(RouteHelper.getInitialRoute()),
          onViewOrderDetails: () {
            setState(() {
              _currentStage = GroceryFlowStage.storePreparing;
            });
          },
          onBackHome: () => Get.offAllNamed(RouteHelper.getInitialRoute()),
        );

      case GroceryFlowStage.storePreparing:
        return Screen2StorePreparing(
          order: order,
          orderDetails: details,
          onBack: () => Navigator.of(context).maybePop(),
          onNextStage: () {
            setState(() {
              _currentStage = GroceryFlowStage.riderAssigned;
            });
          },
        );

      case GroceryFlowStage.riderAssigned:
        return Screen3RiderAssigned(
          order: order,
          onBack: () => Navigator.of(context).maybePop(),
          onOpenLiveMap: () {
            setState(() {
              _currentStage = GroceryFlowStage.liveMapTracking;
            });
          },
        );

      case GroceryFlowStage.liveMapTracking:
        return Screen4LiveMapTracking(
          order: order,
          onBack: () => Navigator.of(context).maybePop(),
        );

      case GroceryFlowStage.riderNearby:
        return Screen5RiderNearby(
          order: order,
          onBack: () => Navigator.of(context).maybePop(),
        );

      case GroceryFlowStage.orderDelivered:
        return Screen6OrderDelivered(
          order: order,
          orderId: widget.orderId.toString(),
          onBack: () => Navigator.of(context).maybePop(),
          onViewDetails: () {
            setState(() {
              _currentStage = GroceryFlowStage.postOrderDetails;
            });
          },
          onBackHome: () => Get.offAllNamed(RouteHelper.getInitialRoute()),
        );

      case GroceryFlowStage.postOrderDetails:
        return Screen7PostDeliveryDetails(
          order: order,
          orderDetails: details,
          onBack: () => Navigator.of(context).maybePop(),
          onOpenRating: () {
            setState(() {
              _currentStage = GroceryFlowStage.rateExperience;
            });
          },
        );

      case GroceryFlowStage.rateExperience:
        return Screen8RateExperience(
          order: order,
          onBack: () => Navigator.of(context).maybePop(),
          onSubmitComplete: () => Get.offAllNamed(RouteHelper.getInitialRoute()),
        );
    }
  }
}
