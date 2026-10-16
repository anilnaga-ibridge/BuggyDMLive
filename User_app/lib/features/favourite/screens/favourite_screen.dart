import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shimmer_animation/shimmer_animation.dart';
import 'package:sixam_mart/common/enums/data_source_enum.dart';
import 'package:sixam_mart/common/widgets/custom_app_bar.dart';
import 'package:sixam_mart/common/widgets/menu_drawer.dart';
import 'package:sixam_mart/common/widgets/not_logged_in_screen.dart';
import 'package:sixam_mart/features/favourite/controllers/favourite_controller.dart';
import 'package:sixam_mart/features/favourite/widgets/fav_recommendation_card.dart';
import 'package:sixam_mart/features/item/controllers/item_controller.dart';
import 'package:sixam_mart/features/item/domain/models/item_model.dart';
import 'package:sixam_mart/common/widgets/featured_store_card.dart';
import 'package:sixam_mart/common/widgets/exclusive_deal_card.dart';
import 'package:sixam_mart/features/order/controllers/order_controller.dart';
import 'package:sixam_mart/features/order/domain/models/last_order_model.dart';
import 'package:sixam_mart/features/order/domain/models/order_details_model.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/features/order/domain/services/order_service_interface.dart';
import 'package:sixam_mart/features/service_module/common/models/service_provider_model.dart';
import 'package:sixam_mart/features/service_module/provider_details/widgets/provider_service_item_widget.dart';
import 'package:sixam_mart/features/service_module/service_home/domain/models/service_model.dart';
import 'package:sixam_mart/features/service_module/service_home/widgets/service_verified_provider_card_widget.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/features/store/controllers/store_controller.dart';
import 'package:sixam_mart/features/store/domain/models/store_model.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

enum _FavFilter { items, restaurants }

class FavouriteScreen extends StatefulWidget {
  final Function()? onBackPressed;
  const FavouriteScreen({super.key, this.onBackPressed});

  @override
  FavouriteScreenState createState() => FavouriteScreenState();
}

class FavouriteScreenState extends State<FavouriteScreen> {
  _FavFilter _selectedFilter = _FavFilter.items;

  bool _isRecommendationsLoading = true;
  List<Item> _recommendedItems = [];
  List<Item> _orderHistoryItems = [];
  Map<int, int> _itemOrderFrequency = {};
  List<Store> _orderHistoryStores = [];
  List<Store> _recommendedStores = [];
  String _activeRecommendationFilter = 'all';

  @override
  void initState() {
    super.initState();
    _initCall();
  }

  void _initCall() {
    if (AuthHelper.isLoggedIn()) {
      Get.find<FavouriteController>().getFavouriteList();
      _loadOrderHistoryAndRecommendations();
    }
  }

