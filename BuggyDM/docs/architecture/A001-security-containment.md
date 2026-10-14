# A001 — BuggyDM security containment

Status: implemented as the first step of the target architecture.

## Outcome

BuggyDM now treats navigation as presentation only. Authorization is enforced again at every Route Handler and every Server Action before data access or mutation.

The legacy encrypted, client-contained seven-day admin cookie has been replaced by a random opaque token. Session state is stored server-side for eight hours. Production fails closed when Redis is unavailable; development can use an in-process store.

## Request boundary

1. `src/proxy.ts` performs an optimistic cookie-shape check and redirects unauthenticated pages.
2. Route Handlers call `authorizeApi(permission)` and return a generic 401 or 403 response.
3. Server Actions call `requirePermission(permission)` before reading parameters or accessing repositories.
4. Role 1 is the temporary break-glass super-admin. Every other role receives only the permission keys stored in `qcom_rbac_roles_permissions` at login.
5. Existing sessions are intentionally invalid after deployment.

Proxy is not an authorization boundary. A forged token that passes Proxy's shape check is rejected when the handler looks up the session server-side.

## Permission catalogue

| Domain | Read | Mutation |
| --- | --- | --- |
| Orders | `orders.read` | `orders.manage` |
| Catalogue | `catalog.read` | `catalog.manage` |
| Store operations | `operations.read` | `operations.execute` |
| Operations supervision | — | `operations.manage` |
| Riders | `riders.read` | `riders.manage` |
| Analytics | `analytics.read` | — |
| Navigation | — | `admin.navigation.manage` |
| RBAC | — | `admin.rbac.manage` |
| CXP | `cxp.read` | `cxp.publish` |
| Files | — | `files.upload` |

Before enabling a non-super-admin role in production, explicitly assign the required keys through the RBAC workflow and require the user to sign in again. Permission changes do not alter an already-issued session in this containment version.

## Upload containment

Development uploads require `files.upload`, accept JPEG/PNG/WebP only, verify both the declared media type and file signature, enforce a 5 MB limit, and generate server-owned names. Production rejects local-disk uploads until the object-storage adapter, malware scanning, and signed asset delivery are configured.

## Order state integrity

Order mutations use a legal forward-only state machine and an atomic compare-and-update. Concurrent or stale transitions fail instead of overwriting a newer state.

## Automated gate

Run:

```bash
npm run security:check
npx tsc --noEmit
npm run lint
npm run build
```

`security:check` fails when an API handler or non-auth Server Action is added without a matching permission guard, if deprecated middleware returns, or if Proxy is removed.

## Remaining target-architecture work

This containment makes the modular monolith safer; it does not turn the legacy database into the target platform.

1. Move customer/mobile APIs behind a dedicated API gateway using customer/device access tokens. Flutter SDUI consumption must not use BuggyDM admin sessions.
2. Split command ownership into bounded services: Identity, Catalogue, Inventory, Order, Fulfilment, Dispatch, Rider, CXP, and Notification.
3. Replace direct cross-domain table writes with application services, an outbox table, idempotency keys, and durable event delivery.
4. Add organization/store scope enforcement to every repository query. Permission alone is insufficient for multi-tenant isolation.
5. Move uploads to object storage with presigned requests, scanning, metadata records, retention, and CDN delivery.
6. Remove seed-on-read and fabricated fallback dashboard data. Seeding belongs in explicit, idempotent environment bootstrap commands.
7. Add audit records for every privileged mutation, including actor session ID, organization/store scope, request correlation ID, before/after state, and reason.
8. Add integration tests using a disposable database and Redis, then run the gates in CI before deployment.
