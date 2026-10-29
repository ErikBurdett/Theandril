# Seam study — 2026-10-29

Rules/save **39**. Local checkpoint; nothing in this packet is published.
Design: [ADR 0061](../../architecture/0061-seam-study.md).

## What was built

- `packages/sim/src/characters.ts`: `SEAM_STUDY_EXPERIENCE`; a lodged, unwounded,
  mission-free Waykeeper in a hearth whose borders hold a surveyed seam gains one
  experience in the character phase (rules 39).
- `packages/ai/src/characters.ts`: at peace, a realm holding a seam of every path
  with a hearth able to host a working appoints a Waykeeper there and declines to
  attach a lodged studying caster to a co-located battle army.
- `apps/web/src/magic.tsx`: the personal-magic panel states the study rule.
- `apps/web/src/land-text.ts`: the pure yield-text helper moved out of the
  stylesheet-importing hearth panel so `faction-roster.spec.ts` loads under Node.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([lint log](lint.log)) |
| `pnpm test:unit` | 2,292 tests / 281 files pass ([log](tests-unit.log)) |
| `pnpm measure:pacing headline headline-standard headline-long` | **362 / 327 / 227**, 0 refused, command and event counts identical to the ground-in-sight runs: no headline realm holds a seam of every path, so no peacetime appointment or study occurred ([log](pacing-after.log), [json](pacing-after.json)) |
| `pnpm test:gameplay` (complete) | see [../2026-10-29-full-gameplay/gameplay.log](../2026-10-29-full-gameplay/gameplay.log) |

New tests: the seam-study case in `packages/sim/src/attunement.test.ts` and the
peacetime appointment case in `packages/ai/src/attunement.test.ts`.
