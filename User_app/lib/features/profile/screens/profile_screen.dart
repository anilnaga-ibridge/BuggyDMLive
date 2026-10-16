import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/features/address/controllers/address_controller.dart';
import 'package:sixam_mart/features/auth/controllers/auth_controller.dart';
import 'package:sixam_mart/features/cart/controllers/cart_controller.dart';
import 'package:sixam_mart/features/favourite/controllers/favourite_controller.dart';
import 'package:sixam_mart/features/home/controllers/home_controller.dart';
import 'package:sixam_mart/features/order/controllers/order_controller.dart';
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
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFEDE9FE), Color(0xFFDDD6FE)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.auto_awesome_rounded, color: Color(0xFF7C3AED), size: 24),
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
                          'Tell us what premium products you want on Buggy',
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
                  hintText: 'e.g. Imported Avocados, Artisanal Sourdough, Ferrero Rocher...',
                  hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                  filled: true,
                  fillColor: const Color(0xFFF9FAFB),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                  focusedBorder: const OutlineInputBorder(
                    borderRadius: BorderRadius.all(Radius.circular(14)),
                    borderSide: BorderSide(color: Color(0xFF7C3AED), width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF111827),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    showCustomSnackBar('Thank you for your suggestion! Our concierge will review it.', isError: false);
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
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(24),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Legal & Policies',
                  style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: Color(0xFF111827)),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Review Buggy customer protection guarantees & policies',
                  style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                ),
                const SizedBox(height: 18),
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
                  icon: Icons.shield_outlined,
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
                    title: 'Shipping & Delivery Policy',
                    icon: Icons.local_shipping_outlined,
                    onTap: () {
                      Navigator.pop(ctx);
                      Get.toNamed(RouteHelper.shippingPolicy);
                    },
                  ),
                if ((config?.toggleDmRegistration ?? false) && !isDesktop)
                  _buildGeneralInfoTile(
                    title: 'Partner with Us: Delivery Fleet',
                    icon: Icons.two_wheeler_outlined,
                    onTap: () {
                      Navigator.pop(ctx);
                      Get.toNamed(RouteHelper.getDeliverymanRegistrationRoute());
                    },
                  ),
                if ((config?.toggleStoreRegistration ?? false) && !isDesktop)
                  _buildGeneralInfoTile(
                    title: 'Partner with Us: Open a Store / Merchant',
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
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        tileColor: const Color(0xFFF9FAFB),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Icon(icon, color: const Color(0xFF1E293B), size: 19),
        ),
        title: Text(
          title,
          style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600, color: Color(0xFF111827)),
        ),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFF9CA3AF), size: 14),
        onTap: onTap,
      ),
    );
  }

  void _showPayLaterBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
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
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Text('₹', style: TextStyle(color: Color(0xFF10B981), fontSize: 24, fontWeight: FontWeight.w900)),
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Buggy Pay Later',
                        style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: Color(0xFF111827)),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Pre-approved instant credit powered by Snapmint',
                        style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 22),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.15),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('CURRENT DUES', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                        SizedBox(height: 4),
                        Text('₹0', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white)),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF064E3B),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.5)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle_rounded, color: Color(0xFF34D399), size: 14),
                          SizedBox(width: 5),
                          Text('No Dues Pending', style: TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.w700, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                '• Instant one-click checkout on all grocery & food orders\n• 15-day interest-free billing cycle with zero hidden fees\n• Auto-debit and flexible UPI repayment anytime',
                style: TextStyle(fontSize: 13.5, color: Color(0xFF4B5563), height: 1.6),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF111827),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Got It', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
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
      backgroundColor: const Color(0xFFF8FAFC),
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
                      _buildLuxuryTopBar(context),
                      const SizedBox(height: 16),
                      _buildVipBlackCard(context, profileController, isLoggedIn),
                      const SizedBox(height: 18),
                      _buildLuxuryQuickDock(context),
                      const SizedBox(height: 18),
                      _buildFinancialSuite(context, profileController),
                      const SizedBox(height: 22),
                      _buildCategorizedExecutiveHub(context, addressCount),
                      const SizedBox(height: 22),
                      _buildLuxuryLogoutButton(context, isLoggedIn),
                      const SizedBox(height: 18),
                      _buildLuxuryBrandFooter(),
                      const SizedBox(height: 36),
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

  // 1. Sleek Top Bar
  Widget _buildLuxuryTopBar(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
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
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Center(
                  child: Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Color(0xFF0F172A)),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Account & Profile',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.4,
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    const Text(
                      'VIP Member Lounge',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        // Right Crown VIP Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.workspace_premium_rounded, size: 16, color: Color(0xFFB45309)),
              SizedBox(width: 4),
              Text(
                'ELITE',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF78350F),
                  letterSpacing: 0.6,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // 2. The Signature "Buggy Black / VIP Elite" Metal Card
  Widget _buildVipBlackCard(BuildContext context, ProfileController profileController, bool isLoggedIn) {
    final user = profileController.userInfoModel;
    final String fullName = isLoggedIn
        ? ('${user?.fName ?? ''} ${user?.lName ?? ''}').trim()
        : 'Guest Explorer';
    final String displayName = fullName.isNotEmpty ? fullName : 'Valued Customer';
    final String phone = isLoggedIn
        ? (user?.phone ?? '')
        : 'Tap to sign in & unlock privileges';
    final String? imageUrl = isLoggedIn ? user?.imageFullUrl : null;
    final double balance = user?.walletBalance ?? 0.0;
    final String formattedBalance = balance % 1 == 0
        ? balance.toInt().toString()
        : balance.toStringAsFixed(2);
    final int points = user?.loyaltyPoint ?? 450;
    final int orders = user?.orderCount ?? 1;

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF0F172A),
            Color(0xFF1E293B),
            Color(0xFF090D16),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: const Color(0xFFD4AF37).withValues(alpha: 0.4),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: const Color(0xFF059669).withValues(alpha: 0.15),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background subtle luxury watermark / glow
          Positioned(
            right: -25,
            top: -25,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFFD4AF37).withValues(alpha: 0.12),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Card Header: Microchip & "BUGGY BLACK VIP"
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        // Microchip icon simulation
                        Container(
                          width: 28,
                          height: 22,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFFDE68A), Color(0xFFD97706)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Center(
                            child: Container(
                              width: 22,
                              height: 16,
                              decoration: BoxDecoration(
                                border: Border.all(color: const Color(0xFF78350F).withValues(alpha: 0.5), width: 0.8),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'BUGGY BLACK',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                            color: Color(0xFFF59E0B),
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF064E3B),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.6)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.stars_rounded, size: 12, color: Color(0xFF34D399)),
                          SizedBox(width: 4),
                          Text(
                            'TIER 1 VIP',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                              color: Color(0xFF34D399),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Center Identity: Avatar + Name + Edit
                Row(
                  children: [
                    // Metallic glowing ring avatar
                    Stack(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(2.5),
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: [
                                Color(0xFFF59E0B),
                                Color(0xFF10B981),
                                Color(0xFF38BDF8),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                          child: Container(
                            width: 60,
                            height: 60,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Color(0xFF0F172A),
                            ),
                            child: ClipOval(
                              child: (imageUrl != null && imageUrl.isNotEmpty)
                                  ? CustomImage(
                                      image: imageUrl,
                                      width: 60,
                                      height: 60,
                                      fit: BoxFit.cover,
                                    )
                                  : const Center(
                                      child: Icon(
                                        Icons.person_rounded,
                                        size: 38,
                                        color: Color(0xFFF8FAFC),
                                      ),
                                    ),
                            ),
                          ),
                        ),
                        if (isLoggedIn)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: const BoxDecoration(
                                color: Color(0xFF0F172A),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.verified_rounded,
                                size: 18,
                                color: Color(0xFFF59E0B),
                              ),
                            ),
                          ),
                      ],
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
                              fontSize: 21,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: -0.4,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            phone,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w400,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Edit Profile Frosted Capsule
                    InkWell(
                      onTap: () {
                        if (isLoggedIn) {
                          Get.toNamed(RouteHelper.getUpdateProfileRoute());
                        } else {
                          Get.toNamed(RouteHelper.getSignInRoute(Get.currentRoute));
                        }
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: const Color(0xFF334155).withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.edit_outlined, size: 13, color: Colors.white),
                            SizedBox(width: 4),
                            Text(
                              'Edit',
                              style: TextStyle(
                                fontSize: 12,
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

                const SizedBox(height: 22),

                // Fine metallic divider
                Container(
                  height: 1,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        const Color(0xFF475569).withValues(alpha: 0.7),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Card Bottom Stats Row
                Row(
                  children: [
                    Expanded(
                      child: _buildCardStatColumn(
                        label: 'WALLET CASH',
                        value: '₹$formattedBalance',
                        actionLabel: '+ Add',
                        actionColor: const Color(0xFFF59E0B),
                        onTap: () => Get.toNamed(RouteHelper.getWalletRoute()),
                      ),
                    ),
                    Container(width: 1, height: 32, color: const Color(0xFF334155)),
                    Expanded(
                      child: _buildCardStatColumn(
                        label: 'LOYALTY PTS',
                        value: '$points Pts',
                        actionLabel: 'Convert',
                        actionColor: const Color(0xFF38BDF8),
                        onTap: () => Get.toNamed(RouteHelper.getLoyaltyRoute()),
                      ),
                    ),
                    Container(width: 1, height: 32, color: const Color(0xFF334155)),
                    Expanded(
                      child: _buildCardStatColumn(
                        label: 'TOTAL ORDERS',
                        value: '$orders Completed',
                        actionLabel: 'History',
                        actionColor: const Color(0xFF34D399),
                        onTap: () => Get.to(() => const MyOrderScreen()),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardStatColumn({
    required String label,
    required String value,
    required String actionLabel,
    required Color actionColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: Color(0xFF94A3B8),
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            actionLabel,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: actionColor,
            ),
          ),
        ],
      ),
    );
  }

  // 3. Floating Luxury Quick Dock
  Widget _buildLuxuryQuickDock(BuildContext context) {
    return GetBuilder<OrderController>(builder: (orderController) {
      final runningOrdersCount = orderController.runningOrderModel?.orders?.length ?? 0;

      return Row(
        children: [
          Expanded(
            child: _buildQuickDockItem(
              icon: Icons.receipt_long_rounded,
              iconColor: const Color(0xFF059669),
              iconBg: const Color(0xFFECFDF5),
              title: 'My Orders',
              badge: runningOrdersCount > 0 ? '$runningOrdersCount Live' : null,
              badgeColor: const Color(0xFF10B981),
              onTap: () => Get.to(() => const MyOrderScreen()),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _buildQuickDockItem(
              icon: Icons.support_agent_rounded,
              iconColor: const Color(0xFF7C3AED),
              iconBg: const Color(0xFFEDE9FE),
              title: 'Concierge',
              subtitle: '24/7 VIP Help',
              onTap: () => Get.toNamed(RouteHelper.getSupportRoute()),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _buildQuickDockItem(
              icon: Icons.favorite_rounded,
              iconColor: const Color(0xFFE11D48),
              iconBg: const Color(0xFFFFE4E6),
              title: 'Wishlist',
              subtitle: 'Saved Items',
              onTap: () => Get.toNamed(RouteHelper.getFavouriteScreen()),
            ),
          ),
        ],
      );
    });
  }

  Widget _buildQuickDockItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    String? subtitle,
    String? badge,
    Color? badgeColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: iconBg,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(icon, size: 22, color: iconColor),
                  ),
                ),
                if (badge != null)
                  Positioned(
                    top: -4,
                    right: -10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: badgeColor ?? const Color(0xFF10B981),
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: (badgeColor ?? const Color(0xFF10B981)).withValues(alpha: 0.4),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Text(
                        badge,
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // 4. Financial & Credit Privileges Suite
  Widget _buildFinancialSuite(BuildContext context, ProfileController profileController) {
    final double balance = profileController.userInfoModel?.walletBalance ?? 0.0;
    final String formattedBalance = balance % 1 == 0
        ? balance.toInt().toString()
        : balance.toStringAsFixed(2);

    return Column(
      children: [
        // Buggy Cash Luxury Banner
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              InkWell(
                onTap: () => Get.toNamed(RouteHelper.getWalletRoute()),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF7C3AED).withValues(alpha: 0.3),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 18),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Buggy Cash & Gift Cards',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Instant 1-click checkout with guaranteed security',
                              style: TextStyle(
                                fontSize: 11.5,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFF94A3B8), size: 14),
                    ],
                  ),
                ),
              ),

              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
              ),

              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                child: Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Available Balance',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '₹$formattedBalance',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                    const Spacer(),
                    InkWell(
                      onTap: () => Get.toNamed(RouteHelper.getWalletRoute()),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.15),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.add_rounded, color: Color(0xFFF59E0B), size: 16),
                            SizedBox(width: 4),
                            Text(
                              'Add Funds',
                              style: TextStyle(
                                fontSize: 12.5,
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
            ],
          ),
        ),

        const SizedBox(height: 12),

        // Buggy Pay Later Premium Row
        InkWell(
          onTap: () => _showPayLaterBottomSheet(context),
          borderRadius: BorderRadius.circular(18),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Center(
                    child: Icon(Icons.sync_alt_rounded, color: Color(0xFF059669), size: 20),
                  ),
                ),
                const SizedBox(width: 12),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Buggy Pay Later',
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        SizedBox(width: 6),
                        Text(
                          'by snapmint',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF059669),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 2),
                    Text(
                      '15-day zero-interest credit line',
                      style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'No dues',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF475569),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFF94A3B8), size: 13),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // 5. Categorized Executive Hub
  Widget _buildCategorizedExecutiveHub(BuildContext context, int addressCount) {
    return Column(
      children: [
        // Group 1: Privileges & Rewards
        _buildLuxurySectionCard(
          categoryTitle: 'PRIVILEGES & REWARDS',
          categoryIcon: Icons.workspace_premium_rounded,
          categoryColor: const Color(0xFFD97706),
          items: [
            _LuxuryMenuItem(
              icon: Icons.reviews_outlined,
              iconColor: const Color(0xFFD97706),
              iconBg: const Color(0xFFFEF3C7),
              title: 'Review & Earn',
              subtitle: 'Earn up to ₹250 wallet cashback on verified reviews',
              onTap: () => Get.toNamed(RouteHelper.getReviewRoute()),
            ),
            _LuxuryMenuItem(
              icon: Icons.card_giftcard_rounded,
              iconColor: const Color(0xFF0284C7),
              iconBg: const Color(0xFFE0F2FE),
              title: 'Rewards & Loyalty Points',
              subtitle: 'Convert loyalty points to direct wallet cash',
              onTap: () => Get.toNamed(RouteHelper.getLoyaltyRoute()),
            ),
            _LuxuryMenuItem(
              icon: Icons.discount_outlined,
              iconColor: const Color(0xFFE11D48),
              iconBg: const Color(0xFFFFE4E6),
              title: 'E-Gift Cards & Coupons',
              subtitle: 'Explore available promo codes & voucher balances',
              onTap: () => Get.toNamed(RouteHelper.getCouponRoute()),
            ),
            _LuxuryMenuItem(
              icon: Icons.share_rounded,
              iconColor: const Color(0xFF059669),
              iconBg: const Color(0xFFECFDF5),
              title: 'Refer & Earn',
              subtitle: 'Invite friends & receive ₹100 instant bonus',
              onTap: () => Get.toNamed(RouteHelper.getReferAndEarnRoute()),
            ),
          ],
        ),

        const SizedBox(height: 18),

        // Group 2: Account & Delivery Settings
        _buildLuxurySectionCard(
          categoryTitle: 'ACCOUNT & DELIVERY SETTINGS',
          categoryIcon: Icons.manage_accounts_rounded,
          categoryColor: const Color(0xFF2563EB),
          items: [
            _LuxuryMenuItem(
              icon: Icons.place_outlined,
              iconColor: const Color(0xFF2563EB),
              iconBg: const Color(0xFFEFF6FF),
              title: 'Saved Addresses',
              subtitle: '$addressCount locations configured for priority drop-off',
              onTap: () => Get.toNamed(RouteHelper.getAddressRoute()),
            ),
            _LuxuryMenuItem(
              icon: Icons.credit_card_rounded,
              iconColor: const Color(0xFF7C3AED),
              iconBg: const Color(0xFFEDE9FE),
              title: 'Payment Methods & UPI',
              subtitle: 'Manage credit/debit cards, UPI & linked wallets',
              onTap: () => Get.toNamed(RouteHelper.getWalletRoute()),
            ),
            _LuxuryMenuItem(
              icon: Icons.notifications_active_outlined,
              iconColor: const Color(0xFFF59E0B),
              iconBg: const Color(0xFFFFFBEB),
              title: 'Notifications & Alerts',
              subtitle: 'Order tracking notifications & exclusive alerts',
              onTap: () => Get.toNamed(RouteHelper.getNotificationRoute()),
            ),
            _LuxuryMenuItem(
              icon: Icons.person_outline_rounded,
              iconColor: const Color(0xFF475569),
              iconBg: const Color(0xFFF1F5F9),
              title: 'Profile Details & Security',
              subtitle: 'Update name, contact number & login security',
              onTap: () => Get.toNamed(RouteHelper.getUpdateProfileRoute()),
            ),
          ],
        ),

        const SizedBox(height: 18),

        // Group 3: Concierge & Policies
        _buildLuxurySectionCard(
          categoryTitle: 'CONCIERGE & SUPPORT',
          categoryIcon: Icons.shield_outlined,
          categoryColor: const Color(0xFF059669),
          items: [
            _LuxuryMenuItem(
              icon: Icons.lightbulb_outline_rounded,
              iconColor: const Color(0xFF7C3AED),
              iconBg: const Color(0xFFEDE9FE),
              title: 'Suggest Products',
              subtitle: 'Request specialty or luxury items for our catalog',
              onTap: () => _showSuggestProductBottomSheet(context),
            ),
            _LuxuryMenuItem(
              icon: Icons.currency_exchange_rounded,
              iconColor: const Color(0xFF059669),
              iconBg: const Color(0xFFECFDF5),
              title: 'Your Refunds & Claims',
              subtitle: 'Real-time status of returned payments & disputes',
              onTap: () => Get.toNamed(RouteHelper.getWalletRoute()),
            ),
            _LuxuryMenuItem(
              icon: Icons.info_outline_rounded,
              iconColor: const Color(0xFF64748B),
              iconBg: const Color(0xFFF8FAFC),
              title: 'General Information & Policies',
              subtitle: 'Terms of service, privacy, cancellation & partner onboarding',
              onTap: () => _showGeneralInfoBottomSheet(context),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLuxurySectionCard({
    required String categoryTitle,
    required IconData categoryIcon,
    required Color categoryColor,
    required List<_LuxuryMenuItem> items,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Row(
            children: [
              Icon(categoryIcon, size: 14, color: categoryColor),
              const SizedBox(width: 6),
              Text(
                categoryTitle,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: categoryColor,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: items.length,
              separatorBuilder: (context, index) => const Padding(
                padding: EdgeInsets.only(left: 64, right: 16),
                child: Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
              ),
              itemBuilder: (context, index) {
                final item = items[index];
                return InkWell(
                  onTap: item.onTap,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                    child: Row(
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: item.iconBg,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Icon(item.icon, size: 20, color: item.iconColor),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title,
                                style: const TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              if (item.subtitle != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                  item.subtitle!,
                                  style: const TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w400,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.arrow_forward_ios_rounded,
                          color: Color(0xFFCBD5E1),
                          size: 13,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  // 6. Luxury Logout Button
  Widget _buildLuxuryLogoutButton(BuildContext context, bool isLoggedIn) {
    return InkWell(
      onTap: () => _handleLogout(context, isLoggedIn),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: double.infinity,
        height: 52,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isLoggedIn ? const Color(0xFFFEE2E2) : const Color(0xFFE2E8F0),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isLoggedIn ? Icons.power_settings_new_rounded : Icons.login_rounded,
              size: 19,
              color: isLoggedIn ? const Color(0xFFDC2626) : const Color(0xFF0F172A),
            ),
            const SizedBox(width: 8),
            Text(
              isLoggedIn ? 'Sign Out of Account' : 'Sign In to Buggy',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: isLoggedIn ? const Color(0xFFDC2626) : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 7. Brand Signature Footer
  Widget _buildLuxuryBrandFooter() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(width: 24, height: 1, color: const Color(0xFFCBD5E1)),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 10),
              child: Text(
                'BUGGY ULTRA LUXURY',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                  color: Color(0xFF94A3B8),
                ),
              ),
            ),
            Container(width: 24, height: 1, color: const Color(0xFFCBD5E1)),
          ],
        ),
        const SizedBox(height: 4),
        const Text(
          'Crafted with Excellence • Version 26.10.2',
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w500,
            color: Color(0xFF94A3B8),
          ),
        ),
      ],
    );
  }
}

class _LuxuryMenuItem {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  _LuxuryMenuItem({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    this.subtitle,
    required this.onTap,
  });
}
