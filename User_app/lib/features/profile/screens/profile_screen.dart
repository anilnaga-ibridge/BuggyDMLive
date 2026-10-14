import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/features/address/controllers/address_controller.dart';
import 'package:sixam_mart/features/auth/controllers/auth_controller.dart';
import 'package:sixam_mart/features/cart/controllers/cart_controller.dart';
import 'package:sixam_mart/features/favourite/controllers/favourite_controller.dart';
import 'package:sixam_mart/features/home/controllers/home_controller.dart';
import 'package:sixam_mart/features/order/screens/my_order_screen.dart';
import 'package:sixam_mart/features/profile/controllers/profile_controller.dart';
import 'package:sixam_mart/features/profile/widgets/logout_confirmation_bottom_sheet_widget.dart';
import 'package:sixam_mart/features/rental_module/rental_cart_screen/controllers/taxi_cart_controller.dart';
import 'package:sixam_mart/features/splash/controllers/splash_controller.dart';
import 'package:sixam_mart/helper/auth_helper.dart';
import 'package:sixam_mart/helper/responsive_helper.dart';
import 'package:sixam_mart/helper/route_helper.dart';

class ProfileScreen extends StatefulWidget {
  final Function()? onBackPressed;
  const ProfileScreen({super.key, this.onBackPressed});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    if (AuthHelper.isLoggedIn()) {
      if (Get.find<ProfileController>().userInfoModel == null) {
        Get.find<ProfileController>().getUserInfo();
      }
      if (Get.find<AddressController>().addressList == null) {
        Get.find<AddressController>().getAddressList();
      }
    }
  }

  void _handleLogout(BuildContext context, bool isLoggedIn) async {
    if (isLoggedIn) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (con) => LogoutConfirmationBottomSheetWidget(
          onYesPressed: () async {
            Get.find<AuthController>().resetOtpView();
            Get.find<ProfileController>().clearUserInfo();
            Get.find<AuthController>().socialLogout();
            Get.find<CartController>().clearCartList();
            Get.find<FavouriteController>().removeFavourite();
            await Get.find<AuthController>().clearSharedData();
            Get.find<HomeController>().forcefullyNullCashBackOffers();
            if (Get.find<SplashController>().module != null) {
              Get.find<TaxiCartController>().getCarCartList();
            }
            Get.find<ProfileController>().update();
            Get.back();
            showCustomSnackBar('logout_successful'.tr, isError: false);
          },
        ),
      );
    } else {
      Get.find<FavouriteController>().removeFavourite();
      await Get.toNamed(RouteHelper.getSignInRoute(Get.currentRoute));
      if (AuthHelper.isLoggedIn()) {
        await Get.find<FavouriteController>().getFavouriteList();
        Get.find<ProfileController>().getUserInfo();
      }
    }
  }

  void _showSuggestProductBottomSheet(BuildContext context) {
    final TextEditingController textController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDE9FE),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.star_outline_rounded, color: Color(0xFF7C3AED), size: 24),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Suggest Products',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF111827)),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Tell us what products you want on Buggy',
                          style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              TextField(
                controller: textController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'e.g. Amul Gold Milk 1L, Ferrero Rocher 16pk, Organic Avocados...',
                  hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                  filled: true,
                  fillColor: const Color(0xFFF9FAFB),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                  focusedBorder: const OutlineInputBorder(
                    borderRadius: BorderRadius.all(Radius.circular(12)),
                    borderSide: BorderSide(color: Color(0xFF7C3AED), width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    showCustomSnackBar('Thank you for your suggestion! We will check product availability.', isError: false);
                  },
                  child: const Text('Submit Suggestion', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  void _showGeneralInfoBottomSheet(BuildContext context) {
    final config = Get.find<SplashController>().configModel;
    final bool isDesktop = ResponsiveHelper.isDesktop(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(20),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'General Information',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF111827)),
                ),
                const SizedBox(height: 16),
                _buildGeneralInfoTile(
                  title: 'Terms & Conditions',
                  icon: Icons.description_outlined,
                  onTap: () {
                    Navigator.pop(ctx);
                    Get.toNamed(RouteHelper.termsAndCondition);
                  },
                ),
                _buildGeneralInfoTile(
                  title: 'Privacy Policy',
                  icon: Icons.privacy_tip_outlined,
                  onTap: () {
                    Navigator.pop(ctx);
                    Get.toNamed(RouteHelper.privacyPolicy);
                  },
                ),
                if (config?.refundPolicyStatus == 1)
                  _buildGeneralInfoTile(
                    title: 'Refund Policy',
                    icon: Icons.currency_exchange_outlined,
                    onTap: () {
                    Navigator.pop(ctx);
                    Get.toNamed(RouteHelper.refundPolicy);
                  },
                ),
                if (config?.cancellationPolicyStatus == 1)
                  _buildGeneralInfoTile(
                    title: 'Cancellation Policy',
                    icon: Icons.cancel_outlined,
                    onTap: () {
                      Navigator.pop(ctx);
                      Get.toNamed(RouteHelper.cancellationPolicy);
                    },
                  ),
                if (config?.shippingPolicyStatus == 1)
                  _buildGeneralInfoTile(
                    title: 'Shipping Policy',
                    icon: Icons.local_shipping_outlined,
                    onTap: () {
                      Navigator.pop(ctx);
                      Get.toNamed(RouteHelper.shippingPolicy);
                    },
                  ),
                if ((config?.toggleDmRegistration ?? false) && !isDesktop)
                  _buildGeneralInfoTile(
                    title: 'Join as a Delivery Partner',
                    icon: Icons.two_wheeler_outlined,
                    onTap: () {
                      Navigator.pop(ctx);
                      Get.toNamed(RouteHelper.getDeliverymanRegistrationRoute());
                    },
                  ),
                if ((config?.toggleStoreRegistration ?? false) && !isDesktop)
                  _buildGeneralInfoTile(
                    title: 'Open Vendor / Store',
                    icon: Icons.storefront_outlined,
                    onTap: () {
                      Navigator.pop(ctx);
                      Get.toNamed(RouteHelper.getRestaurantRegistrationRoute());
                    },
                  ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGeneralInfoTile({
    required String title,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: const Color(0xFF111827), size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF111827)),
      ),
      trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF), size: 20),
      onTap: onTap,
    );
  }

  void _showPayLaterBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              const Row(
                children: [
                  _RupeeRefreshBadge(size: 34),
                  SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Buggy Pay Later',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF111827)),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Instant credit powered by Snapmint',
                        style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Current Dues', style: TextStyle(color: Color(0xFF6B7280), fontSize: 13)),
                        SizedBox(height: 4),
                        Text('₹0', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF111827))),
                      ],
                    ),
                    Chip(
                      backgroundColor: Color(0xFFECFDF5),
                      side: BorderSide(color: Color(0xFFA7F3D0)),
                      label: Text('No Dues Pending', style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w700, fontSize: 12)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                '• Instant one-click checkout on all orders\n• 15-day interest-free credit cycle\n• Auto-repay or manual repayment anytime',
                style: TextStyle(fontSize: 13.5, color: Color(0xFF4B5563), height: 1.5),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF111827),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Close', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      body: SafeArea(
        child: GetBuilder<ProfileController>(
          builder: (profileController) {
            return GetBuilder<AddressController>(
              builder: (addressController) {
                final bool isLoggedIn = AuthHelper.isLoggedIn();
                final int addressCount = addressController.addressList?.length ?? 10;

                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 12),
                      _buildTopBar(context),
                      const SizedBox(height: 20),
                      _buildUserProfile(context, profileController),
                      const SizedBox(height: 20),
                      _buildTopQuickCards(context),
                      const SizedBox(height: 16),
                      _buildWalletGiftCard(context, profileController),
                      const SizedBox(height: 14),
                      _buildPayLaterCard(context),
                      const SizedBox(height: 24),
                      _buildYourInformationSection(context, addressCount),
                      const SizedBox(height: 24),
                      _buildOtherInformationSection(context),
                      const SizedBox(height: 24),
                      _buildLogoutButton(context, isLoggedIn),
                      const SizedBox(height: 18),
                      _buildAppVersion(),
                      const SizedBox(height: 32),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context) {
    return Row(
      children: [
        InkWell(
          onTap: () {
            if (widget.onBackPressed != null) {
              widget.onBackPressed!();
            } else if (Navigator.canPop(context)) {
              Get.back();
            } else {
              Get.offAllNamed(RouteHelper.getInitialRoute());
            }
          },
          borderRadius: BorderRadius.circular(22),
          child: Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Center(
              child: Icon(
                Icons.chevron_left_rounded,
                size: 28,
                color: Color(0xFF111827),
              ),
            ),
          ),
        ),
        const SizedBox(width: 14),
        const Text(
          'Profile',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF111827),
            letterSpacing: -0.4,
          ),
        ),
      ],
    );
  }

  Widget _buildUserProfile(BuildContext context, ProfileController profileController) {
    final bool isLoggedIn = AuthHelper.isLoggedIn();
    final user = profileController.userInfoModel;
    final String fullName = isLoggedIn
        ? ('${user?.fName ?? ''} ${user?.lName ?? ''}').trim()
        : 'Guest User';
    final String displayName = fullName.isNotEmpty ? fullName : 'User';
    final String phone = isLoggedIn
        ? (user?.phone ?? '')
        : 'Login to access your orders & details';
    final String? imageUrl = isLoggedIn ? user?.imageFullUrl : null;

    return InkWell(
      onTap: () {
        if (isLoggedIn) {
          Get.toNamed(RouteHelper.getUpdateProfileRoute());
        } else {
          Get.toNamed(RouteHelper.getSignInRoute(Get.currentRoute));
        }
      },
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: const BoxDecoration(
                color: Color(0xFFEDE9FE),
                shape: BoxShape.circle,
              ),
              child: ClipOval(
                child: (imageUrl != null && imageUrl.isNotEmpty)
                    ? CustomImage(
                        image: imageUrl,
                        width: 58,
                        height: 58,
                        fit: BoxFit.cover,
                      )
                    : const Center(
                        child: Icon(
                          Icons.person,
                          size: 38,
                          color: Color(0xFF7C3AED),
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displayName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF111827),
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    phone,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopQuickCards(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildQuickActionCard(
            icon: Icons.shopping_bag_outlined,
            title: 'Your\nOrders',
            onTap: () => Get.to(() => const MyOrderScreen()),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildQuickActionCard(
            icon: Icons.chat_bubble_outline_rounded,
            title: 'Help &\nSupport',
            onTap: () => Get.toNamed(RouteHelper.getSupportRoute()),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildQuickActionCard(
            icon: Icons.favorite_border_rounded,
            title: 'Your\nWishlist',
            onTap: () => Get.toNamed(RouteHelper.getFavouriteScreen()),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActionCard({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 28, color: const Color(0xFF111827)),
            const SizedBox(height: 10),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w700,
                color: Color(0xFF111827),
                height: 1.25,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWalletGiftCard(BuildContext context, ProfileController profileController) {
    final double balance = profileController.userInfoModel?.walletBalance ?? 0.0;
    final String formattedBalance = balance % 1 == 0
        ? balance.toInt().toString()
        : balance.toStringAsFixed(2);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFAF7FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE9DCFE), width: 1.2),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => Get.toNamed(RouteHelper.getWalletRoute()),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 24,
                    decoration: BoxDecoration(
                      color: const Color(0xFF7E22CE),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.account_balance_wallet_rounded,
                        color: Colors.white,
                        size: 15,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'Buggy Cash & Gift Card',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const Spacer(),
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: Color(0xFF9CA3AF),
                    size: 22,
                  ),
                ],
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Divider(
              height: 1,
              thickness: 1,
              color: Color(0xFFEFE8FE),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Row(
              children: [
                RichText(
                  text: TextSpan(
                    children: [
                      const TextSpan(
                        text: 'Available Balance  ',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                      TextSpan(
                        text: '₹$formattedBalance',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF111827),
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                InkWell(
                  onTap: () => Get.toNamed(RouteHelper.getWalletRoute()),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFD1D5DB), width: 1),
                    ),
                    child: const Text(
                      'Add Balance',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF111827),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPayLaterCard(BuildContext context) {
    return InkWell(
      onTap: () => _showPayLaterBottomSheet(context),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: const Row(
          children: [
            _RupeeRefreshBadge(size: 30),
            SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Buggy Pay Later',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF111827),
                  ),
                ),
                SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      'by ',
                      style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                    ),
                    Text(
                      'snapmint',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF111827),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            Spacer(),
            Text(
              'No dues',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: Color(0xFF6B7280),
              ),
            ),
            SizedBox(width: 4),
            Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF9CA3AF),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildYourInformationSection(BuildContext context, int addressCount) {
    return _buildSectionContainer(
      title: 'Your Information',
      children: [
        _buildInfoRow(
          leading: const _ReviewStarIcon(size: 22),
          title: 'Review & Earn',
          onTap: () => Get.toNamed(RouteHelper.getReviewRoute()),
        ),
        _buildInfoRow(
          leading: const _RupeeRefreshBadge(size: 22),
          title: 'Your Refunds',
          onTap: () => Get.toNamed(RouteHelper.getWalletRoute()),
        ),
        _buildInfoRow(
          leading: const Icon(Icons.favorite_border_rounded, size: 22, color: Color(0xFF111827)),
          title: 'Your Wishlist',
          onTap: () => Get.toNamed(RouteHelper.getFavouriteScreen()),
        ),
        _buildInfoRow(
          leading: const Icon(Icons.credit_card_outlined, size: 22, color: Color(0xFF111827)),
          title: 'E-Gift Cards',
          onTap: () => Get.toNamed(RouteHelper.getCouponRoute()),
        ),
        _buildInfoRow(
          leading: const Icon(Icons.chat_bubble_outline_rounded, size: 22, color: Color(0xFF111827)),
          title: 'Help & Support',
          onTap: () => Get.toNamed(RouteHelper.getSupportRoute()),
        ),
        _buildInfoRow(
          leading: const Icon(Icons.location_on_outlined, size: 22, color: Color(0xFF111827)),
          title: 'Saved Addresses',
          subtitle: '$addressCount Addresses',
          onTap: () => Get.toNamed(RouteHelper.getAddressRoute()),
        ),
        _buildInfoRow(
          leading: const Icon(Icons.account_circle_outlined, size: 22, color: Color(0xFF111827)),
          title: 'Edit Profile',
          onTap: () => Get.toNamed(RouteHelper.getUpdateProfileRoute()),
        ),
        _buildInfoRow(
          leading: const Icon(Icons.card_giftcard_rounded, size: 22, color: Color(0xFF111827)),
          title: 'Rewards',
          onTap: () => Get.toNamed(RouteHelper.getLoyaltyRoute()),
        ),
        _buildInfoRow(
          leading: const Icon(Icons.payment_outlined, size: 22, color: Color(0xFF111827)),
          title: 'Payment Management',
          onTap: () => Get.toNamed(RouteHelper.getWalletRoute()),
          showDivider: false,
        ),
      ],
    );
  }

  Widget _buildOtherInformationSection(BuildContext context) {
    return _buildSectionContainer(
      title: 'Other Information',
      children: [
        _buildInfoRow(
          leading: const Icon(Icons.star_border_rounded, size: 22, color: Color(0xFF111827)),
          title: 'Suggest Products',
          onTap: () => _showSuggestProductBottomSheet(context),
        ),
        _buildInfoRow(
          leading: const Icon(Icons.notifications_none_rounded, size: 22, color: Color(0xFF111827)),
          title: 'Notifications',
          onTap: () => Get.toNamed(RouteHelper.getNotificationRoute()),
        ),
        _buildInfoRow(
          leading: const Icon(Icons.info_outline_rounded, size: 22, color: Color(0xFF111827)),
          title: 'General Info',
          onTap: () => _showGeneralInfoBottomSheet(context),
          showDivider: false,
        ),
      ],
    );
  }

  Widget _buildSectionContainer({
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF111827),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: Column(
              children: children,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow({
    required Widget leading,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
    bool showDivider = true,
  }) {
    return Column(
      children: [
        InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            child: Row(
              children: [
                SizedBox(
                  width: 26,
                  child: Center(child: leading),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF111827),
                        ),
                      ),
                      if (subtitle != null && subtitle.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w400,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFF9CA3AF),
                  size: 20,
                ),
              ],
            ),
          ),
        ),
        if (showDivider)
          const Padding(
            padding: EdgeInsets.only(left: 56, right: 16),
            child: _DashedDivider(),
          ),
      ],
    );
  }

  Widget _buildLogoutButton(BuildContext context, bool isLoggedIn) {
    return InkWell(
      onTap: () => _handleLogout(context, isLoggedIn),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        width: double.infinity,
        height: 50,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        alignment: Alignment.center,
        child: Text(
          isLoggedIn ? 'Log Out' : 'Sign In',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Color(0xFF111827),
          ),
        ),
      ),
    );
  }

  Widget _buildAppVersion() {
    return const Center(
      child: Text(
        'App version 26.10.2',
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: Color(0xFF9CA3AF),
        ),
      ),
    );
  }
}

class _DashedDivider extends StatelessWidget {
  const _DashedDivider();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final boxWidth = constraints.constrainWidth();
        const dashWidth = 4.0;
        const dashSpace = 3.0;
        final dashCount = (boxWidth / (dashWidth + dashSpace)).floor();
        return Flex(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          direction: Axis.horizontal,
          children: List.generate(dashCount, (_) {
            return const SizedBox(
              width: dashWidth,
              height: 1,
              child: DecoratedBox(
                decoration: BoxDecoration(color: Color(0xFFE5E7EB)),
              ),
            );
          }),
        );
      },
    );
  }
}

class _RupeeRefreshBadge extends StatelessWidget {
  final double size;
  const _RupeeRefreshBadge({required this.size});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(Icons.autorenew_rounded, size: size, color: const Color(0xFF111827)),
          Padding(
            padding: EdgeInsets.only(bottom: size * 0.04),
            child: Text(
              '₹',
              style: TextStyle(
                fontSize: size * 0.44,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF111827),
                height: 1.0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewStarIcon extends StatelessWidget {
  final double size;
  const _ReviewStarIcon({required this.size});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(Icons.chat_bubble_outline_rounded, size: size, color: const Color(0xFF111827)),
          Positioned(
            top: size * 0.16,
            child: Icon(Icons.star_rounded, size: size * 0.44, color: const Color(0xFF111827)),
          ),
        ],
      ),
    );
  }
}