  Future<void> _loadOrderHistoryAndRecommendations() async {
    if (!mounted) return;
    setState(() => _isRecommendationsLoading = true);

    try {
      final OrderServiceInterface orderServiceInterface = Get.find<OrderServiceInterface>();
      final ItemController itemController = Get.find<ItemController>();
      final StoreController storeController = Get.find<StoreController>();
      final OrderController orderController = Get.find<OrderController>();
      final SplashController splashController = Get.find<SplashController>();

      debugPrint('FavDebug: Starting load. Splash module: ${splashController.module?.id}, name: ${splashController.module?.moduleName}');

      if (splashController.module == null) {
        if (splashController.moduleList == null || splashController.moduleList!.isEmpty) {
          debugPrint('FavDebug: moduleList empty, fetching modules...');
          await splashController.getModules();
        }
        if (splashController.moduleList != null && splashController.moduleList!.isNotEmpty) {
          debugPrint('FavDebug: Auto-setting module to ${splashController.moduleList!.first.id}');
          splashController.setModule(splashController.moduleList!.first);
        }
      }

      debugPrint('FavDebug: Fetching popular items and orders...');
      try {
        await Future.wait([
          itemController.getPopularItemList(
            offset: '1',
            dataSource: DataSourceEnum.client,
            notify: false,
          ),
          itemController.getRecommendedItemList(
            true,
            'all',
            false,
            dataSource: DataSourceEnum.client,
          ),
          storeController.getPopularStoreList(
            true,
            'all',
            false,
            dataSource: DataSourceEnum.client,
          ),
          if (AuthHelper.isLoggedIn()) ...[
            orderController.getOrders(OrderListType.all, 1),
            orderController.getLastOrders(isHome: false),
          ],
        ]);
      } catch (innerErr, innerStack) {
        debugPrint('FavDebug: Inner Future.wait error: $innerErr\n$innerStack');
      }

      debugPrint('FavDebug: Popular items count: ${itemController.popularItemList?.length}');
      debugPrint('FavDebug: Recommended items count: ${itemController.recommendedItemList?.length}');
      debugPrint('FavDebug: All orders count: ${orderController.allOrderModel?.orders?.length}');
      debugPrint('FavDebug: Last orders count: ${orderController.lastOrders?.length}');

      final Map<int, int> itemFrequency = {};
      final Map<int, Item> historyItems = {};
      final Map<int, int> categoryFrequency = {};
      final Map<int, Store> historyStores = {};

      if (AuthHelper.isLoggedIn()) {
        final List<OrderModel> allOrdersList = [
          ...?(orderController.allOrderModel?.orders),
          ...?(orderController.historyOrderModel?.orders),
          ...?(orderController.runningOrderModel?.orders),
        ];

        final Map<int, OrderModel> uniqueOrders = {};
        for (final o in allOrdersList) {
          if (o.id != null) uniqueOrders[o.id!] = o;
        }
        final List<OrderModel> orders = uniqueOrders.values.toList();
        final List<LastOrderModel> lastOrders = orderController.lastOrders ?? orderController.lastOrdersHome ?? [];

        for (final order in orders) {
          if (order.store != null && order.store!.id != null) {
            historyStores[order.store!.id!] = order.store!;
          }
        }
        for (final lastOrder in lastOrders) {
          if (lastOrder.store != null && lastOrder.store!.id != null && !historyStores.containsKey(lastOrder.store!.id)) {
            historyStores[lastOrder.store!.id!] = Store(
              id: lastOrder.store!.id,
              name: lastOrder.store!.name,
              slug: lastOrder.store!.slug,
              logoFullUrl: lastOrder.store!.logoFullUrl,
            );
          }
        }

        final List<OrderModel> ordersToFetch = orders.take(6).toList();
        final List<Future<List<OrderDetailsModel>?>> detailFutures = ordersToFetch.map((order) {
          return orderServiceInterface.getOrderDetails(
            order.id.toString(),
            AuthHelper.isLoggedIn() ? null : AuthHelper.getGuestId(),
          );
        }).toList();

        final List<List<OrderDetailsModel>?> detailsResults = await Future.wait(detailFutures);
        for (int i = 0; i < detailsResults.length; i++) {
          final List<OrderDetailsModel>? details = detailsResults[i];
          final Store? orderStore = i < ordersToFetch.length ? ordersToFetch[i].store : null;
          if (details != null) {
            for (final od in details) {
              final Item? item = od.itemDetails;
              if (item != null && item.id != null) {
                final int itemId = item.id!;
                itemFrequency[itemId] = (itemFrequency[itemId] ?? 0) + (od.quantity ?? 1);

                if (item.storeName == null || item.storeName!.isEmpty) {
                  item.storeName = orderStore?.name;
                }
                item.storeId ??= orderStore?.id;
                if (item.storeLogoFullUrl == null || item.storeLogoFullUrl!.isEmpty) {
                  item.storeLogoFullUrl = orderStore?.logoFullUrl;
                }
                if ((item.imageFullUrl == null || item.imageFullUrl!.isEmpty) && od.imageFullUrl != null && od.imageFullUrl!.isNotEmpty) {
                  item.imageFullUrl = od.imageFullUrl;
                }

                historyItems[itemId] = item;

                if (item.categoryId != null) {
                  categoryFrequency[item.categoryId!] = (categoryFrequency[item.categoryId!] ?? 0) + (od.quantity ?? 1);
                }
                if (item.categoryIds != null) {
                  for (final cat in item.categoryIds!) {
                    final int? cid = int.tryParse('${cat.id}');
                    if (cid != null) {
                      categoryFrequency[cid] = (categoryFrequency[cid] ?? 0) + (od.quantity ?? 1);
                    }
                  }
                }
              }
            }
          }
        }
      }

      final List<Item> sortedHistoryItems = historyItems.values.toList()
        ..sort((a, b) => (itemFrequency[b.id] ?? 0).compareTo(itemFrequency[a.id] ?? 0));

      final List<Item> popularSource = itemController.popularItemList ?? [];
      final List<Item> recommendedSource = itemController.recommendedItemList ?? [];
      final List<Item> reviewedSource = itemController.reviewedItemList ?? [];

      final List<Item> categoryMatchedItems = [];
      final List<Item> otherGeneralItems = [];

      final Set<int> addedItemIds = sortedHistoryItems.map((e) => e.id!).toSet();

      for (final item in [...popularSource, ...recommendedSource, ...reviewedSource]) {
        if (item.id != null && !addedItemIds.contains(item.id)) {
          addedItemIds.add(item.id!);

          bool matchesPreference = false;
          if (item.categoryId != null && categoryFrequency.containsKey(item.categoryId)) {
            matchesPreference = true;
          }
          if (item.categoryIds != null) {
            for (final cat in item.categoryIds!) {
              final int? cid = int.tryParse('${cat.id}');
              if (cid != null && categoryFrequency.containsKey(cid)) {
                matchesPreference = true;
                break;
              }
            }
          }
          if (item.storeId != null && historyStores.containsKey(item.storeId)) {
            matchesPreference = true;
          }

          if (matchesPreference) {
            categoryMatchedItems.add(item);
          } else {
            otherGeneralItems.add(item);
          }
        }
      }

      final List<Item> combinedRecommendations = [
        ...sortedHistoryItems,
        ...categoryMatchedItems,
        ...otherGeneralItems,
      ];

      final List<Store> sortedHistoryStores = historyStores.values.toList();
      final List<Store> popularStores = storeController.popularStoreList ?? [];
      final Set<int> addedStoreIds = sortedHistoryStores.map((s) => s.id!).toSet();
      final List<Store> combinedStores = [
        ...sortedHistoryStores,
        ...popularStores.where((s) => s.id != null && !addedStoreIds.contains(s.id)),
      ];

      if (mounted) {
        setState(() {
          _orderHistoryItems = sortedHistoryItems;
          _recommendedItems = combinedRecommendations;
          _itemOrderFrequency = itemFrequency;
          _orderHistoryStores = sortedHistoryStores;
          _recommendedStores = combinedStores;
          _isRecommendationsLoading = false;
        });
      }
    } catch (e, s) {
      debugPrint('FavDebug: Outer error in _loadOrderHistoryAndRecommendations: $e\n$s');
      if (mounted) {
        setState(() => _isRecommendationsLoading = false);
      }
    }
  }

