import 'package:country_code_picker/country_code_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:get/get.dart';
import 'package:shimmer_animation/shimmer_animation.dart';
import 'package:sixam_mart/common/models/module_model.dart';
import 'package:sixam_mart/common/widgets/custom_app_bar.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/common/widgets/custom_loader.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/common/widgets/custom_text_field.dart';
import 'package:sixam_mart/features/auth/controllers/auth_controller.dart';
import 'package:sixam_mart/features/language/controllers/language_controller.dart';
import 'package:sixam_mart/features/order/controllers/order_controller.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/features/rental_module/common/models/trip_details_model.dart';
import 'package:sixam_mart/features/rental_module/rental_order/controllers/taxi_order_controller.dart';
import 'package:sixam_mart/features/rental_module/rental_order/screens/taxi_order_details_screen.dart';
import 'package:sixam_mart/features/ride_share_module/ride_location/domain/models/ride_details_model.dart';
import 'package:sixam_mart/features/ride_share_module/ride_order/controllers/ride_controller.dart';
import 'package:sixam_mart/features/ride_share_module/ride_order/screens/ride_order_complete_screen.dart';
import 'package:sixam_mart/features/ride_share_module/ride_payment/screens/ride_payment_screen.dart';
import 'package:sixam_mart/features/service_module/booking_details/controllers/booking_controller.dart';
import 'package:sixam_mart/features/service_module/booking_details/domain/models/booking_model.dart';
import 'package:sixam_mart/features/service_module/booking_details/domain/services/booking_service_interface.dart';
import 'package:sixam_mart/features/service_module/common/widgets/rebook_button.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/custom_validator.dart';
import 'package:sixam_mart/helper/date_converter.dart';
import 'package:sixam_mart/helper/module_helper.dart';
import 'package:sixam_mart/helper/price_converter.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/helper/string_extension.dart';
import 'package:sixam_mart/helper/validate_check.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

enum _OrderFilter { all, running, history }

enum _ModuleKind { regular, taxi, ride, service }

List<ModuleModel> _visibleModulesFrom(SplashController splash) {
  return splash.moduleList ?? <ModuleModel>[];
}

_ModuleKind _kindOf(ModuleModel? module) {
  switch (module?.moduleType) {
    case AppConstants.taxi: return _ModuleKind.taxi;
    case AppConstants.ride: return _ModuleKind.ride;
    case AppConstants.service: return _ModuleKind.service;
    default:                return _ModuleKind.regular;
  }
}

// Shared end-action pane with a single delete action — mirrors the cart's
// Slidable styling. [onDelete] runs the confirm dialog + API and removes the row.
ActionPane _deleteActionPane(BuildContext context, Future<void> Function() onDelete) {
  return ActionPane(
    motion: const ScrollMotion(),
    extentRatio: 0.2,
    children: [
      SlidableAction(
        onPressed: (_) => onDelete(),
        backgroundColor: Theme.of(context).colorScheme.error.withValues(alpha: 0.2),
        borderRadius: BorderRadius.zero,
        foregroundColor: Theme.of(context).colorScheme.error,
        icon: CupertinoIcons.delete,
      ),
    ],
  );
}

class MyOrderScreen extends StatefulWidget {
  final Function()? onBackPressed;
  const MyOrderScreen({super.key, this.onBackPressed});

  @override
  State<MyOrderScreen> createState() => _MyOrderScreenState();
}

class _MyOrderScreenState extends State<MyOrderScreen> {
  static const int _pageLimit = 10;

  _OrderFilter _selectedFilter = _OrderFilter.all;
  int _selectedVisibleIndex = 0;
  bool _isLoggedIn = AuthHelper.isLoggedIn();

  final ScrollController _scrollController = ScrollController();
  final Map<String, List<int>> _loadedPagesByKey = <String, List<int>>{};
  bool _isPaginating = false;
  bool _isLoadingFirstPage = false;

