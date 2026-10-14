import 'dart:async';

import 'package:get/get.dart';
import 'package:sixam_mart/features/item/domain/models/item_model.dart';
import 'package:sixam_mart/common/models/module_model.dart';
import 'package:sixam_mart/features/cart/domain/models/all_carts_model.dart';
import 'package:sixam_mart/features/cart/domain/models/cart_model.dart';
import 'package:sixam_mart/features/cart/domain/models/online_cart_model.dart';
import 'package:sixam_mart/features/cart/domain/services/cart_service_interface.dart';
import 'package:sixam_mart/features/checkout/domain/models/place_order_body_model.dart';
import 'package:sixam_mart/features/home/screens/home_screen.dart';
import 'package:sixam_mart/features/item/controllers/item_controller.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/date_converter.dart';
import 'package:sixam_mart/helper/module_helper.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/helper/price_converter.dart';

class CartController extends GetxController implements GetxService {
  final CartServiceInterface cartServiceInterface;

  CartController({required this.cartServiceInterface});

  List<CartModel> _cartList = [];
  List<CartModel> get cartList => _cartList;

  double _subTotal = 0;
  double get subTotal => _subTotal;

  double _itemPrice = 0;
  double get itemPrice => _itemPrice;

  double _itemDiscountPrice = 0;
  double get itemDiscountPrice => _itemDiscountPrice;

  double _addOns = 0;
  double get addOns => _addOns;

  double _variationPrice = 0;
  double get variationPrice => _variationPrice;

  List<List<AddOns>> _addOnsList = [];
  List<List<AddOns>> get addOnsList => _addOnsList;

  List<bool> _availableList = [];
  List<bool> get availableList => _availableList;

  List<String> notAvailableList = [
    'Remove it from my cart',
    'I’ll wait until it’s restocked',
    'Please cancel the order',
    'Call me ASAP',
    'Notify me when it’s back',
  ];
  bool _addCutlery = false;
  bool get addCutlery => _addCutlery;

  int _notAvailableIndex = -1;
  int get notAvailableIndex => _notAvailableIndex;

  int _currentIndex = 0;
  int get currentIndex => _currentIndex;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _needExtraPackage = false;
  bool get needExtraPackage => _needExtraPackage;

  bool _isExpanded = true;
  bool get isExpanded => _isExpanded;

  int? _directAddCartItemIndex = -1;
  int? get directAddCartItemIndex => _directAddCartItemIndex;

  List<AllCartsModel>? _allCartsGroups;
  List<AllCartsModel>? get allCartsGroups => _allCartsGroups;

  // Total number of cart line-items across every module/store (the global cart count).
  int get allCartsItemCount {
    if (_allCartsGroups == null) return 0;
    int count = 0;
    for (final AllCartsModel group in _allCartsGroups!) {
      count += group.carts?.length ?? 0;
    }
    return count;
  }

  bool _isAllCartsLoading = false;
  bool get isAllCartsLoading => _isAllCartsLoading;

  // Incremented on every getAllCarts() call. After the await, any call whose
  // captured token no longer matches is stale (a newer call overtook it) and
  // must be discarded to prevent a slower older response from overwriting the
  // result of a faster newer one.
  int _allCartsGeneration = 0;

  // Set while CartScreen is visible so getAllCarts() never floods _cartList with mixed-store items.
  int? _activeCartScreenStoreId;
  int? get activeCartScreenStoreId => _activeCartScreenStoreId;

  void setActiveCartScreen(int? storeId) => _activeCartScreenStoreId = storeId;

  void clearActiveCartScreen() {
    _activeCartScreenStoreId = null;
    getAllCarts(notify: false);
  }

  List<Item>? _relatedItemList;
  List<Item>? get relatedItemList => _relatedItemList;

  bool _isRelatedItemLoading = false;
  bool get isRelatedItemLoading => _isRelatedItemLoading;

  int? _selectedRelatedCartItemId;
  int? get selectedRelatedCartItemId => _selectedRelatedCartItemId;

  void setDirectlyAddToCartIndex(int? index) {
    _directAddCartItemIndex = index;
  }

  void toggleExtraPackage({bool willUpdate = true}) {
    _needExtraPackage = !_needExtraPackage;
    if (willUpdate) {
      update();
    }
  }

  void setAvailableIndex(int index, {bool willUpdate = true}) {
    _notAvailableIndex = cartServiceInterface.availableSelectedIndex(
      _notAvailableIndex,
      index,
    );
    if (willUpdate) {
      update();
    }
  }

  void updateCutlery({bool willUpdate = true}) {
    _addCutlery = !_addCutlery;
    if (willUpdate) {
      update();
    }
  }

  Future<void> forcefullySetModule(int moduleId) async {
    ModuleModel? module = cartServiceInterface.forcefullySetModule(
      Get.find<SplashController>().module,
      Get.find<SplashController>().moduleList,
      moduleId,
    );
    if (module != null) {
      await Get.find<SplashController>().setModule(module);
      HomeScreen.loadData(true);
    }
  }

