import 'dart:convert';
import 'package:flutter/material.dart';

class CxpDecorationModel {
  final String id;
  final String name;
  final String type;
  final String placement;
  final String assetUrl;
  final String? altText;
  final bool isDecorative;
  final double opacity;
  final String size;
  final double scale;
  final double rotation;
  final String positionX;
  final String positionY;
  final String blendMode;
  final String animation;
  final bool mobile;
  final bool desktop;
  final String? targetSectionId;

  CxpDecorationModel({
    required this.id,
    required this.name,
    this.type = 'illustration',
    this.placement = 'hero',
    required this.assetUrl,
    this.altText,
    this.isDecorative = true,
    this.opacity = 1.0,
    this.size = 'sm',
    this.scale = 1.0,
    this.rotation = 0.0,
    this.positionX = 'center',
    this.positionY = 'center',
    this.blendMode = 'normal',
    this.animation = 'none',
    this.mobile = true,
    this.desktop = true,
    this.targetSectionId,
  });

  factory CxpDecorationModel.fromJson(Map<String, dynamic> json) {
    return CxpDecorationModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      type: json['type']?.toString() ?? 'illustration',
      placement: json['placement']?.toString() ?? 'hero',
      assetUrl: json['assetUrl']?.toString() ?? '',
      altText: json['altText']?.toString(),
      isDecorative: json['isDecorative'] != false && json['decorative'] != false,
      opacity: (json['opacity'] is num) ? (json['opacity'] as num).toDouble() : 1.0,
      size: json['size']?.toString() ?? 'sm',
      scale: (json['scale'] is num) ? (json['scale'] as num).toDouble() : 1.0,
      rotation: (json['rotation'] is num) ? (json['rotation'] as num).toDouble() : 0.0,
      positionX: json['positionX']?.toString() ?? 'center',
      positionY: json['positionY']?.toString() ?? 'center',
      blendMode: json['blendMode']?.toString() ?? 'normal',
      animation: json['animation']?.toString() ?? 'none',
      mobile: json['mobile'] != false && json['mobileEnabled'] != false,
      desktop: json['desktop'] != false && json['desktopEnabled'] != false,
      targetSectionId: json['targetSectionId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'type': type,
    'placement': placement,
    'assetUrl': assetUrl,
    if (altText != null) 'altText': altText,
    'isDecorative': isDecorative,
    'opacity': opacity,
    'size': size,
    'scale': scale,
    'rotation': rotation,
    'positionX': positionX,
    'positionY': positionY,
    'blendMode': blendMode,
    'animation': animation,
    'mobile': mobile,
    'desktop': desktop,
    if (targetSectionId != null) 'targetSectionId': targetSectionId,
  };
}

class CxpOverlayScheduleModel {
  final String startDate;
  final String startTime;
  final String endDate;
  final String endTime;
  final String timezone;
  final String status;

  CxpOverlayScheduleModel({
    required this.startDate,
    this.startTime = '00:00',
    required this.endDate,
    this.endTime = '23:59',
    this.timezone = 'Asia/Kolkata',
    this.status = 'active',
  });

  factory CxpOverlayScheduleModel.fromJson(Map<String, dynamic> json) {
    return CxpOverlayScheduleModel(
      startDate: json['startDate']?.toString() ?? '',
      startTime: json['startTime']?.toString() ?? '00:00',
      endDate: json['endDate']?.toString() ?? '',
      endTime: json['endTime']?.toString() ?? '23:59',
      timezone: json['timezone']?.toString() ?? 'Asia/Kolkata',
      status: json['status']?.toString() ?? 'active',
    );
  }

  Map<String, dynamic> toJson() => {
    'startDate': startDate,
    'startTime': startTime,
    'endDate': endDate,
    'endTime': endTime,
    'timezone': timezone,
    'status': status,
  };
}

class CxpOverlayModel {
  final String id;
  final String name;
  final String displayName;
  final String description;
  final bool enabled;
  final double opacity;
  final CxpOverlayScheduleModel? schedule;
  final List<CxpDecorationModel> decorations;
  final Color? accentPrimary;
  final Color? accentSecondary;
  final Color? accentTertiary;
  final List<Color> additionalAccents;

