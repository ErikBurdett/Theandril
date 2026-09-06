# Slice 7 — contact, mixed armies and saved campaigns

Measured 2026-09-05, Node 26.7.0, Intel i9-13900K, Linux, game 0.1.0, save 6, content `96918834`, generator 2. These are development-machine results, not mainstream-device release claims. The final headless scale repeat ran with browser tests and other heavy checks stopped. No generation, asset pixels, hidden AI income or minimum-victory-turn gate was added to obtain results.

## Recorded campaign diagnosis

The supplied 311-second recording showed Standard (384×256), seed 748291, Long pace and four seats. The previous implementation reproduced its turn-551 Prosperity victory exactly, with **zero contact by every faction**, zero wars/battles, 19,007 commands and final hash `50092025`. A turn-26 save mirror replayed 18,770 commands identically.

All six start pairs are land-connected. Nearest rivals are 130–137 hexes / 144–173 terrain cost apart; direct travel at five movement points gives an optimistic 29–35-turn lower bound, not an exploration forecast. The old AI's neighbor exploration score was zero in 330,606 samples because it inspected tiles inside existing sight. Scouts' maximum displacement after 550 rounds was 18/30/25/32 hexes; towns stayed within six hexes of starts. One-step proposals left 52,094 of 77,660 movement points unused (67.1%). Density alone with 24 seats improved contact but did not cure wandering (Ashen first contact 188).

New AI scores actual destination sight, proves multi-step travel on currently visible ground, and uses bounded frontier search across remembered land. Current-sight path proofs matter: the initial denser implementation exposed 17 stale proposals when another friendly scout revealed blockers; the revised regressions require zero rejections. Colonist space and destination reservations also apply within each batch. Movement costs/stats are not multiplied by map size; seats and sensible use of existing capabilities address the demonstrated fault.

| Seed 748291 / Long | Rounds | Ashen first contact | Every faction has ≥1 contact by | First war / battle | Commands / merges / battles / captures | Final hash |
|---|---:|---:|---:|---:|---:|---|
| Standard / 4 |160|80|80|42|6,265 /27 /57 /1|`829092b1`|
| Standard / 24 |160|30|41|23|24,906 /299 /871 /85|`6c7662b4`|
| Huge / 32 |100|28|52|26|20,290 /242 /458 /32|`4f383e0b`|

All three cases have zero rejections, valid final snapshots and exact turn-26 mirrors (6,047/23,720/18,722 commands). Total run times 3.515/12.140/8.561 s include generation, geometry auditing and mirrored verification, not browser rendering/archives. Final containers/formations/towns are 59/84/26, 329/585/174 and 422/644/195 respectively. Reproduce with `node --import tsx scripts/benchmark-contact.ts --size=standard --factions=4,24 --turns=160` and `--size=huge --factions=32 --turns=100`. Geometry metrics are explicitly omniscient audits and never AI inputs. Contacts are sampled at faction decision boundaries and round ends, so they do not claim subcommand precision. The first contact anywhere is turn 40/7/8 respectively; every faction meeting at least one rival is not proof that Ashen has met every faction or that every pair has met.

## 100-turn scale workloads

`pnpm bench` executes real observation-based AI and commands, phase resolution, a 50-turn saved mirror with identical results/events, and final save/hash checks. All four cases have **zero rejected orders**. Only these fixed-length workloads defer terminal project proposals; complete-victory/chronicle runs do not.

| World / initial position | Initial→final army containers | Initial→final formations | AI + observation mean | Commands mean | End-turn mean | Full turn mean |
|---|---:|---:|---:|---:|---:|---:|
| Huge / 32 young |64→403|64→616|35.097 ms|12.259 ms|0.385 ms|47.741 ms|
| Huge / 32 mature |1,500→996|1,500→1,516|45.064 ms|11.781 ms|0.598 ms|57.443 ms|
| Legendary / 40 young |80→487|80→766|45.719 ms|14.874 ms|0.396 ms|60.989 ms|
| Legendary / 40 mature |4,000→1,872|4,000→4,012|98.171 ms|18.573 ms|1.532 ms|118.276 ms|

