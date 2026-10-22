import 'dart:collection';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:sixam_mart/common/controllers/theme_controller.dart';
import 'package:sixam_mart/features/order/controllers/order_controller.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/features/order/widgets/grocery_tracking/grocery_stepper_widget.dart';
import 'package:sixam_mart/helper/marker_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';
import 'package:url_launcher/url_launcher_string.dart';

class Screen4LiveMapTracking extends StatefulWidget {
  final OrderModel? order;
  final VoidCallback? onBack;
  final VoidCallback? onOpenChat;
  final VoidCallback? onCallRider;

  const Screen4LiveMapTracking({
    super.key,
    this.order,
    this.onBack,
    this.onOpenChat,
    this.onCallRider,
  });

  @override
  State<Screen4LiveMapTracking> createState() => _Screen4LiveMapTrackingState();
}

class _Screen4LiveMapTrackingState extends State<Screen4LiveMapTracking> {
  GoogleMapController? _mapController;
  Set<Marker> _markers = HashSet<Marker>();

  @override
  void initState() {
    super.initState();
    _initMapMarkers();
  }

  @override
  void dispose() {
    try {
      _mapController?.dispose();
    } catch (_) {}
    super.dispose();
  }

  void _initMapMarkers() async {
    final order = widget.order;
    if (order == null) return;

    try {
      final results = await Future.wait([
        MarkerHelper.createLabeledMarker(
          label: order.store?.name ?? 'Quick Store Grocery',
          imagePath: Images.restaurantMarkerIcon,
          iconSize: 36,
        ),
        MarkerHelper.createLabeledMarker(
          label: '12 min away',
          imagePath: Images.riderMarkerIcon,
          iconSize: 36,
        ),
        MarkerHelper.createLabeledMarker(
          label: 'Home',
          imagePath: Images.userMarkerIcon,
          iconSize: 36,
        ),
      ]);

      final BitmapDescriptor storeIcon = results[0];
      final BitmapDescriptor dmIcon = results[1];
      final BitmapDescriptor userIcon = results[2];

      final Set<Marker> markers = HashSet<Marker>();

      LatLng? storePos;
      LatLng? destPos;
      LatLng? dmPos;

      if (order.store?.latitude != null && order.store?.longitude != null) {
        storePos = LatLng(double.parse(order.store!.latitude!), double.parse(order.store!.longitude!));
        markers.add(Marker(
          markerId: const MarkerId('store'),
          position: storePos,
          icon: storeIcon,
          infoWindow: InfoWindow(title: order.store!.name ?? 'Store'),
        ));
      }

      if (order.deliveryAddress?.latitude != null && order.deliveryAddress?.longitude != null) {
        destPos = LatLng(double.parse(order.deliveryAddress!.latitude!), double.parse(order.deliveryAddress!.longitude!));
        markers.add(Marker(
          markerId: const MarkerId('destination'),
          position: destPos,
          icon: userIcon,
          infoWindow: const InfoWindow(title: 'Delivery Address'),
        ));
      }

      final String? dmLat = order.deliveryMan?.lat;
      final String? dmLng = order.deliveryMan?.lng;
      if (dmLat != null && dmLng != null && dmLat.isNotEmpty && dmLng.isNotEmpty) {
        dmPos = LatLng(double.parse(dmLat), double.parse(dmLng));
        markers.add(Marker(
          markerId: const MarkerId('delivery_boy'),
          position: dmPos,
          icon: dmIcon,
          infoWindow: const InfoWindow(title: 'Rider: 12 min away'),
        ));

        if (destPos != null) {
          Get.find<OrderController>().getDirectionPolyline(
            origin: dmPos,
            destination: destPos,
          );
        }
      } else if (storePos != null && destPos != null) {
        // If no live rider GPS yet, simulate midpoint
        final midLat = (storePos.latitude + destPos.latitude) / 2;
        final midLng = (storePos.longitude + destPos.longitude) / 2;
        dmPos = LatLng(midLat, midLng);
        markers.add(Marker(
          markerId: const MarkerId('delivery_boy_sim'),
          position: dmPos,
          icon: dmIcon,
          infoWindow: const InfoWindow(title: 'Rider: 12 min away'),
        ));
      }

      if (mounted) {
        setState(() {
          _markers = markers;
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    const List<StepperStepData> steps = [
      StepperStepData(label: 'Confirmed', subtext: '10:24 AM', isCompleted: true),
      StepperStepData(label: 'Preparing', subtext: '10:28 AM', isCompleted: true),
      StepperStepData(label: 'Out for Delivery', subtext: 'Now', isActive: true, isSubtextGreen: true),
      StepperStepData(label: 'Delivered', subtext: ''),
    ];

    final dm = widget.order?.deliveryMan;
    final String riderName = (dm != null && dm.fName != null) ? '${dm.fName} ${dm.lName ?? ''}'.trim() : 'Rohit Kumar';
    final String riderPhone = dm?.phone ?? '';

    final LatLng defaultTarget = LatLng(
      double.tryParse(widget.order?.deliveryAddress?.latitude ?? '') ?? 28.6139,
      double.tryParse(widget.order?.deliveryAddress?.longitude ?? '') ?? 77.2090,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1F2937), size: 20),
          onPressed: widget.onBack ?? () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else if (Get.key.currentState?.canPop() ?? false) {
              Get.back();
            } else {
              Get.offAllNamed(RouteHelper.getInitialRoute());
            }
          },
        ),
        title: Column(
          children: [
            Text(
              'Order on the Way',
              style: robotoBold.copyWith(fontSize: 18, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 2),
            Text(
              '$riderName is on the way to deliver your order',
              style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF6B7280)),
            ),
          ],
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // 1. Stepper banner at top
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: 6),
            child: const GroceryStepperWidget(steps: steps),
          ),

