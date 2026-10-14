import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/controllers/grocery_lifestyle_categories_controller.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryHouseholdEssentialsWidget extends StatelessWidget {
  final EdgeInsetsGeometry? customPadding;

  const GroceryHouseholdEssentialsWidget({
    super.key,
    this.customPadding,
  });

  static const List<Map<String, dynamic>> _defaultRow1 = [
    {
      'title': 'Home Needs',
      'image': 'assets/image/crop_home_needs.png',
      'searchKeyword': 'Home Needs Essentials',
      'isWide': true,
    },
    {
      'title': 'Kitchenware &\nAppliances',
      'image': 'assets/image/crop_kitchenware.png',
      'searchKeyword': 'Kitchenware and Appliances Cookware',
      'isWide': true,
    },
  ];

  static const List<Map<String, dynamic>> _defaultRow2 = [
    {
      'title': 'Cleaning\nEssentials',
      'image': 'assets/image/crop_cleaning.png',
      'searchKeyword': 'Cleaning Essentials Detergent Floor Cleaner',
    },
    {
      'title': 'Electronics\nStore',
      'image': 'assets/image/crop_electronics.png',
      'searchKeyword': 'Electronics Accessories Cables',
    },
    {
      'title': 'Pet\nCare',
      'image': 'assets/image/crop_pet_care.png',
      'searchKeyword': 'Pet Care Dog Cat Food',
    },
    {
      'title': 'Paan\nCorner',
      'image': 'assets/image/crop_paan_corner.png',
      'searchKeyword': 'Paan Corner Snacks Mouth Freshener',
    },
  ];

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryLifestyleCategoriesController>()) {
      Get.put(GroceryLifestyleCategoriesController());
    }

    return GetBuilder<GroceryLifestyleCategoriesController>(
      builder: (controller) {
        final cfg = controller.config?['householdEssentials'];
        final bool enabled = (cfg is Map && cfg['enabled'] != null)
            ? _toBool(cfg['enabled'])
            : true;

        if (!enabled) {
          return const SizedBox.shrink();
        }

        final String title = (cfg is Map && (cfg['title'] as String?)?.isNotEmpty == true)
            ? cfg['title']
            : 'Household Essentials';

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

              // Row 1: Home Needs (wide) + Kitchenware (wide)
              if (row1Cards.isNotEmpty) ...[
                Row(
                  children: [
                    for (int i = 0; i < row1Cards.length; i++) ...[
                      if (i > 0) const SizedBox(width: 12),
                      Expanded(
                        child: _WideHouseholdCard(
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

              // Row 2: Cleaning, Electronics, Pet Care, Paan Corner
              if (row2Cards.isNotEmpty) ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (int i = 0; i < row2Cards.length; i++) ...[
                      if (i > 0) const SizedBox(width: 8),
                      Expanded(
                        child: _HouseholdItemCard(
                          title: row2Cards[i]['title'] ?? '',
                          imagePath: row2Cards[i]['image'] ?? '',
                          searchKeyword: row2Cards[i]['searchKeyword'] ?? row2Cards[i]['title'] ?? '',
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

class _WideHouseholdCard extends StatelessWidget {
  final String title;
  final String? assetPath;
  final String? imagePath;
  final String searchKeyword;

  const _WideHouseholdCard({
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
            height: 98,
            width: double.infinity,
            padding: const EdgeInsets.all(8),
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
          const SizedBox(height: 8),
          SizedBox(
            height: 34,
            child: Text(
              title,
              textAlign: TextAlign.center,
              maxLines: 2,
              style: robotoMedium.copyWith(
                fontSize: 12.5,
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

class _HouseholdItemCard extends StatelessWidget {
  final String title;
  final String? assetPath;
  final String? imagePath;
  final String searchKeyword;

  const _HouseholdItemCard({
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
