import 'package:flutter/material.dart';
import 'package:sixam_mart/util/dimensions.dart';

class CustomCardCheckout extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  const CustomCardCheckout({super.key, required this.child, this.padding, this.margin});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      padding: padding ?? const EdgeInsets.all(Dimensions.paddingSizeDefault),
      margin: margin ?? const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
      child: child,
    );
  }
}
