import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:scroll_to_index/scroll_to_index.dart';
import 'package:sixam_mart/common/widgets/back_to_top.dart';
import 'package:sixam_mart/common/widgets/cart_count_view.dart';
import 'package:sixam_mart/common/widgets/closed_ribbon_badge.dart';
import 'package:sixam_mart/common/widgets/custom_asset_image_widget.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:sixam_mart/common/widgets/custom_favourite_widget.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/common/widgets/footer_view.dart';
import 'package:sixam_mart/common/widgets/menu_drawer.dart';
import 'package:sixam_mart/common/widgets/not_available_widget.dart';
import 'package:sixam_mart/common/widgets/paginated_list_view.dart';
import 'package:sixam_mart/common/widgets/store_header_banner_widget.dart';
import 'package:sixam_mart/common/widgets/web_item_view.dart';
import 'package:sixam_mart/common/widgets/web_item_widget.dart';
import 'package:sixam_mart/common/widgets/web_menu_bar.dart';
import 'package:sixam_mart/features/address/domain/models/address_model.dart';
import 'package:sixam_mart/features/cart/controllers/cart_controller.dart';
import 'package:sixam_mart/features/cart/domain/models/all_carts_model.dart';
import 'package:sixam_mart/features/cart/screens/cart_screen.dart';
import 'package:sixam_mart/features/category/controllers/category_controller.dart';
import 'package:sixam_mart/features/checkout/controllers/checkout_controller.dart';
import 'package:sixam_mart/features/checkout/screens/checkout_screen.dart';
import 'package:sixam_mart/features/coupon/domain/models/coupon_model.dart' hide Store;
import 'package:sixam_mart/features/dashboard/widgets/last_orders_section_widget.dart';
import 'package:sixam_mart/features/favourite/controllers/favourite_controller.dart';
import 'package:sixam_mart/features/item/controllers/item_controller.dart';
import 'package:sixam_mart/features/item/domain/models/item_model.dart';
import 'package:sixam_mart/features/order/controllers/order_controller.dart';
import 'package:sixam_mart/features/pro/controllers/pro_controller.dart';
import 'package:sixam_mart/features/pro/domain/models/pro_active_offer_model.dart';
import 'package:sixam_mart/features/pro/screens/subscription_plan_screen.dart';
import 'package:sixam_mart/features/pro/widgets/pro_plan_banner_widget.dart';
import 'package:sixam_mart/features/profile/controllers/profile_controller.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/features/store/controllers/store_controller.dart';
import 'package:sixam_mart/features/store/domain/models/store_category_item_model.dart';
import 'package:sixam_mart/features/store/domain/models/store_model.dart';
import 'package:sixam_mart/features/store/widgets/bottom_add_to_cart_widget.dart';
import 'package:sixam_mart/features/store/widgets/coupon_clipper.dart';
import 'package:sixam_mart/features/store/widgets/filter_widget.dart';
import 'package:sixam_mart/features/store/widgets/store_description_view_widget.dart';
import 'package:sixam_mart/features/store/widgets/store_screen_shimmer_widget.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/date_converter.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

class StoreScreen extends StatefulWidget {
  final Store? store;
  final bool fromModule;
  final String slug;
  final bool fromGlobalCart;
  final bool fromDeeplink;
  const StoreScreen({super.key,
    required this.store, required this.fromModule, this.slug = '', this.fromGlobalCart = false, this.fromDeeplink = false,
  });

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  // AutoScrollController (extends ScrollController) so rows can be scroll-tagged
  // and jumped to even when off-screen/unmounted. Every row carries a uniform
  // flat index, and suggestedRowHeight lets scrollToIndex estimate a far target's
  // offset in ~one jump instead of scanning through (and image-decoding) every
  // card in between — which is what crashed on large catalogs. The boundary
  // getter lands a jumped-to section just below the pinned SliverAppBar + tab bar.
  late final AutoScrollController scrollController = AutoScrollController(
    viewportBoundaryGetter: () => Rect.fromLTRB(0, _pinnedTopInset, 0, 0),
    axis: Axis.vertical,
    suggestedRowHeight: 150,
  );
  // Collapsed SliverAppBar (70) + status-bar inset + pinned category tab bar (40).
  // Recomputed in build(); mirrors the ~180 threshold used by auto-detect.
  double _pinnedTopInset = 0;
  double _appBarBottom = 70;
  final GlobalKey _categoryTabsKey = GlobalKey();
  final TextEditingController _searchController = TextEditingController();
  final Map<int, GlobalKey> categoryKeys = {};
  bool _showBackToTop = false;
  static const double _backToTopThreshold = 400;
  static const double _backToTopGap = 12;
  // Anchor lives in a ValueNotifier, not a setState field: it flips when the tab
  // bar pins/unpins, which is a different scroll boundary than the pill's own
  // visibility — routing it through setState would rebuild this whole screen
  final ValueNotifier<double?> _backToTopTop = ValueNotifier(null);
  int? _pendingTabIndex;
  bool _initialCategorySet = false;

