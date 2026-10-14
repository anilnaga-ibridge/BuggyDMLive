# Food and Quick-Commerce Experience Implementation TODO

Status: CXP authoring/simulator and Flutter integrated-QA shopping implementation are complete as of 2026-08-26; the production closure gates in E010 remain.

## 2026-08-26 integrated implementation checkpoint

- [x] CXP typecheck, lint, 15 contract tests and optimized production build pass.
- [x] Governed Food and Quick Commerce shells, semantic themes, menus, appearance controls, templates and high-fidelity destination previews are implemented.
- [x] Flutter allow-listed Categories, Reorder, Saved, Recently Viewed, Collection, Product, Search, Cart, Checkout, Address and Account routes are implemented.
- [x] Core-owned delivery context/serviceability/ETA, current product detail, saved state, device-private recent history, cursor-backed reorder hydration, cart quantity controls, free-delivery progress and immutable quote totals are integrated.
- [x] Address list/add/edit/default/delete, COD order placement/recovery, order history/detail/tracking, support and push registration architecture are implemented through owner-scoped contracts.
- [x] Flutter analysis passes, 98 tests pass, native configuration passes, and signed ABI-split dev APKs meet the 30 MiB budget at 17.9–21.7 MiB.

Production closure still requires the guarded Core integration suite on an isolated local MySQL database, physical Android/iOS maps/location/Firebase/accessibility/checkout testing, managed production signing and staged rollout. Coupon and non-COD payment UI remain intentionally unavailable until the v2 signed quote/order contract supports them end to end.

This plan converts the reviewed Food and Instamart reference flow into Buggy-owned CXP, Core API, and Flutter capabilities. It targets the same information architecture and interaction quality without copying third-party branding, artwork, proprietary copy, or business rules.

## Target experience

### Shared shell

- Delivery context with selected address, serviceability, and authoritative ETA.
- Food, Quick Commerce, Dineout, and Scenes module switcher; unsupported modules remain visibly unavailable.
- Module-specific search, theme, menu, analytics context, and cart behavior.
- Safe module switching with an explicit cart conflict prompt when Core reports incompatible carts.
- Responsive, accessible layouts with skeleton, empty, error, offline, and stale-content states.

### Food home

- Dark/navy Food theme with high-contrast cards and Food-specific accent tokens.
- Search with rotating server-authored hints, voice affordance, and dietary toggle.
- Configurable intent tabs such as All, Gourmet, Offers, and rapid-delivery collections.
- Campaign hero/mosaic, weather or operational notice, reorder section, restaurant/store rails, and curated collections.
- Food-specific bottom menu driven by an allow-listed CXP menu definition.

### Quick Commerce home

- Light mint Quick Commerce theme and module-specific navigation.
- Search, saved-items entry, campaign/quick-intent rail, order-again mosaic, recently viewed rail, category campaigns, and curated product rails.
- Dedicated Category and Reorder destinations.
- Persistent native mini-cart and authoritative delivery-threshold progress when a cart exists.

### Category and reorder flows

- Grouped category directory with merchandising-controlled group order and Core-owned category data.
- Product listing with vertical subcategory rail, sort, facets, price-drop option, pagination, saved state, variants, badges, ratings, live price/stock, and add/quantity controls.
- Reorder as a full top-level destination, not a home-screen drawer: search, item count, prior-purchase groups, vertical group rail, filters, and live repriced product cards.

## Non-negotiable ownership boundary

| Concern | Owner | Rule |
| --- | --- | --- |
| Layout, theme, copy, campaigns, section order, collection references, visibility, audience, experiment, menu definition | CXP | Versioned, validated, previewed, approved, and rolled back through release control. |
| Address serviceability, ETA, stores, categories, catalog, facets, price, stock, variants, ratings, reorder eligibility, cart threshold, checkout, orders | Core API | Authoritative at request time; never embedded as editable CXP truth. |
| Native shell, route execution, module/cart switching, rendering, interaction, caching, accessibility, device integrations | Flutter | Reject unknown widgets/actions and preserve native commerce safeguards. |
| Media and localized presentation strings | CXP | Only governed assets and localized fallbacks may be published. |
| Analytics event names and required parameters | Shared registry | CXP selects allow-listed events; Flutter adds runtime context; no arbitrary payload execution. |

## Existing foundation

