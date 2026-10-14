import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/controllers/grocery_lifestyle_categories_controller.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class GroceryFashionLifestyleWidget extends StatelessWidget {
  final EdgeInsetsGeometry? customPadding;

  const GroceryFashionLifestyleWidget({
    super.key,
    this.customPadding,
  });

  static const List<Map<String, dynamic>> _defaultCards = [
    {
      'title': 'Apparel',
      'image': 'assets/image/crop_apparel.png',
      'searchKeyword': 'Apparel Clothing Fashion',
    },
    {
      'title': 'Jewellery',
      'image': 'assets/image/crop_jewellery.png',
      'searchKeyword': 'Jewellery Accessories',
    },
  ];

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryLifestyleCategoriesController>()) {
      Get.put(GroceryLifestyleCategoriesController());
    }

    final theme = context.cxpTheme;

    return GetBuilder<GroceryLifestyleCategoriesController>(
      builder: (controller) {
        final cfg = controller.config?['fashionLifestyle'];
        final bool enabled = (cfg is Map && cfg['enabled'] != null)
            ? _toBool(cfg['enabled'])
            : true;

        if (!enabled) {
          return const SizedBox.shrink();
        }

        final String title = (cfg is Map && (cfg['title'] as String?)?.isNotEmpty == true)
            ? cfg['title']
            : 'Fashion & Lifestyle';

        final List rawCards = (cfg is Map && cfg['cards'] is List && (cfg['cards'] as List).isNotEmpty)
            ? cfg['cards']
            : _defaultCards;

        final cards = rawCards
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();

        if (cards.isEmpty) {
          return const SizedBox.shrink();
        }

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
              Row(
                children: [
                  for (int i = 0; i < cards.length; i++) ...[
                    if (i > 0) const SizedBox(width: 12),
                    Expanded(
                      child: _WideFashionCard(
                        title: cards[i]['title'] ?? '',
                        imagePath: cards[i]['image'] ?? '',
                        searchKeyword: cards[i]['searchKeyword'] ?? cards[i]['title'] ?? '',
                      ),
                    ),
                  ],
                ],
              ),
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

class _WideFashionCard extends StatelessWidget {
  final String title;
  final String? assetPath;
  final String? imagePath;
  final String searchKeyword;

  const _WideFashionCard({
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
          queryText: searchKeyword.isNotEmpty ? searchKeyword : title,
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
          Text(
            title,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: robotoMedium.copyWith(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: cxp.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
