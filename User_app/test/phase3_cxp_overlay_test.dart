import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sixam_mart/features/cxp/controllers/cxp_experience_controller.dart';
import 'package:sixam_mart/features/cxp/models/cxp_experience_model.dart';
import 'package:sixam_mart/features/cxp/models/cxp_theme_model.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PHASE 3: User_app CXP Overlay Flutter Integration Suite', () {
    // Fixture 1: Active Independence Day 2027 Overlay
    final Map<String, dynamic> independenceDayJson = {
      'schemaVersion': '1.0',
      'layoutId': 'layout-101',
      'pageName': 'home_grocery',
      'hash': 'sha256:ind2027hash',
      'theme': {
        'id': 1,
        'name': 'Buggy Base Theme',
        'tokens': {
          'sys.color.primary': '#039D55',
          'sys.color.secondary': '#FF9900',
          'sys.shape.card_radius': '25px',
          'sys.spacing.md': '23px',
        },
        'overlay': {
          'id': 'overlay_independence_day_2027',
          'name': 'independence_day_2027',
          'displayName': 'Independence Day 2027',
          'description': 'Patriotic festival experience',
          'enabled': true,
          'opacity': 1.0,
          'schedule': {
            'startDate': '2027-08-15',
            'startTime': '00:00',
            'endDate': '2027-08-16',
            'endTime': '23:59',
            'timezone': 'Asia/Kolkata',
            'status': 'active',
          },
          'accentColors': {
            'primary': '#FF9933',
            'secondary': '#FFFFFF',
            'tertiary': '#138808',
          },
          'decorations': [
            {
              'id': 'dec_header_flag',
              'name': 'Header Flag',
              'type': 'flag',
              'placement': 'header',
              'assetUrl': 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
              'opacity': 1.0,
              'size': 'sm',
              'positionX': 'right',
              'positionY': 'center',
              'mobile': true,
              'desktop': true,
            },
            {
              'id': 'dec_section_ribbon',
              'name': 'Section Ribbon',
              'type': 'ribbon',
              'placement': 'section',
              'targetSectionId': 'hero_fest_deals',
              'assetUrl': 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
              'opacity': 0.8,
              'size': 'full',
            },
          ],
        },
      },
      'overlay': {
        'id': 'overlay_independence_day_2027',
        'name': 'independence_day_2027',
        'displayName': 'Independence Day 2027',
        'description': 'Patriotic festival experience',
        'enabled': true,
        'opacity': 1.0,
        'schedule': {
          'startDate': '2027-08-15',
          'startTime': '00:00',
          'endDate': '2027-08-16',
          'endTime': '23:59',
          'timezone': 'Asia/Kolkata',
          'status': 'active',
        },
        'accentColors': {
          'primary': '#FF9933',
          'secondary': '#FFFFFF',
          'tertiary': '#138808',
        },
        'decorations': [
          {
            'id': 'dec_header_flag',
            'name': 'Header Flag',
            'type': 'flag',
            'placement': 'header',
            'assetUrl': 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
            'opacity': 1.0,
            'size': 'sm',
            'positionX': 'right',
            'positionY': 'center',
            'mobile': true,
            'desktop': true,
          },
        ],
      },
      'sections': [
        {'id': 'hero_fest_deals', 'name': 'Hero Fest Deals', 'order': 1, 'widgets': []},
        {'id': 'steal_deals', 'name': 'Steal Deals', 'order': 2, 'widgets': []},
      ],
    };

    // Fixture 2: Diwali 2027 Overlay
    final Map<String, dynamic> diwaliJson = {
      'schemaVersion': '1.0',
      'layoutId': 'layout-102',
      'pageName': 'home_grocery',
      'hash': 'sha256:diwali2027hash',
      'theme': {
        'id': 2,
        'name': 'Diwali Theme',
        'tokens': {'sys.color.primary': '#039D55'},
      },
      'overlay': {
        'id': 'overlay_diwali_2027',
        'name': 'diwali_2027',
        'displayName': 'Diwali 2027',
        'enabled': true,
        'opacity': 1.0,
        'schedule': {
          'startDate': '2027-10-28',
          'startTime': '00:00',
          'endDate': '2027-11-03',
          'endTime': '23:59',
          'timezone': 'Asia/Kolkata',
          'status': 'active',
        },
        'accentColors': {
          'primary': '#F59E0B',
          'secondary': '#DC2626',
          'tertiary': '#FEF08A',
        },
        'decorations': [
          {
            'id': 'dec_diya',
            'name': 'Diya Lamp',
            'type': 'badge',
            'placement': 'header',
            'assetUrl': 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
          }
        ],
      },
      'sections': [],
    };

    // Fixture 3: Disabled / Null Overlay
    final Map<String, dynamic> disabledOverlayJson = {
      'schemaVersion': '1.0',
      'layoutId': 'layout-103',
      'pageName': 'home_grocery',
      'hash': 'sha256:normalhash',
      'theme': {
        'id': 3,
        'name': 'Normal Theme',
        'tokens': {'sys.color.primary': '#039D55'},
        'overlay': null,
      },
      'overlay': null,
      'sections': [],
    };

    test('1. Parse active Independence Day overlay', () {
      final model = CxpExperienceModel.fromJson(independenceDayJson);
      expect(model.overlay, isNotNull);
      expect(model.overlay!.name, 'independence_day_2027');
      expect(model.overlay!.displayName, 'Independence Day 2027');
      expect(model.overlay!.enabled, isTrue);
      expect(model.overlay!.opacity, 1.0);
    });

    test('2. Parse Diwali overlay', () {
      final model = CxpExperienceModel.fromJson(diwaliJson);
      expect(model.overlay, isNotNull);
      expect(model.overlay!.name, 'diwali_2027');
      expect(model.overlay!.displayName, 'Diwali 2027');
      expect(model.overlay!.enabled, isTrue);
    });

    test('3. Parse overlay schedule', () {
      final model = CxpExperienceModel.fromJson(independenceDayJson);
      final schedule = model.overlay!.schedule;
      expect(schedule, isNotNull);
      expect(schedule!.startDate, '2027-08-15');
      expect(schedule.startTime, '00:00');
      expect(schedule.endDate, '2027-08-16');
      expect(schedule.endTime, '23:59');
      expect(schedule.timezone, 'Asia/Kolkata');
      expect(schedule.status, 'active');
    });

    test('4. Parse accent colors', () {
      final model = CxpExperienceModel.fromJson(independenceDayJson);
      final overlay = model.overlay!;
      expect(overlay.accentPrimary, const Color(0xFFFF9933));
      expect(overlay.accentSecondary, const Color(0xFFFFFFFF));
      expect(overlay.accentTertiary, const Color(0xFF138808));
      expect(overlay.allAccents.length, 3);
    });

    test('5. Parse decorations', () {
      final model = CxpExperienceModel.fromJson(independenceDayJson);
      final decs = model.overlay!.decorations;
      expect(decs.length, 1);
      final flag = decs.first;
      expect(flag.id, 'dec_header_flag');
      expect(flag.placement, 'header');
      expect(flag.size, 'sm');
      expect(flag.positionX, 'right');
      expect(flag.positionY, 'center');
    });

    test('6. Null overlay returns overlay == null', () {
      final model = CxpExperienceModel.fromJson(disabledOverlayJson);
      expect(model.overlay, isNull);
    });

    test('7. Disabled overlay returns empty decorations', () {
      final disabledMap = Map<String, dynamic>.from(independenceDayJson);
      disabledMap['overlay'] = {
        'id': 'overlay_none',
        'name': 'normal',
        'displayName': 'Normal',
        'enabled': false,
        'decorations': [
          {'id': 'd1', 'name': 'test', 'placement': 'header', 'assetUrl': 'test.png'}
        ],
      };
      final model = CxpExperienceModel.fromJson(disabledMap);
      expect(model.overlay!.enabled, isFalse);
      expect(model.overlay!.getDecorations('header'), isEmpty);
    });

    test('8. Missing overlay field falls back safely', () {
      final noOverlayJson = {
        'schemaVersion': '1.0',
        'layoutId': '104',
        'pageName': 'home_grocery',
        'sections': [],
      };
      final model = CxpExperienceModel.fromJson(noOverlayJson);
      expect(model.overlay, isNull);
    });

    test('9. Unknown decoration fields parse safely with defaults', () {
      final unknownDecJson = {
        'id': 'dec_unknown',
        'name': 'Unknown Custom Decoration',
        'type': 'unsupported_3d_voxel',
        'placement': 'custom_portal',
        'assetUrl': 'https://example.com/asset.png',
        'unknownFutureProp': 'xyz',
      };
      final dec = CxpDecorationModel.fromJson(unknownDecJson);
      expect(dec.id, 'dec_unknown');
      expect(dec.type, 'unsupported_3d_voxel');
      expect(dec.placement, 'custom_portal');
      expect(dec.opacity, 1.0);
    });

    test('10. Malformed decoration in list does not crash experience', () {
      final malformedListJson = Map<String, dynamic>.from(independenceDayJson);
      malformedListJson['overlay']['decorations'] = [
        {'id': 'good', 'name': 'Good', 'assetUrl': 'good.png'},
        'invalid_string_item',
        12345,
        null,
      ];
      final model = CxpExperienceModel.fromJson(malformedListJson);
      expect(model.overlay!.decorations.length, 1);
      expect(model.overlay!.decorations.first.id, 'good');
    });

    test('11. Cache stores overlay in serialized JSON', () {
      final model = CxpExperienceModel.fromJson(independenceDayJson);
      final jsonOutput = model.toJson();
      expect(jsonOutput.containsKey('overlay'), isTrue);
      expect(jsonOutput['overlay']['name'], 'independence_day_2027');
      expect(jsonOutput['overlay']['schedule']['startDate'], '2027-08-15');
    });

    test('12. Cache restores overlay from serialized JSON', () {
      final model = CxpExperienceModel.fromJson(independenceDayJson);
      final jsonStr = jsonEncode(model.toJson());
      final restoredModel = CxpExperienceModel.fromJson(jsonDecode(jsonStr));
      expect(restoredModel.overlay, isNotNull);
      expect(restoredModel.overlay!.displayName, 'Independence Day 2027');
      expect(restoredModel.overlay!.accentPrimary, const Color(0xFFFF9933));
    });

    test('13. Controller restores overlay from cache and exposes getter', () async {
      SharedPreferences.setMockInitialValues({
        'cxp_cached_experience_grocery': jsonEncode(independenceDayJson),
      });
      final prefs = await SharedPreferences.getInstance();
      final controller = CxpExperienceController(sharedPreferences: prefs);
      
      expect(controller.overlay, isNotNull);
      expect(controller.overlay!.name, 'independence_day_2027');
      expect(controller.hasActiveFestivalOverlay, isTrue);
    });

    test('14. Controller clears overlay when new experience has no overlay', () async {
      SharedPreferences.setMockInitialValues({
        'cxp_cached_experience_grocery': jsonEncode(independenceDayJson),
      });
      final prefs = await SharedPreferences.getInstance();
      final controller = CxpExperienceController(sharedPreferences: prefs);
      expect(controller.hasActiveFestivalOverlay, isTrue);
      expect(controller.overlay, isNotNull);

      // Simulate update from server with disabled/null overlay
      controller.updateExperience(CxpExperienceModel.fromJson(disabledOverlayJson));
      expect(controller.overlay, isNull);
      expect(controller.hasActiveFestivalOverlay, isFalse);

      // Directly check theme extension from model
      final themeExt = BuggyCxpThemeExtension.fromCxpTheme(CxpThemeModel.fromJson(disabledOverlayJson['theme']));
      expect(themeExt.overlay, isNull);
    });

    test('15. Base theme tokens remain unchanged regardless of festival overlay', () {
      final model = CxpExperienceModel.fromJson(independenceDayJson);
      final theme = model.theme!;
      expect(theme.primaryColor, const Color(0xFF039D55)); // Brand Green
      expect(theme.secondaryColor, const Color(0xFFFF9900)); // Brand Orange
      expect(theme.cardRadius, 25.0);

      // Overlay colors are independent
      expect(model.overlay!.accentPrimary, const Color(0xFFFF9933)); // Saffron accent
    });

    test('16. Sections remain unchanged when overlay is active', () {
      final model = CxpExperienceModel.fromJson(independenceDayJson);
      expect(model.sections.length, 2);
      expect(model.sections[0].id, 'hero_fest_deals');
      expect(model.sections[1].id, 'steal_deals');
    });

    test('17. BuggyCxpThemeExtension provides placement filters', () {
      final themeExt = BuggyCxpThemeExtension.fromCxpTheme(
        CxpThemeModel.fromJson(independenceDayJson['theme']),
      );
      final headerDecs = themeExt.getHeaderDecorations();
      expect(headerDecs.length, 1);
      expect(headerDecs.first.placement, 'header');
    });

    test('18. ETag change replaces cached model', () {
      final modelA = CxpExperienceModel.fromJson(independenceDayJson);
      final modelB = CxpExperienceModel.fromJson(diwaliJson);
      expect(modelA.hash, isNot(equals(modelB.hash)));
      expect(modelA.overlay!.name, 'independence_day_2027');
      expect(modelB.overlay!.name, 'diwali_2027');
    });
  });
}
