# BuggyCXP SDUI Implementation

## Implemented foundation

- Canonical SDUI authoring contracts with payload/section/widget limits.
- Versioned allow-listed widget and action registry.
- Buggy-owned Food Home, Quick Commerce Home, Category Directory, Category Listing, and full Reorder templates.
- Governed module shell metadata with semantic Food/Quick Commerce theme families, allow-listed menus, capability-gated destinations, and native cart policy.
- Module-aware simulator themes, content, navigation destinations, Category preview, and full Reorder preview.
- Advanced governed appearance presets for header, module-tab, search, navigation, density, card-shape, and campaign-motion variants, with editable allow-listed menu destinations in Experience Studio.
- High-fidelity home and destination simulation with immersive delivery chrome, asymmetric campaigns, grouped categories, filter controls, vertical catalog/reorder rails, richer cards, and native cart feedback.
- Authoring validation that rejects module/theme mismatches, duplicate menu IDs, and embedded commerce truth such as price, stock, ETA, cart amount, threshold amount, or order status.
- Persistent Experience Studio loading, validation, preview, immutable draft creation, and version history.
- Registry/release-channel bootstrap endpoint.
- Independent review requirement for approval.
- Approval required before staging/production promotion.
- Page-scoped publication pointers, cache invalidation, audited rollback reason, and corrected promote route.
- SHA-256 layout/cache identifiers and context variation by channel, market, locale, module, city, sign-in state, platform, app version, and capability manifest.
- Normalized mobile-safe layout output rather than raw Prisma/database records.
- Registered data-source keys rather than client-executable resolver URLs.
- Public contract catalogue and mobile resolve API with ETag/304, rate limiting, and stale-if-error metadata.
- Trusted-gateway-only customer context; request bodies cannot impersonate a customer.
- Production session-secret enforcement.
- Role-permission authorization with same-origin mutation checks.
- Governed media library, localization registry, reusable audience segments, deterministic experiment assignment, and scheduled/canary release execution.
- Contract tests, TypeScript validation, Prisma validation, and production build check.

## Admin workflow

1. Sign in to BuggyCXP.
2. Open `/BuggyCxp/admin/experience`.
3. Select **Sync registry** once per environment to upsert release channels and widget definitions.
4. Select Food Home, Quick Commerce Home, or Category Listing.
5. Review the visual structure or edit the canonical JSON contract.
6. Select **Validate** and resolve every error.
7. Select **Save immutable draft**.
8. A different authorized administrator opens Release Control and approves the draft.
9. Promote to dev, QA, staging, then production. Staging/production reject unapproved drafts.
10. If guardrails regress, use rollback and provide the required audit reason.

## Mobile endpoints

```text
GET  /BuggyCxp/api/qcos/contracts
POST /BuggyCxp/api/mobile/v1/experience/resolve
```

The resolver accepts the SDUI request defined in the customer mobile blueprint. Authenticated customer identity must come from a trusted gateway using `X-CXP-User-Id` and `X-CXP-Gateway-Key`; the mobile application must never receive the gateway key.

## Required environment configuration

```text
DATABASE_URL
SESSION_SECRET       # minimum 32 characters in production
SESSION_SALT
REDIS_HOST
REDIS_PORT
CXP_GATEWAY_KEY      # server-to-server only
CXP_RESOLVE_RATE_LIMIT
CXP_SCHEDULER_KEY   # durable scheduler/cron caller only
CXP_SUPERADMIN_ROLE_IDS
```

## Verification

```bash
npm run check:sdui
```

The legacy repository still contains pre-existing ESLint debt outside the new SDUI files. Type checking and production builds no longer bypass errors; lint debt should be closed before enforcing repository-wide `npm run lint` as a release gate.

## Database rollout

The advanced-domain migration is intentionally committed but not automatically applied to a shared database:

```text
prisma/migrations/20260810_qcos_advanced_sdui/migration.sql
prisma/migrations/20260810_qcos_advanced_sdui/rollback.sql
```

Apply first to an isolated QA clone, verify row counts/query plans and run the full SDUI check, then rehearse the rollback before staging or production approval.

## Deliberate native boundaries

CXP controls presentation, themes, campaigns, section ordering, collection references, visibility, and allow-listed navigation. Flutter/core APIs retain authentication, permissions, catalog pagination, price/stock truth, cart reconciliation, checkout, payment, order lifecycle, maps, and safety-critical flows.

## Next implementation milestone

The current templates and mobile renderer are a foundation, not final Food/Quick Commerce parity. The contract-first work for module themes and menus, richer homes, Category Directory, full Reorder, Saved, Recently Viewed, product-listing controls, native cart state, accessibility, and rollout is tracked in [FOOD_INSTAMART_IMPLEMENTATION_TODO.md](./FOOD_INSTAMART_IMPLEMENTATION_TODO.md).