  double calculationCart() {
    _addOnsList = [];
    _availableList = [];
    _itemPrice = 0;
    _itemDiscountPrice = 0;
    _addOns = 0;
    _variationPrice = 0;
    bool isFoodVariation = false;
    double variationWithoutDiscountPrice = 0;
    bool haveVariation = false;
    for (var cartModel in cartList) {
      isFoodVariation = Get.isRegistered<SplashController>()
          ? (ModuleHelper.getModuleConfig(
                  cartModel.item!.moduleType,
                ).newVariation ??
                false)
          : false;
      double? discount = cartModel.item!.discount;
      String? discountType = cartModel.item!.discountType;

      List<AddOns> addOnList = cartServiceInterface.prepareAddonList(cartModel);

      _addOnsList.add(addOnList);
      _availableList.add(
        DateConverter.isAvailable(
          cartModel.item!.availableTimeStarts,
          cartModel.item!.availableTimeEnds,
          time: Get.isRegistered<SplashController>()
              ? Get.find<SplashController>().currentTime
              : DateTime.now(),
        ),
      );

      _addOns = cartServiceInterface.calculateAddonPrice(
        _addOns,
        addOnList,
        cartModel,
      );

      _variationPrice = cartServiceInterface.calculateVariationPrice(
        isFoodVariation,
        cartModel,
        discount,
        discountType,
        _variationPrice,
      );

      variationWithoutDiscountPrice = cartServiceInterface
          .calculateVariationWithoutDiscountPrice(
            isFoodVariation,
            cartModel,
            variationWithoutDiscountPrice,
          );
      haveVariation = cartServiceInterface.checkVariation(
        isFoodVariation,
        cartModel,
      );

      double price = haveVariation
          ? variationWithoutDiscountPrice
          : (cartModel.item!.price! * cartModel.quantity!);
      double discountPrice = haveVariation
          ? (variationWithoutDiscountPrice - _variationPrice)
          : (price -
                (PriceConverter.convertWithDiscount(
                      cartModel.item!.price!,
                      discount,
                      discountType,
                    )! *
                    cartModel.quantity!));

      _itemPrice = _itemPrice + price;
      _itemDiscountPrice = _itemDiscountPrice + discountPrice;

      haveVariation = false;
    }
    if (isFoodVariation) {
      _itemDiscountPrice =
          _itemDiscountPrice +
          (variationWithoutDiscountPrice - _variationPrice);
      _variationPrice = variationWithoutDiscountPrice;
      _subTotal = (_itemPrice - _itemDiscountPrice) + _addOns + _variationPrice;
    } else {
      _subTotal = (_itemPrice - _itemDiscountPrice);
    }

    return _subTotal;
  }

  double calculateGCartSubTotal(List<CartModel> cartList) {
    double itemPrice = 0;
    double itemDiscountPrice = 0;
    double addOns = 0;
    double subTotal = 0;
    double thisVariationPrice = 0;
    bool isFoodVariation = false;
    double variationWithoutDiscountPrice = 0;
    bool haveVariation = false;
    for (var cartModel in cartList) {
      isFoodVariation = Get.isRegistered<SplashController>()
          ? (ModuleHelper.getModuleConfig(
                  cartModel.item!.moduleType,
                ).newVariation ??
                false)
          : false;
      double? discount = cartModel.item!.discount;
      String? discountType = cartModel.item!.discountType;

      List<AddOns> addOnList = cartServiceInterface.prepareAddonList(cartModel);

      addOns = cartServiceInterface.calculateAddonPrice(
        addOns,
        addOnList,
        cartModel,
      );

      thisVariationPrice = cartServiceInterface.calculateVariationPrice(
        isFoodVariation,
        cartModel,
        discount,
        discountType,
        thisVariationPrice,
      );

      variationWithoutDiscountPrice = cartServiceInterface
          .calculateVariationWithoutDiscountPrice(
            isFoodVariation,
            cartModel,
            variationWithoutDiscountPrice,
          );
      haveVariation = cartServiceInterface.checkVariation(
        isFoodVariation,
        cartModel,
      );

      double price = haveVariation
          ? variationWithoutDiscountPrice
          : (cartModel.item!.price! * cartModel.quantity!);
      double discountPrice = haveVariation
          ? (variationWithoutDiscountPrice - thisVariationPrice)
          : (price -
                (PriceConverter.convertWithDiscount(
                      cartModel.item!.price!,
                      discount,
                      discountType,
                    )! *
                    cartModel.quantity!));

      itemPrice = itemPrice + price;
      itemDiscountPrice = itemDiscountPrice + discountPrice;

      haveVariation = false;
    }
    if (isFoodVariation) {
      itemDiscountPrice =
          itemDiscountPrice +
          (variationWithoutDiscountPrice - thisVariationPrice);
      thisVariationPrice = variationWithoutDiscountPrice;
      subTotal = (itemPrice - itemDiscountPrice) + addOns + thisVariationPrice;
    } else {
      subTotal = (itemPrice - itemDiscountPrice);
    }

    return subTotal;
  }

  List<CartModel> localCartsOfGroup(AllCartsModel group) {
    return cartServiceInterface.formatOnlineCartToLocalCart(
      onlineCartModel: group.onlineCarts ?? <OnlineCartModel>[],
    );
  }

  Future<void> addToCart(CartModel cartModel, int? index) async {
    if (index != null && index != -1) {
      _cartList.replaceRange(index, index + 1, [cartModel]);
    } else {
      _cartList.add(cartModel);
    }
    Get.find<ItemController>().setExistInCart(
      cartModel.item,
      null,
      notify: true,
    );
    await cartServiceInterface.addSharedPrefCartList(_cartList);

    calculationCart();
    update();
  }