  @override
  void initState() {
    super.initState();
    initDataCall();
    if (widget.fromGlobalCart) {
      // widget.store?.id is passed directly from GlobalCartScreen and is always
      // non-null by the time we arrive here, so we don't need to wait for the
      // getStoreDetails API call. Open the sheet on the first frame so it
      // appears simultaneously with the store page transition.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _openCartBottomSheet(widget.store?.id);
      });
    }
  }

  @override
  void dispose() {
    super.dispose();
    scrollController.removeListener(() {});
    scrollController.dispose();
    _backToTopTop.dispose();
    // Free the large per-store item collections on the way out. Guard on the
    // controller still pointing at this store so we don't wipe a different
    // store's freshly-loaded data (e.g. store-from-store navigation).
    final StoreController storeController = Get.find<StoreController>();
    if (storeController.store?.id == widget.store?.id) {
      storeController.clearStoreCategoryItems();
    }
  }

  Future<void> initDataCall() async {
    final CartController cartController = Get.find<CartController>();
    if (cartController.allCartsGroups == null && !cartController.isAllCartsLoading) {
      cartController.getAllCarts(notify: false);
    }
    Get.find<StoreController>().resetFilter(isUpdate: false);
    if (Get.find<StoreController>().isSearching) {
      Get.find<StoreController>().changeSearchStatus(isUpdate: false);
    }
    Get.find<StoreController>().hideAnimation();
    // Distance is not shown on the store screen; checkout recomputes it on entry
    // (initCheckoutData → getStoreDetails), so skip the redundant distance-api call here.
    await Get.find<StoreController>().getStoreDetails(Store(id: widget.store!.id), widget.fromModule, slug: '', calculateDistance: false)
        .then((value) {Get.find<StoreController>().showButtonAnimation();});
    // Load the Pro active offer for this store's module so the Pro discount card
    // can render in the offer scroller for Pro members (the store screen otherwise
    // never fetches it). Scoped to the store's module, falling back to the active one.
    if (Get.find<SplashController>().proStaus && AuthHelper.isLoggedIn()) {
      Get.find<ProController>().getProActiveOffer(
        moduleType: Get.find<StoreController>().store?.moduleType ?? Get.find<SplashController>().module?.moduleType,
      );
    }
    if (Get.find<CategoryController>().categoryList == null) {
      Get.find<CategoryController>().getCategoryList(true);
    }
    Get.find<StoreController>().getStoreBannerList(
      widget.store!.id ?? Get.find<StoreController>().store!.id,
    );
    Get.find<StoreController>().getRestaurantRecommendedItemList(
      widget.store!.id ?? Get.find<StoreController>().store!.id,
      false,
    );
    Get.find<StoreController>().getStoreCategoryItems(
      (widget.store!.id ?? Get.find<StoreController>().store!.id)!,
      notify: false,
    );
    if (AuthHelper.isLoggedIn()) {
      Get.find<OrderController>().getStoreLastOrders(widget.store!.id ?? Get.find<StoreController>().store!.id);
      if(Get.find<SplashController>().proStaus && Get.find<ProfileController>().proStatus){
        Get.find<ProController>().getProActiveOffer(moduleType: Get.find<SplashController>().module?.moduleType);
      }
    }

    scrollController.addListener(() {
      _updateCategoryScrollIndex();

      // Show/hide back to top button
      final bool showBackToTop = scrollController.position.pixels > _backToTopThreshold;
      // The anchor only matters while the pill is on screen, so skip the
      // measurement entirely for the whole scroll range where it's hidden.
      if (showBackToTop) {
        _backToTopTop.value = _resolveBackToTopTop();
      }
      if (showBackToTop != _showBackToTop) {
        setState(() => _showBackToTop = showBackToTop);
      }
    });
  }

  void _updateCategoryScrollIndex() {

    final storeController = Get.find<StoreController>();

    final cats = storeController.storeCategoryItemsModel?.categories ?? [];
    final bool hasMostPopular = storeController.recommendedItemModel?.items?.isNotEmpty == true;
    const double threshold = 180.0;

    // With the item list virtualized (lazy slivers), only categories near the
    // viewport are mounted, so we can only read positions of realized headers.
    // Collect (catIndex, top) for every currently-mounted category header.
    final List<MapEntry<int, double>> realized = [];
    for (int i = 0; i < cats.length; i++) {
      final key = categoryKeys[i];
      if (key?.currentContext != null) {
        final box = key!.currentContext!.findRenderObject() as RenderBox;
        realized.add(MapEntry(i, box.localToGlobal(Offset.zero).dy));
      }
    }

    // No header mounted at all → we're scrolled deep inside one huge category
    // whose header has left the cache extent. Retain the current index; it is
    // already the correct category, so don't reset to Most Popular.
    if (realized.isEmpty) return;

    // Headers we've already scrolled past (top at/above the threshold): the
    // deepest one is the active category (tab catIndex+1). Otherwise the topmost
    // upcoming header is the category we're currently inside — its tab index
    // equals that header's catIndex (0 → the Most Popular section above it).
    final List<MapEntry<int, double>> passed = realized.where((e) => e.value <= threshold).toList();
    int autoIndex = passed.isNotEmpty
        ? passed.map((e) => e.key).reduce((a, b) => a > b ? a : b) + 1
        : realized.map((e) => e.key).reduce((a, b) => a < b ? a : b);

    // Tab 0 (Most Popular) only exists when there's a Most Popular section;
    // otherwise tabs start at the first category (index 1).
    if (!hasMostPopular && autoIndex < 1) autoIndex = 1;

    // If the user physically touches the scroll (any direction), release the
    // pending override so auto-detect takes over immediately.
    if (_pendingTabIndex != null &&
        scrollController.position.userScrollDirection != ScrollDirection.idle) {
      _pendingTabIndex = null;
    }

    // If the user tapped a tab and auto-detect undershoots it (the section
    // landed just below the threshold), keep the tapped selection. Only clear
    // the pending index once auto-detect naturally reaches or passes it.
    if (_pendingTabIndex != null) {
      if (autoIndex < _pendingTabIndex!) {
        if (storeController.categoryScrollIndex != _pendingTabIndex) {
          storeController.setCategoryScrollIndex(_pendingTabIndex!);
        }
        return;
      }
      _pendingTabIndex = null;
    }

    if (storeController.categoryScrollIndex != autoIndex) {
      storeController.setCategoryScrollIndex(autoIndex);
    }
  }

  double _resolveBackToTopTop() {
    double anchorBottom = _appBarBottom;
    final BuildContext? tabsContext = _categoryTabsKey.currentContext;
    final RenderObject? renderObject = tabsContext?.findRenderObject();
    if (renderObject is RenderBox && renderObject.attached && renderObject.hasSize) {
      final double tabsTop = renderObject.localToGlobal(Offset.zero).dy;
      if (tabsTop <= _appBarBottom + 1) {
        anchorBottom = tabsTop + renderObject.size.height;
      }
    }
    return anchorBottom + _backToTopGap;
  }

  Widget _buildMobileItemsSliver(Store store, StoreController storeController) {
    return SliverFillRemaining(
      hasScrollBody: true,
      child: _StoreVerticalCategorySplitView(
        store: store,
        storeController: storeController,
      ),
    );
  }

  void _scrollToTop() {
    if (!scrollController.hasClients) return;
    scrollController.animateTo(0, duration: const Duration(milliseconds: 400), curve: Curves.easeOut);
  }

  void _openCartBottomSheet(int? storeId) {
    if (storeId == null || !mounted) return;
    CartScreen.openAsBottomSheet(context, storeId: storeId);
  }

  void _handleBack() {
    // Only reset to Home when this screen instance was itself pushed via a
    // deep link (no real back stack behind it). Checking the global
    // SplashController.deeplinkRoute instead of this instance flag is what
    // caused back to blow away the stack on ordinary in-app navigation (e.g.
    // Search -> Store): app_links can redeliver a stale/unrelated URI mid-session,
    // leaving that ambient flag non-null even though this screen was reached normally.
    if (widget.fromDeeplink) {
      Get.find<SplashController>().setDeeplink(null);
      Get.offAllNamed(RouteHelper.getInitialRoute());
    } else if (Navigator.canPop(context)) {
      Navigator.pop(context);
    } else if (Get.key.currentState?.canPop() ?? false) {
      Get.back();
    } else if (Get.previousRoute.isNotEmpty && Get.previousRoute != Get.currentRoute && Get.previousRoute != '/') {
      Get.back();
    } else {
      Get.offAllNamed(RouteHelper.getInitialRoute());
    }
  }

  void _openStoreSearch(Store store) {
    Get.toNamed(RouteHelper.getSearchStoreItemRoute(store.id));
  }

  // Native collapsing header. SliverAppBar handles the pin/collapse + content
  // positioning; everything inside is scroll-linked to the layout extent (no
  // GlobalKey, no overlay, no scroll-listener animation) so it stays in sync and
  // reverses cleanly. Dimensions match the previous header (max 200, min 70+inset)
  // so the content below keeps its exact position.
  Widget _buildStoreSliverHeader(BuildContext context, Store store, StoreController storeController) {
    final double topPadding = MediaQuery.of(context).padding.top;
    final double screenWidth = MediaQuery.of(context).size.width;
    // Visible header is a full-width 2:1 banner (height = width / 2). SliverAppBar
    // adds the status-bar inset on top of expandedHeight, so subtract it here — the
    // total (expandedHeight + status bar) then equals the 2:1 height exactly, with
    // no extra strip above the banner.
    final double bannerHeight = (screenWidth / 2).clamp(160.0, 320.0).toDouble();
    final double maxH = bannerHeight - topPadding;
    final double minH = 70 + topPadding;

    return SliverAppBar(
      pinned: true,
      expandedHeight: maxH,
      collapsedHeight: 70,
      toolbarHeight: 70,
      backgroundColor: Theme.of(context).cardColor,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      automaticallyImplyLeading: false,
      actions: const [SizedBox()],
      flexibleSpace: LayoutBuilder(builder: (BuildContext context, BoxConstraints constraints) {
        // 0 = fully expanded, 1 = fully collapsed (driven by the real header height).
        final double t = ((maxH - constraints.maxHeight) / (maxH - minH)).clamp(0.0, 1.0);
        final double coverOpacity = (1 - t * 1.6).clamp(0.0, 1.0);     // image + circular controls fade out
        final double barOpacity = ((t - 0.55) / 0.45).clamp(0.0, 1.0); // soft bar fades in
        final double verifiedOpacity = (1 - t * 2).clamp(0.0, 1.0);    // verified chip fades out early
        final double titleT = ((t - 0.8) / 0.2).clamp(0.0, 1.0);       // title slides up + fades in at the tail

        return Stack(fit: StackFit.expand, children: <Widget>[
          // Solid base — header is always opaque, no bleed-through.
          Container(color: Theme.of(context).cardColor),

          // Cover layer: collapsing image + circular controls + verified chip.
          Opacity(
            opacity: coverOpacity,
            child: IgnorePointer(
              ignoring: t > 0.5,
              child: Stack(children: <Widget>[
                // Show the store banners (auto-scrolling carousel) when available;
                // otherwise fall back to the cover photo. Pass the flexibleSpace's
                // actual height (constraints.maxHeight) — the carousel sizes and
                // centers each item by this value, so anything smaller leaves a gap.
                Positioned.fill(
                  child: (storeController.storeBanners != null && storeController.storeBanners!.isNotEmpty)
                      ? StoreHeaderBanner(banners: storeController.storeBanners!, height: constraints.maxHeight)
                      : CustomImage(fit: BoxFit.cover, image: store.coverPhotoFullUrl ?? ''),
                ),

                PositionedDirectional(
                  top: topPadding + 12, start: Dimensions.paddingSizeDefault,
                  child: _StoreCircleIconButton(icon: Icons.arrow_back, onTap: _handleBack),
                ),

                PositionedDirectional(
                  top: topPadding + 12, end: Dimensions.paddingSizeDefault,
                  child: Row(mainAxisSize: MainAxisSize.min, children: <Widget>[
                    _StoreCircleIconButton(icon: CupertinoIcons.search, onTap: () => _openStoreSearch(store)),
                    const SizedBox(width: Dimensions.paddingSizeSmall),
                    if (AppConstants.webHostedUrl.isNotEmpty) ...[
                      _StoreCircleIconButton(icon: Icons.share_outlined, onTap: storeController.shareStore),
                      const SizedBox(width: Dimensions.paddingSizeSmall),
                    ],
                    _StoreFavouriteCircleButton(store: store),
                  ]),
                ),

                if (store.verifiedSeller == 1 && verifiedOpacity > 0)
                  Positioned(
                    left: Dimensions.paddingSizeDefault, bottom: Dimensions.paddingSizeDefault,
                    child: Opacity(opacity: verifiedOpacity, child: const _VerifiedChip()),
                  ),
              ]),
            ),
          ),

          // Collapsed bar: back + (tail-revealed) store name + search.
          Align(
            alignment: Alignment.topCenter,
            child: Opacity(
              opacity: barOpacity,
              child: IgnorePointer(
                ignoring: t < 0.5,
                child: Padding(
                  padding: EdgeInsets.only(top: topPadding, left: Dimensions.paddingSizeDefault, right: Dimensions.paddingSizeDefault),
                  child: SizedBox(
                    height: 70,
                    child: Row(children: <Widget>[
                      _StoreSoftIconButton(icon: Icons.arrow_back, onTap: _handleBack),
                      const SizedBox(width: Dimensions.paddingSizeSmall),
                      Expanded(
                        child: ClipRect(
                          child: Transform.translate(
                            offset: Offset(0, (1 - titleT) * 14),
                            child: Opacity(
                              opacity: titleT,
                              child: Text(store.name ?? '', maxLines: 1, overflow: TextOverflow.ellipsis,
                                style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: Dimensions.paddingSizeSmall),
                      _StoreSoftIconButton(icon: CupertinoIcons.search, onTap: () => _openStoreSearch(store)),
                    ]),
                  ),
                ),
              ),
            ),
          ),
        ]);
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Land a tab-jumped category header just below the pinned SliverAppBar (70)
    // + status bar + pinned category tab bar (40). Read by scrollToIndex.
    _appBarBottom = 70 + MediaQuery.of(context).padding.top;
    _pinnedTopInset = _appBarBottom + 40;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        if (widget.fromDeeplink) {
          Get.find<SplashController>().setDeeplink(null);
          Get.offAllNamed(RouteHelper.getInitialRoute());
        } else {
          try {
            Get.back();
          } catch (e) {
            return;
          }
        }
      },
      child: Scaffold(
        appBar: ResponsiveHelper.isDesktop(context) ? const WebMenuBar() : null,
        endDrawer: const MenuDrawer(),
        endDrawerEnableOpenDragGesture: false,
        backgroundColor: Theme.of(context).colorScheme.surface,
        body: Stack(children: [
          GetBuilder<StoreController>(
            builder: (storeController) {
            return GetBuilder<CategoryController>(
              builder: (categoryController) {
                Store? store;
                if (storeController.store != null && storeController.store!.name != null && storeController.storeCategoryItemsModel != null) {
                  store = storeController.store;
                  storeController.setCategoryList();
                  if (!_initialCategorySet) {
                    _initialCategorySet = true;
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (mounted) _updateCategoryScrollIndex();
                    });
                  }
                }

                return (storeController.store != null && storeController.store!.name != null && storeController.storeCategoryItemsModel != null)
                  ? CustomScrollView(physics: const AlwaysScrollableScrollPhysics(), controller: scrollController, slivers: [
                    ResponsiveHelper.isDesktop(context)
                      ? SliverToBoxAdapter(
                        child: Container(
                          color: const Color(0xFF171A29),
                          padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
                          alignment: Alignment.center,
                          child: Center(
                            child: SizedBox(
                              width: Dimensions.webMaxWidth,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall),
                                  child: Row(children: [
                                    Expanded(
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                                        child: Stack(children: [
                                          CustomImage(fit: BoxFit.fill, height: 240, width: 590,
                                            image: store?.coverPhotoFullUrl ?? ''
                                          ),
                                          store?.discount != null
                                            ? Positioned(bottom: 0, left: 0, right: 0,
                                              child: Container(
                                                width: double.infinity,
                                                decoration: BoxDecoration(color: Theme.of(context).primaryColor),
                                                padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall),
                                                child: Text(
                                                  '${store?.discount!.discountType == 'percent' ? '${store?.discount!.discount}%' : PriceConverter.convertPrice(store?.discount!.discount)} '
                                                  '${'discount_will_be_applicable_when_order_amount_exceeds_is_more_than'.tr} ${PriceConverter.convertPrice(store?.discount!.minPurchase)},'
                                                  ' ${'Max'.tr}: ${PriceConverter.convertPrice(store?.discount!.maxDiscount)} ${'discount_is_applicable'.tr}',
                                                  style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Colors.white),
                                                  textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ) : const SizedBox(),
                                        ]),
                                      ),
                                    ),
                                    const SizedBox(width: Dimensions.paddingSizeLarge),
                                    Expanded(child: StoreDescriptionViewWidget(store: store)),
                                  ]),
                                ),
                              ),
                            ),
                          ),
                        )
                      : _buildStoreSliverHeader(context, store!, storeController),

                      (ResponsiveHelper.isDesktop(context) && storeController.recommendedItemModel != null && storeController.recommendedItemModel!.items!.isNotEmpty)
                        ? SliverToBoxAdapter(child: Container(
                          color: Theme.of(context).primaryColor.withValues(alpha: 0.10),
                          child: Center(
                            child: SizedBox(
                              width: Dimensions.webMaxWidth,
                              height: ResponsiveHelper.isDesktop(context) ? 325 : 125,
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                const SizedBox(height: Dimensions.paddingSizeSmall),
                                Text(
                                  'recommended_for_you'.tr,
                                  style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                                Text(
                                  'here_is_what_you_might_like'.tr,
                                  style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).disabledColor),
                                ),
                                const SizedBox(height: Dimensions.paddingSizeExtraSmall),

                                SizedBox(
                                  height: 250,
                                  child: ListView.builder(
                                    shrinkWrap: true,
                                    scrollDirection: Axis.horizontal,
                                    itemCount: storeController.recommendedItemModel!.items!.length,
                                    physics: const BouncingScrollPhysics(),
                                    padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeExtraSmall),
                                    itemBuilder: (context, index) {
                                      return Container(
                                        width: 225,
                                        padding: const EdgeInsets.only(right: Dimensions.paddingSizeSmall, left: Dimensions.paddingSizeExtraSmall),
                                        margin: const EdgeInsets.only(right: Dimensions.paddingSizeSmall),
                                        child: WebItemWidget(isStore: false,
                                          item: storeController.recommendedItemModel!.items![index],
                                          store: null, index: index, length: null, isCampaign: false, inStore: true,
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ]),
                            ),
                          ),
                        )) : const SliverToBoxAdapter(child: SizedBox()),

                      ///web view..
                      ResponsiveHelper.isDesktop(context)
                        ? SliverToBoxAdapter(child: FooterView(child: SizedBox(
                          width: Dimensions.webMaxWidth,
                          child: Column(children: [
                            store?.announcementActive ?? false ? Container(
                              decoration: BoxDecoration(
                                color: Theme.of(context).primaryColor.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                                border: Border.all(color: Theme.of(context).primaryColor.withValues(alpha: 0.2)),
                              ),
                              padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
                              margin: const EdgeInsets.only(top: Dimensions.paddingSizeSmall),
                              child: Row(children: [
                                Image.asset(Images.announcement, height: 20, width: 20),
                                const SizedBox(width: Dimensions.paddingSizeSmall),

                                Flexible(
                                  child: Text(store?.announcementMessage ?? '',
                                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                                  ),
                                ),
                              ]),
                            ) : const SizedBox(),
                            const SizedBox(height: Dimensions.paddingSizeDefault),
                            Row(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.start, children: [
                              SizedBox(
                                width: 175,
                                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Expanded(
                                    child: ListView.builder(
                                      shrinkWrap: true,
                                      scrollDirection: Axis.vertical,
                                      itemCount: (storeController.categoryList?.length ?? 0) > 1 ? storeController.categoryList!.length : 0,
                                      padding: const EdgeInsets.only(left: Dimensions.paddingSizeSmall),
                                      physics: const NeverScrollableScrollPhysics(),
                                      itemBuilder: (context, index) {
                                        return InkWell(
                                          onTap: () {
                                            storeController.setCategoryIndex(index, itemSearching: storeController.isSearching);
                                          },
                                          child: Padding(
                                            padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeExtraSmall),
                                              decoration: BoxDecoration(
                                                gradient: LinearGradient(
                                                  begin: Alignment.bottomRight, end: Alignment.topLeft,
                                                  colors: <Color>[
                                                    index == storeController.categoryIndex ? Theme.of(context).primaryColor.withValues(alpha: 0.50) : Colors.transparent,
                                                    index == storeController.categoryIndex ? Theme.of(context).cardColor : Colors.transparent,
                                                  ],
                                                ),
                                              ),
                                              child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                                                Text(
                                                  storeController.categoryList![index].name!,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: index == storeController.categoryIndex
                                                      ? robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).primaryColor)
                                                      : robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                                                ),
                                              ]),
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  ),

                                  Container(
                                    height: (storeController.categoryList?.length ?? 0) * 50, width: 1,
                                    color: Theme.of(context).disabledColor.withValues(alpha: 0.5),
                                  ),
                                ]),
                              ),
                              const SizedBox(width: Dimensions.paddingSizeLarge),

                              Expanded(
                                child: Column(children: [
                                  Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                                    Container(
                                      padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall),
                                      height: 45, width: 430,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                                        color: Theme.of(context).cardColor,
                                        border: Border.all(color: Theme.of(context).primaryColor.withValues(alpha: 0.40)),
                                      ),
                                      child: Row(children: [
                                        Expanded(
                                          child: TextField(
                                            controller: _searchController,
                                            textInputAction: TextInputAction.search,
                                            decoration: InputDecoration(
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 0),
                                              hintText: 'search_for_items'.tr,
                                              hintStyle: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).disabledColor),
                                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(Dimensions.radiusSmall), borderSide: BorderSide.none),
                                              filled: true,
                                              fillColor: Theme.of(context).cardColor,
                                              isDense: true,
                                              prefixIcon: Icon(Icons.search, color: Theme.of(context).primaryColor.withValues(alpha: 0.50)),
                                            ),
                                            onSubmitted: (String? value) {
                                              if (value!.isNotEmpty) {
                                                Get.find<StoreController>().getStoreSearchItemList(_searchController.text.trim(), widget.store!.id.toString(), 1, storeController.type,);
                                              }
                                            },
                                            onChanged: (String? value) {},
                                          ),
                                        ),
                                        const SizedBox(width: Dimensions.paddingSizeSmall),

                                        !storeController.isSearching ? CustomButton(
                                          radius: Dimensions.radiusSmall,
                                          height: 40, width: 74,
                                          buttonText: 'search'.tr,
                                          isBold: false,
                                          fontSize: Dimensions.fontSizeSmall,
                                          onPressed: () {
                                            storeController.getStoreSearchItemList(
                                              _searchController.text.trim(),
                                              widget.store!.id.toString(), 1,
                                              storeController.type,
                                            );
                                          },
                                        )
                                        : InkWell(
                                          onTap: () {_searchController.text = '';storeController.initSearchData();storeController.changeSearchStatus();},
                                          child: Container(
                                            decoration: BoxDecoration(color: Theme.of(context).primaryColor, borderRadius: BorderRadius.circular(Dimensions.radiusSmall)),
                                            padding: const EdgeInsets.symmetric(vertical: 3, horizontal: Dimensions.paddingSizeSmall),
                                            child: const Icon(Icons.clear, color: Colors.white),
                                          ),
                                        ),
                                      ]),
                                    ),
                                    const SizedBox(width: Dimensions.paddingSizeDefault),

                                    InkWell(
                                      onTap: () {
                                        Get.dialog(const FilterWidget());
                                      },
                                      child: Container(
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                                          color: Theme.of(context).cardColor,
                                          border: Border.all(color: Theme.of(context,).primaryColor, width: 1),
                                        ),
                                        padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall),
                                        child: Icon(Icons.filter_list, size: 24, color: Theme.of(context).primaryColor),
                                      ),
                                    ),

                                    /*(Get.find<SplashController>().configModel!.moduleConfig!.module!.vegNonVeg! && Get.find<SplashController>().configModel!.toggleVegNonVeg!)
                                    ? SizedBox(
                                      width: 300,
                                      height:  30,
                                      child:  ListView.builder(
                                        shrinkWrap: true,
                                        scrollDirection: Axis.horizontal,
                                        itemCount: Get.find<ItemController>().itemTypeList.length,
                                        padding: const EdgeInsets.only(left: Dimensions.paddingSizeSmall),
                                        physics: const NeverScrollableScrollPhysics(),
                                        itemBuilder: (context, index) {
                                          return Padding(
                                            padding: const EdgeInsets.only(right: Dimensions.paddingSizeSmall),
                                            child:  CustomCheckBoxWidget(
                                              title: Get.find<ItemController>().itemTypeList[index].tr,
                                              value: storeController.type == Get.find<ItemController>().itemTypeList[index],
                                              onClick: () {
                                                if(storeController.isSearching){
                                                  storeController.getStoreSearchItemList(
                                                    storeController.searchText, widget.store!.id.toString(), 1, Get.find<ItemController>().itemTypeList[index],
                                                  );
                                                } else {
                                                  storeController.getStoreItemList(storeController.store!.id, 1, Get.find<ItemController>().itemTypeList[index], true);
                                                }
                                              },
                                            ),
                                          );
                                        },
                                      ),
                                    ) : const SizedBox(),*/
                                                  ]),
                                  const SizedBox(height: Dimensions.paddingSizeSmall),

                                  PaginatedListView(
                                    scrollController: scrollController,
                                    onPaginate: (int? offset) async {
                                      if (storeController.isSearching) {
                                        await storeController.getStoreSearchItemList(
                                          storeController.searchText, widget.store!.id.toString(), offset!, storeController.type,
                                        );
                                      } else {
                                        await storeController.getStoreItemList(widget.store!.id ?? storeController.store!.id,
                                          offset!, storeController.type, false,
                                        );
                                      }
                                    },
                                    totalSize: storeController.isSearching ? storeController.storeSearchItemModel?.totalSize : storeController.storeItemModel?.totalSize,
                                    offset: storeController.isSearching ? storeController.storeSearchItemModel?.offset : storeController.storeItemModel?.offset,
                                    itemView: WebItemsView(isStore: false, stores: null, fromStore: true,
                                      items: storeController.isSearching ? storeController.storeSearchItemModel?.items
                                          : (storeController.categoryList!.isNotEmpty && storeController.storeItemModel != null) ? storeController.storeItemModel!.items : null,
                                      inStorePage: true,
                                      padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeSmall),
                                    ),
                                  ),
                                ]),
                              ),
                            ]),
                          ]),
                        ))) : const SliverToBoxAdapter(child: SizedBox()),

                      ///mobile view..
                      ResponsiveHelper.isDesktop(context) ? const SliverToBoxAdapter(child: SizedBox()) : SliverToBoxAdapter(child: _MobileStoreOverview(store: store!)),

                      !Get.find<SplashController>().proStaus || Get.find<ProfileController>().proStatus ? const SliverToBoxAdapter(child: SizedBox()) : SliverToBoxAdapter(
                        child: Container(
                          color: Theme.of(context).cardColor,
                          padding: const EdgeInsets.fromLTRB(Dimensions.paddingSizeDefault, Dimensions.paddingSizeExtraSmall, Dimensions.paddingSizeDefault, Dimensions.paddingSizeSmall),
                          child: ProPlanBannerWidget(
                            onSubscribe: () {
                              final Store? storeData = Get.find<StoreController>().store;
                              Get.find<ProController>().saveCurrentPath(route: RouteHelper.getStoreRoute(
                                id: storeData?.id, page: 'store', slug: storeData?.slug ?? '',
                              ));
                              SubscriptionPlanScreen.open();
                            },
                          ),
                        ),
                      ),

                      if((Get.find<OrderController>().storeLastOrders?.isNotEmpty ?? false)) const SliverToBoxAdapter(child: Column( children: [
                        Padding(
                          padding: EdgeInsets.only( bottom: Dimensions.paddingSizeSmall, top: Dimensions.paddingSizeExtraSmall),
                          child: LastOrdersSectionWidget(fromStore: true),
                        ),
                      ])),

                      ResponsiveHelper.isDesktop(context)
                          ? const SliverToBoxAdapter(child: SizedBox())
                          : _buildMobileItemsSliver(store!, storeController),
                    ]) : const StoreScreenShimmerWidget();
              },
            );
          },
        ),

          ValueListenableBuilder<double?>(
            valueListenable: _backToTopTop,
            builder: (context, top, _) => BackToTopButton(visible: _showBackToTop, onTap: _scrollToTop,
              top: top ?? (_appBarBottom + _backToTopGap),
            ),
          ),

          // Sticky bottom cart widget
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: GetBuilder<CartController>(
              builder: (cartController) {
                if (ResponsiveHelper.isDesktop(context)) return const SizedBox();
                final int? currentStoreId = widget.store?.id ?? Get.find<StoreController>().store?.id;
                if (currentStoreId == null) return const SizedBox();
                final AllCartsModel? existingCart = cartController.getCartsForStore(currentStoreId);
                return existingCart != null && Get.find<StoreController>().store != null ? BottomAddToCartWidget(storeId: currentStoreId) : const SizedBox();
              },
            ),
          ),
        ]),

        floatingActionButton: GetBuilder<StoreController>(
          builder: (storeController) {
            return Visibility(
              visible: storeController.showFavButton &&
                Get.find<SplashController>().configModel!.moduleConfig!.module!.orderAttachment! &&
                (storeController.store != null && storeController.store!.prescriptionOrder!) &&
                Get.find<SplashController>().configModel!.prescriptionStatus!,
              child: Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                  boxShadow: [BoxShadow(
                    color: Theme.of(context).primaryColor.withValues(alpha: 0.5),
                    blurRadius: 10, offset: const Offset(2, 2),
                  )],
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 800),
                    width: storeController.currentState == true ? 0 : ResponsiveHelper.isDesktop(context) ? 180 : 150,
                    height: 30,
                    curve: Curves.linear,
                    child: Center(
                      child: Text(
                        'prescription_order'.tr,
                        textAlign: TextAlign.center,
                        style: robotoMedium.copyWith(color: Theme.of(context).primaryColor),
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),

                  InkWell(
                    onTap: () {
                      if (AuthHelper.isLoggedIn()) {
                        Get.find<CheckoutController>().updateFirstTime();
                        Get.find<CheckoutController>().updateFirstTimeCodActive();
                        Get.toNamed(
                          RouteHelper.getCheckoutRoute('prescription', storeId: storeController.store!.id),
                          arguments: CheckoutScreen(fromCart: false, cartList: null, storeId: storeController.store!.id),
                        );
                      } else {
                        showCustomSnackBar("you_are_not_logged_in".tr);
                      }
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: Theme.of(context).primaryColor,
                        borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      ),
                      padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
                      child: Image.asset(Images.prescriptionIcon, height: 25, width: 25),
                    ),
                  ),
                ]),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _MobileStoreOverview extends StatelessWidget {
  final Store store;

  const _MobileStoreOverview({required this.store});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: Dimensions.webMaxWidth, color: Theme.of(context).cardColor,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.only(top: Dimensions.paddingSizeDefault, left: Dimensions.paddingSizeDefault, right: Dimensions.paddingSizeDefault),
            child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
              ClipRRect(borderRadius: BorderRadius.circular(14),
                child: Stack(children: [
                  CustomImage(image: store.logoFullUrl ?? '', height: 44, width: 44, fit: BoxFit.cover),
                  Get.find<StoreController>().isStoreOpenNow(store.active!, store.schedules) ? const SizedBox()
                    : const Positioned(left: 0, right: 0, bottom: 0, child: ClosedRibbonBadge()),
                ]),
              ),
              const SizedBox(width: Dimensions.paddingSizeDefault),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(store.name ?? '', maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: robotoBold.copyWith(fontSize: Dimensions.fontSizeExtraLarge),
                  ),
                  InkWell(
                    onTap: () => Get.toNamed(RouteHelper.getMapRoute(
                      AddressModel(id: store.id, address: store.address, latitude: store.latitude,
                        longitude: store.longitude, contactPersonNumber: '', contactPersonName: '', addressType: '',
                      ), 'store', Get.find<SplashController>().getModuleConfig(Get.find<SplashController>().module!.moduleType!).newVariation!,
                      storeName: store.name, slug: store.slug ?? store.name!,
                    )),
                    child: Row(children: [
                      Icon(Icons.location_on_outlined, color: Theme.of(context).colorScheme.tertiary, size: 14),
                      Text(store.address ?? '', maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).colorScheme.tertiary),
                      ),
                    ]),
                  ),
                ]),
              ),
            ]),
          ),
          const SizedBox(height: Dimensions.paddingSizeDefault),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
            child: _StoreStatsCard(store: store),
          ),
          _StoreAnnouncementScroller(store: store),
        ]),
      ),
    );
  }
}