Full turn excludes persistence, all separate mirror execution/verification, main-state sampling/hash verification, browser rendering and archives. End-turn means measure the entire endTurn command, not individual phases. Mature origins are explicitly synthetic, with the stated singleton forces and ample treasury. Merging reduces container count while preserving actual formations; the table does not misrepresent those as unchanged entity counts. Maximum final rosters are 5/6/5/6. Submitted non-endTurn commands: 22,704/39,462/28,111/62,235. Maximum end-turn calls: 1.537/3.337/1.011/5.996 ms. Whole-turn p95 was not instrumented; these means are not tail-latency evidence.

| Same case order | Save / load | Save UTF-8 bytes | Full player observation bytes | Final hash |
|---|---:|---:|---:|---|
| Huge young |50.202 /117.845 ms|2,938,945|564,003|`980655a2`|
| Huge mature |41.501 /105.263 ms|2,662,867|437,992|`4293c6e4`|
| Legendary young |67.997 /165.129 ms|4,229,341|533,976|`980efca8`|
| Legendary mature |64.679 /164.511 ms|4,072,171|502,531|`51c517e1`|

Raw heap samples range 18–159/39–123/103–182/69–228 MiB across the four runs, including the saved mirror after turn 50. No forced GC, peak/retained-memory or leak proof. Exploration and active armies now do materially more work than the old isolated one-step workloads; these larger totals are not a pure optimization comparison. Battles/merges/captures are measured separately in contact cases; the scale harness does not instrument their type breakdown.

## Movement and combat

The established fully explored Huge/Legendary query workload has cold observations 7.723/12.099 ms and cold queries 11.045/44.723 ms. Cached range p95: 0.0783/0.0739 ms; cached 18-cell path p95: 0.0930/0.0994 ms. Path samples include JSON result-equality verification, unlike range samples. Far queries stop at the shared 4,096-node cap in 2.711/2.514 ms, explicitly reporting the limit.

512 guards sharing an 18-cell route take 127.784/123.653 ms to queue. Five active travel phases have medians 68.830/69.730 ms and p95/max 69.760/70.210 ms. Including 15 post-arrival idle turns produces misleadingly small 20-tick medians; these are reported separately (whole end-turn medians 0.1165/0.1616 ms, p95/max 70.178/70.484 ms). All 512 journeys finish; 20-turn save mirrors match `7c658ac9` / `8849fd6d`.

The original colonist/scout/guard 12-vs-12 tactical workload is frozen despite the additive roster: 200 battles after warmup, median 0.38046 ms, p95 0.44967 ms, max 1.20585 ms. Fifty siege scenarios: median 0.23949 ms, p95 0.30904 ms. Paid peace plus mirror: 0.02335/0.03324 ms median/p95; resulting conquest hash `ef64f448`. Mixed-roster engine parity, casualties, retreat, saved tactical rounds and 12-formation-side caps are separate functional tests.

## Campaign duration and remaining gates

Stronger conquest can shorten an otherwise long economic race. Tiny Epic seed 74 now ends on turn 566 after 622 resolved battles and 84 captures, with the winner holding 12 towns rather than the old roughly four-town ceiling. That is an earned, active hundreds-turn result, not a reason to add a turn lock. Pacing regressions allow a shorter finish only with a substantially enlarged winning empire; the full archived Epic seed 20260905 still requires 800–1,400 turns and currently ends on turn 970. Existing pace costs remain unchanged. Pace is not an implemented difficulty system.

`node --import tsx scripts/benchmark-chronicle.ts` verifies all complete campaigns, actual final envelopes, gzip exports/imports, complete technical replay and both full documents. Seed 20260905 results below were measured with unrelated browser functional work allowed, so timings are not the isolated scale comparison above.

| World / pace / factions | Victory turn | Archived orders / events / battles | Mean round with archive | Envelope save / load | Both logs / full replay | Envelope / gzip bytes |
|---|---:|---:|---:|---:|---:|---:|
| Tiny / Short /4 |43|527 /1,528 /10|3.38ms|2.43 /25.38ms|12.19 /72.43ms|468,338 /40,598|
| Huge / Short /32 |42|4,178 /15,817 /3|44.79ms|45.16 /321.15ms|194.75 /1,714.98ms|6,456,795 /434,617|
| Legendary / Short /40 |42|5,178 /21,175 /13|60.11ms|62.08 /433.01ms|296.85 /2,478.91ms|9,173,993 /557,542|
| Tiny / Standard /4 |232|3,614 /10,226 /243|6.07ms|12.42 /38.18ms|72.69 /655.22ms|3,165,645 /251,909|
| Tiny / Epic /4 |970|16,192 /45,579 /1,174|7.08ms|42.14 /140.21ms|326.00 /3,024.95ms|14,279,345 /1,131,801|