  int? getCartId(int cartIndex) {
    return cartServiceInterface.getCartId(cartIndex, _cartList);
  }

  Future<void> setQuantity(
    bool isIncrement,
    int cartIndex,
    int? stock,
    int? quantityLimit,
  ) async {
    if (_isLoading) return;

    _isLoading = true;
    update();

    int oldQuantity = _cartList[cartIndex].quantity!;
    _cartList[cartIndex].quantity = cartServiceInterface.decideItemQuantity(
      isIncrement,
      _cartList,
      cartIndex,
      stock,
      quantityLimit,
      Get.find<SplashController>().configModel!.moduleConfig!.module!.stock!,
    );

    if (oldQuantity == _cartList[cartIndex].quantity) {
      _isLoading = false;
      update();
      return;
    }

    final bool newVariation = Get.isRegistered<SplashController>()
        ? (ModuleHelper.getModuleConfig(
                _cartList[cartIndex].item!.moduleType,
              ).newVariation ??
              false)
        : false;
    double discountedPrice = await cartServiceInterface
        .calculateDiscountedPrice(
          _cartList[cartIndex],
          _cartList[cartIndex].quantity!,
          newVariation,
        );
    if (newVariation && Get.isRegistered<ItemController>()) {
      await Get.find<ItemController>().setExistInCart(
        _cartList[cartIndex].item,
        null,
        notify: true,
      );
    }

    await updateCartQuantityOnline(
      _cartList[cartIndex].id!,
      discountedPrice,
      _cartList[cartIndex].quantity!,
      storeId: _cartList[cartIndex].item?.storeId,
    );
  }

  // ── Debounced cart-quantity sync & optimistic undo removal ─────────────────
  // Tapping +/- updates the quantity (and totals) in-memory immediately so the
  // UI stays responsive, then schedules a single backend sync that fires only
  // after the user has stopped tapping for [_quantitySyncDelay]. Rapid taps
  // collapse into one API call instead of one-per-tap, and the buttons are never
  // blocked while a previous request is in flight. Keyed by cart id so several
  // items can be adjusted independently.
  static const Duration _quantitySyncDelay = Duration(milliseconds: 600);
  final Map<int, Timer> _quantitySyncTimers = {};
  final Set<int> _activeSyncCartIds = <int>{};
  final Set<int> _queuedSyncCartIds = <int>{};
  final Map<int, Completer<bool>> _cartSyncCompleters =
      <int, Completer<bool>>{};

  final Map<int, Timer> _pendingRemovalTimers = {};
  final Map<int, CartModel> _pendingRemovalItems = {};
  final Map<int, int> _pendingRemovalIndices = {};
  final Set<int> _inFlightRemovalIds = <int>{};
  final Map<int, Completer<bool>> _removalCompleters = <int, Completer<bool>>{};
  final List<int> _recentRemovedCartIds = <int>[];

  int _sessionToken = 0;

  bool get hasPendingQuantitySyncs =>
      _quantitySyncTimers.isNotEmpty ||
      _activeSyncCartIds.isNotEmpty ||
      _queuedSyncCartIds.isNotEmpty ||
      _pendingRemovalTimers.isNotEmpty ||
      _inFlightRemovalIds.isNotEmpty;

  int get pendingRemovalCount => _pendingRemovalItems.length;

  bool isItemPendingRemoval(int cartId) =>
      _pendingRemovalTimers.containsKey(cartId) ||
      _inFlightRemovalIds.contains(cartId);

  /// Whether admin has configured global 100% free delivery to all stores.
  bool get isFreeDeliveryToAllStore {
    if (!Get.isRegistered<SplashController>()) return false;
    final admin = Get.find<SplashController>().configModel?.adminFreeDelivery;
    return admin?.status == true && admin?.type == 'free_delivery_to_all_store';
  }

  /// Configured admin free-delivery threshold if active.
  double? get adminFreeDeliveryThreshold {
    if (!Get.isRegistered<SplashController>()) return null;
    final admin = Get.find<SplashController>().configModel?.adminFreeDelivery;
    if (admin?.status == true &&
        admin?.type == 'free_delivery_by_order_amount' &&
        admin?.freeDeliveryOver != null) {
      return admin!.freeDeliveryOver;
    }
    return null;
  }

  void changeQuantity(
    bool isIncrement,
    int cartIndex,
    int? stock,
    int? quantityLimit,
  ) {
    final int oldQuantity = _cartList[cartIndex].quantity!;
    final bool moduleStock = Get.isRegistered<SplashController>()
        ? (Get.find<SplashController>()
                  .configModel
                  ?.moduleConfig
                  ?.module
                  ?.stock ??
              false)
        : false;
    final int newQuantity = cartServiceInterface.decideItemQuantity(
      isIncrement,
      _cartList,
      cartIndex,
      stock,
      quantityLimit,
      moduleStock,
    );
    // Hit a stock / limit boundary — nothing changed (a snackbar was shown).
    if (oldQuantity == newQuantity) return;

    _cartList[cartIndex].quantity = newQuantity;
    calculationCart();
    update();

    final int cartId = _cartList[cartIndex].id!;
    _quantitySyncTimers[cartId]?.cancel();
    _quantitySyncTimers[cartId] = Timer(_quantitySyncDelay, () {
      _quantitySyncTimers.remove(cartId);
      _enqueueQuantitySync(cartId);
    });
  }

