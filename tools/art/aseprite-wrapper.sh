#!/usr/bin/env bash
set -euo pipefail
ART_SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ART_ASEPRITE_BIN="$(bash "$ART_SCRIPT_DIR/find-aseprite.sh")"
exec "$ART_ASEPRITE_BIN" "$@"
