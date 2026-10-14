import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/controllers/grocery_lifestyle_categories_controller.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_beauty_personal_care_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_fashion_lifestyle_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_hobbies_interests_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_household_essentials_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_section_shimmer.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';

class GroceryLifestyleCategoriesSectionWidget extends StatelessWidget {
  const GroceryLifestyleCategoriesSectionWidget({super.key});

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<GroceryLifestyleCategoriesController>()) {
      Get.put(GroceryLifestyleCategoriesController());
    }

    final theme = context.cxpTheme;

    return GetBuilder<GroceryLifestyleCategoriesController>(
      builder: (controller) {
        final config = controller.config;

        if (config == null) {
          return const GrocerySectionShimmer(height: 300);
        }
        final fashionCfg = config?['fashionLifestyle'];
        final beautyCfg = config?['beautyPersonalCare'];
        final householdCfg = config?['householdEssentials'];
        final hobbiesCfg = config?['hobbiesInterests'];

        final bool hasFashion = fashionCfg == null || (fashionCfg is Map && fashionCfg['enabled'] != false);
        final bool hasBeauty = beautyCfg == null || (beautyCfg is Map && beautyCfg['enabled'] != false);
        final bool hasHousehold = householdCfg == null || (householdCfg is Map && householdCfg['enabled'] != false);
        final bool hasHobbies = hobbiesCfg == null || (hobbiesCfg is Map && hobbiesCfg['enabled'] != false);

        if (!hasFashion && !hasBeauty && !hasHousehold && !hasHobbies) {
          return const SizedBox.shrink();
        }

        return Padding(
          padding: EdgeInsets.symmetric(horizontal: theme.spacingMd),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
            decoration: BoxDecoration(
              color: theme.surface,
              borderRadius: BorderRadius.circular(theme.cardRadius),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (hasFashion) ...[
                  const GroceryFashionLifestyleWidget(customPadding: EdgeInsets.zero),
                ],
                if (hasFashion && (hasBeauty || hasHousehold || hasHobbies)) ...[
                  const SizedBox(height: 16),
                  const Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 16),
                ],
                if (hasBeauty) ...[
                  const GroceryBeautyPersonalCareWidget(customPadding: EdgeInsets.zero),
                ],
                if (hasBeauty && (hasHousehold || hasHobbies)) ...[
                  const SizedBox(height: 16),
                  const Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 16),
                ],
                if (hasHousehold) ...[
                  const GroceryHouseholdEssentialsWidget(customPadding: EdgeInsets.zero),
                ],
                if (hasHousehold && hasHobbies) ...[
                  const SizedBox(height: 16),
                  const Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 16),
                ],
                if (hasHobbies) ...[
                  const GroceryHobbiesInterestsWidget(customPadding: EdgeInsets.zero),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
