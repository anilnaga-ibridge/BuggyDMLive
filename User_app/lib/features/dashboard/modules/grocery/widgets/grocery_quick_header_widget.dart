import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/location/controllers/location_controller.dart';
import 'package:sixam_mart/features/profile/controllers/profile_controller.dart';
import 'package:sixam_mart/features/wallet/screens/wallet_screen.dart';
import 'package:sixam_mart/helper/address_helper.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/common/widgets/cart_widget.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryQuickHeaderWidget extends StatelessWidget {
  const GroceryQuickHeaderWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final cxp = context.cxpTheme;
    return Container(
      padding: EdgeInsets.fromLTRB(
        cxp.spacingMd,
        Dimensions.paddingSizeSmall,
        cxp.spacingMd,
        Dimensions.paddingSizeExtraSmall,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left: Delivery Speed Pill & Location
          Expanded(
            child: GetBuilder<LocationController>(
              builder: (locationController) {
                final address = AddressHelper.getUserAddressFromSharedPref();
                final String addressText = address?.address?.trim().isNotEmpty ?? false
                    ? address!.address!
                    : 'select_your_location'.tr;
                final String cityTitle = (address?.address != null && address!.address!.contains(','))
                    ? address.address!.split(',').first.trim()
                    : '8-10 minutes';

                return InkWell(
                  onTap: () => locationController.navigateToLocationScreen('home'),
                  borderRadius: BorderRadius.circular(cxp.radiusSm),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // City / Delivery speed headline with chevron
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.bolt_rounded,
                            color: Color(0xFFFFB800),
                            size: 20,
                          ),
                          const SizedBox(width: 2),
                          Flexible(
                            child: Text(
                              cityTitle,
                              style: robotoBold.copyWith(
                                fontSize: 17,
                                color: Colors.white,
                                letterSpacing: -0.3,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 3),
                          const Icon(
                            Icons.keyboard_arrow_right_rounded,
                            size: 20,
                            color: Colors.white,
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),

                      // Location subtitle
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              addressText,
                              style: robotoRegular.copyWith(
                                fontSize: 12,
                                color: Colors.white.withValues(alpha: 0.82),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 3),
                          Icon(
                            Icons.keyboard_arrow_down_rounded,
                            size: 16,
                            color: Colors.white.withValues(alpha: 0.82),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          const SizedBox(width: Dimensions.paddingSizeSmall),

          // Right: Wallet Pill & Profile Avatar
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Wallet Chip (Vibrant purple pill)
              GetBuilder<ProfileController>(
                builder: (profileController) {
                  final double walletBalance = profileController.userInfoModel?.walletBalance ?? 0.0;
                  return InkWell(
                    onTap: () {
                      if (AuthHelper.isLoggedIn()) {
                        Get.to(() => const WalletScreen());
                      } else {
                        Get.toNamed(RouteHelper.getSignInRoute(RouteHelper.main));
                      }
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF380B42),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF8B5CF6), width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF8B5CF6).withValues(alpha: 0.25),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(3),
                            decoration: const BoxDecoration(
                              color: Color(0xFF581C87),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.account_balance_wallet_rounded,
                              size: 12,
                              color: Color(0xFFC084FC),
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            PriceConverter.convertPrice(walletBalance),
                            style: robotoBold.copyWith(
                              fontSize: 13,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(width: 8),

              // Cart Button with dynamic badge
              InkWell(
                onTap: () => Get.toNamed(RouteHelper.getCartRoute()),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFF20000C),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: CartWidget(size: 18, color: Colors.white),
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // Profile Avatar Button
              InkWell(
                onTap: () => Get.toNamed(RouteHelper.getProfileRoute()),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFF20000C),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.person_rounded,
                    size: 20,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