  List<Color> get allAccents {
    final list = <Color>[];
    if (accentPrimary != null) list.add(accentPrimary!);
    if (accentSecondary != null) list.add(accentSecondary!);
    if (accentTertiary != null) list.add(accentTertiary!);
    list.addAll(additionalAccents);
    return list;
  }

  CxpOverlayModel({
    required this.id,
    required this.name,
    required this.displayName,
    this.description = '',
    this.enabled = true,
    this.opacity = 1.0,
    this.schedule,
    required this.decorations,
    this.accentPrimary,
    this.accentSecondary,
    this.accentTertiary,
    this.additionalAccents = const [],
  });

  factory CxpOverlayModel.fromJson(Map<String, dynamic> json) {
    final List<CxpDecorationModel> decs = [];
    if (json['decorations'] is List) {
      for (final d in json['decorations'] as List) {
        if (d is Map) {
          decs.add(CxpDecorationModel.fromJson(Map<String, dynamic>.from(d)));
        }
      }
    }

    CxpOverlayScheduleModel? parsedSchedule;
    if (json['schedule'] is Map) {
      try {
        parsedSchedule = CxpOverlayScheduleModel.fromJson(Map<String, dynamic>.from(json['schedule'] as Map));
      } catch (_) {}
    }

    Color? parseHex(String? hex) {
      if (hex == null || hex.isEmpty) return null;
      try {
        String clean = hex.replaceAll('#', '').trim();
        if (clean.length == 6) clean = 'FF$clean';
        return Color(int.parse(clean, radix: 16));
      } catch (_) {
        return null;
      }
    }

    Color? p, s, t;
    final List<Color> addl = [];
    if (json['accentColors'] is Map) {
      final ac = json['accentColors'] as Map;
      p = parseHex(ac['primary']?.toString());
      s = parseHex(ac['secondary']?.toString());
      t = parseHex(ac['tertiary']?.toString());
      if (ac['additional'] is List) {
        for (final item in ac['additional'] as List) {
          final col = parseHex(item?.toString());
          if (col != null) addl.add(col);
        }
      }
    }

    return CxpOverlayModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      displayName: json['displayName']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      enabled: json['enabled'] != false,
      opacity: (json['opacity'] is num) ? (json['opacity'] as num).toDouble() : 1.0,
      schedule: parsedSchedule,
      decorations: decs,
      accentPrimary: p,
      accentSecondary: s,
      accentTertiary: t,
      additionalAccents: addl,
    );
  }

  List<CxpDecorationModel> getDecorations(String placement, {String? targetSectionId}) {
    if (!enabled) return const [];
    return decorations.where((d) {
      if (d.opacity <= 0) return false;
      if (!d.mobile) return false;
      if (d.placement != placement) return false;
      if (targetSectionId != null && d.targetSectionId != null && d.targetSectionId != targetSectionId) {
        return false;
      }
      return true;
    }).toList();
  }

  Map<String, dynamic> toJson() {
    String hexFromColor(Color c) {
      return '#${c.toARGB32().toRadixString(16).padLeft(8, '0').substring(2)}';
    }

    return {
      'id': id,
      'name': name,
      'displayName': displayName,
      'description': description,
      'enabled': enabled,
      'opacity': opacity,
      if (schedule != null) 'schedule': schedule!.toJson(),
      'accentColors': {
        if (accentPrimary != null) 'primary': hexFromColor(accentPrimary!),
        if (accentSecondary != null) 'secondary': hexFromColor(accentSecondary!),
        if (accentTertiary != null) 'tertiary': hexFromColor(accentTertiary!),
      },
      'decorations': decorations.map((d) => d.toJson()).toList(),
    };
  }
}

