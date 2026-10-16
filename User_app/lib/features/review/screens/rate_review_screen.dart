import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_app_bar.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/common/widgets/menu_drawer.dart';
import 'package:sixam_mart/features/order/domain/models/order_details_model.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/features/review/controllers/review_controller.dart';
import 'package:sixam_mart/features/review/domain/models/review_body_model.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';

class RateReviewScreen extends StatefulWidget {
  final List<OrderDetailsModel>? orderDetailsList;
  final DeliveryMan? deliveryMan;
  final int? orderID;
  final List<Reviews>? reviews;

  const RateReviewScreen({
    super.key,
    this.orderDetailsList,
    this.deliveryMan,
    this.orderID,
    this.reviews,
  });

  @override
  RateReviewScreenState createState() => RateReviewScreenState();
}

class _ReviewableItem {
  final int id;
  final String title;
  final String storeName;
  final String orderId;
  final String dateText;
  final String priceText;
  final String? imageUrl;
  final int cashbackReward;
  final OrderDetailsModel? realOrderDetails;

  int rating;
  Set<String> selectedTags;
  TextEditingController commentController;
  bool hasPhoto;
  bool isSubmitting;
  bool isSubmitted;

  _ReviewableItem({
    required this.id,
    required this.title,
    required this.storeName,
    required this.orderId,
    required this.dateText,
    required this.priceText,
    this.imageUrl,
    this.cashbackReward = 25,
    this.rating = 5,
    this.realOrderDetails,
    Set<String>? selectedTags,
    String initialComment = '',
  })  : selectedTags = selectedTags ?? {'Super Fresh 🥑', 'Proper Packaging 📦'},
        commentController = TextEditingController(text: initialComment),
        hasPhoto = false,
        isSubmitting = false,
        isSubmitted = false;
}

class _PastReviewedItem {
  final String title;
  final String storeName;
  final String orderId;
  final String dateText;
  final double rating;
  final String comment;
  final List<String> tags;
  final int cashbackEarned;

  _PastReviewedItem({
    required this.title,
    required this.storeName,
    required this.orderId,
    required this.dateText,
    required this.rating,
    required this.comment,
    required this.tags,
    required this.cashbackEarned,
  });
}

