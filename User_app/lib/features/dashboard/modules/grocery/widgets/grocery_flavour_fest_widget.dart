import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:sixam_mart/api/api_client.dart';
import 'package:sixam_mart/common/widgets/custom_image.dart';
import 'package:sixam_mart/features/dashboard/modules/grocery/helper/grocery_config_cache.dart';
import 'package:sixam_mart/features/item/controllers/item_controller.dart';
import 'package:sixam_mart/features/item/domain/models/item_model.dart';
import 'package:sixam_mart/helper/route_helper.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/styles.dart';

// ============================================================================
// Controller: Fetches and caches dynamic FlavourFest card/theme data from CXP
// ============================================================================
class GroceryFlavourFestController extends GetxController {
  Map<String, dynamic>? config;
  bool isLoading = false;
  Timer? _pollTimer;
  String? _lastConfigJson;

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

  static List<Map<String, dynamic>> getDefaultOfferCards() {
    return [
      {
        'id': 'card_1',
        'title': 'Get\n70% OFF',
        'subtitle': 'UP TO ₹120',
        'searchQuery': '70% off',
        'graphicType': 'coupon',
        'gradient': ['#FFFFFF', '#FFFFFF'],
        'textColor': '#0F172A',
      },
      {
        'id': 'card_2',
        'title': 'Get A\nFree Treat',
        'subtitle': 'ON ₹199+',
        'searchQuery': 'dessert cake',
        'graphicType': 'cupcake',
        'gradient': ['#FFFFFF', '#FFFFFF'],
        'textColor': '#0F172A',
      },
      {
        'id': 'card_3',
        'title': 'Binge-Worthy\nOffers',
        'subtitle': 'TOP RESTAURANTS',
        'searchQuery': 'offers',
        'graphicType': 'badge150',
        'gradient': ['#FFFFFF', '#FFFFFF'],
        'textColor': '#0F172A',
      },
      {
        'id': 'card_4',
        'title': 'Discounts\nFrom Top Brands',
        'subtitle': 'PRICE CRASH',
        'searchQuery': 'popular',
        'graphicType': 'priceCrash',
        'gradient': ['#FFFFFF', '#FFFFFF'],
        'textColor': '#0F172A',
      },
    ];
  }

  static List<Map<String, dynamic>> getDefaultShowcaseItems() {
    return [
      {
        'id': 'item_1',
        'name': 'Creme Brulee Jar',
        'price': 90,
        'badge': 'ITEMS\nAT ₹90',
        'image': 'assets/image/steal_tiramisu.png',
        'emoji': '🍰',
        'adBadge': true,
        'tabId': 'all',
      },
      {
        'id': 'item_2',
        'name': 'Sundae Ice Cream Cup',
        'price': 90,
        'badge': 'ITEMS\nAT ₹90',
        'image': 'assets/image/sd_ice_creams.png',
        'emoji': '🍨',
        'adBadge': true,
        'tabId': 'all',
      },
      {
        'id': 'item_3',
        'name': 'Chocolate Truffle Cake',
        'price': 120,
        'badge': 'ITEMS\nAT ₹120',
        'image': 'assets/image/steal_dark_fantasy.png',
        'emoji': '🎂',
        'adBadge': true,
        'tabId': 'all',
      },
      {
        'id': 'item_4',
        'name': 'Strawberry Pastry',
        'price': 80,
        'badge': 'ITEMS\nAT ₹80',
        'image': 'assets/image/sd_sweet_cravings.png',
        'emoji': '🍓',
        'adBadge': true,
        'tabId': 'all',
      },
    ];
  }

  static Map<String, dynamic> getDefaultConfig() {
    return {
      'enabled': true,
      'title': 'FLAVOURFEST',
      'orderButtonText': 'ORDER NOW',
      'orderButtonQuery': 'offer',
      'leftMascot': {
        'type': 'emoji',
        'value': '🍟🎷',
        'starburstColor': '#E91E634D',
      },
      'rightMascot': {
        'type': 'emoji',
        'value': '🍔🎉',
        'starburstColor': '#E91E634D',
      },
      'theme': {
        'containerGradient': ['#2E0016', '#21000F', '#19000B'],
        'titleColor': '#FFE500',
        'titleStrokeColor': '#9E4B00',
        'titleShadowColor': '#5A001F',
        'buttonBgColor': '#1F010D',
        'buttonBorderColor': '#FF5200CC',
        'buttonTextColor': '#FFD54F',
        'cardDefaultGradient': ['#FFFFFF', '#FFFFFF'],
        'cardBorderColor': '#E2E8F0',
        'pillBarBgColor': '#F1F3F5',
        'pillActiveBgColor': '#FFFFFF',
        'pillActiveTextColor': '#FF5200',
        'pillInactiveTextColor': '#64748B',
        'showcaseCardBgColor': '#FFFFFF',
      },
      'cards': getDefaultOfferCards(),
      'filterTabs': [
        {'id': 'tab_1', 'label': 'TOP RATED', 'filterType': 'popular'},
        {'id': 'tab_2', 'label': 'FOOD IN 15 MINS', 'filterType': 'discounted'},
      ],
      'showcaseItems': getDefaultShowcaseItems(),
    };
  }