  Future<bool> _enqueueQuantitySync(int cartId) {
    final int session = _sessionToken;
    if (!_cartSyncCompleters.containsKey(cartId) ||
        _cartSyncCompleters[cartId]!.isCompleted) {
      _cartSyncCompleters[cartId] = Completer<bool>();
    }
    final Completer<bool> completer = _cartSyncCompleters[cartId]!;

    if (_activeSyncCartIds.contains(cartId)) {
      // A network sync is already in flight for this cart ID.
      // Mark as queued so another sync pass with the latest in-memory state runs
      // sequentially after the in-flight request finishes.
      _queuedSyncCartIds.add(cartId);
      return completer.future;
    }

    _activeSyncCartIds.add(cartId);
    _runSyncLoop(cartId, session);
    return completer.future;
  }

  Future<void> _runSyncLoop(int cartId, int session) async {
    bool allSucceeded = true;
    try {
      while (session == _sessionToken) {
        _queuedSyncCartIds.remove(cartId);
        final bool success = await _executeSingleQuantitySync(cartId, session);
        if (!success) {
          allSucceeded = false;
        }
        // If a new update arrived while the HTTP request was in flight,
        // loop again to commit the latest target state in strict FIFO order!
        if (!_queuedSyncCartIds.contains(cartId) ||
            !allSucceeded ||
            session != _sessionToken) {
          break;
        }
      }
    } catch (_) {
      allSucceeded = false;
    } finally {
      _activeSyncCartIds.remove(cartId);
      _queuedSyncCartIds.remove(cartId);
      final Completer<bool>? completer = _cartSyncCompleters.remove(cartId);
      if (completer != null && !completer.isCompleted) {
        completer.complete(allSucceeded);
      }
    }
  }

  Future<bool> _executeSingleQuantitySync(int cartId, int session) async {
    if (session != _sessionToken) return false;
    final int index = _cartList.indexWhere((CartModel c) => c.id == cartId);
    if (index == -1) return true;

    final CartModel cart = _cartList[index];
    final bool newVariation = Get.isRegistered<SplashController>()
        ? (ModuleHelper.getModuleConfig(cart.item?.moduleType).newVariation ??
              false)
        : false;
    final double discountedPrice = await cartServiceInterface
        .calculateDiscountedPrice(cart, cart.quantity ?? 1, newVariation);
    if (session != _sessionToken) return false;

    if (newVariation && Get.isRegistered<ItemController>()) {
      await Get.find<ItemController>().setExistInCart(
        cart.item,
        null,
        notify: true,
      );
    }
    if (session != _sessionToken) return false;

    return await updateCartQuantityOnline(
      cartId,
      discountedPrice,
      cart.quantity ?? 1,
      storeId: cart.item?.storeId,
    );
  }

  /// Optimistically removes an item from the cart in-memory and gives the user a
  /// window to undo the action. If not undone, the item is deleted from the backend.
  void removeWithUndo(
    int index, {
    Item? item,
    void Function(CartModel cart)? onUndoAvailable,
  }) {
    if (index < 0 || index >= _cartList.length) return;
    final CartModel removedCart = _cartList[index];
    final int? cartId = removedCart.id;
    if (cartId == null) return;

    final int? storeId = removedCart.item?.storeId;

    // Cancel any pending debounced quantity sync for this cart item
    _quantitySyncTimers[cartId]?.cancel();
    _quantitySyncTimers.remove(cartId);
    _queuedSyncCartIds.remove(cartId);

    // Record pending removal
    _pendingRemovalItems[cartId] = removedCart;
    _pendingRemovalIndices[cartId] = index;
    _recentRemovedCartIds.remove(cartId);
    _recentRemovedCartIds.add(cartId);

    // Optimistically remove from list & recalculate totals
    _cartList.removeAt(index);
    calculationCart();
    update();
    if (Get.isRegistered<ItemController>()) {
      Get.find<ItemController>().cartIndexSet();
    }

    _pendingRemovalTimers[cartId]?.cancel();
    _pendingRemovalTimers[cartId] = Timer(
      const Duration(milliseconds: 3500),
      () => _commitRemovalToServer(cartId, item: item, storeId: storeId),
    );

    onUndoAvailable?.call(removedCart);
  }

