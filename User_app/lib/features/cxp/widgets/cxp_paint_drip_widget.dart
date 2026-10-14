import 'package:flutter/material.dart';
import 'package:sixam_mart/features/cxp/models/cxp_theme_model.dart';

/// Generic Organic Paint Drip Decoration Widget for CXP Festival Overlays.
/// Renders authentic flowing liquid paint drips with irregular depths, rounded tips,
/// and falling droplets from the top edge. Completely festival-agnostic.
class CxpPaintDripWidget extends StatelessWidget {
  final CxpDecorationModel? decoration;
  final List<Color>? colors;
  final double height;
  final double opacity;

  const CxpPaintDripWidget({
    super.key,
    this.decoration,
    this.colors,
    this.height = 90.0,
    this.opacity = 1.0,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveOpacity = (decoration?.opacity ?? opacity).clamp(0.0, 1.0);
    if (effectiveOpacity <= 0) return const SizedBox.shrink();

    // Resolve color list generically from inputs or fallback tri-color
    final List<Color> paintColors = colors != null && colors!.isNotEmpty
        ? colors!
        : const [
            Color(0xFFFF9933), // Primary accent (e.g. Saffron)
            Color(0xFFFFFFFF), // Secondary accent (e.g. White)
            Color(0xFF138808), // Tertiary accent (e.g. Green)
          ];

    return IgnorePointer(
      child: Opacity(
        opacity: effectiveOpacity,
        child: SizedBox(
          width: double.infinity,
          height: height,
          child: CustomPaint(
            painter: _OrganicPaintDripPainter(
              colors: paintColors,
            ),
            size: Size(double.infinity, height),
          ),
        ),
      ),
    );
  }
}

class _OrganicPaintDripPainter extends CustomPainter {
  final List<Color> colors;

  _OrganicPaintDripPainter({required this.colors});

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0) return;

    final w = size.width;
    final h = size.height;

    // Drop shadow paint
    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.18)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4.0);

    if (colors.length >= 3) {
      // 3-section tri-color paint drip (e.g. Tiranga / multi-palette)
      _drawPaintSection(
        canvas: canvas,
        w: w,
        h: h,
        startX: 0,
        endX: w * 0.38,
        mainColor: colors[0],
        gradientTo: colors[0].withValues(alpha: 0.9),
        dripHeights: [0.35, 0.72, 0.48, 0.95, 0.62],
        dropletOffsets: [(0.12, 1.1), (0.24, 1.05)],
        shadowPaint: shadowPaint,
      );

      _drawPaintSection(
        canvas: canvas,
        w: w,
        h: h,
        startX: w * 0.33,
        endX: w * 0.68,
        mainColor: colors[1],
        gradientTo: colors[1].withValues(alpha: 0.95),
        dripHeights: [0.42, 0.82, 0.52, 0.78, 0.45],
        dropletOffsets: [(0.46, 1.08), (0.58, 1.04)],
        shadowPaint: shadowPaint,
        isCenterWhite: colors[1] == const Color(0xFFFFFFFF),
      );

      _drawPaintSection(
        canvas: canvas,
        w: w,
        h: h,
        startX: w * 0.64,
        endX: w,
        mainColor: colors[2],
        gradientTo: colors[2].withValues(alpha: 0.9),
        dripHeights: [0.55, 0.98, 0.45, 0.85, 0.58],
        dropletOffsets: [(0.76, 1.12), (0.88, 1.06)],
        shadowPaint: shadowPaint,
      );
    } else if (colors.length == 2) {
      // 2-section dual-tone paint drip
      _drawPaintSection(
        canvas: canvas,
        w: w,
        h: h,
        startX: 0,
        endX: w * 0.55,
        mainColor: colors[0],
        gradientTo: colors[0].withValues(alpha: 0.9),
        dripHeights: [0.40, 0.85, 0.55, 0.92, 0.60],
        dropletOffsets: [(0.20, 1.08)],
        shadowPaint: shadowPaint,
      );

      _drawPaintSection(
        canvas: canvas,
        w: w,
        h: h,
        startX: w * 0.48,
        endX: w,
        mainColor: colors[1],
        gradientTo: colors[1].withValues(alpha: 0.9),
        dripHeights: [0.52, 0.95, 0.48, 0.82, 0.50],
        dropletOffsets: [(0.75, 1.10)],
        shadowPaint: shadowPaint,
      );
    } else {
      // 1-section mono-tone paint drip
      final col = colors.isNotEmpty ? colors.first : const Color(0xFFFF9933);
      _drawPaintSection(
        canvas: canvas,
        w: w,
        h: h,
        startX: 0,
        endX: w,
        mainColor: col,
        gradientTo: col.withValues(alpha: 0.85),
        dripHeights: [0.45, 0.88, 0.52, 0.95, 0.62, 0.80, 0.50],
        dropletOffsets: [(0.22, 1.08), (0.50, 1.12), (0.78, 1.06)],
        shadowPaint: shadowPaint,
      );
    }
  }

  void _drawPaintSection({
    required Canvas canvas,
    required double w,
    required double h,
    required double startX,
    required double endX,
    required Color mainColor,
    required Color gradientTo,
    required List<double> dripHeights,
    required List<(double, double)> dropletOffsets,
    required Paint shadowPaint,
    bool isCenterWhite = false,
  }) {
    final sectionWidth = endX - startX;
    if (sectionWidth <= 0) return;

    final path = Path();
    path.moveTo(startX, 0);
    path.lineTo(endX, 0);

    // Build organic drips along the section width
    final int count = dripHeights.length;
    final double segmentWidth = sectionWidth / count;

    double curX = endX;
    for (int i = count - 1; i >= 0; i--) {
      final dripDepth = h * dripHeights[i].clamp(0.2, 1.0);
      final prevX = curX;
      final nextX = startX + i * segmentWidth;
      final midX = (prevX + nextX) / 2;

      // Organic cubic Bézier drip curve with rounded bottom tip
      path.cubicTo(
        prevX - segmentWidth * 0.15,
        dripDepth * 0.4,
        midX + segmentWidth * 0.2,
        dripDepth,
        midX,
        dripDepth,
      );
      path.cubicTo(
        midX - segmentWidth * 0.2,
        dripDepth,
        nextX + segmentWidth * 0.15,
        dripDepth * 0.35,
        nextX,
        dripDepth * 0.3,
      );
      curX = nextX;
    }

    path.lineTo(startX, 0);
    path.close();

    // Draw shadow first
    canvas.save();
    canvas.translate(0, 2);
    canvas.drawPath(path, shadowPaint);
    canvas.restore();

    // Paint section with linear gradient
    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [mainColor, gradientTo],
      ).createShader(Rect.fromLTWH(startX, 0, sectionWidth, h))
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    canvas.drawPath(path, fillPaint);

    if (isCenterWhite) {
      final borderPaint = Paint()
        ..color = const Color(0xFFCBD5E1).withValues(alpha: 0.5)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.6;
      canvas.drawPath(path, borderPaint);
    }

    // Draw falling paint droplets
    final dropPaint = Paint()
      ..color = mainColor
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    for (final (fracX, fracY) in dropletOffsets) {
      final dropX = w * fracX;
      final dropY = h * fracY;
      if (dropX >= startX && dropX <= endX) {
        // Main drop
        canvas.drawCircle(Offset(dropX, dropY), 3.5, dropPaint);
        // Micro splash drop
        canvas.drawCircle(Offset(dropX, dropY + 6.0), 2.0, dropPaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _OrganicPaintDripPainter oldDelegate) {
    return oldDelegate.colors != colors;
  }
}
