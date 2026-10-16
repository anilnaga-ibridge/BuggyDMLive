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
    final Color headerBg = cxp.gradientFrom;
    final bool isDarkHeader = headerBg.computeLuminance() < 0.55;
    final Color titleColor = isDarkHeader ? Colors.white : cxp.textPrimary;
    final Color subtitleColor = isDarkHeader ? Colors.white.withValues(alpha: 0.85) : cxp.textSecondary;
    final Color iconColor = isDarkHeader ? Colors.white : cxp.textPrimary;

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
                          Icon(
                            Icons.bolt_rounded,
                            color: cxp.accent != Colors.transparent ? cxp.accent : const Color(0xFFFFB800),
                            size: 20,
                          ),
                          const SizedBox(width: 2),
                          Flexible(
                            child: Text(
                              cityTitle,
                              style: robotoBold.copyWith(
                                fontSize: 17,
                                color: titleColor,
                                letterSpacing: -0.3,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 3),
                          Icon(
                            Icons.keyboard_arrow_right_rounded,
                            size: 20,
                            color: titleColor,
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
                                color: subtitleColor,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 3),
                          Icon(
                            Icons.keyboard_arrow_down_rounded,
                            size: 16,
                            color: subtitleColor,
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
              // Wallet Chip
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
                        color: isDarkHeader ? cxp.surface.withValues(alpha: 0.28) : cxp.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: cxp.accent.withValues(alpha: 0.7), width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: cxp.accent.withValues(alpha: 0.2),
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
                            decoration: BoxDecoration(
                              color: cxp.accent.withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.account_balance_wallet_rounded,
                              size: 12,
                              color: cxp.accent,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            PriceConverter.convertPrice(walletBalance),
                            style: robotoBold.copyWith(
                              fontSize: 13,
                              color: titleColor,
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
                    color: isDarkHeader ? cxp.surface.withValues(alpha: 0.28) : cxp.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: isDarkHeader ? Colors.white.withValues(alpha: 0.25) : const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Center(
                    child: CartWidget(size: 18, color: iconColor),
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
                    color: isDarkHeader ? cxp.surface.withValues(alpha: 0.28) : cxp.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: isDarkHeader ? Colors.white.withValues(alpha: 0.25) : const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.person_rounded,
                    size: 20,
                    color: iconColor,
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