  Future<bool> _commitRemovalToServer(
    int cartId, {
    Item? item,
    int? storeId,
  }) async {
    final int session = _sessionToken;
    _pendingRemovalTimers[cartId]?.cancel();
    _pendingRemovalTimers.remove(cartId);

    if (!_removalCompleters.containsKey(cartId) ||
        _removalCompleters[cartId]!.isCompleted) {
      _removalCompleters[cartId] = Completer<bool>();
    }
    final Completer<bool> completer = _removalCompleters[cartId]!;

    final CartModel? removedCart = _pendingRemovalItems[cartId];
    final int? originalIndex = _pendingRemovalIndices[cartId];
    if (removedCart == null) {
      if (!completer.isCompleted) completer.complete(true);
      return true;
    }

    bool success = false;
    try {
      _inFlightRemovalIds.add(cartId);
      try {
        success = await removeCartItemOnline(
          cartId,
          item: item ?? removedCart.item,
          storeId: storeId ?? removedCart.item?.storeId,
        );
      } catch (_) {
        success = false;
      } finally {
        _inFlightRemovalIds.remove(cartId);
      }

      if (session != _sessionToken) {
        return false;
      }

      if (success) {
        _pendingRemovalItems.remove(cartId);
        _pendingRemovalIndices.remove(cartId);
        _recentRemovedCartIds.remove(cartId);
        if (Get.isRegistered<ItemController>() &&
            Get.find<ItemController>().item != null) {
          Get.find<ItemController>().cartIndexSet();
        }
      } else {
        // Server deletion failed! Rollback and re-insert item into local cart.
        if (!_cartList.any((CartModel c) => c.id == cartId)) {
          final int insertIndex = (originalIndex ?? 0).clamp(
            0,
            _cartList.length,
          );
          _cartList.insert(insertIndex, removedCart);
          calculationCart();
          update();
          if (Get.isRegistered<ItemController>()) {
            Get.find<ItemController>().cartIndexSet();
          }
        }
        _pendingRemovalItems.remove(cartId);
        _pendingRemovalIndices.remove(cartId);
        _recentRemovedCartIds.remove(cartId);
        if (Get.context != null) {
          try {
            showCustomSnackBar('something_went_wrong'.tr);
          } catch (_) {}
        }
      }
    } finally {
      if (!completer.isCompleted) {
        completer.complete(session == _sessionToken && success);
      }
      _removalCompleters.remove(cartId);
    }
    return success;
  }

  /// Restores a previously removed item to its original location in the cart.
  void undoRemove(int cartId) {
    if (_inFlightRemovalIds.contains(cartId)) {
      // Deletion is already actively running over HTTP; cannot restore locally
      return;
    }
    final Timer? timer = _pendingRemovalTimers.remove(cartId);
    final CartModel? removedCart = _pendingRemovalItems.remove(cartId);
    final int? originalIndex = _pendingRemovalIndices.remove(cartId);
    _recentRemovedCartIds.remove(cartId);

    if (removedCart == null) return;
    timer?.cancel();

    final int insertIndex = (originalIndex ?? 0).clamp(0, _cartList.length);
    _cartList.insert(insertIndex, removedCart);
    calculationCart();
    update();
    if (Get.isRegistered<ItemController>()) {
      Get.find<ItemController>().cartIndexSet();
    }
  }

  void undoLatestRemove() {
    if (_recentRemovedCartIds.isNotEmpty) {
      final int lastId = _recentRemovedCartIds.last;
      undoRemove(lastId);
    }
  }

  /// Flushes all debounced quantity changes and pending removals immediately and awaits their completion.
  /// Returns `true` if all pending updates succeed, or `false` if any update failed.
  Future<bool> flushPendingSyncs() async {
    final int session = _sessionToken;
    final List<Future<bool>> futures = [];

    // 1. Immediately commit any pending removals without waiting for their timer
    final List<int> pendingRemoveIds = _pendingRemovalTimers.keys.toList();
    for (final int cartId in pendingRemoveIds) {
      _pendingRemovalTimers[cartId]?.cancel();
      _pendingRemovalTimers.remove(cartId);
      futures.add(_commitRemovalToServer(cartId));
    }
    // Also await any removals already in flight
    for (final Completer<bool> completer in _removalCompleters.values) {
      if (!completer.isCompleted) {
        futures.add(completer.future);
      }
    }

    // 2. Immediately commit any debounced quantity updates
    final List<int> pendingCartIds = _quantitySyncTimers.keys.toList();
    for (final int cartId in pendingCartIds) {
      _quantitySyncTimers[cartId]?.cancel();
      _quantitySyncTimers.remove(cartId);
      futures.add(_enqueueQuantitySync(cartId));
    }
    // Also await any active or queued syncs currently running
    for (final int cartId in _activeSyncCartIds) {
      final Completer<bool>? completer = _cartSyncCompleters[cartId];
      if (completer != null && !completer.isCompleted) {
        futures.add(completer.future);
      }
    }

    if (futures.isEmpty) {
      return true;
    }

    final List<bool> results = await Future.wait(futures);
    if (session != _sessionToken) return false;
    return results.every((bool success) => success == true);
  }

  /// Clears in-memory cart data and cancels any active timers/syncs (e.g. on logout).
  void resetCartState() {
    _sessionToken++;
    _allCartsGeneration++;
    for (final timer in _quantitySyncTimers.values) {
      timer.cancel();
    }
    _quantitySyncTimers.clear();
    for (final timer in _pendingRemovalTimers.values) {
      timer.cancel();
    }
    _pendingRemovalTimers.clear();
    _pendingRemovalItems.clear();
    _pendingRemovalIndices.clear();
    _recentRemovedCartIds.clear();
    _activeSyncCartIds.clear();
    _queuedSyncCartIds.clear();
    for (final completer in _cartSyncCompleters.values) {
      if (!completer.isCompleted) {
        completer.complete(false);
      }
    }
    _cartSyncCompleters.clear();
    for (final completer in _removalCompleters.values) {
      if (!completer.isCompleted) {
        completer.complete(false);
      }
    }
    _removalCompleters.clear();
    _inFlightRemovalIds.clear();
    _cartList = [];
    _allCartsGroups = null;
    _activeCartScreenStoreId = null;
    _subTotal = 0;
    _itemPrice = 0;
    _itemDiscountPrice = 0;
    _addOns = 0;
    _variationPrice = 0;
    _addOnsList = [];
    _availableList = [];
    _needExtraPackage = false;
    _addCutlery = false;
    _notAvailableIndex = -1;
    _isLoading = false;
    _isAllCartsLoading = false;
    _relatedItemList = null;
    _isRelatedItemLoading = false;
    _selectedRelatedCartItemId = null;
    update();
  }