class _StoreStatsCard extends StatelessWidget {
  final Store store;

  const _StoreStatsCard({required this.store});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: Theme.of(context).disabledColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeSmall),
      child: Row(children: [
        Expanded(
          child: InkWell(
            onTap: () => Get.toNamed(RouteHelper.getStoreReviewRoute(store.id, store.name, store, slug: store.slug ?? store.name!)),
            child: _StoreStatItem(icon: Icons.star, iconColor: const Color(0xFFFFA000),
              value: (store.avgRating ?? 0).toStringAsFixed(1), label: '${store.ratingCount ?? 0}${(store.ratingCount != null && store.ratingCount! > 5) ? '+ ${'reviews'.tr}' : ' ${ 'review'.tr}'}',
            ),
          ),
        ),
        const _StoreStatDivider(),
        Expanded(child: _StoreStatItem(value: store.deliveryTime ?? '', label: 'delivery_time'.tr)),
        const _StoreStatDivider(),
        Expanded(child: _StoreStatItem(value: PriceConverter.convertPrice(store.minimumOrder), label: 'min_order'.tr)),
      ]),
    );
  }
}

class _StoreStatItem extends StatelessWidget {
  final IconData? icon;
  final Color? iconColor;
  final String value;
  final String label;

  const _StoreStatItem({this.icon, this.iconColor, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Row(mainAxisAlignment: MainAxisAlignment.center, mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 18, color: iconColor), const SizedBox(width: 3)],
        Flexible(
          child: Text(value, maxLines: 1, overflow: TextOverflow.ellipsis,
            style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault),
          ),
        ),
      ]),
      const SizedBox(height: 2),
      Text(label, maxLines: 1, overflow: TextOverflow.ellipsis,
        style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).textTheme.bodyLarge!.color!.withValues(alpha: 0.5)),
      ),
    ]);
  }
}