- [x] CXP has versioned SDUI contracts, widget/action allow lists, immutable drafts, validation, preview, approval, promotion, rollback, audience, experiment, localization, media, and scheduling foundations.
- [x] CXP has initial Food Home, Quick Commerce Home, and Category Listing template families.
- [x] CXP now has governed module shell metadata for `food_dark` and `quick_commerce_mint`, allow-listed menu destinations, upgraded Food/Quick Commerce homes, Category Directory, richer Category Listing, and full Reorder reference templates.
- [x] CXP now validates module/theme compatibility, duplicate menu IDs, widget versions, and attempts to embed price, stock, ETA, cart, or order truth in presentation props.
- [x] The CXP simulator now previews module-specific themes/content/menus plus Category and Reorder destinations instead of changing selected styling only.
- [x] Experience Studio now provides governed mobile appearance presets and controls for immersive/compact headers, arched/floating/segmented module tabs, search variants, content density, card shapes, motion, bottom-navigation styles, and editable menu destinations.
- [x] The high-fidelity simulator now separates immersive home chrome from destination pages and previews campaign mosaics, grouped categories, filter chips, vertical catalog/reorder rails, rich product cards, media-aware campaigns, and sticky cart feedback.
- [x] Flutter resolves governed experiences and has basic module selector, search, campaign, category, product, reorder, store, and notice renderers.
- [x] Flutter/Core have native discovery, authoritative cart, authentication, address/maps, quote, COD checkout, orders, tracking, support, push architecture, and lightweight Android release delivery.
- [ ] The current CXP simulator, templates, Flutter registry, routes, and Core read contracts provide the complete target experience above.

## Delivery order

Do not start visual screen implementation before E001 and E002 are accepted. Every later milestone depends on stable identifiers, ownership, and capability negotiation.

### E001 — Experience contract and design baseline

Owner: CXP + Flutter + Core. Priority: P0. Dependency: none.

- [ ] Freeze canonical module IDs: `food`, `quick_commerce`, `dineout`, and `scenes`.
- [ ] Freeze page IDs: `home`, `category_directory`, `category_listing`, `reorder`, `saved`, `recently_viewed`, and `collection_listing`.
- [ ] Define route parameters and reject arbitrary URLs, schemes, and page IDs.
- [ ] Define `food_dark` and `quick_commerce_mint` semantic token sets for color, typography, spacing, radius, elevation, imagery, and motion.
- [ ] Define compact, regular, large-text, reduced-motion, dark-mode, RTL, and minimum touch-target behavior.
- [ ] Create a component inventory and screen-state matrix for loading, empty, partial, error, offline, and stale content.
- [ ] Record analytics events and required parameters for module, search, campaign, collection, filter, product, reorder, saved item, and cart interactions.
- [ ] Approve original Buggy visual assets and copy; do not import reference-app logos, banners, product photography, or promotional claims.

Acceptance:

- Contract fixtures validate in CXP and Flutter.
- Tokens render at 100% and 200% text scale without clipped controls.
- Each route and action has one documented owner and fallback.

### E002 — Core discovery and personalization read contracts

Owner: Core API. Priority: P0. Dependency: E001.

- [ ] Add a module bootstrap response containing serviceability, selected location summary, ETA display data, enabled modules, cart compatibility, and capability versions.
- [ ] Add grouped category-directory data with stable group/category IDs and image references.
- [ ] Add collection resolution with cursor pagination and batch product hydration.
- [ ] Add listing facets, selected filters, allowed sort options, result count, subcategory counts, and cursor pagination.
- [ ] Add current product-card fields: image, title, unit, variants, rating/count, badges, dietary flags, current price, compare-at price, discount, stock, purchase limits, and delivery display data.
- [ ] Add reorder aggregation from owned prior orders with group counts, current catalog mapping, current price/stock, and unavailable-item reasons.
- [ ] Add privacy-bounded recently viewed storage/read/clear behavior and retention policy.
- [ ] Add saved-item list/toggle endpoints with owner scoping and idempotency.
- [ ] Add native cart-summary data for line count, image preview, amount, minimum/delivery threshold, progress, and module/store compatibility.
- [ ] Document cache policy, ETag behavior, timeout budget, partial failures, and backward-compatible versioning.

Acceptance:

- All price/stock/cart/reorder values originate from Core and are covered by owner-scoping tests.
- Empty, partial, stale, and unavailable-product fixtures exist.
- Collection and listing endpoints do not require CXP to send executable resolver URLs.

### E003 — CXP template, widget, theme, and menu upgrade

Owner: CXP. Priority: P0. Dependencies: E001 and agreed E002 schemas.

