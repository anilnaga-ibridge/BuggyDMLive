import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_coupons_offers_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_explore_section_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_todays_offers_widget.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';

class GroceryFeaturedOffersSectionWidget extends StatelessWidget {
  const GroceryFeaturedOffersSectionWidget({super.key});

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryFeaturedOffersController>()) {
      Get.put(GroceryFeaturedOffersController());
    }

    final theme = context.cxpTheme;

    return GetBuilder<GroceryFeaturedOffersController>(
      builder: (controller) {
        final config = controller.config;
        final featuredCfg = config?['featured'];
        final offersCfg = config?['todaysOffers'];
        final couponsCfg = config?['coupons'];

        final bool hasFeatured = featuredCfg == null || featuredCfg['enabled'] != false;
        final bool hasOffers = offersCfg == null || offersCfg['enabled'] != false;
        final bool hasCoupons = couponsCfg == null || couponsCfg['enabled'] != false;

        if (!hasFeatured && !hasOffers && !hasCoupons) {
          return const SizedBox.shrink();
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (hasFeatured) const GroceryExploreSectionWidget(),
            if (hasFeatured && (hasOffers || hasCoupons)) SizedBox(height: theme.spacingSm),
            if (hasOffers) const GroceryTodaysOffersWidget(),
            if (hasOffers && hasCoupons) SizedBox(height: theme.spacingSm),
            if (hasCoupons) const GroceryCouponsOffersWidget(),
          ],
        );
      },
    );
  }
}
