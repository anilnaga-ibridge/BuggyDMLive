import 'package:get/get.dart';
import 'package:sixam_mart/features/address/controllers/address_controller.dart';
import 'package:sixam_mart/features/banner/controllers/banner_controller.dart';
import 'package:sixam_mart/features/brands/controllers/brands_controller.dart';
import 'package:sixam_mart/features/category/controllers/category_controller.dart';
import 'package:sixam_mart/features/coupon/controllers/coupon_controller.dart';
import 'package:sixam_mart/features/flash_sale/controllers/flash_sale_controller.dart';
import 'package:sixam_mart/features/home/controllers/advertisement_controller.dart';
import 'package:sixam_mart/features/item/controllers/campaign_controller.dart';
import 'package:sixam_mart/features/item/controllers/item_controller.dart';
import 'package:sixam_mart/features/location/controllers/location_controller.dart';
import 'package:sixam_mart/features/notification/controllers/notification_controller.dart';
import 'package:sixam_mart/features/order/controllers/order_controller.dart';
import 'package:sixam_mart/features/parcel/controllers/parcel_controller.dart';
import 'package:sixam_mart/features/profile/controllers/profile_controller.dart';
import 'package:sixam_mart/features/reels/controllers/reels_controller.dart';
import 'package:sixam_mart/features/rental_module/home/controllers/taxi_home_controller.dart';
import 'package:sixam_mart/features/rental_module/rental_cart_screen/controllers/taxi_cart_controller.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/controllers/grocery_flash_deals_controller.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/controllers/grocery_lifestyle_categories_controller.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_hero_fest_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_flavour_fest_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_steal_deals_shelf_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_explore_section_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_salon_showcase_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_category_grid_widget.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/widgets/grocery_curated_product_grid_widget.dart';
import 'package:sixam_mart/features/store/controllers/store_controller.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/util/app_constants.dart';
class HomeScreen {
  static Future<void> loadData(bool reload, {bool fromModule = false}) async {
    print('===== Home Screen Load Data =====');
    Get.find<LocationController>().syncZoneData();
    Get.find<FlashSaleController>().setEmptyFlashSale(fromModule: fromModule);

    if(Get.find<SplashController>().module != null
        && Get.find<SplashController>().module!.moduleType.toString() != AppConstants.ride
        && !Get.find<SplashController>().configModel!.moduleConfig!.module!.isParcel!
        && !Get.find<SplashController>().configModel!.moduleConfig!.module!.isTaxi!) {

      if(AuthHelper.isLoggedIn() && Get.find<SplashController>().configModel!.repeatOrderOption == 1) {
        Get.find<StoreController>().getVisitAgainStoreList(fromModule: fromModule);
      }

      // --- TIER 1: Immediate Visible Viewport (Above the Fold) ---
      Get.find<BannerController>().getBannerList(reload);
      Get.find<CategoryController>().getCategoryList(reload);
      Get.find<StoreController>().getRecommendedStoreList();
      Get.find<ItemController>().getPopularItemList(offset: '1', firstTimeCategoryLoad: true);

      if(Get.find<SplashController>().module!.moduleType.toString() == AppConstants.grocery) {
        Get.find<FlashSaleController>().getFlashSale(reload, false);
        _refreshGroceryDynamicModules();
      }

      // --- TIER 2: Secondary Content (Hydrate after 200ms) ---
      Future.delayed(const Duration(milliseconds: 200), () {
        Get.find<BannerController>().getPromotionalBannerList(reload);
        Get.find<ItemController>().getDiscountedItemList(offset: '1', firstTimeCategoryLoad: true);
        Get.find<ItemController>().getReviewedItemList(offset: '1', firstTimeCategoryLoad: true);
        Get.find<StoreController>().getPopularStoreList(reload, 'all', false);
        Get.find<StoreController>().getLatestStoreList(reload, 'all', false);
        Get.find<StoreController>().getTopOfferStoreList(reload, false);
        Get.find<ItemController>().getRecommendedItemList(reload, 'all', false);

        final String mType = Get.find<SplashController>().module?.moduleType.toString() ?? '';
        if(mType == AppConstants.food || mType == AppConstants.grocery || mType == AppConstants.pharmacy) {
          Get.find<StoreController>().getQuickDeliveryStoreList(reload: reload);
        }
        if(mType == AppConstants.grocery) {
          Get.find<BrandsController>().getBrandList();
        }
        if(mType == AppConstants.ecommerce) {
          Get.find<ItemController>().getFeaturedCategoriesItemList(false, false);
          Get.find<FlashSaleController>().getFlashSale(reload, false);
          Get.find<BrandsController>().getBrandList();
        }
      });

      // --- TIER 3: Deferred Heavy Widgets (Hydrate after 500ms) ---
      Future.delayed(const Duration(milliseconds: 500), () {
        Get.find<ReelsController>().getReelsList(offset: 1);
        Get.find<CampaignController>().getBasicCampaignList(reload);
        Get.find<CampaignController>().getItemCampaignList(reload);
        Get.find<StoreController>().getStoreList(1, reload);
        Get.find<AdvertisementController>().getAdvertisementList();
      });
    }
    if(AuthHelper.isLoggedIn()) {
      await Get.find<ProfileController>().getUserInfo();
      Get.find<NotificationController>().getNotificationList(reload);
      if(Get.find<SplashController>().configModel!.repeatOrderOption == 1) {
        Get.find<OrderController>().getLastOrders(reload: reload, isHome: true);
        // Also refresh the module-scoped list (LastOrdersSectionWidget reads this
        // when a module screen passes moduleType) — module screens only fetch it
        // once in initState, so without this it stays stale after placing an
        // order and simply popping back instead of switching modules.
        Get.find<OrderController>().getLastOrders(reload: reload, isHome: false);
      }
      if(!Get.find<SplashController>().configModel!.moduleConfig!.module!.isRide!) {
        Get.find<CouponController>().getCouponList();
      }
    }
    Get.find<SplashController>().getModules();
    if(Get.find<SplashController>().module == null && Get.find<SplashController>().configModel!.module == null) {
      Get.find<BannerController>().getFeaturedBanner();
      Get.find<StoreController>().getFeaturedStoreList();
      if(AuthHelper.isLoggedIn()) {
        Get.find<AddressController>().getAddressList();
      }
    }
    if(Get.find<SplashController>().module != null && Get.find<SplashController>().configModel!.moduleConfig!.module!.isParcel!) {
      Get.find<ParcelController>().getParcelCategoryList();
    }
    if(Get.find<SplashController>().module != null && Get.find<SplashController>().module!.moduleType.toString() == AppConstants.pharmacy) {
      Get.find<ItemController>().getBasicMedicine(reload, false);
      Get.find<StoreController>().getFeaturedStoreList();
      Get.find<StoreController>().getVerifiedStoreList(reload: reload, notify: false);
      Get.find<ItemController>().getCommonConditions(false);
    }
  }

