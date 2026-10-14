import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/models/config_model.dart';
import 'package:sixam_mart/common/models/module_model.dart';
import 'package:sixam_mart/features/cart/controllers/cart_controller.dart';
import 'package:sixam_mart/features/cart/domain/models/all_carts_model.dart';
import 'package:sixam_mart/features/cart/domain/models/cart_model.dart';
import 'package:sixam_mart/features/cart/domain/models/online_cart_model.dart';
import 'package:sixam_mart/features/cart/domain/services/cart_service_interface.dart';
import 'package:sixam_mart/features/checkout/domain/models/place_order_body_model.dart';
import 'package:sixam_mart/features/item/domain/models/item_model.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/features/splash/domain/services/splash_service_interface.dart';

class MockCartService implements CartServiceInterface {
  final List<OnlineCartModel> onlineCarts = [];
  bool shouldFailUpdate = false;
  bool shouldFailRemove = false;
  bool shouldFailAddToCart = false;
  int updateQuantityCallCount = 0;
  int removeCallCount = 0;
  int? lastUpdatedCartId;
  int? lastUpdatedQuantity;
  final Map<int, int> updatedQuantities = {};
  final List<int> updateQuantityHistory = [];
  final List<int> updateQuantityCartIdHistory = [];
  Completer<bool>? updateQuantityCompleter;
  Completer<bool>? removeCartCompleter;
  Completer<List<AllCartsModel>?>? getAllCartsCompleter;

  @override
  int availableSelectedIndex(int selectedIndex, int index) => selectedIndex;

  @override
  ModuleModel? forcefullySetModule(
    ModuleModel? module,
    List<ModuleModel>? moduleList,
    int moduleId,
  ) => module;

  @override
  List<AddOns> prepareAddonList(CartModel cartModel) => [];

  @override
  double calculateAddonPrice(
    double addOns,
    List<AddOns> addOnList,
    CartModel cartModel,
  ) => 0.0;

  @override
  double calculateVariationPrice(
    bool isFoodVariation,
    CartModel cartModel,
    double? discount,
    String? discountType,
    double variationPrice,
  ) => 0.0;

  @override
  double calculateVariationWithoutDiscountPrice(
    bool isFoodVariation,
    CartModel cartModel,
    double variationWithoutDiscount,
  ) => 0.0;

  @override
  bool checkVariation(bool isFoodVariation, CartModel cartModel) => false;

  @override
  Future<void> addSharedPrefCartList(List<CartModel> cartProductList) async {}

  @override
  int? getCartId(int cartIndex, List<CartModel> cartList) =>
      cartList[cartIndex].id;

  @override
  int decideItemQuantity(
    bool isIncrement,
    List<CartModel> cartList,
    int cartIndex,
    int? stock,
    int? quantityLimit,
    bool moduleStock,
  ) {
    final int current = cartList[cartIndex].quantity ?? 1;
    return isIncrement ? current + 1 : (current > 1 ? current - 1 : 1);
  }

  @override
  Future<double> calculateDiscountedPrice(
    CartModel cartModel,
    int quantity,
    bool isFoodVariation,
  ) async {
    return (cartModel.price ?? 50.0) * quantity;
  }

  @override
  Future<bool> updateCartQuantityOnline(
    int cartId,
    double price,
    int quantity, {
    int? storeId,
  }) async {
    updateQuantityCallCount++;
    lastUpdatedCartId = cartId;
    lastUpdatedQuantity = quantity;
    updatedQuantities[cartId] = quantity;
    updateQuantityHistory.add(quantity);
    updateQuantityCartIdHistory.add(cartId);
    if (updateQuantityCompleter != null) {
      final bool res = await updateQuantityCompleter!.future;
      if (!res) return false;
    }
    if (shouldFailUpdate) return false;
    return true;
  }

  @override
  Future<List<OnlineCartModel>?> getCartDataOnline({int? storeId}) async =>
      onlineCarts;

  @override
  List<CartModel> formatOnlineCartToLocalCart({
    required List<OnlineCartModel> onlineCartModel,
  }) {
    return onlineCartModel.map((OnlineCartModel om) {
      return CartModel(
        om.id,
        om.price,
        om.price ?? 0.0,
        [],
        [],
        0.0,
        om.quantity,
        [],
        [],
        false,
        100,
        Item(
          id: om.itemId,
          name: 'Item ${om.itemId}',
          price: om.price,
          discount: 0,
          discountType: 'amount',
          moduleType: 'grocery',
          storeId: 10,
          moduleId: om.moduleId ?? 2,
          scheduleOrder: false,
        ),
        10,
      );
    }).toList();
  }

