import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sixam_mart/common/widgets/custom_button.dart';
import 'package:sixam_mart/common/widgets/custom_snackbar.dart';
import 'package:sixam_mart/features/order/domain/models/order_model.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/dimensions.dart';
import 'package:sixam_mart/util/images.dart';
import 'package:sixam_mart/util/styles.dart';

class Screen8RateExperience extends StatefulWidget {
  final OrderModel? order;
  final VoidCallback? onBack;
  final VoidCallback? onSubmitComplete;

  const Screen8RateExperience({
    super.key,
    this.order,
    this.onBack,
    this.onSubmitComplete,
  });

  @override
  State<Screen8RateExperience> createState() => _Screen8RateExperienceState();
}

class _Screen8RateExperienceState extends State<Screen8RateExperience> {
  int _orderRating = 5;
  final Set<String> _selectedOrderTags = {'On time', 'Good packaging', 'Fresh items'};
  final TextEditingController _feedbackController = TextEditingController();

  int _riderRating = 5;
  final Set<String> _selectedRiderTags = {'Polite', 'On time'};

  final List<String> _orderTags = [
    'On time',
    'Good packaging',
    'Fresh items',
    'Polite delivery partner',
    'Great experience',
  ];

  final List<String> _riderTags = [
    'Polite',
    'On time',
    'Helpful',
  ];

  String _getRatingText(int rating) {
    switch (rating) {
      case 5:
        return 'Excellent! 🥳';
      case 4:
        return 'Good! 😊';
      case 3:
        return 'Average! 😐';
      case 2:
        return 'Poor! 😕';
      default:
        return 'Terrible! 😞';
    }
  }

  @override
  void dispose() {
    _feedbackController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dm = widget.order?.deliveryMan;
    final String riderName = (dm != null && dm.fName != null) ? '${dm.fName} ${dm.lName ?? ''}'.trim() : 'Rohit Kumar';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1F2937), size: 20),
          onPressed: widget.onBack ?? () => Navigator.of(context).maybePop(),
        ),
        title: Text(
          'Rate Your Experience',
          style: robotoBold.copyWith(fontSize: 18, color: const Color(0xFF111827)),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Section 1: "How was your order?"
            Text(
              'How was your order?',
              style: robotoBold.copyWith(fontSize: 15, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 12),

            // 5 Green Stars
            Row(
              children: List.generate(5, (index) {
                final starIndex = index + 1;
                return InkWell(
                  onTap: () {
                    setState(() {
                      _orderRating = starIndex;
                    });
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Icon(
                      starIndex <= _orderRating ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: const Color(0xFF00A651),
                      size: 34,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 8),

            // Rating Text e.g. "Excellent! 🥳"
            Text(
              _getRatingText(_orderRating),
              style: robotoMedium.copyWith(fontSize: 13, color: const Color(0xFF00A651)),
            ),
            const SizedBox(height: 14),

            // Tag chips
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _orderTags.map((tag) {
                final isSelected = _selectedOrderTags.contains(tag);
                return InkWell(
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selectedOrderTags.remove(tag);
                      } else {
                        _selectedOrderTags.add(tag);
                      }
                    });
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFFE8F5E9) : const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF00A651) : const Color(0xFFE5E7EB),
                      ),
                    ),
                    child: Text(
                      tag,
                      style: robotoRegular.copyWith(
                        fontSize: 12,
                        color: isSelected ? const Color(0xFF00A651) : const Color(0xFF4B5563),
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Feedback Text Box
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  TextField(
                    controller: _feedbackController,
                    maxLength: 200,
                    maxLines: 3,
                    onChanged: (val) => setState(() {}),
                    decoration: const InputDecoration(
                      hintText: 'Share more feedback (optional)',
                      hintStyle: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
                      border: InputBorder.none,
                      counterText: '',
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                    style: robotoRegular.copyWith(fontSize: 13, color: const Color(0xFF1F2937)),
                  ),
                  Align(
                    alignment: Alignment.bottomRight,
                    child: Text(
                      '${_feedbackController.text.length}/200',
                      style: robotoRegular.copyWith(fontSize: 11, color: const Color(0xFF9CA3AF)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Section 2: "Rate Your Delivery Partner"
            Text(
              'Rate Your Delivery Partner',
              style: robotoBold.copyWith(fontSize: 15, color: const Color(0xFF111827)),
            ),
            const SizedBox(height: 12),

            // Delivery Partner Row
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(22),
                  child: Image.asset(
                    Images.riderAvatarPortrait,
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      width: 44,
                      height: 44,
                      color: const Color(0xFFECFDF5),
                      child: const Icon(Icons.person, color: Color(0xFF10B981)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      riderName,
                      style: robotoBold.copyWith(fontSize: 14, color: const Color(0xFF111827)),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 15),
                        const SizedBox(width: 4),
                        Text(
                          '4.8 (320 deliveries)',
                          style: robotoRegular.copyWith(fontSize: 12, color: const Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Rider 5 Green Stars
            Row(
              children: List.generate(5, (index) {
                final starIndex = index + 1;
                return InkWell(
                  onTap: () {
                    setState(() {
                      _riderRating = starIndex;
                    });
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Icon(
                      starIndex <= _riderRating ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: const Color(0xFF00A651),
                      size: 34,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 14),

            // Rider tag chips
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _riderTags.map((tag) {
                final isSelected = _selectedRiderTags.contains(tag);
                return InkWell(
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selectedRiderTags.remove(tag);
                      } else {
                        _selectedRiderTags.add(tag);
                      }
                    });
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFFE8F5E9) : const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF00A651) : const Color(0xFFE5E7EB),
                      ),
                    ),
                    child: Text(
                      tag,
                      style: robotoRegular.copyWith(
                        fontSize: 12,
                        color: isSelected ? const Color(0xFF00A651) : const Color(0xFF4B5563),
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 28),

            // Primary Button: "Submit Feedback"
            CustomButton(
              buttonText: 'Submit Feedback',
              color: const Color(0xFF00A651),
              radius: 12,
              height: 50,
              onPressed: () {
                showCustomSnackBar('Thank you for your valuable feedback!', isError: false);
                if (widget.onSubmitComplete != null) {
                  widget.onSubmitComplete!();
                } else {
                  Get.offAllNamed(RouteHelper.getInitialRoute());
                }
              },
            ),
            const SizedBox(height: 10),

            // Secondary Button: "Skip"
            TextButton(
              onPressed: () {
                if (widget.onSubmitComplete != null) {
                  widget.onSubmitComplete!();
                } else {
                  Get.offAllNamed(RouteHelper.getInitialRoute());
                }
              },
              child: Text(
                'Skip',
                style: robotoMedium.copyWith(fontSize: 14, color: const Color(0xFF9CA3AF)),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