  void _selectFilter(_FavFilter filter) {
    if (_selectedFilter == filter) return;
    setState(() => _selectedFilter = filter);
  }

  bool get _showRestaurantText => Get.find<SplashController>().configModel?.moduleConfig?.module?.showRestaurantText ?? false;

  bool get _isServiceModule => Get.find<SplashController>().module?.moduleType == AppConstants.service;

  String get _itemsLabel => _isServiceModule ? 'services'.tr : (_showRestaurantText ? 'foods'.tr : 'items'.tr);
  String get _storesLabel => _isServiceModule ? 'providers'.tr : (_showRestaurantText ? 'restaurants'.tr : 'stores'.tr);

  @override
  Widget build(BuildContext context) {
    final Color tinted = Color.alphaBlend(
      Theme.of(context).disabledColor.withAlpha(30),
      Theme.of(context).cardColor,
    );

    return Scaffold(
      backgroundColor: tinted,
      appBar: CustomAppBar(title: 'favourite'.tr, backButton: true, onBackPressed: widget.onBackPressed),
      endDrawer: const MenuDrawer(),
      endDrawerEnableOpenDragGesture: false,
      body: AuthHelper.isLoggedIn()
          ? SafeArea(
              bottom: false,
              child: GetBuilder<FavouriteController>(builder: (controller) {
                final List<Item> items = (controller.wishItemList ?? const <Item?>[])
                    .where((Item? e) => e != null).cast<Item>().toList();
                final List<Store> stores = (controller.wishStoreList ?? const <Store?>[])
                    .where((Store? e) => e != null).cast<Store>().toList();
                final List<Service> services = (controller.wishServiceList ?? const <Service?>[])
                    .where((Service? e) => e != null).cast<Service>().toList();
                final List<ServiceProvider> providers = (controller.wishStoreList ?? const <Store?>[])
                    .where((Store? e) => e != null).map((Store? e) => ServiceProvider.fromStore(e!)).toList();

                final int primaryCount = _isServiceModule ? services.length : items.length;
                final int secondaryCount = _isServiceModule ? providers.length : stores.length;

                final bool primaryLoading = _isServiceModule ? controller.wishServiceList == null : controller.wishItemList == null;
                final bool secondaryLoading = controller.wishStoreList == null;
                final bool countLoading = _selectedFilter == _FavFilter.items ? primaryLoading : secondaryLoading;

                return RefreshIndicator(
                  onRefresh: () async {
                    await Future.wait([
                      controller.getFavouriteList(),
                      _loadOrderHistoryAndRecommendations(),
                    ]);
                  },
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: <Widget>[
                      SliverPersistentHeader(
                        pinned: true,
                        delegate: _PinnedHeaderDelegate(
                          height: 56,
                          child: _FavTypeFilterBar(
                            selected: _selectedFilter,
                            count: _selectedFilter == _FavFilter.items ? primaryCount : secondaryCount,
                            itemsLabel: _itemsLabel,
                            storesLabel: _storesLabel,
                            onSelected: _selectFilter,
                            isLoading: countLoading,
                          ),
                        ),
                      ),

                      SliverToBoxAdapter(
                        child: _selectedFilter == _FavFilter.items
                            ? (_isServiceModule
                                ? _ServicesFavouriteView(isLoading: controller.wishServiceList == null, services: services)
                                : _buildItemsBody(context: context, controller: controller, items: items))
                            : (_isServiceModule
                                ? _ProvidersFavouriteView(isLoading: controller.wishStoreList == null, providers: providers)
                                : _buildRestaurantsBody(context: context, controller: controller, stores: stores)),
                      ),
                    ],
                  ),
                );
              }),
            )
          : NotLoggedInScreen(callBack: (value) {
              _initCall();
              setState(() {});
            }),
    );
  }

  Widget _buildItemsBody({
    required BuildContext context,
    required FavouriteController controller,
    required List<Item> items,
  }) {
    if (controller.wishItemList == null) {
      return const _LoadingPlaceholder();
    }

    final bool hasFavourites = items.isNotEmpty;

    List<Item> filteredRecommendations = [];
    if (_activeRecommendationFilter == 'history') {
      filteredRecommendations = _orderHistoryItems;
    } else if (_activeRecommendationFilter == 'popular') {
      filteredRecommendations = (Get.find<ItemController>().popularItemList ?? [])
          .where((i) => i.id != null)
          .toList();
    } else if (_activeRecommendationFilter == 'top_rated') {
      filteredRecommendations = _recommendedItems
          .where((i) => (i.avgRating ?? 0) >= 4.5)
          .toList();
      if (filteredRecommendations.isEmpty) {
        filteredRecommendations = _recommendedItems;
      }
    } else {
      filteredRecommendations = _recommendedItems;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (hasFavourites) ...[
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Dimensions.paddingSizeDefault,
              vertical: Dimensions.paddingSizeDefault,
            ),
            child: Column(
              children: items.map((Item item) {
                final bool isLast = identical(item, items.last);
                final int index = items.indexOf(item);
                return Container(
                  margin: EdgeInsets.only(bottom: isLast ? 0 : Dimensions.paddingSizeDefault),
                  padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
                  decoration: BoxDecoration(
                    border: isLast ? null : Border(
                      bottom: BorderSide(color: Theme.of(context).disabledColor.withValues(alpha: 0.18)),
                    ),
                  ),
                  child: ExclusiveDealCard(
                    item: item,
                    width: double.infinity,
                    index: index,
                  ),
                );
              }).toList(),
            ),
          ),
        ] else ...[
          const _FavEmptyHeroWidget(
            icon: Icons.favorite_border_rounded,
            title: 'Your Wishlist is Empty',
            subtitle: 'We curated items based on your order history and favorite categories. Tap the heart icon to save them or add them straight to your cart!',
          ),
        ],

        // Recommended items section
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: Dimensions.paddingSizeSmall),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.auto_awesome_rounded,
                      size: 16,
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _orderHistoryItems.isNotEmpty
                              ? 'Curated Based on Your Orders'
                              : 'Recommended For You',
                          style: robotoBold.copyWith(
                            fontSize: Dimensions.fontSizeLarge,
                            color: Theme.of(context).textTheme.bodyLarge?.color,
                          ),
                        ),
                        Text(
                          _orderHistoryItems.isNotEmpty
                              ? 'Items and categories you order most frequently'
                              : 'Top picks and trending items you may love',
                          style: robotoRegular.copyWith(
                            fontSize: Dimensions.fontSizeExtraSmall,
                            color: Theme.of(context).disabledColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Dimensions.paddingSizeDefault),

              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: [
                    _buildRecommendationFilterChip(
                      id: 'all',
                      label: 'All Picks',
                      icon: Icons.auto_awesome_rounded,
                    ),
                    if (_orderHistoryItems.isNotEmpty)
                      _buildRecommendationFilterChip(
                        id: 'history',
                        label: 'Order Again (${_orderHistoryItems.length})',
                        icon: Icons.history_rounded,
                      ),
                    _buildRecommendationFilterChip(
                      id: 'popular',
                      label: 'Popular Picks',
                      icon: Icons.local_fire_department_rounded,
                    ),
                    _buildRecommendationFilterChip(
                      id: 'top_rated',
                      label: 'Top Rated',
                      icon: Icons.star_rounded,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Dimensions.paddingSizeDefault),

              if (_isRecommendationsLoading && filteredRecommendations.isEmpty)
                const _LoadingPlaceholder()
              else if (filteredRecommendations.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
                  child: Center(
                    child: Text(
                      'No recommendations found.',
                      style: robotoRegular.copyWith(color: Theme.of(context).disabledColor),
                    ),
                  ),
                )
              else
                Column(
                  children: List.generate(filteredRecommendations.length, (index) {
                    final Item item = filteredRecommendations[index];
                    return FavRecommendationCard(
                      item: item,
                      index: index,
                      orderCount: _itemOrderFrequency[item.id] ?? 0,
                      isFromOrderHistory: _itemOrderFrequency.containsKey(item.id),
                    );
                  }),
                ),

              const SizedBox(height: Dimensions.paddingSizeExtraLarge),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRecommendationFilterChip({
    required String id,
    required String label,
    required IconData icon,
  }) {
    final bool isSelected = _activeRecommendationFilter == id;
    final Color primary = Theme.of(context).primaryColor;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(50),
        onTap: () {
          if (_activeRecommendationFilter != id) {
            setState(() => _activeRecommendationFilter = id);
          }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: isSelected ? primary : Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(50),
            border: Border.all(
              color: isSelected ? primary : Theme.of(context).disabledColor.withValues(alpha: 0.2),
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: primary.withValues(alpha: 0.25),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 14,
                color: isSelected ? Colors.white : Theme.of(context).disabledColor,
              ),
              const SizedBox(width: 5),
              Text(
                label,
                style: robotoMedium.copyWith(
                  fontSize: Dimensions.fontSizeSmall,
                  color: isSelected
                      ? Colors.white
                      : Theme.of(context).textTheme.bodyLarge?.color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRestaurantsBody({
    required BuildContext context,
    required FavouriteController controller,
    required List<Store> stores,
  }) {
    if (controller.wishStoreList == null) {
      return const _LoadingPlaceholder(isStore: true);
    }

    final bool hasFavouriteStores = stores.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (hasFavouriteStores) ...[
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Dimensions.paddingSizeDefault,
              vertical: Dimensions.paddingSizeDefault,
            ),
            child: Column(
              children: stores.map((Store store) {
                final bool isLast = identical(store, stores.last);
                return Padding(
                  padding: EdgeInsets.only(bottom: isLast ? 0 : Dimensions.paddingSizeDefault),
                  child: FeaturedStoreCard(
                    data: store,
                    width: double.infinity,
                    isQuick: false,
                    onTap: () => Get.toNamed(RouteHelper.getStoreRoute(
                      id: store.id, page: 'item', slug: store.slug ?? '',
                    )),
                  ),
                );
              }).toList(),
            ),
          ),
        ] else ...[
          const _FavEmptyHeroWidget(
            icon: Icons.storefront_rounded,
            title: 'No Favourite Stores Yet',
            subtitle: 'Discover stores you have ordered from in the past or popular stores nearby. Tap the heart icon to add them to your favourites!',
          ),
        ],

        if (_orderHistoryStores.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
            child: Row(
              children: [
                const Icon(Icons.history_rounded, size: 18, color: Color(0xFF10B981)),
                const SizedBox(width: 6),
                Text(
                  'Stores You Ordered From',
                  style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge),
                ),
              ],
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeSmall),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
            child: Column(
              children: _orderHistoryStores.map((Store store) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
                  child: FeaturedStoreCard(
                    data: store,
                    width: double.infinity,
                    isQuick: false,
                    onTap: () => Get.toNamed(RouteHelper.getStoreRoute(
                      id: store.id, page: 'item', slug: store.slug ?? '',
                    )),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeDefault),
        ],

        if (_recommendedStores.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
            child: Row(
              children: [
                Icon(Icons.local_fire_department_rounded, size: 18, color: Theme.of(context).primaryColor),
                const SizedBox(width: 6),
                Text(
                  'Popular Stores Near You',
                  style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge),
                ),
              ],
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeSmall),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
            child: Column(
              children: _recommendedStores.map((Store store) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
                  child: FeaturedStoreCard(
                    data: store,
                    width: double.infinity,
                    isQuick: false,
                    onTap: () => Get.toNamed(RouteHelper.getStoreRoute(
                      id: store.id, page: 'item', slug: store.slug ?? '',
                    )),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeExtraLarge),
        ],
      ],
    );
  }

}

class _PinnedHeaderDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;
  final double height;

  _PinnedHeaderDelegate({required this.child, required this.height});

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) => child;

  @override
  double get maxExtent => height;

  @override
  double get minExtent => height;

  @override
  bool shouldRebuild(covariant _PinnedHeaderDelegate oldDelegate) {
    return oldDelegate.child != child || oldDelegate.height != height;
  }
}

class _FavTypeFilterBar extends StatelessWidget {
  final _FavFilter selected;
  final int count;
  final String itemsLabel;
  final String storesLabel;
  final ValueChanged<_FavFilter> onSelected;
  final bool isLoading;

  const _FavTypeFilterBar({
    required this.selected, required this.count, required this.itemsLabel, required this.storesLabel, required this.onSelected,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    final Color divider = Theme.of(context).disabledColor.withAlpha(60);
    final Color tinted = Color.alphaBlend(
      Theme.of(context).disabledColor.withAlpha(30),
      Theme.of(context).cardColor,
    );
    final List<(_FavFilter, String)> tabs = <(_FavFilter, String)>[
      (_FavFilter.items, itemsLabel),
      (_FavFilter.restaurants, storesLabel),
    ];

    return Material(
      color: tinted,
      child: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Dimensions.paddingSizeDefault,
                    vertical: Dimensions.paddingSizeSmall,
                  ),
                  child: isLoading
                      ? Shimmer(
                          duration: const Duration(seconds: 2),
                          child: Container(
                            width: 70, height: 12,
                            decoration: BoxDecoration(
                              color: Theme.of(context).disabledColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                            ),
                          ),
                        )
                      : Text(
                          '$count ${selected == _FavFilter.items ? itemsLabel : storesLabel}',
                          style: robotoBold.copyWith(
                            fontSize: Dimensions.fontSizeSmall,
                            color: Theme.of(context).disabledColor,
                          ),
                        ),
                ),
                const Spacer(),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Dimensions.paddingSizeDefault,
                    vertical: Dimensions.paddingSizeSmall,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List<Widget>.generate(tabs.length, (index) {
                      final (_FavFilter filter, String label) = tabs[index];
                      return Padding(
                        padding: EdgeInsets.only(left: index == 0 ? 0 : Dimensions.paddingSizeSmall),
                        child: _FavFilterChip(
                          label: label,
                          isSelected: filter == selected,
                          onTap: () => onSelected(filter),
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
          Container(height: 1, color: divider),
        ],
      ),
    );
  }
}

class _FavFilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FavFilterChip({required this.label, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final Color primary = Theme.of(context).primaryColor;
    final Color textColor = isSelected
        ? Colors.white
        : Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black;

    return InkWell(
      borderRadius: BorderRadius.circular(50),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: Dimensions.paddingSizeDefault,
          vertical: Dimensions.paddingSizeSmall,
        ),
        decoration: BoxDecoration(
          color: isSelected ? primary : Theme.of(context).disabledColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(50),
        ),
        child: Text(
          label,
          style: robotoSemiBold.copyWith(
            fontSize: Dimensions.fontSizeSmall,
            color: textColor,
          ),
        ),
      ),
    );
  }
}