  static Future<void> loadTaxiApis() async {
    await Get.find<TaxiHomeController>().getTaxiBannerList(true);
    await Get.find<TaxiHomeController>().getTopRatedCarList(1, true);
    if (AuthHelper.isLoggedIn()) {
      await Get.find<AddressController>().getAddressList();
      await Get.find<TaxiHomeController>().getTaxiCouponList(true);
      await Get.find<TaxiCartController>().getCarCartList();
    }
  }

  static void _refreshGroceryDynamicModules() {
    if (Get.isRegistered<GroceryHeroFestController>()) {
      Get.find<GroceryHeroFestController>().fetchDynamicConfig();
    }
    if (Get.isRegistered<GroceryFlavourFestController>()) {
      Get.find<GroceryFlavourFestController>().fetchDynamicConfig();
    }
    if (Get.isRegistered<GroceryStealDealsController>()) {
      Get.find<GroceryStealDealsController>().fetchDynamicConfig();
    }
    if (Get.isRegistered<GroceryFeaturedOffersController>()) {
      Get.find<GroceryFeaturedOffersController>().fetchDynamicConfig();
    }
    if (Get.isRegistered<GrocerySalonShowcaseController>()) {
      Get.find<GrocerySalonShowcaseController>().fetchDynamicConfig();
    }
    if (Get.isRegistered<GroceryCategoryGridController>()) {
      Get.find<GroceryCategoryGridController>().fetchDynamicConfig();
    }
    if (Get.isRegistered<GroceryCuratedProductGridController>()) {
      Get.find<GroceryCuratedProductGridController>().fetchDynamicConfig();
    }
    if (Get.isRegistered<GroceryLifestyleCategoriesController>()) {
      Get.find<GroceryLifestyleCategoriesController>().fetchDynamicConfig();
    }
    if (Get.isRegistered<GroceryFlashDealsController>()) {
      Get.find<GroceryFlashDealsController>().fetchDynamicConfig();
    }
  }
}