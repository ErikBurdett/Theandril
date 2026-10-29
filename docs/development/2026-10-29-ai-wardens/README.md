# AI wardens: reaching hearth rites in organic play — 2026-10-29

AI only; no rule, save field or content seal changes. Local checkpoint;
nothing in this packet is published. Design: [ADR 0065](../../architecture/0065-ai-wardens.md).

## What was built

- `packages/ai/src/wardens.ts`: `planRiteResearch` (buy the discovery of a
  hearth rite whose seam the realm holds and whose path a living Waykeeper
  carries), `wardensWanted` and `wardenHearths` (a Waykeeper lodged at a seam
  hearth while at war), and `planWardenReturn` (an enemy land company within
  four hexes of a seam hearth with a known rite and no lodged qualified caster
  calls the nearest riding qualified caster's company home through a quoted
  movement preview, and lodges the caster at the gate; blockaded and warded
  hearths are skipped).
- `packages/ai/src/progression.ts` buys the rite discovery after the castable
  and completing choices; `characters.ts` wants, appoints and keeps the warden,
  yielding to a battle stack that could carry a caster and to the attunement
  study post; `index.ts` merges the warden road into the turn's held armies and
  commands beside the attunement caster's road.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm vitest run --project unit` | **2,305 tests / 285 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline headline-standard headline-long` | **362 / 327 / 227**, all Prosperity, 0 refused, 0 automatic refusals; the Epic headline now buys three Arcane Theory discoveries (none before) with six fewer queued movements, Standard and Long are unchanged in every command count, and no realm performs a rite ([log](pacing-after.log), [json](pacing-after.json)) |
| `pnpm build` | pass ([log](build.log)) |
| complete gameplay suite | **250 of 251 pass** in 27.7 minutes ([log](gameplay-full.log)); the one failure, `tile-footprints.spec.ts:44`, timed out on its save import and **passes alone** with its sibling ([rerun](browser-rerun.log)); the all-pass results directory was not retained |
| production suite on the fresh bundle | **59 of 59 pass** ([log](production.log)); exported save files and trace material were not retained |

New tests: `packages/ai/src/wardens.test.ts` (rite research gated on seam and
caster, the warden appointment at the seam hearth and its lodging kept, the
return on threat, the lodging at the gate and the refusal once a blockade
closes it). The first unit and campaign runs of this checkpoint found two real
defects, fixed before the recorded runs: the warden appointment swallowed
ordinary Waykeeper appointments at non-seam hearths and outranked a battle
stack's caster (`packages/ai/src/magic.test.ts`), and a warden road was ordered
without a movement preview and refused on the Epic proxy (`pacing-epic`).

## Limits and caveats

- No headline realm performs a rite yet: the Epic campaign now researches the
  discoveries, but no realm there is besieged at a seam hearth with a lodged
  caster and ashglass in store at the same time; the AI keeps no ashglass stock
  for rites and does not pre-position a caster for a Rune breaking.
- Wardens are called only at war and only for hearths that hold a seam.
- The roadmap catalogue describes the delivery but links no evidence from this
  packet, because the catalogue pins evidence to a committed revision.
