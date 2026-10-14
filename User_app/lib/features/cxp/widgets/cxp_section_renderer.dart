import 'package:flutter/material.dart';
import 'package:sixam_mart/features/cxp/models/cxp_experience_model.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_category_grid_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_curated_product_grid_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_featured_offers_section_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_flash_deals_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_flavour_fest_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_lifestyle_categories_section_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_salon_showcase_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_steal_deals_shelf_widget.dart';

class CxpSectionRenderer {
  /// Renders a dynamic section widget safely based on section ID and configuration
  static Widget renderSection(CxpSectionModel section) {
    if (!section.enabled) {
      return const SizedBox.shrink();
    }

    switch (section.id.toLowerCase().trim()) {
      case 'flavour_fest':
      case 'hero_fest_deals':
      case 'hero_fest':
      case 'hero_deals':
        return GroceryFlavourFestWidget(
          initialProps: section.widgets.isNotEmpty ? section.widgets.first.props : null,
        );

      case 'steal_deals':
      case 'steal_deals_shelf':
        return const GroceryStealDealsShelfWidget();

      case 'featured_offers':
      case 'featured_and_offers':
      case 'explore_featured':
        return const GroceryFeaturedOffersSectionWidget();

      case 'salon_bloom':
      case 'salon_showcase':
      case 'salon_at_home':
        return const GrocerySalonShowcaseWidget();

      case 'category_grids':
      case 'category_grid':
        return const GroceryCategoryGridWidget();

      case 'curated_products':
      case 'curated_for_you':
        return const GroceryCuratedProductGridWidget();

      case 'lifestyle_categories':
      case 'lifestyle':
        return const GroceryLifestyleCategoriesSectionWidget();

      case 'flash_deals':
      case 'flash_deals_shelf':
        return const GroceryFlashDealsWidget();

      default:
        // Safe fallback: Unknown widget/section gracefully collapses without crashing
        return const SizedBox.shrink();
    }
  }

  /// Checks if a section can be rendered by the grocery SDUI renderer
  static bool canRender(CxpSectionModel section) {
    if (!section.enabled) return false;
    final id = section.id.toLowerCase().trim();
    return id.contains('hero') ||
        id.contains('steal') ||
        id.contains('featured') ||
        id.contains('offers') ||
        id.contains('salon') ||
        id.contains('bloom') ||
        id.contains('category') ||
        id.contains('grid') ||
        id.contains('curated') ||
        id.contains('lifestyle') ||
        id.contains('flash');
  }
}
