import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:sixam_mart/api/api_client.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/helper/grocery_config_cache.dart';
import 'package:sixam_mart/util/app_constants.dart';

class GroceryFlashDealsController extends GetxController {
  Map<String, dynamic>? config;
  bool isLoading = false;

  Map<String, dynamic>? _parseConfig(dynamic raw) {
    if (raw == null) return null;
    dynamic current = raw;
    while (current is String) {
      try {
        current = jsonDecode(current);
      } catch (_) {
        break;
      }
    }
    if (current is Map) {
      return Map<String, dynamic>.from(current);
    }
    return null;
  }

  @override
  void onInit() {
    super.onInit();
    config = GroceryConfigCache.load('flash_deals');
    fetchDynamicConfig();
  }

  Future<void> fetchDynamicConfig() async {
    try {
      // 1. First priority: Use ApiClient
      if (Get.isRegistered<ApiClient>()) {
        try {
          final res = await Get.find<ApiClient>()
              .getData('/api/v1/grocery/flash-deals');
          if (res.statusCode == 200 && res.body != null) {
            final dynamic body = res.body;
            final dynamic rawData =
                (body is Map) ? body['data'] : _parseConfig(body)?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              config = parsed;
              GroceryConfigCache.save('flash_deals', parsed);
              update();
              if (kDebugMode) {
                print('[FlashDeals] Loaded from ApiClient successfully');
              }
              return;
            }
          }
        } catch (e) {
          if (kDebugMode) {
            print('[FlashDeals] ApiClient fetch error: $e');
          }
        }
      }

      // 2. Direct HTTP fallbacks
      final host = (GetPlatform.isWeb && Uri.base.host.isNotEmpty)
          ? Uri.base.host
          : '127.0.0.1';
      final endpoints = [
        'http://$host:3000/BuggyDm/api/grocery/flash-deals',
        'http://localhost:3000/BuggyDm/api/grocery/flash-deals',
        'http://127.0.0.1:3000/BuggyDm/api/grocery/flash-deals',
        '${AppConstants.baseUrl}/api/v1/grocery/flash-deals',
        'http://127.0.0.1:8000/api/v1/grocery/flash-deals',
      ];
      for (final endpoint in endpoints) {
        try {
          final res = await http
              .get(Uri.parse(endpoint))
              .timeout(const Duration(seconds: 3));
          if (res.statusCode == 200) {
            final dynamic body = _parseConfig(res.body);
            final dynamic rawData = body?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              config = parsed;
              GroceryConfigCache.save('flash_deals', parsed);
              update();
              if (kDebugMode) {
                print('[FlashDeals] Loaded from endpoint $endpoint');
              }
              break;
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
}

String resolveFlashDealImageUrl(dynamic rawUrl) => resolveGroceryImageUrl(rawUrl);

Widget buildSafeFlashDealImage(
  dynamic rawUrl, {
  double? width,
  double? height,
  BoxFit fit = BoxFit.contain,
  Widget? errorWidget,
}) {
  final resolved = resolveFlashDealImageUrl(rawUrl);
  final defaultError = errorWidget ??
      Container(
        width: width,
        height: height,
        color: const Color(0xFFFAFAFA),
        child: const Center(
          child: Icon(Icons.shopping_basket_outlined, color: Colors.grey, size: 28),
        ),
      );

  if (resolved.isEmpty) {
    return defaultError;
  }

  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return Image.network(
      resolved,
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (context, error, stackTrace) => defaultError,
    );
  }

  return Image.asset(
    resolved,
    width: width,
    height: height,
    fit: fit,
    cacheWidth: 300,
    filterQuality: FilterQuality.medium,
    errorBuilder: (context, error, stackTrace) => defaultError,
  );
}
