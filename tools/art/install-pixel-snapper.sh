#!/usr/bin/env bash
set -euo pipefail
ART_SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ART_TOOL_ROOT="$ART_SCRIPT_DIR/.local"
mkdir -p "$ART_TOOL_ROOT"
if command -v cargo >/dev/null 2>&1; then
  ART_CARGO_BIN="$(command -v cargo)"
else
  export CARGO_HOME="$ART_TOOL_ROOT/cargo"
  export RUSTUP_HOME="$ART_TOOL_ROOT/rustup"
  ART_CARGO_BIN="$CARGO_HOME/bin/cargo"
  if [[ ! -x "$ART_CARGO_BIN" ]]; then
    [[ "$(uname -s)" == Linux && "$(uname -m)" == x86_64 ]] || { echo 'Install Rust for this platform, then rerun this script.' >&2; exit 1; }
    curl --proto '=https' --tlsv1.2 --fail --location --max-time 120 \
      https://static.rust-lang.org/rustup/dist/x86_64-unknown-linux-gnu/rustup-init \
      --output "$ART_TOOL_ROOT/rustup-init"
    chmod +x "$ART_TOOL_ROOT/rustup-init"
    "$ART_TOOL_ROOT/rustup-init" -y --no-modify-path --profile minimal --default-toolchain 1.88.0
  fi
fi
"$ART_CARGO_BIN" install spritefusion-pixel-snapper --version 1.0.0 --locked --root "$ART_TOOL_ROOT" --jobs 2
"$ART_TOOL_ROOT/bin/spritefusion-pixel-snapper" --version
