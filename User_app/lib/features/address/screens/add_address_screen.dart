import 'package:country_code_picker/country_code_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:phone_numbers_parser/phone_numbers_parser.dart';
import 'package:sixam_mart/common/controllers/theme_controller.dart';
import 'package:sixam_mart/features/language/controllers/language_controller.dart';
import 'package:sixam_mart/features/location/controllers/location_controller.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/features/profile/controllers/profile_controller.dart';
import 'package:sixam_mart/features/address/controllers/address_controller.dart';
import 'package:sixam_mart/features/address/domain/models/address_model.dart';
import 'package:sixam_mart/features/auth/controllers/auth_controller.dart';
import 'package:sixam_mart/features/location/widgets/permission_dialog_widget.dart';
import 'package:sixam_mart/helper/address_helper.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/custom_validator.dart';
import 'package:sixam_mart/helper/debouncer.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';
import 'package:sixam_mart/common/widgets/code_picker_widget.dart';
import 'package:sixam_mart/common/widgets/custom_app_bar.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/common/widgets/footer_view.dart';
import 'package:sixam_mart/common/widgets/menu_drawer.dart';
import 'package:sixam_mart/features/location/screens/pick_map_screen.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:get/get.dart';

class AddAddressScreen extends StatefulWidget {
  final bool fromCheckout;
  final bool fromRide;
  final AddressModel? address;
  final int? zoneId;
  final bool forGuest;
  final bool fromNavBar;
  const AddAddressScreen({super.key, required this.fromCheckout, required this.fromRide, this.address, this.zoneId, this.forGuest = false, this.fromNavBar = false});

  @override
  State<AddAddressScreen> createState() => _AddAddressScreenState();
}

class _AddAddressScreenState extends State<AddAddressScreen> {
  final TextEditingController _levelController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _contactPersonNameController = TextEditingController();
  final TextEditingController _contactPersonNumberController = TextEditingController();
  final TextEditingController _streetNumberController = TextEditingController();
  final TextEditingController _houseController = TextEditingController();
  final TextEditingController _floorController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final FocusNode _addressNode = FocusNode();
  final FocusNode _levelNode = FocusNode();
  final FocusNode _nameNode = FocusNode();
  final FocusNode _numberNode = FocusNode();
  final FocusNode _streetNode = FocusNode();
  final FocusNode _houseNode = FocusNode();
  final FocusNode _floorNode = FocusNode();
  final FocusNode _emailFocus = FocusNode();
  CameraPosition? _cameraPosition;
  late LatLng _initialPosition;
  bool _otherSelect = false;
  final Debouncer _idleDebouncer = Debouncer(delay: const Duration(milliseconds: AppConstants.idleDebounceDuration));
  String? _countryDialCode = Get.find<AuthController>().getUserCountryCode().isNotEmpty ? Get.find<AuthController>().getUserCountryCode()
      : CountryCode.fromCountryCode(Get.find<SplashController>().configModel!.country!).dialCode;

  @override
  void initState() {
    super.initState();
    initCall();

    if(widget.address != null) {
      splitPhoneNumber(widget.address!.contactPersonNumber!);
      _contactPersonNameController.text = widget.address!.contactPersonName ?? '';
      _emailController.text = widget.address!.email ?? '';
      _streetNumberController.text = widget.address!.streetNumber ?? '';
      _houseController.text = widget.address!.house ?? '';
      _floorController.text = widget.address!.floor ?? '';

    }else if(Get.find<ProfileController>().userInfoModel != null && _contactPersonNameController.text.isEmpty) {
      _contactPersonNameController.text = '${Get.find<ProfileController>().userInfoModel!.fName} ${Get.find<ProfileController>().userInfoModel!.lName}';
      splitPhoneNumber(Get.find<ProfileController>().userInfoModel!.phone!);
    }

  }