class _StoreStatDivider extends StatelessWidget {
  const _StoreStatDivider();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(width: 4);
  }
}

class _StoreAnnouncementScroller extends StatelessWidget {
  final Store store;

  const _StoreAnnouncementScroller({required this.store});

  @override
  Widget build(BuildContext context) {
    // Wrapped in GetBuilder<ProController> so the pro card appears as soon as the
    // active-offer data loads (mirrors ProPlanBannerWidget's reactivity).
    return GetBuilder<ProController>(builder: (proController) {
      final Widget? proCard = _buildProCard(proController);
      final List<_StoreOfferData> offers = _buildOffers(context);
      if (proCard == null && offers.isEmpty) {
        return const SizedBox(height: Dimensions.paddingSizeSmall);
      }

      // Pro card first (when the user has Pro), then the regular offer cards.
      final List<Widget> cards = <Widget>[
        ?proCard,
        ...offers.map((_StoreOfferData offer) => _StoreOfferCard(data: offer)),
      ];

      return Padding(
        padding: const EdgeInsets.only(top: Dimensions.paddingSizeLarge, bottom: Dimensions.paddingSizeSmall),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: List.generate(cards.length, (int index) {
                return Padding(
                  padding: EdgeInsets.only(right: index < cards.length - 1 ? Dimensions.paddingSizeDefault : 0),
                  child: cards[index],
                );
              }),
            ),
          ),
        ),
      );
    });
  }

  // Pro benefit card — shown for Pro members whose active offer applies to this
  // store's module. The headline + subtitle adapt per benefit type, mirroring
  // ProBenefitBannerWidget (discount / delivery fee / coupon).
  Widget? _buildProCard(ProController proController) {
    if (!Get.find<SplashController>().proStaus || !Get.find<ProfileController>().proStatus) {
      return null;
    }
    final ProActiveBenefit? benefit = proController.activeOfferModel?.benefit;
    if (benefit == null || !proController.isBenefitAllowedForCurrentModule(benefit.type)) {
      return null;
    }

    // Default subtitle: the "special saving" line, prefixed with a min-purchase
    // note when the benefit enforces one (matches the card design in the spec).
    final bool hasMin = benefit.minOrderStatus == true && (benefit.minOrderAmount ?? 0) > 0;
    final String savingSubtitle = hasMin
        ? '${'min_purchase'.tr} ${PriceConverter.convertPrice(benefit.minOrderAmount)} ${'and_special_saving_for_mart_pro_members'.tr}'
        : 'special_saving_for_mart_pro_members'.tr;

    String? headline;
    String subtitle = savingSubtitle;

    // type is non-null here (isBenefitAllowedForCurrentModule rejects a null type).
    switch (benefit.type!) {
      case ProBenefitType.discount:
        final double pct = benefit.percentage ?? 0;
        if (pct > 0) headline = '${pct.toStringAsFixed(pct % 1 == 0 ? 0 : 1)}% OFF';
        break;

      case ProBenefitType.deliveryFee:
        if (benefit.offerType == ProOfferType.fullFree) {
          headline = 'free_delivery'.tr;
        } else if ((benefit.chargeDiscountPercentage ?? 0) > 0) {
          headline = '${(benefit.chargeDiscountPercentage ?? 0).toStringAsFixed(0)}% OFF';
        }
        break;

      case ProBenefitType.coupon:
        headline = 'pro_coupon'.tr;
        subtitle = 'you_have_a_coupon_as_a_pro_member'.tr;
        break;
    }

    if (headline == null) return null;
    return _StoreProCard(discountText: headline, subtitle: subtitle);
  }

  List<_StoreOfferData> _buildOffers(BuildContext context) {
    final List<_StoreOfferData> offers = [];
    if (store.discount != null && (store.discount!.discount ?? 0) > 0) {
      offers.add(
        _StoreOfferData(
          title: _discountTitle(store),
          message: '${'min_purchase'.tr} ${PriceConverter.convertPrice(store.discount!.minPurchase)} ${'and_max_discount_is'.tr} ${PriceConverter.convertPrice(store.discount!.maxDiscount)}',
          imageUrl: Images.discountOfferIcon, color: const Color(0xFFFFF9EA),
        ),
      );
    }

    // Add active coupons
    if (store.activeCoupons != null && store.activeCoupons!.isNotEmpty) {
      for (var couponJson in store.activeCoupons!) {
        final CouponModel coupon = CouponModel.fromJson(couponJson);
        offers.add(
          _StoreOfferData(
            title: '${coupon.discount}% OFF',
            subTitle: '(${coupon.title})',
            message: '${'min_order'.tr} ${coupon.minPurchase} ${'valid_for_all_items'.tr}',
            imageUrl: Images.couponRedIcon,
            color: const Color(0xFFFFF1F1),
            isCoupon: true,
            coupon: coupon,
          ),
        );
      }
    }
    if (store.announcementActive == true && (store.announcementMessage ?? '').isNotEmpty) {
      offers.add(
        _StoreOfferData(title: 'announcement'.tr, message: store.announcementMessage ?? '',
          imageUrl: Images.announcement, color: const Color(0xFFF1FFF9)
        ),
      );
    }
    return offers;
  }

  String _discountTitle(Store store) {
    final double discount = store.discount?.discount ?? 0;
    if (store.discount?.discountType == 'percent') {return '${discount.toStringAsFixed(discount % 1 == 0 ? 0 : 1)}% OFF';}
    return '${PriceConverter.convertPrice(discount)} OFF';
  }
}

