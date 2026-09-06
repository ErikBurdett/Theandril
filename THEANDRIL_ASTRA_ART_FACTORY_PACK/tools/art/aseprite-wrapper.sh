#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ASEPRITE_BIN="$("$SCRIPT_DIR/find-aseprite.sh")"

exec "$ASEPRITE_BIN" "$@"