  Future<void> removeFromCart(int index, {Item? item}) async {
    int cartId = _cartList[index].id!;
    _quantitySyncTimers[cartId]?.cancel();
    _quantitySyncTimers.remove(cartId);
    _pendingRemovalTimers[cartId]?.cancel();
    _pendingRemovalTimers.remove(cartId);
    _pendingRemovalItems.remove(cartId);
    _pendingRemovalIndices.remove(cartId);
    _recentRemovedCartIds.remove(cartId);
    _activeSyncCartIds.remove(cartId);
    _queuedSyncCartIds.remove(cartId);
    _cartSyncCompleters.remove(cartId);
    _inFlightRemovalIds.remove(cartId);
    _removalCompleters.remove(cartId);
    int? storeId = _cartList[index].item?.storeId;
    _cartList.removeAt(index);
    update();
    Get.find<ItemController>().cartIndexSet();
    await removeCartItemOnline(cartId, item: item, storeId: storeId);
    if (Get.find<ItemController>().item != null) {
      Get.find<ItemController>().cartIndexSet();
    }
  }

  Future<void> clearCartList() async {
    for (final timer in _quantitySyncTimers.values) {
      timer.cancel();
    }
    _quantitySyncTimers.clear();
    for (final timer in _pendingRemovalTimers.values) {
      timer.cancel();
    }
    _pendingRemovalTimers.clear();
    _pendingRemovalItems.clear();
    _pendingRemovalIndices.clear();
    _recentRemovedCartIds.clear();
    _activeSyncCartIds.clear();
    _queuedSyncCartIds.clear();
    _cartSyncCompleters.clear();
    _inFlightRemovalIds.clear();
    _removalCompleters.clear();
    final int? storeId = _cartList.isNotEmpty
        ? _cartList[0].item?.storeId
        : null;
    _cartList = [];
    if (storeId != null) {
      _allCartsGroups?.removeWhere((AllCartsModel g) => g.store?.id == storeId);
    }
    update();
    if ((AuthHelper.isLoggedIn() || AuthHelper.isGuestLoggedIn()) &&
        (ModuleHelper.getModule() != null ||
            ModuleHelper.getCacheModule() != null)) {
      if (storeId != null) {
        removeStoreCart(storeId);
      }
    }
  }

  int isExistInCart(
    int? itemID,
    String variationType,
    bool isUpdate,
    int? cartIndex,
  ) {
    return cartServiceInterface.isExistInCart(
      _cartList,
      itemID,
      variationType,
      isUpdate,
      cartIndex,
    );
  }

  bool existAnotherStoreItem(int? storeID, int? moduleId) {
    if (cartServiceInterface.existAnotherStoreItem(
      storeID,
      moduleId,
      _cartList,
    )) {
      return true;
    }
    // Also check the global carts list — _cartList may be empty or stale
    if (_allCartsGroups != null) {
      for (final AllCartsModel group in _allCartsGroups!) {
        if (group.store?.id != storeID && (group.carts?.isNotEmpty ?? false)) {
          return true;
        }
      }
    }
    return false;
  }

  void setCurrentIndex(int index, bool notify) {
    _currentIndex = index;
    if (notify) {
      update();
    }
  }

  Future<bool> addToCartOnline(OnlineCart cart, {int? storeId}) async {
    _isLoading = true;
    bool success = false;
    update();
    List<OnlineCartModel>? onlineCartList = await cartServiceInterface
        .addToCartOnline(cart, storeId: storeId);
    if (onlineCartList != null) {
      _cartList = [];
      _cartList.addAll(
        cartServiceInterface.formatOnlineCartToLocalCart(
          onlineCartModel: onlineCartList,
        ),
      );
      calculationCart();
      success = true;
      if (_relatedItemList != null) {
        final Set<int> cartItemIds = _cartList
            .map((c) => c.item?.id)
            .whereType<int>()
            .toSet();
        _relatedItemList!.removeWhere((item) => cartItemIds.contains(item.id));
      }
      if (_selectedRelatedCartItemId == null && _cartList.isNotEmpty) {
        getRelatedItemList(itemId: _cartList.first.item?.id);
      }
      await getAllCarts(notify: false);
    }
    _isLoading = false;
    update();

    return success;
  }

