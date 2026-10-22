import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/styles.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';

class PermissionDialogWidget extends StatelessWidget {
  const PermissionDialogWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final bool isWeb = ResponsiveHelper.isWeb();

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusSmall)),
      insetPadding: const EdgeInsets.all(30),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
        child: SizedBox(
          width: 500,
          child: Column(mainAxisSize: MainAxisSize.min, children: [

            Icon(Icons.add_location_alt_rounded, color: Theme.of(context).primaryColor, size: 100),
            const SizedBox(height: Dimensions.paddingSizeLarge),

            Text(
              isWeb
                  ? 'please_enable_location_permission_from_browser_settings'.tr
                  : 'you_denied_location_permission'.tr,
              textAlign: TextAlign.center,
              style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge),
            ),

            if (isWeb) ...[
              const SizedBox(height: Dimensions.paddingSizeDefault),
              Container(
                padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                  border: Border.all(color: Theme.of(context).primaryColor.withValues(alpha: 0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline_rounded, size: 20, color: Theme.of(context).primaryColor),
                        const SizedBox(width: Dimensions.paddingSizeExtraSmall),
                        Text(
                          'How to allow location:',
                          style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).primaryColor),
                        ),
                      ],
                    ),
                    const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                    Text(
                      '1. Click the lock / tune icon (🔒) on the left side of your browser address bar.\n2. Set Location permission to "Allow".\n3. Reload this page to update your location.',
                      style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, height: 1.4),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: Dimensions.paddingSizeLarge),

            Row(children: [
              Expanded(
                child: TextButton(
                  style: TextButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusSmall), side: BorderSide(width: 2, color: Theme.of(context).primaryColor)),
                    minimumSize: const Size(1, 50),
                  ),
                  child: Text('close'.tr),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
              const SizedBox(width: Dimensions.paddingSizeSmall),
              Expanded(
                child: CustomButton(
                  buttonText: isWeb ? 'ok'.tr : 'settings'.tr,
                  onPressed: () async {
                    Get.back();
                    if (!isWeb) {
                      try {
                        await Geolocator.openAppSettings();
                      } catch (e) {
                        debugPrint('Error opening app settings: $e');
                      }
                    }
                  },
                ),
              ),
            ]),

          ]),
        ),
      ),
    );
  }
}