- [ ] Add template families for Food Home, Quick Commerce Home, Category Directory, Category Listing, Reorder, Saved, Recently Viewed, and Collection Listing.
- [ ] Upgrade `module_selector` with stable module IDs, enabled/disabled state, badge/ETA slot, selected styling, and capability fallback.
- [ ] Upgrade `search_entry` with module-scoped hints and allow-listed voice, dietary, saved, and scan/companion affordances.
- [ ] Add `quick_intent_rail`, `campaign_mosaic`, `operational_notice`, `order_again_mosaic`, `recently_viewed_rail`, and `grouped_category_directory` widgets.
- [ ] Add listing chrome for vertical subcategory groups, sort controls, facet entry, result count, and product-card presentation flags.
- [ ] Add full `reorder_catalog` composition; retain `reorder_rail` only for home-page previews.
- [ ] Add native mini-cart presentation configuration that references Core cart data and cannot author amount, threshold, or eligibility.
- [ ] Add governed module menu definitions with stable destinations, selected-state icon tokens, badge source keys, and platform/capability visibility.
- [ ] Add widget versions and minimum mobile capability declarations; keep old documents resolvable during rollout.
- [ ] Add data-source registry keys for every dynamic section and reject direct URLs or inline commerce truth.
- [ ] Add validation for duplicate destinations, unsupported widget/menu combinations, missing localized copy, inaccessible color contrast, payload size, and excessive section/card counts.

Acceptance:

- Authors can create and preview each target page without editing raw JSON for normal fields.
- Food and Quick Commerce previews use distinct themes, menus, sections, and supported actions.
- Validation blocks price, stock, ETA, cart threshold, checkout, or order state in editable widget content.

### E004 — CXP simulator and authoring UX fidelity

Owner: CXP. Priority: P1. Dependency: E003.

- [ ] Make module selection change the simulated page, theme, menu, search controls, and content rather than only selected styling.
- [ ] Make bottom-menu destinations render Home, Categories, Reorder, Saved/Print placeholder, and Cart preview states.
- [ ] Add viewport presets for small Android, standard Android, iPhone, large text, RTL, and reduced motion.
- [ ] Add loading, empty, partial-data, error, offline, unavailable-item, and active-cart preview fixtures.
- [ ] Add authoring forms for tokens, menus, widget configuration, collection references, and visibility rules.
- [ ] Show contract version, required app capability, data-source dependency, and fallback beside each widget.
- [ ] Add screenshot/regression fixtures for every template-theme-state combination.

Acceptance:

- Simulator navigation is functional and mirrors the mobile contract structure.
- A content author can identify unsupported app-version behavior before promotion.
- Reference fixtures are deterministic and suitable for visual-regression testing.

### E005 — Flutter module shell, theme, navigation, and SDUI registry

Owner: Flutter. Priority: P0. Dependencies: E001 and E003.

- [ ] Implement an app shell that resolves page + module + context and applies semantic module tokens.
- [ ] Render the authoritative delivery context and ETA without allowing CXP to override Core values.
- [ ] Implement guarded module switching, including confirmation when Core reports an incompatible non-empty cart.
- [ ] Build allow-listed native routes for Categories, Reorder, Saved, Recently Viewed, Collections, and Cart.
- [ ] Render module-specific bottom menus from validated CXP definitions while retaining a bundled safe menu fallback.
- [ ] Add renderers for every E003 widget and explicit placeholders/telemetry for unsupported versions.
- [ ] Expand the bundled fallback to include usable Food and Quick Commerce homes, not a single minimal Food page.
- [ ] Preserve scroll/tab state per module and restore the last valid destination after process restart.
- [ ] Apply accessible semantics, focus order, text scaling, reduced motion, keyboard behavior, and screen-reader labels.

Acceptance:

- Switching module changes theme, home composition, search context, and menu.
- Unknown widgets/actions never crash or execute arbitrary navigation.
- The bundled fallback remains shoppable when CXP is unavailable.

### E006 — Food home implementation

Owner: CXP composition + Flutter rendering + Core data. Priority: P1. Dependencies: E002–E005.

- [ ] Implement delivery header, Food module selector, voice search, dietary toggle, and intent tabs.
- [ ] Implement campaign hero/mosaic, operational notice, reorder rail, restaurant/store rail, and curated Food collections.
- [ ] Implement Food menu destinations and selected states.
- [ ] Add skeleton, empty, partial, offline, and retry behavior section by section.
- [ ] Track impressions only when visible and deduplicate on restoration.

Acceptance:

- Food home has its own theme and information architecture across supported screen sizes.
- Failed merchandising sections do not hide search, reorder, or native navigation.
- Live pricing or availability is never read from the CXP document.

### E007 — Quick Commerce home implementation

Owner: CXP composition + Flutter rendering + Core data. Priority: P1. Dependencies: E002–E005.