The user's exact seed was also run through a complete **Standard / Long / 24-seat** campaign with the new recommended density: victory turn **341**, **55,282 orders / 155,293 events / 2,335 battles**, zero refusals, and full replay/gzip/envelope equality at `148564e1`. Reproduce with `node --import tsx scripts/benchmark-chronicle.ts --seed=748291 --size=standard --pace=long --factions=24 --limit=1200`. This is a real active hundreds-turn campaign, not merely an early-contact sample. Mean archived round 84.00ms; final envelope save/load 185.96/617.16ms; gzip export/import 1,322.22/1,001.61ms; both documents 1,149.53ms; full replay 16,363.19ms. Envelope 44,418,440 bytes / gzip 4,061,212 bytes; full technical ledger 71,414,161 bytes and history 1,446,040 bytes / 343 chapters. Raw final heap 536MiB includes complete documents and replay/validation temporaries. The envelope fits the existing 64MiB cap, but this measurement reinforces the need for chunked storage before giant Epic campaigns; increasing the cap would not solve their allocation costs.

All five have zero refused orders. Final hashes `8d6018c3` / `ac876cbf` / `260a7f98` / `39835abc` / `92409cfa`; Epic's turn-500 restored archive produces identical 972-chapter history and technical documents. Full Epic technical/history sizes: 23,901,578 / 932,620 bytes. Raw final heap samples 40/215/395/290/355 MiB include temporary strings, validation and replay objects, not retained-memory proof. Serialization is not an IndexedDB transaction; complete rounds exclude periodic browser autosaves/rendering and intentional 250 ms watch yield.

## Final browser and integration checks

Full typecheck/lint, content validation, **367 tests / 41 files**, production build and **32 Chromium gameplay scenarios** pass. The sequential browser run takes 1.6 minutes; tests cover recorded-seed contact at turn 30, real merge/split/transfer and escorted founding, saved mixed battles, all ten biome assets and explicit art failure, plus the previous gameplay and complete downloaded-log replay scenarios. Inspected screenshots include actual 390-pixel split/transfer controls above the real sticky turn bar. [Retained visual evidence](../art/ART_IMPLEMENTATION_STATUS.md#slice-7-integration-verification).

The fully explored Huge renderer fixture uses 196,608 cells, 32 factions, 1,500 synthetic global armies and 32 towns, without advancing turns. Current visibility still filters entities. Across static, animated-near, six camera drags and far strategic LOD, the renderer draws 1,024–2,304 terrain cells, retains 9–16 chunks and uses one 4 MiB atlas. Initial near view has 48 visible entities / 47 idle animations. Rolling frame p95 is 16.7–16.8 ms; sampled steady render CPU 0.1–0.2 ms. Initial full observation is **13,371,207 bytes**; pack load 281.3 ms; first sprite render **32.5 ms**. Canonical hash stays `fbf52e40` throughout camera changes. Fractional fitting to the regular hex grid remains explicitly non-pixel-perfect.

The separate fog-limited Huge startup case generates in 133.9 ms, transfers 7,927 bytes and draws 61 terrain cells / two entities. Frame p95 is 16.8 ms, pack load 134.7 ms and first art render 5.9 ms. This is startup evidence, not a substitute for the explored-world test. Neither renderer test measures mature strategic turn cost or autosaves.

Production main chunk is 690.37 kB (211.38 kB gzip), worker 346.34 kB, CSS 41.53 kB. No development observation hook, Art Lab module or Lab catalog remains in production output. Upstream Zod annotation and large-main-chunk warnings remain non-fatal.

A 32-faction 100-turn functional/contact test or 42-turn Short victory is not proof of a 1,000-turn mature giant campaign. Whole-envelope autosaves, the 64 MiB archive limit, chunked history, large-registry virtualization, hierarchical operations and full difficulty/character/event systems remain required before 1.0.