class _StoreOfferData {
  final String title;
  final String? subTitle;
  final String message;
  final String imageUrl;
  final Color color;
  final bool isCoupon;
  final CouponModel? coupon;

  const _StoreOfferData({
    required this.title,
    required this.message,
    required this.imageUrl,
    required this.color,
    this.isCoupon = false,
    this.subTitle,
    this.coupon,
  });
}

class _StoreOfferCard extends StatelessWidget {
  final _StoreOfferData data;

  const _StoreOfferCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final cardContent = Container(
      width: 200,
      padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: Dimensions.paddingSizeSmall,),
      decoration: BoxDecoration(color: data.color, borderRadius: data.isCoupon ? null : BorderRadius.circular(12)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Image.asset(data.imageUrl, height: 14, width: 14),
              const SizedBox(width: 4),
              Text(data.title, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge, color: const Color(0xFF1F2A44)),
              ),
            ]),
          ),
        ]),
        data.subTitle == null ? const SizedBox.shrink() : Padding(
          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeExtraSmall),
          child: Text(data.subTitle ?? '', maxLines: 1, overflow: TextOverflow.ellipsis,
            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault, color: const Color(0xFF1F2A44)),
          ),
        ),
        data.subTitle == null ? const SizedBox.shrink() : const SizedBox(height: 4),
        Text(
          data.message,
          style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: const Color(0xFF777777)),
        ),
      ]),
    );

    final Widget card = data.isCoupon
      ? ClipPath(
          clipper: CouponClipper(borderRadius: 16, notchRadius: 12),
          child: cardContent,
        )
      : cardContent;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => _showStoreOfferSheet(context, _OfferDetailSheet(
        title: data.title,
        subTitle: data.subTitle,
        message: data.message,
        accentColor: data.color,
        imageAsset: data.imageUrl,
        coupon: data.coupon,
      )),
      child: card,
    );
  }
}