  @override
  Future<List<OnlineCartModel>?> updateCartOnline(
    OnlineCart cart, {
    int? storeId,
  }) async => onlineCarts;

  @override
  Future<List<OnlineCartModel>?> addToCartOnline(
    OnlineCart cart, {
    int? storeId,
  }) async {
    if (shouldFailAddToCart) return null;
    return onlineCarts;
  }

  @override
  Future<bool> removeCartItemOnline(int cartId, {int? storeId}) async {
    removeCallCount++;
    if (removeCartCompleter != null) {
      final bool res = await removeCartCompleter!.future;
      if (!res) return false;
    }
    if (shouldFailRemove) return false;
    return true;
  }

  @override
  Future<bool> clearCartOnline() async => true;

  @override
  int isExistInCart(
    List<CartModel> cartList,
    int? itemID,
    String variationType,
    bool isUpdate,
    int? cartIndex,
  ) => -1;

  @override
  bool existAnotherStoreItem(
    int? storeID,
    int? moduleId,
    List<CartModel> cartList,
  ) => false;

  @override
  int cartQuantity(int itemId, List<CartModel> cartList) => 0;

  @override
  String cartVariant(int itemId, List<CartModel> cartList) => '';

  @override
  Future<List<AllCartsModel>?> getAllCarts() async {
    if (getAllCartsCompleter != null) {
      return await getAllCartsCompleter!.future;
    }
    return [];
  }

  @override
  Future<bool> removeStoreCart(int storeId) async => true;

  List<Item> mockRelatedItems = [];
  int? lastRequestedRelatedItemId;

  @override
  Future<List<Item>?> getRelatedItemList(int itemId) async {
    lastRequestedRelatedItemId = itemId;
    return mockRelatedItems;
  }
}

class FakeSplashService implements SplashServiceInterface {
  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

class FakeSplashController extends SplashController {
  ConfigModel? customConfig;
  FakeSplashController({this.customConfig})
    : super(splashServiceInterface: FakeSplashService());

