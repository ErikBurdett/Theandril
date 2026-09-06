#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${ASEPRITE_BIN:-}" && -x "${ASEPRITE_BIN}" ]]; then
  printf '%s\n' "${ASEPRITE_BIN}"
  exit 0
fi

candidates=(
  "$HOME/.local/share/Steam/steamapps/common/Aseprite/aseprite"
  "$HOME/.local/share/Steam/steamapps/common/Aseprite/Aseprite"
  "$HOME/.steam/steam/steamapps/common/Aseprite/aseprite"
  "$HOME/.steam/steam/steamapps/common/Aseprite/Aseprite"
)

for candidate in "${candidates[@]}"; do
  if [[ -x "$candidate" ]]; then
    printf '%s\n' "$candidate"
    exit 0
  fi
done

for steam_root in \
  "$HOME/.local/share/Steam" \
  "$HOME/.steam/steam"; do
  vdf="$steam_root/steamapps/libraryfolders.vdf"
  [[ -f "$vdf" ]] || continue

  while IFS= read -r path; do
    for candidate in \
      "$path/steamapps/common/Aseprite/aseprite" \
      "$path/steamapps/common/Aseprite/Aseprite"; do
      if [[ -x "$candidate" ]]; then
        printf '%s\n' "$candidate"
        exit 0
      fi
    done
  done < <(
    sed -n 's/.*"path"[[:space:]]*"\([^"]*\)".*/\1/p' "$vdf" \
      | sed 's/\\\\/\//g'
  )
done

if command -v aseprite >/dev/null 2>&1; then
  command -v aseprite
  exit 0
fi

echo "Aseprite was not found automatically." >&2
echo "It is expected to already be installed via Steam on this Omarchy system." >&2
echo "Set ASEPRITE_BIN to the executable path if Steam uses an unusual library location." >&2
exit 1
