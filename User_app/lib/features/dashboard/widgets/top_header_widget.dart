import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shimmer_animation/shimmer_animation.dart';
import 'package:sixam_mart/common/widgets/cart_widget.dart';
import 'package:sixam_mart/features/location/controllers/location_controller.dart';
import 'package:sixam_mart/features/notification/controllers/notification_controller.dart';
import 'package:sixam_mart/features/cart/screens/global_cart_screen.dart';
import 'package:sixam_mart/features/rental_module/common/widgets/rant_cart_widget.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/helper/address_helper.dart';
import 'package:sixam_mart/helper/module_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_flavour_fest_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_quick_header_widget.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_decoration_widget.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_paint_drip_widget.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';

class TopHeaderWidget extends StatelessWidget {
  final bool isHomeModule;
  final bool isParcelModule;
  final String? title;
  final VoidCallback? onBackTap;
  final bool showModuleTabs;

  const TopHeaderWidget({
    super.key,
    required this.isHomeModule,
    this.isParcelModule = false,
    this.title,
    this.onBackTap,
    this.showModuleTabs = true,
  });

  @override
  Widget build(BuildContext context) {
    final String? moduleType = Get.find<SplashController>().module?.moduleType?.toString();
    final bool isGrocery = moduleType == AppConstants.grocery && !isParcelModule && title == null;
    final cxp = context.cxpTheme;
    final headerDecs = cxp.getHeaderDecorations();
    final hasPaintDrip = headerDecs.any((d) => d.type == 'paint_drip');

    if (isGrocery) {
      final GroceryFlavourFestController festController = Get.isRegistered<GroceryFlavourFestController>()
          ? Get.find<GroceryFlavourFestController>()
          : Get.put(GroceryFlavourFestController());

      return GetBuilder<GroceryFlavourFestController>(
        init: festController,
        builder: (controller) {
          final Color themeColor = controller.headerTopColor;
          return Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: themeColor,
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [themeColor, themeColor],
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const GroceryQuickHeaderWidget(),
                    if(showModuleTabs) const ModuleTabs(),
                  ],
                ),
              ),
              // Generic Organic Paint Drip Overlay
              if (hasPaintDrip)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: CxpPaintDripWidget(
                    colors: cxp.overlay?.allAccents,
                    height: 85,
                  ),
                ),
              // Other Header Decorations
              for (final dec in headerDecs.where((d) => d.type != 'paint_drip'))
                Positioned.fill(
                  child: Align(
                    alignment: CxpDecorationWidget.alignmentFor(dec.positionX, dec.positionY),
                    child: CxpDecorationWidget(
                      decoration: dec,
                      accentColors: cxp.overlay?.allAccents,
                    ),
                  ),
                ),
            ],
          );
        },
      );
    }

    return Container(
      color: Theme.of(context).disabledColor.withAlpha(30),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DashboardAppBar(isHomeModule: isHomeModule, isParcelModule: isParcelModule, title: title, onBackTap: onBackTap),
          if(showModuleTabs) const ModuleTabs(),
        ],
      ),
    );
  }
}

class DashboardAppBar extends StatelessWidget {
  final bool isHomeModule;
  final bool isParcelModule;
  final String? title;
  final VoidCallback? onBackTap;

  const DashboardAppBar({
    super.key,
    required this.isHomeModule,
    this.isParcelModule = false,
    this.title,
    this.onBackTap,
  });