- [ ] Implement mint theme, contextual search, saved entry, quick-intent rail, and campaign cards.
- [ ] Implement order-again mosaic, recently viewed rail, seasonal/category campaigns, and curated product rails.
- [ ] Show the native mini-cart and threshold progress from the current Core cart snapshot.
- [ ] Implement Quick Commerce menu destinations and state restoration.
- [ ] Add deterministic placeholders and aspect-ratio handling for missing/slow images.

Acceptance:

- Home content is useful for signed-out, new, returning, empty-history, and active-cart customers.
- Personalized sections disappear cleanly when data/consent is unavailable.
- Add/quantity controls reconcile with Core after optimistic updates and rollback on failure.

### E008 — Category directory and product listing

Owner: CXP composition + Flutter rendering + Core catalog. Priority: P1. Dependencies: E002, E003, E005.

- [ ] Implement grouped category directory, search entry, campaigns, and menu selection.
- [ ] Implement listing header, vertical subcategory rail, sort, facet sheet, price-drop option, count, and cursor pagination.
- [ ] Implement rich product cards with saved state, badges, variants, dietary mark, ratings, current price, discount, stock, and quantity controls.
- [ ] Preserve selected filters and scroll position when returning from product detail.
- [ ] Handle out-of-stock, removed, restricted, maximum-quantity, and partial-page failures.

Acceptance:

- Filters/sorts are server-supported values and survive pagination.
- Product cards update after cart/saved mutations without refetching the whole page.
- Category rail and two-column grid remain usable at large text sizes and narrow screens.

### E009 — Full Reorder, Saved, and Recently Viewed destinations

Owner: Flutter + Core data + CXP composition. Priority: P1. Dependencies: E002, E003, E005.

- [ ] Implement Reorder as a dedicated route and bottom-menu destination.
- [ ] Show prior-item total, search, group counts, vertical group rail, filters, and current catalog cards.
- [ ] Clearly label changed price, unavailable, substituted/mapped, and no-longer-sold items.
- [ ] Add one item at a time through authoritative cart mutation; do not silently rebuild an old cart.
- [ ] Implement Saved and Recently Viewed destinations with remove/clear confirmations and privacy behavior.
- [ ] Add empty-history and signed-out states with safe discovery calls to action.

Acceptance:

- Reorder never displays an old order's price or availability as current truth.
- Every item is owner-scoped and validated against the current module/store before add.
- Search, filters, and category selection work on large histories with cursor pagination.

### E010 — Reliability, performance, analytics, and release

Owner: all teams. Priority: P0 before production. Dependencies: E005–E009.

- [ ] Set page, image, payload, memory, first-content, and interaction latency budgets on representative low-end devices.
- [ ] Add image sizing, compression, caching, cancellation, and decode-memory protections.
- [ ] Add contract, parser, renderer, widget, route, state, golden, integration, and API ownership tests.
- [ ] Test signed-out/in, no service, no history, partial API failure, CXP outage, stale cache, cart conflict, slow network, offline, and process death.
- [ ] Test Android/iOS screen readers, 200% text, RTL, color contrast, touch targets, keyboard, and reduced motion.
- [ ] Verify analytics consent, event deduplication, experiment exposure, and absence of secrets/PII in logs.
- [ ] Release behind capabilities and flags: internal -> QA -> 5% -> 25% -> 50% -> 100%, with rollback thresholds.
- [ ] Publish support/runbook notes and measure crash-free sessions, home success, search success, add-to-cart success, API error rate, and rendering fallbacks.

Acceptance:

- CXP, Core, and Flutter quality gates pass from clean checkouts.
- Production rollback can restore the prior CXP version without an app release.
- Native kill switches can disable a defective widget, page, or module menu safely.

## Required quality gates

### CXP

```bash
npm run typecheck
npm run lint
npm run test:contracts
npm run build:webpack
```

### Flutter

```bash
fvm flutter analyze
fvm flutter test
```

Run golden/integration tests and build optimized Android/iOS artifacts after the E005 renderer changes. Android delivery remains AAB for stores and ABI-split release APKs for direct testing; never use the universal debug APK as an application-size measure.

### Core API

Run the repository unit and guarded integration suites for serviceability, catalog, facets, personalization, saved items, cart compatibility, and owner-scoped reorder queries before enabling mobile flags.

## Definition of complete

The mobile experience is complete only when E001–E010 acceptance criteria pass on physical Android and iOS devices against an integrated QA environment. A polished simulator, static screenshots, or CXP publication alone does not count as mobile completion.
