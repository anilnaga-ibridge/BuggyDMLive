import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:sixam_mart/features/cxp/models/cxp_experience_model.dart';

class CxpApiClient {
  static String get _defaultHost {
    if (kIsWeb) {
      final host = Uri.base.host;
      return host.isNotEmpty && host != 'localhost' && host != '127.0.0.1' ? host : '127.0.0.1';
    }
    return '10.0.2.2'; // Standard Android emulator loopback or configured IP
  }

  static List<String> getCandidateUrls(String path) {
    final host = _defaultHost;
    return [
      'http://$host:3001/BuggyCxp$path',
      'http://localhost:3001/BuggyCxp$path',
      'http://127.0.0.1:3001/BuggyCxp$path',
      'http://localhost:3001$path',
      'http://127.0.0.1:3001$path',
    ];
  }

  /// Resolves the active experience from BuggyCXP for the specified page and module
  static Future<CxpExperienceModel?> resolveExperience({
    String page = 'home',
    String module = 'grocery',
    String? currentHash,
  }) async {
    final endpoints = getCandidateUrls('/api/mobile/v1/experience/resolve');
    final Map<String, String> headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Release-Channel': 'prod',
      'X-App-Version': '4.1.0',
      'X-Platform': kIsWeb ? 'web' : 'mobile',
      if (currentHash != null && currentHash.isNotEmpty) 'If-None-Match': currentHash,
    };

    final body = jsonEncode({
      'page': page,
      'module': module,
      'appVersion': '4.1.0',
      'platform': kIsWeb ? 'web' : 'mobile',
      'layoutHash': currentHash,
    });

    for (final url in endpoints) {
      try {
        final response = await http
            .post(Uri.parse(url), headers: headers, body: body)
            .timeout(const Duration(seconds: 4));

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          if (data is Map<String, dynamic>) {
            if (data['notModified'] == true) {
              return null; // Cache is already fresh!
            }

            final experiencePayload = data['data'] ?? data;
            if (experiencePayload is Map<String, dynamic>) {
              return CxpExperienceModel.fromJson(experiencePayload);
            }
          }
        }
      } catch (_) {
        // Fallback to next endpoint
      }
    }

    return null;
  }
}