// Pro membership discount card shown in the store offer scroller for Pro members.
class _StoreProCard extends StatelessWidget {
  final String discountText;
  final String subtitle;

  const _StoreProCard({required this.discountText, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    const Color proBlue = Color(0xFF3B5BDB);
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => _showStoreOfferSheet(context, _OfferDetailSheet(
        title: discountText,
        message: subtitle,
        accentColor: const Color(0xFFE9F0FF),
        isPro: true,
      )),
      child: Container(
      width: 200,
      padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: Dimensions.paddingSizeSmall),
      decoration: BoxDecoration(color: const Color(0xFFE9F0FF), borderRadius: BorderRadius.circular(12)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: 3),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.star_rounded, size: 16, color: proBlue),
              const SizedBox(width: 3),
              Text('pro'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall, color: proBlue)),
            ]),
          ),
          const SizedBox(width: Dimensions.paddingSizeSmall),
          Flexible(
            child: Text(discountText, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge, color: const Color(0xFF1F2A44)),
            ),
          ),
        ]),
        const SizedBox(height: Dimensions.paddingSizeSmall),
        Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis,
          style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: const Color(0xFF777777)),
        ),
      ]),
      ),
    );
  }
}

void _showStoreOfferSheet(BuildContext context, Widget sheet) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => sheet,
  );
}

// Detail bottom sheet for a tapped store offer card (discount / free delivery /
// coupon / announcement / pro). Coupons additionally show a copyable code box.
class _OfferDetailSheet extends StatelessWidget {
  final String title;
  final String? subTitle;
  final String message;
  final Color accentColor;
  final String? imageAsset;
  final CouponModel? coupon;
  final bool isPro;

  const _OfferDetailSheet({
    required this.title, required this.message, required this.accentColor,
    this.subTitle, this.imageAsset, this.coupon, this.isPro = false,
  });

  @override
  Widget build(BuildContext context) {
    final Color hint = Theme.of(context).hintColor;
    final Color textColor = Theme.of(context).textTheme.bodyLarge!.color!;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(Dimensions.radiusExtraLarge)),
      ),
      child: SafeArea(
        top: false,
        child: Stack(children: [
        ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(Dimensions.paddingSizeLarge, Dimensions.paddingSizeSmall, Dimensions.paddingSizeLarge, Dimensions.paddingSizeLarge),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [

              Center(child: Container(
                width: 40, height: 4,
                margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
                decoration: BoxDecoration(color: Theme.of(context).disabledColor.withValues(alpha: 0.4), borderRadius: BorderRadius.circular(10)),
              )),

              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  height: 48, width: 48, alignment: Alignment.center,
                  decoration: BoxDecoration(color: accentColor, borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                  child: isPro
                      ? const Icon(Icons.star_rounded, color: Color(0xFF3B5BDB), size: 26)
                      : (imageAsset != null
                          ? Image.asset(imageAsset!, height: 24, width: 24)
                          : Icon(Icons.local_offer_outlined, color: Theme.of(context).primaryColor, size: 24)),
                ),
                const SizedBox(width: Dimensions.paddingSizeDefault),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeExtraLarge, color: textColor)),
                  if (subTitle != null && subTitle!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(subTitle!, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: hint)),
                  ],
                ])),
                // Space reserved for the close button pinned to the top-right corner.
                const SizedBox(width: 30),
              ]),

              const SizedBox(height: Dimensions.paddingSizeDefault),
              Text(message, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeDefault, color: hint, height: 1.4)),

              if (coupon != null) ...[
                const SizedBox(height: Dimensions.paddingSizeLarge),
                Text('coupon_code'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: hint)),
                const SizedBox(height: Dimensions.paddingSizeSmall),
                _CouponCodeBox(code: coupon!.code ?? '', accent: Theme.of(context).primaryColor),
                const SizedBox(height: Dimensions.paddingSizeDefault),
                if ((coupon!.minPurchase ?? 0) > 0) _detailRow(context, 'min_order'.tr, PriceConverter.convertPrice(coupon!.minPurchase)),
                if ((coupon!.maxDiscount ?? 0) > 0) _detailRow(context, 'max_discount'.tr, PriceConverter.convertPrice(coupon!.maxDiscount)),
                if ((coupon!.expireDate ?? '').isNotEmpty) _detailRow(context, 'valid_till'.tr, coupon!.expireDate!.split(' ').first),
              ],
            ]),
          ),
        ),

        // Close button — pinned to the sheet's top-right corner.
        Positioned(
          top: Dimensions.paddingSizeDefault,
          right: Dimensions.paddingSizeDefault,
          child: InkWell(
            onTap: () => Get.back(),
            borderRadius: BorderRadius.circular(50),
            child: Container(
              padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall),
              decoration: BoxDecoration(color: Theme.of(context).disabledColor.withValues(alpha: 0.12), shape: BoxShape.circle),
              child: Icon(Icons.close, size: 18, color: hint),
            ),
          ),
        ),
      ]),
      ),
    );
  }

  Widget _detailRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(children: [
        Text(label, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor)),
        const Spacer(),
        Text(value, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).textTheme.bodyLarge!.color)),
      ]),
    );
  }
}

// Coupon code with a copy-to-clipboard action.
class _CouponCodeBox extends StatelessWidget {
  final String code;
  final Color accent;

  const _CouponCodeBox({required this.code, required this.accent});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: Dimensions.paddingSizeDefault),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        border: Border.all(color: accent.withValues(alpha: 0.5)),
      ),
      child: Row(children: [
        Expanded(
          child: Text(code, maxLines: 1, overflow: TextOverflow.ellipsis,
            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge, letterSpacing: 1.5, color: Theme.of(context).textTheme.bodyLarge!.color),
          ),
        ),
        const SizedBox(width: Dimensions.paddingSizeSmall),
        InkWell(
          onTap: () {
            if (code.isEmpty) return;
            Clipboard.setData(ClipboardData(text: code));
            showCustomSnackBar('coupon_code_copied'.tr, isError: false);
          },
          borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: 4),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.copy_rounded, size: 16, color: accent),
              const SizedBox(width: 4),
              Text('copy'.tr.toUpperCase(), style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall, color: accent)),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _StoreVerticalCategorySplitView extends StatefulWidget {
  final Store store;
  final StoreController storeController;

  const _StoreVerticalCategorySplitView({
    required this.store,
    required this.storeController,
  });

  @override
  State<_StoreVerticalCategorySplitView> createState() => _StoreVerticalCategorySplitViewState();
}

class _StoreVerticalCategorySplitViewState extends State<_StoreVerticalCategorySplitView> {
  int _selectedCategoryIndex = 0;
  final ScrollController _railScrollController = ScrollController();
  final ScrollController _itemsScrollController = ScrollController();
  final Map<int, List<Item>> _categoryItemsMap = {};
  final Set<int> _loadingCategoryIds = {};
  final Set<int> _paginatingCategoryIds = {};
  final Map<int, int> _categoryOffsets = {};
  final Map<int, bool> _categoryHasMore = {};

  @override
  void initState() {
    super.initState();
    _initCategories();
    _itemsScrollController.addListener(_onItemsScroll);
  }