  @override
  void onInit() {
    super.onInit();
    config = GroceryConfigCache.load('flavour_fest') ?? getDefaultConfig();
    _lastConfigJson = jsonEncode(config);
    fetchDynamicConfig();
  }

  @override
  void onClose() {
    _pollTimer?.cancel();
    super.onClose();
  }

  Future<void> fetchDynamicConfig() async {
    try {
      final int timestamp = DateTime.now().millisecondsSinceEpoch;

      // 1. Direct HTTP endpoints targeting main backend and Next.js admin APIs
      final List<String> endpoints = [];
      if (GetPlatform.isWeb) {
        final host = (Uri.base.host.isNotEmpty && Uri.base.host != 'localhost') ? Uri.base.host : '127.0.0.1';
        endpoints.addAll([
          '${AppConstants.baseUrl}/api/v1/grocery/flavour-fest?_t=$timestamp',
          'http://127.0.0.1:8000/api/v1/grocery/flavour-fest?_t=$timestamp',
          'http://127.0.0.1:3000/BuggyDm/api/grocery/flavour-fest?_t=$timestamp',
          'http://localhost:3000/BuggyDm/api/grocery/flavour-fest?_t=$timestamp',
          'http://$host:3000/BuggyDm/api/grocery/flavour-fest?_t=$timestamp',
          'http://127.0.0.1:3001/BuggyCxp/api/grocery/flavour-fest?_t=$timestamp',
          'http://localhost:3001/BuggyCxp/api/grocery/flavour-fest?_t=$timestamp',
        ]);
      } else {
        endpoints.addAll([
          '${AppConstants.baseUrl}/api/v1/grocery/flavour-fest?_t=$timestamp',
          'http://127.0.0.1:8000/api/v1/grocery/flavour-fest?_t=$timestamp',
          'http://10.0.2.2:8000/api/v1/grocery/flavour-fest?_t=$timestamp',
          'http://10.0.2.2:3000/BuggyDm/api/grocery/flavour-fest?_t=$timestamp',
          'http://127.0.0.1:3000/BuggyDm/api/grocery/flavour-fest?_t=$timestamp',
        ]);
      }

      for (final endpoint in endpoints) {
        try {
          final res = await http.get(Uri.parse(endpoint)).timeout(const Duration(seconds: 3));
          if (res.statusCode == 200 && res.body.isNotEmpty) {
            final dynamic body = _parseConfig(res.body);
            final dynamic rawData = (body is Map) ? (body['data'] ?? body) : body;
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              final newJson = jsonEncode(parsed);
              if (_lastConfigJson != newJson) {
                _lastConfigJson = newJson;
                config = parsed;
                GroceryConfigCache.save('flavour_fest', parsed);
                update();
                if (kDebugMode) {
                  print('[FlavourFest] Dynamic config refreshed from $endpoint: ${parsed['title']}');
                }
              }
              return;
            }
          }
        } catch (_) {}
      }

      // 2. ApiClient fallback
      if (Get.isRegistered<ApiClient>()) {
        try {
          final res = await Get.find<ApiClient>().getData('/api/v1/grocery/flavour-fest', query: {'_t': '$timestamp'});
          if (res.statusCode == 200 && res.body != null) {
            final dynamic body = res.body;
            final dynamic rawData = (body is Map) ? body['data'] : _parseConfig(body)?['data'];
            final parsed = _parseConfig(rawData);
            if (parsed != null && parsed.isNotEmpty) {
              final newJson = jsonEncode(parsed);
              if (_lastConfigJson != newJson) {
                _lastConfigJson = newJson;
                config = parsed;
                GroceryConfigCache.save('flavour_fest', parsed);
                update();
              }
              return;
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  Color parseHexColor(dynamic hex, Color fallback) {
    if (hex == null) return fallback;
    final str = hex.toString().trim();
    if (str.isEmpty) return fallback;
    try {
      String clean = str.replaceAll('#', '');
      if (clean.length == 6) {
        clean = 'FF$clean';
      } else if (clean.length == 8) {
        // Keep as ARGB or RRGGBBAA depending on format
      }
      return Color(int.parse(clean, radix: 16));
    } catch (_) {
      return fallback;
    }
  }

  List<Color> parseGradient(dynamic list, List<Color> fallback) {
    if (list is List && list.isNotEmpty) {
      final parsed = list.map((c) => parseHexColor(c, fallback.first)).toList();
      if (parsed.isNotEmpty) return parsed;
    }
    return fallback;
  }

  List<Color> get containerGradient {
    final themeMap = (config?['theme'] is Map) ? Map<String, dynamic>.from(config!['theme']) : null;
    return parseGradient(themeMap?['containerGradient'], const [
      Color(0xFF2E0016),
      Color(0xFF21000F),
      Color(0xFF19000B),
    ]);
  }

  Color get headerTopColor => containerGradient.first;
  Color get headerBottomColor => containerGradient.length > 1 ? containerGradient[1] : containerGradient.first;
}

// ============================================================================
// Main Widget: GroceryFlavourFestWidget
// ============================================================================
class GroceryFlavourFestWidget extends StatefulWidget {
  final Map<String, dynamic>? initialProps;

  const GroceryFlavourFestWidget({super.key, this.initialProps});

  @override
  State<GroceryFlavourFestWidget> createState() => _GroceryFlavourFestWidgetState();
}

class _GroceryFlavourFestWidgetState extends State<GroceryFlavourFestWidget> {
  int _selectedFilterIndex = 0;
  final Set<int> _favoriteItemIds = {};

  @override
  void initState() {
    super.initState();
    if (!Get.isRegistered<GroceryFlavourFestController>()) {
      Get.put(GroceryFlavourFestController());
    } else {
      Get.find<GroceryFlavourFestController>().fetchDynamicConfig();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<GroceryFlavourFestController>(
      builder: (controller) {
        // Dynamic live data from controller (DB / CXP) takes precedence over static initialProps
        Map<String, dynamic>? mergedConfig;
        if (controller.config != null && widget.initialProps != null) {
          mergedConfig = Map<String, dynamic>.from(widget.initialProps!);
          mergedConfig.addAll(controller.config!);
          if (widget.initialProps!['theme'] is Map && controller.config!['theme'] is Map) {
            mergedConfig['theme'] = {
              ...Map<String, dynamic>.from(widget.initialProps!['theme']),
              ...Map<String, dynamic>.from(controller.config!['theme']),
            };
          }
        } else {
          mergedConfig = controller.config ?? widget.initialProps;
        }
        final config = mergedConfig;

        // If explicitly disabled in backend/CXP, collapse gracefully
        if (config != null && config['enabled'] == false) {
          return const SizedBox.shrink();
        }

        final themeMap = (config?['theme'] is Map) ? Map<String, dynamic>.from(config!['theme']) : null;

        final List<Color> containerGradient = controller.parseGradient(
          themeMap?['containerGradient'],
          const [
            Color(0xFF2E0016),
            Color(0xFF21000F),
            Color(0xFF19000B),
          ],
        );

        final String title = config?['title']?.toString() ?? 'FLAVOURFEST';
        final String orderButtonText = config?['orderButtonText']?.toString() ?? 'ORDER NOW';
        final String orderButtonQuery = config?['orderButtonQuery']?.toString() ?? 'offer';

        final dynamic leftMascotData = config?['leftMascot'];
        final dynamic rightMascotData = config?['rightMascot'];

        final rawCards = config?['cards'];
        final List dynamicCardsRaw = (rawCards is List && rawCards.isNotEmpty)
            ? rawCards
            : GroceryFlavourFestController.getDefaultOfferCards();

        final rawTabs = config?['filterTabs'];
        final List dynamicFilterTabsRaw = (rawTabs is List && rawTabs.isNotEmpty)
            ? rawTabs
            : [
                {'id': 'tab_1', 'label': 'TOP RATED'},
                {'id': 'tab_2', 'label': 'FOOD IN 15 MINS'},
              ];

        final rawShowcaseItems = config?['showcaseItems'];
        final List dynamicShowcaseItemsRaw = (rawShowcaseItems is List && rawShowcaseItems.isNotEmpty)
            ? rawShowcaseItems
            : GroceryFlavourFestController.getDefaultShowcaseItems();

        final double containerRadius = (themeMap?['containerRadius'] is num)
            ? (themeMap!['containerRadius'] as num).toDouble()
            : 0.0;
        final double containerBorderWidth = (themeMap?['containerBorderWidth'] is num)
            ? (themeMap!['containerBorderWidth'] as num).toDouble()
            : 0.0;
        final Color containerBorderColor = controller.parseHexColor(
          themeMap?['containerBorderColor'],
          Colors.transparent,
        );

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: containerGradient.first,
            borderRadius: containerRadius > 0 ? BorderRadius.circular(containerRadius) : null,
            border: containerBorderWidth > 0
                ? Border.all(color: containerBorderColor, width: containerBorderWidth)
                : null,
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: containerGradient,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),

              // 1. Header Banner with Dynamic Mascots, 3D Title & CTA Pill
              _FlavourFestHeaderWidget(
                title: title,
                orderButtonText: orderButtonText,
                orderButtonQuery: orderButtonQuery,
                themeMap: themeMap,
                leftMascotData: leftMascotData,
                rightMascotData: rightMascotData,
                controller: controller,
              ),

              const SizedBox(height: 14),

              // 2. Horizontal Scrollable Offer Cards (Dynamic from CXP)
              _FlavourFestOfferCardsCarouselWidget(
                cardsRaw: dynamicCardsRaw,
                themeMap: themeMap,
                controller: controller,
              ),

              const SizedBox(height: 18),

              // 3. Rounded Pill Switcher Filter (Configurable tabs)
              _FlavourFestPillFilterWidget(
                tabsRaw: dynamicFilterTabsRaw,
                selectedIndex: _selectedFilterIndex,
                themeMap: themeMap,
                controller: controller,
                onTabSelected: (index) {
                  setState(() {
                    _selectedFilterIndex = index;
                  });
                },
              ),

              const SizedBox(height: 14),

              // 4. Trending / Top Rated Items Showcase (Dynamic from CXP / BuggyDM)
              _FlavourFestItemsShowcaseWidget(
                selectedFilterIndex: _selectedFilterIndex,
                favoriteItemIds: _favoriteItemIds,
                showcaseItemsRaw: dynamicShowcaseItemsRaw,
                tabsRaw: dynamicFilterTabsRaw,
                themeMap: themeMap,
                controller: controller,
                onFavoriteToggle: (itemId) {
                  setState(() {
                    if (_favoriteItemIds.contains(itemId)) {
                      _favoriteItemIds.remove(itemId);
                    } else {
                      _favoriteItemIds.add(itemId);
                    }
                  });
                },
              ),

              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  List<Map<String, dynamic>> _getDefaultOfferCards() => GroceryFlavourFestController.getDefaultOfferCards();
}

// ============================================================================
// Sub-Widget: Header Banner (_FlavourFestHeaderWidget)
// ============================================================================
class _FlavourFestHeaderWidget extends StatelessWidget {
  final String title;
  final String orderButtonText;
  final String orderButtonQuery;
  final Map<String, dynamic>? themeMap;
  final dynamic leftMascotData;
  final dynamic rightMascotData;
  final GroceryFlavourFestController controller;

  const _FlavourFestHeaderWidget({
    required this.title, required this.orderButtonText, required this.orderButtonQuery, this.themeMap, this.leftMascotData,
    this.rightMascotData, required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    final titleFaceColor = controller.parseHexColor(themeMap?['titleColor'], const Color(0xFFFFE500));
    final titleStrokeColor = controller.parseHexColor(themeMap?['titleStrokeColor'], const Color(0xFF9E4B00));
    final titleShadowColor = controller.parseHexColor(themeMap?['titleShadowColor'], const Color(0xFF5A001F));

    final buttonBg = controller.parseHexColor(themeMap?['buttonBgColor'], const Color(0xFF1F010D));
    final buttonBorder = controller.parseHexColor(themeMap?['buttonBorderColor'], const Color(0xFFFF5200));
    final buttonText = controller.parseHexColor(themeMap?['buttonTextColor'], const Color(0xFFFFD54F));

    final double buttonRadius = (themeMap?['buttonRadius'] is num)
        ? (themeMap!['buttonRadius'] as num).toDouble()
        : 20.0;
    final double buttonBorderWidth = (themeMap?['buttonBorderWidth'] is num)
        ? (themeMap!['buttonBorderWidth'] as num).toDouble()
        : 1.2;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left Mascot
          _FlavourFestMascotWidget(
            mascotData: leftMascotData,
            defaultEmoji: '🍟🎷',
            controller: controller,
          ),

          // Center 3D Title + ORDER NOW Pill
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer stroke
                    Text(
                      title,
                      textAlign: TextAlign.center,
                      style: robotoBlack.copyWith(
                        fontSize: 22,
                        letterSpacing: 1.2,
                        foreground: Paint()
                          ..style = PaintingStyle.stroke
                          ..strokeWidth = 3.5
                          ..color = titleStrokeColor,
                      ),
                    ),
                    // Inner shadow
                    Text(
                      title,
                      textAlign: TextAlign.center,
                      style: robotoBlack.copyWith(
                        fontSize: 22,
                        letterSpacing: 1.2,
                        color: titleFaceColor.withValues(alpha: 0.8),
                        shadows: [
                          Shadow(
                            color: titleShadowColor,
                            offset: const Offset(0, 3),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                    ),
                    // Front face
                    Text(
                      title,
                      textAlign: TextAlign.center,
                      style: robotoBlack.copyWith(
                        fontSize: 22,
                        letterSpacing: 1.2,
                        color: titleFaceColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),

                // Dynamic CTA Button
                InkWell(
                  onTap: () {
                    Get.toNamed(RouteHelper.getSearchRoute(queryText: orderButtonQuery));
                  },
                  borderRadius: BorderRadius.circular(buttonRadius),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 3.5),
                    decoration: BoxDecoration(
                      color: buttonBg,
                      borderRadius: BorderRadius.circular(buttonRadius),
                      border: Border.all(
                        color: buttonBorder.withValues(alpha: 0.8),
                        width: buttonBorderWidth,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: buttonBorder.withValues(alpha: 0.35),
                          blurRadius: 6,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          orderButtonText,
                          style: robotoBlack.copyWith(
                            fontSize: 10.5,
                            color: buttonText,
                            letterSpacing: 0.8,
                          ),
                        ),
                        const SizedBox(width: 3),
                        Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 9,
                          color: buttonText,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Right Mascot
          _FlavourFestMascotWidget(
            mascotData: rightMascotData,
            defaultEmoji: '🍔🎉',
            controller: controller,
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Sub-Widget: Mascot Icon/Image (_FlavourFestMascotWidget)
// ============================================================================
class _FlavourFestMascotWidget extends StatelessWidget {
  final dynamic mascotData;
  final String defaultEmoji;
  final GroceryFlavourFestController controller;

  const _FlavourFestMascotWidget({
    this.mascotData, required this.defaultEmoji, required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    String value = defaultEmoji;
    Color starburst = const Color(0xFFE91E63).withValues(alpha: 0.3);
    double size = 46.0;
    bool enabled = true;

    if (mascotData is Map) {
      if (mascotData['enabled'] == false) {
        enabled = false;
      }
      if (mascotData['value'] != null && mascotData['value'].toString().isNotEmpty) {
        value = mascotData['value'].toString();
      }
      if (mascotData['starburstColor'] != null) {
        starburst = controller.parseHexColor(mascotData['starburstColor'], starburst);
      }
      if (mascotData['size'] != null) {
        size = double.tryParse(mascotData['size'].toString()) ?? 46.0;
      }
    } else if (mascotData is String && mascotData.isNotEmpty) {
      value = mascotData;
    }

    if (!enabled) {
      return SizedBox(width: size, height: size);
    }

    final bool isImageUrl = value.startsWith('http') || value.startsWith('/uploads') || value.startsWith('uploads');
    final double iconSize = (size * 0.72).clamp(16.0, 48.0);
    final double emojiSize = (size * 0.54).clamp(16.0, 36.0);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: starburst,
              shape: BoxShape.circle,
            ),
          ),
          if (isImageUrl)
            ClipOval(
              child: SizedBox(
                width: iconSize,
                height: iconSize,
                child: CustomImage(
                  image: resolveGroceryImageUrl(value),
                  fit: BoxFit.contain,
                ),
              ),
            )
          else
            Text(
              value,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: emojiSize),
            ),
        ],
      ),
    );
  }
}

// ============================================================================
// Sub-Widget: Offer Cards Carousel (_FlavourFestOfferCardsCarouselWidget)
// ============================================================================
class _FlavourFestOfferCardsCarouselWidget extends StatelessWidget {
  final List cardsRaw;
  final Map<String, dynamic>? themeMap;
  final GroceryFlavourFestController controller;

  const _FlavourFestOfferCardsCarouselWidget({
    required this.cardsRaw, this.themeMap, required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 154,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: cardsRaw.length,
        separatorBuilder: (context, index) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final cardItem = cardsRaw[index];
          final Map<String, dynamic> card = (cardItem is Map)
              ? Map<String, dynamic>.from(cardItem)
              : {};
          return _FlavourFestOfferCardWidget(
            cardData: card,
            themeMap: themeMap,
            controller: controller,
          );
        },
      ),
    );
  }
}

// ============================================================================
// Sub-Widget: Single Offer Card (_FlavourFestOfferCardWidget)
// ============================================================================
class _FlavourFestOfferCardWidget extends StatelessWidget {
  final Map<String, dynamic> cardData;
  final Map<String, dynamic>? themeMap;
  final GroceryFlavourFestController controller;

  const _FlavourFestOfferCardWidget({
    required this.cardData, this.themeMap, required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    final String title = cardData['title']?.toString() ?? 'Special\nOffer';
    final String subtitle = cardData['subtitle']?.toString() ?? '';
    final String searchQuery = cardData['searchQuery']?.toString() ?? 'offer';
    final String graphicType = cardData['graphicType']?.toString() ?? 'coupon';
    final String customImage = cardData['customImage']?.toString() ?? '';
    final String customEmoji = cardData['customEmoji']?.toString() ?? '';

    final List<Color> gradientColors = controller.parseGradient(
      cardData['gradient'],
      controller.parseGradient(
        themeMap?['cardDefaultGradient'],
        const [
          Color(0xFFE91E63),
          Color(0xFFC2185B),
          Color(0xFF880E4F),
        ],
      ),
    );

    final Color borderColor = controller.parseHexColor(
      themeMap?['cardBorderColor'],
      const Color(0xFFFF80AB).withValues(alpha: 0.4),
    );

    final Color textColor = controller.parseHexColor(cardData['textColor'], Colors.white);

    final double cardRadius = (themeMap?['cardRadius'] is num)
        ? (themeMap!['cardRadius'] as num).toDouble()
        : 20.0;
    final double cardBorderWidth = (themeMap?['cardBorderWidth'] is num)
        ? (themeMap!['cardBorderWidth'] as num).toDouble()
        : 1.2;

    return InkWell(
      onTap: () {
        Get.toNamed(RouteHelper.getSearchRoute(queryText: searchQuery));
      },
      borderRadius: BorderRadius.circular(cardRadius),
      child: Container(
        width: 114,
        padding: const EdgeInsets.fromLTRB(8, 10, 8, 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(cardRadius),
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: gradientColors,
          ),
          border: Border.all(
            color: borderColor,
            width: cardBorderWidth,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.35),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Headline
            Text(
              title,
              textAlign: TextAlign.center,
              style: robotoBold.copyWith(
                color: textColor,
                fontSize: 13,
                height: 1.12,
                letterSpacing: -0.2,
                shadows: (textColor.computeLuminance() > 0.4)
                    ? const [
                        Shadow(
                          color: Colors.black38,
                          offset: Offset(0, 1),
                          blurRadius: 2,
                        ),
                      ]
                    : null,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),

            // Graphic / Icon
            _FlavourFestGraphicWidget(
              graphicType: graphicType,
              customImage: customImage,
              customEmoji: customEmoji,
            ),

            // Subtitle / Caption
            if (subtitle.isNotEmpty) ...[
              const SizedBox(height: 3),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: robotoMedium.copyWith(
                  color: (textColor.computeLuminance() > 0.5)
                      ? textColor.withValues(alpha: 0.85)
                      : const Color(0xFF64748B),
                  fontSize: 9.5,
                  letterSpacing: 0.2,
                  height: 1.1,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// Sub-Widget: Dynamic Graphic Renderer (_FlavourFestGraphicWidget)
// ============================================================================
class _FlavourFestGraphicWidget extends StatelessWidget {
  final String graphicType;
  final String customImage;
  final String customEmoji;

  const _FlavourFestGraphicWidget({
    required this.graphicType, this.customImage = '', this.customEmoji = '',
  });

  @override
  Widget build(BuildContext context) {
    if (graphicType == 'custom_image' && customImage.isNotEmpty) {
      final resolved = resolveGroceryImageUrl(customImage);
      return SizedBox(
        height: 48,
        child: (resolved.startsWith('http://') || resolved.startsWith('https://'))
            ? Image.network(
                resolved,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.image_not_supported, size: 24, color: Colors.grey),
              )
            : CustomImage(
                image: resolved,
                fit: BoxFit.contain,
              ),
      );
    }

    if (graphicType == 'emoji' && customEmoji.isNotEmpty) {
      return Text(customEmoji, style: const TextStyle(fontSize: 26));
    }

    switch (graphicType) {
      case 'cupcake':
        return const Stack(
          alignment: Alignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('🧁', style: TextStyle(fontSize: 26)),
                SizedBox(width: 2),
                Text('🍰', style: TextStyle(fontSize: 26)),
              ],
            ),
          ],
        );

      case 'badge150':
        return Container(
          width: 72,
          height: 54,
          decoration: BoxDecoration(
            gradient: const RadialGradient(
              colors: [
                Color(0xFFFFD54F),
                Color(0xFFFFA000),
                Color(0xFF795548),
                Color(0xFF3E2723),
              ],
            ),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFFFFE082), width: 1.5),
            boxShadow: const [
              BoxShadow(
                color: Colors.black45,
                blurRadius: 4,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'MIN.',
                style: robotoBold.copyWith(
                  fontSize: 7.5,
                  color: Colors.white,
                  letterSpacing: 0.5,
                  height: 1.0,
                ),
              ),
              Text(
                '₹150',
                style: robotoBlack.copyWith(
                  fontSize: 15,
                  color: Colors.white,
                  letterSpacing: -0.5,
                  height: 1.0,
                ),
              ),
              Text(
                'OFF',
                style: robotoBold.copyWith(
                  fontSize: 7.5,
                  color: Colors.white,
                  letterSpacing: 0.5,
                  height: 1.0,
                ),
              ),
            ],
          ),
        );

      case 'priceCrash':
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF1E020E),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFFF4081), width: 1),
              ),
              child: Column(
                children: [
                  Text(
                    'PRICE',
                    style: robotoBlack.copyWith(
                      fontSize: 11,
                      color: Colors.white,
                      height: 1.0,
                    ),
                  ),
                  Text(
                    'CRASH',
                    style: robotoBlack.copyWith(
                      fontSize: 12,
                      color: const Color(0xFFFFEB3B),
                      height: 1.0,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 5,
                  height: 5,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFFEB3B),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Container(
                  width: 5,
                  height: 5,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFF4081),
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
          ],
        );

      case 'coupon':
      default:
        return const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _YellowTicketWidget(),
            SizedBox(width: 4),
            _YellowTicketWidget(),
          ],
        );
    }
  }
}

class _YellowTicketWidget extends StatelessWidget {
  const _YellowTicketWidget();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 44,
      decoration: BoxDecoration(
        color: const Color(0xFFFFEB3B),
        borderRadius: BorderRadius.circular(4),
        boxShadow: const [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Container(
            width: double.infinity,
            height: 1.5,
            color: const Color(0xFFF57F17).withValues(alpha: 0.5),
          ),
          Text(
            '%',
            style: robotoBlack.copyWith(
              fontSize: 15,
              color: const Color(0xFFE65100),
            ),
          ),
          Container(
            width: double.infinity,
            height: 1.5,
            color: const Color(0xFFF57F17).withValues(alpha: 0.5),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Sub-Widget: Pill Filter Switcher (_FlavourFestPillFilterWidget)
// ============================================================================
class _FlavourFestPillFilterWidget extends StatelessWidget {
  final List tabsRaw;
  final int selectedIndex;
  final Map<String, dynamic>? themeMap;
  final GroceryFlavourFestController controller;
  final ValueChanged<int> onTabSelected;

  const _FlavourFestPillFilterWidget({
    required this.tabsRaw, required this.selectedIndex, this.themeMap, required this.controller,
    required this.onTabSelected,
  });

  @override
  Widget build(BuildContext context) {
    final barBg = controller.parseHexColor(themeMap?['pillBarBgColor'], const Color(0xFFF1F3F5));
    final activeText = controller.parseHexColor(themeMap?['pillActiveTextColor'], const Color(0xFFFF5200));
    final inactiveText = controller.parseHexColor(themeMap?['pillInactiveTextColor'], const Color(0xFF64748B));
    final activeBg = controller.parseHexColor(themeMap?['pillActiveBgColor'], Colors.white);

    final double pillRadius = (themeMap?['pillRadius'] is num)
        ? (themeMap!['pillRadius'] as num).toDouble()
        : 24.0;
    final double innerPillRadius = pillRadius > 4 ? pillRadius - 4 : pillRadius;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Container(
        height: 44,
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: barBg,
          borderRadius: BorderRadius.circular(pillRadius),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: tabsRaw.asMap().entries.map((entry) {
            final int index = entry.key;
            final dynamic tabItem = entry.value;
            final String label = (tabItem is Map)
                ? (tabItem['label']?.toString() ?? 'TAB')
                : tabItem.toString();
            final bool isSelected = selectedIndex == index;

            return Expanded(
              child: InkWell(
                onTap: () => onTabSelected(index),
                borderRadius: BorderRadius.circular(innerPillRadius),
                child: Container(
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isSelected ? activeBg : Colors.transparent,
                    borderRadius: BorderRadius.circular(innerPillRadius),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ]
                        : null,
                  ),
                  child: Text(
                    label,
                    style: robotoBold.copyWith(
                      fontSize: 13,
                      letterSpacing: 0.4,
                      color: isSelected ? activeText : inactiveText,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// ============================================================================
// Sub-Widget: Items Showcase (_FlavourFestItemsShowcaseWidget)
// ============================================================================
class _FlavourFestItemsShowcaseWidget extends StatelessWidget {
  final int selectedFilterIndex;
  final Set<int> favoriteItemIds;
  final ValueChanged<int> onFavoriteToggle;
  final List showcaseItemsRaw;
  final List tabsRaw;
  final Map<String, dynamic>? themeMap;
  final GroceryFlavourFestController controller;

  const _FlavourFestItemsShowcaseWidget({
    required this.selectedFilterIndex,
    required this.favoriteItemIds,
    required this.onFavoriteToggle,
    this.showcaseItemsRaw = const [],
    this.tabsRaw = const [],
    this.themeMap,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ItemController>(
      builder: (itemController) {
        // If showcaseItemsRaw has items configured from backend / BuggyDM / CXP
        if (showcaseItemsRaw.isNotEmpty) {
          String? currentTabId;
          if (selectedFilterIndex >= 0 && selectedFilterIndex < tabsRaw.length) {
            final tab = tabsRaw[selectedFilterIndex];
            if (tab is Map && tab['id'] != null) {
              currentTabId = tab['id'].toString();
            }
          }

          // Filter items matching the current tab or tabId == 'all'
          final filteredConfigItems = showcaseItemsRaw.where((item) {
            if (item is Map) {
              final tabId = item['tabId']?.toString();
              if (tabId == null || tabId.isEmpty || tabId == 'all' || currentTabId == null) {
                return true;
              }
              return tabId == currentTabId;
            }
            return true;
          }).toList();

          final displayItems = filteredConfigItems.isNotEmpty ? filteredConfigItems : showcaseItemsRaw;

          return SizedBox(
            height: 148,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: displayItems.length,
              separatorBuilder: (context, index) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final item = displayItems[index];
                return _FlavourFestItemCardWidget(
                  item: item,
                  index: index,
                  favoriteItemIds: favoriteItemIds,
                  onFavoriteToggle: onFavoriteToggle,
                  themeMap: themeMap,
                  controller: controller,
                );
              },
            ),
          );
        }

        final displayItems = _getFallbackShowcaseItems();

        return SizedBox(
          height: 148,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: displayItems.length,
            separatorBuilder: (context, index) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final item = displayItems[index];
              return _FlavourFestItemCardWidget(
                item: item,
                index: index,
                favoriteItemIds: favoriteItemIds,
                onFavoriteToggle: onFavoriteToggle,
                themeMap: themeMap,
                controller: controller,
              );
            },
          ),
        );
      },
    );
  }

  List<Map<String, dynamic>> _getFallbackShowcaseItems() {
    return GroceryFlavourFestController.getDefaultShowcaseItems();
  }
}

// ============================================================================
// Sub-Widget: Single Showcase Item Card (_FlavourFestItemCardWidget)
// ============================================================================
class _FlavourFestItemCardWidget extends StatelessWidget {
  final dynamic item;
  final int index;
  final Set<int> favoriteItemIds;
  final ValueChanged<int> onFavoriteToggle;
  final Map<String, dynamic>? themeMap;
  final GroceryFlavourFestController controller;

  const _FlavourFestItemCardWidget({
    required this.item,
    required this.index,
    required this.favoriteItemIds,
    required this.onFavoriteToggle,
    this.themeMap,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    final bool isRealItem = item is Item;
    final String title = isRealItem ? (item.name ?? '') : (item['name'] ?? '');
    final String image = isRealItem ? (item.imageFullUrl ?? '') : (item['image'] ?? '');
    final String emoji = (!isRealItem && item is Map && item['emoji'] != null && item['emoji'].toString().isNotEmpty)
        ? item['emoji'].toString()
        : '🍰';
    final double price = isRealItem
        ? (item.price ?? 90.0)
        : (double.tryParse(item['price']?.toString() ?? '90') ?? 90.0);

    final String badgeText;
    if (isRealItem) {
      badgeText = item.discount != null && item.discount! > 0
          ? '₹${item.discount!.toInt()} OFF'
          : 'ITEMS AT ₹${price.toInt()}';
    } else {
      final configuredBadge = item['badge']?.toString();
      if (configuredBadge != null && configuredBadge.isNotEmpty) {
        badgeText = configuredBadge;
      } else {
        badgeText = 'AT ₹${price.toInt()}';
      }
    }

    final bool showAd = isRealItem ? true : (item['adBadge'] != false);
    final int itemId = isRealItem
        ? (item.id ?? index)
        : (int.tryParse(item['itemId']?.toString() ?? '') ?? (int.tryParse(item['id']?.toString() ?? '') ?? index));
    final bool isFavorite = favoriteItemIds.contains(itemId);

      final double showcaseRadius = (themeMap?['showcaseCardRadius'] is num)
          ? (themeMap!['showcaseCardRadius'] as num).toDouble()
          : 16.0;
      final double showcaseBorderWidth = (themeMap?['showcaseCardBorderWidth'] is num)
          ? (themeMap!['showcaseCardBorderWidth'] as num).toDouble()
          : 1.0;
      final Color showcaseBorderColor = controller.parseHexColor(
        themeMap?['showcaseCardBorderColor'],
        Colors.black.withValues(alpha: 0.08),
      );
      final Color showcaseBg = controller.parseHexColor(
        themeMap?['showcaseCardBgColor'],
        Colors.white,
      );

      return InkWell(
        onTap: () {
          if (isRealItem) {
            Get.toNamed(RouteHelper.getItemDetailsRoute(
              item.id,
              false,
              item.name ?? '',
              slug: item.slug ?? '',
            ));
          } else if (item is Map && item['itemId'] != null && (item['itemId'] is int || int.tryParse(item['itemId'].toString()) != null)) {
            final pId = item['itemId'] is int ? item['itemId'] as int : int.parse(item['itemId'].toString());
            Get.toNamed(RouteHelper.getItemDetailsRoute(
              pId,
              false,
              title,
              slug: item['slug']?.toString() ?? '',
            ));
          } else {
            final query = (item is Map && item['searchQuery'] != null && item['searchQuery'].toString().isNotEmpty)
                ? item['searchQuery'].toString()
                : title;
            Get.toNamed(RouteHelper.getSearchRoute(queryText: query));
          }
        },
        borderRadius: BorderRadius.circular(showcaseRadius),
        child: Container(
          width: 118,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(showcaseRadius),
            color: showcaseBg,
            border: Border.all(
              color: showcaseBorderColor,
              width: showcaseBorderWidth,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(showcaseRadius),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Item Image or fallback Emoji
              (() {
                final resolvedImg = resolveGroceryImageUrl(image);
                if (resolvedImg.isNotEmpty && (resolvedImg.startsWith('http://') || resolvedImg.startsWith('https://'))) {
                  return CustomImage(
                    image: resolvedImg,
                    fit: BoxFit.cover,
                  );
                } else if (resolvedImg.isNotEmpty && (resolvedImg.startsWith('assets/') || resolvedImg.startsWith('/assets/'))) {
                  final assetPath = resolvedImg.startsWith('/') ? resolvedImg.substring(1) : resolvedImg;
                  return Image.asset(
                    assetPath,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: Colors.white,
                      alignment: Alignment.center,
                      child: Text(emoji, style: const TextStyle(fontSize: 38)),
                    ),
                  );
                } else if (image.isNotEmpty && (image.startsWith('assets/') || image.startsWith('/assets/'))) {
                  final assetPath = image.startsWith('/') ? image.substring(1) : image;
                  return Image.asset(
                    assetPath,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: Colors.white,
                      alignment: Alignment.center,
                      child: Text(emoji, style: const TextStyle(fontSize: 38)),
                    ),
                  );
                } else {
                  return Container(
                    color: Colors.white,
                    alignment: Alignment.center,
                    child: Text(emoji, style: const TextStyle(fontSize: 38)),
                  );
                }
              })(),

              // Favorite Heart
              Positioned(
                top: 6,
                right: 6,
                child: InkWell(
                  onTap: () => onFavoriteToggle(itemId),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.08),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isFavorite ? Icons.favorite : Icons.favorite_border,
                      size: 15,
                      color: isFavorite ? const Color(0xFFFF2A6D) : Colors.black54,
                    ),
                  ),
                ),
              ),

              // Bottom gradient shade
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.65),
                      ],
                    ),
                  ),
                ),
              ),

              // Bottom Left Badge
              Positioned(
                bottom: 6,
                left: 6,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    badgeText,
                    style: robotoBlack.copyWith(
                      fontSize: 8.5,
                      color: Colors.white,
                      height: 1.1,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
              ),

              // Bottom Right AD Badge
              if (showAd)
                Positioned(
                  bottom: 6,
                  right: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: Text(
                      'AD',
                      style: robotoRegular.copyWith(
                        fontSize: 7,
                        color: Colors.white70,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
