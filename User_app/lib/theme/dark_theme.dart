import 'package:flutter/material.dart';
import 'package:sixam_mart/features/cxp/models/cxp_theme_model.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';
import 'package:sixam_mart/util/app_constants.dart';

ThemeData dark({Color? color, CxpThemeModel? cxpTheme}) {
  final fallbackTheme = CxpThemeModel.defaultBuggyTheme;
  final effectiveCxpTheme = cxpTheme ?? fallbackTheme;
  final effectiveColor = color ?? effectiveCxpTheme.primaryColor;
  final ext = BuggyCxpThemeExtension.fromCxpTheme(effectiveCxpTheme);

  return ThemeData(
    fontFamily: AppConstants.fontFamily,
    primaryColor: effectiveColor,
    secondaryHeaderColor: effectiveCxpTheme.secondaryColor,
    disabledColor: const Color(0xffa2a7ad),
    brightness: Brightness.dark,
    hintColor: const Color(0xFFbebebe),
    cardColor: const Color(0xFF30313C),
    shadowColor: Colors.white.withValues(alpha: 0.03),
    textTheme: const TextTheme(bodyMedium: TextStyle(color: Colors.white70)),
    textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: effectiveColor)),
    colorScheme: ColorScheme.dark(primary: effectiveColor, secondary: ext.secondary).copyWith(surface: const Color(0xFF191A26)).copyWith(error: ext.error),
    popupMenuTheme: const PopupMenuThemeData(color: Color(0xFF29292D), surfaceTintColor: Color(0xFF29292D)),
    dialogTheme: const DialogThemeData(surfaceTintColor: Colors.white10),
    floatingActionButtonTheme: FloatingActionButtonThemeData(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(500))),
    bottomAppBarTheme: const BottomAppBarThemeData(
      surfaceTintColor: Colors.black, height: 60,
      padding: EdgeInsets.symmetric(vertical: 5),
    ),
    dividerTheme: const DividerThemeData(thickness: 0.5, color: Color(0xFFA0A4A8)),
    tabBarTheme: const TabBarThemeData(dividerColor: Colors.transparent),
    extensions: [ext],
  );
}