  @override
  void initState() {
    super.initState();
    if(!_isLoggedIn) return;

    _scrollController.addListener(_onScroll);
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final SplashController splash = Get.find<SplashController>();
    if (splash.moduleList == null || splash.moduleList!.isEmpty) {
      await splash.getModules();
    }
    final List<ModuleModel> visibleModules = _visibleModulesFrom(splash);

    if(visibleModules.isNotEmpty) {
      final ModuleModel? currentSplashModule = _moduleAtSplashIndex(splash, splash.selectedModuleIndex);
      int matchIndex = -1;
      if(currentSplashModule != null) {
        matchIndex = visibleModules.indexWhere((ModuleModel m) => m.id == currentSplashModule.id);
      }
      _selectedVisibleIndex = matchIndex >= 0 ? matchIndex : 0;

      if(matchIndex < 0) {
        // Opened from Home (no matching active module): default to the 1st module
        // and point the header at it so order details resolve correctly — but do
        // NOT change the dashboard's selected module index.
        await splash.setModule(visibleModules[_selectedVisibleIndex], notify: false);
      }
    }

    _coerceFilterForActiveKind();
    if(mounted) _loadFirstPageForActiveKind(_selectedFilter);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  OrderListType _apiTypeOf(_OrderFilter filter) => switch(filter) {
    _OrderFilter.all => OrderListType.all,
    _OrderFilter.running => OrderListType.running,
    _OrderFilter.history => OrderListType.previous,
  };

  BookingListType _bookingApiTypeOf(_OrderFilter filter) => switch(filter) {
    _OrderFilter.all => BookingListType.all,
    _OrderFilter.running => BookingListType.running,
    _OrderFilter.history => BookingListType.previous,
  };

  ModuleModel? _moduleAtSplashIndex(SplashController splash, int splashIndex) {
    if (splash.moduleList == null || splashIndex < 0 || splashIndex >= splash.moduleList!.length) return splash.module;
    return splash.moduleList![splashIndex];
  }

  ModuleModel? get _activeModule {
    final List<ModuleModel> visible = _visibleModulesFrom(Get.find<SplashController>());
    if(visible.isEmpty || _selectedVisibleIndex >= visible.length) return null;
    return visible[_selectedVisibleIndex];
  }

  int? get _activeModuleId => _activeModule?.id;

  _ModuleKind get _activeKind => _kindOf(_activeModule);

  String get _pageKey => '${_activeKind.name}-${_activeKind == _ModuleKind.regular ? (_activeModuleId ?? 0) : 0}-${_selectedFilter.name}';

  // Taxi & ride APIs don't have an "all" type. If the user lands on a kind
  // that doesn't support All, snap to Running.
  void _coerceFilterForActiveKind() {
    if((_activeKind == _ModuleKind.taxi || _activeKind == _ModuleKind.ride) && _selectedFilter == _OrderFilter.all) {
      _selectedFilter = _OrderFilter.running;
    }
  }

  Future<void> _loadFirstPageForActiveKind(_OrderFilter filter, {bool clearVisible = false}) async {
    _loadedPagesByKey[_pageKey] = <int>[1];
    _isLoadingFirstPage = true;
    if(mounted) setState(() {});
    try {
      switch(_activeKind) {
        case _ModuleKind.regular:
          await Get.find<OrderController>().getOrders(_apiTypeOf(filter), 1, isUpdate: clearVisible, moduleId: _activeModuleId);
        case _ModuleKind.taxi:
          await Get.find<TaxiOrderController>().getTripList(1, isUpdate: clearVisible, isRunning: filter != _OrderFilter.history);
        case _ModuleKind.ride:
          await Get.find<RideController>().getRideList(1, isUpdate: clearVisible, isRunning: filter != _OrderFilter.history);
        case _ModuleKind.service:
          await Get.find<BookingController>().getBookings(_bookingApiTypeOf(filter), 1, isUpdate: clearVisible);
      }
    } finally {
      if(mounted) setState(() => _isLoadingFirstPage = false);
    }
  }

  Future<void> _onRefresh() => _loadFirstPageForActiveKind(_selectedFilter);

  void _selectFilter(_OrderFilter filter) {
    if(_selectedFilter == filter) return;
    if((_activeKind == _ModuleKind.taxi || _activeKind == _ModuleKind.ride) && filter == _OrderFilter.all) return;
    setState(() => _selectedFilter = filter);
    _loadFirstPageForActiveKind(filter, clearVisible: true);
  }

  Future<void> _onModuleSelected(int visibleIndex, ModuleModel module) async {
    if(visibleIndex == _selectedVisibleIndex) return;

    // Point the header at the picked module so order details resolve to it, but do
    // NOT change the dashboard's selected module index — returning Home stays put.
    // The order list itself is fetched with an explicit moduleId.
    await Get.find<SplashController>().setModule(module, notify: false);

    if(!mounted) return;
    _loadedPagesByKey.clear();
    Get.find<OrderController>().clearAllOrderModels(notify: false);
    setState(() => _selectedVisibleIndex = visibleIndex);
    _coerceFilterForActiveKind();
    _loadFirstPageForActiveKind(_selectedFilter, clearVisible: true);
  }

  // Returns the (totalSize, currentPage) for the active kind + filter,
  // so pagination math works the same way for orders, trips, and rides.
  ({int? totalSize, int currentPage}) _paginationStateForActiveKind() {
    switch(_activeKind) {
      case _ModuleKind.regular:
        final PaginatedOrderModel? model = Get.find<OrderController>().orderModelOf(_apiTypeOf(_selectedFilter));
        return (totalSize: model?.totalSize, currentPage: ((model?.offset ?? 1)).toInt());
      case _ModuleKind.taxi:
        final TaxiOrderController c = Get.find<TaxiOrderController>();
        final bool running = _selectedFilter != _OrderFilter.history;
        final dynamic m = running ? c.tripModel : c.tripHistoryModel;
        return (totalSize: m?.totalSize as int?, currentPage: (m?.offset as int?) ?? 1);
      case _ModuleKind.ride:
        final RideController c = Get.find<RideController>();
        final bool running = _selectedFilter != _OrderFilter.history;
        final dynamic m = running ? c.runningRideList : c.historyRideList;
        return (totalSize: m?.totalSize as int?, currentPage: int.tryParse((m?.offset as String?) ?? '1') ?? 1);
      case _ModuleKind.service:
        final PaginatedBookingModel? model = Get.find<BookingController>().bookingModelOf(_bookingApiTypeOf(_selectedFilter));
        return (totalSize: model?.totalSize, currentPage: model?.offset ?? 1);
    }
  }

  void _onScroll() {
    if(!_scrollController.hasClients || _isPaginating) return;
    if(_scrollController.position.pixels < _scrollController.position.maxScrollExtent) return;

    final state = _paginationStateForActiveKind();
    if(state.totalSize == null) return;

    final List<int> loaded = _loadedPagesByKey[_pageKey] ??= <int>[1];
    final int currentPage = loaded.isEmpty ? 0 : loaded.reduce((a, b) => a > b ? a : b);
    final int totalPages = (state.totalSize! / _pageLimit).ceil();
    final int nextPage = currentPage + 1;
    if(nextPage > totalPages || loaded.contains(nextPage)) return;

    setState(() {
      _isPaginating = true;
      loaded.add(nextPage);
    });

    Future<void> request;
    switch(_activeKind) {
      case _ModuleKind.regular:
        request = Get.find<OrderController>().getOrders(_apiTypeOf(_selectedFilter), nextPage, isUpdate: true, moduleId: _activeModuleId);
      case _ModuleKind.taxi:
        request = Get.find<TaxiOrderController>().getTripList(nextPage, isUpdate: true, isRunning: _selectedFilter != _OrderFilter.history);
      case _ModuleKind.ride:
        request = Get.find<RideController>().getRideList(nextPage, isUpdate: true, isRunning: _selectedFilter != _OrderFilter.history);
      case _ModuleKind.service:
        request = Get.find<BookingController>().getBookings(_bookingApiTypeOf(_selectedFilter), nextPage, isUpdate: true);
    }
    request.whenComplete(() {
      if(mounted) setState(() => _isPaginating = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    _isLoggedIn = AuthHelper.isLoggedIn();
    const Color pageBg = Color(0xFFF8F9FA);

    if(!_isLoggedIn) {
      return Scaffold(
        backgroundColor: pageBg,
        appBar: CustomAppBar(title: 'my_orders'.tr, onBackPressed: widget.onBackPressed),
        body: const SafeArea(
          bottom: false,
          child: Column(children: [
            Expanded(child: _GuestTrackOrderView()),
          ]),
        ),
      );
    }

    final double bottomNavClearance = 62 + Dimensions.paddingSizeDefault + MediaQuery.of(context).padding.bottom + Dimensions.paddingSizeDefault;

    return Scaffold(
      backgroundColor: pageBg,
      appBar: CustomAppBar(title: 'my_orders'.tr, onBackPressed: widget.onBackPressed),
      body: SafeArea(
        bottom: false,
        child: GetBuilder<SplashController>(builder: (splash) {
          return Column(
            children: [
              _buildFuturisticHeroBanner(),
              Expanded(child: _buildBodyForActiveKind(bottomNavClearance)),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildFuturisticHeroBanner() {
    return InkWell(
      onTap: () {
        final orderController = Get.find<OrderController>();
        OrderModel? activeOrder;
        if (orderController.runningOrderModel?.orders?.isNotEmpty == true) {
          activeOrder = orderController.runningOrderModel!.orders!.first;
        } else if (orderController.allOrderModel?.orders?.isNotEmpty == true) {
          activeOrder = orderController.allOrderModel!.orders!.first;
        }
        final int targetId = activeOrder?.id ?? 100003;
        Get.toNamed(
          RouteHelper.getGroceryTrackingFlowRoute(id: targetId),
          arguments: activeOrder,
        );
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 8, 16, 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [
              Color(0xFF0F172A),
              Color(0xFF1E293B),
              Color(0xFF064E3B),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF059669).withValues(alpha: 0.25),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF10B981), Color(0xFF059669)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF10B981).withValues(alpha: 0.4),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: const Center(
                child: Icon(Icons.delivery_dining_rounded, color: Colors.white, size: 26),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'Live 8-Stage Delivery Tracking',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'LIVE',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Real-time rider map & step-by-step order journey',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w400,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.arrow_forward_rounded,
                color: Color(0xFF34D399),
                size: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBodyForActiveKind(double bottomNavClearance) {
    switch(_activeKind) {
      case _ModuleKind.regular:
        return GetBuilder<OrderController>(builder: (orderController) {
          final PaginatedOrderModel? model = orderController.orderModelOf(_apiTypeOf(_selectedFilter));
          final List<OrderModel> orders = _ordersFor(orderController, _selectedFilter);
          final List<_DateGroup<OrderModel>> grouped = _groupByDate<OrderModel>(orders, (o) => o.createdAt);
          return _buildScroll(
            count: model?.totalSize ?? 0,
            isEmpty: grouped.isEmpty,
            emptyText: 'no_order_found'.tr,
            buildSection: (group) => _OrderDateSection(
              group: group,
              onConfirmDelete: _confirmDeleteOrder,
            ),
            groups: grouped,
            bottomClearance: bottomNavClearance,
          );
        });
      case _ModuleKind.taxi:
        return GetBuilder<TaxiOrderController>(builder: (taxiController) {
          final bool running = _selectedFilter != _OrderFilter.history;
          final dynamic model = running ? taxiController.tripModel : taxiController.tripHistoryModel;
          final List<TripDetailsModel> trips = List<TripDetailsModel>.from((model?.trips as List?) ?? const <TripDetailsModel>[]);
          trips.sort((a, b) => _compareDescByCreatedAt(a.createdAt, b.createdAt));
          final List<_DateGroup<TripDetailsModel>> grouped = _groupByDate<TripDetailsModel>(trips, (t) => t.createdAt);
          return _buildScroll(
            count: (model?.totalSize as int?) ?? 0,
            isEmpty: grouped.isEmpty,
            emptyText: 'no_trip_found'.tr,
            buildSection: (group) => _TripDateSection(group: group, onConfirmDelete: _confirmDeleteTrip),
            groups: grouped,
            bottomClearance: bottomNavClearance,
          );
        });
      case _ModuleKind.ride:
        return GetBuilder<RideController>(builder: (rideController) {
          final bool running = _selectedFilter != _OrderFilter.history;
          final dynamic model = running ? rideController.runningRideList : rideController.historyRideList;
          final List<RideDetails> rides = List<RideDetails>.from((model?.data as List?) ?? const <RideDetails>[]);
          rides.sort((a, b) => _compareDescByCreatedAt(a.createdAt, b.createdAt));
          final List<_DateGroup<RideDetails>> grouped = _groupByDate<RideDetails>(rides, (r) => r.createdAt);
          return _buildScroll(
            count: (model?.totalSize as int?) ?? 0,
            isEmpty: grouped.isEmpty,
            emptyText: 'no_ride_found'.tr,
            buildSection: (group) => _RideDateSection(group: group, onConfirmDelete: _confirmDeleteRide),
            groups: grouped,
            bottomClearance: bottomNavClearance,
          );
        });
      case _ModuleKind.service:
        return GetBuilder<BookingController>(builder: (bookingController) {
          final PaginatedBookingModel? model = bookingController.bookingModelOf(_bookingApiTypeOf(_selectedFilter));
          final List<BookingModel> bookings = List<BookingModel>.from(model?.bookings ?? <BookingModel>[]);
          bookings.sort((a, b) => _compareDescByCreatedAt(a.createdAt, b.createdAt));
          final List<_DateGroup<BookingModel>> grouped = _groupByDate<BookingModel>(bookings, (b) => b.createdAt);
          return _buildScroll(
            count: model?.totalSize ?? 0,
            isEmpty: grouped.isEmpty,
            emptyText: 'no_booking_found'.tr,
            buildSection: (group) => _BookingDateSection(group: group, onConfirmDelete: _confirmDeleteBooking),
            groups: grouped,
            bottomClearance: bottomNavClearance,
          );
        });
    }
  }

  Widget _buildScroll<T>({required int count, required bool isEmpty, required String emptyText, required Widget Function(_DateGroup<T> group) buildSection, required List<_DateGroup<T>> groups, required double bottomClearance,}) {
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: CustomScrollView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [

          SliverToBoxAdapter(
            child: _OrderModuleTabs(
              selectedVisibleIndex: _selectedVisibleIndex,
              onModuleSelected: _onModuleSelected,
            ),
          ),

          SliverToBoxAdapter(
            child: _OrderTypeFilterBar(
              selected: _selectedFilter,
              count: count,
              onSelected: _selectFilter,
              showAllChip: _activeKind == _ModuleKind.regular || _activeKind == _ModuleKind.service,
              kind: _activeKind,
            ),
          ),

          if(_isLoadingFirstPage && isEmpty) const SliverToBoxAdapter(child: _OrderListShimmer())
          else if(isEmpty) SliverFillRemaining(hasScrollBody: false, child: _EmptyOrderView(text: emptyText))
          else SliverList.builder(
            itemCount: groups.length,
            itemBuilder: (context, index) => buildSection(groups[index]),
          ),

          if(_isPaginating) const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: Dimensions.paddingSizeDefault),
              child: Center(child: SizedBox(
                height: 24, width: 24,
                child: CircularProgressIndicator(strokeWidth: 2.5),
              )),
            ),
          ),
        ],
      ),
    );
  }

  int _compareDescByCreatedAt(String? a, String? b) {
    final DateTime? da = _parseCreatedAt(a);
    final DateTime? db = _parseCreatedAt(b);
    if(da == null && db == null) return 0;
    if(da == null) return 1;
    if(db == null) return -1;
    return db.compareTo(da);
  }

  List<OrderModel> _ordersFor(OrderController controller, _OrderFilter filter) {
    final PaginatedOrderModel? model = switch(filter) {
      _OrderFilter.all => controller.allOrderModel,
      _OrderFilter.running => controller.runningOrderModel,
      _OrderFilter.history => controller.historyOrderModel,
    };
    final List<OrderModel> orders = List<OrderModel>.from(model?.orders ?? <OrderModel>[]);
    orders.sort((a, b) => _compareDescByCreatedAt(a.createdAt, b.createdAt));
    return orders;
  }

  List<_DateGroup<T>> _groupByDate<T>(List<T> items, String? Function(T) createdAtOf) {
    final Map<String, List<T>> map = <String, List<T>>{};
    final List<String> orderedKeys = <String>[];
    for(final T item in items) {
      final String key = _dateKey(createdAtOf(item));
      if(!map.containsKey(key)) {
        map[key] = <T>[];
        orderedKeys.add(key);
      }
      map[key]!.add(item);
    }
    return orderedKeys
        .map((key) => _DateGroup<T>(dateLabel: _dateLabelOf(key), items: map[key]!))
        .toList();
  }

  String _dateKey(String? createdAt) {
    final DateTime? date = _parseCreatedAt(createdAt);
    if(date == null) return '';
    return DateConverter.dateToDate(date);
  }

  String _dateLabelOf(String key) {
    if(key.isEmpty) return '';
    try {
      final DateTime date = DateTime.parse(key);
      final DateTime now = DateTime.now();
      final DateTime today = DateTime(now.year, now.month, now.day);
      final DateTime yesterday = today.subtract(const Duration(days: 1));
      final DateTime target = DateTime(date.year, date.month, date.day);
      if(target == today) return 'today'.tr;
      if(target == yesterday) return 'yesterday'.tr;
      return DateConverter.dateToReadableDate(date);
    } catch(_) {
      return key;
    }
  }

  DateTime? _parseCreatedAt(String? value) {
    if(value == null || value.isEmpty) return null;
    try {
      return DateTime.parse(value).toLocal();
    } catch(_) {
      try {
        return DateConverter.dateTimeStringToDate(value);
      } catch(_) {
        return null;
      }
    }
  }

  // confirmDismiss handler: shows confirm dialog, runs dummy delete API with loader,
  // returns true so Dismissible animates out. Local list removal happens in onDismissed.
  Future<bool> _confirmDeleteOrder(OrderModel order) async {
    final bool? confirmed = await Get.dialog<bool>(
      _DeleteOrderConfirmDialog(
        title: order.orderType != "parcel" ? 'delete_order_question'.tr : 'Delete this parcel?'.tr,
        subtitle: order.id != null ? 'Order #${order.id}' : '',
      ),
      barrierDismissible: true,
    );
    if(confirmed != true) return false;

    Get.dialog(const CustomLoaderWidget(), barrierDismissible: false);
    final bool ok = await Get.find<OrderController>().deleteOrder(order.id);
    if(Get.isDialogOpen ?? false) Get.back();

    if(!ok) {
      showCustomSnackBar('failed_to_delete_order'.tr);
      return false;
    }
    return true;
  }

  Future<bool> _confirmDeleteTrip(TripDetailsModel trip) async {
    final bool? confirmed = await Get.dialog<bool>(
      _DeleteOrderConfirmDialog(
        title: 'delete_trip_question'.tr,
        subtitle: trip.id != null ? '${'trip_id'.tr} #${trip.id}' : '',
      ),
      barrierDismissible: true,
    );
    if(confirmed != true) return false;

    Get.dialog(const CustomLoaderWidget(), barrierDismissible: false);
    final bool ok = await Get.find<TaxiOrderController>().deleteTrip(trip.id);
    if(Get.isDialogOpen ?? false) Get.back();

    if(!ok) {
      showCustomSnackBar('failed_to_delete_trip'.tr);
      return false;
    }
    return true;
  }

  Future<bool> _confirmDeleteRide(RideDetails ride) async {
    final bool? confirmed = await Get.dialog<bool>(
      _DeleteOrderConfirmDialog(
        title: 'delete_ride_question'.tr,
        subtitle: ride.refId != null ? '${'ride_id'.tr} #${ride.refId}' : '',
      ),
      barrierDismissible: true,
    );
    if(confirmed != true) return false;

    Get.dialog(const CustomLoaderWidget(), barrierDismissible: false);
    final bool ok = await Get.find<RideController>().deleteRide(ride.id);
    if(Get.isDialogOpen ?? false) Get.back();

    if(!ok) {
      showCustomSnackBar('failed_to_delete_ride'.tr);
      return false;
    }
    return true;
  }

  Future<bool> _confirmDeleteBooking(BookingModel booking) async {
    final bool? confirmed = await Get.dialog<bool>(
      _DeleteOrderConfirmDialog(
        title: 'delete_booking_question'.tr,
        subtitle: booking.id != null ? '${'booking'.tr} #${booking.displayId ?? ''}' : '',
      ),
      barrierDismissible: true,
    );
    if(confirmed != true) return false;

    Get.dialog(const CustomLoaderWidget(), barrierDismissible: false);
    final bool ok = await Get.find<BookingController>().deleteBooking(booking.id!);
    if(Get.isDialogOpen ?? false) Get.back();

    if(!ok) {
      showCustomSnackBar('failed_to_delete_booking'.tr);
      return false;
    }
    return true;
  }
}

class _DateGroup<T> {
  final String dateLabel;
  final List<T> items;
  const _DateGroup({required this.dateLabel, required this.items});
}


// Screen-local copy of dashboard's ModuleTabs.
// Indicator uses disabledColor tint so the selected pill is visible against
// the white module strip on this screen.
// Module tab strip — excludes taxi and ride-share modules.
class _OrderModuleTabs extends StatelessWidget {
  final int selectedVisibleIndex;
  final void Function(int visibleIndex, ModuleModel module) onModuleSelected;

  const _OrderModuleTabs({required this.selectedVisibleIndex, required this.onModuleSelected});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<SplashController>(builder: (splashController) {
      final List<ModuleModel> visibleModules = _visibleModulesFrom(splashController);
      if(visibleModules.length <= 1) return const SizedBox.shrink();

      final int safeSelected = selectedVisibleIndex >= visibleModules.length ? 0 : selectedVisibleIndex;

      return Container(
        height: 46,
        margin: const EdgeInsets.only(bottom: 6),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: visibleModules.length,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (context, index) {
            final ModuleModel module = visibleModules[index];
            final bool isSelected = index == safeSelected;
            final IconData icon = _moduleIcon(module.moduleType);

            return InkWell(
              onTap: () => onModuleSelected(index, module),
              borderRadius: BorderRadius.circular(24),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  gradient: isSelected
                      ? const LinearGradient(
                          colors: [Color(0xFF00A651), Color(0xFF059669)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : null,
                  color: isSelected ? null : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isSelected ? Colors.transparent : const Color(0xFFE2E8F0),
                    width: 1,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: const Color(0xFF00A651).withValues(alpha: 0.28),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ]
                      : [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      icon,
                      size: 15,
                      color: isSelected ? Colors.white : const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _moduleLabel(module.moduleName, module.moduleType ?? ''),
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                        color: isSelected ? Colors.white : const Color(0xFF334155),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      );
    });
  }

  IconData _moduleIcon(String? moduleType) {
    if (moduleType == AppConstants.food) return Icons.restaurant_rounded;
    if (moduleType == AppConstants.grocery) return Icons.shopping_basket_rounded;
    if (moduleType == AppConstants.ecommerce) return Icons.shopping_bag_rounded;
    if (moduleType == AppConstants.pharmacy) return Icons.local_pharmacy_rounded;
    if (moduleType == AppConstants.taxi) return Icons.local_taxi_rounded;
    if (moduleType == AppConstants.ride) return Icons.two_wheeler_rounded;
    if (moduleType == AppConstants.service) return Icons.home_repair_service_rounded;
    return Icons.category_rounded;
  }

  String _moduleLabel(String? moduleName, String moduleType) {
    if(moduleName != null && moduleName.trim().isNotEmpty) return moduleName;
    if(moduleType == AppConstants.food) return 'Food';
    if(moduleType == AppConstants.grocery) return 'Grocery';
    if(moduleType == AppConstants.ecommerce) return 'Shop';
    if(moduleType == AppConstants.pharmacy) return 'Pharmacy';
    return moduleType.isNotEmpty ? moduleType : 'Module';
  }
}


class _OrderTypeFilterBar extends StatelessWidget {
  final _OrderFilter selected;
  final int count;
  final ValueChanged<_OrderFilter> onSelected;
  final bool showAllChip;
  final _ModuleKind kind;

  const _OrderTypeFilterBar({
    required this.selected, required this.count, required this.onSelected, required this.showAllChip, required this.kind,
  });

  @override
  Widget build(BuildContext context) {
    final List<(_OrderFilter, String)> tabs = <(_OrderFilter, String)>[
      if(showAllChip) (_OrderFilter.all, 'all'.tr),
      (_OrderFilter.running, 'running'.tr),
      (_OrderFilter.history, 'history'.tr),
    ];

    return Container(
      height: 50,
      color: const Color(0xFFF8F9FA),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          _ResultCountBar(count: count, kind: kind),
          const Spacer(),
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: const Color(0xFFEDF2F7),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List<Widget>.generate(tabs.length, (index) {
                final (_OrderFilter filter, String label) = tabs[index];
                return _FilterSegmentButton(
                  label: label,
                  isSelected: filter == selected,
                  isLive: filter == _OrderFilter.running,
                  onTap: () => onSelected(filter),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterSegmentButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final bool isLive;
  final VoidCallback onTap;

  const _FilterSegmentButton({
    required this.label,
    required this.isSelected,
    this.isLive = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if(isLive) ...[
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: Color(0xFF10B981),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? const Color(0xFF0F172A) : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultCountBar extends StatelessWidget {
  final int count;
  final _ModuleKind kind;
  const _ResultCountBar({required this.count, required this.kind});

  @override
  Widget build(BuildContext context) {
    final String unit = switch(kind) {
      _ModuleKind.taxi => 'trips'.tr,
      _ModuleKind.ride => 'rides'.tr,
      _ModuleKind.service => 'bookings'.tr,
      _ModuleKind.regular => 'orders'.tr,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.receipt_long_rounded, size: 13, color: Color(0xFF00A651)),
          const SizedBox(width: 5),
          Text(
            '$count $unit',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1E293B),
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderDateSection extends StatelessWidget {
  final _DateGroup<OrderModel> group;
  final Future<bool> Function(OrderModel) onConfirmDelete;

  const _OrderDateSection({
    required this.group,
    required this.onConfirmDelete,
  });

  @override
  Widget build(BuildContext context) {
    final List<Widget> cards = <Widget>[];
    for(int i = 0; i < group.items.length; i++) {
      final OrderModel order = group.items[i];
      cards.add(order.orderType == 'parcel'
          ? _ParcelOrderItemCard(
              orderModel: order,
              onConfirmDelete: () => onConfirmDelete(order),
            )
          : _OrderItemCard(
              orderModel: order,
              onConfirmDelete: () => onConfirmDelete(order),
            ));
      if(i < group.items.length - 1) cards.add(const _OrderCardDivider());
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _OrderDateBand(label: group.dateLabel),
        ...cards,
      ],
    );
  }
}

class _TripDateSection extends StatelessWidget {
  final _DateGroup<TripDetailsModel> group;
  final Future<bool> Function(TripDetailsModel) onConfirmDelete;
  const _TripDateSection({required this.group, required this.onConfirmDelete});

  @override
  Widget build(BuildContext context) {
    final List<Widget> cards = <Widget>[];
    for(int i = 0; i < group.items.length; i++) {
      final TripDetailsModel trip = group.items[i];
      cards.add(_TripItemCard(
        trip: trip,
        onConfirmDelete: () => onConfirmDelete(trip),
      ));
      if(i < group.items.length - 1) cards.add(const _OrderCardDivider());
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _OrderDateBand(label: group.dateLabel),
        ...cards,
      ],
    );
  }
}

class _RideDateSection extends StatelessWidget {
  final _DateGroup<RideDetails> group;
  final Future<bool> Function(RideDetails) onConfirmDelete;
  const _RideDateSection({required this.group, required this.onConfirmDelete});

  @override
  Widget build(BuildContext context) {
    final List<Widget> cards = <Widget>[];
    for(int i = 0; i < group.items.length; i++) {
      final RideDetails ride = group.items[i];
      cards.add(_RideItemCard(
        ride: ride,
        onConfirmDelete: () => onConfirmDelete(ride),
      ));
      if(i < group.items.length - 1) cards.add(const _OrderCardDivider());
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _OrderDateBand(label: group.dateLabel),
        ...cards,
      ],
    );
  }
}

class _OrderCardDivider extends StatelessWidget {
  const _OrderCardDivider();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(height: 2);
  }
}

class _OrderDateBand extends StatelessWidget {
  final String label;
  const _OrderDateBand({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
      child: Row(
        children: [
          Expanded(child: Container(height: 1, color: const Color(0xFFE2E8F0))),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 10),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.event_note_rounded, size: 12, color: Color(0xFF64748B)),
                const SizedBox(width: 4),
                Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                    color: Color(0xFF475569),
                  ),
                ),
              ],
            ),
          ),
          Expanded(child: Container(height: 1, color: const Color(0xFFE2E8F0))),
        ],
      ),
    );
  }
}

class _OrderItemCard extends StatelessWidget {
  final OrderModel orderModel;
  final Future<bool> Function() onConfirmDelete;

  const _OrderItemCard({required this.orderModel, required this.onConfirmDelete});

  @override
  Widget build(BuildContext context) {
    final String status = (orderModel.orderStatus ?? '').toLowerCase();
    final bool canDelete = status == 'delivered' || status == 'canceled';
    final bool isRunning = status != 'delivered' && status != 'canceled' && status != 'failed';

    return Slidable(
      key: ValueKey<int?>(orderModel.id),
      endActionPane: canDelete ? _deleteActionPane(context, () async {
        final bool ok = await onConfirmDelete();
        if(ok) Get.find<OrderController>().removeOrderFromList(orderModel.id);
      }) : null,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isRunning
                ? const Color(0xFF00A651).withValues(alpha: 0.35)
                : const Color(0xFFEDF2F7),
            width: isRunning ? 1.2 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: isRunning
                  ? const Color(0xFF00A651).withValues(alpha: 0.08)
                  : const Color(0xFF0F172A).withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => Get.toNamed(RouteHelper.getOrderDetailsRoute(orderModel.id)),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top header: Store name + Status Pill
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Center(
                        child: Icon(Icons.storefront_rounded, size: 16, color: Color(0xFF00A651)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            orderModel.store?.name ?? 'Store'.tr,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          Row(
                            children: [
                              Text(
                                '${'order'.tr} #${orderModel.id ?? ''}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                              if (orderModel.createdAt != null) ...[
                                const Text(
                                  ' • ',
                                  style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                ),
                                Text(
                                  DateConverter.dateTimeStringToTime(orderModel.createdAt!),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    _ModernStatusBadge(status: orderModel.orderStatus ?? ''),
                  ],
                ),

                // Mini Stepper for active orders
                if (isRunning)
                  _OrderProgressMiniStepper(status: orderModel.orderStatus ?? ''),

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 10),
                  child: Divider(height: 1, color: Color(0xFFF1F5F9)),
                ),

                // Item info row: Image thumbnail + Name + Price
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    _ModernItemThumbnail(
                      image: ((orderModel.itemsPreview != null && orderModel.itemsPreview!.isNotEmpty)
                              ? orderModel.itemsPreview
                              : null)
                          ?.first
                          .imageFullUrl ?? '',
                      extraCount: (orderModel.itemCount ?? 1) - 1,
                    ),
                    const SizedBox(width: 12),

                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            orderModel.parcelCategory != null
                                ? (orderModel.parcelCategory?.name ?? '')
                                : (orderModel.itemNames != null && orderModel.itemNames!.isNotEmpty)
                                    ? orderModel.itemNames!.join(', ')
                                    : '${orderModel.detailsCount ?? 0} ${'items'.tr}',
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1E293B),
                              height: 1.3,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${orderModel.itemCount ?? orderModel.detailsCount ?? 1} ${'items'.tr}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(width: 10),

                    Text(
                      PriceConverter.convertPrice(orderModel.orderAmount ?? -1),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Bottom Action Buttons: [Details] and [Track Order / Reorder]
                _ModernOrderActions(orderModel: orderModel),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ModernItemThumbnail extends StatelessWidget {
  final String image;
  final int extraCount;

  const _ModernItemThumbnail({required this.image, required this.extraCount});

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: CustomImage(
              image: image,
              fit: BoxFit.cover,
            ),
          ),
        ),
        if (extraCount > 0)
          Positioned(
            right: -4,
            bottom: -4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.2),
                    blurRadius: 4,
                  ),
                ],
              ),
              child: Text(
                '+$extraCount',
                style: const TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ModernStatusBadge extends StatelessWidget {
  final String status;
  const _ModernStatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final String lower = status.toLowerCase();

    Color bg;
    Color border;
    Color text;
    IconData icon;
    String display = status.replaceAll('_', ' ').toTitleCase();

    if (lower == 'pending') {
      bg = const Color(0xFFFFF7ED);
      border = const Color(0xFFFFEDD5);
      text = const Color(0xFFEA580C);
      icon = Icons.hourglass_top_rounded;
      display = 'Order Placed';
    } else if (lower == 'confirmed' || lower == 'accepted') {
      bg = const Color(0xFFEFF6FF);
      border = const Color(0xFFDBEAFE);
      text = const Color(0xFF2563EB);
      icon = Icons.check_circle_outline_rounded;
      display = 'Confirmed';
    } else if (lower == 'processing' || lower == 'handover') {
      bg = const Color(0xFFFAF5FF);
      border = const Color(0xFFF3E8FF);
      text = const Color(0xFF7C3AED);
      icon = Icons.inventory_2_outlined;
      display = 'Preparing';
    } else if (lower == 'picked_up' || lower == 'out_for_delivery') {
      bg = const Color(0xFFECFDF5);
      border = const Color(0xFFA7F3D0);
      text = const Color(0xFF059669);
      icon = Icons.delivery_dining_rounded;
      display = 'On The Way';
    } else if (lower == 'delivered') {
      bg = const Color(0xFFF0FDF4);
      border = const Color(0xFFDCFCE7);
      text = const Color(0xFF16A34A);
      icon = Icons.check_circle_rounded;
      display = 'Delivered';
    } else if (lower == 'canceled' || lower == 'failed') {
      bg = const Color(0xFFFFF1F2);
      border = const Color(0xFFFFE4E6);
      text = const Color(0xFFE11D48);
      icon = Icons.cancel_outlined;
      display = 'Canceled';
    } else {
      bg = const Color(0xFFF1F5F9);
      border = const Color(0xFFE2E8F0);
      text = const Color(0xFF475569);
      icon = Icons.info_outline_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: text),
          const SizedBox(width: 4),
          Text(
            display,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: text,
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderProgressMiniStepper extends StatelessWidget {
  final String status;
  const _OrderProgressMiniStepper({required this.status});

  @override
  Widget build(BuildContext context) {
    final String lower = status.toLowerCase();
    int currentStep = 0;
    if (lower == 'pending') {
      currentStep = 0;
    } else if (lower == 'confirmed' || lower == 'accepted') {
      currentStep = 1;
    } else if (lower == 'processing' || lower == 'handover') {
      currentStep = 2;
    } else if (lower == 'picked_up' || lower == 'out_for_delivery') {
      currentStep = 3;
    } else if (lower == 'delivered') {
      currentStep = 4;
    } else {
      return const SizedBox.shrink();
    }

    if (currentStep >= 4) return const SizedBox.shrink();

    final List<String> stepNames = ['Placed', 'Confirmed', 'Packing', 'On The Way'];
    final List<IconData> stepIcons = [
      Icons.receipt_rounded,
      Icons.check_circle_rounded,
      Icons.inventory_2_rounded,
      Icons.delivery_dining_rounded,
    ];

    return Container(
      margin: const EdgeInsets.only(top: 10, bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFEDF2F7)),
      ),
      child: Column(
        children: [
          Row(
            children: List<Widget>.generate(4, (index) {
              final bool isDone = index < currentStep;
              final bool isCurrent = index == currentStep;
              const Color activeColor = Color(0xFF00A651);

              return Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDone
                            ? activeColor
                            : isCurrent
                                ? activeColor
                                : const Color(0xFFE2E8F0),
                        boxShadow: isCurrent
                            ? [
                                BoxShadow(
                                  color: activeColor.withValues(alpha: 0.4),
                                  blurRadius: 6,
                                  offset: const Offset(0, 1),
                                ),
                              ]
                            : null,
                      ),
                      child: Center(
                        child: isDone
                            ? const Icon(Icons.check, size: 12, color: Colors.white)
                            : isCurrent
                                ? Icon(stepIcons[index], size: 11, color: Colors.white)
                                : Container(
                                    width: 6,
                                    height: 6,
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Color(0xFF94A3B8),
                                    ),
                                  ),
                      ),
                    ),
                    if (index < 3)
                      Expanded(
                        child: Container(
                          height: 2,
                          color: index < currentStep
                              ? activeColor
                              : const Color(0xFFE2E8F0),
                        ),
                      ),
                  ],
                ),
              );
            }),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List<Widget>.generate(4, (index) {
              final bool isCurrent = index == currentStep;
              final bool isDone = index < currentStep;
              return Expanded(
                child: Text(
                  stepNames[index],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w600,
                    color: isCurrent
                        ? const Color(0xFF00A651)
                        : isDone
                            ? const Color(0xFF334155)
                            : const Color(0xFF94A3B8),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _ModernOrderActions extends StatelessWidget {
  final OrderModel orderModel;
  const _ModernOrderActions({required this.orderModel});

  static const Set<String> _trackable = <String>{
    'pending', 'confirmed', 'accepted', 'processing', 'handover',
    'picked_up', 'out_for_delivery',
  };

  @override
  Widget build(BuildContext context) {
    final String status = (orderModel.orderStatus ?? '').toLowerCase();
    final bool reorderEnabled = Get.find<SplashController>().configModel?.repeatOrderOption == 1;
    final bool isDelivered = status == 'delivered';
    final bool canTrack = _trackable.contains(status);

    return Row(
      children: [
        // Secondary Action: Details
        Expanded(
          child: InkWell(
            onTap: () => Get.toNamed(RouteHelper.getOrderDetailsRoute(orderModel.id)),
            borderRadius: BorderRadius.circular(10),
            child: Container(
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Center(
                child: Text(
                  'details'.tr,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF334155),
                  ),
                ),
              ),
            ),
          ),
        ),

        if (canTrack || (isDelivered && reorderEnabled)) ...[
          const SizedBox(width: 10),
          Expanded(
            flex: 1,
            child: InkWell(
              onTap: () {
                if (canTrack) {
                  Get.toNamed(
                    RouteHelper.getGroceryTrackingFlowRoute(id: orderModel.id ?? 100003),
                    arguments: orderModel,
                  );
                } else if (isDelivered && reorderEnabled) {
                  Get.find<OrderController>().reorder(orderModel);
                }
              },
              borderRadius: BorderRadius.circular(10),
              child: Container(
                height: 36,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF00A651), Color(0xFF059669)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF00A651).withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      canTrack ? Icons.radar_rounded : Icons.refresh_rounded,
                      size: 15,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      canTrack ? 'track_order'.tr : 'reorder'.tr,
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}


class _ParcelOrderItemCard extends StatelessWidget {
  final OrderModel orderModel;
  final Future<bool> Function() onConfirmDelete;

  const _ParcelOrderItemCard({required this.orderModel, required this.onConfirmDelete});

  @override
  Widget build(BuildContext context) {
    // Only delivered and canceled orders can be deleted.
    final String status = (orderModel.orderStatus ?? '').toLowerCase();
    final bool canDelete = status == 'delivered' || status == 'canceled';
    final bool isRunning = status != 'delivered' && status != 'canceled' && status != 'failed';

    // For a parcel, delivery_address is the sender and receiver_details the receiver.
    final sender = orderModel.deliveryAddress;
    final receiver = orderModel.receiverDetails;

    return Slidable(
      key: ValueKey<int?>(orderModel.id),
      endActionPane: canDelete ? _deleteActionPane(context, () async {
        final bool ok = await onConfirmDelete();
        if(ok) Get.find<OrderController>().removeOrderFromList(orderModel.id);
      }) : null,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isRunning
                ? const Color(0xFF00A651).withValues(alpha: 0.35)
                : const Color(0xFFEDF2F7),
            width: isRunning ? 1.2 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: isRunning
                  ? const Color(0xFF00A651).withValues(alpha: 0.08)
                  : const Color(0xFF0F172A).withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => Get.toNamed(RouteHelper.getOrderDetailsRoute(orderModel.id)),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: parcel category + id + status on the left, amount on the right.
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Center(
                        child: Icon(Icons.local_shipping_outlined, size: 16, color: Color(0xFF2563EB)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            orderModel.parcelCategory?.name ?? 'parcel'.tr,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '${'parcel'.tr} #${orderModel.id ?? ''}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF64748B),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    _ModernStatusBadge(status: orderModel.orderStatus ?? ''),
                  ],
                ),

                if (isRunning)
                  _OrderProgressMiniStepper(status: orderModel.orderStatus ?? ''),

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 10),
                  child: Divider(height: 1, color: Color(0xFFF1F5F9)),
                ),

                // Sender -> receiver addresses
                _ParcelAddressLine(
                  icon: Icons.circle_outlined,
                  label: sender?.addressType,
                  address: sender?.address ?? '',
                ),
                const SizedBox(height: 6),

                _ParcelAddressLine(
                  icon: Icons.location_on_rounded,
                  label: receiver?.addressType,
                  address: receiver?.address ?? '',
                ),

                const SizedBox(height: 12),

                // Amount & Actions
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Total Amount',
                          style: TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8)),
                        ),
                        Text(
                          PriceConverter.convertPrice(orderModel.orderAmount ?? -1),
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 14),
                    Expanded(child: _ModernOrderActions(orderModel: orderModel)),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// One address row of the parcel card: a leading icon, an optional bold type label
// (e.g. "Office :"), and the address. Label is hidden when the type is empty.
class _ParcelAddressLine extends StatelessWidget {
  final IconData icon;
  final String? label;
  final String address;

  const _ParcelAddressLine({required this.icon, required this.address, this.label});

  @override
  Widget build(BuildContext context) {
    final Color disabled = Theme.of(context).disabledColor;
    final bool hasLabel = label != null && label!.trim().isNotEmpty;

    return Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
      Icon(icon, size: 16, color: disabled),
      const SizedBox(width: Dimensions.paddingSizeSmall),

      Expanded(
        child: hasLabel
            ? Text.rich(
                TextSpan(
                  style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: disabled),
                  children: <InlineSpan>[
                    TextSpan(
                      text: '${label!.tr.toTitleCase()} : ',
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                      ),
                    ),
                    TextSpan(text: address),
                  ],
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              )
            : Text(
                address,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: disabled),
              ),
      ),
    ]);
  }
}

class _TripItemCard extends StatelessWidget {
  final TripDetailsModel trip;
  final Future<bool> Function() onConfirmDelete;
  const _TripItemCard({required this.trip, required this.onConfirmDelete});

  @override
  Widget build(BuildContext context) {
    final String status = trip.tripStatus ?? '';
    final bool isFailed = status == 'payment_failed';
    final Color statusColor = isFailed ? Colors.redAccent : Theme.of(context).primaryColor;
    final String quantityText = '${trip.quantity ?? 0} ${(trip.quantity ?? 0) > 1 ? 'vehicles'.tr : 'vehicle'.tr}';

    // Only confirmed and canceled trips can be deleted.
    final String statusLower = status.toLowerCase();
    final bool canDelete = statusLower == 'confirmed' || statusLower == 'canceled';

    return Padding(
      padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
      child: Slidable(
        key: ValueKey<int?>(trip.id),
        endActionPane: canDelete ? _deleteActionPane(context, () async {
          final bool ok = await onConfirmDelete();
          if(ok) Get.find<TaxiOrderController>().removeTripFromList(trip.id);
        }) : null,
        child: GestureDetector(
        onTap: () => Get.to(() => TaxiOrderDetailsScreen(tripId: trip.id!)),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeSmall, horizontal: Dimensions.paddingSizeDefault),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Text(
                  '${'trip_id'.tr}: #${trip.id ?? ''}',
                  style: robotoBlack.copyWith(fontSize: Dimensions.fontSizeSmall),
                ),
                const SizedBox(width: Dimensions.paddingSizeDefault),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Dimensions.paddingSizeSmall,
                    vertical: Dimensions.paddingSizeExtraSmall,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                    color: statusColor.withValues(alpha: 0.1),
                  ),
                  child: Text(
                    status.tr.toTitleCase(),
                    style: robotoMedium.copyWith(
                      fontSize: Dimensions.fontSizeExtraSmall,
                      color: statusColor,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  quantityText,
                  style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall),
                ),
              ]),
              const SizedBox(height: Dimensions.paddingSizeSmall),
              Row(
                children: [
                  Container(
                    height: 30, width: 30,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Theme.of(context).cardColor, width: 2),
                    ),
                    child: ClipOval(
                      child: CustomImage(image: trip.provider?.logoFullUrl ?? '', fit: BoxFit.cover),
                    ),
                  ),
                  const SizedBox(width: Dimensions.paddingSizeSmall),
                  Expanded(
                    child: Text(
                      trip.provider?.name ?? '',
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: Theme.of(context).disabledColor,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  CustomButton(
                    height: 32,
                    width: 90,
                    color: Theme.of(context).primaryColor,
                    buttonText: 'details'.tr,
                    onPressed: () => Get.to(() => TaxiOrderDetailsScreen(tripId: trip.id!)),
                    fontSize: Dimensions.fontSizeSmall,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}

class _RideItemCard extends StatelessWidget {
  final RideDetails ride;
  final Future<bool> Function() onConfirmDelete;
  const _RideItemCard({required this.ride, required this.onConfirmDelete});

  @override
  Widget build(BuildContext context) {
    final String status = ride.currentStatus ?? '';
    final bool isCancelled = status == AppConstants.cancelled;
    final Color statusColor = isCancelled ? Colors.redAccent : Theme.of(context).primaryColor;
    final String iconAsset = status == 'pending'
        ? Images.searchImageIcon
        : ride.vehicleCategory?.type == 'car' ? Images.car : Images.bikeTop;

    // Only cancelled and completed rides can be deleted.
    final bool canDelete = status == AppConstants.cancelled || status == AppConstants.completed;

    return Padding(
      padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
      child: Slidable(
        key: ValueKey<String?>(ride.id),
        endActionPane: canDelete ? _deleteActionPane(context, () async {
          final bool ok = await onConfirmDelete();
          if(ok) Get.find<RideController>().removeRideFromList(ride.id);
        }) : null,
        child: GestureDetector(
        onTap: () => _navigateForRide(ride),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeSmall, horizontal: Dimensions.paddingSizeDefault),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Text(
                  '${'ride_id'.tr}: #${ride.refId ?? ''}',
                  style: robotoBlack.copyWith(fontSize: Dimensions.fontSizeSmall),
                ),
                const SizedBox(width: Dimensions.paddingSizeDefault),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Dimensions.paddingSizeSmall,
                    vertical: Dimensions.paddingSizeExtraSmall,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                    color: statusColor.withValues(alpha: 0.1),
                  ),
                  child: Text(
                    status.tr.toTitleCase(),
                    style: robotoMedium.copyWith(
                      fontSize: Dimensions.fontSizeExtraSmall,
                      color: statusColor,
                    ),
                  ),
                ),
                const Spacer(),
              ]),
              const SizedBox(height: Dimensions.paddingSizeSmall),
              Row(
                children: [
                  Container(
                    height: 36, width: 36, alignment: Alignment.center,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      child: Image.asset(iconAsset, height: 36, width: 36, fit: BoxFit.cover),
                    ),
                  ),
                  const SizedBox(width: Dimensions.paddingSizeSmall),
                  Expanded(
                    child: Text(
                      (ride.vehicleCategory?.type ?? '').tr.toTitleCase(),
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: Theme.of(context).disabledColor,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  CustomButton(
                    height: 32,
                    width: 90,
                    color: Theme.of(context).primaryColor,
                    buttonText: 'details'.tr,
                    onPressed: () => _navigateForRide(ride),
                    fontSize: Dimensions.fontSizeSmall,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }

  Future<void> _navigateForRide(RideDetails ride) async {
    final bool isRunning = ride.currentStatus != AppConstants.completed
        && ride.currentStatus != AppConstants.cancelled;
    if(isRunning) {
      await Get.find<RideController>().getCurrentRideStatus(fromRefresh: true);
      return;
    }
    final bool unpaid = ride.paymentStatus == 'unpaid'
        && (ride.currentStatus == AppConstants.completed || ride.currentStatus == AppConstants.cancelled);
    if(unpaid) {
      if(ride.currentStatus == AppConstants.cancelled && ride.tripStatus?.ongoing == null) {
        Get.to(() => RideOrderCompleteScreen(tripId: ride.id!, fromRideList: true));
      } else {
        Get.find<RideController>().getFinalFare(ride.id!);
        Get.to(() => RidePaymentScreen(rideId: ride.id!));
      }
    } else {
      Get.to(() => RideOrderCompleteScreen(tripId: ride.id!, fromRideList: true));
    }
  }
}

class _BookingDateSection extends StatelessWidget {
  final _DateGroup<BookingModel> group;
  final Future<bool> Function(BookingModel) onConfirmDelete;
  const _BookingDateSection({required this.group, required this.onConfirmDelete});

  @override
  Widget build(BuildContext context) {
    final List<Widget> cards = <Widget>[];
    for(int i = 0; i < group.items.length; i++) {
      final BookingModel booking = group.items[i];
      cards.add(_BookingItemCard(bookingModel: booking, onConfirmDelete: () => onConfirmDelete(booking)));
      if(i < group.items.length - 1) cards.add(const _OrderCardDivider());
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _OrderDateBand(label: group.dateLabel),
        ...cards,
      ],
    );
  }
}

class _BookingItemCard extends StatelessWidget {
  final BookingModel bookingModel;
  final Future<bool> Function() onConfirmDelete;
  const _BookingItemCard({required this.bookingModel, required this.onConfirmDelete});

  @override
  Widget build(BuildContext context) {
    final String status = (bookingModel.bookingStatus ?? '').toLowerCase();
    final bool isHistory = status == 'completed' || status == 'canceled';
    final bool canDelete = isHistory;
    final bool showRebook = isHistory && bookingModel.canRebook == true;
    final List<String> names = bookingModel.serviceNames ?? const <String>[];
    final String servicesLabel = names.isEmpty
        ? '${bookingModel.detailsCount ?? 0} ${'services'.tr}'
        : names.length > 1 ? '${names.first} +${names.length - 1}' : names.first;

    return Slidable(
      key: ValueKey<int?>(bookingModel.id),
      endActionPane: canDelete ? _deleteActionPane(context, () async {
        final bool ok = await onConfirmDelete();
        if(ok) Get.find<BookingController>().removeBookingFromList(bookingModel.id);
      }) : null,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => Get.toNamed(RouteHelper.getBookingDetailsRoute(bookingModel.id)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeSmall, horizontal: Dimensions.paddingSizeDefault),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _BookingCardHeader(bookingModel: bookingModel),
              const SizedBox(height: Dimensions.paddingSizeSmall),
              Row(
                children: [
                  ImagePreviewWidget(image: bookingModel.provider?.logoFullUrl ?? '', extraCount: 0, imageSize: 40),
                  const SizedBox(width: Dimensions.paddingSizeSmall),

                  Expanded(child: Text(
                    servicesLabel,
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).disabledColor),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  )),

                  if (showRebook)
                    RebookButton(booking: bookingModel)
                  else
                    CustomButton(
                      height: 32,
                      width: 90,
                      color: Theme.of(context).primaryColor,
                      buttonText: 'details'.tr,
                      onPressed: () => Get.toNamed(RouteHelper.getBookingDetailsRoute(bookingModel.id)),
                      fontSize: Dimensions.fontSizeSmall,
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

class _BookingCardHeader extends StatelessWidget {
  final BookingModel bookingModel;
  const _BookingCardHeader({required this.bookingModel});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if(bookingModel.provider != null)
          Text(bookingModel.provider?.name ?? '',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault),
          ),
        Row(
          children: [
            Text('${'booking'.tr} #${bookingModel.displayId ?? bookingModel.id}',
              style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeExtraSmall, color: Theme.of(context).disabledColor),
            ),
            const SizedBox(width: Dimensions.paddingSizeDefault),
            StatusCard(orderStatus: (bookingModel.statusLabel?.trim().isNotEmpty ?? false) ? bookingModel.statusLabel! : (bookingModel.bookingStatus ?? '').tr),
            const Spacer(),
            Text(
              PriceConverter.convertPrice(bookingModel.bookingAmount ?? -1),
              style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault),
            ),
          ],
        ),
      ],
    );
  }
}

class _DeleteOrderConfirmDialog extends StatelessWidget {
  final String title;
  final String subtitle;
  const _DeleteOrderConfirmDialog({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
      ),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              CupertinoIcons.delete,
              size: 40,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: Dimensions.paddingSizeDefault),
            Text(
              title,
              textAlign: TextAlign.center,
              style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge),
            ),
            const SizedBox(height: Dimensions.paddingSizeSmall),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: robotoRegular.copyWith(
                fontSize: Dimensions.fontSizeSmall,
                color: Theme.of(context).disabledColor,
              ),
            ),
            const SizedBox(height: Dimensions.paddingSizeLarge),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Get.back(result: false),
                    style: TextButton.styleFrom(
                      backgroundColor: Theme.of(context).disabledColor.withAlpha(60),
                      minimumSize: const Size(double.infinity, 44),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      ),
                    ),
                    child: Text(
                      'no'.tr,
                      style: robotoBold.copyWith(
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: Dimensions.paddingSizeDefault),
                Expanded(
                  child: CustomButton(
                    buttonText: 'yes'.tr,
                    onPressed: () => Get.back(result: true),
                    height: 44,
                    radius: Dimensions.radiusSmall,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Shimmer placeholder shown while the first page is loading (data null/fetching)
// and for pagination — replaces the circular loaders so the list "fills in".
class _OrderListShimmer extends StatelessWidget {
  const _OrderListShimmer();

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      duration: const Duration(seconds: 2),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Padding(
          padding: EdgeInsets.symmetric(vertical: Dimensions.paddingSizeSmall),
          child: Center(child: _OrderShimmerBlock(width: 90, height: 12)),
        ),
        ...List<Widget>.generate(6, (_) => const _OrderShimmerCard()),
      ]),
    );
  }
}

// Mirrors the layout of [_OrderItemCard] so the shimmer matches the real card.
class _OrderShimmerCard extends StatelessWidget {
  const _OrderShimmerCard();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
      child: Padding(
        padding: EdgeInsets.all(Dimensions.paddingSizeSmall),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _OrderShimmerBlock(width: 140, height: 14),
          SizedBox(height: Dimensions.paddingSizeSmall),
          Row(children: [
            _OrderShimmerBlock(width: 70, height: 10),
            SizedBox(width: Dimensions.paddingSizeDefault),
            _OrderShimmerBlock(width: 60, height: 18),
            Spacer(),
            _OrderShimmerBlock(width: 50, height: 12),
          ]),
          SizedBox(height: Dimensions.paddingSizeSmall),
          Row(children: [
            _OrderShimmerBlock(width: 30, height: 30, circle: true),
            SizedBox(width: Dimensions.paddingSizeSmall),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _OrderShimmerBlock(width: 160, height: 10),
              SizedBox(height: 6),
              _OrderShimmerBlock(width: 100, height: 10),
            ])),
            SizedBox(width: Dimensions.paddingSizeSmall),
            _OrderShimmerBlock(width: 120, height: 40),
          ]),
        ]),
      ),
    );
  }
}

class _OrderShimmerBlock extends StatelessWidget {
  final double width;
  final double height;
  final bool circle;
  const _OrderShimmerBlock({required this.width, required this.height, this.circle = false});

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final Color color = isDark ? Colors.white.withValues(alpha: 0.18) : const Color(0xFFE9E9E9);
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: color,
        shape: circle ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: circle ? null : BorderRadius.circular(8),
      ),
    );
  }
}

class _EmptyOrderView extends StatelessWidget {
  final String text;
  const _EmptyOrderView({required this.text});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFF00A651).withValues(alpha: 0.2),
                  width: 2,
                ),
              ),
              child: const Center(
                child: Icon(Icons.shopping_bag_outlined, size: 40, color: Color(0xFF00A651)),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'no_orders_yet'.tr.isNotEmpty ? 'no_orders_yet'.tr : 'No Orders Found',
              style: robotoBold.copyWith(
                fontSize: 17,
                color: const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              text,
              textAlign: TextAlign.center,
              style: robotoRegular.copyWith(
                fontSize: 13,
                color: const Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 20),
            InkWell(
              onTap: () => Get.toNamed(RouteHelper.getInitialRoute()),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF00A651), Color(0xFF059669)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF00A651).withValues(alpha: 0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.shopping_cart_outlined, size: 16, color: Colors.white),
                    const SizedBox(width: 6),
                    Text(
                      'start_shopping'.tr.isNotEmpty ? 'start_shopping'.tr : 'Explore Stores',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
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
}

class StatusCard extends StatelessWidget {
  final String orderStatus;
  const StatusCard({super.key, required this.orderStatus});

  @override
  Widget build(BuildContext context) {
    return _ModernStatusBadge(status: orderStatus);
  }
}

class ImagePreviewWidget extends StatelessWidget {
  final String? image;
  final int extraCount;
  final double imageSize;

  const ImagePreviewWidget({super.key, required this.image, required this.extraCount, this.imageSize = 30});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: extraCount > 0 ? (imageSize * 2) - 5 : imageSize,
      height: imageSize,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            height: imageSize,
            width: imageSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Theme.of(context).cardColor, width: 2),
            ),
            child: ClipOval(child: CustomImage(image: image ?? '', fit: BoxFit.cover)),
          ),
          if(extraCount > 0) Positioned(
            left: imageSize - 5,
            child: Container(
              height: imageSize,
              width: imageSize,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Theme.of(context).cardColor,
              ),
              child: Text(
                '+$extraCount', textAlign: TextAlign.center, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeExtraSmall),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GuestTrackOrderView extends StatefulWidget {
  const _GuestTrackOrderView();

  @override
  State<_GuestTrackOrderView> createState() => _GuestTrackOrderViewState();
}

class _GuestTrackOrderViewState extends State<_GuestTrackOrderView> {
  final TextEditingController _orderIdController = TextEditingController();
  final TextEditingController _phoneNumberController = TextEditingController();
  final FocusNode _orderFocus = FocusNode();
  final FocusNode _phoneFocus = FocusNode();
  String? _countryDialCode;

  @override
  void initState() {
    super.initState();
    final String userDialCode = Get.find<AuthController>().getUserCountryCode();
    _countryDialCode = userDialCode.isNotEmpty
        ? userDialCode
        : CountryCode.fromCountryCode(Get.find<SplashController>().configModel!.country!).dialCode;
  }

  @override
  void dispose() {
    _orderIdController.dispose();
    _phoneNumberController.dispose();
    _orderFocus.dispose();
    _phoneFocus.dispose();
    super.dispose();
  }

  Future<void> _onTrackPressed(OrderController controller) async {
    final String phone = _phoneNumberController.text.trim();
    final String orderId = _orderIdController.text.trim();
    final String numberWithCountryCode = (_countryDialCode ?? '') + phone;
    final PhoneValid phoneValid = await CustomValidator.isPhoneValid(numberWithCountryCode);
    final String validatedNumber = phoneValid.phone;

    if(orderId.isEmpty) {
      showCustomSnackBar('please_enter_order_id'.tr);
      return;
    }
    if(phone.isEmpty) {
      showCustomSnackBar('enter_phone_number'.tr);
      return;
    }
    if(!phoneValid.isValid) {
      showCustomSnackBar('invalid_phone_number'.tr);
      return;
    }

    final response = await controller.trackOrder(
      orderId, null, false,
      contactNumber: validatedNumber, fromGuestInput: true,
    );
    if(response != null && response.isSuccess) {
      Get.toNamed(RouteHelper.getGuestTrackOrderScreen(orderId, validatedNumber));
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDesktop = ResponsiveHelper.isDesktop(context);
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Dimensions.radiusExtraLarge,
          vertical: Dimensions.paddingSizeLarge,
        ),
        child: Column(children: [
          CustomTextField(
            labelText: 'order_id'.tr,
            titleText: 'write_order_id'.tr,
            controller: _orderIdController,
            focusNode: _orderFocus,
            nextFocus: _phoneFocus,
            inputType: TextInputType.number,
            showTitle: isDesktop,
            required: true,
            validator: (value) => ValidateCheck.validateEmptyText(value, null),
          ),
          const SizedBox(height: Dimensions.paddingSizeExtraLarge),

          CustomTextField(
            titleText: 'enter_phone_number'.tr,
            labelText: 'phone'.tr,
            controller: _phoneNumberController,
            focusNode: _phoneFocus,
            inputType: TextInputType.phone,
            inputAction: TextInputAction.done,
            isPhone: true,
            showTitle: isDesktop,
            onCountryChanged: (CountryCode countryCode) => _countryDialCode = countryCode.dialCode,
            countryDialCode: _countryDialCode ?? Get.find<LocalizationController>().locale.countryCode,
            required: true,
            validator: (value) => ValidateCheck.validateEmptyText(value, null),
          ),
          const SizedBox(height: Dimensions.paddingSizeExtraLarge),

          GetBuilder<OrderController>(builder: (orderController) {
            return CustomButton(
              buttonText: 'track_order'.tr,
              isLoading: orderController.isLoading,
              width: isDesktop ? 300 : double.infinity,
              onPressed: () => _onTrackPressed(orderController),
            );
          }),

          // Reference link to the service-module booking tracker (guests can't otherwise track bookings).
          if (ModuleHelper.isActiveServiceModule()) ...[
            const SizedBox(height: Dimensions.paddingSizeDefault),
            TextButton(
              onPressed: () => Get.toNamed(RouteHelper.getBookingTrackRoute()),
              child: Text(
                'track_a_service_booking'.tr,
                style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).primaryColor),
              ),
            ),
          ],
        ]),
      ),
    );
  }
}
