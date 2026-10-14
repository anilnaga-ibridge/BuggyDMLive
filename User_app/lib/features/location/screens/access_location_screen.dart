import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/services.dart';
import 'package:sixam_mart/common/widgets/address_widget.dart';
import 'package:sixam_mart/common/widgets/no_internet_screen.dart';
import 'package:sixam_mart/features/location/controllers/location_controller.dart';
import 'package:sixam_mart/features/address/controllers/address_controller.dart';
import 'package:sixam_mart/features/address/domain/models/address_model.dart';
import 'package:sixam_mart/features/location/domain/models/zone_response_model.dart';
import 'package:sixam_mart/helper/address_helper.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';
import 'package:sixam_mart/common/widgets/custom_app_bar.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:sixam_mart/common/widgets/custom_loader.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/common/widgets/footer_view.dart';
import 'package:sixam_mart/common/widgets/menu_drawer.dart';
import 'package:sixam_mart/common/widgets/no_data_screen.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/location/screens/pick_map_screen.dart';

class AccessLocationScreen extends StatefulWidget {
  final bool fromSignUp;
  final bool fromHome;
  final String? route;
  const AccessLocationScreen({super.key, required this.fromSignUp, required this.fromHome, required this.route});

  @override
  State<AccessLocationScreen> createState() => _AccessLocationScreenState();
}

class _AccessLocationScreenState extends State<AccessLocationScreen> {
  bool _canExit = GetPlatform.isWeb ? true : false;

  @override
  void initState() {
    super.initState();

    if(AuthHelper.isLoggedIn()) {
      Get.find<AddressController>().getAddressList();
    }

    checkInternet();
  }