  @override
  Widget build(BuildContext context) {
    // final bool showBackButton = onBackTap != null || !isHomeModule;
    final String? moduleType = Get.find<SplashController>().module?.moduleType?.toString();
    final bool isRentalModule = moduleType == AppConstants.taxi;
    // Rental uses its own cart (RantCartWidget) instead of the global CartWidget.
    final bool showCart = !isParcelModule && moduleType != AppConstants.ride && !isRentalModule;
    return Center(
      child: SizedBox(
        width: Dimensions.webMaxWidth,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Dimensions.paddingSizeSmall,
            vertical: Dimensions.paddingSizeDefault,
          ),
          child: Row(
            children: [
              // if(showBackButton) ...[
              //   _BackButtonWidget(onTap: onBackTap ?? () => Get.find<SplashController>().selectModuleIndex(0)),
              //   const SizedBox(width: Dimensions.paddingSizeDefault),
              // ],

              Expanded(
                child: title != null
                    ? Text(
                        title!,
                        style: robotoBold.copyWith(
                          fontSize: Dimensions.fontSizeLarge,
                          color: Theme.of(context).textTheme.bodyLarge?.color,
                        ),
                      )
                    : GetBuilder<LocationController>(builder: (locationController) {
                  final String addressText = AddressHelper.getUserAddressFromSharedPref()?.address?.trim().isNotEmpty ?? false
                      ? AddressHelper.getUserAddressFromSharedPref()!.address!
                      : 'select_your_location'.tr;

                  return InkWell(
                    // borderRadius: const BorderRadius.vertical(top: Radius.circular(Dimensions.radiusDefault)),
                    onTap: () => locationController.navigateToLocationScreen('home'),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                        Padding(
                          padding: const EdgeInsets.only(left: 2.0),
                          child: Text(
                            isParcelModule || moduleType == AppConstants.ride ? 'pickup_at'.tr : 'deliver_to'.tr,
                            style: robotoBold.copyWith(
                              fontSize: Dimensions.fontSizeDefault,
                              color: Theme.of(context).textTheme.bodyLarge?.color,
                              height: 110 * 0.01,
                            ),),
                        ),
                        const SizedBox(height: 2),

                        Row(
                          children: [
                            Icon(
                              CupertinoIcons.placemark,
                              size: Dimensions.fontSizeLarge,
                              color: Theme.of(context).disabledColor,
                            ),
                            const SizedBox(width: 2),

                            Flexible(
                              child: Text(
                                addressText,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: robotoRegular.copyWith(
                                  fontSize: Dimensions.fontSizeSmall,
                                  color: Theme.of(context).textTheme.bodyLarge!.color!.withValues(alpha: 0.5),
                                  height: 130 * 0.01,
                                ),
                              ),
                            ),

                            Icon(
                              Icons.keyboard_arrow_down_outlined,
                              size:  Dimensions.fontSizeLarge,
                            ),
                            const SizedBox(width: 64,)
                          ],
                        ),
                      ],
                    ),
                  );
                }),
              ),

              const SizedBox(width: Dimensions.paddingSizeSmall),

              _HeaderActionButton(
                onTap: () => Get.toNamed(RouteHelper.getNotificationRoute()),
                child: GetBuilder<NotificationController>(builder: (notificationController) {
                  return Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Image.asset(Images.bellOn, height: 24, width: 24, color: Theme.of(context).textTheme.bodyLarge!.color),

                      if(notificationController.hasNotification)
                      Positioned(
                        top: 0,
                        right: 0,
                        child: Container(
                          height: 9,
                          width: 9,
                          decoration: BoxDecoration(
                            color: Theme.of(context).primaryColor,
                            shape: BoxShape.circle,
                            border: Border.all(width: 1, color: Theme.of(context).cardColor),
                          ),
                        ),
                      ),
                    ],
                  );
                }),
              ),
              const SizedBox(width: Dimensions.paddingSizeExtraSmall),

              if(showCart)
                _HeaderActionButton(
                  onTap: () => Get.to(() => const GlobalCartScreen(fromNav: false)),
                  child: const CartWidget(size: 20),
                ),

              if(isRentalModule)
                RantCartWidget(callback: (_) {}),
            ],
          ),
        ),
      ),
    );
  }
}

// class _BackButtonWidget extends StatelessWidget {
//   final VoidCallback onTap;
//   const _BackButtonWidget({required this.onTap});

//   @override
//   Widget build(BuildContext context) {
//     return InkWell(
//       onTap: onTap,
//       child: Container(
//         padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
//         decoration: BoxDecoration(
//           shape: BoxShape.circle,
//           color: Theme.of(context).cardColor,
//           boxShadow: lightShadow,
//         ),
//         alignment: Alignment.center,
//         child: Icon(
//           Icons.arrow_back_ios_new_rounded,
//           size: 20, color: Theme.of(context).textTheme.bodyLarge?.color,
//         ),
//       ),
//     );
//   }
// }

