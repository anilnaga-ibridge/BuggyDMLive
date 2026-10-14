import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_dropdown.dart';
import 'package:sixam_mart/features/address/domain/models/address_model.dart';
import 'package:sixam_mart/features/checkout/controllers/checkout_controller.dart';
import 'package:sixam_mart/features/checkout/widgets/address_bottom_sheet.dart';
import 'package:sixam_mart/features/checkout/widgets/delivery_instraction_bottom_sheet_widget.dart';
import 'package:sixam_mart/features/checkout/widgets_new/address_info_bottom_sheet.dart';
import 'package:sixam_mart/features/checkout/widgets_new/custom_card_checkout.dart';
import 'package:sixam_mart/features/profile/controllers/profile_controller.dart';
import 'package:sixam_mart/helper/address_helper.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';

class DeliverySection extends StatelessWidget {
  final CheckoutController checkoutController;
  final List<AddressModel> address;
  final List<DropdownItem<int>> addressList;
  final TextEditingController guestNameTextEditingController;
  final TextEditingController guestNumberTextEditingController;
  final TextEditingController guestEmailController;
  final FocusNode guestNumberNode;
  final FocusNode guestEmailNode;
  final bool isServiceAddress;
  final int? zoneId;

  const DeliverySection({
    super.key,
    required this.checkoutController,
    required this.address,
    required this.addressList,
    required this.guestNameTextEditingController,
    required this.guestNumberTextEditingController,
    required this.guestNumberNode,
    required this.guestEmailController,
    required this.guestEmailNode,
    this.isServiceAddress = false,
    this.zoneId,
  });

  @override
  Widget build(BuildContext context) {
    final bool isGuest = AuthHelper.isGuestLoggedIn();
    final bool takeAway = checkoutController.orderType == 'take_away';

    if (!isGuest && takeAway) {
      return const SizedBox();
    }

    return GetBuilder<CheckoutController>(builder: (controller) {
      final String addressText = _resolveAddressText(controller, isGuest);
      final String name = _resolveName(controller, isGuest);
      final String phone = _resolvePhone(controller, isGuest);
      final String? dialCode = controller.countryDialCode;

      return CustomCardCheckout(
        padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row: Green location icon + Title + Subtitle + Change button
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                    color: Color(0xFFE8F8EE),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.location_on,
                    color: Color(0xFF16A34A),
                    size: 18,
                  ),
                ),
                const SizedBox(width: Dimensions.paddingSizeSmall),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        takeAway ? 'contact_information'.tr : 'Delivery Address',
                        style: robotoBold.copyWith(
                          fontSize: Dimensions.fontSizeDefault,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        takeAway ? 'add_contact_info'.tr : 'Where should we deliver your order?',
                        style: robotoRegular.copyWith(
                          fontSize: Dimensions.fontSizeExtraSmall,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                InkWell(
                  onTap: () => _onChangeAddress(context, isGuest),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F8EE),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Change',
                      style: robotoMedium.copyWith(
                        color: const Color(0xFF16A34A),
                        fontSize: Dimensions.fontSizeExtraSmall,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.paddingSizeDefault),

            // Option 1: Current Location with green selected radio
            if (!takeAway) ...[
              _AddressOptionRow(
                icon: Icons.home_outlined,
                title: 'Current Location',
                subtitle: addressText.isEmpty ? 'H.No. 45, Sector 62, Noida 201301' : addressText,
                isSelected: true,
                onSelect: () {},
                onEdit: () => _onChangeAddress(context, isGuest),
              ),
              const SizedBox(height: Dimensions.paddingSizeSmall),
            ],

            // Option 2: Contact info / person with unselected radio
            _AddressOptionRow(
              icon: Icons.person_outline,
              title: name.isNotEmpty ? name : 'Anil',
              subtitle: phone.isNotEmpty
                  ? ((dialCode != null && dialCode.isNotEmpty) ? '$dialCode $phone' : phone)
                  : '+91 7569152592',
              isSelected: false,
              onSelect: () => _openSheet(context, isGuest),
              onEdit: () => _openSheet(context, isGuest),
            ),
            const SizedBox(height: Dimensions.paddingSizeDefault),

            // Delivery Instructions (Optional)
            if (!takeAway) ...[
              const _DeliveryInstructionsCard(),
            ],
          ],
        ),
      );
    });
  }

  void _openSheet(BuildContext context, bool isGuest) {
    AddressInfoBottomSheet.open(
      context,
      checkoutController: checkoutController,
      isGuest: isGuest,
      guestNameController: isGuest ? guestNameTextEditingController : null,
      guestNumberController: isGuest ? guestNumberTextEditingController : null,
      guestEmailController: isGuest ? guestEmailController : null,
      guestNumberNode: isGuest ? guestNumberNode : null,
      guestEmailNode: isGuest ? guestEmailNode : null,
    );
  }

  void _onChangeAddress(BuildContext context, bool isGuest) {
    if (isGuest) {
      _openSheet(context, true);
    } else {
      Get.bottomSheet(
        const AddressBottomSheet(),
        backgroundColor: Colors.transparent,
        isScrollControlled: true,
      );
    }
  }


  String _resolveAddressText(CheckoutController controller, bool isGuest) {
    String resolved = '';
    if (isGuest) {
      resolved = controller.guestAddress?.address ?? controller.contactPersonAddressController.text;
    } else {
      final String? current = controller.address?.address;
      if (current != null && current.isNotEmpty) {
        resolved = current;
      } else if (address.isNotEmpty && controller.addressIndex != null && controller.addressIndex! < address.length) {
        resolved = address[controller.addressIndex!].address ?? '';
      } else {
        resolved = controller.contactPersonAddressController.text;
      }
    }
    if (resolved.trim().isEmpty || resolved.trim().toLowerCase().contains('unknown location')) {
      final saved = AddressHelper.getUserAddressFromSharedPref()?.address;
      if (saved != null && saved.isNotEmpty && !saved.toLowerCase().contains('unknown location')) {
        return saved;
      }
      return 'H.No. 45, Sector 62, Noida 201301';
    }
    return resolved;
  }

  String _resolveName(CheckoutController controller, bool isGuest) {
    if (isGuest) {
      return guestNameTextEditingController.text;
    }
    if (controller.contactPersonNameController.text.isNotEmpty) {
      return controller.contactPersonNameController.text;
    }
    final user = Get.find<ProfileController>().userInfoModel;
    if (user != null && (user.fName != null || user.lName != null)) {
      return '${user.fName ?? ''} ${user.lName ?? ''}'.trim();
    }
    return '';
  }

  String _resolvePhone(CheckoutController controller, bool isGuest) {
    if (isGuest) {
      return guestNumberTextEditingController.text;
    }
    if (controller.contactPersonNumberController.text.isNotEmpty) {
      return controller.contactPersonNumberController.text;
    }
    final user = Get.find<ProfileController>().userInfoModel;
    return user?.phone ?? '';
  }
}

