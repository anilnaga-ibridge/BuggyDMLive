import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_explore_section_widget.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryCouponsOffersWidget extends StatelessWidget {
  const GroceryCouponsOffersWidget({super.key});

  static const List<Map<String, dynamic>> _defaultCoupons = [
    {
      'id': 'coupon_grocery',
      'title': 'Grocery Essentials',
      'discountPrefix': 'UP TO',
      'discountAmount': '50%',
      'discountSuffix': 'OFF',
      'code': 'GROCERY50',
      'image': 'assets/image/coupon_grocery_50.png',
      'bgColor': '#F0FDF4',
      'borderColor': '#BBF7D0',
    },
    {
      'id': 'coupon_food',
      'title': 'Food Delights',
      'discountPrefix': 'FLAT',
      'discountAmount': '₹120',
      'discountSuffix': 'OFF',
      'code': 'FOOD120',
      'image': 'assets/image/coupon_food_120.png',
      'bgColor': '#FFF7ED',
      'borderColor': '#FED7AA',
    },
    {
      'id': 'coupon_care',
      'title': 'Personal Care Specials',
      'discountPrefix': 'UP TO',
      'discountAmount': '40%',
      'discountSuffix': 'OFF',
      'code': 'CARE40',
      'image': 'assets/image/coupon_care_40.png',
      'bgColor': '#FDF2F8',
      'borderColor': '#FBCFE8',
    },
    {
      'id': 'coupon_tech',
      'title': 'Electronics Deals',
      'discountPrefix': 'FLAT',
      'discountAmount': '₹300',
      'discountSuffix': 'OFF',
      'code': 'TECH300',
      'image': 'assets/image/coupon_tech_300.png',
      'bgColor': '#EFF6FF',
      'borderColor': '#BFDBFE',
    },
    {
      'id': 'coupon_pet',
      'title': 'Pet Care Offers',
      'discountPrefix': 'UP TO',
      'discountAmount': '30%',
      'discountSuffix': 'OFF',
      'code': 'PET30',
      'image': 'assets/image/coupon_pet_30.png',
      'bgColor': '#F5F3FF',
      'borderColor': '#DDD6FE',
    },
    {
      'id': 'coupon_home',
      'title': 'Home & Living Specials',
      'discountPrefix': 'FLAT',
      'discountAmount': '₹200',
      'discountSuffix': 'OFF',
      'code': 'HOME200',
      'image': 'assets/image/coupon_home_200.png',
      'bgColor': '#FFFBEB',
      'borderColor': '#FDE68A',
    },
  ];

  static String _resolveCouponImage(dynamic raw, int index) {
    if (raw != null && raw.toString().isNotEmpty) {
      final String s = raw.toString();
      if (s.contains('grocery') || s.contains('50')) {
        return 'assets/image/coupon_grocery_50.png';
      }
      if (s.contains('food') || s.contains('120')) {
        return 'assets/image/coupon_food_120.png';
      }
      if (s.contains('care') || s.contains('40')) {
        return 'assets/image/coupon_care_40.png';
      }
      if (s.contains('tech') || s.contains('300')) {
        return 'assets/image/coupon_tech_300.png';
      }
      if (s.contains('pet') || s.contains('30')) {
        return 'assets/image/coupon_pet_30.png';
      }
      if (s.contains('home') || s.contains('200')) {
        return 'assets/image/coupon_home_200.png';
      }
      if (s.startsWith('http') || s.startsWith('assets/')) {
        return s;
      }
    }
    const fallbackImages = [
      'assets/image/coupon_grocery_50.png',
      'assets/image/coupon_food_120.png',
      'assets/image/coupon_care_40.png',
      'assets/image/coupon_tech_300.png',
      'assets/image/coupon_pet_30.png',
      'assets/image/coupon_home_200.png',
    ];
    return fallbackImages[index % fallbackImages.length];
  }

  static String _resolveCouponCode(Map coupon, int index) {
    final dynamic raw = coupon['code'] ?? coupon['codeText'];
    if (raw != null && raw.toString().isNotEmpty) {
      String s = raw.toString();
      s = s.replaceAll(RegExp(r'use\s+code\s*:\s*', caseSensitive: false), '').trim();
      if (s.isNotEmpty) return s;
    }
    const fallbackCodes = [
      'GROCERY50',
      'FOOD120',
      'CARE40',
      'TECH300',
      'PET30',
      'HOME200'
    ];
    return fallbackCodes[index % fallbackCodes.length];
  }

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryFeaturedOffersController>()) {
      Get.put(GroceryFeaturedOffersController());
    }

    return GetBuilder<GroceryFeaturedOffersController>(
      builder: (controller) {
        final config = controller.config?['coupons'];
        if (config != null && config['enabled'] == false) {
          return const SizedBox.shrink();
        }

        final String title =
            config?['title']?.toString() ?? 'Coupons & Offers';
        final List coupons =
            (config?['coupons'] as List?) ?? _defaultCoupons;

        if (coupons.isEmpty) {
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
                // Header: Title + Subtitle and "View All ->"
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 2,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: robotoBold.copyWith(
                                fontSize: 18,
                                color: theme.textPrimary,
                                letterSpacing: -0.3,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Tap any card to copy code & save more',
                              style: robotoRegular.copyWith(
                                fontSize: 11,
                                color: theme.textSecondary.withOpacity(0.85),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () =>
                            Get.toNamed(RouteHelper.getCouponRoute()),
                        borderRadius:
                            BorderRadius.circular(theme.buttonRadius),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'View All',
                                style: robotoBold.copyWith(
                                  fontSize: 12,
                                  color: theme.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 3),
                              Icon(
                                Icons.arrow_forward_rounded,
                                size: 13,
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

                // Horizontal scroll of high-converting visual cards
                SizedBox(
                  height: 165,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    itemCount: coupons.length,
                    itemBuilder: (context, index) {
                      final Map coupon =
                          coupons[index] is Map ? coupons[index] : {};
                      final String imgPath =
                          _resolveCouponImage(coupon['image'], index);
                      final String code =
                          _resolveCouponCode(coupon, index);

                      return Padding(
                        padding: EdgeInsets.only(
                          right: index == coupons.length - 1 ? 0 : 12,
                        ),
                        child: _buildVisualCouponCard(
                          context: context,
                          imagePath: imgPath,
                          code: code,
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildVisualCouponCard({
    required BuildContext context,
    required String imagePath,
    required String code,
  }) {
    const double cardWidth = 184.0;
    const double cardHeight = 165.0;

    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          Clipboard.setData(ClipboardData(text: code));
          showCustomSnackBar(
            'Coupon code "$code" copied to clipboard! 🎉',
            isError: false,
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: cardWidth,
          height: cardHeight,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: const Color(0xFFE2E8F0),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(15),
            child: _buildCardImage(imagePath, cardWidth, cardHeight),
          ),
        ),
      ),
    );
  }

  Widget _buildCardImage(String path, double width, double height) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return Image.network(
        path,
        width: width,
        height: height,
        fit: BoxFit.fill,
        errorBuilder: (_, __, ___) => _buildFallbackCardPlaceholder(),
      );
    }
    return Image.asset(
      path,
      width: width,
      height: height,
      fit: BoxFit.fill,
      errorBuilder: (_, __, ___) => _buildFallbackCardPlaceholder(),
    );
  }

  Widget _buildFallbackCardPlaceholder() {
    return Container(
      color: const Color(0xFFF1F5F9),
      child: const Center(
        child: Icon(
          Icons.local_offer_rounded,
          color: Color(0xFF94A3B8),
          size: 32,
        ),
      ),
    );
  }
}
