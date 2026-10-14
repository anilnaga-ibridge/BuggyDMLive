import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_explore_section_widget.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryCouponsOffersWidget extends StatelessWidget {
  const GroceryCouponsOffersWidget({super.key});

  static const List<Map<String, dynamic>> _defaultCoupons = [
    {
      'discountText': 'FLAT\n₹50',
      'offText': 'OFF',
      'codeText': 'USE CODE: QUICK50',
      'bgColor': '#D1FAE5',
      'borderColor': '#A7F3D0',
    },
    {
      'discountText': 'FLAT\n₹100',
      'offText': 'OFF',
      'codeText': 'USE CODE: QUICK100',
      'bgColor': '#CCFBF1',
      'borderColor': '#99F6E4',
    },
    {
      'discountText': 'FLAT\n₹150',
      'offText': 'OFF',
      'codeText': 'USE CODE: QUICK150',
      'bgColor': '#E0F2FE',
      'borderColor': '#BAE6FD',
    },
    {
      'discountText': 'UPTO\n₹75',
      'offText': 'CASHBACK',
      'codeText': 'ON UPI PAYMENTS',
      'bgColor': '#FEF3C7',
      'borderColor': '#FDE68A',
    },
  ];

  Color _parseHexColor(dynamic hex, Color fallback) {
    if (hex == null) return fallback;
    final String str = hex.toString().trim().replaceAll('#', '');
    if (str.isEmpty) return fallback;
    try {
      if (str.length == 6) {
        return Color(int.parse('0xFF$str'));
      } else if (str.length == 8) {
        return Color(int.parse('0x$str'));
      }
    } catch (_) {}
    return fallback;
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

        final String title = config?['title']?.toString() ?? 'Coupons & Offers';
        final List coupons = (config?['coupons'] as List?) ?? _defaultCoupons;

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
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 2,
                  ),
                  child: Text(
                    title,
                    style: robotoBold.copyWith(
                      fontSize: 18,
                      color: theme.textPrimary,
                      letterSpacing: -0.3,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                SizedBox(
                  height: 88,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    itemCount: coupons.length,
                    itemBuilder: (context, index) {
                      final Map coupon =
                          coupons[index] is Map ? coupons[index] : {};
                      final String discountText =
                          coupon['discountText']?.toString() ?? 'FLAT\n₹50';
                      final String offText =
                          coupon['offText']?.toString() ?? 'OFF';
                      final String codeText =
                          coupon['codeText']?.toString() ?? 'USE CODE: QUICK50';
                      final Color bgColor = _parseHexColor(
                          coupon['bgColor'], const Color(0xFFD1FAE5));
                      final Color borderColor = _parseHexColor(
                          coupon['borderColor'], const Color(0xFFA7F3D0));

                      return Padding(
                        padding: EdgeInsets.only(
                            right: index == coupons.length - 1 ? 0 : 10),
                        child: _buildCouponCard(
                          context: context,
                          discountText: discountText,
                          offText: offText,
                          codeText: codeText,
                          bgColor: bgColor,
                          borderColor: borderColor,
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

  Widget _buildCouponCard({
    required BuildContext context,
    required String discountText,
    required String offText,
    required String codeText,
    required Color bgColor,
    required Color borderColor,
  }) {
    final theme = context.cxpTheme;
    return InkWell(
      onTap: () => Get.toNamed(RouteHelper.getCouponRoute()),
      borderRadius: BorderRadius.circular(theme.cardRadius),
      child: Container(
        width: 170,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(theme.cardRadius),
          border: Border.all(color: borderColor, width: 1.2),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: Color(0xFF10B981),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.percent_rounded,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Flexible(
                        child: Text(
                          discountText.replaceAll('\n', ' '),
                          style: robotoBold.copyWith(
                            fontSize: 14,
                            color: const Color(0xFF065F46),
                            height: 1.1,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 3),
                      Text(
                        offText,
                        style: robotoMedium.copyWith(
                          fontSize: 10,
                          color: const Color(0xFF047857),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    codeText,
                    style: robotoRegular.copyWith(
                      fontSize: 8.5,
                      color: const Color(0xFF065F46).withOpacity(0.8),
                      letterSpacing: 0.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
