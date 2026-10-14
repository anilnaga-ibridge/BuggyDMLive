#!/usr/bin/env sh
set -eu

BUGGY_LOCAL_HOST=${BUGGY_LOCAL_HOST:-127.0.0.1}
BUGGY_LOCAL_PORT=${BUGGY_LOCAL_PORT:-8000}

if [ -n "${BUGGY_PHP_BIN:-}" ] && [ -x "$BUGGY_PHP_BIN" ]; then
    BUGGY_LOCAL_PHP=$BUGGY_PHP_BIN
elif [ -x /Applications/MAMP/bin/php/php8.3.30/bin/php ]; then
    BUGGY_LOCAL_PHP=/Applications/MAMP/bin/php/php8.3.30/bin/php
elif command -v php >/dev/null 2>&1; then
    BUGGY_LOCAL_PHP=$(command -v php)
else
    echo "PHP is unavailable. Set BUGGY_PHP_BIN to an executable PHP binary." >&2
    exit 127
fi

cd "$(dirname "$0")/.."

# This application intentionally emits /public/assets URLs. Serving through
# server.php from the repository root preserves those URLs in local builds.
export PHP_CLI_SERVER_WORKERS=${PHP_CLI_SERVER_WORKERS:-8}
exec "$BUGGY_LOCAL_PHP" -S "$BUGGY_LOCAL_HOST:$BUGGY_LOCAL_PORT" server.php