class _ServicesFavouriteView extends StatelessWidget {
  final bool isLoading;
  final List<Service> services;
  const _ServicesFavouriteView({required this.isLoading, required this.services});

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const _LoadingPlaceholder();
    }
    if (services.isEmpty) {
      return _EmptyView(message: 'no_wish_data_found'.tr);
    }
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Dimensions.paddingSizeDefault,
        vertical: Dimensions.paddingSizeDefault,
      ),
      child: Column(
        children: services.map((Service service) {
          final bool isLast = identical(service, services.last);
          return Container(
            margin: EdgeInsets.only(bottom: isLast ? 0 : Dimensions.paddingSizeDefault),
            padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
            decoration: BoxDecoration(
              border: isLast ? null : Border(
                bottom: BorderSide(color: Theme.of(context).disabledColor.withValues(alpha: 0.18)),
              ),
            ),
            child: ProviderServiceItemWidget(service: service),
          );
        }).toList(),
      ),
    );
  }
}

class _ProvidersFavouriteView extends StatelessWidget {
  final bool isLoading;
  final List<ServiceProvider> providers;
  const _ProvidersFavouriteView({required this.isLoading, required this.providers});

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const _LoadingPlaceholder(isStore: true);
    }
    if (providers.isEmpty) {
      return _EmptyView(message: 'no_wish_data_found'.tr);
    }
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Dimensions.paddingSizeDefault,
        vertical: Dimensions.paddingSizeDefault,
      ),
      child: Column(
        children: providers.map((ServiceProvider provider) {
          final bool isLast = identical(provider, providers.last);
          return Padding(
            padding: EdgeInsets.only(bottom: isLast ? 0 : Dimensions.paddingSizeDefault),
            child: ServiceVerifiedProviderCard(provider: provider, width: double.infinity),
          );
        }).toList(),
      ),
    );
  }
}