class _HeaderActionButton extends StatelessWidget {
  final Widget child;
  final VoidCallback onTap;

  const _HeaderActionButton({
    required this.child,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall),
        child: child,
      ),
    );
  }
}

class ModuleTabs extends StatefulWidget {
  const ModuleTabs({super.key});

  @override
  State<ModuleTabs> createState() => _ModuleTabsState();
}

class _ModuleTabsState extends State<ModuleTabs> {
  final ScrollController _scrollController = ScrollController();
  int _lastSelectedIndex = -1;

  void _scrollToIndex(int index) {
    if (index == _lastSelectedIndex) return;
    _lastSelectedIndex = index;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scrollController.hasClients) return;
      if (!_scrollController.position.hasContentDimensions) return;
      const double approxPillWidth = 110.0;
      final double targetOffset = (index * approxPillWidth) - 30.0;
      final double maxExtent = _scrollController.position.maxScrollExtent;
      final double clamped = targetOffset.clamp(0.0, maxExtent > 0 ? maxExtent : 0.0);
      _scrollController.animateTo(
        clamped,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
      );
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<SplashController>(builder: (splashController) {
      if(splashController.moduleList == null) {
        return const _ModuleTabsShimmer();
      }

      final List<_FoodModuleModuleTabData> tabs = _buildTabs(splashController);
      if (tabs.isEmpty) {
        return const SizedBox();
      }
      final int selectedIndex = (splashController.selectedModuleIndex >= 0 && splashController.selectedModuleIndex < tabs.length)
          ? splashController.selectedModuleIndex
          : 0;

      _scrollToIndex(selectedIndex);

      return Center(
        child: SizedBox(
          width: Dimensions.webMaxWidth,
          child: Padding(
            padding: const EdgeInsets.only(top: 2, bottom: 8),
            child: SizedBox(
              height: 38,
              child: ListView.separated(
                controller: _scrollController,
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall),
                itemCount: tabs.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final tab = tabs[index];
                  final bool isSelected = index == selectedIndex;
                  const Color wineActive = Color(0xFF6B0033);
                  const Color wineBorder = Color(0xFFFF2E63);

                  return Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => tab.onTap?.call(),
                      borderRadius: BorderRadius.circular(22),
                      splashColor: wineBorder.withValues(alpha: 0.2),
                      highlightColor: wineBorder.withValues(alpha: 0.1),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeInOut,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? wineActive
                              : const Color(0xFF45001E).withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(
                            color: isSelected
                                ? wineBorder
                                : Colors.white.withValues(alpha: 0.14),
                            width: isSelected ? 1.4 : 1.0,
                          ),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: wineBorder.withValues(alpha: 0.28),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(3.5),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? wineBorder.withValues(alpha: 0.25)
                                    : Colors.white.withValues(alpha: 0.08),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                tab.icon,
                                size: 14,
                                color: isSelected
                                    ? Colors.white
                                    : Colors.white.withValues(alpha: 0.8),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              tab.label,
                              style: (isSelected ? robotoBold : robotoMedium).copyWith(
                                fontSize: 13,
                                color: isSelected
                                    ? Colors.white
                                    : Colors.white.withValues(alpha: 0.85),
                                letterSpacing: -0.1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      );
    });
  }

  List<_FoodModuleModuleTabData> _buildTabs(SplashController splashController) {
    final List<_FoodModuleModuleTabData> tabs = [];

    if(splashController.moduleList != null && splashController.moduleList!.isNotEmpty) {
      for(int index = 0; index < splashController.moduleList!.length; index++) {
        final module = splashController.moduleList![index];
        final String moduleType = module.moduleType?.toString() ?? '';
        final int currentTabIndex = index;

        tabs.add(
          _FoodModuleModuleTabData(
            label: ModuleHelper.moduleDisplayName(moduleType, moduleName: module.moduleName),
            isSelected: splashController.selectedModuleIndex == currentTabIndex,
            onTap: () => splashController.selectModuleByTabIndex(currentTabIndex),
            icon: _getModuleIcon(moduleType),
            color: _getModuleColor(moduleType),
            moduleType: moduleType,
          ),
        );
      }
    }

    if(tabs.isEmpty) {
      tabs.addAll([
        _FoodModuleModuleTabData(
          label: 'Grocery',
          isSelected: splashController.selectedModuleIndex == 0,
          onTap: () => splashController.selectModuleIndex(0),
          icon: Icons.local_grocery_store_rounded,
          color: const Color(0xFF10B981),
          moduleType: AppConstants.grocery,
        ),
        _FoodModuleModuleTabData(
          label: 'Food',
          isSelected: splashController.selectedModuleIndex == 1,
          onTap: () => splashController.selectModuleIndex(1),
          icon: Icons.restaurant_rounded,
          color: const Color(0xFFF97316),
          moduleType: AppConstants.food,
        ),
        _FoodModuleModuleTabData(
          label: 'Shop',
          isSelected: splashController.selectedModuleIndex == 2,
          onTap: () => splashController.selectModuleIndex(2),
          icon: Icons.shopping_bag_rounded,
          color: const Color(0xFF8B5CF6),
          moduleType: AppConstants.ecommerce,
        ),
        _FoodModuleModuleTabData(
          label: 'Pharmacy',
          isSelected: splashController.selectedModuleIndex == 3,
          onTap: () => splashController.selectModuleIndex(3),
          icon: Icons.medical_services_rounded,
          color: const Color(0xFF0EA5E9),
          moduleType: AppConstants.pharmacy,
        ),
      ]);
    }

    return tabs;
  }

  static IconData _getModuleIcon(String moduleType) {
    switch (moduleType) {
      case AppConstants.grocery:
        return Icons.local_grocery_store_rounded;
      case AppConstants.food:
        return Icons.restaurant_rounded;
      case AppConstants.ecommerce:
        return Icons.shopping_bag_rounded;
      case AppConstants.pharmacy:
        return Icons.medical_services_rounded;
      case AppConstants.taxi:
        return Icons.local_taxi_rounded;
      case AppConstants.parcel:
        return Icons.inventory_2_rounded;
      case 'home':
        return Icons.home_rounded;
      default:
        return Icons.category_rounded;
    }
  }

  static Color _getModuleColor(String moduleType) {
    switch (moduleType) {
      case AppConstants.grocery:
        return const Color(0xFF10B981);
      case AppConstants.food:
        return const Color(0xFFF97316);
      case AppConstants.ecommerce:
        return const Color(0xFF8B5CF6);
      case AppConstants.pharmacy:
        return const Color(0xFF0EA5E9);
      case AppConstants.taxi:
        return const Color(0xFFF59E0B);
      case AppConstants.parcel:
        return const Color(0xFF6366F1);
      case 'home':
        return const Color(0xFF3B82F6);
      default:
        return const Color(0xFF64748B);
    }
  }
}

class _FoodModuleModuleTabData {
  final String label;
  final bool isSelected;
  final VoidCallback? onTap;
  final IconData icon;
  final Color color;
  final String? moduleType;

  const _FoodModuleModuleTabData({
    required this.label,
    this.isSelected = false,
    this.onTap,
    required this.icon,
    required this.color,
    this.moduleType,
  });
}

class _ModuleTabsShimmer extends StatelessWidget {
  const _ModuleTabsShimmer();

  static const List<double> _tabLabelWidths = [60, 95, 80, 90];

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    return Center(
      child: SizedBox(
        width: Dimensions.webMaxWidth,
        child: Padding(
          padding: const EdgeInsets.only(top: 2, bottom: 8),
          child: SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall),
              itemCount: _tabLabelWidths.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final double width = _tabLabelWidths[index];
                return Shimmer(
                  duration: const Duration(seconds: 2),
                  child: Container(
                    height: 38,
                    width: width + 46,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 16,
                          height: 16,
                          decoration: BoxDecoration(
                            color: _shimmerColor(context),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          height: 12,
                          width: width,
                          decoration: BoxDecoration(
                            color: _shimmerColor(context),
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

Color _shimmerColor(BuildContext context) {
  final bool isDark = Theme.of(context).brightness == Brightness.dark;
  return isDark ? Colors.white.withValues(alpha: 0.18) : const Color(0xFFE9E9E9);
}
