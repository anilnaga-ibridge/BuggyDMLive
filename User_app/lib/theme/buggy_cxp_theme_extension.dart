import 'package:flutter/material.dart';
import 'package:sixam_mart/features/cxp/models/cxp_theme_model.dart';

@immutable
class BuggyCxpThemeExtension extends ThemeExtension<BuggyCxpThemeExtension> {
  final Color primary;
  final Color secondary;
  final Color accent;
  final Color background;
  final Color surface;
  final Color surfaceElevated;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color success;
  final Color warning;
  final Color error;
  final Color gradientFrom;
  final Color gradientTo;

  final double radiusSm;
  final double radiusMd;
  final double radiusLg;
  final double buttonRadius;
  final double cardRadius;

  final double spacingXs;
  final double spacingSm;
  final double spacingMd;
  final double spacingLg;
  final double sectionGap;
  final double fontScale;
  final String? fontFamily;
  final CxpOverlayModel? overlay;

  const BuggyCxpThemeExtension({
    required this.primary,
    required this.secondary,
    required this.accent,
    required this.background,
    required this.surface,
    required this.surfaceElevated,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.success,
    required this.warning,
    required this.error,
    required this.gradientFrom,
    required this.gradientTo,
    required this.radiusSm,
    required this.radiusMd,
    required this.radiusLg,
    required this.buttonRadius,
    required this.cardRadius,
    required this.spacingXs,
    required this.spacingSm,
    required this.spacingMd,
    required this.spacingLg,
    required this.sectionGap,
    this.fontScale = 1.0,
    this.fontFamily,
    this.overlay,
  });

  factory BuggyCxpThemeExtension.fromCxpTheme(CxpThemeModel model) {
    return BuggyCxpThemeExtension(
      primary: model.primaryColor,
      secondary: model.secondaryColor,
      accent: model.accentColor,
      background: model.backgroundColor,
      surface: model.surfaceColor,
      surfaceElevated: model.surfaceElevatedColor,
      textPrimary: model.textPrimaryColor,
      textSecondary: model.textSecondaryColor,
      textMuted: model.textMutedColor,
      success: model.successColor,
      warning: model.warningColor,
      error: model.errorColor,
      gradientFrom: model.gradientFrom,
      gradientTo: model.gradientTo,
      radiusSm: model.radiusSm,
      radiusMd: model.radiusMd,
      radiusLg: model.radiusLg,
      buttonRadius: model.buttonRadius,
      cardRadius: model.cardRadius,
      spacingXs: model.spacingXs,
      spacingSm: model.spacingSm,
      spacingMd: model.spacingMd,
      spacingLg: model.spacingLg,
      sectionGap: model.sectionGap,
      fontScale: model.fontScale,
      fontFamily: model.fontFamily,
      overlay: model.overlay,
    );
  }

  static BuggyCxpThemeExtension get defaultTheme =>
      BuggyCxpThemeExtension.fromCxpTheme(CxpThemeModel.defaultBuggyTheme);

  List<CxpDecorationModel> getHeaderDecorations() => overlay?.getDecorations('header') ?? const [];
  List<CxpDecorationModel> getHeroDecorations() => overlay?.getDecorations('hero') ?? const [];
  List<CxpDecorationModel> getSectionDecorations([String? sectionId]) => overlay?.getDecorations('section', targetSectionId: sectionId) ?? const [];
  List<CxpDecorationModel> getProductCardDecorations() => overlay?.getDecorations('product_card') ?? const [];
  List<CxpDecorationModel> getCategoryCardDecorations() => overlay?.getDecorations('category_card') ?? const [];
  List<CxpDecorationModel> getGlobalBackgroundDecorations() => overlay?.getDecorations('global_background') ?? const [];
  List<CxpDecorationModel> getFloatingDecorations() => overlay?.getDecorations('floating') ?? const [];

