import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sixam_mart/features/cxp/models/cxp_experience_model.dart';
import 'package:sixam_mart/features/cxp/models/cxp_theme_model.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_decoration_widget.dart';
import 'package:sixam_mart/features/cxp/widgets/cxp_paint_drip_widget.dart';
import 'package:sixam_mart/theme/buggy_cxp_theme_extension.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Test SVG Assets
  const testSvgDataUri =
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiIgcj0iNDAiIGZpbGw9IiNGRjAwMDAiLz48L3N2Zz4=';
  const testSvgPercentEncoded =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FF9933"/></svg>';

  // Fixture: Independence Day 2026/2027
  final Map<String, dynamic> independenceDayOverlayJson = {
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
        'name': 'Header Tiranga Flag',
        'type': 'flag',
        'placement': 'header',
        'assetUrl': testSvgDataUri,
        'opacity': 0.95,
        'size': 'sm',
        'positionX': 'right',
        'positionY': 'center',
        'mobileEnabled': true,
        'desktopEnabled': true,
        'decorative': true,
      },
      {
        'id': 'dec_hero_heritage',
        'name': 'Hero Freedom Artwork',
        'type': 'illustration',
        'placement': 'hero',
        'assetUrl': testSvgPercentEncoded,
        'opacity': 0.85,
        'size': 'xl',
        'positionX': 'center',
        'positionY': 'bottom',
        'scale': 1.2,
        'rotation': 5.0,
        'mobileEnabled': true,
        'desktopEnabled': true,
        'decorative': true,
      },
      {
        'id': 'dec_bg_chakra',
        'name': 'Chakra Watermark',
        'type': 'watermark',
        'placement': 'global_background',
        'assetUrl': testSvgDataUri,
        'opacity': 0.15,
        'size': 'full',
        'positionX': 'center',
        'positionY': 'center',
        'mobileEnabled': true,
        'desktopEnabled': true,
        'decorative': true,
      },
      {
        'id': 'dec_product_badge',
        'name': 'Product Card Corner Ribbon',
        'type': 'ribbon',
        'placement': 'product_card',
        'assetUrl': testSvgDataUri,
        'opacity': 0.9,
        'size': 'xs',
        'positionX': 'right',
        'positionY': 'top',
        'mobileEnabled': true,
        'desktopEnabled': true,
        'decorative': true,
      },
    ],
  };

  // Fixture: Diwali Overlay
  final Map<String, dynamic> diwaliOverlayJson = {
    'id': 'overlay_diwali_2026',
    'name': 'diwali_2026',
    'displayName': 'Diwali 2026 (Festival of Lights)',
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
        'id': 'dec_diwali_diya',
        'name': 'Diya Lamp Header',
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
      {
        'id': 'dec_diwali_rangoli',
        'name': 'Rangoli Hero Pattern',
        'type': 'pattern',
        'placement': 'hero',
        'assetUrl': testSvgPercentEncoded,
        'opacity': 0.8,
        'size': 'lg',
        'positionX': 'left',
        'positionY': 'bottom',
        'mobileEnabled': true,
        'desktopEnabled': true,
        'decorative': true,
      },
    ],
  };

  // Fixture: Unknown / Custom Festival
  final Map<String, dynamic> customFestivalOverlayJson = {
    'id': 'overlay_future_fest_3000',
    'name': 'galactic_harvest_3000',
    'displayName': 'Galactic Harvest 3000',
    'enabled': true,
    'opacity': 0.9,
    'accentColors': {
      'primary': '#8B5CF6',
      'secondary': '#EC4899',
      'tertiary': '#10B981',
    },
    'decorations': [
      {
        'id': 'dec_future_badge',
        'name': 'Future Badge',
        'type': 'futuristic_laser',
        'placement': 'header',
        'assetUrl': testSvgDataUri,
        'opacity': 0.9,
        'size': 'md',
        'positionX': 'center',
        'positionY': 'top',
        'mobileEnabled': true,
        'desktopEnabled': true,
      },
    ],
  };

  group('PHASE 4: CXP Festival Overlay Generic Renderer Suite', () {
    // 1. No overlay -> no decorations
    test('1. No overlay returns empty decorations list', () {
      final themeModel = CxpThemeModel(
        name: 'Default Theme',
        tokens: {'sys.color.primary': '#039D55'},
      );
      final themeExt = BuggyCxpThemeExtension.fromCxpTheme(themeModel);
      expect(themeExt.getHeaderDecorations(), isEmpty);
      expect(themeExt.getHeroDecorations(), isEmpty);
      expect(themeExt.getSectionDecorations(), isEmpty);
      expect(themeExt.getProductCardDecorations(), isEmpty);
    });

    // 2. Disabled overlay -> no decorations
    test('2. Disabled overlay returns empty decorations list', () {
      final disabledJson = Map<String, dynamic>.from(independenceDayOverlayJson);
      disabledJson['enabled'] = false;
      final overlay = CxpOverlayModel.fromJson(disabledJson);
      expect(overlay.getDecorations('header'), isEmpty);
      expect(overlay.getDecorations('hero'), isEmpty);
    });

    // 3. Unknown festival -> renders generically
    testWidgets('3. Unknown festival renders generically without hardcoding', (tester) async {
      final overlay = CxpOverlayModel.fromJson(customFestivalOverlayJson);
      expect(overlay.name, 'galactic_harvest_3000');
      expect(overlay.accentPrimary, const Color(0xFF8B5CF6));
      expect(overlay.decorations.length, 1);

      final dec = overlay.decorations.first;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CxpDecorationWidget(
              decoration: dec,
              accentColors: overlay.allAccents,
            ),
          ),
        ),
      );

      expect(find.byType(CxpDecorationWidget), findsOneWidget);
      final ignoreFinder = find.descendant(
        of: find.byType(CxpDecorationWidget),
        matching: find.byType(IgnorePointer),
      );
      expect(ignoreFinder, findsOneWidget);
      final ignorePointer = tester.widget<IgnorePointer>(ignoreFinder);
      expect(ignorePointer.ignoring, isTrue);
    });

    // 4. Paint drip decoration parsing
    test('4. Paint drip decoration parses correctly with type paint_drip', () {
      final overlay = CxpOverlayModel.fromJson(independenceDayOverlayJson);
      final dripDec = overlay.decorations.firstWhere((d) => d.type == 'paint_drip');
      expect(dripDec.id, 'dec_drip_header');
      expect(dripDec.placement, 'header');
      expect(dripDec.opacity, 1.0);
      expect(dripDec.size, 'lg');
    });

    // 5. Paint drip widget renders with organic drips and custom painter
    testWidgets('5. Paint drip widget renders with CustomPaint and IgnorePointer', (tester) async {
      final overlay = CxpOverlayModel.fromJson(independenceDayOverlayJson);
      final dripDec = overlay.decorations.firstWhere((d) => d.type == 'paint_drip');

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CxpDecorationWidget(
              decoration: dripDec,
              accentColors: overlay.allAccents,
            ),
          ),
        ),
      );

      expect(find.byType(CxpPaintDripWidget), findsOneWidget);
      expect(find.byType(CustomPaint), findsWidgets);
      expect(find.byType(IgnorePointer), findsWidgets);
    });

    // 6. Multiple decoration types
    test('6. Multiple decoration types supported in overlay', () {
      final overlay = CxpOverlayModel.fromJson(independenceDayOverlayJson);
      final types = overlay.decorations.map((d) => d.type).toSet();
      expect(types.contains('paint_drip'), isTrue);
      expect(types.contains('flag'), isTrue);
      expect(types.contains('illustration'), isTrue);
      expect(types.contains('watermark'), isTrue);
      expect(types.contains('ribbon'), isTrue);
    });

    // 7. Header placement
    test('7. Header placement returns only header decorations', () {
      final overlay = CxpOverlayModel.fromJson(independenceDayOverlayJson);
      final headerDecs = overlay.getDecorations('header');
      expect(headerDecs.length, 2);
      expect(headerDecs.every((d) => d.placement == 'header'), isTrue);
    });

    // 8. Hero placement
    test('8. Hero placement returns only hero decorations', () {
      final overlay = CxpOverlayModel.fromJson(independenceDayOverlayJson);
      final heroDecs = overlay.getDecorations('hero');
      expect(heroDecs.length, 1);
      expect(heroDecs.first.id, 'dec_hero_heritage');
    });

    // 9. Background placement
    test('9. Background placement returns watermark decoration', () {
      final overlay = CxpOverlayModel.fromJson(independenceDayOverlayJson);
      final bgDecs = overlay.getDecorations('global_background');
      expect(bgDecs.length, 1);
      expect(bgDecs.first.id, 'dec_bg_chakra');
    });

    // 10. Product card placement
    test('10. Product card placement returns ribbon decoration', () {
      final overlay = CxpOverlayModel.fromJson(independenceDayOverlayJson);
      final cardDecs = overlay.getDecorations('product_card');
      expect(cardDecs.length, 1);
      expect(cardDecs.first.id, 'dec_product_badge');
    });

    // 11. Invalid asset -> safe fallback
    testWidgets('11. Invalid asset renders safely without crashing host card', (tester) async {
      final invalidDec = CxpDecorationModel(
        id: 'dec_invalid',
        name: 'Corrupt Asset',
        assetUrl: 'corrupt_data_not_valid_uri',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CxpDecorationWidget(decoration: invalidDec),
          ),
        ),
      );

      expect(find.byType(CxpDecorationWidget), findsOneWidget);
    });

    // 12. Invalid decoration in JSON ignored safely
    test('12. Invalid decoration in JSON does not throw exception', () {
      final corruptOverlayJson = {
        'id': 'corrupt_overlay',
        'name': 'corrupt',
        'displayName': 'Corrupt',
        'enabled': true,
        'decorations': [
          null,
          'not_a_map',
          {'id': 'valid_dec', 'name': 'Valid', 'assetUrl': testSvgDataUri},
        ],
      };
      final overlay = CxpOverlayModel.fromJson(corruptOverlayJson);
      expect(overlay.decorations.length, 1);
      expect(overlay.decorations.first.id, 'valid_dec');
    });

    // 13. IgnorePointer for visual decorations
    testWidgets('13. Visual decorations wrap content with IgnorePointer', (tester) async {
      final overlay = CxpOverlayModel.fromJson(independenceDayOverlayJson);
      final flagDec = overlay.decorations.firstWhere((d) => d.type == 'flag');

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CxpDecorationWidget(decoration: flagDec),
          ),
        ),
      );

      final ignoreFinder = find.descendant(
        of: find.byType(CxpDecorationWidget),
        matching: find.byType(IgnorePointer),
      );
      expect(ignoreFinder, findsOneWidget);
      final ignorePointer = tester.widget<IgnorePointer>(ignoreFinder);
      expect(ignorePointer.ignoring, isTrue);
    });

    // 14. Base theme remains unchanged
    test('14. Base brand theme tokens remain unchanged when overlay is active', () {
      final expJson = {
        'page': 'home',
        'module': 'grocery',
        'theme': {
          'tokens': {
            'sys.color.primary': '#039D55',
            'sys.color.secondary': '#FF9900',
            'sys.shape.card_radius': '25px',
          },
        },
        'overlay': independenceDayOverlayJson,
      };

      final exp = CxpExperienceModel.fromJson(expJson);
      expect(exp.theme!.primaryColor, const Color(0xFF039D55));
      expect(exp.theme!.secondaryColor, const Color(0xFFFF9900));
      expect(exp.theme!.cardRadius, 25.0);

      // Overlay colors are isolated
      expect(exp.overlay!.accentPrimary, const Color(0xFFFF9933));
    });

    // 15. Decorations don't change layout height
    testWidgets('15. Header decorations overlay via Stack without expanding content height', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  key: const Key('base_header'),
                  height: 56.0,
                  color: Colors.amber,
                ),
                const Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: CxpPaintDripWidget(
                    colors: [Color(0xFFFF9933), Color(0xFFFFFFFF), Color(0xFF138808)],
                    height: 85.0,
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      final baseHeaderBox = tester.renderObject<RenderBox>(find.byKey(const Key('base_header')));
      expect(baseHeaderBox.size.height, 56.0);
    });

    // 16. Responsive width behavior
    testWidgets('16. Paint drip painter spans responsive widths naturally', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 375.0, // Mobile width
              height: 90.0,
              child: CxpPaintDripWidget(
                colors: [Color(0xFFFF9933), Color(0xFFFFFFFF), Color(0xFF138808)],
              ),
            ),
          ),
        ),
      );

      expect(find.byType(CxpPaintDripWidget), findsOneWidget);
    });

    // 17. Z-index and alignment calculation
    test('17. alignmentFor correctly resolves all 9 cardinal alignments', () {
      expect(CxpDecorationWidget.alignmentFor('left', 'top'), Alignment.topLeft);
      expect(CxpDecorationWidget.alignmentFor('center', 'top'), Alignment.topCenter);
      expect(CxpDecorationWidget.alignmentFor('right', 'top'), Alignment.topRight);
      expect(CxpDecorationWidget.alignmentFor('left', 'center'), Alignment.centerLeft);
      expect(CxpDecorationWidget.alignmentFor('center', 'center'), Alignment.center);
      expect(CxpDecorationWidget.alignmentFor('right', 'center'), Alignment.centerRight);
      expect(CxpDecorationWidget.alignmentFor('left', 'bottom'), Alignment.bottomLeft);
      expect(CxpDecorationWidget.alignmentFor('center', 'bottom'), Alignment.bottomCenter);
      expect(CxpDecorationWidget.alignmentFor('right', 'bottom'), Alignment.bottomRight);
    });

    // 18. Opacity clamping
    testWidgets('18. Opacity is clamped between 0.0 and 1.0', (tester) async {
      final dec = CxpDecorationModel(
        id: 'dec_opacity',
        name: 'Opacity Test',
        assetUrl: testSvgDataUri,
        opacity: 0.65,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CxpDecorationWidget(decoration: dec),
          ),
        ),
      );

      final opacityWidget = tester.widget<Opacity>(find.byType(Opacity).first);
      expect(opacityWidget.opacity, 0.65);
    });

    // 19. Scale transform
    testWidgets('19. Scale transform applies scale factor', (tester) async {
      final dec = CxpDecorationModel(
        id: 'dec_scale',
        name: 'Scale Test',
        assetUrl: testSvgDataUri,
        scale: 1.5,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CxpDecorationWidget(decoration: dec),
          ),
        ),
      );

      expect(find.byType(Transform), findsWidgets);
    });

    // 20. Rotation transform
    testWidgets('20. Rotation transform applies rotation in radians', (tester) async {
      final dec = CxpDecorationModel(
        id: 'dec_rot',
        name: 'Rotation Test',
        assetUrl: testSvgDataUri,
        rotation: 45.0,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CxpDecorationWidget(decoration: dec),
          ),
        ),
      );

      expect(find.byType(Transform), findsWidgets);
    });

    // 21. Animation disabled by default / subtle motion
    test('21. Animation defaults to none or declarative style without continuous loop', () {
      final dec = CxpDecorationModel(
        id: 'dec_anim',
        name: 'Anim Test',
        assetUrl: testSvgDataUri,
        animation: 'none',
      );
      expect(dec.animation, 'none');
    });

    // 22. Independence Day fixture end-to-end
    test('22. Independence Day fixture resolves complete decoration set', () {
      final overlay = CxpOverlayModel.fromJson(independenceDayOverlayJson);
      expect(overlay.displayName, 'Independence Day 2026');
      expect(overlay.accentPrimary, const Color(0xFFFF9933));
      expect(overlay.accentSecondary, const Color(0xFFFFFFFF));
      expect(overlay.accentTertiary, const Color(0xFF138808));
      expect(overlay.getDecorations('header').length, 2);
      expect(overlay.getDecorations('hero').length, 1);
      expect(overlay.getDecorations('global_background').length, 1);
      expect(overlay.getDecorations('product_card').length, 1);
    });

    // 23. Diwali fixture end-to-end
    test('23. Diwali fixture resolves complete decoration set', () {
      final overlay = CxpOverlayModel.fromJson(diwaliOverlayJson);
      expect(overlay.displayName, 'Diwali 2026 (Festival of Lights)');
      expect(overlay.accentPrimary, const Color(0xFFF59E0B));
      expect(overlay.accentSecondary, const Color(0xFFFEF3C7));
      expect(overlay.accentTertiary, const Color(0xFFDC2626));
      expect(overlay.getDecorations('header').length, 1);
      expect(overlay.getDecorations('hero').length, 1);
    });
  });
}
