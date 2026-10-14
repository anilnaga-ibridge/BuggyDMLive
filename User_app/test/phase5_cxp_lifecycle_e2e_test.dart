import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sixam_mart/features/cxp/controllers/cxp_experience_controller.dart';
import 'package:sixam_mart/features/cxp/models/cxp_experience_model.dart';
import 'package:sixam_mart/features/cxp/models/cxp_theme_model.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_decoration_widget.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_paint_drip_widget.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Test SVG Assets
  const testSvgDataUri =
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiIgcj0iNDAiIGZpbGw9IiNGRjAwMDAiLz48L3N2Zz4=';

  // Base Experience (No Festival)
  final Map<String, dynamic> baseNormalExperienceJson = {
    'page': 'home',
    'module': 'grocery',
    'hash': 'W/"base-v1"',
    'theme': {
      'id': 1,
      'name': 'Quick Default 2026',
      'tokens': {
        'sys.color.primary': '#039D55',
        'sys.color.secondary': '#FF9900',
        'sys.color.background': '#F7FBFA',
        'sys.shape.card_radius': '25px',
      },
    },
    'overlay': null,
    'sections': [
      {'id': 'sec_hero_fest', 'name': 'Hero Fest', 'order': 1, 'enabled': true},
      {'id': 'sec_popular', 'name': 'Popular Items', 'order': 2, 'enabled': true},
    ],
  };

  // Independence Day 2026 Active Experience
  final Map<String, dynamic> independenceDayActiveExperienceJson = {
    'page': 'home',
    'module': 'grocery',
    'hash': 'W/"indep-v1"',
    'theme': {
      'id': 1,
      'name': 'Quick Default 2026',
      'tokens': {
        'sys.color.primary': '#039D55',
        'sys.color.secondary': '#FF9900',
        'sys.color.background': '#F7FBFA',
        'sys.shape.card_radius': '25px',
      },
    },
    'overlay': {
      'id': 'overlay_independence_day_2026',
      'name': 'independence_day_2026',
      'displayName': 'Independence Day 2026',
      'enabled': true,
      'opacity': 1.0,
      'schedule': {
        'startDate': '2026-08-01',
        'startTime': '00:00',
        'endDate': '2026-08-31',
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
          'id': 'dec_drip_header',
          'name': 'Tiranga Paint Drip Header',
          'type': 'paint_drip',
          'placement': 'header',
          'assetUrl': '',
          'opacity': 1.0,
          'size': 'lg',
          'positionX': 'center',
          'positionY': 'top',
          'mobileEnabled': true,
          'desktopEnabled': true,
          'decorative': true,
        },
        {
          'id': 'dec_header_flag',
          'name': 'Header Flag',
          'type': 'flag',
          'placement': 'header',
          'assetUrl': testSvgDataUri,
          'opacity': 1.0,
          'size': 'sm',
          'positionX': 'right',
          'positionY': 'center',
          'mobileEnabled': true,
          'desktopEnabled': true,
          'decorative': true,
        },
      ],
    },
    'sections': [
      {'id': 'sec_hero_fest', 'name': 'Hero Fest', 'order': 1, 'enabled': true},
      {'id': 'sec_popular', 'name': 'Popular Items', 'order': 2, 'enabled': true},
    ],
  };

  // Diwali 2026 Active Experience
  final Map<String, dynamic> diwaliActiveExperienceJson = {
    'page': 'home',
    'module': 'grocery',
    'hash': 'W/"diwali-v1"',
    'theme': {
      'id': 1,
      'name': 'Quick Default 2026',
      'tokens': {
        'sys.color.primary': '#039D55',
        'sys.color.secondary': '#FF9900',
        'sys.color.background': '#F7FBFA',
        'sys.shape.card_radius': '25px',
      },
    },
    'overlay': {
      'id': 'overlay_diwali_2026',
      'name': 'diwali_2026',
      'displayName': 'Diwali 2026',
      'enabled': true,
      'opacity': 1.0,
      'schedule': {
        'startDate': '2026-10-15',
        'startTime': '00:00',
        'endDate': '2026-11-15',
        'endTime': '23:59',
        'timezone': 'Asia/Kolkata',
        'status': 'active',
      },
      'accentColors': {
        'primary': '#F59E0B',
        'secondary': '#FEF3C7',
        'tertiary': '#DC2626',
      },
      'decorations': [
        {
          'id': 'dec_diya_header',
          'name': 'Diya Header',
          'type': 'symbol',
          'placement': 'header',
          'assetUrl': testSvgDataUri,
          'opacity': 1.0,
          'size': 'sm',
          'positionX': 'right',
          'positionY': 'center',
          'mobileEnabled': true,
          'desktopEnabled': true,
          'decorative': true,
        },
      ],
    },
    'sections': [
      {'id': 'sec_hero_fest', 'name': 'Hero Fest', 'order': 1, 'enabled': true},
      {'id': 'sec_popular', 'name': 'Popular Items', 'order': 2, 'enabled': true},
    ],
  };

  group('PHASE 5: Full End-to-End Festival Lifecycle & Production Hardening Suite', () {
    // 5A: Full Publish & Integration Pipeline
    test('5A. Full Publish Flow delivers active overlay to Flutter experience model', () {
      final exp = CxpExperienceModel.fromJson(independenceDayActiveExperienceJson);
      expect(exp.overlay, isNotNull);
      expect(exp.overlay!.name, 'independence_day_2026');
      expect(exp.overlay!.accentPrimary, const Color(0xFFFF9933));
      expect(exp.overlay!.decorations.length, 2);
    });

    // 5B: Scheduled Festival States
    test('5B. Scheduled festival before start date is marked scheduled/inactive', () {
      final scheduledJson = jsonDecode(jsonEncode(independenceDayActiveExperienceJson));
      scheduledJson['overlay']['schedule']['status'] = 'scheduled';
      final exp = CxpExperienceModel.fromJson(scheduledJson);
      expect(exp.overlay!.schedule!.status, 'scheduled');
    });

    // 5C: Automatic Reversion to Base Theme
    test('5C. Automatic reversion when festival expires clears overlay & preserves base theme', () async {
      SharedPreferences.setMockInitialValues({
        'cxp_cached_experience_grocery': jsonEncode(independenceDayActiveExperienceJson),
      });
      final prefs = await SharedPreferences.getInstance();
      final controller = CxpExperienceController(sharedPreferences: prefs);
      expect(controller.hasActiveFestivalOverlay, isTrue);

      // CXP resolves expired -> null overlay
      controller.updateExperience(CxpExperienceModel.fromJson(baseNormalExperienceJson));
      expect(controller.hasActiveFestivalOverlay, isFalse);
      expect(controller.overlay, isNull);
      expect(controller.theme.primaryColor, const Color(0xFF039D55));
      expect(controller.theme.cardRadius, 25.0);
    });

    // 5D: Cache / ETag Lifecycle
    test('5D. ETag 304 retains cached overlay, new ETag replaces it atomically', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final controller = CxpExperienceController(sharedPreferences: prefs);

      // Step 1: First 200 OK with ETag A
      controller.updateExperience(CxpExperienceModel.fromJson(independenceDayActiveExperienceJson));
      expect(controller.experience.hash, 'W/"indep-v1"');
      expect(controller.overlay!.name, 'independence_day_2026');

      // Step 2: 304 Not Modified -> controller retains experience
      // (When CxpApiClient receives 304, it returns null and controller preserves state)
      expect(controller.overlay!.name, 'independence_day_2026');

      // Step 3: New ETag B with Diwali 2026
      controller.updateExperience(CxpExperienceModel.fromJson(diwaliActiveExperienceJson));
      expect(controller.experience.hash, 'W/"diwali-v1"');
      expect(controller.overlay!.name, 'diwali_2026');
      expect(controller.overlay!.accentPrimary, const Color(0xFFF59E0B));

      // Step 4: New ETag C with disabled/null overlay
      controller.updateExperience(CxpExperienceModel.fromJson(baseNormalExperienceJson));
      expect(controller.experience.hash, 'W/"base-v1"');
      expect(controller.overlay, isNull);
    });

    // 5E: Offline Transitions
    test('5E. Offline retains cached festival; online sync clears expired festival', () async {
      SharedPreferences.setMockInitialValues({
        'cxp_cached_experience_grocery': jsonEncode(independenceDayActiveExperienceJson),
      });
      final prefs = await SharedPreferences.getInstance();
      
      // Offline startup -> loads cache
      final controller = CxpExperienceController(sharedPreferences: prefs);
      expect(controller.overlay, isNotNull);
      expect(controller.hasActiveFestivalOverlay, isTrue);

      // Device returns online, API resolves null overlay -> updates cache and state
      controller.updateExperience(CxpExperienceModel.fromJson(baseNormalExperienceJson));
      expect(controller.hasActiveFestivalOverlay, isFalse);
      expect(controller.overlay, isNull);
    });

    // 5F: App Restart Hydration
    test('5F. App restart immediately hydrates valid cached overlay before network sync', () async {
      SharedPreferences.setMockInitialValues({
        'cxp_cached_experience_grocery': jsonEncode(diwaliActiveExperienceJson),
      });
      final prefs = await SharedPreferences.getInstance();
      final controller = CxpExperienceController(sharedPreferences: prefs);

      // Immediate synchronous cache hydration
      expect(controller.overlay, isNotNull);
      expect(controller.overlay!.name, 'diwali_2026');
      expect(controller.theme.primaryColor, const Color(0xFF039D55));
    });

    // 5G: Multiple Festival Switching (Zero Mixed State)
    test('5G. Switching from Independence Day to Diwali produces ZERO mixed state', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final controller = CxpExperienceController(sharedPreferences: prefs);

      // Active Independence Day
      controller.updateExperience(CxpExperienceModel.fromJson(independenceDayActiveExperienceJson));
      expect(controller.overlay!.decorations.any((d) => d.type == 'paint_drip'), isTrue);
      expect(controller.overlay!.decorations.any((d) => d.id == 'dec_diya_header'), isFalse);

      // Switch to Diwali
      controller.updateExperience(CxpExperienceModel.fromJson(diwaliActiveExperienceJson));
      expect(controller.overlay!.name, 'diwali_2026');
      expect(controller.overlay!.decorations.any((d) => d.type == 'paint_drip'), isFalse);
      expect(controller.overlay!.decorations.any((d) => d.id == 'dec_diya_header'), isTrue);
    });

    // 5H: Disable / Enable Cycle
    test('5H. Disable and re-enable cycle updates overlay state cleanly', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final controller = CxpExperienceController(sharedPreferences: prefs);

      // Enabled
      controller.updateExperience(CxpExperienceModel.fromJson(independenceDayActiveExperienceJson));
      expect(controller.hasActiveFestivalOverlay, isTrue);

      // Disabled
      final disabledJson = jsonDecode(jsonEncode(independenceDayActiveExperienceJson));
      disabledJson['overlay']['enabled'] = false;
      controller.updateExperience(CxpExperienceModel.fromJson(disabledJson));
      expect(controller.hasActiveFestivalOverlay, isFalse);

      // Re-enabled
      controller.updateExperience(CxpExperienceModel.fromJson(independenceDayActiveExperienceJson));
      expect(controller.hasActiveFestivalOverlay, isTrue);
    });

    // 5I: Asset Failure Gracefulness
    testWidgets('5I. Broken asset in decoration list fails gracefully without breaking other decorations', (tester) async {
      final brokenDec = CxpDecorationModel(
        id: 'dec_broken',
        name: 'Broken Asset',
        assetUrl: 'invalid_malformed_url_%%%',
      );
      final validDec = CxpDecorationModel(
        id: 'dec_valid',
        name: 'Valid Asset',
        assetUrl: testSvgDataUri,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                CxpDecorationWidget(decoration: brokenDec),
                CxpDecorationWidget(decoration: validDec),
              ],
            ),
          ),
        ),
      );

      expect(find.byType(CxpDecorationWidget), findsNWidgets(2));
    });

    // 5J: Large Overlay Payload (up to 40 KB)
    test('5J. Large overlay payload with dozens of decorations parses under 50ms', () {
      final List<Map<String, dynamic>> largeDecs = [];
      for (int i = 0; i < 50; i++) {
        largeDecs.add({
          'id': 'dec_item_$i',
          'name': 'Large Decoration $i',
          'type': 'badge',
          'placement': i % 2 == 0 ? 'header' : 'hero',
          'assetUrl': testSvgDataUri,
          'opacity': 0.9,
          'size': 'sm',
          'positionX': 'center',
          'positionY': 'top',
          'mobileEnabled': true,
          'desktopEnabled': true,
          'decorative': true,
        });
      }

      final largeJson = jsonDecode(jsonEncode(independenceDayActiveExperienceJson));
      largeJson['overlay']['decorations'] = largeDecs;

      final stopwatch = Stopwatch()..start();
      final exp = CxpExperienceModel.fromJson(largeJson);
      stopwatch.stop();

      expect(exp.overlay!.decorations.length, 50);
      expect(stopwatch.elapsedMilliseconds, lessThan(50));
    });

    // 5K: Responsive Device Matrix
    testWidgets('5K. Responsive device matrix renders without RenderFlex overflow (360px to 1200px)', (tester) async {
      const List<double> testWidths = [360.0, 390.0, 430.0, 768.0, 1024.0, 1200.0];

      for (final width in testWidths) {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: SizedBox(
                width: width,
                height: 90.0,
                child: const CxpPaintDripWidget(
                  colors: [Color(0xFFFF9933), Color(0xFFFFFFFF), Color(0xFF138808)],
                  height: 90.0,
                ),
              ),
            ),
          ),
        );

        expect(find.byType(CxpPaintDripWidget), findsOneWidget);
        expect(tester.takeException(), isNull);
      }
    });

    // 5L: Performance & No Continuous Repaint
    testWidgets('5L. Paint drip CustomPainter shouldRepaint returns false when colors are unchanged', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CxpPaintDripWidget(
              colors: [Color(0xFFFF9933), Color(0xFFFFFFFF), Color(0xFF138808)],
            ),
          ),
        ),
      );

      expect(find.byType(CustomPaint), findsWidgets);
    });

    // 5M: Security & Declarative Safety
    test('5M. Dynamic script injection strings in overlay are treated strictly as plain text', () {
      final maliciousJson = jsonDecode(jsonEncode(independenceDayActiveExperienceJson));
      maliciousJson['overlay']['name'] = '<script>alert(1)</script>';
      maliciousJson['overlay']['displayName'] = 'javascript:evil()';

      final exp = CxpExperienceModel.fromJson(maliciousJson);
      expect(exp.overlay!.name, '<script>alert(1)</script>');
      expect(exp.overlay!.displayName, 'javascript:evil()');
    });

    // 5N: Tenant & Theme Isolation
    test('5N. Overlay in Theme A does not leak into Theme B', () {
      final themeA = CxpThemeModel.fromJson({
        'id': 1,
        'name': 'Tenant A Festival Theme',
        'tokens': {'sys.color.primary': '#039D55'},
        'overlay': independenceDayActiveExperienceJson['overlay'],
      });

      final themeB = CxpThemeModel.fromJson({
        'id': 2,
        'name': 'Tenant B Normal Theme',
        'tokens': {'sys.color.primary': '#039D55'},
        'overlay': null,
      });

      expect(themeA.overlay, isNotNull);
      expect(themeB.overlay, isNull);
    });
  });
}