  @override
  ConfigModel? get configModel => customConfig;
}

CartModel createTestCartModel({
  required int id,
  required int itemId,
  required double price,
  int quantity = 1,
}) {
  return CartModel(
    id,
    price,
    price,
    [],
    [],
    0.0,
    quantity,
    [],
    [],
    false,
    100,
    Item(
      id: itemId,
      name: 'Item $itemId',
      price: price,
      discount: 0,
      discountType: 'amount',
      moduleType: 'grocery',
      storeId: 10,
      moduleId: 2,
      scheduleOrder: false,
    ),
    10,
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late MockCartService mockService;
  late CartController cartController;

  setUp(() {
    Get.reset();
    mockService = MockCartService();
    cartController = CartController(cartServiceInterface: mockService);
    Get.put<CartController>(cartController);
  });

  tearDown(() {
    cartController.resetCartState();
    Get.reset();
  });

  group('Cart Integrity & Synchronization Tests', () {
    test('Initial cart state has no pending syncs or items', () {
      expect(cartController.cartList.isEmpty, isTrue);
      expect(cartController.hasPendingQuantitySyncs, isFalse);
      expect(cartController.subTotal, equals(0.0));
    });

    test(
      'Rapid quantity changes are debounced and flushPendingSyncs commits latest value',
      () async {
        final cartItem = createTestCartModel(
          id: 101,
          itemId: 1,
          price: 100.0,
          quantity: 1,
        );
        cartController.cartList.add(cartItem);
        cartController.calculationCart();

        // Trigger quantity increment
        cartController.changeQuantity(true, 0, 10, 10);
        expect(cartController.cartList[0].quantity, equals(2));
        expect(cartController.hasPendingQuantitySyncs, isTrue);

        // Trigger second increment rapidly
        cartController.changeQuantity(true, 0, 10, 10);
        expect(cartController.cartList[0].quantity, equals(3));
        expect(cartController.hasPendingQuantitySyncs, isTrue);

        // Service has not been called yet due to 600ms debounce
        expect(mockService.updateQuantityCallCount, equals(0));

        // Flush pending syncs immediately
        final bool flushResult = await cartController.flushPendingSyncs();

        expect(flushResult, isTrue);
        expect(mockService.updateQuantityCallCount, equals(1));
        expect(mockService.lastUpdatedCartId, equals(101));
        expect(mockService.lastUpdatedQuantity, equals(3));
        expect(cartController.hasPendingQuantitySyncs, isFalse);
      },
    );

    test(
      'Rapid changes across multiple distinct items flush in parallel',
      () async {
        final item1 = createTestCartModel(
          id: 101,
          itemId: 1,
          price: 50.0,
          quantity: 1,
        );
        final item2 = createTestCartModel(
          id: 102,
          itemId: 2,
          price: 80.0,
          quantity: 1,
        );
        cartController.cartList.addAll([item1, item2]);
        cartController.calculationCart();

        cartController.changeQuantity(true, 0, 10, 10);
        cartController.changeQuantity(true, 1, 10, 10);
        expect(cartController.hasPendingQuantitySyncs, isTrue);

        final bool flushResult = await cartController.flushPendingSyncs();

        expect(flushResult, isTrue);
        expect(mockService.updateQuantityCallCount, equals(2));
        expect(mockService.updatedQuantities[101], equals(2));
        expect(mockService.updatedQuantities[102], equals(2));
        expect(cartController.hasPendingQuantitySyncs, isFalse);
      },
    );

    test(
      'Sync failure during flushPendingSyncs returns false to block checkout navigation',
      () async {
        mockService.shouldFailUpdate = true;
        final cartItem = createTestCartModel(
          id: 202,
          itemId: 2,
          price: 50.0,
          quantity: 1,
        );
        cartController.cartList.add(cartItem);
        cartController.calculationCart();

        cartController.changeQuantity(true, 0, 10, 10);
        expect(cartController.hasPendingQuantitySyncs, isTrue);

        final bool flushResult = await cartController.flushPendingSyncs();

        expect(
          flushResult,
          isFalse,
          reason: 'flushPendingSyncs must return false when backend sync fails',
        );
      },
    );

    test(
      'removeWithUndo immediately removes item in memory and undoRemove restores it',
      () {
        final item1 = createTestCartModel(
          id: 301,
          itemId: 1,
          price: 50.0,
          quantity: 1,
        );
        final item2 = createTestCartModel(
          id: 302,
          itemId: 2,
          price: 80.0,
          quantity: 1,
        );
        cartController.cartList.addAll([item1, item2]);
        cartController.calculationCart();

        expect(cartController.cartList.length, equals(2));
        expect(cartController.subTotal, equals(130.0));

        CartModel? undoCartCaptured;
        cartController.removeWithUndo(
          0,
          item: item1.item,
          onUndoAvailable: (cart) {
            undoCartCaptured = cart;
          },
        );

        // Optimistically removed
        expect(cartController.cartList.length, equals(1));
        expect(cartController.cartList.first.id, equals(302));
        expect(cartController.subTotal, equals(80.0));
        expect(undoCartCaptured?.id, equals(301));
        expect(
          mockService.removeCallCount,
          equals(0),
          reason: 'Server call deferred during undo window',
        );

        // Now undo removal
        cartController.undoRemove(301);

        // Restored at original index 0
        expect(cartController.cartList.length, equals(2));
        expect(cartController.cartList[0].id, equals(301));
        expect(cartController.cartList[1].id, equals(302));
        expect(cartController.subTotal, equals(130.0));
        expect(mockService.removeCallCount, equals(0));
      },
    );

    test(
      'flushPendingSyncs flushes and commits pending undo removal before checkout',
      () async {
        final item1 = createTestCartModel(
          id: 401,
          itemId: 1,
          price: 40.0,
          quantity: 1,
        );
        cartController.cartList.add(item1);
        cartController.calculationCart();

        cartController.removeWithUndo(0, item: item1.item);
        expect(cartController.cartList.isEmpty, isTrue);
        expect(mockService.removeCallCount, equals(0));

        // User taps checkout while undo timer is active
        final bool flushResult = await cartController.flushPendingSyncs();

        expect(flushResult, isTrue);
        expect(
          mockService.removeCallCount,
          equals(1),
          reason:
              'flushPendingSyncs must immediately commit deletion to backend',
        );
      },
    );

    test(
      'resetCartState clears all items, pending syncs, and pending removals',
      () {
        final item1 = createTestCartModel(
          id: 501,
          itemId: 1,
          price: 90.0,
          quantity: 1,
        );
        cartController.cartList.add(item1);
        cartController.calculationCart();

        cartController.changeQuantity(true, 0, 10, 10);
        expect(cartController.hasPendingQuantitySyncs, isTrue);

        cartController.resetCartState();

        expect(cartController.cartList.isEmpty, isTrue);
        expect(cartController.subTotal, equals(0.0));
        expect(cartController.hasPendingQuantitySyncs, isFalse);
      },
    );

    test(
      'adminFreeDeliveryThreshold returns configured threshold when enabled and null when disabled',
      () {
        // 1. Without SplashController registered
        expect(cartController.adminFreeDeliveryThreshold, isNull);

        // 2. With SplashController and enabled config
        final fakeSplash = FakeSplashController(
          customConfig: ConfigModel(
            adminFreeDelivery: AdminFreeDelivery(
              status: true,
              type: 'free_delivery_by_order_amount',
              freeDeliveryOver: 249.0,
            ),
          ),
        );
        Get.put<SplashController>(fakeSplash);

        expect(cartController.adminFreeDeliveryThreshold, equals(249.0));

        // 3. With status == false
        fakeSplash.customConfig = ConfigModel(
          adminFreeDelivery: AdminFreeDelivery(
            status: false,
            type: 'free_delivery_by_order_amount',
            freeDeliveryOver: 249.0,
          ),
        );
        expect(cartController.adminFreeDeliveryThreshold, isNull);

        // 4. With different type
        fakeSplash.customConfig = ConfigModel(
          adminFreeDelivery: AdminFreeDelivery(
            status: true,
            type: 'other_type',
            freeDeliveryOver: 249.0,
          ),
        );
        expect(cartController.adminFreeDeliveryThreshold, isNull);
      },
    );

    test(
      'An older quantity request completing after a newer update commits in strict FIFO order',
      () async {
        final item = createTestCartModel(
          id: 101,
          itemId: 1,
          price: 50.0,
          quantity: 1,
        );
        cartController.cartList.add(item);
        cartController.calculationCart();

        // Hold first update in flight
        mockService.updateQuantityCompleter = Completer<bool>();

        // Trigger first change (qty 1 -> 2)
        cartController.changeQuantity(true, 0, 10, 10);
        expect(cartController.cartList[0].quantity, equals(2));

        // Start flush which immediately initiates Request 1 (qty 2)
        final Future<bool> firstFlush = cartController.flushPendingSyncs();
        await Future.delayed(Duration.zero);
        expect(mockService.updateQuantityCallCount, equals(1));
        expect(mockService.lastUpdatedQuantity, equals(2));

        // While Request 1 is still in flight, user taps again (qty 2 -> 3)
        cartController.changeQuantity(true, 0, 10, 10);
        expect(cartController.cartList[0].quantity, equals(3));

        // Call flush again (or proceed to checkout)
        final Future<bool> secondFlush = cartController.flushPendingSyncs();

        // Release Request 1
        mockService.updateQuantityCompleter!.complete(true);
        mockService.updateQuantityCompleter = null;

        final bool result1 = await firstFlush;
        final bool result2 = await secondFlush;

        expect(result1, isTrue);
        expect(result2, isTrue);
        // Verify both updates executed in strict FIFO sequence: [2, 3]
        expect(mockService.updateQuantityHistory, equals([2, 3]));
        expect(mockService.lastUpdatedQuantity, equals(3));
        expect(cartController.cartList[0].quantity, equals(3));
      },
    );

    test(
      'flushPendingSyncs() while request is already in flight awaits its completion',
      () async {
        final item = createTestCartModel(
          id: 102,
          itemId: 2,
          price: 60.0,
          quantity: 1,
        );
        cartController.cartList.add(item);
        cartController.calculationCart();

        mockService.updateQuantityCompleter = Completer<bool>();
        cartController.changeQuantity(true, 0, 10, 10);

        final Future<bool> flushFuture = cartController.flushPendingSyncs();
        expect(cartController.hasPendingQuantitySyncs, isTrue);

        // Complete the in-flight request
        mockService.updateQuantityCompleter!.complete(true);
        final bool flushResult = await flushFuture;

        expect(flushResult, isTrue);
        expect(cartController.hasPendingQuantitySyncs, isFalse);
      },
    );

    test(
      'Failed removal after undo timer expires rolls back item locally to preserve consistency',
      () async {
        final item = createTestCartModel(
          id: 201,
          itemId: 10,
          price: 75.0,
          quantity: 1,
        );
        cartController.cartList.add(item);
        cartController.calculationCart();
        expect(cartController.subTotal, equals(75.0));

        cartController.removeWithUndo(0, item: item.item);
        expect(cartController.cartList.isEmpty, isTrue);
        expect(cartController.subTotal, equals(0.0));

        // Simulate server failure on delete
        mockService.shouldFailRemove = true;

        // Flush immediately to trigger removal commit
        final bool flushResult = await cartController.flushPendingSyncs();

        expect(flushResult, isFalse, reason: 'Flush must report failure');
        // Item must be rolled back to cartList!
        expect(cartController.cartList.length, equals(1));
        expect(cartController.cartList[0].id, equals(201));
        expect(cartController.subTotal, equals(75.0));
      },
    );

    test(
      'Undo while deletion is in flight is prevented to avoid server desynchronization',
      () async {
        final item = createTestCartModel(
          id: 202,
          itemId: 11,
          price: 85.0,
          quantity: 1,
        );
        cartController.cartList.add(item);
        cartController.calculationCart();

        mockService.removeCartCompleter = Completer<bool>();
        cartController.removeWithUndo(0, item: item.item);
        expect(cartController.cartList.isEmpty, isTrue);

        // Initiate deletion over HTTP
        final Future<bool> flushFuture = cartController.flushPendingSyncs();

        // While in flight, user tries to undo
        cartController.undoRemove(202);
        expect(
          cartController.cartList.isEmpty,
          isTrue,
          reason:
              'Item cannot be locally restored while server delete is running',
        );

        // Complete server deletion
        mockService.removeCartCompleter!.complete(true);
        final bool flushResult = await flushFuture;

        expect(flushResult, isTrue);
        expect(cartController.cartList.isEmpty, isTrue);
      },
    );

    test(
      'Multiple removals and their Undo actions restore correct items and subtotal',
      () {
        final item1 = createTestCartModel(id: 301, itemId: 1, price: 40.0);
        final item2 = createTestCartModel(id: 302, itemId: 2, price: 60.0);
        cartController.cartList.addAll([item1, item2]);
        cartController.calculationCart();
        expect(cartController.subTotal, equals(100.0));

        // Remove item1, then remove item2
        cartController.removeWithUndo(0, item: item1.item);
        expect(cartController.cartList.length, equals(1));
        expect(cartController.subTotal, equals(60.0));

        cartController.removeWithUndo(0, item: item2.item);
        expect(cartController.cartList.isEmpty, isTrue);
        expect(cartController.subTotal, equals(0.0));

        // Undo most recent removal (item2)
        cartController.undoLatestRemove();
        expect(cartController.cartList.length, equals(1));
        expect(cartController.cartList[0].id, equals(302));
        expect(cartController.subTotal, equals(60.0));

        // Undo previous removal (item1)
        cartController.undoLatestRemove();
        expect(cartController.cartList.length, equals(2));
        expect(cartController.subTotal, equals(100.0));
      },
    );

    test(
      'Logout while getAllCarts() is awaiting a response discards zombie response',
      () async {
        mockService.getAllCartsCompleter = Completer<List<AllCartsModel>?>();

        final Future<void> fetchFuture = cartController.getAllCarts();
        expect(cartController.isLoading, isTrue);

        // User logs out, resetting cart state
        cartController.resetCartState();
        expect(cartController.cartList.isEmpty, isTrue);

        // Server responds after logout
        final zombieGroup = AllCartsModel(
          store: AllCartsStore(id: 10, name: 'Store 10'),
          onlineCarts: [
            OnlineCartModel(
              id: 999,
              itemId: 1,
              price: 50.0,
              quantity: 1,
              moduleId: 2,
            ),
          ],
        );
        mockService.getAllCartsCompleter!.complete([zombieGroup]);
        await fetchFuture;

        expect(
          cartController.cartList.isEmpty,
          isTrue,
          reason: 'Zombie response post-logout must be discarded',
        );
        expect(cartController.allCartsGroups, isNull);
      },
    );

    test(
      'A previous-session request completing after new session starts cannot mutate new session',
      () async {
        final item = createTestCartModel(id: 401, itemId: 1, price: 50.0);
        cartController.cartList.add(item);
        cartController.calculationCart();

        mockService.updateQuantityCompleter = Completer<bool>();
        cartController.changeQuantity(true, 0, 10, 10);
        final Future<bool> syncFuture = cartController.flushPendingSyncs();

        // User logs out and starts new session
        cartController.resetCartState();
        expect(cartController.cartList.isEmpty, isTrue);

        // Old request finishes
        mockService.updateQuantityCompleter!.complete(true);
        await syncFuture;

        expect(
          cartController.cartList.isEmpty,
          isTrue,
          reason: 'Old session completion must not mutate fresh session',
        );
      },
    );

    test(
      'isFreeDeliveryToAllStore returns true when admin configured free_delivery_to_all_store',
      () {
        final fakeSplash = FakeSplashController(
          customConfig: ConfigModel(
            adminFreeDelivery: AdminFreeDelivery(
              status: true,
              type: 'free_delivery_to_all_store',
            ),
          ),
        );
        Get.put<SplashController>(fakeSplash);

        expect(cartController.isFreeDeliveryToAllStore, isTrue);
        expect(cartController.adminFreeDeliveryThreshold, isNull);

        // Change to false status
        fakeSplash.customConfig = ConfigModel(
          adminFreeDelivery: AdminFreeDelivery(
            status: false,
            type: 'free_delivery_to_all_store',
          ),
        );
        expect(cartController.isFreeDeliveryToAllStore, isFalse);
      },
    );

    test(
      'Checkout blocked after synchronization failure or deletion failure',
      () async {
        final item = createTestCartModel(id: 501, itemId: 1, price: 30.0);
        cartController.cartList.add(item);
        cartController.calculationCart();

        mockService.shouldFailUpdate = true;
        cartController.changeQuantity(true, 0, 10, 10);
        final bool flushResult = await cartController.flushPendingSyncs();
        expect(flushResult, isFalse);

        mockService.shouldFailUpdate = false;
        mockService.shouldFailRemove = true;
        cartController.removeWithUndo(0, item: item.item);
        final bool removeFlushResult = await cartController.flushPendingSyncs();
        expect(removeFlushResult, isFalse);
      },
    );

    test(
      'Repeated rapid checkout flush calls are guarded and complete safely without duplicate sync loops',
      () async {
        final item = createTestCartModel(id: 601, itemId: 1, price: 40.0);
        cartController.cartList.add(item);
        cartController.calculationCart();

        mockService.updateQuantityCompleter = Completer<bool>();
        cartController.changeQuantity(true, 0, 10, 10);

        // Simultaneous calls to flushPendingSyncs simulating double-click / rapid interaction
        final Future<bool> firstCall = cartController.flushPendingSyncs();
        final Future<bool> secondCall = cartController.flushPendingSyncs();

        await Future.delayed(Duration.zero);
        expect(
          mockService.updateQuantityCallCount,
          equals(1),
          reason: 'Only one active sync loop runs for the same cartId',
        );

        mockService.updateQuantityCompleter!.complete(true);
        final bool res1 = await firstCall;
        final bool res2 = await secondCall;

        expect(res1, isTrue);
        expect(res2, isTrue);
        expect(mockService.updateQuantityCallCount, equals(1));
      },
    );

    test(
      'Quick-add server failure does not perform local-only insertion into cartList',
      () async {
        expect(cartController.cartList.isEmpty, isTrue);
        mockService.shouldFailAddToCart = true;

        final OnlineCart onlineCart = OnlineCart(
          null,
          101,
          null,
          '100',
          '',
          null,
          null,
          1,
          [],
          [],
          [],
          'Item',
        );

        final bool success = await cartController.addToCartOnline(onlineCart);
        expect(success, isFalse);
        expect(
          cartController.cartList.isEmpty,
          isTrue,
          reason:
              'Failed server add must never insert item into local cart memory',
        );
      },
    );

    test(
      'getRelatedItemList sets selectedRelatedCartItemId and populates relatedItemList excluding items already in cart',
      () async {
        final CartModel item1 = createTestCartModel(
          id: 1,
          itemId: 101,
          price: 50.0,
        );
        final CartModel item2 = createTestCartModel(
          id: 2,
          itemId: 102,
          price: 30.0,
        );
        cartController.cartList.addAll([item1, item2]);

        mockService.mockRelatedItems = [
          Item(id: 102, name: 'Item 102 (Already In Cart)'),
          Item(id: 201, name: 'Related Item 201'),
          Item(id: 202, name: 'Related Item 202'),
        ];

        await cartController.getRelatedItemList(itemId: 101);

        expect(cartController.selectedRelatedCartItemId, equals(101));
        expect(mockService.lastRequestedRelatedItemId, equals(101));
        expect(cartController.relatedItemList, isNotNull);
        expect(cartController.relatedItemList!.length, equals(2));
        expect(
          cartController.relatedItemList!.any((i) => i.id == 102),
          isFalse,
        );
        expect(cartController.relatedItemList!.any((i) => i.id == 201), isTrue);
        expect(cartController.relatedItemList!.any((i) => i.id == 202), isTrue);
      },
    );

    test(
      'setSelectedRelatedCartItemId switches selected item and re-fetches related items',
      () async {
        final CartModel item1 = createTestCartModel(
          id: 1,
          itemId: 101,
          price: 50.0,
        );
        final CartModel item2 = createTestCartModel(
          id: 2,
          itemId: 102,
          price: 30.0,
        );
        cartController.cartList.addAll([item1, item2]);

        mockService.mockRelatedItems = [
          Item(id: 201, name: 'Related Item 201'),
        ];
        await cartController.getRelatedItemList(itemId: 101);
        expect(cartController.selectedRelatedCartItemId, equals(101));

        mockService.mockRelatedItems = [
          Item(id: 301, name: 'Related Item 301 for Item 102'),
        ];
        cartController.setSelectedRelatedCartItemId(102);

        await Future.delayed(const Duration(milliseconds: 50));

        expect(cartController.selectedRelatedCartItemId, equals(102));
        expect(mockService.lastRequestedRelatedItemId, equals(102));
        expect(cartController.relatedItemList!.length, equals(1));
        expect(cartController.relatedItemList!.first.id, equals(301));
      },
    );

    test(
      'addToCartOnline removes newly added item from relatedItemList',
      () async {
        final CartModel item1 = createTestCartModel(
          id: 1,
          itemId: 101,
          price: 50.0,
        );
        cartController.cartList.add(item1);

        mockService.mockRelatedItems = [
          Item(id: 201, name: 'Related Item 201'),
          Item(id: 202, name: 'Related Item 202'),
        ];
        await cartController.getRelatedItemList(itemId: 101);
        expect(cartController.relatedItemList!.length, equals(2));

        mockService.onlineCarts.clear();
        mockService.onlineCarts.addAll([
          OnlineCartModel(
            id: 1,
            itemId: 101,
            price: 50.0,
            quantity: 1,
            moduleId: 2,
          ),
          OnlineCartModel(
            id: 2,
            itemId: 201,
            price: 40.0,
            quantity: 1,
            moduleId: 2,
          ),
        ]);

        final OnlineCart addCart = OnlineCart(
          null,
          201,
          null,
          '40',
          '',
          null,
          null,
          1,
          [],
          [],
          [],
          'Item 201',
        );

        final bool success = await cartController.addToCartOnline(addCart);
        expect(success, isTrue);
        expect(cartController.relatedItemList!.length, equals(1));
        expect(
          cartController.relatedItemList!.any((i) => i.id == 201),
          isFalse,
        );
        expect(cartController.relatedItemList!.first.id, equals(202));
      },
    );

    test(
      'resetCartState resets relatedItemList, selectedRelatedCartItemId, and isRelatedItemLoading',
      () async {
        final CartModel item1 = createTestCartModel(
          id: 1,
          itemId: 101,
          price: 50.0,
        );
        cartController.cartList.add(item1);
        mockService.mockRelatedItems = [
          Item(id: 201, name: 'Related Item 201'),
        ];
        await cartController.getRelatedItemList(itemId: 101);
        expect(cartController.relatedItemList, isNotEmpty);
        expect(cartController.selectedRelatedCartItemId, equals(101));

        cartController.resetCartState();

        expect(cartController.relatedItemList, isNull);
        expect(cartController.selectedRelatedCartItemId, isNull);
        expect(cartController.isRelatedItemLoading, isFalse);
      },
    );
  });
}