  @override
  void didUpdateWidget(covariant _StoreVerticalCategorySplitView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.storeController.storeCategoryItemsModel != widget.storeController.storeCategoryItemsModel) {
      _initCategories();
    }
  }

  @override
  void dispose() {
    _itemsScrollController.removeListener(_onItemsScroll);
    _railScrollController.dispose();
    _itemsScrollController.dispose();
    super.dispose();
  }

  void _onItemsScroll() {
    if (!_itemsScrollController.hasClients) return;
    if (_itemsScrollController.position.pixels >= _itemsScrollController.position.maxScrollExtent - 250) {
      _loadMoreItems();
    }
  }

  void _initCategories() {
    final model = widget.storeController.storeCategoryItemsModel;
    if (model == null) return;

    if (model.categoryWiseItems != null) {
      model.categoryWiseItems!.forEach((key, cardItems) {
        final catId = int.tryParse(key);
        if (catId != null && cardItems.isNotEmpty) {
          _categoryItemsMap[catId] = cardItems.map((e) => e.toItem()).toList();
          _categoryOffsets[catId] = 1;
          _categoryHasMore[catId] = cardItems.length >= 13;
        }
      });
    }

    final cats = _getCategories();
    if (cats.isNotEmpty) {
      if (_selectedCategoryIndex >= cats.length) {
        _selectedCategoryIndex = 0;
      }
      final cat = cats[_selectedCategoryIndex];
      if (cat.id != null && (!_categoryItemsMap.containsKey(cat.id) || _categoryItemsMap[cat.id]!.isEmpty)) {
        _fetchCategoryItems(cat.id!, offset: 1);
      }
    }
  }

  List<StoreItemCategory> _getCategories() {
    final model = widget.storeController.storeCategoryItemsModel;
    if (model?.categories != null && model!.categories!.isNotEmpty) {
      return model.categories!;
    }
    return (widget.storeController.categoryList ?? [])
        .where((c) => c.id != 0)
        .map((c) => StoreItemCategory(id: c.id, name: c.name, imageFullUrl: c.imageFullUrl))
        .toList();
  }

  Future<void> _fetchCategoryItems(int categoryId, {int offset = 1}) async {
    if (_loadingCategoryIds.contains(categoryId)) return;
    setState(() => _loadingCategoryIds.add(categoryId));

    try {
      final ItemModel? itemModel = await widget.storeController.storeServiceInterface.getStoreItemList(
        storeID: widget.store.id,
        offset: offset,
        categoryID: categoryId,
        type: 'all',
      );
      if (itemModel?.items != null) {
        _categoryItemsMap[categoryId] = itemModel!.items!;
        _categoryOffsets[categoryId] = offset;
        _categoryHasMore[categoryId] = itemModel.items!.length >= 13;
      } else {
        _categoryItemsMap[categoryId] ??= [];
        _categoryHasMore[categoryId] = false;
      }
    } catch (e) {
      debugPrint('Error fetching category items: $e');
      _categoryItemsMap[categoryId] ??= [];
      _categoryHasMore[categoryId] = false;
    } finally {
      if (mounted) {
        setState(() => _loadingCategoryIds.remove(categoryId));
      }
    }
  }

  Future<void> _loadMoreItems() async {
    final cats = _getCategories();
    if (_selectedCategoryIndex >= cats.length) return;
    final catId = cats[_selectedCategoryIndex].id;
    if (catId == null) return;

    if (_paginatingCategoryIds.contains(catId) || _loadingCategoryIds.contains(catId)) return;
    if (_categoryHasMore[catId] == false) return;

    final currentOffset = _categoryOffsets[catId] ?? 1;
    final nextOffset = currentOffset + 1;
    setState(() => _paginatingCategoryIds.add(catId));

    try {
      final ItemModel? itemModel = await widget.storeController.storeServiceInterface.getStoreItemList(
        storeID: widget.store.id,
        offset: nextOffset,
        categoryID: catId,
        type: 'all',
      );
      if (itemModel?.items != null && itemModel!.items!.isNotEmpty) {
        _categoryOffsets[catId] = nextOffset;
        _categoryItemsMap[catId] ??= [];
        _categoryItemsMap[catId]!.addAll(itemModel.items!);
        _categoryHasMore[catId] = itemModel.items!.length >= 13;
      } else {
        _categoryHasMore[catId] = false;
      }
    } catch (e) {
      debugPrint('Error loading more category items: $e');
      _categoryHasMore[catId] = false;
    } finally {
      if (mounted) {
        setState(() => _paginatingCategoryIds.remove(catId));
      }
    }
  }

  void _onCategoryTapped(int index) {
    if (_selectedCategoryIndex == index) return;
    setState(() {
      _selectedCategoryIndex = index;
    });

    if (_itemsScrollController.hasClients) {
      _itemsScrollController.jumpTo(0);
    }

    final cats = _getCategories();
    if (index < cats.length) {
      final cat = cats[index];
      if (cat.id != null && (!_categoryItemsMap.containsKey(cat.id) || _categoryItemsMap[cat.id]!.isEmpty)) {
        _fetchCategoryItems(cat.id!, offset: 1);
      }
    }

    if (_railScrollController.hasClients) {
      final double target = (index * 84.0) - 150;
      _railScrollController.animateTo(
        target.clamp(0.0, _railScrollController.position.maxScrollExtent),
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    }
  }

  String? _getCategoryImageUrl(StoreItemCategory cat) {
    if (cat.imageFullUrl != null && cat.imageFullUrl!.isNotEmpty) {
      return cat.imageFullUrl;
    }
    if (Get.isRegistered<CategoryController>()) {
      final catController = Get.find<CategoryController>();
      if (catController.categoryList != null) {
        for (final item in catController.categoryList!) {
          if (item.id == cat.id && item.imageFullUrl != null && item.imageFullUrl!.isNotEmpty) {
            return item.imageFullUrl;
          }
        }
        final String catNameLower = cat.name?.trim().toLowerCase() ?? '';
        for (final item in catController.categoryList!) {
          if (item.name?.trim().toLowerCase() == catNameLower && item.imageFullUrl != null && item.imageFullUrl!.isNotEmpty) {
            return item.imageFullUrl;
          }
        }
      }
      if (catController.subCategoryList != null) {
        for (final item in catController.subCategoryList!) {
          if (item.id == cat.id && item.imageFullUrl != null && item.imageFullUrl!.isNotEmpty) {
            return item.imageFullUrl;
          }
        }
        final String catNameLower = cat.name?.trim().toLowerCase() ?? '';
        for (final item in catController.subCategoryList!) {
          if (item.name?.trim().toLowerCase() == catNameLower && item.imageFullUrl != null && item.imageFullUrl!.isNotEmpty) {
            return item.imageFullUrl;
          }
        }
      }
    }
    final items = widget.storeController.storeCategoryItemsModel?.categoryWiseItems?[cat.id.toString()];
    if (items != null && items.isNotEmpty && items.first.imageFullUrl?.isNotEmpty == true) {
      return items.first.imageFullUrl;
    }
    return null;
  }

  Widget _buildLeftRail(BuildContext context, List<StoreItemCategory> cats) {
    return Container(
      width: 82,
      decoration: const BoxDecoration(
        color: Color(0xFFF6F7F9),
      ),
      child: GetBuilder<CategoryController>(
        builder: (_) {
          return ListView.builder(
            controller: _railScrollController,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.only(top: 6, bottom: 80),
            itemCount: cats.length,
            itemBuilder: (context, index) {
              final cat = cats[index];
              final bool isSelected = index == _selectedCategoryIndex;
              final String? imgUrl = _getCategoryImageUrl(cat);

              return InkWell(
                onTap: () => _onCategoryTapped(index),
                borderRadius: BorderRadius.circular(12),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeInOut,
                  margin: const EdgeInsets.symmetric(horizontal: 5, vertical: 4),
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFFE8F2FE)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Container(
                        height: 48,
                        width: 48,
                        alignment: Alignment.center,
                        padding: const EdgeInsets.all(2),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: CustomImage(
                            image: imgUrl ?? '',
                            fit: BoxFit.contain,
                            placeholder: Images.placeholder,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 2),
                        child: Text(
                          cat.name ?? '',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: robotoMedium.copyWith(
                            fontSize: 10,
                            height: 1.15,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected
                                ? Theme.of(context).primaryColor
                                : Theme.of(context).textTheme.bodyMedium?.color?.withValues(alpha: 0.85),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildRightPane(BuildContext context, StoreItemCategory currentCat) {
    final int catId = currentCat.id ?? 0;
    final bool isLoading = _loadingCategoryIds.contains(catId) && !_categoryItemsMap.containsKey(catId);
    final List<Item> items = _categoryItemsMap[catId] ?? [];
    final bool isPaginating = _paginatingCategoryIds.contains(catId);

    return Container(
      color: Theme.of(context).colorScheme.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    currentCat.name ?? '',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: robotoBold.copyWith(fontSize: 13.5, color: Theme.of(context).textTheme.bodyLarge?.color),
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${currentCat.itemsCount ?? items.length} ${items.length == 1 ? 'item' : 'items'}',
                    style: robotoMedium.copyWith(fontSize: 10, color: Theme.of(context).primaryColor),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: isLoading
                ? _buildShimmerGrid()
                : (items.isEmpty)
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inventory_2_outlined, size: 44, color: Theme.of(context).disabledColor.withValues(alpha: 0.6)),
                            const SizedBox(height: 8),
                            Text('no_item_available'.tr, style: robotoMedium.copyWith(color: Theme.of(context).disabledColor)),
                          ],
                        ),
                      )
                    : LayoutBuilder(
                        builder: (context, constraints) {
                          final int crossAxisCount = (constraints.maxWidth / 140).floor().clamp(2, 4);
                          return GridView.builder(
                            controller: _itemsScrollController,
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.fromLTRB(8, 8, 8, 90),
                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: crossAxisCount,
                              childAspectRatio: 0.54,
                              crossAxisSpacing: 8,
                              mainAxisSpacing: 8,
                            ),
                            itemCount: items.length + (isPaginating ? 1 : 0),
                            itemBuilder: (context, index) {
                              if (index == items.length) {
                                return const Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(12),
                                    child: SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2)),
                                  ),
                                );
                              }
                              return _StoreGridProductCard(
                                item: items[index],
                                store: widget.store,
                                index: index,
                              );
                            },
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerGrid() {
    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 90),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.54,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: 4,
      itemBuilder: (context, index) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 5,
                child: Container(
                  decoration: const BoxDecoration(
                    color: Color(0xFFE9E9E9),
                    borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                  ),
                ),
              ),
              Expanded(
                flex: 5,
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Container(height: 10, width: 50, decoration: BoxDecoration(color: const Color(0xFFE9E9E9), borderRadius: BorderRadius.circular(4))),
                      Container(height: 12, width: 70, decoration: BoxDecoration(color: const Color(0xFFE9E9E9), borderRadius: BorderRadius.circular(4))),
                      Container(height: 11, width: double.infinity, decoration: BoxDecoration(color: const Color(0xFFE9E9E9), borderRadius: BorderRadius.circular(4))),
                      Container(height: 11, width: 90, decoration: BoxDecoration(color: const Color(0xFFE9E9E9), borderRadius: BorderRadius.circular(4))),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final model = widget.storeController.storeCategoryItemsModel;
    if (model == null) {
      return const _StoreItemsLoadingList();
    }

    final cats = _getCategories();
    if (cats.isEmpty) {
      return Container(
        height: 300,
        alignment: Alignment.center,
        child: Text('no_item_available'.tr),
      );
    }

    final safeIndex = _selectedCategoryIndex.clamp(0, cats.length - 1);
    final currentCat = cats[safeIndex];

    return Row(
      children: [
        _buildLeftRail(context, cats),
        Expanded(child: _buildRightPane(context, currentCat)),
      ],
    );
  }
}

class _StoreGridProductCard extends StatelessWidget {
  final Item item;
  final Store store;
  final int index;

  const _StoreGridProductCard({
    required this.item,
    required this.store,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final double discount = item.discount ?? 0;
    final bool hasDiscount = discount > 0;
    final bool isAvailable = DateConverter.isAvailable(item.availableTimeStarts, item.availableTimeEnds);
    final String unitText = _extractUnit(item);

    return InkWell(
      onTap: () => Get.find<ItemController>().navigateToItemPage(item, context, inStore: true, isCampaign: false),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Image Area
            Expanded(
              flex: 5,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      color: Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                    ),
                    padding: const EdgeInsets.all(8),
                    child: CustomImage(
                      image: item.imageFullUrl ?? '',
                      fit: BoxFit.contain,
                      placeholder: Images.placeholder,
                    ),
                  ),

                  if (hasDiscount)
                    Positioned(
                      top: 6,
                      left: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(
                          color: Theme.of(context).primaryColor,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          item.discountType == 'percent'
                              ? '${discount.toStringAsFixed(discount % 1 == 0 ? 0 : 1)}% OFF'
                              : '-${PriceConverter.convertPrice(discount)}',
                          style: robotoBold.copyWith(color: Colors.white, fontSize: 9),
                        ),
                      ),
                    ),

                  Positioned(
                    bottom: 6,
                    left: 6,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (item.isStoreHalalActive == true && item.isHalalItem == true)
                          const CustomAssetImageWidget(Images.halalTag, height: 14, width: 14),
                        if (item.isStoreHalalActive == true && item.isHalalItem == true && item.veg == 1)
                          const SizedBox(width: 3),
                        if (item.veg == 1)
                          Image.asset(Images.vegTag, height: 14, width: 14),
                      ],
                    ),
                  ),

                  Positioned(
                    top: 4,
                    right: 4,
                    child: GetBuilder<FavouriteController>(
                      builder: (favouriteController) {
                        final bool isWished = favouriteController.wishItemIdList.contains(item.id);
                        return CustomFavouriteWidget(
                          item: item,
                          isWished: isWished,
                          size: 18,
                        );
                      },
                    ),
                  ),

                  if (!isAvailable)
                    const Positioned.fill(
                      child: NotAvailableWidget(isStore: false, radius: 12),
                    ),
                ],
              ),
            ),

            // Product Details Area
            Expanded(
              flex: 5,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (unitText.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF2F4F7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          unitText,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: robotoMedium.copyWith(fontSize: 10, color: const Color(0xFF475467)),
                        ),
                      )
                    else
                      const SizedBox(height: 14),

                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 4,
                      children: [
                        Text(
                          PriceConverter.convertPrice(item.price, discount: item.discount, discountType: item.discountType),
                          textDirection: TextDirection.ltr,
                          style: robotoBold.copyWith(fontSize: 12.5, color: Theme.of(context).textTheme.bodyLarge?.color),
                        ),
                        if (hasDiscount)
                          Text(
                            PriceConverter.convertPrice(item.price),
                            textDirection: TextDirection.ltr,
                            style: robotoRegular.copyWith(
                              fontSize: 10,
                              color: Theme.of(context).disabledColor,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                      ],
                    ),

                    Text(
                      item.name ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: robotoRegular.copyWith(fontSize: 11, height: 1.2),
                    ),

                    Align(
                      alignment: Alignment.centerRight,
                      child: isAvailable
                          ? CartCountView(
                              item: item,
                              index: index,
                              child: Container(
                                height: 30,
                                width: 30,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.10),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Icon(Icons.add, size: 20, color: Theme.of(context).primaryColor),
                              ),
                            )
                          : const SizedBox.shrink(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _extractUnit(Item item) {
    if (item.unitType != null && item.unitType!.isNotEmpty) {
      return item.unitType!;
    }
    final name = item.name ?? '';
    final match = RegExp(r'(\d+(?:\.\d+)?\s*(?:kg|g|gm|ml|l|ltr|litre|pack|pieces|pcs))\b', caseSensitive: false).firstMatch(name);
    if (match != null) {
      return match.group(1)!;
    }
    return '';
  }
}

class _StoreItemsLoadingList extends StatelessWidget {
  const _StoreItemsLoadingList();

  @override
  Widget build(BuildContext context) {
    return Container(color: Theme.of(context).cardColor,
      child: Column(children: List.generate(4, (index) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: Dimensions.paddingSizeDefault),
            child: Row(children: [
              const Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _LoadingBar(width: double.infinity),
                  SizedBox(height: 10),
                  _LoadingBar(width: 150),
                  SizedBox(height: 10),
                  _LoadingBar(width: 92),
                ]),
              ),
              const SizedBox(width: Dimensions.paddingSizeDefault),
              Container(height: 112, width: 112,
                decoration: BoxDecoration(color: const Color(0xFFE9E9E9), borderRadius: BorderRadius.circular(12)),
              ),
            ]),
          );
        }),
      ),
    );
  }
}

