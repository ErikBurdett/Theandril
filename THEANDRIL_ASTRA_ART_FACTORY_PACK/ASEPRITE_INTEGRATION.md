# Aseprite Integration — Omarchy / Steam

## Known environment fact

Aseprite is already installed through Steam on the user's Omarchy Linux machine.

Do not reinstall it automatically.

## Discovery order

1. `ASEPRITE_BIN` environment variable.
2. `$HOME/.local/share/Steam/steamapps/common/Aseprite/`
3. `$HOME/.steam/steam/steamapps/common/Aseprite/`
4. Steam library folders from `libraryfolders.vdf`.
5. `command -v aseprite`.

Do not assume executable name without inspecting the directory.

## Stable adapter

Create:

```text
tools/art/aseprite-wrapper.sh
```

or typed equivalent.

The wrapper should:
- resolve binary;
- print clear error when absent;
- accept safe CLI args;
- support `--version`;
- avoid committing user-specific paths.

## Environment override

Support:

```bash
export ASEPRITE_BIN="/actual/path/to/aseprite"
```

but do not require it when discovery succeeds.

## Production uses

Use Aseprite CLI for:
- sprite-sheet export;
- JSON metadata export;
- frame/tag selection;
- palette/indexed workflows;
- pixel-safe batch conversions;
- tileset source/export tasks where useful.

## Do not use GUI automation

Routine production must be headless/scriptable.

## Source control

Do not commit:
- Steam binaries;
- Aseprite proprietary application files;
- user Steam folders.

Commit only wrappers, scripts, profiles, and generated project assets.
