# Durable client settings — 2026-11-01

Design: [ADR 0106](../../architecture/0106-durable-settings.md).

## What changed

- `apps/web/src/settings.ts`: the settings record, its storage key, a
  validating loader with a reason on failure and a saver that reports a
  refusing store. `main.tsx`: the text scale and the new Reduce motion
  checkbox read from and write to it; the application carries
  `data-reduce-motion` when chosen; the menu shows the storage error when
  there is one. `style.css`: the attribute turns off animations and
  transitions.
- Tests: `apps/web/src/settings.test.ts` (round trip, defaults, every
  invalid shape, a throwing reader and a refusing writer),
  `tests/gameplay/durable-settings.spec.ts` (both choices survive a reload,
  the attribute and the CSS variable follow, an unreadable store reports
  itself and the defaults stand).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,378 tests / 309 files pass** ([log](tests-unit.log)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: durable settings (new), campaign menu | 4 passed in 13 s (the narrow-touch menu journey now counts twelve settled controls with the Reduce motion checkbox, each still a 44-pixel target) ([log](browser-covering.log); screenshots under `browser-results/`) |
| pacing, campaigns, chronicles | not run: no rules, AI, content or save change, per [`docs/TESTING.md`](../../TESTING.md) |

## What the tests found first

The narrow-touch campaign-menu journey counts the settled tap targets of
the menu; the Reduce motion checkbox makes twelve where eleven were
counted, and it meets the 44-pixel target like the rest, so the count moved
with a note.

## Known limits

- Two settings are durable; fog colours, non-colour cues and keyboard
  workflows beyond the shortcuts remain session-only or unbuilt.