  Future<bool> updateCartOnline(OnlineCart cart, {int? storeId}) async {
    _isLoading = true;
    bool success = false;
    update();
    List<OnlineCartModel>? onlineCartList = await cartServiceInterface
        .updateCartOnline(cart, storeId: storeId);
    if (onlineCartList != null) {
      _cartList = [];
      _cartList.addAll(
        cartServiceInterface.formatOnlineCartToLocalCart(
          onlineCartModel: onlineCartList,
        ),
      );
      calculationCart();
      success = true;
      await getAllCarts(notify: false);
    }
    _isLoading = false;
    update();

    return success;
  }

  Future<bool> updateCartQuantityOnline(
    int cartId,
    double price,
    int quantity, {
    int? storeId,
  }) async {
    final int session = _sessionToken;
    _isLoading = true;
    update();
    bool success = false;
    try {
      success = await cartServiceInterface.updateCartQuantityOnline(
        cartId,
        price,
        quantity,
        storeId: storeId,
      );
    } catch (_) {
      success = false;
    }
    if (session != _sessionToken) return false;
    // Resync with the server whether the update succeeded or not: on success to
    // reflect the saved state, on failure (e.g. out of stock, or any other
    // rejection) to roll the optimistic local quantity back to the real cart
    // value. The error message itself is surfaced by the API layer.
    await getAllCarts();
    if (session != _sessionToken) return false;
    calculationCart();
    if (success) {
      await Future.delayed(const Duration(milliseconds: 200));
    }
    if (session != _sessionToken) return false;
    _isLoading = false;
    update();
    return success;
  }

  Future<void> getCartDataOnline({int? storeId}) async {
    final int session = _sessionToken;
    if (ModuleHelper.getModule() != null ||
        ModuleHelper.getCacheModule() != null) {
      _isLoading = true;
      // Schedule update after build phase completes to avoid "setState during build" error
      Future.microtask(() => update());

      int? targetStoreId =
          storeId ??
          _activeCartScreenStoreId ??
          _allCartsGroups?.firstOrNull?.store?.id;

      if (targetStoreId == null) {
        await getAllCarts(notify: false);
        if (session != _sessionToken) return;
        targetStoreId =
            _activeCartScreenStoreId ?? _allCartsGroups?.firstOrNull?.store?.id;
      }

      if (targetStoreId == null) {
        _cartList = [];
        calculationCart();
        _isLoading = false;
        update();
        return;
      }

      List<OnlineCartModel>? onlineCartList;
      try {
        onlineCartList = await cartServiceInterface.getCartDataOnline(
          storeId: targetStoreId,
        );
      } catch (_) {
        onlineCartList = null;
      }
      if (session != _sessionToken) return;
      // Assign atomically after the await so no concurrent getAllCarts() call can
      // write into _cartList between the clear and the fill (race that caused duplicates).
      if (onlineCartList != null) {
        _cartList = cartServiceInterface.formatOnlineCartToLocalCart(
          onlineCartModel: onlineCartList,
        );
        calculationCart();
      } else {
        _cartList = [];
      }
      _isLoading = false;
      update();
    }
  }

  Future<bool> removeCartItemOnline(
    int cartId, {
    Item? item,
    int? storeId,
  }) async {
    final int session = _sessionToken;
    _isLoading = true;
    update();
    bool success = false;
    try {
      success = await cartServiceInterface.removeCartItemOnline(
        cartId,
        storeId: storeId,
      );
    } catch (_) {
      success = false;
    }
    if (session != _sessionToken) return false;
    if (success) {
      await getCartDataOnline(storeId: storeId);
      if (session != _sessionToken) return false;
      // If removing the last item emptied this store's cart, drop it from the global list too
      if (_cartList.isEmpty && storeId != null) {
        _allCartsGroups?.removeWhere(
          (AllCartsModel g) => g.store?.id == storeId,
        );
      }
      if (_cartList.isEmpty) {
        _relatedItemList = [];
        _selectedRelatedCartItemId = null;
      } else if (!_cartList.any(
        (c) => c.item?.id == _selectedRelatedCartItemId,
      )) {
        getRelatedItemList(itemId: _cartList.first.item?.id, reload: true);
      }
      if (item != null && Get.isRegistered<ItemController>()) {
        Get.find<ItemController>().setExistInCart(item, null, notify: true);
      }
    }
    _isLoading = false;
    update();
    return success;
  }

  Future<bool> clearCartOnline() async {
    final int session = _sessionToken;
    for (final timer in _quantitySyncTimers.values) {
      timer.cancel();
    }
    _quantitySyncTimers.clear();
    for (final timer in _pendingRemovalTimers.values) {
      timer.cancel();
    }
    _pendingRemovalTimers.clear();
    _pendingRemovalItems.clear();
    _pendingRemovalIndices.clear();
    _recentRemovedCartIds.clear();
    _isLoading = true;
    update();
    bool success = false;
    try {
      success = await cartServiceInterface.clearCartOnline();
    } catch (_) {
      success = false;
    }
    if (session != _sessionToken) return false;
    if (success) {
      _relatedItemList = [];
      _selectedRelatedCartItemId = null;
      await getAllCarts();
    }
    if (session != _sessionToken) return false;
    _isLoading = false;
    update();
    return success;
  }

  int cartQuantity(int itemId) {
    return cartServiceInterface.cartQuantity(itemId, _cartList);
  }

  String cartVariant(int itemId) {
    return cartServiceInterface.cartVariant(itemId, _cartList);
  }

  void setExpanded(bool setExpand) {
    _isExpanded = setExpand;
    update();
  }