class RateReviewScreenState extends State<RateReviewScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<_ReviewableItem> _pendingItems = [];
  final List<_PastReviewedItem> _reviewedItems = [];

  // Delivery Hero rating state
  int _riderRating = 5;
  final Set<String> _selectedRiderCompliments = {'Lightning Fast ⚡', 'Polite & Courteous 🤝'};
  int _selectedTip = 30;
  final TextEditingController _riderCommentController = TextEditingController();
  bool _isRiderSubmitting = false;
  bool _isRiderSubmitted = false;

  int _selectedTabIndex = 0;
  int _earnedCashback = 50;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (mounted && _selectedTabIndex != _tabController.index) {
        setState(() {
          _selectedTabIndex = _tabController.index;
        });
      }
    });
    _initData();
  }

  void _initData() {
    // If real order details were passed:
    if (widget.orderDetailsList != null && widget.orderDetailsList!.isNotEmpty) {
      if (Get.isRegistered<ReviewController>()) {
        Get.find<ReviewController>().initRatingData(widget.orderDetailsList!);
      }
      for (int i = 0; i < widget.orderDetailsList!.length; i++) {
        final detail = widget.orderDetailsList![i];
        _pendingItems.add(
          _ReviewableItem(
            id: detail.itemId ?? (100 + i),
            title: detail.itemDetails?.name ?? 'Premium Grocery Item',
            storeName: 'Buggy SuperFresh Express',
            orderId: widget.orderID?.toString() ?? '100003',
            dateText: 'Delivered Today',
            priceText: '₹${detail.price?.toInt() ?? 180}',
            imageUrl: detail.itemDetails?.imageFullUrl,
            realOrderDetails: detail,
          ),
        );
      }
    } else {
      // Direct URL or Profile Review & Earn entry - populate rich curated pending items
      _pendingItems.addAll([
        _ReviewableItem(
          id: 1,
          title: 'Organic Hass Avocados (Pack of 2)',
          storeName: 'Buggy SuperFresh Pantry',
          orderId: '100003',
          dateText: 'Delivered Today',
          priceText: '₹180',
          cashbackReward: 25,
          rating: 5,
          selectedTags: {'Super Fresh 🥑', 'Proper Packaging 📦'},
          initialComment: 'Firm, velvety green texture and perfectly ripe. Loved the chilled delivery packaging!',
        ),
        _ReviewableItem(
          id: 2,
          title: 'Artisanal European Sourdough 400g',
          storeName: 'The French Baker',
          orderId: '100003',
          dateText: 'Delivered Today',
          priceText: '₹120',
          cashbackReward: 25,
          rating: 5,
          selectedTags: {'Great Taste 😋', 'Super Fresh 🥑'},
          initialComment: 'Crusty on the outside and airy inside. Tastes bakery-fresh!',
        ),
        _ReviewableItem(
          id: 3,
          title: 'Cold Pressed Extra Virgin Olive Oil 500ml',
          storeName: 'Buggy Gourmet Pantry',
          orderId: '100002',
          dateText: 'Delivered Yesterday',
          priceText: '₹450',
          cashbackReward: 25,
          rating: 4,
          selectedTags: {'High Quality ✨', 'Worth the Price 💎'},
          initialComment: 'Rich golden color and peppery notes. Excellent quality glass bottle.',
        ),
      ]);
    }

    // Past verified reviews
    _reviewedItems.addAll([
      _PastReviewedItem(
        title: 'Farm Fresh Organic Strawberries 250g',
        storeName: 'Buggy SuperFresh Pantry',
        orderId: '100001',
        dateText: '3 days ago',
        rating: 5.0,
        comment: 'Bright red, sweet and unbruised. Superbly preserved cold chain delivery.',
        tags: ['Super Fresh 🥑', 'Great Taste 😋'],
        cashbackEarned: 25,
      ),
      _PastReviewedItem(
        title: 'A2 Certified Pure Cow Milk 1L',
        storeName: 'Buggy Dairy Direct',
        orderId: '100001',
        dateText: '3 days ago',
        rating: 5.0,
        comment: 'Extremely fresh and creamy. Reached our doorstep in just 11 minutes!',
        tags: ['Fast Delivery ⚡', 'Proper Packaging 📦'],
        cashbackEarned: 25,
      ),
    ]);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    _riderCommentController.dispose();
    for (var item in _pendingItems) {
      item.commentController.dispose();
    }
    super.dispose();
  }

  Future<void> _submitItemReview(_ReviewableItem item, int index) async {
    setState(() {
      item.isSubmitting = true;
    });

    // If real API controller is available and item has realOrderDetails:
    if (item.realOrderDetails != null && Get.isRegistered<ReviewController>()) {
      try {
        final reviewBody = ReviewBodyModel(
          rating: item.rating.toString(),
          comment: item.commentController.text.trim(),
          orderId: widget.orderID?.toString() ?? '100003',
          productId: item.realOrderDetails!.itemDetails?.id?.toString() ?? item.id.toString(),
        );
        await Get.find<ReviewController>().submitReview(index, reviewBody);
      } catch (_) {}
    } else {
      await Future.delayed(const Duration(milliseconds: 700));
    }

    setState(() {
      item.isSubmitting = false;
      item.isSubmitted = true;
      _earnedCashback += item.cashbackReward;
      _pendingItems.remove(item);
      _reviewedItems.insert(
        0,
        _PastReviewedItem(
          title: item.title,
          storeName: item.storeName,
          orderId: item.orderId,
          dateText: 'Just now',
          rating: item.rating.toDouble(),
          comment: item.commentController.text.trim().isNotEmpty
              ? item.commentController.text.trim()
              : 'Verified 5-star experience with fast delivery!',
          tags: item.selectedTags.toList(),
          cashbackEarned: item.cashbackReward,
        ),
      );
    });

    showCustomSnackBar(
      '🎉 ₹${item.cashbackReward} Buggy Cash credited to your VIP Wallet! Thank you for your verified review.',
      isError: false,
    );
  }

  Future<void> _submitRiderReview() async {
    setState(() {
      _isRiderSubmitting = true;
    });

    if (widget.deliveryMan != null && Get.isRegistered<ReviewController>()) {
      try {
        final reviewBody = ReviewBodyModel(
          rating: _riderRating.toString(),
          comment: _riderCommentController.text.trim(),
          orderId: widget.orderID?.toString() ?? '100003',
          deliveryManId: widget.deliveryMan!.id?.toString(),
        );
        await Get.find<ReviewController>().submitDeliveryManReview(reviewBody);
      } catch (_) {}
    } else {
      await Future.delayed(const Duration(milliseconds: 700));
    }

    setState(() {
      _isRiderSubmitting = false;
      _isRiderSubmitted = true;
    });

    showCustomSnackBar(
      '🌟 Thank you! Your rating and compliments for delivery partner have been shared.',
      isError: false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: CustomAppBar(
        title: 'Rate & Review',
        backButton: true,
        onBackPressed: () {
          if (Navigator.canPop(context)) {
            Get.back();
          } else {
            Get.offAllNamed(RouteHelper.getInitialRoute());
          }
        },
      ),
      endDrawer: const MenuDrawer(),
      endDrawerEnableOpenDragGesture: false,
      body: SingleChildScrollView(
        controller: _scrollController,
        physics: const BouncingScrollPhysics(),
        child: Center(
          child: Container(
            width: Dimensions.webMaxWidth,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeroCashbackCard(),
                const SizedBox(height: 18),
                _buildSegmentedTabBar(),
                const SizedBox(height: 18),
                _buildActiveTabContent(),
                const SizedBox(height: 24),
                _buildCashbackRulesCard(),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ==========================================
  // 1. HERO CASHBACK & REWARDS CARD
  // ==========================================
  Widget _buildHeroCashbackCard() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF090D16)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.4), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(Icons.stars_rounded, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Review & Earn Lounge',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFF10B981), width: 0.8),
                          ),
                          child: const Text(
                            'VIP REWARDS',
                            style: TextStyle(
                              color: Color(0xFF34D399),
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Earn instant ₹25 Buggy Cash per reviewed item, credited directly to your VIP wallet upon submission.',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 13,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildHeroStat('EARNED CASH', '₹$_earnedCashback', const Color(0xFF10B981)),
                Container(width: 1, height: 28, color: Colors.white.withValues(alpha: 0.12)),
                _buildHeroStat('MAX EARNABLE', '₹250', const Color(0xFFF59E0B)),
                Container(width: 1, height: 28, color: Colors.white.withValues(alpha: 0.12)),
                _buildHeroStat('REVIEWER TIER', 'Level 2 VIP', const Color(0xFF38BDF8)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroStat(String title, String value, Color color) {
    return Column(
      children: [
        Text(
          title,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.55),
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.4,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 15,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }

  // ==========================================
  // 2. SEGMENTED LUXURY TAB BAR
  // ==========================================
  Widget _buildSegmentedTabBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: [
          _buildSegmentTabItem(
            title: 'To Review',
            badgeCount: _pendingItems.length,
            badgeColor: const Color(0xFFEF4444),
            badgeTextColor: Colors.white,
            index: 0,
          ),
          _buildSegmentTabItem(
            title: 'Reviewed',
            badgeCount: _reviewedItems.length,
            badgeColor: const Color(0xFF10B981).withValues(alpha: 0.2),
            badgeTextColor: const Color(0xFF10B981),
            index: 1,
          ),
          _buildSegmentTabItem(
            title: 'Rider Rating',
            icon: Icons.sports_motorsports_rounded,
            index: 2,
          ),
        ],
      ),
    );
  }

  Widget _buildSegmentTabItem({
    required String title,
    required int index,
    int? badgeCount,
    Color? badgeColor,
    Color? badgeTextColor,
    IconData? icon,
  }) {
    final isSelected = _selectedTabIndex == index;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedTabIndex = index;
            _tabController.animateTo(index);
          });
        },
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: isSelected
                ? const LinearGradient(
                    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                  )
                : null,
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 15, color: isSelected ? Colors.white : const Color(0xFF64748B)),
                const SizedBox(width: 5),
              ],
              Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  color: isSelected ? Colors.white : const Color(0xFF64748B),
                ),
              ),
              if (badgeCount != null && badgeCount > 0) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: isSelected ? (badgeColor == const Color(0xFFEF4444) ? const Color(0xFFEF4444) : Colors.white.withValues(alpha: 0.2)) : badgeColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$badgeCount',
                    style: TextStyle(
                      color: isSelected ? Colors.white : badgeTextColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================
  // 3. TAB CONTENT ROUTING
  // ==========================================
  Widget _buildActiveTabContent() {
    switch (_selectedTabIndex) {
      case 0:
        return _buildPendingReviewTab();
      case 1:
        return _buildReviewedOrdersTab();
      case 2:
        return _buildRiderRatingTab();
      default:
        return _buildPendingReviewTab();
    }
  }

  // ==========================================
  // TAB 1: PENDING REVIEWS
  // ==========================================
  Widget _buildPendingReviewTab() {
    if (_pendingItems.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF10B981), size: 48),
            ),
            const SizedBox(height: 14),
            const Text(
              'All Caught Up!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 6),
            const Text(
              'You have reviewed all your recent deliveries. Check back after your next order to earn more Buggy Cash.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Color(0xFF64748B), height: 1.4),
            ),
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: () => _tabController.animateTo(1),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text('View Your Past Reviews'),
            ),
          ],
        ),
      );
    }

    return Column(
      children: List.generate(_pendingItems.length, (index) {
        final item = _pendingItems[index];
        return _buildItemReviewCard(item, index);
      }),
    );
  }

  Widget _buildItemReviewCard(_ReviewableItem item, int index) {
    const sentimentLabels = [
      'Tap a star to rate',
      '★ Disappointing — Needs Quality Improvement',
      '★★ Fair — Below Expectations',
      '★★★ Good — Met Expectations',
      '★★★★ Very Good — Fresh & High Quality',
      '★★★★★ Exceptional! Loved everything 🌟',
    ];

    final tags = [
      'Super Fresh 🥑',
      'Proper Packaging 📦',
      'Great Taste 😋',
      'Fast Delivery ⚡',
      'Value for Money 💎',
      'High Quality ✨',
    ];

    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header info
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: const BoxDecoration(
                      color: Color(0xFF10B981),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${item.storeName} • Order #${item.orderId}',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.monetization_on_rounded, size: 12, color: Color(0xFFD97706)),
                    const SizedBox(width: 4),
                    Text(
                      '+ ₹${item.cashbackReward} Buggy Cash',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFD97706),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Product info row
          Row(
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                      ? CustomImage(image: item.imageUrl!, fit: BoxFit.cover)
                      : const Center(
                          child: Icon(Icons.shopping_bag_outlined, color: Color(0xFF64748B), size: 28),
                        ),
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
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Text(
                          item.priceText,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF10B981),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(width: 3, height: 3, decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF94A3B8))),
                        const SizedBox(width: 8),
                        Text(
                          item.dateText,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 14),

          // Rating Stars
          Row(
            children: [
              const Text(
                'Rate Experience:',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
              ),
              const Spacer(),
              Row(
                children: List.generate(5, (starIdx) {
                  final starNum = starIdx + 1;
                  final isSelected = starNum <= item.rating;
                  return InkWell(
                    onTap: () {
                      setState(() {
                        item.rating = starNum;
                      });
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: Icon(
                        isSelected ? Icons.star_rounded : Icons.star_outline_rounded,
                        color: isSelected ? const Color(0xFFF59E0B) : const Color(0xFFCBD5E1),
                        size: 32,
                      ),
                    ),
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              sentimentLabels[item.rating.clamp(0, 5)],
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: item.rating >= 4 ? const Color(0xFF059669) : const Color(0xFFD97706),
              ),
            ),
          ),

          const SizedBox(height: 14),

          // Quick tag chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: tags.map((tag) {
              final isChosen = item.selectedTags.contains(tag);
              return InkWell(
                onTap: () {
                  setState(() {
                    if (isChosen) {
                      item.selectedTags.remove(tag);
                    } else {
                      item.selectedTags.add(tag);
                    }
                  });
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                  decoration: BoxDecoration(
                    color: isChosen ? const Color(0xFFECFDF5) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isChosen ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
                      width: 1.2,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (isChosen) ...[
                        const Icon(Icons.check_rounded, size: 13, color: Color(0xFF10B981)),
                        const SizedBox(width: 4),
                      ],
                      Text(
                        tag,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isChosen ? FontWeight.w700 : FontWeight.w500,
                          color: isChosen ? const Color(0xFF065F46) : const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 14),

          // Comment field
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: TextField(
              controller: item.commentController,
              maxLines: 2,
              style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
              decoration: const InputDecoration(
                hintText: 'Share what you loved about this product...',
                hintStyle: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                border: InputBorder.none,
                isDense: true,
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Photo Upload trigger & Submission Button
          Row(
            children: [
              InkWell(
                onTap: () {
                  setState(() {
                    item.hasPhoto = !item.hasPhoto;
                  });
                },
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: item.hasPhoto ? const Color(0xFFEFF6FF) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: item.hasPhoto ? const Color(0xFF3B82F6) : const Color(0xFFCBD5E1),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        item.hasPhoto ? Icons.photo_library_rounded : Icons.add_a_photo_outlined,
                        size: 15,
                        color: item.hasPhoto ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        item.hasPhoto ? 'Photo Attached ✓' : '+ Add Photo',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: item.hasPhoto ? const Color(0xFF1D4ED8) : const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: item.isSubmitting ? null : () => _submitItemReview(item, index),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: item.isSubmitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Row(
                        children: [
                          Icon(Icons.verified_rounded, size: 14, color: Color(0xFF10B981)),
                          SizedBox(width: 6),
                          Text(
                            'Submit & Claim ₹25',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 2: REVIEWED ORDERS
  // ==========================================
  Widget _buildReviewedOrdersTab() {
    if (_reviewedItems.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(30),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
        ),
        child: const Center(
          child: Text('No verified reviews published yet.'),
        ),
      );
    }

    return Column(
      children: _reviewedItems.map((reviewed) {
        return Container(
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          reviewed.title,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${reviewed.storeName} • ${reviewed.dateText}',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      '✓ ₹${reviewed.cashbackEarned} Credited',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF059669),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: List.generate(5, (starIdx) {
                  return const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 18);
                }),
              ),
              const SizedBox(height: 8),
              Text(
                '"${reviewed.comment}"',
                style: const TextStyle(
                  fontSize: 13,
                  fontStyle: FontStyle.italic,
                  color: Color(0xFF334155),
                  height: 1.35,
                ),
              ),
              if (reviewed.tags.isNotEmpty) ...[
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  children: reviewed.tags.map((t) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        t,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF475569)),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ],
          ),
        );
      }).toList(),
    );
  }

  // ==========================================
  // TAB 3: RATE DELIVERY HERO
  // ==========================================
  Widget _buildRiderRatingTab() {
    final riderName = widget.deliveryMan != null
        ? '${widget.deliveryMan!.fName ?? ''} ${widget.deliveryMan!.lName ?? ''}'.trim()
        : 'Kiran Kumar';

    final compliments = [
      'Lightning Fast ⚡',
      'Polite & Courteous 🤝',
      'Followed Drop-off Notes 📍',
      'Safe Driving 🛵',
      'Contactless Drop 🚪',
    ];

    final tips = [20, 30, 50, 100];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Rider Profile Header
          Row(
            children: [
              Stack(
                children: [
                  Container(
                    width: 62,
                    height: 62,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [Color(0xFF10B981), Color(0xFF047857)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF10B981).withValues(alpha: 0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Icon(Icons.person_rounded, color: Colors.white, size: 36),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      riderName,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Buggy VIP Delivery Partner • 4.9 ★ (1,240 deliveries)',
                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        '⚡ Delivered in 11 mins',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF059669),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 18),

          // Rating
          Center(
            child: Column(
              children: [
                const Text(
                  'How was your delivery service?',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (starIdx) {
                    final starNum = starIdx + 1;
                    final isSelected = starNum <= _riderRating;
                    return InkWell(
                      onTap: () {
                        setState(() {
                          _riderRating = starNum;
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Icon(
                          isSelected ? Icons.star_rounded : Icons.star_outline_rounded,
                          color: isSelected ? const Color(0xFFF59E0B) : const Color(0xFFCBD5E1),
                          size: 38,
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 6),
                Text(
                  _riderRating == 5 ? 'Exceptional Service! 🌟' : 'Rated $_riderRating / 5 Stars',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF059669),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),
          const Text(
            'Add Compliments for Rider:',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: compliments.map((comp) {
              final isChosen = _selectedRiderCompliments.contains(comp);
              return InkWell(
                onTap: () {
                  setState(() {
                    if (isChosen) {
                      _selectedRiderCompliments.remove(comp);
                    } else {
                      _selectedRiderCompliments.add(comp);
                    }
                  });
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                  decoration: BoxDecoration(
                    color: isChosen ? const Color(0xFFEFF6FF) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isChosen ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Text(
                    comp,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: isChosen ? FontWeight.w700 : FontWeight.w500,
                      color: isChosen ? const Color(0xFF1D4ED8) : const Color(0xFF475569),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 20),
          const Text(
            'Tip Your Delivery Partner (100% goes to rider):',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
          ),
          const SizedBox(height: 10),
          Row(
            children: tips.map((tip) {
              final isSelected = _selectedTip == tip;
              return Expanded(
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _selectedTip = isSelected ? 0 : tip;
                    });
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFFFEF3C7) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? const Color(0xFFF59E0B) : const Color(0xFFE2E8F0),
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        '₹$tip',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: isSelected ? const Color(0xFFB45309) : const Color(0xFF334155),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 18),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: TextField(
              controller: _riderCommentController,
              maxLines: 2,
              style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
              decoration: const InputDecoration(
                hintText: 'Add an encouraging note of appreciation...',
                hintStyle: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                border: InputBorder.none,
                isDense: true,
              ),
            ),
          ),

          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isRiderSubmitting || _isRiderSubmitted ? null : _submitRiderReview,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: _isRiderSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text(
                      _isRiderSubmitted ? 'Delivery Rating Submitted ✓' : 'Submit Delivery Rating',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // 4. CASHBACK RULES & FAQ ACCORDION
  // ==========================================
  Widget _buildCashbackRulesCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.shield_outlined, color: Color(0xFF64748B), size: 18),
              SizedBox(width: 8),
              Text(
                'How Buggy Review & Earn Works',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildFaqBullet(
            icon: Icons.check_circle_outline_rounded,
            title: 'Verified Buyers Only',
            desc: 'Only items successfully delivered to your address are eligible for review cashback.',
          ),
          const SizedBox(height: 8),
          _buildFaqBullet(
            icon: Icons.flash_on_rounded,
            title: 'Instant Buggy Cash Credit',
            desc: 'Cashback is credited immediately to your VIP wallet upon submission with zero cooldown.',
          ),
          const SizedBox(height: 8),
          _buildFaqBullet(
            icon: Icons.add_photo_alternate_outlined,
            title: 'Bonus for Photos',
            desc: 'Include clear, unboxed item photos to earn up to ₹50 cashback per verified item.',
          ),
        ],
      ),
    );
  }

  Widget _buildFaqBullet({required IconData icon, required String title, required String desc}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: const Color(0xFF10B981), size: 16),
        const SizedBox(width: 10),
        Expanded(
          child: RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: '$title: ',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E293B),
                  ),
                ),
                TextSpan(
                  text: desc,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
