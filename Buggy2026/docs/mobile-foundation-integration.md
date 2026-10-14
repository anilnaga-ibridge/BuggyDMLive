# Mobile foundation integration database

## Verified result

On 2026-08-17, the D004/D005 migration sequence was verified against a
dedicated local MySQL 8 integration database. The database was created from a
schema-only snapshot of the local reference schema: 233 base-table definitions
and zero application rows were copied.

The following migrations applied successfully in order:

1. `2026_08_17_000001_create_customer_mobile_sessions_table.php`
2. `2026_08_17_000002_harden_customer_addresses_for_mobile.php`
3. `2026_08_17_000003_create_customer_checkout_quotes_table.php`

All three migrations also rolled back and reapplied successfully. The final
schema contains both new tables, the `customer_addresses.is_default` column,
all required indexes, and three matching migration records. The session,
quote, and address tables contain zero rows.

The synthetic integration suite then passed 6 tests and 43 assertions. It
covers ownership isolation, optimistic address versions, default-address
invariants, spatial serviceability, discounts, order-wise tax, delivery fees,
free delivery, stock changes, minimum orders, COD limits, idempotent replay,
catalog repricing, and quote expiry. Every test runs inside an outer database
transaction and leaves the integration schema empty.

## Mandatory safety guards

- Use a dedicated database whose name is explicitly marked `integration`.
- Accept only a loopback database host for local verification.
- Never copy rows from the reference database; copy definitions only.
- Pass credentials through the process environment. Do not write them to this
  repository, command output, logs, or generated configuration files.
- Set `APP_CONFIG_CACHE` to a dedicated, nonexistent integration cache path.
  The normal cached Laravel configuration can otherwise override runtime
  database variables.
- Remove `DATABASE_URL` from the migration process environment when supplying
  `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`.
  Laravel gives the connection URL precedence over the individual fields.
- Bootstrap Laravel and assert that
  `database.connections.mysql.database` exactly equals the integration target
  and `database.connections.mysql.url` is empty before allowing a write.
- Apply these three migration paths explicitly. Do not run the entire legacy
  migration collection against a clean database.

## Running the synthetic suite

Supply local integration credentials through the shell or CI secret store:

```sh
export BUGGY_INTEGRATION_DB_HOST=127.0.0.1
export BUGGY_INTEGRATION_DB_PORT=3306
export BUGGY_INTEGRATION_DB_NAME=buggy_core_integration
export BUGGY_INTEGRATION_DB_USERNAME=integration_user
export BUGGY_INTEGRATION_DB_PASSWORD='from-secret-store'
export BUGGY_PHP_BIN=/absolute/path/to/php
composer test:mobile-integration
```

The runner generates an ephemeral application key, creates a unique config
cache path, removes `DATABASE_URL`, and rejects non-loopback hosts or database
names without an `integration` marker. The PHPUnit base class independently
repeats those checks before opening its rollback-only fixture transaction.

## Legacy schema limitation

The distributable migration history is not a complete clean-room schema. A
full migration against an empty database reaches
`2022_04_09_161150_add_wallet_point_columns_to_users_table.php` before any
migration has created `users`. Integration environments must therefore start
from an approved schema-only baseline until a canonical baseline migration or
schema dump is created and tested.

## D007 native address verification

The native address checkpoint adds authenticated normalized V2 location routes and migration `2026_08_17_000004_add_landmark_to_customer_addresses_table.php`. The migration was applied, rolled back, and reapplied against `buggy_core_integration_20260817`. The guarded suite now covers provider normalization, India restriction, Telugu provider language, module-aware spatial serviceability, explicit landmark persistence, ownership, optimistic versions, and the existing quote invariants: 7 tests and 51 assertions passed.

No operational or production database was migrated.

## Remaining checkout entry gates

1. Implement atomic quote consumption and idempotent order creation.
2. Bind digital payment intents and add order-status recovery before enabling
   the final Place order action in QA.

## Quote tax side-effect correction

The integration suite showed that quote calculation called the tax engine in
order-persistence mode. Quote generation now passes `storeData=false`, keeping
tax computation read-only and guaranteeing that `order_taxes` remains empty
until an actual order transaction is created.

Production migration and deployment remain separate approved release actions.