class _LoadingPlaceholder extends StatelessWidget {
  // Banner-style card placeholders (stores/providers) vs full-width row
  // placeholders (items/services).
  final bool isStore;
  const _LoadingPlaceholder({this.isStore = false});

  @override
  Widget build(BuildContext context) {
    final int count = isStore ? 4 : 6;
    return Shimmer(
      duration: const Duration(seconds: 2),
      color: Theme.of(context).cardColor,
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
        child: Column(
          children: List<Widget>.generate(count, (int index) => Padding(
            padding: EdgeInsets.only(bottom: index == count - 1 ? 0 : Dimensions.paddingSizeLarge),
            child: isStore ? const _StoreShimmerBlock() : const _ItemShimmerRow(),
          )),
        ),
      ),
    );
  }
}

/// Grey placeholder box used as the base for the shimmer sweep.
class _ShimmerBox extends StatelessWidget {
  final double? width;
  final double height;
  final double radius;
  const _ShimmerBox({this.width, required this.height, this.radius = Dimensions.radiusSmall});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Theme.of(context).disabledColor.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

/// Mimics a full-width favourite item/service row (image + text lines).
class _ItemShimmerRow extends StatelessWidget {
  const _ItemShimmerRow();

  @override
  Widget build(BuildContext context) {
    return const Row(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
      _ShimmerBox(width: 90, height: 90, radius: Dimensions.radiusDefault),
      SizedBox(width: Dimensions.paddingSizeDefault),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
          _ShimmerBox(width: 160, height: 14),
          SizedBox(height: Dimensions.paddingSizeSmall),
          _ShimmerBox(width: 110, height: 12),
          SizedBox(height: Dimensions.paddingSizeSmall),
          _ShimmerBox(width: 70, height: 12),
          SizedBox(height: Dimensions.paddingSizeSmall),
          _ShimmerBox(width: 90, height: 14),
        ]),
      ),
    ]);
  }
}

