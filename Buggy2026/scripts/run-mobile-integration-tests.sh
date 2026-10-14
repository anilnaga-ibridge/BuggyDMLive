#!/usr/bin/env bash

set -euo pipefail

integration_host="${BUGGY_INTEGRATION_DB_HOST:-}"
integration_port="${BUGGY_INTEGRATION_DB_PORT:-3306}"
integration_database="${BUGGY_INTEGRATION_DB_NAME:-}"
integration_username="${BUGGY_INTEGRATION_DB_USERNAME:-}"
integration_password="${BUGGY_INTEGRATION_DB_PASSWORD:-}"
integration_php_bin="${BUGGY_PHP_BIN:-}"

if [[ -z "${integration_host}" || -z "${integration_database}" || -z "${integration_username}" ]]; then
    echo "BUGGY_INTEGRATION_DB_HOST, BUGGY_INTEGRATION_DB_NAME, and BUGGY_INTEGRATION_DB_USERNAME are required." >&2
    exit 2
fi

case "${integration_host}" in
    127.0.0.1|localhost|::1) ;;
    *)
        echo "Refusing non-local integration database host." >&2
        exit 2
        ;;
esac

case "${integration_database}" in
    *integration*|*Integration*|*INTEGRATION*) ;;
    *)
        echo "Refusing database without an integration marker in its name." >&2
        exit 2
        ;;
esac

if [[ -z "${integration_php_bin}" ]]; then
    if command -v php >/dev/null 2>&1; then
        integration_php_bin="$(command -v php)"
    elif [[ -x /Applications/MAMP/bin/php/php8.3.30/bin/php ]]; then
        integration_php_bin="/Applications/MAMP/bin/php/php8.3.30/bin/php"
    else
        echo "Set BUGGY_PHP_BIN to a PHP 8.2-8.4 executable." >&2
        exit 2
    fi
fi

if [[ ! -x "${integration_php_bin}" ]]; then
    echo "BUGGY_PHP_BIN is not executable." >&2
    exit 2
fi

integration_cache_dir="$(mktemp -d "${TMPDIR:-/tmp}/buggy-mobile-integration.XXXXXX")"
trap 'rmdir "${integration_cache_dir}" 2>/dev/null || true' EXIT

export RUN_MOBILE_INTEGRATION=1
export APP_ENV=testing
export APP_DEBUG=false
export APP_KEY="base64:$("${integration_php_bin}" -r 'echo base64_encode(random_bytes(32));')"
export APP_CONFIG_CACHE="${integration_cache_dir}/config.php"
export DB_CONNECTION=mysql
export DB_HOST="${integration_host}"
export DB_PORT="${integration_port}"
export DB_DATABASE="${integration_database}"
export DB_USERNAME="${integration_username}"
export DB_PASSWORD="${integration_password}"
export CACHE_STORE=array
export CACHE_DRIVER=array
export SESSION_DRIVER=array
export QUEUE_CONNECTION=sync
export MAIL_MAILER=array
export BROADCAST_CONNECTION=log
unset DATABASE_URL

"${integration_php_bin}" artisan test --testsuite=Integration