  @override
  BuggyCxpThemeExtension copyWith({
    Color? primary,
    Color? secondary,
    Color? accent,
    Color? background,
    Color? surface,
    Color? surfaceElevated,
    Color? textPrimary,
    Color? textSecondary,
    Color? textMuted,
    Color? success,
    Color? warning,
    Color? error,
    Color? gradientFrom,
    Color? gradientTo,
    double? radiusSm,
    double? radiusMd,
    double? radiusLg,
    double? buttonRadius,
    double? cardRadius,
    double? spacingXs,
    double? spacingSm,
    double? spacingMd,
    double? spacingLg,
    double? sectionGap,
    double? fontScale,
    String? fontFamily,
    CxpOverlayModel? overlay,
  }) {
    return BuggyCxpThemeExtension(
      primary: primary ?? this.primary,
      secondary: secondary ?? this.secondary,
      accent: accent ?? this.accent,
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceElevated: surfaceElevated ?? this.surfaceElevated,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textMuted: textMuted ?? this.textMuted,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      error: error ?? this.error,
      gradientFrom: gradientFrom ?? this.gradientFrom,
      gradientTo: gradientTo ?? this.gradientTo,
      radiusSm: radiusSm ?? this.radiusSm,
      radiusMd: radiusMd ?? this.radiusMd,
      radiusLg: radiusLg ?? this.radiusLg,
      buttonRadius: buttonRadius ?? this.buttonRadius,
      cardRadius: cardRadius ?? this.cardRadius,
      spacingXs: spacingXs ?? this.spacingXs,
      spacingSm: spacingSm ?? this.spacingSm,
      spacingMd: spacingMd ?? this.spacingMd,
      spacingLg: spacingLg ?? this.spacingLg,
      sectionGap: sectionGap ?? this.sectionGap,
      fontScale: fontScale ?? this.fontScale,
      fontFamily: fontFamily ?? this.fontFamily,
      overlay: overlay ?? this.overlay,
    );
  }

  @override
  ThemeExtension<BuggyCxpThemeExtension> lerp(
    covariant ThemeExtension<BuggyCxpThemeExtension>? other,
    double t,
  ) {
    if (other is! BuggyCxpThemeExtension) {
      return this;
    }
    return BuggyCxpThemeExtension(
      primary: Color.lerp(primary, other.primary, t) ?? primary,
      secondary: Color.lerp(secondary, other.secondary, t) ?? secondary,
      accent: Color.lerp(accent, other.accent, t) ?? accent,
      background: Color.lerp(background, other.background, t) ?? background,
      surface: Color.lerp(surface, other.surface, t) ?? surface,
      surfaceElevated: Color.lerp(surfaceElevated, other.surfaceElevated, t) ?? surfaceElevated,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t) ?? textPrimary,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t) ?? textSecondary,
      textMuted: Color.lerp(textMuted, other.textMuted, t) ?? textMuted,
      success: Color.lerp(success, other.success, t) ?? success,
      warning: Color.lerp(warning, other.warning, t) ?? warning,
      error: Color.lerp(error, other.error, t) ?? error,
      gradientFrom: Color.lerp(gradientFrom, other.gradientFrom, t) ?? gradientFrom,
      gradientTo: Color.lerp(gradientTo, other.gradientTo, t) ?? gradientTo,
      radiusSm: (radiusSm + (other.radiusSm - radiusSm) * t),
      radiusMd: (radiusMd + (other.radiusMd - radiusMd) * t),
      radiusLg: (radiusLg + (other.radiusLg - radiusLg) * t),
      buttonRadius: (buttonRadius + (other.buttonRadius - buttonRadius) * t),
      cardRadius: (cardRadius + (other.cardRadius - cardRadius) * t),
      spacingXs: (spacingXs + (other.spacingXs - spacingXs) * t),
      spacingSm: (spacingSm + (other.spacingSm - spacingSm) * t),
      spacingMd: (spacingMd + (other.spacingMd - spacingMd) * t),
      spacingLg: (spacingLg + (other.spacingLg - spacingLg) * t),
      sectionGap: (sectionGap + (other.sectionGap - sectionGap) * t),
      fontScale: (fontScale + (other.fontScale - fontScale) * t),
      fontFamily: t < 0.5 ? fontFamily : other.fontFamily,
      overlay: t < 0.5 ? overlay : other.overlay,
    );
  }
}

extension BuggyThemeContext on BuildContext {
  BuggyCxpThemeExtension get cxpTheme =>
      Theme.of(this).extension<BuggyCxpThemeExtension>() ?? BuggyCxpThemeExtension.defaultTheme;
}