class CxpThemeModel {
  final int? id;
  final String name;
  final String version;
  final Map<String, String> tokens;
  final CxpOverlayModel? overlay;

  CxpThemeModel({
    this.id,
    required this.name,
    this.version = 'v1.0',
    required this.tokens,
    this.overlay,
  });

  factory CxpThemeModel.fromJson(Map<String, dynamic> json) {
    final Map<String, String> parsedTokens = {};
    if (json['tokens'] is Map) {
      (json['tokens'] as Map).forEach((k, v) {
        parsedTokens[k.toString()] = v.toString();
      });
    } else if (json['tokens'] is List) {
      for (final item in json['tokens'] as List) {
        if (item is Map && item.containsKey('token_key') && item.containsKey('token_value')) {
          parsedTokens[item['token_key'].toString()] = item['token_value'].toString();
        }
      }
    }

    CxpOverlayModel? parsedOverlay;
    if (json['overlay'] is Map) {
      try {
        parsedOverlay = CxpOverlayModel.fromJson(Map<String, dynamic>.from(json['overlay'] as Map));
      } catch (_) {}
    } else if (parsedTokens.containsKey('sys.overlay.data')) {
      try {
        final decoded = jsonDecode(parsedTokens['sys.overlay.data']!);
        if (decoded is Map<String, dynamic>) {
          parsedOverlay = CxpOverlayModel.fromJson(decoded);
        }
      } catch (_) {}
    }

    return CxpThemeModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? ''),
      name: json['name']?.toString() ?? 'Default Buggy Theme',
      version: json['version']?.toString() ?? 'v1.0',
      tokens: parsedTokens,
      overlay: parsedOverlay,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    'name': name,
    'version': version,
    'tokens': tokens,
    if (overlay != null) 'overlay': overlay!.toJson(),
  };

  // Safe color parser
  Color _parseColor(String? key, Color fallback) {
    final hex = tokens[key];
    if (hex == null || hex.isEmpty) return fallback;
    try {
      String cleanHex = hex.replaceAll('#', '').trim();
      if (cleanHex.length == 6) {
        cleanHex = 'FF$cleanHex';
      }
      return Color(int.parse(cleanHex, radix: 16));
    } catch (_) {
      return fallback;
    }
  }

  // Double/pixel parser
  double _parseDouble(String? key, double fallback) {
    final val = tokens[key];
    if (val == null || val.isEmpty) return fallback;
    try {
      final clean = val.replaceAll('px', '').replaceAll('rem', '').trim();
      return double.parse(clean);
    } catch (_) {
      return fallback;
    }
  }

  // ===================== Colors =====================
  Color get primaryColor => _parseColor('sys.color.primary', const Color(0xFF3CC3BA));
  Color get secondaryColor => _parseColor('sys.color.secondary', const Color(0xFF3CC3BA));
  Color get accentColor => _parseColor('sys.color.accent', const Color(0xFFFFD700));
  Color get backgroundColor => _parseColor('sys.color.background', const Color(0xFFF7FBFA));
  Color get surfaceColor => _parseColor('sys.color.surface', Colors.white);
  Color get surfaceElevatedColor => _parseColor('sys.color.surface_elevated', const Color(0xFFFAFAFA));
  Color get textPrimaryColor => _parseColor('sys.color.text_primary', const Color(0xFF1E293B));
  Color get textSecondaryColor => _parseColor('sys.color.text_secondary', const Color(0xFF475569));
  Color get textMutedColor => _parseColor('sys.color.text_muted', const Color(0xFF94A3B8));
  Color get successColor => _parseColor('sys.color.success', const Color(0xFF16834A));
  Color get warningColor => _parseColor('sys.color.warning', const Color(0xFFF59E0B));
  Color get errorColor => _parseColor('sys.color.error', const Color(0xFFE11D48));
  Color get gradientFrom => _parseColor('sys.color.gradient_from', const Color(0xFF3CC3BA));
  Color get gradientTo => _parseColor('sys.color.gradient_to', const Color(0xFF2B9A92));
  bool get isDark => tokens['sys.color.scheme'] == 'dark';

  // ===================== Gradients =====================
  LinearGradient get heroGradient => LinearGradient(
    colors: [gradientFrom, gradientTo],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  LinearGradient get cardGradient => LinearGradient(
    colors: [surfaceColor, surfaceElevatedColor],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // ===================== Shapes & Radii =====================
  double get radiusSm => _parseDouble('sys.shape.radius_sm', 8.0);
  double get radiusMd => _parseDouble('sys.shape.radius_md', _parseDouble('sys.shape.button_radius', 27.0));
  double get radiusLg => _parseDouble('sys.shape.radius_lg', _parseDouble('sys.shape.card_radius', 25.0));
  double get buttonRadius => _parseDouble('sys.shape.button_radius', _parseDouble('sys.shape.radius_md', 27.0));
  double get cardRadius => _parseDouble('sys.shape.card_radius', _parseDouble('sys.shape.radius_lg', 25.0));

  // ===================== Spacing =====================
  double get spacingXs => _parseDouble('sys.spacing.xs', 4.0);
  double get spacingSm => _parseDouble('sys.spacing.sm', 8.0);
  double get spacingMd => _parseDouble('sys.spacing.md', 23.0);
  double get spacingLg => _parseDouble('sys.spacing.lg', 20.0);
  double get sectionGap => _parseDouble('sys.spacing.section_gap', _parseDouble('sys.spacing.lg', 20.0));

  // ===================== Typography =====================
  double get fontScale => _parseDouble('sys.typography.scale', 1.0);
  String? get fontFamily => tokens['sys.typography.font_family'];

  // ===================== Motion =====================
  String get motionStyle => tokens['sys.motion.style'] ?? 'spring';
  Duration get motionDuration {
    final msStr = tokens['sys.motion.duration']?.replaceAll('ms', '').trim();
    final ms = int.tryParse(msStr ?? '') ?? 300;
    return Duration(milliseconds: ms);
  }

  // ===================== Decorations & Assets =====================
  String? get heroImageUrl => tokens['sys.asset.hero_image'];
  bool get hasSparkleDecoration => tokens['sys.decoration.sparkle'] == 'true';
  bool get hasConfettiDecoration => tokens['sys.decoration.confetti'] == 'true';
  String? get festivalThemeKey => tokens['sys.decoration.festival'];

  // Default Built-in Theme (Fallback - Swiggy/Instamart Dark Wine Theme)
  static CxpThemeModel get defaultBuggyTheme => CxpThemeModel(
    name: 'Quick Dark Wine 2026',
    tokens: {
      'sys.color.primary': '#E23744',
      'sys.color.secondary': '#FFB800',
      'sys.color.accent': '#FF2E63',
      'sys.color.background': '#2A0012',
      'sys.color.surface': '#380018',
      'sys.color.surface_elevated': '#4D0022',
      'sys.color.text_primary': '#FFFFFF',
      'sys.color.text_secondary': '#E2D9E2',
      'sys.color.text_muted': '#B39EB5',
      'sys.color.success': '#16A34A',
      'sys.color.warning': '#F59E0B',
      'sys.color.error': '#E11D48',
      'sys.color.gradient_from': '#24000F',
      'sys.color.gradient_to': '#3D001B',
      'sys.color.scheme': 'dark',
      'sys.shape.radius_sm': '8px',
      'sys.shape.radius_md': '24px',
      'sys.shape.radius_lg': '20px',
      'sys.shape.button_radius': '24px',
      'sys.shape.card_radius': '20px',
      'sys.spacing.md': '16px',
      'sys.spacing.section_gap': '16px',
      'sys.motion.style': 'spring',
      'sys.motion.duration': '300ms',
    },
  );
}
