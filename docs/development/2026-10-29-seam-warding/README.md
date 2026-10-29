# Seam warding: the first strategic rite — 2026-10-29

Rules/save **40**. Local checkpoint; nothing in this packet is published.
Design: [ADR 0062](../../architecture/0062-seam-warding.md).

## What was built

- `packages/content`: `STRATEGIC_RITES` with `rite.seam_warding` (discovery
  `arcane.rune_binding`, Rune path, six ashglass, ten turns, `sinceRules: 40`),
  its schema, validation, localization and a fifth content-seal component;
  `contentPackHash(…, rites = false)` reproduces the rules 38–39 seal
  **03ac0328**, which `PRE_RITE_CONTENT_HASH` names.
- `packages/sim/src/rites.ts`: `performRite { factionId, characterId, riteId }`,
  the ward state (one per hearth, ordered by hearth), `advanceWards` with its
  five dissolve reasons and `ward_ended` events, the `rites` and `wards`
  observations with exact blockers, `isWarded`, validation on load and the
  historical refusal `assertNoWards`. Siege works hold the defenses of a warded
  hearth and the besieger’s siege observation carries `warded`; sabotage against
  a warded hearth does no damage. Save version 40, `wards: []` on every
  migration, projection strips wards below 40 and refuses a standing ward.
- `packages/ai`: `planRites` wards a besieged hearth from the first performable
  quoted rite; `planConquestDecision` lifts a warded siege the army cannot storm
  (strength below three times the defenders).
- `apps/web`: `StrategicRites` on the character sheet (rite, cost, term, host,
  exact blocker, standing wards) and the warded mark in `SiegeStrength` plus a
  note on the besieger’s own siege card.
- `scripts/measure-pacing.ts` accepts `--rules=40`.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm vitest run --project unit` | **2,298 tests / 284 files pass** ([log](tests-unit.log)); the first run failed seven tests because two hand-built older envelopes (`save.test.ts`, `features-in-sight.test.ts`) still carried the new `wards` field and the rules 40 content seal, which the tests now strip and name |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline headline-standard headline-long` | **362 / 327 / 227**, all Prosperity, 0 refused, 0 automatic refusals, command and event counts identical to the seam-study packet, no `performRite` in organic play ([log](pacing-after.log), [json](pacing-after.json)) |
| same with `--rules=39` | **362 / 327 / 227**; seals `1b1c1e33` / `8cdc8f02` / `446f7221` equal the seam-study packet ([log](pacing-rules39.log), [json](pacing-rules39.json)) |
| `pnpm build` | pass ([log](build.log)) |
| complete gameplay suite | **stopped, 39 of 39 cases passing** when Claude Code halted the background run because the machine was critically low on memory ([log](gameplay-full.log)); it was not restarted |
| production suite on the fresh bundle | **49 of 59 distinct cases have a passing result**: 47 on the first run ([log](production.log)), 32 on a full rerun ([log](production-rerun.log)); the ten cases that never passed all failed by browser crash and failed again, within two seconds each, when run alone ([log](production-rerun2.log)): `group-worker-policies:24`, `land-policy-templates:41`, `patrol-recovery:8`, `patrol-retirement:16`, `posting-targets:34`, `posting-targets:89`, `posting-templates:32`, `production-sequences:52`, `project-counterplay:51` (four cases), `selection-groups:33`. None touches rites, sieges or characters; they are **unverified on this desktop**, not known defects |
| `tests/gameplay/seam-warding.spec.ts` | passes ([rerun log](browser-rerun.log), screenshots `rite-offered.png`, `rite-performed.png`, `warded-ledger.png` under [browser-rerun-results](browser-rerun-results/)) |
| affected journeys (attunement, characters, conquest, subject rule) | 13 distinct cases all have passing results: 7 of 13 on the first run ([log](browser-affected.log)), 4 of 6 on the first rerun ([log](browser-rerun.log)), the last 2 alone ([log](browser-rerun2.log)); every failure was the campaign worker failing to start, see below |

New tests: `packages/sim/src/rites.test.ts` (offer, cost, held walls through a
siege, expiry, dissolve when the caster rides out, every refusal, rules 39
projection, hashing and command refusal, v39 envelope migration),
`packages/ai/src/rites.test.ts` (ward when besieged, lift a warded siege),
`apps/web/src/magic.test.tsx` (rite with blocker, standing ward, warded ledger),
`tests/gameplay/seam-warding.spec.ts`.

## Limits and caveats

- **Browser runs on this desktop.** The user’s desktop and another session’s
  Playwright suite left about three gigabytes available during this checkpoint;
  the headless browser then died with `SIGTRAP` (three core dumps recorded by
  `coredumpctl` early on; sixty-two `SIGTRAP` renderer dumps by the end of the
  production runs, trapped in the unsymbolised headless shell with the NVIDIA
  driver unchanged) or refused the simulation worker’s module requests with
  `ERR_INSUFFICIENT_RESOURCES`, which the page reports as “The campaign worker
  stopped”. These failures appeared on save import in every journey, including
  ones unchanged for weeks, and every one of them passed on a rerun. The
  [first log](browser-seam-warding.log) of this journey, taken before the
  rerun, shows the same failure. No timeout or assertion was changed; the journey
  waits for network idle before importing, which the dev server’s unbundled
  worker needs on a cold start.
- A ward with no turns remaining lapses at the end of that turn before the works
  run, so ten turns of works are held exactly; the ledger reads “0 turns
  remaining” during the last turn.
- One rite of one path exists. No headline realm performs it: no AI realm holds
  `arcane.rune_binding` with a Rune Waykeeper lodged at a besieged seam hearth.
  Counter-rituals, Flame rites and the AI positioning a caster in advance are
  open.
- Playwright trace archives and the raw trace material (screenshots, network
  and action logs) that the stopped gameplay run left unzipped were removed from
  the retained browser results in a follow-up commit; logs, error contexts,
  evidence JSON and named screenshots are kept. The first commit of this slice
  (`e103a72`) carries that material in history.
- The roadmap catalogue describes the delivery but links no evidence from this
  packet, because the catalogue pins evidence to a committed revision.
