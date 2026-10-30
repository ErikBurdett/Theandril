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
| `pnpm vitest run --project unit` | **2,306 tests / 285 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline headline-standard headline-long` | **385 / 343 / 229**, all Prosperity, 0 refused, 0 automatic refusals; before the fallback (wardens never appointed at war) the same build measured 362/327/227 with only the Epic campaign buying three discoveries. With the fallback the three paces appoint 62/62/57 characters (60/58/49 before), buy 9/9/6 Arcane Theory discoveries and perform no rite; Epic stays inside its 350–400 band, Standard near its 200 target, and Long moves from 327 to 343 against a target of about 300 ([log](pacing-after.log), [json](pacing-after.json)) |
| `pnpm build` | pass ([log](build.log)) |
| complete gameplay suite | first build: 250 of 251 with `tile-footprints.spec.ts:44` timing out on import and passing alone; follow-up build: **249 of 251** in 27.2 minutes ([log](gameplay-full.log)) with the two `charter-templates.spec.ts` cases timing out and **passing alone, 4 of 4** ([rerun](browser-rerun.log)); all-pass results directories were not retained |
| production suite on the fresh bundle | **59 of 59 pass** on both builds ([log](production.log)); exported save files and trace material were not retained |

New tests: `packages/ai/src/wardens.test.ts` (rite research gated on seam and
caster, the warden appointment at the seam hearth and its lodging kept, the
return on threat, the lodging at the gate and the refusal once a blockade
closes it). The first unit and campaign runs of this checkpoint found two real
defects, fixed before the recorded runs: the warden appointment swallowed
ordinary Waykeeper appointments at non-seam hearths and outranked a battle
stack's caster (`packages/ai/src/magic.test.ts`), and a warden road was ordered
without a movement preview and refused on the Epic proxy (`pacing-epic`).

## The readiness funnel

A diagnostic run of the three headline campaigns (not retained as a script)
counted, per realm-turn: before the fallback, Epic held seams for 508
realm-turns, at war 309, with a rite discovery known 60, a caster lodged at a
seam hearth 60, a rite performable 60 (one realm from turn 302), and seam
hearths besieged 10, never with the rite known. After the fallback: a caster
lodged at a seam hearth 520 / 416 / 256 realm-turns (Epic / Long / Standard),
a rite performable 512 / 412 / 253, Waykeepers appointed 3 / 3 / 2, Arcane
Theory bought 9 / 9 / 6, seam hearths besieged 3 / 3 / 0, and no rite
performed. Threat-gated appointment at eight and fourteen hexes appointed
nobody on any pace.

## Limits and caveats

- No headline realm performs a rite yet: realms are now ready for hundreds of
  realm-turns, but their seam hearths are besieged on only a few, never while
  ready. The AI does not pre-position a caster for a Rune breaking.
- The appointed wardens and their Arcane Theory move the headline campaigns:
  Epic 362 → 385, Long 327 → 343, Standard 227 → 229, all Prosperity with zero
  refusals. Epic stays in its band and Standard near target; Long drifts further
  from its 300 target. This is the price of readiness rather than a re-pricing;
  it was measured, not tuned, and the gating alternatives that avoid it also
  avoid the readiness.
- Wardens are called only at war and only for hearths that hold a seam.
- The roadmap catalogue describes the delivery but links no evidence from this
  packet, because the catalogue pins evidence to a committed revision.