/// Mimics a full-width favourite store/provider card (banner image + text lines).
class _StoreShimmerBlock extends StatelessWidget {
  const _StoreShimmerBlock();

  @override
  Widget build(BuildContext context) {
    return const Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
      _ShimmerBox(height: 150, radius: Dimensions.radiusDefault),
      SizedBox(height: Dimensions.paddingSizeDefault),
      _ShimmerBox(width: 180, height: 14),
      SizedBox(height: Dimensions.paddingSizeSmall),
      _ShimmerBox(width: 120, height: 12),
    ]);
  }
}

class _FavEmptyHeroWidget extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _FavEmptyHeroWidget({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(Dimensions.paddingSizeDefault),
      padding: const EdgeInsets.symmetric(
        horizontal: Dimensions.paddingSizeLarge,
        vertical: Dimensions.paddingSizeExtraLarge,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
        border: Border.all(
          color: Theme.of(context).disabledColor.withValues(alpha: 0.12),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
            ),
            alignment: Alignment.center,
            child: Icon(icon, size: 28, color: Theme.of(context).primaryColor),
          ),
          const SizedBox(height: Dimensions.paddingSizeSmall),
          Text(
            title,
            style: robotoBold.copyWith(
              fontSize: Dimensions.fontSizeLarge,
              color: Theme.of(context).textTheme.bodyLarge?.color,
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeExtraSmall),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: robotoRegular.copyWith(
              fontSize: Dimensions.fontSizeSmall,
              color: Theme.of(context).disabledColor,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  final String message;
  const _EmptyView({required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
        decoration: BoxDecoration(
          color: Theme.of(context).disabledColor.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        ),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: robotoMedium.copyWith(
            fontSize: Dimensions.fontSizeDefault,
            color: Theme.of(context).textTheme.bodyLarge?.color,
          ),
        ),
      ),
    );
  }
}

