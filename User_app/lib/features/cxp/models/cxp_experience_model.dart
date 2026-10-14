import 'package:sixam_mart/features/cxp/models/cxp_theme_model.dart';

class CxpWidgetModel {
  final String id;
  final String type;
  final String version;
  final Map<String, dynamic> props;

  CxpWidgetModel({
    required this.id,
    required this.type,
    this.version = '1.0',
    required this.props,
  });

  factory CxpWidgetModel.fromJson(Map<String, dynamic> json) {
    return CxpWidgetModel(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'unknown',
      version: json['version']?.toString() ?? '1.0',
      props: json['props'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['props'] as Map)
          : {},
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type,
    'version': version,
    'props': props,
  };
}

class CxpSectionModel {
  final String id;
  final String name;
  final int order;
  final bool enabled;
  final List<CxpWidgetModel> widgets;
  final Map<String, dynamic> constraints;

  CxpSectionModel({
    required this.id,
    required this.name,
    required this.order,
    this.enabled = true,
    required this.widgets,
    this.constraints = const {},
  });

  factory CxpSectionModel.fromJson(Map<String, dynamic> json) {
    final List<CxpWidgetModel> widgetsList = [];
    if (json['widgets'] is List) {
      for (final item in json['widgets'] as List) {
        if (item is Map) {
          widgetsList.add(CxpWidgetModel.fromJson(Map<String, dynamic>.from(item)));
        }
      }
    }

    final bool isEnabled = () {
      if (json['enabled'] == false) return false;
      if (json['visible'] == false) return false;
      if (json['constraints'] is Map) {
        final c = json['constraints'] as Map;
        if (c['enabled'] == false || c['visible'] == false) return false;
      }
      return true;
    }();

    return CxpSectionModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      order: json['order'] is int ? json['order'] as int : int.tryParse(json['order']?.toString() ?? '') ?? 0,
      enabled: isEnabled,
      widgets: widgetsList,
      constraints: json['constraints'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['constraints'] as Map)
          : {},
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'order': order,
    'enabled': enabled,
    'widgets': widgets.map((w) => w.toJson()).toList(),
    'constraints': constraints,
  };
}

class CxpExperienceModel {
  final String schemaVersion;
  final String layoutId;
  final String pageName;
  final String? hash;
  final CxpThemeModel? theme;
  final CxpOverlayModel? overlay;
  final List<CxpSectionModel> sections;

  CxpExperienceModel({
    this.schemaVersion = '1.0',
    required this.layoutId,
    required this.pageName,
    this.hash,
    this.theme,
    this.overlay,
    required this.sections,
  });

  factory CxpExperienceModel.fromJson(Map<String, dynamic> json) {
    CxpThemeModel? parsedTheme;
    if (json['theme'] is Map) {
      parsedTheme = CxpThemeModel.fromJson(Map<String, dynamic>.from(json['theme'] as Map));
    }

    CxpOverlayModel? parsedOverlay;
    if (json['overlay'] is Map) {
      try {
        parsedOverlay = CxpOverlayModel.fromJson(Map<String, dynamic>.from(json['overlay'] as Map));
      } catch (_) {}
    } else if (parsedTheme?.overlay != null) {
      parsedOverlay = parsedTheme!.overlay;
    }

    final List<CxpSectionModel> sectionsList = [];
    if (json['sections'] is List) {
      for (final item in json['sections'] as List) {
        if (item is Map) {
          sectionsList.add(CxpSectionModel.fromJson(Map<String, dynamic>.from(item)));
        }
      }
    }
    // Sort sections by display order
    sectionsList.sort((a, b) => a.order.compareTo(b.order));

    return CxpExperienceModel(
      schemaVersion: json['schemaVersion']?.toString() ?? '1.0',
      layoutId: json['layoutId']?.toString() ?? 'default-layout',
      pageName: json['pageName']?.toString() ?? 'home_grocery',
      hash: json['hash']?.toString(),
      theme: parsedTheme,
      overlay: parsedOverlay,
      sections: sectionsList,
    );
  }

  Map<String, dynamic> toJson() => {
    'schemaVersion': schemaVersion,
    'layoutId': layoutId,
    'pageName': pageName,
    if (hash != null) 'hash': hash,
    if (theme != null) 'theme': theme!.toJson(),
    if (overlay != null) 'overlay': overlay!.toJson(),
    'sections': sections.map((s) => s.toJson()).toList(),
  };

  // Safe Default Grocery Experience (Fallback if CXP offline or uninitialized)
  static CxpExperienceModel get defaultGroceryExperience => CxpExperienceModel(
    schemaVersion: '1.0',
    layoutId: 'local-default-grocery',
    pageName: 'home_grocery',
    theme: CxpThemeModel.defaultBuggyTheme,
    sections: [
      CxpSectionModel(id: 'hero_fest_deals', name: 'Hero Fest Deals', order: 1, widgets: []),
      CxpSectionModel(id: 'steal_deals', name: 'Steal Deals', order: 2, widgets: []),
      CxpSectionModel(id: 'featured_offers', name: 'Featured & Offers', order: 3, widgets: []),
      CxpSectionModel(id: 'salon_bloom', name: 'Salon & Bloom', order: 4, widgets: []),
      CxpSectionModel(id: 'category_grids', name: 'Category Grids', order: 5, widgets: []),
      CxpSectionModel(id: 'curated_products', name: 'Curated Products', order: 6, widgets: []),
      CxpSectionModel(id: 'lifestyle_categories', name: 'Lifestyle Categories', order: 7, widgets: []),
      CxpSectionModel(id: 'flash_deals', name: 'Flash Deals', order: 8, widgets: []),
    ],
  );
}
