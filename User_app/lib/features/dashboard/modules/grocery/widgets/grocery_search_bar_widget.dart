import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/cart_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_flavour_fest_widget.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class GrocerySearchBarWidget extends StatefulWidget {
  const GrocerySearchBarWidget({super.key});

  @override
  State<GrocerySearchBarWidget> createState() => _GrocerySearchBarWidgetState();
}

class _GrocerySearchBarWidgetState extends State<GrocerySearchBarWidget> {
  final List<String> _hints = [
    'Search "Milk"',
    'Search "atta & more"',
    'Search "chilli & veggies"',
    'Search "chips & snacks"',
    'Search "tea & coffee"',
  ];

  final ValueNotifier<int> _hintIndexNotifier = ValueNotifier<int>(0);
  Timer? _hintTimer;

  @override
  void initState() {
    super.initState();
    _hintTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (mounted) {
        _hintIndexNotifier.value = (_hintIndexNotifier.value + 1) % _hints.length;
      }
    });
  }

  @override
  void dispose() {
    _hintTimer?.cancel();
    _hintIndexNotifier.dispose();
    super.dispose();
  }

  int _activeFilterIndex = 0;
  bool _isVegOnly = false;

  final List<Map<String, dynamic>> _filterTabs = [
    {'title': 'ALL', 'icon': Icons.grid_view_rounded},
    {'title': 'STORE', 'icon': Icons.storefront_rounded},
    {'title': 'OFFERS', 'icon': Icons.local_offer_rounded},
    {'title': 'BOLT', 'icon': Icons.bolt_rounded},
  ];

  @override
  Widget build(BuildContext context) {
    final cxp = context.cxpTheme;

    return GetBuilder<GroceryFlavourFestController>(
      init: Get.isRegistered<GroceryFlavourFestController>()
          ? Get.find<GroceryFlavourFestController>()
          : Get.put(GroceryFlavourFestController()),
      builder: (festController) {
        final Color bgColor = cxp.gradientTo;

        return Container(
          color: bgColor,
          padding: EdgeInsets.symmetric(
            horizontal: cxp.spacingMd,
            vertical: Dimensions.paddingSizeExtraSmall,
          ),
          child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // 1. Pure White Search Pill & Cart Button Row
          Row(
            children: [
              Expanded(
                child: Container(
            height: 50,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.15),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                // Clickable search area (icon + animated text)
                Expanded(
                  child: InkWell(
                    onTap: () => Get.toNamed(RouteHelper.getSearchRoute()),
                    borderRadius: const BorderRadius.horizontal(left: Radius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.search_rounded,
                            size: 22,
                            color: Color(0xFF64748B),
                          ),
                          const SizedBox(width: 8),

                          // Animated placeholder
                          Expanded(
                            child: ValueListenableBuilder<int>(
                              valueListenable: _hintIndexNotifier,
                              builder: (context, hintIndex, _) => AnimatedSwitcher(
                                duration: const Duration(milliseconds: 350),
                                transitionBuilder: (child, animation) {
                                  return SlideTransition(
                                    position: Tween<Offset>(
                                      begin: const Offset(0.0, 0.4),
                                      end: Offset.zero,
                                    ).animate(animation),
                                    child: FadeTransition(opacity: animation, child: child),
                                  );
                                },
                                child: Align(
                                  alignment: Alignment.centerLeft,
                                  key: ValueKey<int>(hintIndex),
                                  child: Text(
                                    _hints[hintIndex],
                                    style: robotoMedium.copyWith(
                                      fontSize: 14,
                                      color: const Color(0xFF475569),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Mic Icon (Voice Search shortcut)
                InkWell(
                  onTap: () => Get.toNamed(RouteHelper.getSearchRoute()),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8),
                    child: Icon(
                      Icons.mic_rounded,
                      size: 22,
                      color: Color(0xFFFF5200),
                    ),
                  ),
                ),

                // Vertical Divider
                Container(
                  height: 24,
                  width: 1,
                  color: const Color(0xFFCBD5E1),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                ),

                // VEG Toggle Button
                InkWell(
                  onTap: () {
                    setState(() {
                      _isVegOnly = !_isVegOnly;
                    });
                  },
                  borderRadius: const BorderRadius.horizontal(right: Radius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'VEG',
                          style: robotoBold.copyWith(
                            fontSize: 9.5,
                            color: const Color(0xFF1E293B),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Container(
                          width: 26,
                          height: 14,
                          padding: const EdgeInsets.all(1.5),
                          decoration: BoxDecoration(
                            color: _isVegOnly ? const Color(0xFF16A34A) : const Color(0xFFCBD5E1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: AnimatedAlign(
                            duration: const Duration(milliseconds: 180),
                            alignment: _isVegOnly ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              width: 11,
                              height: 11,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(width: 8),

        // Prominent Cart Button with dynamic badge
        InkWell(
          onTap: () => Get.toNamed(RouteHelper.getCartRoute()),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            height: 50,
            width: 50,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.15),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: const Center(
              child: CartWidget(size: 20),
            ),
          ),
        ),
      ],
    ),

          const SizedBox(height: 10),

          // 2. Filter Tabs Strip (ALL | STORE | OFFERS | BOLT) on Dark Wine Background
          SizedBox(
            height: 32,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_filterTabs.length, (index) {
                final tab = _filterTabs[index];
                final bool isSelected = _activeFilterIndex == index;

                return InkWell(
                  onTap: () {
                    setState(() {
                      _activeFilterIndex = index;
                    });
                    if (tab['title'] == 'OFFERS') {
                      Get.toNamed(RouteHelper.getSpecialOfferItemRoute());
                    } else if (tab['title'] == 'STORE') {
                      Get.toNamed(RouteHelper.getAllStoreRoute('popular'));
                    }
                  },
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            tab['icon'] as IconData,
                            size: 14,
                            color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.65),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            tab['title'] as String,
                            style: (isSelected ? robotoBold : robotoMedium).copyWith(
                              fontSize: 12,
                              color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.7),
                              letterSpacing: 0.3,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Container(
                        height: 2.5,
                        width: 28,
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  },
);
  }
}
