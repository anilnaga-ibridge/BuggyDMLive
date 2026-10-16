import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_loader.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/common/widgets/menu_drawer.dart';
import 'package:sixam_mart/common/widgets/no_internet_screen.dart';
import 'package:sixam_mart/features/address/controllers/address_controller.dart';
import 'package:sixam_mart/features/address/domain/models/address_model.dart';
import 'package:sixam_mart/features/location/controllers/location_controller.dart';
import 'package:sixam_mart/features/location/domain/models/prediction_model.dart';
import 'package:sixam_mart/features/location/domain/models/zone_response_model.dart';
import 'package:sixam_mart/features/location/screens/pick_map_screen.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

class AccessLocationScreen extends StatefulWidget {
  final bool fromSignUp;
  final bool fromHome;
  final String? route;

  const AccessLocationScreen({
    super.key,
    required this.fromSignUp,
    required this.fromHome,
    required this.route,
  });

  @override
  State<AccessLocationScreen> createState() => _AccessLocationScreenState();
}

class _AccessLocationScreenState extends State<AccessLocationScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  bool _canExit = GetPlatform.isWeb ? true : false;
  List<PredictionModel> _suggestions = [];
  bool _isSearching = false;
  bool _loadingSuggestions = false;
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();

    if (AuthHelper.isLoggedIn()) {
      Get.find<AddressController>().getAddressList();
    }
    Get.find<LocationController>().loadRecentAddresses();

    checkInternet();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  void checkInternet() async {
    final List<ConnectivityResult> connectivityResult = await (Connectivity().checkConnectivity());
    bool isConnected = connectivityResult.contains(ConnectivityResult.wifi) ||
        connectivityResult.contains(ConnectivityResult.mobile);
    if (!isConnected) {
      Get.offAll(() => const NoInternetScreen());
    }
  }

  void _onSearchChanged(String query) {
    final trimmed = query.trim();
    if (trimmed.isEmpty) {
      _searchDebounce?.cancel();
      setState(() {
        _isSearching = false;
        _loadingSuggestions = false;
        _suggestions = [];
      });
      return;
    }

    setState(() {
      _isSearching = true;
      _loadingSuggestions = true;
    });

    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () async {
      try {
        final results = await Get.find<LocationController>().searchLocation(context, trimmed);
        if (!mounted) return;
        setState(() {
          _suggestions = results;
          _loadingSuggestions = false;
        });
      } catch (_) {
        if (!mounted) return;
        setState(() {
          _suggestions = [];
          _loadingSuggestions = false;
        });
      }
    });
  }

  Future<void> _onSuggestionSelected(PredictionModel suggestion) async {
    _searchFocusNode.unfocus();
    Get.dialog(const CustomLoaderWidget(), barrierDismissible: false);
    try {
      final AddressModel address = await Get.find<LocationController>().setLocation(
        suggestion.placeId,
        suggestion.description,
        null,
      );
      if (Get.isDialogOpen ?? false) Get.back();

      Get.find<LocationController>().saveAddressAndNavigate(
        address,
        widget.fromSignUp,
        widget.route,
        widget.route != null,
        ResponsiveHelper.isDesktop(Get.context!),
      );
    } catch (_) {
      if (Get.isDialogOpen ?? false) Get.back();
      showCustomSnackBar('failed_to_get_location_details'.tr);
    }
  }

  void _useCurrentLocation() {
    _searchFocusNode.unfocus();
    Get.find<LocationController>().checkPermission(() async {
      Get.dialog(const CustomLoaderWidget(), barrierDismissible: false);
      try {
        AddressModel address = await Get.find<LocationController>().getCurrentLocation(true);
        ZoneResponseModel response = await Get.find<LocationController>().getZone(
          address.latitude,
          address.longitude,
          false,
        );
        if (response.isSuccess) {
          Get.find<LocationController>().saveAddressAndNavigate(
            address,
            widget.fromSignUp,
            widget.route,
            widget.route != null,
            ResponsiveHelper.isDesktop(Get.context!),
          );
        } else {
          if (Get.isDialogOpen ?? false) Get.back();
          if (ResponsiveHelper.isDesktop(Get.context!)) {
            showGeneralDialog(
              context: Get.context!,
              pageBuilder: (ctx, anim1, anim2) => SizedBox(
                height: 400,
                width: 450,
                child: PickMapScreen(
                  fromSignUp: widget.fromSignUp,
                  canRoute: widget.route != null,
                  fromAddAddress: false,
                  route: widget.route ?? RouteHelper.accessLocation,
                ),
              ),
            );
          } else {
            Get.toNamed(RouteHelper.getPickMapRoute(widget.route ?? RouteHelper.accessLocation, widget.route != null));
            showCustomSnackBar('service_not_available_in_current_location'.tr);
          }
        }
      } catch (_) {
        if (Get.isDialogOpen ?? false) Get.back();
        showCustomSnackBar('failed_to_get_current_location'.tr);
      }
    });
  }

  void _openMapPicker() {
    _searchFocusNode.unfocus();
    if (ResponsiveHelper.isDesktop(Get.context!)) {
      showGeneralDialog(
        context: Get.context!,
        pageBuilder: (ctx, anim1, anim2) => SizedBox(
          height: 480,
          width: 500,
          child: PickMapScreen(
            fromSignUp: widget.fromSignUp,
            canRoute: widget.route != null,
            fromAddAddress: false,
            route: widget.route ?? RouteHelper.accessLocation,
          ),
        ),
      );
    } else {
      Get.toNamed(RouteHelper.getPickMapRoute(
        widget.route ?? (widget.fromSignUp ? RouteHelper.signUp : RouteHelper.accessLocation),
        widget.route != null,
      ));
    }
  }

  void _selectSavedAddress(AddressModel address) {
    _searchFocusNode.unfocus();
    Get.dialog(const CustomLoaderWidget(), barrierDismissible: false);
    Get.find<LocationController>().saveAddressAndNavigate(
      address,
      widget.fromSignUp,
      widget.route,
      widget.route != null,
      ResponsiveHelper.isDesktop(Get.context!),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final Color bgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final Color borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final Color textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final Color textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final bool canPop = widget.fromHome || (Navigator.canPop(context));

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, result) async {
        if (_canExit) {
          if (GetPlatform.isAndroid) {
            SystemNavigator.pop();
          } else if (GetPlatform.isIOS) {
            exit(0);
          } else {
            Navigator.pushNamed(context, RouteHelper.getInitialRoute());
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('back_press_again_to_exit'.tr, style: const TextStyle(color: Colors.white)),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
            margin: const EdgeInsets.all(Dimensions.paddingSizeSmall),
          ));
          _canExit = true;
          Timer(const Duration(seconds: 2), () {
            _canExit = false;
          });
        }
      },
      child: Scaffold(
        backgroundColor: bgColor,
        endDrawer: const MenuDrawer(),
        endDrawerEnableOpenDragGesture: false,
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(72),
          child: Container(
            decoration: BoxDecoration(
              color: cardBg,
              border: Border(
                bottom: BorderSide(color: borderColor, width: 1),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: SafeArea(
              bottom: false,
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 680),
                  padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
                  child: Row(
                    children: [
                      if (canPop) ...[
                        InkWell(
                          onTap: () {
                            if (Navigator.canPop(context)) {
                              Navigator.pop(context);
                            } else {
                              Get.offAllNamed(RouteHelper.getInitialRoute());
                            }
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            height: 40,
                            width: 40,
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.arrow_back_ios_new_rounded,
                              size: 17,
                              color: textPrimary,
                            ),
                          ),
                        ),
                        const SizedBox(width: Dimensions.paddingSizeDefault),
                      ],

                      // Location Icon Badge
                      Container(
                        height: 42,
                        width: 42,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              theme.primaryColor,
                              theme.primaryColor.withValues(alpha: 0.8),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(13),
                          boxShadow: [
                            BoxShadow(
                              color: theme.primaryColor.withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.location_on_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: Dimensions.paddingSizeSmall),

                      // Title & Subtitle
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'set_location'.tr,
                              style: robotoBold.copyWith(
                                fontSize: 17,
                                color: textPrimary,
                                letterSpacing: -0.3,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Select your delivery address',
                              style: robotoRegular.copyWith(
                                fontSize: 12,
                                color: textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        body: SafeArea(
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 680),
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: Dimensions.paddingSizeDefault,
                  vertical: Dimensions.paddingSizeDefault,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Search Location Input
                    _buildSearchBar(theme, isDark, cardBg, borderColor, textPrimary, textSecondary),
                    const SizedBox(height: Dimensions.paddingSizeDefault),

                    // Active Suggestions vs Normal Layout
                    if (_isSearching)
                      _buildSuggestionsSection(theme, isDark, cardBg, borderColor, textPrimary, textSecondary)
                    else ...[
                      // Quick Action Buttons (Current Location & Map)
                      _buildQuickActionCards(theme, isDark, cardBg, borderColor, textPrimary, textSecondary),
                      const SizedBox(height: Dimensions.paddingSizeLarge),

                      // Saved Addresses (if logged in)
                      _buildSavedAddressesSection(theme, isDark, cardBg, borderColor, textPrimary, textSecondary),

                      // Recent Searches (if available)
                      _buildRecentSearchesSection(theme, isDark, cardBg, borderColor, textPrimary, textSecondary),

                      const SizedBox(height: Dimensions.paddingSizeSmall),

                      // Trust & Speed Showcase Card
                      _buildTrustHeroCard(theme, isDark, cardBg, borderColor, textPrimary, textSecondary),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchBar(
    ThemeData theme,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _searchFocusNode.hasFocus ? theme.primaryColor : borderColor,
          width: _searchFocusNode.hasFocus ? 1.8 : 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        focusNode: _searchFocusNode,
        onChanged: _onSearchChanged,
        style: robotoMedium.copyWith(
          fontSize: 15,
          color: textPrimary,
        ),
        decoration: InputDecoration(
          hintText: 'Search area, street name, apartment...',
          hintStyle: robotoRegular.copyWith(
            fontSize: 14,
            color: textSecondary.withValues(alpha: 0.8),
          ),
          prefixIcon: Padding(
            padding: const EdgeInsets.only(left: 14, right: 10),
            child: Icon(
              CupertinoIcons.search,
              size: 20,
              color: theme.primaryColor,
            ),
          ),
          prefixIconConstraints: const BoxConstraints(minWidth: 44, minHeight: 44),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: Icon(
                    Icons.cancel_rounded,
                    size: 18,
                    color: textSecondary,
                  ),
                  onPressed: () {
                    _searchController.clear();
                    _onSearchChanged('');
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
        ),
      ),
    );
  }

  Widget _buildSuggestionsSection(
    ThemeData theme,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.near_me_outlined, size: 16, color: theme.primaryColor),
              const SizedBox(width: 6),
              Text(
                'Search Results',
                style: robotoBold.copyWith(
                  fontSize: 14,
                  color: textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: Dimensions.paddingSizeSmall),
          Divider(height: 1, color: borderColor),

          if (_loadingSuggestions)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 36),
              child: Center(
                child: Column(
                  children: [
                    SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(strokeWidth: 2.4, color: theme.primaryColor),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Searching locations...',
                      style: robotoRegular.copyWith(fontSize: 13, color: textSecondary),
                    ),
                  ],
                ),
              ),
            )
          else if (_suggestions.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 36),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.location_off_outlined, size: 38, color: textSecondary.withValues(alpha: 0.6)),
                    const SizedBox(height: 10),
                    Text(
                      'No matching places found',
                      style: robotoMedium.copyWith(fontSize: 14, color: textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Try searching with city, colony, or pin code',
                      style: robotoRegular.copyWith(fontSize: 12, color: textSecondary),
                    ),
                  ],
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _suggestions.length,
              separatorBuilder: (ctx, idx) => Divider(height: 1, color: borderColor.withValues(alpha: 0.5)),
              itemBuilder: (context, index) {
                final item = _suggestions[index];
                final String mainText = item.structuredFormat?.mainText?.text ??
                    item.description?.split(',').first.trim() ??
                    '';
                final String secondaryText = item.structuredFormat?.secondaryText?.text ??
                    (item.description != null && item.description!.contains(',')
                        ? item.description!.substring(item.description!.indexOf(',') + 1).trim()
                        : '');

                return InkWell(
                  onTap: () => _onSuggestionSelected(item),
                  borderRadius: BorderRadius.circular(10),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          margin: const EdgeInsets.only(top: 2),
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            color: theme.primaryColor.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.location_on_rounded,
                            size: 16,
                            color: theme.primaryColor,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                mainText.isNotEmpty ? mainText : (item.description ?? ''),
                                style: robotoMedium.copyWith(
                                  fontSize: 14,
                                  color: textPrimary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (secondaryText.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  secondaryText,
                                  style: robotoRegular.copyWith(
                                    fontSize: 12,
                                    color: textSecondary,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 13,
                          color: textSecondary.withValues(alpha: 0.5),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCards(
    ThemeData theme,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Column(
      children: [
        // Primary Card: Use Current Location (GPS)
        InkWell(
          onTap: _useCurrentLocation,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                    : [Colors.white, const Color(0xFFF0FDF4)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: theme.primaryColor.withValues(alpha: 0.35),
                width: 1.4,
              ),
              boxShadow: [
                BoxShadow(
                  color: theme.primaryColor.withValues(alpha: 0.12),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  height: 48,
                  width: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [theme.primaryColor, theme.primaryColor.withValues(alpha: 0.85)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: theme.primaryColor.withValues(alpha: 0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.my_location_rounded,
                    color: Colors.white,
                    size: 23,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              'user_current_location'.tr,
                              style: robotoBold.copyWith(
                                fontSize: 15,
                                color: textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: theme.primaryColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'GPS',
                              style: robotoBold.copyWith(
                                fontSize: 10,
                                color: theme.primaryColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Using GPS • Instant detection & delivery lookup',
                        style: robotoRegular.copyWith(
                          fontSize: 12,
                          color: textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 15,
                  color: theme.primaryColor,
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),

        // Secondary Card: Set from Map
        InkWell(
          onTap: _openMapPicker,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: borderColor, width: 1.2),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  height: 48,
                  width: 48,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.map_outlined,
                    color: isDark ? Colors.white : const Color(0xFF334155),
                    size: 23,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'set_from_map'.tr,
                        style: robotoBold.copyWith(
                          fontSize: 15,
                          color: textPrimary,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Pinpoint exact location on interactive map',
                        style: robotoRegular.copyWith(
                          fontSize: 12,
                          color: textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 15,
                  color: textSecondary,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSavedAddressesSection(
    ThemeData theme,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    if (!AuthHelper.isLoggedIn()) return const SizedBox();

    return GetBuilder<AddressController>(
      builder: (addressController) {
        final addressList = addressController.addressList;
        if (addressList == null || addressList.isEmpty) return const SizedBox();

        return Container(
          margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeLarge),
          padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: borderColor, width: 1.2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.bookmark_outline_rounded, size: 18, color: theme.primaryColor),
                  const SizedBox(width: 6),
                  Text(
                    'Saved Addresses',
                    style: robotoBold.copyWith(
                      fontSize: 15,
                      color: textPrimary,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${addressList.length}',
                      style: robotoMedium.copyWith(fontSize: 11, color: textSecondary),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Dimensions.paddingSizeSmall),
              Divider(height: 1, color: borderColor),
              const SizedBox(height: 6),

              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: addressList.length,
                separatorBuilder: (ctx, idx) => Divider(height: 1, color: borderColor.withValues(alpha: 0.5)),
                itemBuilder: (context, index) {
                  final addr = addressList[index];
                  final String type = (addr.addressType ?? 'other').toLowerCase();

                  IconData iconData = Icons.location_on_outlined;
                  if (type.contains('home')) {
                    iconData = Icons.home_rounded;
                  } else if (type.contains('office') || type.contains('work')) {
                    iconData = Icons.work_rounded;
                  }

                  return InkWell(
                    onTap: () => _selectSavedAddress(addr),
                    borderRadius: BorderRadius.circular(10),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 4),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: theme.primaryColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(iconData, size: 18, color: theme.primaryColor),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  (addr.addressType ?? 'Address').toUpperCase(),
                                  style: robotoBold.copyWith(fontSize: 12, color: theme.primaryColor),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  addr.address ?? '',
                                  style: robotoRegular.copyWith(fontSize: 13, color: textPrimary),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(Icons.arrow_forward_ios_rounded, size: 13, color: textSecondary.withValues(alpha: 0.5)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRecentSearchesSection(
    ThemeData theme,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return GetBuilder<LocationController>(
      builder: (locController) {
        final recent = locController.recentAddresses;
        if (recent.isEmpty) return const SizedBox();

        return Container(
          margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeLarge),
          padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: borderColor, width: 1.2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.history_rounded, size: 18, color: textSecondary),
                  const SizedBox(width: 6),
                  Text(
                    'Recent Locations',
                    style: robotoBold.copyWith(
                      fontSize: 15,
                      color: textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Dimensions.paddingSizeSmall),
              Divider(height: 1, color: borderColor),
              const SizedBox(height: 6),

              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: recent.take(4).length,
                separatorBuilder: (ctx, idx) => Divider(height: 1, color: borderColor.withValues(alpha: 0.5)),
                itemBuilder: (context, index) {
                  final addr = recent[index];
                  return InkWell(
                    onTap: () => _selectSavedAddress(addr),
                    borderRadius: BorderRadius.circular(10),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                      child: Row(
                        children: [
                          Icon(Icons.access_time_rounded, size: 16, color: textSecondary),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              addr.address ?? '',
                              style: robotoRegular.copyWith(fontSize: 13, color: textPrimary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(Icons.north_west_rounded, size: 13, color: textSecondary.withValues(alpha: 0.5)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTrustHeroCard(
    ThemeData theme,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.03),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          // Ambient Graphic Backdrop
          Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 130,
                height: 130,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      theme.primaryColor.withValues(alpha: 0.15),
                      theme.primaryColor.withValues(alpha: 0.03),
                      Colors.transparent,
                    ],
                    stops: const [0.35, 0.7, 1.0],
                  ),
                ),
              ),
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                  border: Border.all(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                    width: 1.5,
                  ),
                ),
                child: ClipOval(
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Image.asset(Images.deliveryLocation, fit: BoxFit.contain),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Text(
            'find_stores_and_items'.tr,
            textAlign: TextAlign.center,
            style: robotoBold.copyWith(
              fontSize: 17,
              letterSpacing: -0.3,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'by_allowing_location_access'.tr,
            textAlign: TextAlign.center,
            style: robotoRegular.copyWith(
              fontSize: 12.5,
              color: textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),

          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              _buildTrustBadge(Icons.bolt_rounded, 'Instant Delivery', theme, isDark),
              _buildTrustBadge(Icons.storefront_rounded, 'Curated Stores', theme, isDark),
              _buildTrustBadge(Icons.verified_rounded, 'Live Tracking', theme, isDark),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTrustBadge(IconData icon, String label, ThemeData theme, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: theme.primaryColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: robotoMedium.copyWith(
              fontSize: 11,
              color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
            ),
          ),
        ],
      ),
    );
  }
}