  void initCall(){

    Get.find<LocationController>().setAddressTypeIndex(0, isUpdate: false);
    if(AuthHelper.isLoggedIn() && Get.find<ProfileController>().userInfoModel == null) {
      Get.find<ProfileController>().getUserInfo();
    }
    if(widget.address == null) {
      _initialPosition = LatLng(
        double.parse(Get.find<SplashController>().configModel!.defaultLocation!.lat ?? '0'),
        double.parse(Get.find<SplashController>().configModel!.defaultLocation!.lng ?? '0'),
      );
    }else {
      Get.find<LocationController>().setUpdateAddress(widget.address!);
      _initialPosition = LatLng(
        double.parse(widget.address!.latitude ?? '0'),
        double.parse(widget.address!.longitude ?? '0'),
      );

      if(widget.address!.addressType == 'home') {
        Get.find<LocationController>().setAddressTypeIndex(0, isUpdate: false);
      } else if (widget.address!.addressType == 'office') {
        Get.find<LocationController>().setAddressTypeIndex(1, isUpdate: false);
      } else {
        Get.find<LocationController>().setAddressTypeIndex(2, isUpdate: false);
        _levelController.text = widget.address!.addressType!;
        _otherSelect = true;
      }
    }
  }

  @override
  void dispose() {
    _idleDebouncer.dispose();
    super.dispose();
  }

