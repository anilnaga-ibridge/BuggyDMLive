import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/helper/grocery_config_cache.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_explore_section_widget.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryTodaysOffersWidget extends StatelessWidget {
  const GroceryTodaysOffersWidget({super.key});

  static const List<Map<String, dynamic>> _defaultOffers = [
    {
      'image': 'assets/image/offer_fruits_veg.png',
      'searchKeyword': 'Fresh Fruits and Vegetables',
      'title': 'Up to 50% OFF',
    },
    {
      'image': 'assets/image/offer_restaurant.png',
      'searchKeyword': 'Restaurant Pizza Food',
      'title': 'Flat 40% OFF',
    },
    {
      'image': 'assets/image/offer_pharmacy.png',
      'searchKeyword': 'Pharmacy Essentials Medicine',
      'title': 'Up to 30% OFF',
    },
  ];

  String _resolveImageUrl(dynamic rawUrl) => resolveGroceryImageUrl(rawUrl);

  Widget _buildSafeImage(
    dynamic rawUrl, {
    double? width,
    double? height,
    BoxFit fit = BoxFit.cover,
    Widget? errorWidget,
  }) {
    final resolved = _resolveImageUrl(rawUrl);
    final defaultError = errorWidget ??
        Container(
          width: width,
          height: height,
          color: const Color(0xFFF1F5F9),
          child: const Center(
            child: Icon(Icons.local_offer_outlined, color: Colors.grey, size: 28),
          ),
        );

    if (resolved.isEmpty) {
      return defaultError;
    }

    if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
      return Image.network(
        resolved,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (_, __, ___) => defaultError,
      );
    }

    return Image.asset(
      resolved,
      width: width,
      height: height,
      fit: fit,
      cacheWidth: 400,
      filterQuality: FilterQuality.medium,
      errorBuilder: (_, __, ___) => defaultError,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryFeaturedOffersController>()) {
      Get.put(GroceryFeaturedOffersController());
    }

    return GetBuilder<GroceryFeaturedOffersController>(
      builder: (controller) {
        final config = controller.config?['todaysOffers'];
        if (config != null && config['enabled'] == false) {
          return const SizedBox.shrink();
        }

        final String title = config?['title']?.toString() ?? "Today's Offers";
        final String viewAllText = config?['viewAllText']?.toString() ?? "View All";
        final List offers = (config?['offers'] as List?) ?? _defaultOffers;

        if (offers.isEmpty) {
          return const SizedBox.shrink();
        }

        final theme = context.cxpTheme;

        return Padding(
          padding: EdgeInsets.symmetric(horizontal: theme.spacingMd),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: theme.surface,
              borderRadius: BorderRadius.circular(theme.cardRadius),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: "Today's Offers" and "View All ->"
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: robotoBold.copyWith(
                            fontSize: 19,
                            color: theme.textPrimary,
                            letterSpacing: -0.4,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () => Get.toNamed(
                            RouteHelper.getSearchRoute(queryText: 'Offers Deals')),
                        borderRadius: BorderRadius.circular(theme.buttonRadius),
                        child: Padding(
                          padding:
                              const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                viewAllText,
                                style: robotoBold.copyWith(
                                  color: theme.primary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                Icons.arrow_forward_rounded,
                                size: 14,
                                color: theme.primary,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // Horizontal Offer Cards Shelf
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    children: [
                      for (int i = 0; i < offers.length; i++) ...[
                        if (i > 0) const SizedBox(width: 10),
                        _buildOfferCard(context, offers[i]),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildOfferCard(BuildContext context, dynamic offerData) {
    final Map offer = offerData is Map ? offerData : {};
    final dynamic image = offer['image'] ?? 'assets/image/offer_fruits_veg.png';
    final String keyword = offer['searchKeyword']?.toString() ??
        offer['title']?.toString() ??
        'Offers';
    final theme = context.cxpTheme;

    return InkWell(
      onTap: () => Get.toNamed(RouteHelper.getSearchRoute(queryText: keyword)),
      borderRadius: BorderRadius.circular(theme.cardRadius),
      child: Container(
        width: 220,
        height: 110,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(theme.cardRadius),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(theme.cardRadius - 1.2),
          child: _buildSafeImage(
            image,
            width: 220,
            height: 110,
            fit: BoxFit.cover,
            errorWidget: Container(
              color: const Color(0xFFF1F5F9),
              child: const Center(
                child: Icon(Icons.local_offer_outlined, color: Colors.grey, size: 36),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
