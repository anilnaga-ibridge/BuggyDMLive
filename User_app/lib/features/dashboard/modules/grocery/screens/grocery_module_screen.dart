import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/features/cxp/controllers/cxp_experience_controller.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_decoration_widget.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_section_renderer.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_flavour_fest_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_search_bar_widget.dart';
import 'package:sixam_mart/features/dashboard/widgets/explore_restaurant_section.dart';
import 'package:sixam_mart/features/dashboard/widgets/last_orders_section_widget.dart';
import 'package:sixam_mart/features/dashboard/widgets/sliver_gap.dart';
import 'package:sixam_mart/features/home/controllers/home_controller.dart';
import 'package:sixam_mart/features/order/controllers/order_controller.dart';
import 'package:sixam_mart/features/store/controllers/store_controller.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sliver_tools/sliver_tools.dart';

class GroceryModuleScreen extends StatefulWidget {
  final Key searchHeaderKey;
  final Key exploreRestaurantKey;
  final ScrollController scrollController;
  final bool isSearchPinned;

  const GroceryModuleScreen({
    super.key,
    required this.searchHeaderKey,
    required this.exploreRestaurantKey,
    required this.scrollController,
    this.isSearchPinned = false,
  });

  @override
  State<GroceryModuleScreen> createState() => _GroceryModuleScreenState();
}

class _GroceryModuleScreenState extends State<GroceryModuleScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Get.find<OrderController>().getLastOrders(isHome: false);
      Get.find<HomeController>().getTopOffer(notify: false);
      
      if (Get.isRegistered<CxpExperienceController>()) {
        Get.find<CxpExperienceController>().fetchExperience(page: 'home', module: 'grocery');
      }

      if (Get.isRegistered<StoreController>() && Get.find<StoreController>().storeModel == null) {
        Get.find<StoreController>().getStoreList(1, false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MultiSliver(
      children: [
        // 1. Floating Quick Search Bar (visible when not pinned)
        SliverToBoxAdapter(
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Visibility(
                visible: !widget.isSearchPinned,
                maintainSize: true,
                maintainState: true,
                maintainAnimation: true,
                child: GrocerySearchBarWidget(key: widget.searchHeaderKey),
              ),
              // Generic Festival Header Decorations (e.g. Indian Flag in Header)
              for (final dec in context.cxpTheme.getHeaderDecorations())
                Positioned(
                  top: 6,
                  right: 18,
                  child: CxpDecorationWidget(decoration: dec),
                ),
            ],
          ),
        ),

        // 2. FLAVOURFEST Section (Festive Banner, Magenta Offer Cards, Pill Filter Bar & Showcase)
        SliverToBoxAdapter(
          child: GetBuilder<CxpExperienceController>(
            builder: (cxpController) {
              final heroSection = cxpController.activeSections.firstWhereOrNull(
                (s) => s.id.toLowerCase().contains('hero') || s.id.toLowerCase().contains('flavour'),
              );
              if (heroSection == null) {
                return const SizedBox.shrink();
              }
              return GroceryFlavourFestWidget(
                initialProps: heroSection.widgets.isNotEmpty ? heroSection.widgets.first.props : null,
              );
            },
          ),
        ),

        // 3. Dynamic Grocery Sections configured in CXP (Lazy Slivers)
        GetBuilder<CxpExperienceController>(
          builder: (cxpController) {
            final activeSections = cxpController.activeSections
                .where((s) => CxpSectionRenderer.canRender(s) && !s.id.toLowerCase().contains('hero') && !s.id.toLowerCase().contains('flavour'))
                .toList();

            if (activeSections.isEmpty) {
              return const SliverToBoxAdapter(child: SizedBox.shrink());
            }

            return SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final section = activeSections[index];
                  final sectionDecs = context.cxpTheme.getSectionDecorations(section.id);
                  final hasRibbon = sectionDecs.any((d) => d.type == 'ribbon');

                  return Padding(
                    key: ValueKey('cxp_sec_${section.id}'),
                    padding: EdgeInsets.only(bottom: context.cxpTheme.sectionGap),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Ribbon accent across section if configured in CXP overlay
                        if (hasRibbon)
                          for (final d in sectionDecs.where((x) => x.type == 'ribbon'))
                            Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: CxpDecorationWidget(decoration: d),
                            ),
                        CxpSectionRenderer.renderSection(section),
                      ],
                    ),
                  );
                },
                childCount: activeSections.length,
              ),
            );
          },
        ),

        // 4. Last Orders Section (collapses when empty)
        GetBuilder<OrderController>(builder: (controller) {
          final visible = controller.lastOrders?.isNotEmpty ?? false;
          return _conditionalSection(visible: visible, slivers: [
            const SliverToBoxAdapter(child: LastOrdersSectionWidget(moduleType: AppConstants.grocery)),
            sliverGepY(value: Dimensions.paddingSizeDefault),
          ]);
        }),

        // 5. Explore Stores (at bottom)
        ExploreRestaurantSection(
          exploreRestaurantKey: widget.exploreRestaurantKey,
          scrollController: widget.scrollController,
          title: 'explore_stores'.tr,
        ),

        // Bottom space so content is never covered by the floating delivery bar
        sliverGepY(value: 85),
      ],
    );
  }
}

Widget _conditionalSection({required bool visible, required List<Widget> slivers}) {
  return visible
      ? MultiSliver(children: slivers)
      : const SliverToBoxAdapter(child: SizedBox.shrink());
}