class _AddressOptionRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onSelect;
  final VoidCallback onEdit;

  const _AddressOptionRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onSelect,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onSelect,
      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Circular icon badge
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: Color(0xFFF8FAFC),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 18, color: const Color(0xFF64748B)),
            ),
            const SizedBox(width: Dimensions.paddingSizeSmall),

            // Title & Subtitle
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: robotoBold.copyWith(
                      fontSize: Dimensions.fontSizeSmall,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: robotoRegular.copyWith(
                      fontSize: Dimensions.fontSizeExtraSmall,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: Dimensions.paddingSizeSmall),

            // Radio Button
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFCBD5E1),
                  width: isSelected ? 2 : 1.5,
                ),
              ),
              child: isSelected
                  ? Center(
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          color: Color(0xFF16A34A),
                          shape: BoxShape.circle,
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: Dimensions.paddingSizeDefault),

            // Edit Pencil Icon
            GestureDetector(
              onTap: onEdit,
              behavior: HitTestBehavior.opaque,
              child: const Padding(
                padding: EdgeInsets.all(4.0),
                child: Icon(
                  Icons.edit_outlined,
                  size: 18,
                  color: Color(0xFF16A34A),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DeliveryInstructionsCard extends StatelessWidget {
  const _DeliveryInstructionsCard();

  void _openPicker(BuildContext context) {
    if (ResponsiveHelper.isDesktop(context)) {
      Get.dialog(const Dialog(child: DeliveryInstractionBottomSheetWidget()));
    } else {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => const DeliveryInstractionBottomSheetWidget(),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CheckoutController>(builder: (controller) {
      final bool hasInstruction = controller.selectedInstruction != -1;
      final String? selectedText = hasInstruction
          ? AppConstants.deliveryInstructionList[controller.selectedInstruction].tr
          : null;

      return InkWell(
        onTap: () => _openPicker(context),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(
            horizontal: Dimensions.paddingSizeDefault,
            vertical: 12,
          ),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FAF5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFB9E6CD),
              width: 1.0,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFB9E6CD), width: 0.8),
                ),
                child: const Icon(
                  Icons.description_outlined,
                  size: 16,
                  color: Color(0xFF16A34A),
                ),
              ),
              const SizedBox(width: Dimensions.paddingSizeSmall),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Delivery Instructions (Optional)',
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      hasInstruction
                          ? selectedText!
                          : 'Add delivery instructions (e.g. gate, landmark, floor, etc.)',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeExtraSmall,
                        color: hasInstruction
                            ? const Color(0xFF16A34A)
                            : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.chevron_right,
                size: 20,
                color: Color(0xFF16A34A),
              ),
            ],
          ),
        ),
      );
    });
  }
}
