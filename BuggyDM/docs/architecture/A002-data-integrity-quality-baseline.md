# A002 — BuggyDM data-integrity and quality baseline

Status: implemented and verified on 2026-08-11.

## Outcome

The BuggyDM modular monolith now has a reproducible zero-warning static-quality baseline and a successful production build. Operational workstation flows no longer depend on placeholder staff IDs, arbitrary database fallbacks, or UI-only success simulations.

This checkpoint deliberately improves the existing operational platform before a Flutter customer API is added. It does not make the BuggyDM admin application a customer-facing API.

## Quality gates

The following gates pass from the `BuggyDM` directory:

```bash
npx tsc --noEmit
npx eslint . --max-warnings 0
npm run security:check
npm run build
```

Measured lint movement during A002:

- starting repository baseline: 337 errors and 170 warnings;
- completed baseline: 0 errors and 0 warnings;
- Next.js production build: 48 routes compiled, type-checked, and prerendered successfully.

The build no longer downloads Google fonts. It uses a deterministic local/system font stack so CI and private deployments do not require access to `fonts.googleapis.com`.

## Data-integrity changes

1. Organization, topology, and rider reads no longer create seed records.
2. Prisma serialization is deeply typed and consistently converts BigInt, Decimal, Date, arrays, and nested objects.
3. Product updates use strict allowlists and bounded bulk operations instead of client-controlled mass assignment.
4. Inventory stock and rack changes are atomic and create privileged activity records.
5. Package staging resolves a scanned barcode or internal ID, requires a real shelf, checks capacity, and rejects non-QC-approved or duplicate staging.
6. QC, dispatch, picking, packing, returns, station assignments, exception resolution, and manager recommendation actions use the authenticated actor rather than a client-supplied `"1"` operator ID.
7. Return reconciliation verifies package ownership, stores validated proof-image URLs, and rejects duplicate restocking.
8. Supervisor station controls and exception resolution are persisted; the previous local-only simulator state was removed.
9. The rider simulator was replaced with an operational console backed by real riders, assigned orders, shift state, and payout rows. Fake timed order claims, invented wallet totals, and simulated bank withdrawals were removed.
10. Offline reconciliation no longer deletes queued actions after a simulated delay. Until the server protocol exists, it retains the queue and reports that synchronization is unavailable.

## CXP and SDUI typing

The compiled layout, theme, section, design-token, patch, rule, cache, and circuit-breaker paths now use shared explicit contracts. Cached layout payloads are validated before use. Release, theme, analytics, campaign, and layout APIs no longer depend on untyped Prisma access.

This is compiler and contract containment only. The mobile gateway must still expose a versioned, customer-safe SDUI envelope with capability negotiation, cache validators, locale selection, and signed media metadata.

## Live smoke checks

Against the existing development server on port 3000:

- `GET /BuggyDm/login` returns `200`;
- unauthenticated `GET /BuggyDm/api/orders` returns `401` with `UNAUTHENTICATED`;
- the production build completes successfully outside the restricted sandbox required by Turbopack worker processes.

## Known blockers before production rollout

These items are intentionally visible and must not be interpreted as complete:

1. Several legacy BI actions still contain derived demo/fallback business metrics. They must be replaced by defined metric contracts and time-windowed source queries before BI is used for decisions.
2. Dark-store creation still inherits mandatory legacy `stores` fields. The contract must collect or resolve vendor, module, phone, email, tax, organization, and compliance data instead of supplying legacy placeholders.
3. Offline actions need a versioned, idempotent server reconciliation endpoint, device identity, conflict policy, per-action validation, retry state, and dead-letter handling.
4. `operations.manage` must be assigned explicitly to supervisor/manager roles; role 1 remains the temporary break-glass administrator.
5. Tenant, organization, and warehouse scope enforcement is not yet systematic across every repository query.
6. Production proof/media storage still requires object storage, malware scanning, signed delivery, retention policy, and CDN integration.
7. Customer authentication, device attestation, API rate limits, idempotency, and the Flutter BFF/API gateway do not exist yet.

## Next architecture checkpoint

A003 will introduce the customer/device API boundary and SDUI bootstrap contract. It must be a separate versioned surface from the BuggyDM admin session APIs and must consume BuggyCXP published content as read-only compiled experiences.
