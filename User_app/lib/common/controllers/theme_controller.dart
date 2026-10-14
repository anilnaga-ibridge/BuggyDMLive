import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sixam_mart/features/cxp/models/cxp_theme_model.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeController extends GetxController implements GetxService {
  final SharedPreferences sharedPreferences;
  ThemeController({required this.sharedPreferences}) {
    _loadCurrentTheme();
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

  void toggleTheme() {
    _darkTheme = !_darkTheme;
    sharedPreferences.setBool(AppConstants.theme, _darkTheme);
    update();
  }

  void changeTheme(Color lightColor, Color darkColor) {
    _lightColor = lightColor;
    _darkColor = darkColor;
    update();
  }

  void updateFromCxpTheme(CxpThemeModel cxpTheme) {
    _cxpTheme = cxpTheme;
    _lightColor = cxpTheme.primaryColor;
    _darkColor = cxpTheme.primaryColor;
    if (!isClosed) {
      update();
    }
  }

  void _loadCurrentTheme() async {
    _lightMap = await rootBundle.loadString('assets/map/light_map.json');
    _darkMap = await rootBundle.loadString('assets/map/dark_map.json');
    _lightMapTaxi = await rootBundle.loadString('assets/map/light_taxi.json');
    _darkTheme = sharedPreferences.getBool(AppConstants.theme) ?? false;
    update();
  }
}
