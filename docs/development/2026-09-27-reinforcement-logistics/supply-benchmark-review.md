# Supply benchmark: strict source-loss boundary

27 September 2026. This is the benchmark author's correction/verification record, not an independent performance review. Only `scripts/benchmark-supply-access.ts` changed; no production simulation, AI, UI, save validator or content changed.

The [first complete-run attempt](supply-benchmark-source-loss-initial.log) stopped in the Huge ownership-loss sample at strict save validation: `hostile army occupies settlement`. The synthetic mature fixture keeps its original owner's guards on the hearth. Changing only the hearth owner produced an invalid ownership boundary with those foreign guards still occupying it. The failure is a fixture defect, not accepted timing or a reason to weaken the loader.

The corrected source-loss setup explicitly relocates all original idle garrison members together to the lowest-numbered empty, passable neighboring non-hearth cell. It checks that each belongs to the previous owner and has neither travel nor a carrier; no army is removed, converted, damaged or given a new order. The successor remains a separate realm, and the original source becomes ineligible. Exact displaced IDs, previous/new owners and source/destination cells are recorded in each result's `sourceLossSetup` field. Rebasing authored land/sight and displacement happen outside timing. Generated terrain, biome, depth, fertility, hydrology and resource deposits are hash-checked unchanged.

This remains an explicitly authored ownership-loss phase, not a played capture, retreat command, casualty or battle acceptance test. The ordinary war-command timing, actual loss of witness supply and forecast, strict post-invalidation save roundtrip, ordinary five-End-turn expiry continuation and archive replay assertions remain intact.

Scoped ESLint and diff whitespace checks pass. The root reserved a quiet CPU window for the full correction run:

```sh
node --import tsx scripts/benchmark-supply-access.ts --output=docs/development/2026-09-27-reinforcement-logistics/supply-benchmark-final.json > docs/development/2026-09-27-reinforcement-logistics/supply-benchmark-final-corrected.log 2>&1
```

## Corrected full result

The command completed with exit zero. [Final JSON](supply-benchmark-final.json), SHA-256 `fa6871923ac1ff02f1a1dfe031629849cbcbe7366c2fe71af75f96bd1960ed14`, and [complete corrected log](supply-benchmark-final-corrected.log) retain the result. It is neither smoke nor AI-only: rules 34/content `015468d1`, one discarded warmup and three identical-save samples per phase on both maps. All twelve recorded source fingerprints still match after the run. Scoped ESLint and diff checks also passed.

Huge has 196,608 cells, 32 realms and 1,508 armies after eight authored witnesses; Legendary has 307,200 cells, 40 realms and 4,008 armies. Each measures one buyer's eight real accepted imports, costing 80 coin in total. All eight witnesses are unsupplied before and actually supplied after the contracts. Actual coverage grows from 61 to 549 cells, while the permitted forecast grows to 213; the measurements preserve that distinction. Seven/five naturally coastal source harbors are authored respectively.

The corrected loss boundary relocates 47 Huge guards from hex 45,591 to 45,079 and 100 Legendary guards from hex 55,968 to 55,328. Every guard keeps its faction and formations. Both post-loss strict saves pass; the lost source disappears from actual/forecast reach and its witness stops receiving supply. Ordinary war likewise leaves seven contracts, and the isolated expiry phase leaves zero. Five actual End turns independently expire the agreements and match the saved mirror/full archive replay: final hashes `5b18fdf1` (Huge) and `a5dffa90` (Legendary). The war replay hashes are `616bc9fd` and `f2f8b24a`.

Median milliseconds below are separate phases, not additive end-to-end latency. Full samples/ranges remain in the JSON.

| Phase | Huge, no contracts | Huge, eight contracts | Legendary, no contracts | Legendary, eight contracts |
| --- | ---: | ---: | ---: | ---: |
| Actual supply graph | 0.137 | 0.837 | 0.231 | 0.605 |
| Permitted contract forecast | 0.017 | 0.385 | 0.020 | 0.281 |
| Complete own observation | 9.829 | 12.196 | 27.222 | 26.999 |

The small negative difference between the two Legendary observation medians is sample variability, not an established contract speedup. Own observation payloads grow from 617,174 to 623,834 bytes on Huge and 1,256,745 to 1,263,528 on Legendary; these are JSON byte counts, not browser structured-clone or frame-time measurements.

The same pre-contract fixtures' useful-source AI planner medians are 0.208/0.200 ms (Huge/Legendary), and nearer-own-line veto medians 0.259/0.294 ms. Each useful case produces one ordinary request, gets an ordinary AI acceptance, pays 20 coin once, feeds the witness and exactly replays/loads. Each veto produces no proposal while preserving a verified one-step own-supply route. Actual planner query counts remain uninstrumented; the report states the configured maximum rather than inventing measured counts.

Setup, strict loading, hashing, comparisons, serialization and replay are outside the timed phases. War timing includes the real command; ownership-loss and isolated expiry measure cleanup at the disclosed prepared boundaries. No 64-buyer saturation, organic supply adoption, browser rendering, tail-confidence bound or release acceptance is implied. This is author verification; the root owns independent final measurement/publication review.