          // 2. Map with floating card
          Expanded(
            child: Stack(
              children: [
                // Google Map
                GetBuilder<OrderController>(builder: (orderController) {
                  return GoogleMap(
                    initialCameraPosition: CameraPosition(target: defaultTarget, zoom: 14),
                    markers: _markers,
                    polylines: orderController.routePolyline.isNotEmpty ? {
                      Polyline(
                        polylineId: const PolylineId('order_route'),
                        points: orderController.routePolyline,
                        color: const Color(0xFF00A651),
                        width: 4,
                      ),
                    } : <Polyline>{},
                    zoomControlsEnabled: false,
                    onMapCreated: (controller) {
                      _mapController = controller;
                    },
                    style: Get.find<ThemeController>().darkTheme
                        ? Get.find<ThemeController>().darkMap
                        : Get.find<ThemeController>().lightMap,
                  );
                }),

                // Floating store pill banner on top of map
                Positioned(
                  top: 14,
                  left: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.storefront_rounded, color: Color(0xFF00A651), size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            widget.order?.store?.name ?? 'Quick Store Grocery, Sector 62, Noida',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: robotoMedium.copyWith(fontSize: 12, color: const Color(0xFF374151)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Floating Rider Bottom Card (matching mockup exactly)
                Positioned(
                  bottom: 20,
                  left: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 20,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Row 1: Rider avatar, name, rating, call, message
                        Row(
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
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: robotoBold.copyWith(fontSize: 15, color: const Color(0xFF111827)),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 16),
                                      const SizedBox(width: 4),
                                      Flexible(
                                        child: Text(
                                          '4.8 (320 deliveries)',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF6B7280)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            // Call button
                            InkWell(
                              onTap: () {
                                if (widget.onCallRider != null) {
                                  widget.onCallRider!();
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
                              onTap: widget.onOpenChat ?? () {},
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
                        const SizedBox(height: 14),
                        const Divider(height: 1, color: Color(0xFFF3F4F6)),
                        const SizedBox(height: 12),

                        // Row 2: Green route indicator & distance
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(0xFFE8F5E9),
                              ),
                              child: const Icon(Icons.navigation_rounded, color: Color(0xFF00A651), size: 16),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Your order is on the way',
                                    style: robotoBold.copyWith(fontSize: 13, color: const Color(0xFF111827)),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '12 minutes • 2.8 km away',
                                    style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF6B7280)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