  void checkInternet() async {
    final List<ConnectivityResult> connectivityResult = await (Connectivity().checkConnectivity());
    bool isConnected = connectivityResult.contains(ConnectivityResult.wifi) || connectivityResult.contains(ConnectivityResult.mobile);
    if(!isConnected) {
      Get.offAll(()=> const NoInternetScreen());
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, result) async {
        if (_canExit) {
          if (GetPlatform.isAndroid) {
            SystemNavigator.pop();
          } else if (GetPlatform.isIOS) {
            exit(0);
          } else {
            Navigator.pushNamed(context, RouteHelper.getInitialRoute());
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('back_press_again_to_exit'.tr, style: const TextStyle(color: Colors.white)),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
            margin: const EdgeInsets.all(Dimensions.paddingSizeSmall),
          ));
          _canExit = true;
          Timer(const Duration(seconds: 2), () {
            _canExit = false;
          });
        }
      },
      child: Scaffold(
        appBar: CustomAppBar(title: 'set_location'.tr, backButton: widget.fromHome),
        endDrawer: const MenuDrawer(),
        endDrawerEnableOpenDragGesture: false,
        backgroundColor: Theme.of(context).colorScheme.surface,
        body: SafeArea(
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Theme.of(context).colorScheme.surface,
                  Theme.of(context).cardColor.withValues(alpha: 0.8),
                  Theme.of(context).primaryColor.withValues(alpha: 0.04),
                ],
              ),
            ),
            child: Padding(
              padding: ResponsiveHelper.isDesktop(context)
                  ? EdgeInsets.zero
                  : const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
              child: GetBuilder<AddressController>(builder: (locationController) {
                bool isLoggedIn = AuthHelper.isLoggedIn();
                return isLoggedIn
                    ? Column(children: [
                        Expanded(
                          child: SingleChildScrollView(
                            child: FooterView(
                              child: Column(
                                mainAxisAlignment: (locationController.addressList != null &&
                                        locationController.addressList!.isNotEmpty)
                                    ? MainAxisAlignment.start
                                    : MainAxisAlignment.center,
                                children: [
                                  const SizedBox(height: Dimensions.paddingSizeLarge),
                                  locationController.addressList != null
                                      ? locationController.addressList!.isNotEmpty
                                          ? ListView.builder(
                                              physics: const NeverScrollableScrollPhysics(),
                                              shrinkWrap: true,
                                              itemCount: locationController.addressList!.length,
                                              itemBuilder: (context, index) {
                                                return Center(
                                                  child: SizedBox(
                                                    width: 700,
                                                    child: AddressWidget(
                                                      address: locationController.addressList![index],
                                                      fromAddress: false,
                                                      onTap: () {
                                                        Get.dialog(const CustomLoaderWidget(), barrierDismissible: false);
                                                        AddressModel address = locationController.addressList![index];
                                                        Get.find<LocationController>().saveAddressAndNavigate(
                                                          address, widget.fromSignUp, widget.route, widget.route != null, ResponsiveHelper.isDesktop(context),
                                                        );
                                                      },
                                                    ),
                                                  ),
                                                );
                                              },
                                            )
                                          : NoDataScreen(text: 'no_saved_address_found'.tr)
                                      : const Center(child: CircularProgressIndicator()),
                                  const SizedBox(height: Dimensions.paddingSizeLarge),
                                  ResponsiveHelper.isDesktop(context)
                                      ? BottomButton(fromSignUp: widget.fromSignUp, route: widget.route)
                                      : const SizedBox(),
                                ],
                              ),
                            ),
                          ),
                        ),
                        ResponsiveHelper.isDesktop(context)
                            ? const SizedBox()
                            : BottomButton(fromSignUp: widget.fromSignUp, route: widget.route),
                      ])
                    : Center(
                        child: SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          child: FooterView(
                            child: SizedBox(
                              width: 640,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: Dimensions.paddingSizeExtraLarge,
                                  horizontal: Dimensions.paddingSizeSmall,
                                ),
                                child: _LuxuryLocationHero(
                                  fromSignUp: widget.fromSignUp,
                                  route: widget.route,
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _LuxuryLocationHero extends StatelessWidget {
  final bool fromSignUp;
  final String? route;

  const _LuxuryLocationHero({super.key,
    required this.fromSignUp, this.route,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingSizeExtraLarge),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black.withValues(alpha: 0.4) : const Color(0x0F0F172A),
            blurRadius: 36,
            offset: const Offset(0, 18),
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Ambient Glowing Hero Illustration
          _IllustrationContainer(isDark: isDark),
          const SizedBox(height: Dimensions.paddingSizeLarge),

          // Luxury Headline
          Text(
            'find_stores_and_items'.tr,
            textAlign: TextAlign.center,
            style: robotoBold.copyWith(
              fontSize: 22,
              letterSpacing: -0.5,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
              height: 1.25,
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeSmall),

          // Subtitle description
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
            child: Text(
              'by_allowing_location_access'.tr,
              textAlign: TextAlign.center,
              style: robotoRegular.copyWith(
                fontSize: 14,
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeDefault),

          // Feature highlights / trust badges
          const _FeatureBadgesRow(),
          const SizedBox(height: Dimensions.paddingSizeExtraLarge),

          // Action Buttons
          BottomButton(fromSignUp: fromSignUp, route: route),
        ],
      ),
    );
  }
}

class _IllustrationContainer extends StatelessWidget {
  final bool isDark;
  const _IllustrationContainer({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Outer ambient glow ring
        Container(
          width: 220,
          height: 220,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                Theme.of(context).primaryColor.withValues(alpha: 0.16),
                Theme.of(context).primaryColor.withValues(alpha: 0.04),
                Colors.transparent,
              ],
              stops: const [0.3, 0.7, 1.0],
            ),
          ),
        ),

        // Inner circular backdrop
        Container(
          width: 175,
          height: 175,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
            border: Border.all(
              color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Theme.of(context).primaryColor.withValues(alpha: 0.10),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipOval(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Image.asset(
                Images.deliveryLocation,
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),

        // Floating luxury badge at top right
        Positioned(
          top: 14,
          right: 32,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: Theme.of(context).primaryColor.withValues(alpha: 0.25),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.gps_fixed_rounded,
                  size: 13,
                  color: Theme.of(context).primaryColor,
                ),
                const SizedBox(width: 4),
                Text(
                  'GPS Ready',
                  style: robotoMedium.copyWith(
                    fontSize: 11,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _FeatureBadgesRow extends StatelessWidget {
  const _FeatureBadgesRow();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      alignment: WrapAlignment.center,
      children: const [
        _FeatureBadge(icon: Icons.bolt_rounded, label: 'Instant Dispatch'),
        _FeatureBadge(icon: Icons.storefront_rounded, label: 'Curated Stores'),
        _FeatureBadge(icon: Icons.verified_rounded, label: 'Live Tracking'),
      ],
    );
  }
}

class _FeatureBadge extends StatelessWidget {
  final IconData icon;
  final String label;

  const _FeatureBadge({super.key,
    required this.icon, required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 14,
            color: Theme.of(context).primaryColor,
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: robotoMedium.copyWith(
              fontSize: 11,
              color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
            ),
          ),
        ],
      ),
    );
  }
}

class BottomButton extends StatelessWidget {
  final bool fromSignUp;
  final String? route;
  const BottomButton({super.key, required this.fromSignUp, required this.route});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Center(
      child: SizedBox(
        width: 700,
        child: Column(
          children: [
            // Primary Action Button (Use Current Location)
            Container(
              height: 52,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: LinearGradient(
                  colors: [
                    theme.primaryColor,
                    theme.primaryColor.withValues(alpha: 0.88),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: theme.primaryColor.withValues(alpha: 0.35),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () async {
                    Get.find<LocationController>().checkPermission(() async {
                      Get.dialog(const CustomLoaderWidget(), barrierDismissible: false);
                      AddressModel address = await Get.find<LocationController>().getCurrentLocation(true);
                      ZoneResponseModel response = await Get.find<LocationController>().getZone(address.latitude, address.longitude, false);
                      if (response.isSuccess) {
                        Get.find<LocationController>().saveAddressAndNavigate(
                          address, fromSignUp, route, route != null, ResponsiveHelper.isDesktop(Get.context),
                        );
                      } else {
                        Get.back();
                        if (ResponsiveHelper.isDesktop(Get.context)) {
                          showGeneralDialog(context: Get.context!, pageBuilder: (_, __, ___) {
                            return SizedBox(
                              height: 300,
                              width: 300,
                              child: PickMapScreen(
                                fromSignUp: fromSignUp,
                                canRoute: route != null,
                                fromAddAddress: false,
                                route: route ?? RouteHelper.accessLocation,
                              ),
                            );
                          });
                        } else {
                          Get.toNamed(RouteHelper.getPickMapRoute(route ?? RouteHelper.accessLocation, route != null));
                          showCustomSnackBar('service_not_available_in_current_location'.tr);
                        }
                      }
                    });
                  },
                  child: Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.my_location_rounded,
                            color: Colors.white,
                            size: 17,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'user_current_location'.tr,
                          style: robotoBold.copyWith(
                            color: Colors.white,
                            fontSize: 15,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: Dimensions.paddingSizeDefault),

            // Secondary Action Button (Set From Map)
            Container(
              height: 50,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () {
                    if (ResponsiveHelper.isDesktop(Get.context)) {
                      showGeneralDialog(context: Get.context!, pageBuilder: (_, __, ___) {
                        return SizedBox(
                          height: 300,
                          width: 300,
                          child: PickMapScreen(
                            fromSignUp: fromSignUp,
                            canRoute: route != null,
                            fromAddAddress: false,
                            route: route ?? RouteHelper.accessLocation,
                          ),
                        );
                      });
                    } else {
                      Get.toNamed(RouteHelper.getPickMapRoute(
                        route ?? (fromSignUp ? RouteHelper.signUp : RouteHelper.accessLocation),
                        route != null,
                      ));
                    }
                  },
                  child: Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.map_outlined,
                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF334155),
                          size: 19,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'set_from_map'.tr,
                          style: robotoSemiBold.copyWith(
                            color: isDark ? Colors.white : const Color(0xFF1E293B),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

