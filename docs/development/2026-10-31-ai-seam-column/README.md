# AI seam column: a standing war carried to the seam — 2026-10-31

AI only; no rules, content or save change. Design:
[ADR 0072](../../architecture/0072-ai-seam-column.md).

## Diagnosis

[seam-hearth-loss-probe.ts](seam-hearth-loss-probe.ts) replays a headline
campaign and reports every change of hands of a hearth whose borders hold a
seam, then follows the loser every ten turns: holder, war, garrison, siege,
nearest own company and field strength.
[Before](seam-hearth-loss-epic-before.txt), Epic headline (seed 20260905,
twelve realms): Glass Tide loses its Rune seam hearth to Sable Steppe on turn
160 and never holds it again; the hearth stands with no garrison from turn
170, Glass Tide is at war with Sable Steppe on seven of the twenty-one
readings, and its nearest company stands one or two hexes away from turn 230.
[siege-648-probe.ts](siege-648-probe.ts) follows that hearth turn by turn from
250 ([before](siege-648-epic-before.txt)): the hearth is kept under a seam
warding recast every ten turns; Glass Tide lays siege twelve times with one
company of thirty to sixty strength, lifts it the next turn as hopeless before
warded walls, and makes peace with the holder on 267, 286, 304 and 325 after
eight turns of war each time. No assault is ever made.

## What changed

- `packages/ai/src/arcane.ts`: `seamObjective` no longer requires peace: at
  war it names only a holder the realm already fights (`atWar`), so the
  objective never opens a second front but a standing war is carried to the
  seam. `seamRally` (the siege lines, else the strongest field company within
  `SEAM_RALLY_REACH` = 3 of the seam, else the seam) and `seamPursued` (a
  company within reach or the realm's siege of the hearth).
- `packages/ai/src/index.ts`: one objective for the whole turn, computed once
  and passed to diplomacy and the siege planner; companies within range march
  on the rally and share its hex (a separate claim set) at the invasion
  approach weight; the company at the rally closes on the hearth in sight or
  holds; the hearth holding the seam is besieged only by the strongest own
  company beside it.
- `packages/ai/src/conquest.ts`: the siege of the hearth holding the seam is
  kept under a warding and handed, by lifting it, to a company beside the
  hearth that can storm the walls when the besieger cannot.
- `packages/ai/src/diplomacy.ts`: while the seam is pursued, no peace is
  offered to the holder and its offers are refused, with the reason.
- Test: `packages/ai/src/attunement.test.ts` (objective at war with the holder
  and not with others only; the vanguard declares and besieges; a second
  company marches on the vanguard's hex; the holder's offer is refused and no
  peace is sought while the siege stands, and the same offer is accepted once
  nothing pursues the seam; a warded siege of the seam hearth is kept where the
  old rule lifts it; a column of three guards on the vanguard's hex takes the
  siege over, the vanguard is concentrated into it, and the column lays the
  siege).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,321 tests / 285 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **379 / 300 / 203**, Prosperity / Attunement / Attunement, 0 refusals; Long and Standard unchanged ([log](pacing-after.log), [json](pacing-after.json)) |
| seam-hearth replay, Epic headline, after | Glass Tide retakes its Rune seam hearth on turn 246 (captured from Sable Steppe, at war) and holds it from 250 to 373, when Iron Covenant takes it ([after](seam-hearth-loss-epic-after.txt)) |
| seam hearth turn by turn, after | [siege-648-epic-after.txt](siege-648-epic-after.txt) |
| late standing, turns 250–370 | the price is met and the working sealed on about turn 353 (knowledge 9,484 on 350, the project active on 360); Saltwind's Prosperity completes first on 379 ([trace](late-standing-epic-after.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: attunement, arcane-seams, seam-warding | 6 passed in 15 s ([log](browser-covering.log)) |
| `@scale` chronicles journey, alone | 1 passed in 23 s ([log](browser-chronicles.log)) |

## Known limits

- The Epic headline now ends in a race the working loses by a few turns; the
  Epic Attunement price (9,600) remains scaled rather than measured against a
  sealed working, and whether to re-price is a deliberate pacing decision not
  taken here.
- The retaken hearth is lost again on 373 while the working runs. Defending a
  seam hearth (home watch, garrison) is not an AI concern yet.
- The column is bounded by the existing concentration rule (six formations
  without a commander); a hearth whose quoted walls need more is besieged
  and never stormed.
- Three-seed coverage per pace remains unmeasured under rules 44.
