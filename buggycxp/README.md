# BuggyCXP

BuggyCXP is the governed experience cloud and SDUI content-management application for the Buggy customer app. It owns customer-facing composition, themes, localization, targeting, release control, scheduling, and interaction/audit review. Commerce APIs remain authoritative for price, availability, eligibility, order, and payment data.

## Local URLs

- BuggyDM login: <http://localhost:3000/BuggyDm/login>
- BuggyCXP workflow home: <http://localhost:3001/BuggyCxp/admin>
- In-product operating guide: <http://localhost:3001/BuggyCxp/admin/help>

BuggyDM and BuggyCXP must use the same `SESSION_SECRET` and `SESSION_SALT` so the encrypted SSO cookie can be read by both applications.

## Start locally

In separate terminals:

```bash
cd /Applications/MAMP/htdocs/BuggyMD/BuggyDM
npm run dev
```

```bash
cd /Applications/MAMP/htdocs/BuggyMD/buggycxp
npm run dev
```

The CXP server is configured for port `3001` and the `/BuggyCxp` base path.

## Required quality gates

Run before handing a CXP change to QA:

```bash
npm run typecheck
npm run lint
npm run test:contracts
npm run build:webpack
```

For the detailed author-to-release workflow, safety checkpoints, API ownership, and recovery procedure, see [OPERATIONS.md](./OPERATIONS.md).

For the SDUI schema and mobile boundary, see [SDUI_IMPLEMENTATION.md](./SDUI_IMPLEMENTATION.md).

For the prioritized Food and Quick Commerce CXP/Core/Flutter implementation backlog, see [FOOD_INSTAMART_IMPLEMENTATION_TODO.md](./FOOD_INSTAMART_IMPLEMENTATION_TODO.md).
