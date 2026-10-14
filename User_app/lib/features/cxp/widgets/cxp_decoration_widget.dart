import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:sixam_mart/features/cxp/models/cxp_theme_model.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_paint_drip_widget.dart';

/// Generic CXP Visual Decoration Widget for User_app.
/// Renders festival/cultural visual overlays (paint drips, flags, ribbons, watermarks, badges, icons)
/// completely generically based on data contracts. Zero festival names hardcoded.
class CxpDecorationWidget extends StatelessWidget {
  final CxpDecorationModel decoration;
  final List<Color>? accentColors;
  final BoxFit fit;

  const CxpDecorationWidget({
    super.key,
    required this.decoration,
    this.accentColors,
    this.fit = BoxFit.contain,
  });

  @override
  Widget build(BuildContext context) {
    if (decoration.opacity <= 0) return const SizedBox.shrink();

    // 1. If this decoration is an organic paint drip
    if (decoration.type == 'paint_drip') {
      return CxpPaintDripWidget(
        decoration: decoration,
        colors: accentColors,
        height: decoration.size == 'lg' || decoration.size == 'large' ? 120 : 90,
      );
    }

    double? width;
    double? height;

    switch (decoration.size.toLowerCase()) {
      case 'xs':
        width = 18;
        height = 18;
        break;
      case 'sm':
      case 'small':
        width = 32;
        height = 32;
        break;
      case 'md':
      case 'medium':
        width = 54;
        height = 54;
        break;
      case 'lg':
      case 'large':
        width = 96;
        height = 96;
        break;
      case 'xl':
        width = 160;
        height = 160;
        break;
      case 'full':
        width = double.infinity;
        height = 6;
        break;
      default:
        width = 32;
        height = 32;
    }

    Widget assetWidget;
    try {
      final url = decoration.assetUrl.trim();
      if (url.isEmpty) return const SizedBox.shrink();

      if (url.startsWith('data:image/svg+xml')) {
        String svgContent;
        if (url.contains(';base64,')) {
          final b64 = url.split(';base64,').last;
          svgContent = utf8.decode(base64.decode(b64));
        } else {
          final raw = url.substring(url.indexOf(',') + 1);
          final decoded = raw.contains('%3C') || raw.contains('%3c')
              ? Uri.decodeComponent(raw)
              : raw;
          svgContent = decoded.replaceAll('%23', '#');
        }
        assetWidget = SvgPicture.string(
          svgContent,
          width: width,
          height: height,
          fit: decoration.type == 'ribbon' ? BoxFit.fill : fit,
        );
      } else if (url.startsWith('http') && url.toLowerCase().contains('.svg')) {
        assetWidget = SvgPicture.network(
          url,
          width: width,
          height: height,
          fit: decoration.type == 'ribbon' ? BoxFit.fill : fit,
        );
      } else if (url.startsWith('http')) {
        assetWidget = Image.network(
          url,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
        );
      } else {
        assetWidget = const SizedBox.shrink();
      }
    } catch (_) {
      // Graceful fallback: If asset rendering fails, never crash the host card/theme
      return const SizedBox.shrink();
    }

    Widget styledWidget = Opacity(
      opacity: decoration.opacity.clamp(0.0, 1.0),
      child: Transform.rotate(
        angle: decoration.rotation * (math.pi / 180),
        child: Transform.scale(
          scale: decoration.scale.clamp(0.1, 5.0),
          child: assetWidget,
        ),
      ),
    );

    // Purely visual decorations must ignore pointer events so user interactions are never blocked
    return IgnorePointer(
      child: styledWidget,
    );
  }

  /// Calculates safe alignment matching decoration positioning
  static Alignment alignmentFor(String posX, String posY) {
    final x = posX.toLowerCase();
    final y = posY.toLowerCase();

    if (y == 'top') {
      if (x == 'left') return Alignment.topLeft;
      if (x == 'right') return Alignment.topRight;
      return Alignment.topCenter;
    } else if (y == 'bottom') {
      if (x == 'left') return Alignment.bottomLeft;
      if (x == 'right') return Alignment.bottomRight;
      return Alignment.bottomCenter;
    } else {
      if (x == 'left') return Alignment.centerLeft;
      if (x == 'right') return Alignment.centerRight;
      return Alignment.center;
    }
  }
}