class _LoadingBar extends StatelessWidget {
  final double width;

  const _LoadingBar({required this.width});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 12, width: width,
      decoration: BoxDecoration(color: const Color(0xFFE9E9E9), borderRadius: BorderRadius.circular(99)),
    );
  }
}

class _StoreCircleIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _StoreCircleIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color:  Theme.of(context).cardColor, shape: const CircleBorder(), elevation: 2,
      shadowColor: const Color(0x22000000),
      child: Padding(
        padding: const EdgeInsets.all(4.0),
        child: InkWell(
          customBorder: const CircleBorder(), onTap: onTap,
          child: Icon(icon, size: 24),
        ),
      ),
    );
  }
}

class _StoreSoftIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _StoreSoftIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).disabledColor.withValues(alpha: 0.2),
      borderRadius: BorderRadius.circular(50),
      child: Padding(
        padding: const EdgeInsets.all(4.0),
        child: InkWell(
          borderRadius: BorderRadius.circular(50),
          onTap: onTap,
          child: Icon(icon, size: 24),
        ),
      ),
    );
  }
}

class _StoreFavouriteCircleButton extends StatelessWidget {
  final Store store;

  const _StoreFavouriteCircleButton({required this.store});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<FavouriteController>(
      builder: (favouriteController) {
        final bool isWished = favouriteController.wishStoreIdList.contains(store.id);
        return _StoreCircleIconButton(
          icon: isWished ? Icons.favorite : Icons.favorite_border,
          onTap: () {
            if (AuthHelper.isLoggedIn()) {
              isWished ? favouriteController.removeFromFavouriteList(store.id, true) : favouriteController.addToFavouriteList(null, store.id, true);
            } else {
              showCustomSnackBar('you_are_not_logged_in'.tr);
            }
          },
        );
      },
    );
  }
}

class _VerifiedChip extends StatelessWidget {
  const _VerifiedChip();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFF4285F4), borderRadius: BorderRadius.circular(Dimensions.radiusExtraLarge),
        boxShadow: const [BoxShadow(color: Color(0x26000000), blurRadius: 6, offset: Offset(0, 2))]
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.verified, color: Colors.white, size: 16),
        const SizedBox(width: 4),
        Text(
          'Verified',
          style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall, color: Colors.white),
        ),
      ]),
    );
  }
}


class SliverDelegate extends SliverPersistentHeaderDelegate {
  Widget child;
  double height;

  SliverDelegate({required this.child, this.height = 100});

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return child;
  }

  @override
  double get maxExtent => height;

  @override
  double get minExtent => height;

  @override
  bool shouldRebuild(SliverDelegate oldDelegate) {
    return oldDelegate.maxExtent != height || oldDelegate.minExtent != height || child != oldDelegate.child;
  }
}
