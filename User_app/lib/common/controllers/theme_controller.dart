import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:sixam_mart/features/cxp/models/cxp_theme_model.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeController extends GetxController implements GetxService {
  final SharedPreferences sharedPreferences;

  static const String cachedThemeKey = 'cxp_saved_active_theme';
  static const String cachedPrimaryColorKey = 'cxp_saved_primary_color';

  ThemeController({required this.sharedPreferences}) {
    // 1. Synchronously restore darkTheme so frame 1 renders the correct brightness
    _darkTheme = sharedPreferences.getBool(AppConstants.theme) ?? false;

    // 2. Synchronously restore cached CXP theme so frame 1 renders without old theme flashing
    _loadCachedTheme();

    // 3. Load map assets asynchronously in background
    _loadMapAssets();
  }

  bool _darkTheme = false;
  Color? _lightColor;
  Color? _darkColor;
  CxpThemeModel? _cxpTheme;

  bool get darkTheme => _darkTheme;
  Color? get darkColor => _darkColor;
  Color? get lightColor => _lightColor;
  CxpThemeModel? get cxpTheme => _cxpTheme;

  String _lightMap = '[]';
  String get lightMap => _lightMap;

  String _darkMap = '[]';
  String get darkMap => _darkMap;

  String _lightMapTaxi = '[]';
  String get lightMapTaxi => _lightMapTaxi;

  void _loadCachedTheme() {
    try {
      // Step A: Dedicated saved CXP theme
      final savedThemeJson = sharedPreferences.getString(cachedThemeKey);
      if (savedThemeJson != null && savedThemeJson.isNotEmpty) {
        final decoded = jsonDecode(savedThemeJson);
        if (decoded is Map<String, dynamic>) {
          _cxpTheme = CxpThemeModel.fromJson(decoded);
        }
      }

      // Step B: Experience cache fallback
      if (_cxpTheme == null) {
        final cachedExpJson = sharedPreferences.getString('cxp_cached_experience_grocery');
        if (cachedExpJson != null && cachedExpJson.isNotEmpty) {
          final decoded = jsonDecode(cachedExpJson);
          if (decoded is Map<String, dynamic> && decoded['theme'] is Map) {
            _cxpTheme = CxpThemeModel.fromJson(Map<String, dynamic>.from(decoded['theme'] as Map));
          }
        }
      }

      // Step C: Fallback to built-in Buggy theme
      _cxpTheme ??= CxpThemeModel.defaultBuggyTheme;

      // Step D: Restore colors synchronously
      final savedPrimary = sharedPreferences.getInt(cachedPrimaryColorKey);
      if (savedPrimary != null) {
        _lightColor = Color(savedPrimary);
        _darkColor = Color(savedPrimary);
      } else if (_cxpTheme != null) {
        _lightColor = _cxpTheme!.primaryColor;
        _darkColor = _cxpTheme!.primaryColor;
      }
    } catch (_) {
      _cxpTheme = CxpThemeModel.defaultBuggyTheme;
      _lightColor = _cxpTheme!.primaryColor;
      _darkColor = _cxpTheme!.primaryColor;
    }
  }

  void toggleTheme() {
    _darkTheme = !_darkTheme;
    sharedPreferences.setBool(AppConstants.theme, _darkTheme);
    update();
  }

  void changeTheme(Color lightColor, Color darkColor) {
    _lightColor = lightColor;
    _darkColor = darkColor;
    try {
      sharedPreferences.setInt(cachedPrimaryColorKey, lightColor.toARGB32());
    } catch (_) {}
    update();
  }

  void updateFromCxpTheme(CxpThemeModel cxpTheme) {
    _cxpTheme = cxpTheme;
    _lightColor = cxpTheme.primaryColor;
    _darkColor = cxpTheme.primaryColor;

    // Immediately persist to SharedPreferences so that refresh or cold restart
    // reads the correct theme on frame 1 without any flash of default colors.
    try {
      sharedPreferences.setString(cachedThemeKey, jsonEncode(cxpTheme.toJson()));
      sharedPreferences.setInt(cachedPrimaryColorKey, cxpTheme.primaryColor.toARGB32());
    } catch (_) {}

    if (!isClosed) {
      update();
    }
  }

  void _loadMapAssets() async {
    try {
      _lightMap = await rootBundle.loadString('assets/map/light_map.json');
      _darkMap = await rootBundle.loadString('assets/map/dark_map.json');
      _lightMapTaxi = await rootBundle.loadString('assets/map/light_taxi.json');
      if (!isClosed) {
        update();
      }
    } catch (_) {}
  }
}
