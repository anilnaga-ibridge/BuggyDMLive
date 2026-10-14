import 'package:flutter/material.dart';
import 'package:sixam_mart/util/styles.dart';

class StepperStepData {
  final String label;
  final String? subtext;
  final bool isCompleted;
  final bool isActive;
  final bool isSubtextGreen;

  const StepperStepData({
    required this.label,
    this.subtext,
    this.isCompleted = false,
    this.isActive = false,
    this.isSubtextGreen = false,
  });
}

class GroceryStepperWidget extends StatelessWidget {
  final List<StepperStepData> steps;
  final Color activeColor;
  final Color inactiveColor;

  const GroceryStepperWidget({
    super.key,
    required this.steps,
    this.activeColor = const Color(0xFF00A651),
    this.inactiveColor = const Color(0xFFE5E7EB),
  });

  @override
  Widget build(BuildContext context) {
    if (steps.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(steps.length, (index) {
          final step = steps[index];
          final bool isLast = index == steps.length - 1;

          // A step is done or active if step.isCompleted or step.isActive
          final bool isPassed = step.isCompleted || step.isActive;
          final bool nextPassed = !isLast && (steps[index + 1].isCompleted || steps[index + 1].isActive);

          return Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top row: circle + connector line to right
                Row(
                  children: [
                    // Half line to left (if not first)
                    Expanded(
                      child: index == 0
                          ? const SizedBox.shrink()
                          : Container(
                              height: 2.5,
                              color: isPassed ? activeColor : inactiveColor,
                            ),
                    ),

                    // Circle indicator
                    _buildCircleIndicator(step),

                    // Half line to right (if not last)
                    Expanded(
                      child: isLast
                          ? const SizedBox.shrink()
                          : Container(
                              height: 2.5,
                              color: nextPassed ? activeColor : inactiveColor,
                            ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // Step label
                Text(
                  step.label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: robotoMedium.copyWith(
                    fontSize: 11,
                    color: (step.isCompleted || step.isActive)
                        ? const Color(0xFF1F2937)
                        : const Color(0xFF9CA3AF),
                    fontWeight: (step.isCompleted || step.isActive) ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),

                // Subtext / Timestamp / "Now"
                if (step.subtext != null && step.subtext!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    step.subtext!,
                    textAlign: TextAlign.center,
                    style: robotoRegular.copyWith(
                      fontSize: 10,
                      color: step.isSubtextGreen
                          ? activeColor
                          : const Color(0xFF9CA3AF),
                      fontWeight: step.isSubtextGreen ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ],
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildCircleIndicator(StepperStepData step) {
    if (step.isCompleted) {
      // Completed: Green solid circle with white checkmark
      return Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(
          color: activeColor,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.check_rounded, color: Colors.white, size: 14),
      );
    } else if (step.isActive) {
      // Active: Green circle with white inner dot or checkmark + subtle glow
      return Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(
          color: activeColor,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: activeColor.withValues(alpha: 0.35),
              blurRadius: 8,
              spreadRadius: 1,
            ),
          ],
        ),
        child: const Icon(Icons.check_rounded, color: Colors.white, size: 14),
      );
    } else {
      // Pending: light grey circle with outline
      return Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: inactiveColor, width: 2),
        ),
        child: Center(
          child: Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: inactiveColor,
              shape: BoxShape.circle,
            ),
          ),
        ),
      );
    }
  }
}
