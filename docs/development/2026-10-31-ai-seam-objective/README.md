# AI seam objective: a war for the missing path — 2026-10-31

AI only; no rules, content or save change. Design:
[ADR 0070](../../architecture/0070-ai-seam-objective.md).

## What changed

- `packages/ai/src/arcane.ts`: `seamObjective` names, for a realm one seam
  short of the working (it holds a seam, has a Waykeeper of the required degree
  and is at peace), the nearest found seam of a lacking path that lies inside
  another, unprotected realm's borders within twenty-four hexes.
- `packages/ai/src/index.ts`: the holder's hearths within three hexes of the
  seam rank with an enemy victory host among invasion objectives; while none
  is in sight the seam draws free field armies within range; the existing
  adjacent siege rule then declares the war and lays the siege. City-states
  make no objective. The turn's reasons name the objective.
- Test: `packages/ai/src/attunement.test.ts` (objective named from remembered
  land; a field company marches on it and declares war and besieges the hearth
  beside it; protected holders, realms without a seam, realms at war and realms
  without a qualified caster make no objective).

## The unbounded experiment, recorded and not shipped

The first version named the objective for any realm holding a seam and
lacking a path. Headline pacing under it was Epic 420 and Long 327 by
Prosperity, against 369 and 300 by Attunement without it
([log](pacing-unbounded.log), [json](pacing-unbounded.json)); the Epic replay
showed Iron Covenant holding both paths with twelve hearths and never sealing
([replay](seam-holding-epic-unbounded.txt)). The wars it opened cost the Long
campaign its sealed working, so the objective was bounded to the last gap.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,319 tests / 285 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **368 / 300 / 203**, Prosperity / Attunement / Attunement; Long and Standard command counts identical to the rules 44 baseline ([log](pacing-bounded.log), [json](pacing-bounded.json)) |
| [seam-objective-probe.ts](seam-objective-probe.ts), Epic and Long headline | Epic: Sepulchral Synod names the objective on three turns from 261, declares three wars, lays two sieges, takes nothing; Long: never ([epic](seam-objective-epic.txt), [long](seam-objective-long.txt)) |
| Epic Attunement price probe, 4,800 | still Prosperity on 368; Glass Tide starts a Prosperity project on 362 instead, so the price is not what keeps it from sealing ([probe](price-probe-epic.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: attunement, arcane-seams | 3 passed in 6 s ([log](browser-covering.log)) |
| `@scale` chronicles journey, alone | 1 passed in 22 s, AI-watch victory turn unchanged ([log](browser-chronicles.log)) |

## Known limits

- The objective has no measured effect on the headline seed beyond one realm's
  three turns; it is a bounded capability, not a demonstrated road to the path.
- Why Glass Tide holds both paths on Epic yet starts a Hearth Exchange rather
  than a working (Arcane Theory, caster or host) is not diagnosed here.
- Three-seed coverage per pace remains unmeasured under rules 44.
