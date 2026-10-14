import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/controllers/grocery_lifestyle_categories_controller.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryBeautyPersonalCareWidget extends StatelessWidget {
  final EdgeInsetsGeometry? customPadding;

  const GroceryBeautyPersonalCareWidget({
    super.key,
    this.customPadding,
  });

  static const List<Map<String, dynamic>> _defaultRow1 = [
    {
      'title': 'Personal Care\nStudio',
      'image': 'assets/image/crop_personal_care.png',
      'searchKeyword': 'Personal Care Studio',
      'isWide': true,
    },
    {
      'title': 'Skincare',
      'image': 'assets/image/crop_skincare.png',
      'searchKeyword': 'Skincare Face Care',
      'isWide': false,
    },
    {
      'title': 'Makeup\n& Beauty',
      'image': 'assets/image/crop_makeup.png',
      'searchKeyword': 'Makeup and Beauty Cosmetics',
      'isWide': false,
    },
  ];

  static const List<Map<String, dynamic>> _defaultRow2 = [
    {
      'title': 'Fragrance',
      'image': 'assets/image/crop_fragrance.png',
      'searchKeyword': 'Fragrance Perfume Deo',
    },
    {
      'title': 'Bath & Body',
      'image': 'assets/image/crop_bath_body.png',
      'searchKeyword': 'Bath and Body Wash Soap',
    },
    {
      'title': 'Haircare',
      'image': 'assets/image/crop_haircare.png',
      'searchKeyword': 'Haircare Shampoo Oil',
    },
    {
      'title': 'Baby Care',
      'image': 'assets/image/crop_baby_care.png',
      'searchKeyword': 'Baby Care Diapers Wipes',
    },
  ];

  static const List<Map<String, dynamic>> _defaultRow3 = [
    {
      'title': 'Protein &\nNutrition',
      'image': 'assets/image/crop_protein.png',
      'searchKeyword': 'Protein and Nutrition Supplements',
    },
    {
      'title': 'Pharmacy\n& Wellness',
      'image': 'assets/image/crop_pharmacy.png',
      'searchKeyword': 'Pharmacy and Wellness Health',
    },
    {
      'title': 'Feminine\nHygiene',
      'image': 'assets/image/crop_fem_hygiene.png',
      'searchKeyword': 'Feminine Hygiene Sanitary Pads',
    },
    {
      'title': 'Sexual\nWellness',
      'image': 'assets/image/crop_sexual_wellness.png',
      'searchKeyword': 'Sexual Wellness',
    },
  ];

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryLifestyleCategoriesController>()) {
      Get.put(GroceryLifestyleCategoriesController());
    }

    return GetBuilder<GroceryLifestyleCategoriesController>(
      builder: (controller) {
        final cfg = controller.config?['beautyPersonalCare'];
        final bool enabled = (cfg is Map && cfg['enabled'] != null)
            ? _toBool(cfg['enabled'])
            : true;

        if (!enabled) {
          return const SizedBox.shrink();
        }

        final String title = (cfg is Map && (cfg['title'] as String?)?.isNotEmpty == true)
            ? cfg['title']
            : 'Beauty & Personal Care';

        final List rawRow1 = (cfg is Map && cfg['row1Cards'] is List && (cfg['row1Cards'] as List).isNotEmpty)
            ? cfg['row1Cards']
            : _defaultRow1;
        final row1Cards = rawRow1
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();

        final List rawRow2 = (cfg is Map && cfg['row2Cards'] is List && (cfg['row2Cards'] as List).isNotEmpty)
            ? cfg['row2Cards']
            : _defaultRow2;
        final row2Cards = rawRow2
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();

        final List rawRow3 = (cfg is Map && cfg['row3Cards'] is List && (cfg['row3Cards'] as List).isNotEmpty)
            ? cfg['row3Cards']
            : _defaultRow3;
        final row3Cards = rawRow3
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();

        final theme = context.cxpTheme;

        return Padding(
          padding: customPadding ??
              const EdgeInsets.symmetric(
                  horizontal: Dimensions.paddingSizeDefault),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: robotoBold.copyWith(
                  fontSize: 18,
                  color: theme.textPrimary,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 12),

              // Row 1: Studio (Wide 2x) + Skincare (1x) + Makeup (1x)
              if (row1Cards.isNotEmpty) ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (int i = 0; i < row1Cards.length; i++) ...[
                      if (i > 0) const SizedBox(width: 8),
                      Expanded(
                        flex: i == 0 ? 2 : 1,
                        child: _BeautyItemCard(
                          title: row1Cards[i]['title'] ?? '',
                          imagePath: row1Cards[i]['image'] ?? '',
                          searchKeyword: row1Cards[i]['searchKeyword'] ?? row1Cards[i]['title'] ?? '',
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 14),
              ],

              // Row 2: Fragrance, Bath & Body, Haircare, Baby Care
              if (row2Cards.isNotEmpty) ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (int i = 0; i < row2Cards.length; i++) ...[
                      if (i > 0) const SizedBox(width: 8),
                      Expanded(
                        child: _BeautyItemCard(
                          title: row2Cards[i]['title'] ?? '',
                          imagePath: row2Cards[i]['image'] ?? '',
                          searchKeyword: row2Cards[i]['searchKeyword'] ?? row2Cards[i]['title'] ?? '',
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 14),
              ],

              // Row 3: Protein, Pharmacy, Feminine Hygiene, Sexual Wellness
              if (row3Cards.isNotEmpty) ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (int i = 0; i < row3Cards.length; i++) ...[
                      if (i > 0) const SizedBox(width: 8),
                      Expanded(
                        child: _BeautyItemCard(
                          title: row3Cards[i]['title'] ?? '',
                          imagePath: row3Cards[i]['image'] ?? '',
                          searchKeyword: row3Cards[i]['searchKeyword'] ?? row3Cards[i]['title'] ?? '',
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  static bool _toBool(dynamic val) {
    if (val == null) return true;
    if (val is bool) return val;
    if (val is num) return val != 0;
    if (val is String) return val.toLowerCase() == 'true' || val == '1';
    return true;
  }
}

class _BeautyItemCard extends StatelessWidget {
  final String title;
  final String? assetPath;
  final String? imagePath;
  final String searchKeyword;

  const _BeautyItemCard({
    super.key,
    required this.title,
    this.assetPath,
    this.imagePath,
    this.searchKeyword = '',
  });

  @override
  Widget build(BuildContext context) {
    final cxp = context.cxpTheme;
    final String activeImage = (imagePath?.isNotEmpty == true)
        ? imagePath!
        : (assetPath ?? '');

    return InkWell(
      onTap: () {
        Get.toNamed(RouteHelper.getSearchRoute(
          queryText: (searchKeyword.isNotEmpty ? searchKeyword : title).replaceAll('\n', ' '),
        ));
      },
      borderRadius: BorderRadius.circular(cxp.cardRadius),
      child: Column(
        children: [
          Container(
            height: 78,
            width: double.infinity,
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F6F8),
              borderRadius: BorderRadius.circular(cxp.cardRadius),
              border: Border.all(
                  color: const Color(0xFFEDEDF0),
                  width: 0.8),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular((cxp.cardRadius - 4).clamp(6.0, 32.0)),
              child: buildSafeLifestyleImage(
                activeImage,
                fit: BoxFit.contain,
              ),
            ),
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: 32,
            child: Text(
              title,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: robotoMedium.copyWith(
                fontSize: 11.5,
                height: 1.15,
                fontWeight: FontWeight.w600,
                color: cxp.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
