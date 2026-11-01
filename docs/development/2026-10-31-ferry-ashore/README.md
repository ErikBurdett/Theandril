# A held ferry puts its passengers ashore — 2026-10-31

AI only; no rules, content or save change. Design:
[ADR 0092](../../architecture/0092-ferry-ashore.md).

## What changed

- `packages/ai/src/naval.ts`: a ferry carrying a founder in a proved-enclosed
  basin with no viable shore, after the landing route and the charting both
  fail, puts its passengers ashore on the best beach of the basin they may
  land on, with the reason named; the hold for an uncharted sea is
  unchanged.
- `packages/ai/src/enclosed-sea.test.ts`: a second scenario on seed 74 (the
  caravan is ashore within six turns of embarking, for the stated reason,
  and no longer carried); the crossing scenario moves to seed 83 with its
  reason in the comment, every assertion kept.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,355 tests / 296 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **395 / 302 / 203**, identical to rules 61 ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 338 / 338, Long 268 / 287, Standard 185 / 199, identical ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 307, chronicle Epic 431, Long 302, Standard 181, identical ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| [ashore-probe.ts](ashore-probe.ts), Epic headline | no passenger put ashore this way and no ferry held; 33 landings on unoccupied shores ([txt](ashore-probe-epic.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 54 unmoved ([log](browser-chronicles.log)) |

## Known limits

- A basin whose shores open later is not waited for; the caravan founds by
  land. The fallback never fires on the headline campaigns, which have no
  such basin; it is proved on the tiny map that exposed it.