  void setAllCartsLoading({bool notify = true}) {
    _isAllCartsLoading = true;
    _isLoading = true;
    if (notify) {
      update();
    }
  }

  Future<void> getAllCarts({bool notify = true}) async {
    final int generation = ++_allCartsGeneration;
    final int session = _sessionToken;
    _isAllCartsLoading = true;
    _isLoading = true;
    if (notify) {
      update();
    }
    List<AllCartsModel>? result;
    try {
      result = await cartServiceInterface.getAllCarts();
    } catch (_) {
      result = null;
    }
    // A newer getAllCarts() call was made while this one was in flight or session reset —
    // discard this response so it cannot overwrite fresher data with stale results.
    if (generation != _allCartsGeneration || session != _sessionToken) return;
    _allCartsGroups = result;
    if (_allCartsGroups != null) {
      final int? currentModuleId =
          ModuleHelper.getModule()?.id ?? ModuleHelper.getCacheModule()?.id;
      if (currentModuleId != null) {
        final List<OnlineCartModel> flat = <OnlineCartModel>[];
        for (AllCartsModel group in _allCartsGroups!) {
          for (OnlineCartModel om
              in (group.onlineCarts ?? <OnlineCartModel>[])) {
            if (om.moduleId == currentModuleId) {
              // Scope to the active cart screen store when one is open; otherwise include all.
              if (_activeCartScreenStoreId == null ||
                  group.store?.id == _activeCartScreenStoreId) {
                flat.add(om);
              }
            }
          }
        }
        // Snapshot optimistic quantities of carts still awaiting a debounced
        // sync, actively syncing, or queued for sync, so this refresh doesn't snap
        // their numbers back to an older server value before all updates commit.
        final Map<int, int> pendingQuantities = {};
        for (final CartModel c in _cartList) {
          if (c.id != null &&
              c.quantity != null &&
              (_quantitySyncTimers.containsKey(c.id) ||
                  _activeSyncCartIds.contains(c.id) ||
                  _queuedSyncCartIds.contains(c.id))) {
            pendingQuantities[c.id!] = c.quantity!;
          }
        }
        _cartList = [];
        _cartList = cartServiceInterface.formatOnlineCartToLocalCart(
          onlineCartModel: flat,
        );
        if (pendingQuantities.isNotEmpty) {
          for (final CartModel c in _cartList) {
            final int? pendingQty = c.id != null
                ? pendingQuantities[c.id]
                : null;
            if (pendingQty != null) c.quantity = pendingQty;
          }
        }
        calculationCart();
      }
    }
    _isAllCartsLoading = false;
    _isLoading = false;
    update();
  }

  AllCartsModel? getCartsForStore(int storeId) {
    if (_allCartsGroups == null) return null;
    try {
      return _allCartsGroups!.firstWhere(
        (AllCartsModel g) =>
            g.store?.id == storeId && (g.carts?.isNotEmpty ?? false),
      );
    } catch (_) {
      return null;
    }
  }

  List<AllCartsModel> getCartsForModule(int? moduleId) {
    if (moduleId == null || _allCartsGroups == null) {
      return <AllCartsModel>[];
    }
    return _allCartsGroups!.where((AllCartsModel group) {
      final List<CartModel> carts = group.carts ?? <CartModel>[];
      return carts.any((CartModel c) => c.item?.moduleId == moduleId);
    }).toList();
  }

  Future<bool> removeStoreCart(int storeId) async {
    bool success = await cartServiceInterface.removeStoreCart(storeId);
    if (success) {
      _allCartsGroups?.removeWhere((AllCartsModel g) => g.store?.id == storeId);
      _cartList.removeWhere((CartModel c) => c.item?.storeId == storeId);
      update();
    }
    return success;
  }

  Future<void> getRelatedItemList({int? itemId, bool reload = false}) async {
    int? targetItemId = itemId ?? _selectedRelatedCartItemId;
    if (targetItemId == null && _cartList.isNotEmpty) {
      targetItemId = _cartList.first.item?.id;
    }

    if (targetItemId == null) {
      _relatedItemList = [];
      _selectedRelatedCartItemId = null;
      _isRelatedItemLoading = false;
      update();
      return;
    }

    if (!reload &&
        _selectedRelatedCartItemId == targetItemId &&
        _relatedItemList != null &&
        !_isRelatedItemLoading) {
      return;
    }

    _selectedRelatedCartItemId = targetItemId;
    _isRelatedItemLoading = true;
    update();

    try {
      final List<Item>? items = await cartServiceInterface.getRelatedItemList(
        targetItemId,
      );
      if (items != null) {
        final Set<int> cartItemIds = _cartList
            .map((c) => c.item?.id)
            .whereType<int>()
            .toSet();
        _relatedItemList = items
            .where((item) => item.id != null && !cartItemIds.contains(item.id))
            .toList();
      } else {
        _relatedItemList = [];
      }
    } catch (_) {
      _relatedItemList = [];
    } finally {
      _isRelatedItemLoading = false;
      update();
    }
  }

  void setSelectedRelatedCartItemId(int? itemId) {
    if (itemId != null && _selectedRelatedCartItemId != itemId) {
      getRelatedItemList(itemId: itemId, reload: true);
    }
  }
}
