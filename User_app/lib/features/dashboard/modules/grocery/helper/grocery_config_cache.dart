import 'dart:convert';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sixam_mart/util/app_constants.dart';

class GroceryConfigCache {
  static const String _prefix = 'cached_grocery_cfg_';

  static Map<String, dynamic>? load(String key) {
    try {
      if (Get.isRegistered<SharedPreferences>()) {
        final raw = Get.find<SharedPreferences>().getString('$_prefix$key');
        if (raw != null && raw.isNotEmpty) {
          dynamic decoded = raw;
          while (decoded is String) {
            try {
              decoded = jsonDecode(decoded);
            } catch (_) {
              break;
            }
          }
          if (decoded is Map<String, dynamic>) {
            return decoded;
          }
          if (decoded is Map) {
            return Map<String, dynamic>.from(decoded);
          }
        }
      }
    } catch (_) {}
    return null;
  }

  static Future<void> save(String key, Map<String, dynamic> data) async {
    try {
      if (Get.isRegistered<SharedPreferences>()) {
        await Get.find<SharedPreferences>().setString('$_prefix$key', jsonEncode(data));
      }
    } catch (_) {}
  }
}

String resolveGroceryImageUrl(dynamic rawUrl) {
  if (rawUrl == null) return '';
  final String str = rawUrl.toString().trim();
  if (str.isEmpty) return '';

  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }
  if (str.contains('assets/')) {
    final idx = str.indexOf('assets/');
    return str.substring(idx);
  }
  if (str.startsWith('/assets/')) {
    return str.substring(1);
  }

  // Resolve product storage paths
  if (str.contains('product/')) {
    final filename = str.split('product/').last;
    return '${AppConstants.baseUrl}/storage/product/$filename';
  }

  // Resolve custom uploads
  if (str.contains('uploads/')) {
    final filename = str.split('uploads/').last;
    return '${AppConstants.baseUrl}/uploads/$filename';
  }

  final host = (GetPlatform.isWeb && Uri.base.host.isNotEmpty)
      ? Uri.base.host
      : '127.0.0.1';

  if (str.startsWith('/BuggyDm')) {
    return 'http://$host:3000$str';
  }
  if (str.startsWith('BuggyDm/')) {
    return 'http://$host:3000/$str';
  }
  final clean = str.startsWith('/') ? str : '/$str';
  return '${AppConstants.baseUrl}$clean';
}
