import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/confirmation_dialog.dart';
import 'package:sixam_mart/common/widgets/cart_count_view.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/common/widgets/footer_view.dart';
import 'package:sixam_mart/common/widgets/item_widget.dart';
import 'package:sixam_mart/common/widgets/item_new_bottom_sheet.dart';
import 'package:sixam_mart/common/widgets/login_suggestion_bottomsheet.dart';
import 'package:sixam_mart/common/widgets/menu_drawer.dart';
import 'package:sixam_mart/common/widgets/web_page_title_widget.dart';
import 'package:sixam_mart/features/address/domain/models/address_model.dart';
import 'package:sixam_mart/features/cart/controllers/cart_controller.dart';
import 'package:sixam_mart/features/cart/domain/models/cart_model.dart';
import 'package:sixam_mart/features/cart/widgets/add_to_monthly_widget.dart';
import 'package:sixam_mart/features/cart/widgets/cart_item_widget.dart';
import 'package:sixam_mart/features/cart/widgets/extra_packaging_widget.dart';
import 'package:sixam_mart/features/cart/widgets/not_available_bottom_sheet_widget.dart';
import 'package:sixam_mart/features/cart/widgets/web_cart_items_widget.dart';
import 'package:sixam_mart/features/checkout/controllers/checkout_controller.dart';
import 'package:sixam_mart/features/coupon/controllers/coupon_controller.dart';
import 'package:sixam_mart/features/home/screens/home_screen.dart';
import 'package:sixam_mart/features/item/domain/models/item_model.dart';
import 'package:sixam_mart/features/location/controllers/location_controller.dart';
import 'package:sixam_mart/features/pro/controllers/pro_controller.dart';
import 'package:sixam_mart/features/pro/widgets/pro_cart_banner_widget.dart';
import 'package:sixam_mart/features/profile/controllers/profile_controller.dart';
import 'package:sixam_mart/features/cart/widgets/new_not_available_bottom_sheet_widget.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/features/store/controllers/store_controller.dart';
import 'package:sixam_mart/features/store/domain/models/store_model.dart';
import 'package:sixam_mart/features/store/screens/store_screen.dart';
import 'package:sixam_mart/helper/address_helper.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/module_helper.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({
    super.key,
    required this.fromNav,
    this.storeId,
    this.storeName,
  });
  final bool fromNav;
  final int? storeId;
  final String? storeName;

  /// Presents the store cart as a full-height modal bottom sheet.
  ///
  /// Capture MediaQuery BEFORE entering the modal route: showModalBottomSheet
  /// internally calls MediaQuery.removePadding(removeTop: true), which zeroes
  /// padding.top inside the builder. CartScreen's custom app bar uses padding.top
  /// to clear the status bar, so without restoring it the bar would overlap the
  /// system status bar. viewPadding.top always holds the physical device inset
  /// regardless of any removePadding call.
  static void openAsBottomSheet(BuildContext context, {required int storeId}) {
    final MediaQueryData mq = MediaQuery.of(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      // Cart content is itself scrollable — disable sheet drag to prevent
      // the dismiss gesture from conflicting with list scrolling.
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (_) => MediaQuery(
        data: mq.copyWith(padding: mq.viewPadding),
        child: SizedBox(
          height: mq.size.height,
          child: CartScreen(fromNav: false, storeId: storeId),
        ),
      ),
    );
  }

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final ScrollController scrollController = ScrollController();
  // Accumulates every item ID that has ever been in the cart this session.
  // Never shrinks — ensures removed items don't re-appear as suggestions.
  final Set<int> _cartHistoryIds = {};
  // True until the screen's initial store-scoped fetch finishes. Gates the loader
  // so the controller's previous (stale) _cartList is never flashed on entry.
  bool _initializing = true;
  bool _isCheckingOut = false;

  Future<void> _proceedToCheckout({
    required CartController cartController,
    required List<bool> availableList,
  }) async {
    if (_isCheckingOut) return;
    setState(() => _isCheckingOut = true);

    try {
      // 1. Flush debounced quantity updates and pending deletions first
      final bool syncOk = await cartController.flushPendingSyncs();
      if (!syncOk) {
        showCustomSnackBar('something_went_wrong'.tr);
        return;
      }

      // 2. Validate non-empty cart
      if (cartController.cartList.isEmpty) {
        showCustomSnackBar('cart_is_empty'.tr);
        return;
      }

      // 3. Validate product availability for scheduled/instant orders
      if (!cartController.cartList.first.item!.scheduleOrder! &&
          availableList.contains(false)) {
        showCustomSnackBar('one_or_more_product_unavailable'.tr);
        return;
      }

      // 4. Update checkout states
      Get.find<CheckoutController>().updateFirstTime();
      Get.find<CheckoutController>().updateFirstTimeCodActive();

      // 5. Ensure module is loaded
      if (Get.find<SplashController>().module == null) {
        await Get.find<SplashController>().getModules();
        int i = 0;
        for (i = 0; i < Get.find<SplashController>().moduleList!.length; i++) {
          if (cartController.cartList[0].item!.moduleId ==
              Get.find<SplashController>().moduleList![i].id) {
            break;
          }
        }
        Get.find<SplashController>().setModule(
          Get.find<SplashController>().moduleList![i],
        );
        HomeScreen.loadData(true);
      }

      // 6. Reset coupon data before checkout
      Get.find<CouponController>().removeCouponData(false);

      // 7. Navigate to checkout
      Get.toNamed(RouteHelper.getCheckoutRoute('cart'));
    } finally {
      if (mounted) {
        setState(() => _isCheckingOut = false);
      }
    }
  }

  @override
  void initState() {
    super.initState();
    final CartController cc = Get.find<CartController>();
    final int? viewStoreId =
        widget.storeId ?? cc.allCartsGroups?.firstOrNull?.store?.id;
    cc.setActiveCartScreen(viewStoreId);
    initCall();
  }

  @override
  void dispose() {
    Get.find<CartController>().clearActiveCartScreen();
    scrollController.dispose();
    super.dispose();
  }

  void _showClearCartDialog(CartController cartController) {
    Get.dialog(
      ConfirmationDialog(
        icon: Images.warning,
        description: 'do_you_want_to_clear_cart'.tr,
        onYesPressed: () {
          Get.back();
          final int? storeId =
              widget.storeId ??
              (cartController.cartList.isNotEmpty
                  ? cartController.cartList[0].item?.storeId
                  : null);
          if (storeId != null) {
            cartController.removeStoreCart(storeId);
          }
        },
      ),
    );
  }

  Future<void> initCall() async {
    _showLoginSuggestionIfGuest();
    final CartController cartController = Get.find<CartController>();
    // Derive the store to display. Priority: explicit param → first global-cart group.
    int? effectiveStoreId =
        widget.storeId ?? cartController.allCartsGroups?.firstOrNull?.store?.id;
    if (effectiveStoreId == null) {
      await cartController.getAllCarts(notify: false);
      effectiveStoreId =
          widget.storeId ??
          cartController.allCartsGroups?.firstOrNull?.store?.id;
    }

    if (effectiveStoreId != null) {
      cartController.setActiveCartScreen(effectiveStoreId);
      await cartController.getCartDataOnline(storeId: effectiveStoreId);
    } else {
      cartController.clearActiveCartScreen();
    }

    // Store-scoped cart is now loaded — reveal the list (drops the entry loader).
    if (mounted) {
      setState(() => _initializing = false);
    }

    if (Get.find<SplashController>().module == null &&
        Get.find<CartController>().cartList.isNotEmpty) {
      await Get.find<SplashController>().getModules();
      int i = 0;
      for (i = 0; i < Get.find<SplashController>().moduleList!.length; i++) {
        if (Get.find<CartController>().cartList[0].item!.moduleId ==
            Get.find<SplashController>().moduleList![i].id) {
          break;
        }
      }
      Get.find<SplashController>().setModule(
        Get.find<SplashController>().moduleList![i],
      );
      if (!GetPlatform.isWeb) {
        HomeScreen.loadData(true);
      }
    }

    if (Get.find<CartController>().cartList.isNotEmpty) {
      // Seed history with the initial cart so these items are never shown as suggestions.
      for (final c in Get.find<CartController>().cartList) {
        if (c.item?.id != null) _cartHistoryIds.add(c.item!.id!);
      }

      if (kDebugMode) {
        print(
          '----cart item : ${Get.find<CartController>().cartList[0].toJson()}',
        );
      }

      if (Get.find<CartController>().addCutlery) {
        Get.find<CartController>().updateCutlery(willUpdate: false);
      }
      if (Get.find<CartController>().needExtraPackage) {
        Get.find<CartController>().toggleExtraPackage(willUpdate: false);
      }
      Get.find<CartController>().setAvailableIndex(-1, willUpdate: false);
      Get.find<StoreController>().getCartStoreSuggestedItemList(
        Get.find<CartController>().cartList[0].item!.storeId,
      );
      if (Get.find<CartController>().cartList[0].item?.id != null) {
        Get.find<CartController>().getRelatedItemList(
          itemId: Get.find<CartController>().cartList[0].item!.id,
        );
      }
      Get.find<StoreController>().getStoreDetails(
        Store(
          id: Get.find<CartController>().cartList[0].item!.storeId,
          name: null,
        ),
        false,
        fromCart: true,
      );
      Get.find<CartController>().calculationCart();
      if (Get.find<ProfileController>().proStatus) {
        Get.find<ProController>().getProActiveOffer(
          moduleType: Get.find<SplashController>().module?.moduleType,
        );
      }
      showReferAndEarnSnackBar();
    }
  }

  void _showLoginSuggestionIfGuest() {
    if (AuthHelper.isGuestLoggedIn() &&
        (GetPlatform.isAndroid || GetPlatform.isIOS)) {
      Future.delayed(const Duration(milliseconds: 3000), () {
        if (Get.currentRoute == RouteHelper.cart &&
            Get.isBottomSheetOpen == false) {
          Get.bottomSheet(
            const LoginSuggestionBottomSheet(fromCartPage: true),
            isScrollControlled: true,
          );
        }
      });
    }
  }

  String getStoreName() {
    final storeController = Get.find<StoreController>();
    final cartController = Get.find<CartController>();
    return storeController.store?.name ??
        widget.storeName ??
        (cartController.cartList.isNotEmpty
            ? cartController.cartList[0].item?.storeName
            : null) ??
        '';
  }

  @override
  Widget build(BuildContext context) {
    final bool isDesktop = ResponsiveHelper.isDesktop(context);

    return PopScope(
      canPop: Navigator.canPop(context),
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (Navigator.canPop(context)) {
          Get.back();
        } else {
          Get.offAllNamed(RouteHelper.getInitialRoute());
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(68),
          child: GetBuilder<CartController>(
            builder: (cartController) {
              return GetBuilder<StoreController>(
                builder: (storeController) {
                  final String? eta = storeController.store?.deliveryTime;
                  final String storeName = getStoreName().isNotEmpty
                      ? getStoreName()
                      : 'Quick Store Grocery';
                  final String locationText = storeController.store?.address ??
                      (storeController.store?.distance != null
                          ? '${(storeController.store!.distance! / 1000).toStringAsFixed(1)} km away'
                          : 'Sector 62, Noida • 2.8 km away');

                  return Container(
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      border: Border(
                        bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1),
                      ),
                    ),
                    padding: EdgeInsets.only(
                      top: MediaQuery.of(context).padding.top + 4,
                      left: Dimensions.paddingSizeDefault,
                      right: Dimensions.paddingSizeSmall,
                      bottom: 8,
                    ),
                    child: Row(
                      children: [
                        // Back / Close button (<)
                        InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () {
                            if (Navigator.canPop(context)) {
                              Get.back();
                            } else {
                              Get.offAllNamed(RouteHelper.getInitialRoute());
                            }
                          },
                          child: Container(
                            height: 36,
                            width: 36,
                            decoration: const BoxDecoration(
                              color: Color(0xFFF1F5F9),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.arrow_back_ios_new_rounded,
                              size: 15,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Dark green capsule pill: 12-18 min
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF143823),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.bolt,
                                size: 14,
                                color: Color(0xFF22C55E),
                              ),
                              const SizedBox(width: 2),
                              Text(
                                (eta != null && eta.isNotEmpty)
                                    ? eta
                                    : '12–18 min',
                                style: robotoBold.copyWith(
                                  fontSize: 10.5,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Store title + verified badge + distance subtitle
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      storeName,
                                      style: robotoBold.copyWith(
                                        fontSize: 14.5,
                                        color: const Color(0xFF0F172A),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(
                                    Icons.check_circle_rounded,
                                    size: 15,
                                    color: Color(0xFF16A34A),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 1),
                              Text(
                                locationText,
                                style: robotoRegular.copyWith(
                                  fontSize: 11,
                                  color: const Color(0xFF64748B),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),

                        // Right action 1: Search button
                        InkWell(
                          onTap: () => Get.toNamed(RouteHelper.getSearchRoute()),
                          customBorder: const CircleBorder(),
                          child: const Padding(
                            padding: EdgeInsets.all(6),
                            child: Icon(
                              Icons.search_rounded,
                              size: 22,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        ),
                        const SizedBox(width: 2),

                        // Right action 2: Trash / Clear button with red badge
                        InkWell(
                          onTap: () => _showClearCartDialog(cartController),
                          customBorder: const CircleBorder(),
                          child: Padding(
                            padding: const EdgeInsets.all(6),
                            child: Stack(
                              clipBehavior: Clip.none,
                              children: [
                                const Icon(
                                  Icons.delete_outline_rounded,
                                  size: 22,
                                  color: Color(0xFF0F172A),
                                ),
                                Positioned(
                                  top: -3,
                                  right: -3,
                                  child: Container(
                                    padding: const EdgeInsets.all(3),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFEF4444),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Text(
                                      '${cartController.cartList.length}',
                                      style: robotoBold.copyWith(
                                        fontSize: 8.5,
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
                  );
                },
              );
            },
          ),
        ),
        endDrawer: const MenuDrawer(),
        endDrawerEnableOpenDragGesture: false,
        body: GetBuilder<StoreController>(
          builder: (storeController) {
            return GetBuilder<CartController>(
              builder: (cartController) {
                // Accumulate current cart IDs so items added via suggestions are also
                // excluded from future suggestion lists once they enter the cart.
                for (final c in cartController.cartList) {
                  if (c.item?.id != null) _cartHistoryIds.add(c.item!.id!);
                }

                // Show loader during the initial store-scoped fetch (so the previous,
                // stale cart is never flashed) and while any later fetch has no data yet.
                if (_initializing ||
                    (cartController.isLoading &&
                        cartController.cartList.isEmpty)) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (cartController.cartList.isEmpty) {
                  return _buildEmptyCartView(context, storeController);
                }

                if (isDesktop) {
                  return _buildDesktopBody(
                    cartController,
                    storeController,
                    isDesktop,
                  );
                }

                return _buildMobileBody(cartController, storeController);
              },
            );
          },
        ),
      ),
    );
  }

  // ── Empty Cart View ────────────────────────────────────────────────────────
  Widget _buildEmptyCartView(
    BuildContext context,
    StoreController storeController,
  ) {
    final bool isDesktop = ResponsiveHelper.isDesktop(context);
    final List<Item>? suggestedItems =
        storeController.cartSuggestItemModel?.items;

    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(
        horizontal: Dimensions.paddingSizeDefault,
        vertical: Dimensions.paddingSizeLarge,
      ),
      child: FooterView(
        child: Column(
          children: [
            SizedBox(height: isDesktop ? 60 : 40),
            Container(
              padding: const EdgeInsets.all(Dimensions.paddingSizeExtraLarge),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Image.asset(Images.emptyCart, height: 100, width: 100),
            ),
            const SizedBox(height: Dimensions.paddingSizeDefault),
            Text(
              'cart_is_empty'.tr,
              style: robotoBold.copyWith(
                fontSize: Dimensions.fontSizeOverLarge,
              ),
            ),
            const SizedBox(height: Dimensions.paddingSizeExtraSmall),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Dimensions.paddingSizeExtraLarge,
              ),
              child: Text(
                'explore_thousands_of_products_and_add_to_cart'.tr,
                textAlign: TextAlign.center,
                style: robotoRegular.copyWith(
                  fontSize: Dimensions.fontSizeSmall,
                  color: Theme.of(context).disabledColor,
                ),
              ),
            ),
            const SizedBox(height: Dimensions.paddingSizeLarge),
            SizedBox(
              width: 220,
              child: CustomButton(
                buttonText: 'explore_more'.tr,
                radius: Dimensions.radiusDefault,
                onPressed: () {
                  if (Navigator.canPop(context)) {
                    Get.back();
                  } else {
                    Get.offAllNamed(RouteHelper.getInitialRoute());
                  }
                },
              ),
            ),
            const SizedBox(height: Dimensions.paddingSizeExtraLarge),

            if (suggestedItems != null && suggestedItems.isNotEmpty) ...[
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'you_may_also_like'.tr,
                  style: robotoBold.copyWith(
                    fontSize: Dimensions.fontSizeLarge,
                  ),
                ),
              ),
              const SizedBox(height: Dimensions.paddingSizeSmall),
              SizedBox(
                height: 130,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: suggestedItems.length,
                  physics: const BouncingScrollPhysics(),
                  itemBuilder: (context, index) {
                    return Container(
                      width: 280,
                      margin: const EdgeInsets.only(
                        right: Dimensions.paddingSizeSmall,
                      ),
                      child: ItemWidget(
                        isStore: false,
                        item: suggestedItems[index],
                        fromCartSuggestion: true,
                        store: null,
                        index: index,
                        length: null,
                        isCampaign: false,
                        inStore: true,
                      ),
                    );
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────
  Widget _buildDesktopBody(
    CartController cartController,
    StoreController storeController,
    bool isDesktop,
  ) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            controller: scrollController,
            padding: const EdgeInsets.only(top: Dimensions.paddingSizeSmall),
            child: FooterView(
              child: SizedBox(
                width: Dimensions.webMaxWidth,
                child: Column(
                  children: [
                    WebScreenTitleWidget(title: 'cart_list'.tr),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        WebCardItemsWidget(cartList: cartController.cartList),
                        const SizedBox(width: Dimensions.paddingSizeLarge),
                        Expanded(
                          flex: 4,
                          child: pricingView(
                            cartController,
                            cartController.cartList[0].item!,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── Mobile layout ───────────────────────────────────────────────────────────
  Widget _buildMobileBody(
    CartController cartController,
    StoreController storeController,
  ) {
    final double? adminThreshold = cartController.adminFreeDeliveryThreshold;
    final bool isFreeToAll = cartController.isFreeDeliveryToAllStore;
    final bool storeFreeDelivery = storeController.store?.freeDelivery ?? false;
    final bool freeDeliveryUnlocked =
        isFreeToAll ||
        storeFreeDelivery ||
        (adminThreshold != null && cartController.subTotal >= adminThreshold);
    final double remainingForFree = isFreeToAll
        ? 0.0
        : (adminThreshold != null
              ? (adminThreshold - cartController.subTotal)
              : 0.0);
    final double freeDeliveryPercentage = isFreeToAll
        ? 1.0
        : (adminThreshold != null && adminThreshold > 0
              ? (cartController.subTotal / adminThreshold).clamp(0.0, 1.0)
              : (freeDeliveryUnlocked ? 1.0 : 0.0));

    final double extraPackagingAmount =
        (storeController.store?.extraPackagingStatus == true &&
            cartController.needExtraPackage)
        ? (storeController.store?.extraPackagingAmount ?? 0.0)
        : 0.0;
    final double subTotalWithPackaging =
        cartController.subTotal + extraPackagingAmount;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            controller: scrollController,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Delivering to Home Card
                _buildDeliveryAddressCard(context),

                // 2. Free Delivery Card
                if (isFreeToAll || storeFreeDelivery || adminThreshold != null)
                  _buildFreeDeliveryCard(
                    context,
                    freeDeliveryUnlocked: freeDeliveryUnlocked,
                    remainingForFree:
                        remainingForFree > 0 ? remainingForFree : 0.0,
                    freeDeliveryPercentage: freeDeliveryPercentage,
                    currentSubtotal: cartController.subTotal,
                    targetThreshold: adminThreshold ?? 999.0,
                  ),

                // 3. "Your Cart (X items)" Header + Clear Cart
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Your Cart (${cartController.cartList.length} items)',
                        style: robotoBold.copyWith(
                          fontSize: 17,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      InkWell(
                        onTap: () => _showClearCartDialog(cartController),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.delete_outline_rounded,
                              size: 16,
                              color: Color(0xFFDC2626),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Clear Cart',
                              style: robotoMedium.copyWith(
                                fontSize: 13,
                                color: const Color(0xFFDC2626),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // 4. Cart items list
                ListView.separated(
                  physics: const NeverScrollableScrollPhysics(),
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: cartController.cartList.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    return CartItemWidget(
                      cart: cartController.cartList[index],
                      cartIndex: index,
                      addOns: cartController.addOnsList.isNotEmpty
                          ? cartController.addOnsList[index]
                          : [],
                      isAvailable: cartController.availableList.isNotEmpty
                          ? cartController.availableList[index]
                          : false,
                      showDivider: false,
                    );
                  },
                ),

                // 5. Action Card 1: Add More Items
                _buildAddMoreItemsCard(context, cartController),

                // 6. Action Card 2: If any product is not available
                _buildNotAvailableCard(context, cartController),

                // Optional Monthly reorder section (if grocery/pharmacy and configured)
                if (_isGroceryOrPharmacy(cartController) &&
                    !_hasCampaignOrFlashSaleItem(cartController) &&
                    (AuthHelper.isLoggedIn() &&
                        Get.find<SplashController>()
                                .configModel
                                ?.monthlyOrderRemainder ==
                            1)) ...[
                  const MonthlyReorderSection(),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                ],

                // Pro plan promo / benefit banner (if applicable)
                if (Get.find<ProfileController>().proStatus)
                  Padding(
                    padding: const EdgeInsets.only(
                      left: Dimensions.paddingSizeDefault,
                      right: Dimensions.paddingSizeDefault,
                      bottom: Dimensions.paddingSizeSmall,
                    ),
                    child: ProCartBannerWidget(
                      subtotal: subTotalWithPackaging,
                      redirectRoute: RouteHelper.getCartRoute(),
                    ),
                  ),

                // 7. "You May Also Like!" Section
                suggestedItemView(cartController.cartList),
                const SizedBox(height: Dimensions.paddingSizeSmall),

                // 8. Bill details Summary Card
                _buildBillSummaryCard(context, cartController, storeController),
                const SizedBox(height: Dimensions.paddingSizeSmall),

                // 9. Trust & Feature Badges
                _buildTrustBadges(context),
                const SizedBox(height: Dimensions.paddingSizeLarge),
              ],
            ),
          ),
        ),

        // 10. Sticky bottom quick-commerce checkout bar with Swipe to Checkout
        _buildBottomCheckoutBar(
          cartController,
          storeController,
          subTotalWithPackaging,
        ),
      ],
    );
  }

  // ── Delivery Address Card ──────────────────────────────────────────────────
  Widget _buildDeliveryAddressCard(BuildContext context) {
    final AddressModel? address = AddressHelper.getUserAddressFromSharedPref();
    final String addressTitle =
        address?.addressType != null && address!.addressType!.isNotEmpty
            ? 'Delivering to ${address.addressType!.capitalizeFirst}'
            : 'Delivering to Home';
    final String addressSubtitle =
        address?.address?.trim().isNotEmpty == true
            ? address!.address!
            : 'H.No. 45, Sector 62, Noida 201301';

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
      ),
      child: Row(
        children: [
          const Icon(Icons.location_on, color: Color(0xFF16A34A), size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      addressTitle,
                      style: robotoBold.copyWith(
                        fontSize: 13.5,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(width: 2),
                    const Icon(
                      Icons.keyboard_arrow_down_rounded,
                      size: 16,
                      color: Color(0xFF0F172A),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  addressSubtitle,
                  style: robotoRegular.copyWith(
                    fontSize: 11,
                    color: const Color(0xFF64748B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: () {
              if (Get.isRegistered<LocationController>()) {
                Get.find<LocationController>().navigateToLocationScreen('cart');
              }
            },
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F8EE),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Change',
                style: robotoBold.copyWith(
                  fontSize: 12,
                  color: const Color(0xFF16A34A),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Free Delivery Card ─────────────────────────────────────────────────────
  Widget _buildFreeDeliveryCard(
    BuildContext context, {
    required bool freeDeliveryUnlocked,
    required double remainingForFree,
    required double freeDeliveryPercentage,
    required double currentSubtotal,
    required double targetThreshold,
  }) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FAF5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFC6F0D6), width: 1.2),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left Column: Progress + Text
          Expanded(
            flex: 6,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      height: 28,
                      width: 28,
                      decoration: const BoxDecoration(
                        color: Color(0xFF16A34A),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.local_shipping_outlined,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: freeDeliveryUnlocked
                          ? Text(
                              '🎉 FREE delivery unlocked!',
                              style: robotoBold.copyWith(
                                fontSize: 12.5,
                                color: const Color(0xFF16A34A),
                              ),
                            )
                          : RichText(
                              text: TextSpan(
                                children: [
                                  TextSpan(
                                    text: 'Add ',
                                    style: robotoBold.copyWith(
                                      fontSize: 12,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  TextSpan(
                                    text: PriceConverter.convertPrice(
                                      remainingForFree,
                                    ),
                                    style: robotoBold.copyWith(
                                      fontSize: 12,
                                      color: const Color(0xFF16A34A),
                                    ),
                                  ),
                                  TextSpan(
                                    text: ' more for FREE delivery!',
                                    style: robotoBold.copyWith(
                                      fontSize: 12,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    minHeight: 5.5,
                    backgroundColor: const Color(0xFFD1F2E0),
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      Color(0xFF16A34A),
                    ),
                    value: freeDeliveryPercentage,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      PriceConverter.convertPrice(currentSubtotal),
                      style: robotoRegular.copyWith(
                        fontSize: 10.5,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    Text(
                      PriceConverter.convertPrice(targetThreshold),
                      style: robotoRegular.copyWith(
                        fontSize: 10.5,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Divider
          Container(
            height: 48,
            width: 1,
            color: const Color(0xFFD1F2E0),
            margin: const EdgeInsets.symmetric(horizontal: 10),
          ),

          // Right Column: Feature bullets
          Expanded(
            flex: 4,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildFeatureBullet(
                  icon: Icons.bolt,
                  iconColor: const Color(0xFFEAB308),
                  text: 'Fast delivery',
                ),
                const SizedBox(height: 4),
                _buildFeatureBullet(
                  icon: Icons.eco,
                  iconColor: const Color(0xFF16A34A),
                  text: 'Fresh products',
                ),
                const SizedBox(height: 4),
                _buildFeatureBullet(
                  icon: Icons.verified_user_outlined,
                  iconColor: const Color(0xFF16A34A),
                  text: 'Best quality',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureBullet({
    required IconData icon,
    required Color iconColor,
    required String text,
  }) {
    return Row(
      children: [
        Icon(icon, size: 13, color: iconColor),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            text,
            style: robotoMedium.copyWith(
              fontSize: 10.5,
              color: const Color(0xFF334155),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  // ── Action Cards ───────────────────────────────────────────────────────────
  Widget _buildAddMoreItemsCard(
    BuildContext context,
    CartController cartController,
  ) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
      ),
      child: InkWell(
        onTap: () {
          cartController.forcefullySetModule(
            cartController.cartList[0].item!.moduleId!,
          );
          Get.toNamed(
            RouteHelper.getStoreRoute(
              id: cartController.cartList[0].item!.storeId,
              page: 'item',
              slug: Get.find<StoreController>().store?.slug ?? '',
            ),
            arguments: StoreScreen(
              store: Store(id: cartController.cartList[0].item!.storeId),
              fromModule: false,
            ),
          );
        },
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                height: 36,
                width: 36,
                decoration: const BoxDecoration(
                  color: Color(0xFF16A34A),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.add, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Add More Items',
                      style: robotoBold.copyWith(
                        fontSize: 13.5,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      'Browse more from ${getStoreName()}',
                      style: robotoRegular.copyWith(
                        fontSize: 11,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: Color(0xFF94A3B8),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNotAvailableCard(
    BuildContext context,
    CartController cartController,
  ) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
      ),
      child: InkWell(
        onTap: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => const NewNotAvailableBottomSheetWidget(),
        ),
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                height: 36,
                width: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.inventory_2_outlined,
                  color: Color(0xFF0F172A),
                  size: 19,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'if_any_product_is_not_available'.tr,
                      style: robotoBold.copyWith(
                        fontSize: 13,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      'Choose a replacement or refund preference',
                      style: robotoRegular.copyWith(
                        fontSize: 10.5,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  Text(
                    cartController.notAvailableIndex != -1
                        ? cartController
                              .notAvailableList[cartController.notAvailableIndex]
                              .tr
                        : 'Replace with similar item',
                    style: robotoRegular.copyWith(
                      fontSize: 11,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: Color(0xFF64748B),
                    size: 16,
                  ),
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: Color(0xFF94A3B8),
                    size: 16,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Bill Summary Card ──────────────────────────────────────────────────────
  Widget _buildBillSummaryCard(
    BuildContext context,
    CartController cartController,
    StoreController storeController,
  ) {
    final double freeDeliveryThreshold =
        cartController.adminFreeDeliveryThreshold ?? 0.0;
    final bool storeFreeDelivery = storeController.store?.freeDelivery ?? false;
    final bool isFreeToAll = cartController.isFreeDeliveryToAllStore;
    final bool isFreeDelivery =
        isFreeToAll ||
        storeFreeDelivery ||
        (freeDeliveryThreshold > 0 &&
            cartController.subTotal >= freeDeliveryThreshold);
    final double extraPackaging =
        (storeController.store != null &&
            storeController.store!.extraPackagingStatus == true &&
            cartController.needExtraPackage)
        ? (storeController.store!.extraPackagingAmount ?? 0.0)
        : 0.0;
    final double subTotalWithPackaging =
        cartController.subTotal + extraPackaging;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with Savings pill
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.receipt_long_outlined,
                      size: 20,
                      color: Color(0xFF16A34A),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Bill details',
                      style: robotoBold.copyWith(
                        fontSize: 15,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
                if (cartController.itemDiscountPrice > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F8EE),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: const Color(0xFFC6F0D6),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('🎉 ', style: TextStyle(fontSize: 11)),
                        Text(
                          'You are saving ${PriceConverter.convertPrice(cartController.itemDiscountPrice)} on this order!',
                          style: robotoBold.copyWith(
                            color: const Color(0xFF16A34A),
                            fontSize: 10.5,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const Divider(height: 1, thickness: 0.8, color: Color(0xFFF1F5F9)),

          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                // Item Price
                _buildBillRow(
                  title: 'Item Price (${cartController.cartList.length} items)',
                  child: PriceConverter.convertAnimationPrice(
                    cartController.itemPrice,
                    textStyle: robotoMedium.copyWith(
                      fontSize: 13,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                ),

                // Product Discount
                if (cartController.itemDiscountPrice > 0) ...[
                  const SizedBox(height: 10),
                  _buildBillRow(
                    title: 'Item Discount',
                    child: Text(
                      '- ${PriceConverter.convertPrice(cartController.itemDiscountPrice)}',
                      style: robotoBold.copyWith(
                        fontSize: 13,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ),
                ],

                // Delivery Fee
                const SizedBox(height: 10),
                _buildBillRow(
                  title: 'Delivery Fee',
                  showInfo: true,
                  child: isFreeDelivery
                      ? Text(
                          'FREE',
                          style: robotoBold.copyWith(
                            color: const Color(0xFF16A34A),
                            fontSize: 12.5,
                          ),
                        )
                      : Text(
                          'Calculated at checkout',
                          style: robotoRegular.copyWith(
                            color: const Color(0xFF64748B),
                            fontSize: 12,
                          ),
                        ),
                ),

                // Taxes & Handling
                const SizedBox(height: 10),
                _buildBillRow(
                  title: 'Taxes & Handling',
                  showInfo: true,
                  child: Text(
                    'Calculated at checkout',
                    style: robotoRegular.copyWith(
                      color: const Color(0xFF64748B),
                      fontSize: 12,
                    ),
                  ),
                ),

                const SizedBox(height: 12),
                const Divider(
                  height: 1,
                  thickness: 0.8,
                  color: Color(0xFFF1F5F9),
                ),
                const SizedBox(height: 12),

                // Subtotal
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Subtotal',
                          style: robotoBold.copyWith(
                            fontSize: 16,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'To pay for items',
                          style: robotoRegular.copyWith(
                            fontSize: 11,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                    PriceConverter.convertAnimationPrice(
                      subTotalWithPackaging,
                      textStyle: robotoBold.copyWith(
                        fontSize: 18,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBillRow({
    required String title,
    required Widget child,
    bool showInfo = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: robotoRegular.copyWith(
                fontSize: 12.5,
                color: const Color(0xFF334155),
              ),
            ),
            if (showInfo) ...[
              const SizedBox(width: 4),
              const Icon(
                Icons.info_outline_rounded,
                size: 14,
                color: Color(0xFF94A3B8),
              ),
            ],
          ],
        ),
        child,
      ],
    );
  }

  // ── Trust & Feature Badges ─────────────────────────────────────────────────
  Widget _buildTrustBadges(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
      ),
      child: Row(
        children: [
          _buildTrustItem(
            icon: Icons.local_shipping_outlined,
            title: 'Fast Delivery',
            subtitle: '50–90 minutes',
          ),
          _buildTrustDivider(),
          _buildTrustItem(
            icon: Icons.shield_outlined,
            title: 'Secure Payments',
            subtitle: '100% safe & secure',
          ),
          _buildTrustDivider(),
          _buildTrustItem(
            icon: Icons.verified_outlined,
            title: 'Quality Products',
            subtitle: 'Sourced from trusted stores',
          ),
          _buildTrustDivider(),
          _buildTrustItem(
            icon: Icons.eco_outlined,
            title: 'Fresh & Hygienic',
            subtitle: 'Everyday essentials',
          ),
        ],
      ),
    );
  }

  Widget _buildTrustItem({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: const Color(0xFF16A34A), size: 18),
          const SizedBox(height: 4),
          Text(
            title,
            style: robotoBold.copyWith(
              fontSize: 9.5,
              color: const Color(0xFF0F172A),
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 1),
          Text(
            subtitle,
            style: robotoRegular.copyWith(
              fontSize: 8,
              color: const Color(0xFF64748B),
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildTrustDivider() {
    return Container(
      height: 28,
      width: 0.8,
      color: const Color(0xFFE2E8F0),
      margin: const EdgeInsets.symmetric(horizontal: 2),
    );
  }

  // ── Bottom Checkout Bar ────────────────────────────────────────────────────
  Widget _buildBottomCheckoutBar(
    CartController cartController,
    StoreController storeController,
    double subTotalWithPackaging,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Dimensions.paddingSizeDefault,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(
          top: BorderSide(color: Color(0xFFF1F5F9), width: 1.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Left: Price summary + You Save
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Total Amount',
                  style: robotoMedium.copyWith(
                    fontSize: 10.5,
                    color: const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 1),
                PriceConverter.convertAnimationPrice(
                  subTotalWithPackaging,
                  textStyle: robotoBold.copyWith(
                    fontSize: 20,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                if (cartController.itemDiscountPrice > 0) ...[
                  const SizedBox(height: 1),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'You Save ',
                        style: robotoRegular.copyWith(
                          fontSize: 10.5,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      Text(
                        PriceConverter.convertPrice(
                          cartController.itemDiscountPrice,
                        ),
                        style: robotoBold.copyWith(
                          fontSize: 11.5,
                          color: const Color(0xFF16A34A),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
            const SizedBox(width: Dimensions.paddingSizeDefault),

            // Right: Swipe to Checkout Slider
            Expanded(
              child: _SwipeToCheckoutSlider(
                isLoading: _isCheckingOut,
                onSwipeComplete: () => _proceedToCheckout(
                  cartController: cartController,
                  availableList: cartController.availableList,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget pricingView(CartController cartController, Item item) {
    final bool isDesktop = ResponsiveHelper.isDesktop(context);
    return Container(
      decoration: isDesktop
          ? BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 5,
                  spreadRadius: 1,
                ),
              ],
            )
          : null,
      child: GetBuilder<StoreController>(
        builder: (storeController) {
          return Column(
            children: [
              isDesktop
                  ? ExtraPackagingWidget(cartController: cartController)
                  : const SizedBox(),

              isDesktop
                  ? Align(
                      alignment: Alignment.topLeft,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: Dimensions.paddingSizeDefault,
                          vertical: Dimensions.paddingSizeSmall,
                        ),
                        child: Text('order_summary'.tr, style: robotoBold),
                      ),
                    )
                  : const SizedBox(),

              isDesktop &&
                      Get.find<SplashController>()
                          .getModuleConfig(item.moduleType)
                          .newVariation! &&
                      (storeController.store != null &&
                          storeController.store!.cutlery!)
                  ? Container(
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 2,
                            spreadRadius: 1,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: Dimensions.paddingSizeDefault,
                        vertical: Dimensions.paddingSizeSmall,
                      ),
                      margin: const EdgeInsets.only(
                        bottom: Dimensions.paddingSizeSmall,
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Image.asset(Images.cutlery, height: 18, width: 18),
                          const SizedBox(width: Dimensions.paddingSizeDefault),

                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'add_cutlery'.tr,
                                  style: robotoMedium.copyWith(
                                    color: Theme.of(context).primaryColor,
                                  ),
                                ),
                                const SizedBox(
                                  height: Dimensions.paddingSizeExtraSmall,
                                ),
                                Text(
                                  'do_not_have_cutlery'.tr,
                                  style: robotoRegular.copyWith(
                                    color: Theme.of(context).disabledColor,
                                    fontSize: Dimensions.fontSizeSmall,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          Transform.scale(
                            scale: 0.7,
                            child: CupertinoSwitch(
                              value: cartController.addCutlery,
                              activeTrackColor: Theme.of(context).primaryColor,
                              onChanged: (_) => cartController.updateCutlery(),
                              inactiveTrackColor: Theme.of(
                                context,
                              ).primaryColor.withValues(alpha: 0.5),
                            ),
                          ),
                        ],
                      ),
                    )
                  : const SizedBox(),

              isDesktop
                  ? Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Dimensions.paddingSizeDefault,
                        vertical: Dimensions.paddingSizeSmall,
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('item_price'.tr, style: robotoRegular),
                              PriceConverter.convertAnimationPrice(
                                cartController.itemPrice,
                                textStyle: robotoRegular,
                              ),
                            ],
                          ),
                          SizedBox(
                            height: cartController.variationPrice > 0
                                ? Dimensions.paddingSizeSmall
                                : 0,
                          ),

                          Get.find<SplashController>()
                                      .getModuleConfig(item.moduleType)
                                      .newVariation! &&
                                  cartController.variationPrice > 0
                              ? Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('variations'.tr, style: robotoRegular),
                                    Text(
                                      '(+) ${PriceConverter.convertPrice(cartController.variationPrice)}',
                                      style: robotoRegular,
                                      textDirection: TextDirection.ltr,
                                    ),
                                  ],
                                )
                              : const SizedBox(),
                          const SizedBox(height: Dimensions.paddingSizeSmall),

                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('discount'.tr, style: robotoRegular),
                              storeController.store != null
                                  ? Row(
                                      children: [
                                        Text('(-)', style: robotoRegular),
                                        PriceConverter.convertAnimationPrice(
                                          cartController.itemDiscountPrice,
                                          textStyle: robotoRegular,
                                        ),
                                      ],
                                    )
                                  : Text(
                                      'calculating'.tr,
                                      style: robotoRegular,
                                    ),
                            ],
                          ),
                          SizedBox(
                            height:
                                Get.find<SplashController>()
                                    .configModel!
                                    .moduleConfig!
                                    .module!
                                    .addOn!
                                ? 10
                                : 0,
                          ),

                          Get.find<SplashController>()
                                  .configModel!
                                  .moduleConfig!
                                  .module!
                                  .addOn!
                              ? Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('addons'.tr, style: robotoRegular),
                                    Text(
                                      '(+) ${PriceConverter.convertPrice(cartController.addOns)}',
                                      style: robotoRegular,
                                      textDirection: TextDirection.ltr,
                                    ),
                                  ],
                                )
                              : const SizedBox(),

                          (storeController.store != null &&
                                  storeController
                                      .store!
                                      .extraPackagingStatus! &&
                                  cartController.needExtraPackage)
                              ? Padding(
                                  padding: const EdgeInsets.only(top: 10),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'extra_packaging'.tr,
                                        style: robotoRegular,
                                      ),
                                      Text(
                                        '(+) ${PriceConverter.convertPrice(storeController.store!.extraPackagingAmount!)}',
                                        style: robotoRegular,
                                        textDirection: TextDirection.ltr,
                                      ),
                                    ],
                                  ),
                                )
                              : const SizedBox.shrink(),
                        ],
                      ),
                    )
                  : const SizedBox(),

              isDesktop
                  ? Container(
                      width: Dimensions.webMaxWidth,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(
                          Dimensions.radiusSmall,
                        ),
                        color: Theme.of(context).cardColor,
                        border: Border.all(
                          color: Theme.of(
                            context,
                          ).disabledColor.withValues(alpha: 0.2),
                          width: 0.5,
                        ),
                      ),
                      padding: const EdgeInsets.all(
                        Dimensions.paddingSizeDefault,
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          InkWell(
                            onTap: () => Get.dialog(
                              const Dialog(
                                child: NotAvailableBottomSheetWidget(),
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'if_any_product_is_not_available'.tr,
                                    style: robotoMedium.copyWith(
                                      fontSize: Dimensions.fontSizeSmall,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const Icon(Icons.keyboard_arrow_down, size: 18),
                              ],
                            ),
                          ),
                          const SizedBox(
                            height: Dimensions.paddingSizeExtraSmall,
                          ),

                          Container(
                            padding: const EdgeInsets.only(
                              left: Dimensions.paddingSizeSmall,
                            ),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(
                                Dimensions.radiusSmall,
                              ),
                              color: Theme.of(
                                context,
                              ).disabledColor.withValues(alpha: 0.1),
                            ),
                            child: cartController.notAvailableIndex != -1
                                ? Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        cartController
                                            .notAvailableList[cartController
                                                .notAvailableIndex]
                                            .tr,
                                        style: robotoRegular.copyWith(
                                          fontSize:
                                              Dimensions.fontSizeExtraSmall,
                                          color: Theme.of(context).hintColor,
                                        ),
                                      ),
                                      IconButton(
                                        onPressed: () => cartController
                                            .setAvailableIndex(-1),
                                        icon: const Icon(
                                          Icons.clear,
                                          size: 18,
                                          color: Colors.red,
                                        ),
                                      ),
                                    ],
                                  )
                                : const SizedBox(),
                          ),
                        ],
                      ),
                    )
                  : const SizedBox(),

              isDesktop &&
                      Get.find<SplashController>()
                          .getModuleConfig(
                            cartController.cartList[0].item!.moduleType,
                          )
                          .newVariation! &&
                      storeController.store != null &&
                      storeController.store!.deliveryTime != null
                  ? Container(
                      decoration: BoxDecoration(
                        color: Colors.orange.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(
                          Dimensions.radiusDefault,
                        ),
                      ),
                      width: double.infinity,
                      padding: const EdgeInsets.all(
                        Dimensions.paddingSizeSmall,
                      ),
                      margin: const EdgeInsets.symmetric(
                        vertical: Dimensions.paddingSizeDefault,
                      ),
                      child: Row(
                        children: [
                          Image.asset(
                            Images.carDelivery,
                            height: 20,
                            width: 20,
                            color: Colors.orange,
                          ),
                          const SizedBox(width: Dimensions.paddingSizeSmall),
                          RichText(
                            text: TextSpan(
                              children: [
                                TextSpan(
                                  text: '${'estimated_delivery_time'.tr} : ',
                                  style: robotoMedium.copyWith(
                                    color: Theme.of(context)
                                        .textTheme
                                        .bodyLarge!
                                        .color!
                                        .withValues(alpha: 0.5),
                                  ),
                                ),
                                TextSpan(
                                  text:
                                      '${storeController.store?.deliveryTime}',
                                  style: robotoBold.copyWith(
                                    color: Theme.of(
                                      context,
                                    ).textTheme.bodyLarge!.color,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )
                  : const SizedBox(),

              isDesktop
                  ? Padding(
                      padding: const EdgeInsets.only(
                        bottom: Dimensions.paddingSizeSmall,
                      ),
                      child: ProCartBannerWidget(
                        subtotal: cartController.subTotal,
                        redirectRoute: RouteHelper.getCartRoute(),
                      ),
                    )
                  : const SizedBox.shrink(),

              isDesktop
                  ? CheckoutButton(
                      cartController: cartController,
                      availableList: cartController.availableList,
                      onCheckout: () => _proceedToCheckout(
                        cartController: cartController,
                        availableList: cartController.availableList,
                      ),
                      isCheckingOut: _isCheckingOut,
                    )
                  : const SizedBox.shrink(),
            ],
          );
        },
      ),
    );
  }

  Widget suggestedItemView(List<CartModel> cartList) {
    if (cartList.isEmpty) return const SizedBox();

    return GetBuilder<CartController>(
      builder: (cartController) {
        return GetBuilder<StoreController>(
          builder: (storeController) {
            final Set<int> cartItemIds = cartList
                .map((c) => c.item?.id)
                .whereType<int>()
                .toSet();

            List<Item> displayedItems = [];

            // 1. Prioritize related items of the user-selected item
            if (cartController.relatedItemList != null &&
                cartController.relatedItemList!.isNotEmpty) {
              for (Item item in cartController.relatedItemList!) {
                if (!cartItemIds.contains(item.id) &&
                    !_cartHistoryIds.contains(item.id)) {
                  displayedItems.add(item);
                }
              }
            }

            // 2. Fallback to store suggested items if related items are empty and not loading
            if (displayedItems.isEmpty &&
                !cartController.isRelatedItemLoading &&
                storeController.cartSuggestItemModel?.items != null) {
              for (Item item in storeController.cartSuggestItemModel!.items!) {
                if (!cartItemIds.contains(item.id) &&
                    !_cartHistoryIds.contains(item.id)) {
                  displayedItems.add(item);
                }
              }
            }

            // If nothing to display and not loading, return empty
            if (displayedItems.isEmpty &&
                !cartController.isRelatedItemLoading) {
              return const SizedBox();
            }

            // Resolve currently selected item
            final int? currentSelectedId =
                cartController.selectedRelatedCartItemId ??
                cartList.firstOrNull?.item?.id;
            CartModel? selectedCart;
            try {
              selectedCart = cartList.firstWhere(
                (c) => c.item?.id == currentSelectedId,
              );
            } catch (_) {
              selectedCart = cartList.isNotEmpty ? cartList.first : null;
            }

            return Container(
              color: Colors.white,
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title Header matching mockup
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.auto_awesome_rounded,
                          size: 22,
                          color: Color(0xFF16A34A),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                cartList.length == 1 &&
                                        selectedCart?.item?.name != null
                                    ? 'Related to ${selectedCart!.item!.name}'
                                    : 'You May Also Like!',
                                style: robotoBold.copyWith(
                                  fontSize: 15,
                                  color: const Color(0xFF0F172A),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 1),
                              Text(
                                'Add these and complete your cart',
                                style: robotoRegular.copyWith(
                                  fontSize: 11,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        InkWell(
                          onTap: () {
                            if (cartList.isNotEmpty &&
                                cartList[0].item?.storeId != null) {
                              Get.toNamed(
                                RouteHelper.getStoreRoute(
                                  id: cartList[0].item!.storeId,
                                  page: 'item',
                                  slug: Get.find<StoreController>().store?.slug ?? '',
                                ),
                                arguments: StoreScreen(
                                  store: Store(id: cartList[0].item!.storeId),
                                  fromModule: false,
                                ),
                              );
                            }
                          },
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'See All',
                                style: robotoBold.copyWith(
                                  fontSize: 12,
                                  color: const Color(0xFF16A34A),
                                ),
                              ),
                              const SizedBox(width: 2),
                              const Icon(
                                Icons.chevron_right_rounded,
                                size: 16,
                                color: Color(0xFF16A34A),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Cart Item Selection Chips (if multiple items in cart)
                  if (cartList.length > 1) ...[
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'Select an item to see related products:',
                        style: robotoRegular.copyWith(
                          fontSize: 11,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      height: 38,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: cartList.length,
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemBuilder: (context, index) {
                          final CartModel cart = cartList[index];
                          final bool isSelected =
                              cart.item?.id != null &&
                              cart.item!.id == currentSelectedId;

                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: InkWell(
                              onTap: () {
                                if (cart.item?.id != null) {
                                  cartController.setSelectedRelatedCartItemId(
                                    cart.item!.id,
                                  );
                                }
                              },
                              borderRadius: BorderRadius.circular(18),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFFE8F8EE)
                                      : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFF16A34A)
                                        : const Color(0xFFE2E8F0),
                                    width: isSelected ? 1.5 : 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (cart.item?.imageFullUrl != null)
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(6),
                                        child: CustomImage(
                                          image: cart.item!.imageFullUrl ?? '',
                                          height: 20,
                                          width: 20,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    if (cart.item?.imageFullUrl != null)
                                      const SizedBox(width: 6),
                                    ConstrainedBox(
                                      constraints: const BoxConstraints(
                                        maxWidth: 130,
                                      ),
                                      child: Text(
                                        cart.item?.name ?? '',
                                        style: isSelected
                                            ? robotoBold.copyWith(
                                                fontSize: 11.5,
                                                color: const Color(0xFF16A34A),
                                              )
                                            : robotoRegular.copyWith(
                                                fontSize: 11.5,
                                                color: const Color(0xFF334155),
                                              ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (isSelected) ...[
                                      const SizedBox(width: 4),
                                      const Icon(
                                        Icons.check_circle_rounded,
                                        size: 13,
                                        color: Color(0xFF16A34A),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],

                  const SizedBox(height: 10),

                  // Content: Loading indicator or Horizontal Items List
                  if (cartController.isRelatedItemLoading)
                    SizedBox(
                      height: 175,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: 4,
                        physics: const NeverScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemBuilder: (context, index) {
                          return Container(
                            width: 125,
                            margin: const EdgeInsets.only(right: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: const Color(0xFFF1F5F9),
                              ),
                            ),
                            child: const Center(
                              child: SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Color(0xFF16A34A),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    )
                  else
                    SizedBox(
                      height: 175,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: displayedItems.length,
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemBuilder: (context, index) {
                          return _SuggestedItemCard(
                            item: displayedItems[index],
                          );
                        },
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> showReferAndEarnSnackBar() async {
    final String text = 'your_referral_discount_added_on_your_first_order'.tr;
    if (Get.find<ProfileController>().userInfoModel != null &&
        Get.find<ProfileController>().userInfoModel!.isValidForDiscount!) {
      showCustomSnackBar(text, isError: false);
    }
  }

  bool _isGroceryOrPharmacy(CartController cartController) {
    final String? moduleType = cartController.cartList.isNotEmpty
        ? cartController.cartList[0].item?.moduleType
        : null;
    return moduleType == AppConstants.grocery ||
        moduleType == AppConstants.pharmacy;
  }

  bool _hasCampaignOrFlashSaleItem(CartController cartController) {
    return cartController.cartList.any(
      (cart) => (cart.isCampaign ?? false) || (cart.item?.flashSale ?? 0) > 0,
    );
  }
}

class CheckoutButton extends StatefulWidget {
  final CartController cartController;
  final List<bool> availableList;
  final VoidCallback? onCheckout;
  final bool isCheckingOut;
  const CheckoutButton({
    super.key,
    required this.cartController,
    required this.availableList,
    this.onCheckout,
    this.isCheckingOut = false,
  });

  @override
  State<CheckoutButton> createState() => _CheckoutButtonState();
}

class _CheckoutButtonState extends State<CheckoutButton> {
  bool _isPriceBreakdownExpanded = false;

  @override
  Widget build(BuildContext context) {
    final bool isDesktop = ResponsiveHelper.isDesktop(context);
    double percentage = 0;

    return Container(
      width: Dimensions.webMaxWidth,
      padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(
          isDesktop ? Dimensions.radiusDefault : 0,
        ),
      ),
      child: GetBuilder<StoreController>(
        builder: (storeController) {
          if (storeController.store != null &&
              !storeController.store!.freeDelivery! &&
              (Get.find<SplashController>()
                          .configModel
                          ?.adminFreeDelivery
                          ?.status ==
                      true &&
                  Get.find<SplashController>()
                          .configModel
                          ?.adminFreeDelivery
                          ?.type ==
                      'free_delivery_by_order_amount' &&
                  Get.find<SplashController>()
                          .configModel!
                          .adminFreeDelivery
                          ?.freeDeliveryOver !=
                      null)) {
            percentage =
                widget.cartController.subTotal /
                Get.find<SplashController>()
                    .configModel!
                    .adminFreeDelivery!
                    .freeDeliveryOver!;
          }

          double subTotal = widget.cartController.subTotal;
          if (storeController.store != null &&
              storeController.store!.extraPackagingStatus! &&
              widget.cartController.needExtraPackage) {
            subTotal = subTotal + storeController.store!.extraPackagingAmount!;
          }

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Free delivery progress (mobile + desktop)
              if (!isDesktop &&
                  storeController.store != null &&
                  !storeController.store!.freeDelivery! &&
                  (Get.find<SplashController>()
                              .configModel
                              ?.adminFreeDelivery
                              ?.status ==
                          true &&
                      Get.find<SplashController>()
                              .configModel
                              ?.adminFreeDelivery
                              ?.type ==
                          'free_delivery_by_order_amount' &&
                      Get.find<SplashController>()
                              .configModel!
                              .adminFreeDelivery
                              ?.freeDeliveryOver !=
                          null) &&
                  percentage < 1)
                Column(
                  children: [
                    Row(
                      children: [
                        Image.asset(
                          Images.percentTag,
                          height: 20,
                          width: 20,
                          color: Colors.orange,
                        ),
                        const SizedBox(width: Dimensions.paddingSizeExtraSmall),
                        Text(
                          PriceConverter.convertPrice(
                            Get.find<SplashController>()
                                    .configModel!
                                    .adminFreeDelivery!
                                    .freeDeliveryOver! -
                                widget.cartController.subTotal,
                          ),
                          style: robotoMedium.copyWith(color: Colors.orange),
                          textDirection: TextDirection.ltr,
                        ),
                        const SizedBox(width: Dimensions.paddingSizeExtraSmall),
                        Text(
                          'more_for_free_delivery'.tr,
                          style: robotoMedium.copyWith(
                            color: Theme.of(context).disabledColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                    LinearProgressIndicator(
                      backgroundColor: Theme.of(
                        context,
                      ).disabledColor.withValues(alpha: 0.2),
                      value: percentage,
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        Colors.orange,
                      ),
                    ),
                    const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                  ],
                ),

              // ── Collapsible price breakdown (mobile only) ────────────────────
              if (!isDesktop) ...[
                // Pro plan promo / benefit banner — above subtotal
                Padding(
                  padding: const EdgeInsets.only(
                    bottom: Dimensions.paddingSizeSmall,
                  ),
                  child: ProCartBannerWidget(
                    subtotal: subTotal,
                    redirectRoute: RouteHelper.getCartRoute(),
                  ),
                ),

                AnimatedCrossFade(
                  duration: const Duration(milliseconds: 250),
                  crossFadeState: _isPriceBreakdownExpanded
                      ? CrossFadeState.showFirst
                      : CrossFadeState.showSecond,
                  firstChild: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(
                      Dimensions.paddingSizeSmall,
                      Dimensions.paddingSizeSmall,
                      Dimensions.paddingSizeSmall,
                      0,
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('item_price'.tr, style: robotoRegular),
                            PriceConverter.convertAnimationPrice(
                              widget.cartController.itemPrice,
                              textStyle: robotoRegular,
                            ),
                          ],
                        ),

                        if (widget.cartController.variationPrice > 0 &&
                            ModuleHelper.getModuleConfig(
                              widget
                                  .cartController
                                  .cartList
                                  .first
                                  .item!
                                  .moduleType,
                            ).newVariation!) ...[
                          const SizedBox(height: Dimensions.paddingSizeSmall),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('variations'.tr, style: robotoRegular),
                              Text(
                                '(+) ${PriceConverter.convertPrice(widget.cartController.variationPrice)}',
                                style: robotoRegular,
                                textDirection: TextDirection.ltr,
                              ),
                            ],
                          ),
                        ],

                        const SizedBox(height: Dimensions.paddingSizeSmall),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('discount'.tr, style: robotoRegular),
                            storeController.store != null
                                ? Row(
                                    children: [
                                      Text('(-)', style: robotoRegular),
                                      PriceConverter.convertAnimationPrice(
                                        widget.cartController.itemDiscountPrice,
                                        textStyle: robotoRegular,
                                      ),
                                    ],
                                  )
                                : Text('calculating'.tr, style: robotoRegular),
                          ],
                        ),

                        if (Get.find<SplashController>()
                            .configModel!
                            .moduleConfig!
                            .module!
                            .addOn!) ...[
                          const SizedBox(height: Dimensions.paddingSizeSmall),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('addons'.tr, style: robotoRegular),
                              Row(
                                children: [
                                  Text('(+)', style: robotoRegular),
                                  PriceConverter.convertAnimationPrice(
                                    widget.cartController.addOns,
                                    textStyle: robotoRegular,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],

                        if (storeController.store != null &&
                            storeController.store!.extraPackagingStatus! &&
                            widget.cartController.needExtraPackage) ...[
                          const SizedBox(height: Dimensions.paddingSizeSmall),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('extra_packaging'.tr, style: robotoRegular),
                              Text(
                                '(+) ${PriceConverter.convertPrice(storeController.store!.extraPackagingAmount!)}',
                                style: robotoRegular,
                                textDirection: TextDirection.ltr,
                              ),
                            ],
                          ),
                        ],

                        const SizedBox(height: Dimensions.paddingSizeSmall),
                        Divider(
                          color: Theme.of(
                            context,
                          ).disabledColor.withValues(alpha: 0.3),
                          height: 1,
                        ),
                      ],
                    ),
                  ),
                  secondChild: const SizedBox(width: double.infinity),
                ),

                // Subtotal row — tapping toggles price breakdown
                InkWell(
                  onTap: () => setState(
                    () =>
                        _isPriceBreakdownExpanded = !_isPriceBreakdownExpanded,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Dimensions.paddingSizeSmall,
                      vertical: Dimensions.paddingSizeExtraSmall,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Text(
                              'subtotal'.tr,
                              style: robotoMedium.copyWith(
                                color: Theme.of(
                                  context,
                                ).textTheme.bodyLarge!.color,
                              ),
                            ),
                            const SizedBox(
                              width: Dimensions.paddingSizeExtraSmall,
                            ),
                            AnimatedRotation(
                              turns: _isPriceBreakdownExpanded ? 0.0 : 0.5,
                              duration: const Duration(milliseconds: 250),
                              child: Icon(
                                Icons.keyboard_arrow_up_rounded,
                                size: 20,
                                color: Theme.of(
                                  context,
                                ).textTheme.bodyLarge!.color,
                              ),
                            ),
                          ],
                        ),
                        PriceConverter.convertAnimationPrice(
                          subTotal,
                          textStyle: robotoBold,
                        ),
                      ],
                    ),
                  ),
                ),
              ],

              // Desktop subtotal row (unchanged)
              if (isDesktop) ...[
                const Divider(height: 1),
                const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                Padding(
                  padding: const EdgeInsets.only(
                    bottom: Dimensions.paddingSizeSmall,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'subtotal'.tr,
                        style: robotoMedium.copyWith(
                          color: Theme.of(context).textTheme.bodyLarge!.color,
                        ),
                      ),
                      PriceConverter.convertAnimationPrice(
                        subTotal,
                        textStyle: robotoBold,
                      ),
                    ],
                  ),
                ),
              ],

              // Desktop-only: cutlery switch
              if (isDesktop &&
                  Get.find<SplashController>()
                      .getModuleConfig(
                        widget.cartController.cartList[0].item!.moduleType,
                      )
                      .newVariation! &&
                  storeController.store != null &&
                  storeController.store!.cutlery!)
                Padding(
                  padding: const EdgeInsets.symmetric(
                    vertical: Dimensions.paddingSizeSmall,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Image.asset(Images.cutlery, height: 18, width: 18),
                      const SizedBox(width: Dimensions.paddingSizeDefault),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'add_cutlery'.tr,
                              style: robotoMedium.copyWith(
                                color: Theme.of(context).primaryColor,
                              ),
                            ),
                            const SizedBox(
                              height: Dimensions.paddingSizeExtraSmall,
                            ),
                            Text(
                              'do_not_have_cutlery'.tr,
                              style: robotoRegular.copyWith(
                                color: Theme.of(context).disabledColor,
                                fontSize: Dimensions.fontSizeSmall,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Transform.scale(
                        scale: 0.7,
                        child: CupertinoSwitch(
                          value: widget.cartController.addCutlery,
                          activeTrackColor: Theme.of(context).primaryColor,
                          onChanged: (_) =>
                              widget.cartController.updateCutlery(),
                          inactiveTrackColor: Theme.of(
                            context,
                          ).primaryColor.withValues(alpha: 0.5),
                        ),
                      ),
                    ],
                  ),
                ),

              // Desktop-only: not available
              if (isDesktop)
                Container(
                  width: Dimensions.webMaxWidth,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                    color: Theme.of(context).cardColor,
                    border: Border.all(
                      color: Theme.of(
                        context,
                      ).disabledColor.withValues(alpha: 0.2),
                      width: 0.5,
                    ),
                  ),
                  padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      InkWell(
                        onTap: () => Get.dialog(
                          const Dialog(child: NotAvailableBottomSheetWidget()),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                'if_any_product_is_not_available'.tr,
                                style: robotoMedium.copyWith(
                                  fontSize: Dimensions.fontSizeSmall,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const Icon(Icons.keyboard_arrow_down, size: 18),
                          ],
                        ),
                      ),
                      const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                      Container(
                        padding: const EdgeInsets.only(
                          left: Dimensions.paddingSizeSmall,
                        ),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(
                            Dimensions.radiusSmall,
                          ),
                          color: Theme.of(
                            context,
                          ).disabledColor.withValues(alpha: 0.1),
                        ),
                        child: widget.cartController.notAvailableIndex != -1
                            ? Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    widget
                                        .cartController
                                        .notAvailableList[widget
                                            .cartController
                                            .notAvailableIndex]
                                        .tr,
                                    style: robotoRegular.copyWith(
                                      fontSize: Dimensions.fontSizeExtraSmall,
                                      color: Theme.of(context).hintColor,
                                    ),
                                  ),
                                  IconButton(
                                    onPressed: () => widget.cartController
                                        .setAvailableIndex(-1),
                                    icon: const Icon(
                                      Icons.clear,
                                      size: 18,
                                      color: Colors.red,
                                    ),
                                  ),
                                ],
                              )
                            : const SizedBox(),
                      ),
                    ],
                  ),
                ),

              // Desktop-only: delivery time
              if (isDesktop &&
                  Get.find<SplashController>()
                      .getModuleConfig(
                        widget.cartController.cartList[0].item!.moduleType,
                      )
                      .newVariation! &&
                  storeController.store != null &&
                  storeController.store!.deliveryTime != null)
                Container(
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(
                      Dimensions.radiusDefault,
                    ),
                  ),
                  width: double.infinity,
                  padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
                  margin: const EdgeInsets.symmetric(
                    vertical: Dimensions.paddingSizeDefault,
                  ),
                  child: Row(
                    children: [
                      Image.asset(
                        Images.carDelivery,
                        height: 20,
                        width: 20,
                        color: Colors.orange,
                      ),
                      const SizedBox(width: Dimensions.paddingSizeSmall),
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: '${'estimated_delivery_time'.tr} : ',
                              style: robotoMedium.copyWith(
                                color: Theme.of(context)
                                    .textTheme
                                    .bodyLarge!
                                    .color!
                                    .withValues(alpha: 0.5),
                              ),
                            ),
                            TextSpan(
                              text: '${storeController.store?.deliveryTime}',
                              style: robotoBold.copyWith(
                                color: Theme.of(
                                  context,
                                ).textTheme.bodyLarge!.color,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              // Desktop free delivery progress
              if (isDesktop &&
                  storeController.store != null &&
                  !storeController.store!.freeDelivery! &&
                  (Get.find<SplashController>()
                              .configModel
                              ?.adminFreeDelivery
                              ?.status ==
                          true &&
                      Get.find<SplashController>()
                              .configModel
                              ?.adminFreeDelivery
                              ?.type ==
                          'free_delivery_by_order_amount' &&
                      Get.find<SplashController>()
                              .configModel!
                              .adminFreeDelivery
                              ?.freeDeliveryOver !=
                          null) &&
                  percentage < 1) ...[
                const SizedBox(height: Dimensions.paddingSizeSmall),
                Row(
                  children: [
                    Image.asset(
                      Images.percentTag,
                      height: 20,
                      width: 20,
                      color: Colors.orange,
                    ),
                    const SizedBox(width: Dimensions.paddingSizeExtraSmall),
                    Text(
                      PriceConverter.convertPrice(
                        Get.find<SplashController>()
                                .configModel!
                                .adminFreeDelivery!
                                .freeDeliveryOver! -
                            widget.cartController.subTotal,
                      ),
                      style: robotoMedium.copyWith(color: Colors.orange),
                      textDirection: TextDirection.ltr,
                    ),
                    const SizedBox(width: Dimensions.paddingSizeExtraSmall),
                    Text(
                      'more_for_free_delivery'.tr,
                      style: robotoMedium.copyWith(
                        color: Theme.of(context).disabledColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                LinearProgressIndicator(
                  backgroundColor: Theme.of(
                    context,
                  ).disabledColor.withValues(alpha: 0.2),
                  value: percentage,
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    Colors.orange,
                  ),
                ),
              ],

              if (isDesktop)
                const SizedBox(height: Dimensions.paddingSizeSmall),

              // Checkout button
              SafeArea(
                child: CustomButton(
                  buttonText: widget.isCheckingOut
                      ? 'loading'.tr
                      : 'confirm_delivery_details'.tr,
                  fontSize: isDesktop
                      ? Dimensions.fontSizeSmall
                      : Dimensions.fontSizeLarge,
                  isBold: !isDesktop,
                  radius: isDesktop
                      ? Dimensions.radiusSmall
                      : Dimensions.radiusDefault,
                  isLoading: widget.isCheckingOut,
                  onPressed:
                      (widget.isCheckingOut ||
                          (widget.cartController.cartList.isNotEmpty &&
                              !widget
                                  .cartController
                                  .cartList
                                  .first
                                  .item!
                                  .scheduleOrder! &&
                              widget.availableList.contains(false)))
                      ? null
                      : widget.onCheckout,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ── Compact Suggested Item Card ──────────────────────────────────────────────
class _SuggestedItemCard extends StatelessWidget {
  final Item item;
  const _SuggestedItemCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final String unitText = item.unitType != null && item.unitType!.isNotEmpty
        ? item.unitType!
        : '';

    return Container(
      width: 125,
      margin: const EdgeInsets.only(right: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: () {
          if (item.id == null) return;
          ResponsiveHelper.isMobile(context)
              ? Get.bottomSheet(
                  ItemNewBottomSheet(
                    itemId: item.id!,
                    item: item,
                    inStorePage: false,
                  ),
                  backgroundColor: Colors.transparent,
                  isScrollControlled: true,
                )
              : Get.dialog(
                  Dialog(
                    child: ItemNewBottomSheet(
                      itemId: item.id!,
                      item: item,
                      inStorePage: false,
                    ),
                  ),
                );
        },
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product image
              Center(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CustomImage(
                    image: item.imageFullUrl ?? '',
                    height: 64,
                    width: 64,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              const SizedBox(height: 6),

              // Title
              Text(
                item.name ?? '',
                style: robotoBold.copyWith(
                  fontSize: 11.5,
                  color: const Color(0xFF0F172A),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),

              // Unit / weight
              const SizedBox(height: 1),
              Text(
                unitText.isNotEmpty ? unitText : ' ',
                style: robotoRegular.copyWith(
                  fontSize: 10,
                  color: const Color(0xFF64748B),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),

              const Spacer(),

              // Price and Add button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Text(
                      PriceConverter.convertPrice(item.price),
                      style: robotoBold.copyWith(
                        fontSize: 13,
                        color: const Color(0xFF0F172A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  CartCountView(
                    item: item,
                    child: Container(
                      height: 28,
                      width: 28,
                      decoration: const BoxDecoration(
                        color: Color(0xFF16A34A),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.add_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Interactive Swipe to Checkout Slider ─────────────────────────────────────
class _SwipeToCheckoutSlider extends StatefulWidget {
  final VoidCallback onSwipeComplete;
  final bool isLoading;
  const _SwipeToCheckoutSlider({
    required this.onSwipeComplete,
    this.isLoading = false,
  });

  @override
  State<_SwipeToCheckoutSlider> createState() => _SwipeToCheckoutSliderState();
}

class _SwipeToCheckoutSliderState extends State<_SwipeToCheckoutSlider>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  Animation<double>? _animation;
  double _dragOffset = 0.0;
  bool _isSubmitted = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    )..addListener(() {
        if (_animation != null) {
          setState(() => _dragOffset = _animation!.value);
        }
      });
  }

  @override
  void didUpdateWidget(covariant _SwipeToCheckoutSlider oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isLoading && !widget.isLoading) {
      setState(() {
        _isSubmitted = false;
        _dragOffset = 0.0;
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _animateTo(double target, {VoidCallback? onDone}) {
    _animation = Tween<double>(begin: _dragOffset, end: target).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _controller.forward(from: 0.0).then((_) {
      onDone?.call();
    });
  }

  @override
  Widget build(BuildContext context) {
    const double sliderHeight = 52.0;
    const double knobSize = 44.0;
    const double knobMargin = 4.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final double maxDrag =
            (constraints.maxWidth - knobSize - (knobMargin * 2))
                .clamp(0.0, double.infinity);

        return InkWell(
          onTap: () {
            if (widget.isLoading || _isSubmitted) return;
            if (maxDrag > 0) {
              setState(() => _isSubmitted = true);
              _animateTo(maxDrag, onDone: () => widget.onSwipeComplete());
            } else {
              widget.onSwipeComplete();
            }
          },
          borderRadius: BorderRadius.circular(sliderHeight / 2),
          child: Container(
            height: sliderHeight,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFE8FDF0), Color(0xFFDCFCE7)],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(sliderHeight / 2),
              border: Border.all(color: const Color(0xFFA7F3D0), width: 1.2),
            ),
            child: Stack(
              alignment: Alignment.centerLeft,
              children: [
                // Track content: texts in center, cart icon on right
                Positioned.fill(
                  child: Padding(
                    padding: const EdgeInsets.only(
                      left: knobSize + 8,
                      right: 14,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Text(
                                'Swipe to Checkout',
                                style: robotoBold.copyWith(
                                  fontSize: 13,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 1),
                              Text(
                                'Slide to continue securely',
                                style: robotoRegular.copyWith(
                                  fontSize: 9.5,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.shopping_cart_outlined,
                          color: Color(0xFF16A34A),
                          size: 22,
                        ),
                      ],
                    ),
                  ),
                ),

                // Draggable knob
                Positioned(
                  left: knobMargin + _dragOffset,
                  top: knobMargin,
                  bottom: knobMargin,
                  child: GestureDetector(
                    onHorizontalDragUpdate: (details) {
                      if (widget.isLoading || _isSubmitted) return;
                      setState(() {
                        _dragOffset =
                            (_dragOffset + details.delta.dx).clamp(0.0, maxDrag);
                      });
                    },
                    onHorizontalDragEnd: (details) {
                      if (widget.isLoading || _isSubmitted) return;
                      if (maxDrag > 0 && (_dragOffset / maxDrag) >= 0.65) {
                        setState(() {
                          _dragOffset = maxDrag;
                          _isSubmitted = true;
                        });
                        widget.onSwipeComplete();
                      } else {
                        _animateTo(0.0);
                      }
                    },
                    child: Container(
                      width: knobSize,
                      height: knobSize,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF16A34A), Color(0xFF15803D)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF16A34A)
                                .withValues(alpha: 0.35),
                            blurRadius: 6,
                            offset: const Offset(2, 2),
                          ),
                        ],
                      ),
                      child: Center(
                        child: widget.isLoading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Row(
                                mainAxisSize: MainAxisSize.min,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(
                                    Icons.keyboard_arrow_right_rounded,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                  Transform.translate(
                                    offset: const Offset(-8, 0),
                                    child: const Icon(
                                      Icons.keyboard_arrow_right_rounded,
                                      color: Colors.white,
                                      size: 18,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