  void splitPhoneNumber(String number) async {
    try {
      PhoneNumber phoneNumber = PhoneNumber.parse(number);
      _countryDialCode = '+${phoneNumber.countryCode}';
      _contactPersonNumberController.text = phoneNumber.international.substring(_countryDialCode!.length);
    } catch (e) {
      debugPrint('number can\'t parse : $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Get.isDarkMode;
    final Color bgColor = isDark ? Theme.of(context).scaffoldBackgroundColor : const Color(0xFFF8FAFC);

    return Scaffold(
      backgroundColor: bgColor,
      endDrawer: const MenuDrawer(), endDrawerEnableOpenDragGesture: false,
      appBar: CustomAppBar(title: widget.forGuest ? 'set_address'.tr : widget.address == null ? 'add_new_address'.tr : 'update_address'.tr),
      body: SafeArea(
        child: GetBuilder<ProfileController>(builder: (profileController) {
          return GetBuilder<LocationController>(builder: (locationController) {
            String addr = locationController.address ?? '';
            if (addr.toLowerCase().contains('unknown location') || addr.trim().isEmpty) {
              final saved = AddressHelper.getUserAddressFromSharedPref()?.address;
              addr = (saved != null && !saved.toLowerCase().contains('unknown location')) ? saved : 'H.No. 45, Sector 62, Noida 201301';
            }
            _addressController.text = addr;

            return ResponsiveHelper.isDesktop(context)
                ? SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
                    child: FooterView(
                      child: Center(
                        child: SizedBox(
                          width: Dimensions.webMaxWidth,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                margin: const EdgeInsets.only(bottom: 24),
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).primaryColor.withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: Theme.of(context).primaryColor.withValues(alpha: 0.2),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).primaryColor,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.add_location_alt_rounded, color: Colors.white, size: 22),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            widget.forGuest
                                                ? "set_address".tr
                                                : widget.address == null
                                                    ? "add_new_address".tr
                                                    : "update_address".tr,
                                            style: robotoBold.copyWith(fontSize: 18, color: Theme.of(context).textTheme.bodyLarge?.color),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            "Pin your exact location and provide delivery instructions for seamless drop-off",
                                            style: robotoRegular.copyWith(fontSize: 13, color: Theme.of(context).disabledColor),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Left column: Interactive Map Card + Save Address As
                                  Expanded(
                                    flex: 5,
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        _buildMapCard(context, locationController, isDesktop: true),
                                        const SizedBox(height: 20),
                                        _buildSaveAsSection(context, locationController),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 24),
                                  // Right column: Address Details + Contact Details + Action Button
                                  Expanded(
                                    flex: 6,
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        _buildAddressDetailsCard(context, locationController),
                                        const SizedBox(height: 20),
                                        _buildContactDetailsCard(context, locationController),
                                        const SizedBox(height: 20),
                                        _buildBottomActionBar(context, locationController, isDesktop: true),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  )
            : Column(children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                  child: Center(
                    child: SizedBox(
                      width: Dimensions.webMaxWidth,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildMapCard(context, locationController),
                          const SizedBox(height: 16),
                          _buildSaveAsSection(context, locationController),
                          const SizedBox(height: 16),
                          _buildAddressDetailsCard(context, locationController),
                          const SizedBox(height: 16),
                          _buildContactDetailsCard(context, locationController),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              _buildBottomActionBar(context, locationController),
            ]);
          });
        }) ,
      ),
    );
  }

  void _openPickMap(LocationController locationController) {
    if (ResponsiveHelper.isDesktop(Get.context)) {
      Get.dialog(
        Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          insetPadding: const EdgeInsets.symmetric(horizontal: 40, vertical: 30),
          clipBehavior: Clip.antiAlias,
          child: SizedBox(
            width: 800,
            height: 560,
            child: PickMapScreen(
              fromSignUp: false,
              canRoute: false,
              fromAddAddress: true,
              route: null,
              googleMapController: locationController.mapController,
            ),
          ),
        ),
      );
    } else {
      Get.toNamed(
        RouteHelper.getPickMapRoute('add-address', false),
        arguments: PickMapScreen(
          fromAddAddress: true,
          fromSignUp: false,
          googleMapController: locationController.mapController,
          route: null,
          canRoute: false,
        ),
      );
    }
  }

  Widget _buildMapCard(BuildContext context, LocationController locationController, {bool isDesktop = false}) {
    final bool isDark = Get.isDarkMode;
    final primaryColor = Theme.of(context).primaryColor;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Theme.of(context).disabledColor.withValues(alpha: 0.2) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: isDesktop ? 260 : 165,
            decoration: const BoxDecoration(
              borderRadius: BorderRadius.vertical(top: Radius.circular(15)),
            ),
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
              child: Stack(
                children: [
                  GoogleMap(
                    initialCameraPosition: CameraPosition(target: _initialPosition, zoom: 16),
                    minMaxZoomPreference: const MinMaxZoomPreference(0, 16),
                    onTap: (latLng) => _openPickMap(locationController),
                    zoomControlsEnabled: false,
                    compassEnabled: false,
                    indoorViewEnabled: true,
                    mapToolbarEnabled: false,
                    onCameraIdle: () {
                      _idleDebouncer.run(() {
                        if (!mounted) return;
                        locationController.updatePosition(_cameraPosition, true);
                      });
                    },
                    onCameraMove: (position) => _cameraPosition = position,
                    onMapCreated: (GoogleMapController controller) {
                      locationController.setMapController(controller);
                      if (widget.address == null) {
                        locationController.getCurrentLocation(true, mapController: controller);
                      }
                    },
                    myLocationButtonEnabled: false,
                    style: isDark ? Get.find<ThemeController>().darkMap : Get.find<ThemeController>().lightMap,
                    gestureRecognizers: <Factory<OneSequenceGestureRecognizer>>{
                      Factory<OneSequenceGestureRecognizer>(() => EagerGestureRecognizer()),
                      Factory<PanGestureRecognizer>(() => PanGestureRecognizer()),
                      Factory<ScaleGestureRecognizer>(() => ScaleGestureRecognizer()),
                      Factory<TapGestureRecognizer>(() => TapGestureRecognizer()),
                      Factory<VerticalDragGestureRecognizer>(() => VerticalDragGestureRecognizer()),
                    },
                  ),
                  if (locationController.loading)
                    const Center(child: CircularProgressIndicator())
                  else
                    Center(
                      child: Image.asset(Images.pickMarker, height: 48, width: 48),
                    ),

                  Positioned(
                    top: 10,
                    right: 10,
                    child: InkWell(
                      onTap: () => _openPickMap(locationController),
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.15),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.edit_location_alt_rounded, size: 14, color: primaryColor),
                            const SizedBox(width: 4),
                            Text(
                              'Change Pin',
                              style: robotoMedium.copyWith(fontSize: 12, color: primaryColor),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  Positioned(
                    bottom: 10,
                    right: 10,
                    child: InkWell(
                      onTap: () => _checkPermission(() {
                        locationController.getCurrentLocation(true, mapController: locationController.mapController);
                      }),
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.15),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Icon(Icons.my_location_rounded, color: primaryColor, size: 18),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          InkWell(
            onTap: () => _openPickMap(locationController),
            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(15)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: primaryColor.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.location_on_rounded, size: 18, color: primaryColor),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pin Location on Map',
                          style: robotoRegular.copyWith(fontSize: 11, color: Theme.of(context).disabledColor),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _addressController.text.isNotEmpty ? _addressController.text : 'add_the_location_correctly'.tr,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: robotoMedium.copyWith(
                            fontSize: 13,
                            color: Theme.of(context).textTheme.bodyLarge?.color,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(Icons.chevron_right_rounded, size: 20, color: Theme.of(context).disabledColor),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSaveAsSection(BuildContext context, LocationController locationController) {
    return _buildSectionCard(
      context: context,
      title: 'label_as'.tr,
      icon: Icons.bookmark_outline_rounded,
      subtitle: 'Select a tag for faster checkout',
      children: [
        Column(
          children: [
            _buildAddressTypeChip(
              context: context,
              index: 0,
              label: 'home'.tr,
              icon: Icons.home_rounded,
              isSelected: locationController.addressTypeIndex == 0,
              onTap: () {
                setState(() => _otherSelect = false);
                locationController.setAddressTypeIndex(0);
              },
            ),
            const SizedBox(height: 10),
            _buildAddressTypeChip(
              context: context,
              index: 1,
              label: 'office'.tr,
              icon: Icons.work_rounded,
              isSelected: locationController.addressTypeIndex == 1,
              onTap: () {
                setState(() => _otherSelect = false);
                locationController.setAddressTypeIndex(1);
              },
            ),
            const SizedBox(height: 10),
            _buildAddressTypeChip(
              context: context,
              index: 2,
              label: 'others'.tr,
              icon: Icons.location_on_rounded,
              isSelected: locationController.addressTypeIndex == 2,
              onTap: () {
                setState(() => _otherSelect = true);
                locationController.setAddressTypeIndex(2);
              },
            ),
          ],
        ),
        if (_otherSelect) ...[
          const SizedBox(height: 14),
          _buildInputField(
            context: context,
            label: '${'level_name'.tr} (${'optional'.tr})',
            hintText: "e.g. Dad's House, Gym, Friend",
            prefixIcon: Icons.edit_note_rounded,
            controller: _levelController,
            focusNode: _levelNode,
            nextFocus: _addressNode,
            capitalization: TextCapitalization.words,
          ),
        ],
      ],
    );
  }

  Widget _buildAddressTypeChip({
    required BuildContext context,
    required int index,
    required String label,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final primaryColor = Theme.of(context).primaryColor;
    final isDark = Get.isDarkMode;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? primaryColor.withValues(alpha: isDark ? 0.15 : 0.08)
              : (isDark ? Theme.of(context).cardColor : Colors.white),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? primaryColor
                : (isDark ? Theme.of(context).disabledColor.withValues(alpha: 0.2) : const Color(0xFFE2E8F0)),
            width: isSelected ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSelected ? primaryColor : (isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                size: 18,
                color: isSelected ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF64748B)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: robotoMedium.copyWith(
                  fontSize: 14,
                  color: isSelected ? primaryColor : (isDark ? Colors.white : const Color(0xFF1E293B)),
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ),
            Icon(
              isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
              size: 20,
              color: isSelected ? primaryColor : Theme.of(context).disabledColor.withValues(alpha: 0.6),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField({
    required BuildContext context,
    required String label,
    required String hintText,
    required TextEditingController controller,
    FocusNode? focusNode,
    FocusNode? nextFocus,
    TextInputType inputType = TextInputType.text,
    TextInputAction inputAction = TextInputAction.next,
    IconData? prefixIcon,
    Widget? prefixWidget,
    Widget? suffixWidget,
    bool isRequired = false,
    bool readOnly = false,
    VoidCallback? onTap,
    Function(String)? onChanged,
    TextCapitalization capitalization = TextCapitalization.none,
  }) {
    final bool isDark = Get.isDarkMode;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: robotoMedium.copyWith(
                fontSize: 13,
                color: isDark ? Colors.white70 : const Color(0xFF475569),
              ),
            ),
            if (isRequired)
              const Text(' *', style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 6),
        Container(
          height: 48,
          decoration: BoxDecoration(
            color: isDark ? Theme.of(context).cardColor : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark ? Theme.of(context).disabledColor.withValues(alpha: 0.2) : const Color(0xFFE2E8F0),
              width: 1,
            ),
          ),
          child: Row(
            children: [
              if (prefixWidget != null)
                prefixWidget
              else if (prefixIcon != null) ...[
                const SizedBox(width: 12),
                Icon(prefixIcon, size: 18, color: const Color(0xFF94A3B8)),
                const SizedBox(width: 8),
              ] else
                const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: controller,
                  focusNode: focusNode,
                  readOnly: readOnly,
                  onTap: onTap,
                  keyboardType: inputType,
                  textInputAction: nextFocus != null ? inputAction : TextInputAction.done,
                  textCapitalization: capitalization,
                  onChanged: onChanged,
                  onSubmitted: (_) {
                    if (nextFocus != null) {
                      FocusScope.of(context).requestFocus(nextFocus);
                    }
                  },
                  style: robotoRegular.copyWith(
                    fontSize: 14,
                    color: Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                  decoration: InputDecoration(
                    hintText: hintText,
                    hintStyle: robotoRegular.copyWith(
                      fontSize: 14,
                      color: const Color(0xFF94A3B8),
                    ),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 0),
                  ),
                ),
              ),
              if (suffixWidget != null)
                suffixWidget
              else
                const SizedBox(width: 12),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAddressDetailsCard(BuildContext context, LocationController locationController) {
    final String addressLabel = widget.fromRide ||
            (Get.find<SplashController>().module != null &&
                Get.find<SplashController>().module!.moduleType.toString() == AppConstants.taxi)
        ? 'pickup_address'.tr
        : 'delivery_address'.tr;

    return _buildSectionCard(
      context: context,
      title: 'Address Details',
      icon: Icons.location_city_rounded,
      subtitle: 'Accurate details help riders reach quickly',
      children: [
        _buildInputField(
          context: context,
          label: addressLabel,
          hintText: 'write_delivery_address'.tr,
          controller: _addressController,
          focusNode: _addressNode,
          nextFocus: _houseNode,
          isRequired: true,
          prefixIcon: Icons.my_location_rounded,
          onChanged: (text) => locationController.setPlaceMark(text),
        ),
        const SizedBox(height: 14),
        _buildInputField(
          context: context,
          label: '${'house'.tr} (${'optional'.tr})',
          hintText: 'e.g. 402, Block A',
          prefixIcon: Icons.home_outlined,
          controller: _houseController,
          focusNode: _houseNode,
          nextFocus: _floorNode,
        ),
        const SizedBox(height: 14),
        _buildInputField(
          context: context,
          label: "${'floor'.tr} (${'optional'.tr})",
          hintText: 'e.g. 4th Floor',
          prefixIcon: Icons.stairs_outlined,
          controller: _floorController,
          focusNode: _floorNode,
          nextFocus: _streetNode,
        ),
        const SizedBox(height: 14),
        _buildInputField(
          context: context,
          label: '${'street_number'.tr} (${'optional'.tr})',
          hintText: 'e.g. Near Apollo Hospital, Main Road',
          prefixIcon: Icons.signpost_outlined,
          controller: _streetNumberController,
          focusNode: _streetNode,
          nextFocus: _nameNode,
        ),
      ],
    );
  }

  Widget _buildContactDetailsCard(BuildContext context, LocationController locationController) {
    return _buildSectionCard(
      context: context,
      title: 'Contact Details',
      icon: Icons.person_outline_rounded,
      subtitle: 'Person receiving the order',
      children: [
        _buildInputField(
          context: context,
          label: 'contact_person_name'.tr,
          hintText: 'e.g. Full Name',
          prefixIcon: Icons.person_outline_rounded,
          controller: _contactPersonNameController,
          focusNode: _nameNode,
          nextFocus: _numberNode,
          capitalization: TextCapitalization.words,
          isRequired: true,
        ),
        const SizedBox(height: 14),
        _buildInputField(
          context: context,
          label: 'contact_person_number'.tr,
          hintText: 'write_number'.tr,
          controller: _contactPersonNumberController,
          focusNode: _numberNode,
          nextFocus: widget.forGuest ? _emailFocus : null,
          inputAction: widget.forGuest ? TextInputAction.next : TextInputAction.done,
          inputType: TextInputType.phone,
          isRequired: true,
          prefixWidget: Container(
            height: 48,
            padding: const EdgeInsets.only(left: 8, right: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                CodePickerWidget(
                  flagWidth: 22,
                  padding: EdgeInsets.zero,
                  onChanged: (CountryCode countryCode) {
                    _countryDialCode = countryCode.dialCode;
                  },
                  initialSelection: _countryDialCode ?? Get.find<LocalizationController>().locale.countryCode,
                  favorite: [_countryDialCode ?? ''],
                  enabled: Get.find<SplashController>().configModel?.countryPickerStatus,
                  dialogBackgroundColor: Theme.of(context).cardColor,
                  textStyle: robotoMedium.copyWith(
                    fontSize: 13,
                    color: Theme.of(context).textTheme.bodyMedium!.color,
                  ),
                ),
                Container(
                  height: 20,
                  width: 1,
                  color: const Color(0xFFCBD5E1),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                ),
              ],
            ),
          ),
        ),
        if (widget.forGuest) ...[
          const SizedBox(height: 14),
          _buildInputField(
            context: context,
            label: 'email'.tr,
            hintText: 'e.g. name@example.com',
            controller: _emailController,
            focusNode: _emailFocus,
            inputAction: TextInputAction.done,
            inputType: TextInputType.emailAddress,
            prefixIcon: Icons.mail_outline_rounded,
            isRequired: true,
          ),
        ],
      ],
    );
  }

  Widget _buildSectionCard({
    required BuildContext context,
    required String title,
    required IconData icon,
    String? subtitle,
    required List<Widget> children,
  }) {
    final bool isDark = Get.isDarkMode;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Theme.of(context).disabledColor.withValues(alpha: 0.2) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: Theme.of(context).primaryColor),
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: robotoBold.copyWith(
                  fontSize: 15,
                  color: Theme.of(context).textTheme.bodyLarge?.color,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: robotoRegular.copyWith(fontSize: 12, color: Theme.of(context).disabledColor),
            ),
          ],
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _buildBottomActionBar(BuildContext context, LocationController locationController, {bool isDesktop = false}) {
    final bool isDark = Get.isDarkMode;

    Widget buttonWidget = GetBuilder<AddressController>(
      builder: (addressController) {
        final bool isLoading = addressController.isLoading;
        final String buttonText = widget.forGuest
            ? 'done'.tr
            : widget.address == null
                ? 'save_location'.tr
                : 'update_address'.tr;

        return SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: isLoading ? null : () => _onSaveOrUpdateButtonPressed(locationController),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).primaryColor,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        widget.address == null ? Icons.add_location_alt_rounded : Icons.check_circle_outline_rounded,
                        size: 20,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        buttonText,
                        style: robotoBold.copyWith(fontSize: 16, color: Colors.white),
                      ),
                    ],
                  ),
          ),
        );
      },
    );

    if (isDesktop) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        child: buttonWidget,
      );
    }

    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        12,
        16,
        MediaQuery.of(context).padding.bottom > 0 ? MediaQuery.of(context).padding.bottom + 6 : 16,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.06),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
        border: Border(
          top: BorderSide(
            color: isDark ? Theme.of(context).disabledColor.withValues(alpha: 0.2) : const Color(0xFFF1F5F9),
            width: 1,
          ),
        ),
      ),
      child: buttonWidget,
    );
  }

  void _checkPermission(Function onTap) async {
    LocationPermission permission = await Geolocator.checkPermission();
    if(permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if(permission == LocationPermission.denied) {
      showCustomSnackBar('you_have_to_allow'.tr);
    }else if(permission == LocationPermission.deniedForever) {
      Get.dialog(const PermissionDialogWidget());
    }else {
      onTap();
    }
  }

  Widget button(LocationController locationController) {
    return GetBuilder<AddressController>(
      builder: (addressController) {
        return Container(
          width: Dimensions.webMaxWidth,
          padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
          child: CustomButton(
            radius: Dimensions.radiusSmall,
            isBold: false,
            isLoading: addressController.isLoading,
            buttonText: widget.forGuest ? 'done'.tr : widget.address == null ? 'save_location'.tr : 'update_address'.tr,
            onPressed: () async => _onSaveOrUpdateButtonPressed(locationController),
          ),
        );
      }
    );
  }

  void _onSaveOrUpdateButtonPressed(LocationController locationController) async {

    String numberWithCountryCode = _countryDialCode! + _contactPersonNumberController.text;
    PhoneValid phoneValid = await CustomValidator.isPhoneValid(numberWithCountryCode);
    numberWithCountryCode = phoneValid.phone;

    AddressModel? addressModel = _prepareAddressModel(locationController, phoneValid.isValid, numberWithCountryCode);
    if(addressModel == null) {
      return;
    }

    if(widget.forGuest) {
      addressModel.email = _emailController.text;
      Get.back(result: addressModel);
    } else {
      if(widget.address == null) {
        _addAddress(addressModel);
      }else {
        _updateAddress(addressModel);
      }
    }

  }

  AddressModel? _prepareAddressModel(LocationController locationController, bool isValid, String numberWithCountryCode) {
    String? addressType = locationController.addressTypeList[locationController.addressTypeIndex];
    if(locationController.addressTypeIndex == 2){
      addressType = _levelController.text.isNotEmpty ? _levelController.text.trim() : locationController.addressTypeList[locationController.addressTypeIndex];
    }
    if(_addressController.text.isEmpty) {
      showCustomSnackBar('please_enter_the_delivery_address'.tr);
    } else if(_contactPersonNameController.text.isEmpty) {
      showCustomSnackBar('please_enter_the_contact_person_name'.tr);
    } else if(_contactPersonNumberController.text.isEmpty) {
      showCustomSnackBar('please_enter_the_phone_number'.tr);
    } else if (!isValid) {
      showCustomSnackBar('invalid_phone_number'.tr);
    } else if(widget.forGuest && _emailController.text.isEmpty) {
      showCustomSnackBar('please_enter_contact_person_email'.tr);
    } else {
      AddressModel addressModel = AddressModel(
        id: widget.address?.id,
        addressType: addressType,
        contactPersonName: _contactPersonNameController.text,
        contactPersonNumber: _countryDialCode! + _contactPersonNumberController.text,
        address: _addressController.text,
        latitude: locationController.position.latitude.toString(),
        longitude: locationController.position.longitude.toString(),
        zoneId: locationController.zoneID,
        streetNumber: _streetNumberController.text,
        house: _houseController.text,
        floor: _floorController.text,
      );
      return addressModel;
    }
    return null;
  }

  void _addAddress(AddressModel addressModel) {
    Get.find<AddressController>().addAddress(addressModel, widget.fromCheckout, widget.zoneId).then((response) {
      if(response.isSuccess && !widget.fromCheckout) {
        widget.fromNavBar ? Get.back() : Get.offNamed(RouteHelper.getAddressRoute());
        showCustomSnackBar('new_address_added_successfully'.tr, isError: false);
      } else if(response.isSuccess && widget.fromCheckout) {
        AddressModel? addressModel;
        try{
          addressModel = Get.find<AddressController>().addressList![0];
        }catch(_) {}
        Get.back(result: addressModel);
        showCustomSnackBar(response.message, isError: false);
      } else if(widget.fromRide) {
        Get.back();
      } else {
        showCustomSnackBar(response.message);
      }
    });
  }

  void _updateAddress(AddressModel addressModel) {
    Get.find<AddressController>().updateAddress(addressModel, widget.address!.id).then((response) {
      if(response.isSuccess) {
        Get.back();
        showCustomSnackBar(response.message, isError: false);
      }else {
        showCustomSnackBar(response.message);
      }
    });
  }

}
