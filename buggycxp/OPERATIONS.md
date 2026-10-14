# BuggyCXP Operating Workflow

This is the canonical operating sequence for marketing, content, experience, QA, and release teams. The same sequence appears in the CXP sidebar, workflow bar, dashboard, and in-product guide.

## Roles and separation of duties

| Role | Responsibility | Must not do alone |
| --- | --- | --- |
| Content author | Media, copy, themes, audience drafts, experience composition | Approve and publish their own staging/production version |
| Reviewer | Accessibility, translation, targeting, contract, and simulator review | Change the reviewed immutable version after approval |
| QA tester | Development and QA device validation, analytics verification | Treat a simulator-only result as device proof |
| Publisher | Choose the exact approved version and destination | Publish production without explicit confirmation and monitoring ownership |
| Incident operator | Evaluate impact and perform audited rollback | Delete evidence or reuse an unverified version |

## Nine-step operating sequence

### 1. Media & Assets

Register approved HTTPS CDN assets. Add meaningful alternative text for visual media, confirm dimensions and MIME type, and verify licensing and PII safety. Completion means every required asset previews and can be understood accessibly.

### 2. Themes

Define semantic colour, typography, spacing, shape, motion, and asset tokens. Preview with the centralized real-data simulator. Check text/background contrast and reduced-motion behaviour. Completion means the saved theme is readable and selectable in Experience Studio.

### 3. Languages

Prepare English, Telugu + English, and Hindi + English copy. A second administrator reviews customer-facing translations. Arabic and RTL are intentionally outside the current product scope. Completion means required entries are approved and compile into SDUI.

### 4. Audiences

Create understandable rules from approved non-sensitive context fields such as market, city, locale, module, platform, sign-in state, or network class. Do not use sensitive personal attributes. Completion means a business owner can explain who matches and why.

### 5. Experience Studio

Compose registered widgets, connect prepared assets/theme/copy/audiences, validate the canonical document, and preview real data. Save an immutable page version only after simulator and contract validation. Completion means the intended version can no longer change beneath a reviewer.

### 6. Campaigns & Targeting

Create reusable visibility rules or a time-bounded two-variant assignment. Record the hypothesis and success/guardrail metrics before starting. Flutter must consume returned flag/variant assignments before experiments can change UI. Completion means rules are bounded and the mobile behaviour is proven in QA.

### 7. Publish Experiences

Choose experience, immutable version, and destination. Development and QA are internal. Staging and production require an independent `approved_by` reviewer. Production additionally requires typing `PUBLISH`. Completion means the exact intended version is active only in the chosen channel.

### 8. Scheduled Publishing

Choose an approved version, destination, local date/time, reason, monitoring owner, and rollback plan. Production requires typing `SCHEDULE`. Scheduled rollout is fixed at 100% because the current resolver does not enforce percentage canary bucketing; do not advertise a canary until resolver support exists. Completion means the schedule is visible and owned until execution or cancellation.

### 9. Analytics & Audit

Review actual widget events and administrator mutations. The current API supplies bounded widget impressions, taps, action outcomes, last-24-hour volume, aggregates, and audit history. It does not yet supply latency, availability, cache hit rate, or crash-free users, so those values must come from an observability integration before becoming release gates. Record a Keep, Improve, or Rollback decision in the delivery ticket.

## Release trigger checklist

Before staging or production, all items are mandatory:

- The page document and every registered widget pass the SDUI contracts.
- Media URLs, accessibility descriptions, theme contrast, and bilingual copy are reviewed.
- Targeting excludes sensitive data and has an owner, purpose, and expiry/window.
- The chosen version is immutable and independently approved.
- QA has tested the real build on representative Android and iOS devices, not only the simulator.
- Success and guardrail metrics, monitoring owner, and rollback version are recorded.
- Production confirmation is typed explicitly; no hidden or default production publish is allowed.

## Failure and recovery flow

1. Stop further publication or cancel a pending schedule.
2. Confirm affected page, channel, version, locale, market, module, and customer impact.
3. Use the dedicated rollback operation with a descriptive reason.
4. Verify the previous version resolves from the mobile endpoint and clear/invalidate caches where required.
5. Check widget events, audit history, application telemetry, and customer support signals.
6. Record the incident, root cause, corrective action, and new prevention test before republishing.

The resolver serves a canonical accessible bilingual emergency layout when the layout circuit breaker opens. This is recovery protection, not a substitute for rollback rehearsal.

## API ownership map

| Operation | API |
| --- | --- |
| Studio document and versions | `/BuggyCxp/api/qcos/studio` |
| Media | `/BuggyCxp/api/qcos/media` |
| Themes | `/BuggyCxp/api/qcos/themes` |
| Localization | `/BuggyCxp/api/qcos/localizations` |
| Audiences | `/BuggyCxp/api/qcos/segments` |
| Reusable rules | `/BuggyCxp/api/qcos/campaigns` |
| Experiments | `/BuggyCxp/api/qcos/experiments` |
| Releases and approval | `/BuggyCxp/api/qcos/releases` |
| Scheduling | `/BuggyCxp/api/qcos/schedules` |
| Mobile resolve | `/BuggyCxp/api/mobile/v1/experience/resolve` |
| Interaction metrics | `/BuggyCxp/api/qcos/analytics-stats` |
| Administrative history | `/BuggyCxp/api/qcos/audit-logs` |

## Local health check

Expected without an SSO cookie:

- BuggyDM login returns HTTP `200`.
- CXP admin routes return HTTP `307` and redirect to `/BuggyDm/login`.

Expected after login:

- Workflow home and all nine menu routes return HTTP `200`.
- Their GET APIs return `{ "success": true }`.
- Staging/production mutations still enforce review and explicit confirmation server-side.
