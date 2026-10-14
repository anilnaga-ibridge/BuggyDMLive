import 'dart:convert';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/widgets.dart';
import 'package:sixam_mart/common/controllers/theme_controller.dart';
import 'package:sixam_mart/features/cxp/models/cxp_experience_model.dart';
import 'package:sixam_mart/features/cxp/models/cxp_theme_model.dart';
import 'package:sixam_mart/features/cxp/services/cxp_api_client.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_section_renderer.dart';

class CxpExperienceController extends GetxController with WidgetsBindingObserver implements GetxService {
  final SharedPreferences sharedPreferences;

  CxpExperienceController({required this.sharedPreferences}) {
    _loadCachedExperience('grocery');
  }

  final Rx<CxpExperienceModel> _experience = CxpExperienceModel.defaultGroceryExperience.obs;
  final Rx<CxpThemeModel> _theme = CxpThemeModel.defaultBuggyTheme.obs;
  final RxBool _isLoading = false.obs;
  final RxString _lastError = ''.obs;

  DateTime? _lastForegroundRefresh;

  CxpExperienceModel get experience => _experience.value;
  CxpThemeModel get theme => _theme.value;
  CxpOverlayModel? get overlay => _experience.value.overlay ?? _theme.value.overlay;
  bool get hasActiveFestivalOverlay => overlay?.enabled == true;
  bool get isLoading => _isLoading.value;
  String get lastError => _lastError.value;

  static const String _cacheKeyPrefix = 'cxp_cached_experience_';

  @override
  void onInit() {
    super.onInit();
    WidgetsBinding.instance.addObserver(this);
    _loadCachedExperience('grocery');
    fetchExperience(page: 'home', module: 'grocery');
  }

  @override
  void onClose() {
    WidgetsBinding.instance.removeObserver(this);
    super.onClose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      final now = DateTime.now();
      if (_lastForegroundRefresh == null || now.difference(_lastForegroundRefresh!).inSeconds >= 10) {
        _lastForegroundRefresh = now;
        fetchExperience(page: 'home', module: 'grocery');
      }
    }
  }

  void _applyThemeToController(CxpThemeModel? cxpTheme) {
    if (cxpTheme != null && Get.isRegistered<ThemeController>()) {
      Get.find<ThemeController>().updateFromCxpTheme(cxpTheme);
    }
  }

  void _loadCachedExperience(String module) {
    try {
      final cachedJson = sharedPreferences.getString('$_cacheKeyPrefix$module');
      if (cachedJson != null && cachedJson.isNotEmpty) {
        final decoded = jsonDecode(cachedJson);
        if (decoded is Map<String, dynamic>) {
          final cachedExperience = CxpExperienceModel.fromJson(decoded);
          _experience.value = cachedExperience;
          if (cachedExperience.theme != null) {
            _theme.value = cachedExperience.theme!;
            _applyThemeToController(cachedExperience.theme);
          }
        }
      }
    } catch (_) {
      // Ignore cache parse errors and keep default
    }
  }

  Future<void> _saveCachedExperience(String module, CxpExperienceModel exp) async {
    try {
      final jsonStr = jsonEncode(exp.toJson());
      await sharedPreferences.setString('$_cacheKeyPrefix$module', jsonStr);
    } catch (_) {
      // Ignore storage errors
    }
  }

  Future<void> fetchExperience({
    String page = 'home',
    String module = 'grocery',
    bool force = false,
  }) async {
    _isLoading.value = true;
    _lastError.value = '';

    try {
      final currentHash = force ? null : _experience.value.hash;
      final newExperience = await CxpApiClient.resolveExperience(
        page: page,
        module: module,
        currentHash: currentHash,
      );

      if (newExperience != null) {
        updateExperience(newExperience, module: module);
      }
    } catch (e) {
      _lastError.value = e.toString();
    } finally {
      _isLoading.value = false;
    }
  }

  void updateExperience(CxpExperienceModel newExperience, {String module = 'grocery'}) {
    _experience.value = newExperience;
    if (newExperience.theme != null) {
      _theme.value = newExperience.theme!;
      _applyThemeToController(newExperience.theme);
    } else {
      _theme.value = CxpThemeModel.defaultBuggyTheme;
    }
    _saveCachedExperience(module, newExperience);
    if (!isClosed) {
      update();
    }
  }

  Future<void> refreshExperience() async {
    await fetchExperience(page: 'home', module: 'grocery', force: true);
  }

  bool isSectionEnabled(String sectionId) {
    final section = _experience.value.sections.firstWhereOrNull((s) => s.id == sectionId);
    return section?.enabled ?? true;
  }

  List<CxpSectionModel> get activeSections {
    final active = _experience.value.sections.where((s) => s.enabled).toList();
    if (active.isEmpty || !active.any((s) => CxpSectionRenderer.canRender(s))) {
      return CxpExperienceModel.defaultGroceryExperience.sections;
    }
    active.sort((a, b) => a.order.compareTo(b.order));
    return active;
  }
}
