# Slice 8 — named officers, field missions and long campaign evidence

Measured 2026-09-05 on Node 26.7.0, i9-13900K, Linux 7.1.9-arch1-2; save schema 7, content `9442246b`, archive 2. Benchmarks ran sequentially without other test/benchmark workloads. This is a development workstation, not a mainstream-device release claim.

## Real end-turn and AI workloads

Reproduce with `pnpm bench`. Each case runs 100 real turns, checks 50 subsequent command/results/events and hashes against a midpoint save, then checks final serialization. Zero refused proposals. Terminal project proposals are deferred only in these fixed-length cases; complete victories below defer nothing. Mature setup is synthetic, starting with 1,500/4,000 singleton armies and ordinary rules thereafter. Four introductory cultures are reused for the seat count.

| World / setup | Final armies / formations / towns | AI including observations | Commands | End-turn phases | Complete turn | Save / load | Final hash |
|---|---:|---:|---:|---:|---:|---:|---|
| Huge young | 429 / 632 / 196 | 40.204 ms | 13.806 ms | 0.661 ms | 54.671 ms | 49.53 / 121.64 ms | `b875d552` |
| Huge mature | 841 / 1,515 / 178 | 39.284 ms | 10.024 ms | 0.766 ms | 50.073 ms | 39.63 / 104.79 ms | `741d8867` |
| Legendary young | 489 / 742 / 232 | 50.075 ms | 16.045 ms | 0.711 ms | 66.831 ms | 69.76 / 168.38 ms | `5d471542` |
| Legendary mature | 1,902 / 4,021 / 217 | 101.065 ms | 17.829 ms | 1.422 ms | 120.315 ms | 65.37 / 164.21 ms | `ce497d22` |

Means exclude persistence, hashing and the separate validation mirror. Character phase means are 0.174/0.129/0.196/0.141 ms respectively. Final canonical saves are 3,055,978 / 2,656,616 / 4,380,435 / 4,105,836 bytes; full one-seat observations 659,191 / 440,153 / 611,228 / 519,210 bytes. These observations include many legal attachment choices, and remain a transfer optimization target. Raw heap samples span 30–284 MiB with no forced collection; they include resumed copies and do not prove retained memory or peak bounds. Changed AI behavior and command mixes prevent treating comparisons with slice 7 as pure optimization results; the largest mean rises from 118.276 to 120.315 ms.

## Loaded character registry

Reproduce with `pnpm bench:characters` (`--smoke` is explicitly a smaller functional check). Synthetic mature worlds start with one town per seat and authored ten-strength losses on eleven guards per seat. Every character is then recruited and attached through normally paid, validated commands. Each of 32/40 seats appoints eleven marshals, eleven surveyors and ten engineers. Engineers begin real two-turn refits; 20 subsequent end turns are measured, of which **only two contain active missions**. The first active turn is saved and all 19 following results/events/hashes must match its resumed mirror.

| Fixture | Armies / characters | Completed refits / strength restored | Active character phase mean / max (n=2) | Idle character phase mean / max (n=18) | Full end-turn mean | Save / load |
|---|---:|---:|---:|---:|---:|---:|
| Huge, 32 seats | 1,500 / 1,024 | 320 / 1,600 | 0.425 / 0.476 ms | 0.122 / 0.138 ms | 1.145 ms | 17.52 / 74.81 ms |
| Legendary, 40 seats | 4,000 / 1,280 | 400 / 2,000 | 0.558 / 0.821 ms | 0.165 / 0.187 ms | 2.444 ms | 41.81 / 134.74 ms |

Appointments cost 27,264 / 34,080 coin; missions cost 3,840 / 4,800. Exactly four experience per completing engineer, no refusals, no artificial perpetual mission workload. Final saves 1,881,223 / 3,177,151 bytes, hashes `fe858230` / `ec39bb23`. Setup, recruitment/mission commands, JSON/equality checks and separately executed mirrors are excluded from measured turns. No invasion AI, archive or thousand-turn claim applies to this cohort.

One-seat read-model measurements use 32 owned characters and 20 samples after four warmups. Idle character observation means are 0.867 / 1.432 ms; full observation 1.137 / 2.336 ms; character planning alone 0.029 / 0.038 ms. Active means are 0.406 / 0.768, 0.681 / 1.466 and 0.022 / 0.035 ms. Every final plan is separately checked for legal commands and queries must not mutate state. Huge's 47 co-located armies generate 1,504 attachment options; Legendary's 100 produce 3,200. Character observation bytes idle/active are 172,420/251,999 and 301,588/482,397. This intentionally exposes a nontrivial output-size cost even though DOM rendering is paginated; pagination alone does not solve serialization.

## Complete campaigns and long pacing

`pnpm bench:chronicles`, generated seed 20260905, every faction on normal observation-only AI. Each complete archive restores and replays exactly, and compressed export/import retains its final hash.

| World / pace / seats | Victory turn | Orders / events / battles | Mean recorded round | Envelope save / load | Both logs / replay | Final hash |
|---|---:|---:|---:|---:|---:|---|
| Tiny Short / 4 | 43 | 597 / 1,650 / 11 | 3.773 ms | 2.38 / 25.38 ms | 13.68 / 73.43 ms | `e09e37a6` |
| Huge Short / 32 | 42 | 4,688 / 17,455 / 7 | 45.645 ms | 44.32 / 327.91 ms | 205.36 / 1,648.10 ms | `ccd53960` |
| Legendary Short / 40 | 42 | 5,888 / 23,365 / 9 | 62.317 ms | 66.59 / 456.72 ms | 309.49 / 2,498.30 ms | `c4561287` |
| Tiny Standard / 4 | 267 | 4,826 / 13,948 / 303 | 6.298 ms | 17.27 / 50.37 ms | 97.97 / 820.23 ms | `980e3538` |
| Tiny Epic / 4 | 868 | 14,723 / 43,354 / 1,069 | 7.570 ms | 42.87 / 133.47 ms | 330.41 / 2,813.65 ms | `c7dae7ca` |

Recorded round includes command/event capture and turn hashes, not autosave transactions, compression, browser delays or logs. Giant Short games are not long mature giant tests. Envelope/gzip byte pairs: 512,415/45,833; 6,983,646/480,863; 9,840,553/614,997; 4,449,263/379,412; 14,177,590/1,216,788. Epic technical/history documents are 23,668,248/1,142,780 bytes and 870 chapters. Raw post-case heaps reach 323 MiB including full documents and parsing/replay temporaries; not a retained-memory proof.

Epic contains 24 paid appointments, 51 assignments, 506 mission starts, 465 completions, 24 earned specializations, 177 Rallies, 264 wound recoveries and 374 capture notifications (normally two per public capture, **not** 374 distinct captures). Its winner holds 21 settlements. A separate headless regression resumes the complete archive at turn 500 and compares both final documents, replay and compressed roundtrip.

Tiny Epic seed 99 now wins at turn 648 with 14 towns and 514 battles. Pacing tests allow this active conquest-driven result under the same exception as seed 74, adding minimum battle and capture counts to the existing enlarged-empire condition. The independent seed-20260905 Epic test still requires 800–1,400 turns. No pace costs, free resources or minimum-turn locks were added. This is not a finished difficulty system or sufficient proof of long-campaign strategic variety.

The recording's actual seed **748291**, Standard / Long / 24 recommended seats, reaches victory on turn **392** with **58,123 orders, 166,311 events, 2,925 battles**, 1,221 completed missions, 342 Rallies and zero refusals. Its 18-town winner and complete envelope/gzip/replay agree at `24b04c5f`. Reproduce with `node --import tsx scripts/benchmark-chronicle.ts --seed=748291 --size=standard --pace=long --factions=24 --limit=1200`. Mean recorded round 86.75 ms; envelope save/load 217.78/722.09 ms; gzip export/import 1,478.01/1,097.95 ms; both logs 1,260.03 ms; replay 17,660.74 ms. Envelope **50,579,595 bytes**, gzip 4,912,835; technical/history 81,868,851/2,480,359 bytes, 394 chapters. Raw final heap 620 MiB includes complete documents and validation/replay temporaries. The archive has grown from slice 7's 44.4 MB and whole-envelope autosave remains a concrete scale risk; merely raising the 64 MiB cap would not fix allocation or repeated historical work.

## Movement, combat and browser

All 512 queued journeys finish on both fully explored giant fixtures with exact 20-turn saved mirrors. Cached local range median/p95: Huge 0.064/0.072 ms, Legendary 0.066/0.074 ms; 18-edge route 0.081/0.098 and 0.082/0.098 ms. Far routing stops at the existing 4,096-node budget. Five active journey phases have p95 70.52/74.26 ms; idle phases are reported separately, not averaged into a false cheap active workload. Final route hashes `699c153c` / `b1b5352e`.

The 200 seeded twelve-versus-twelve kernel benchmark measures 0.389 ms median / 0.497 ms p95; this kernel-only comparison has no commander setup. Fifty blockade/assault/capture/peace scenarios verify saved decisions and eleven resumed turns: assault median/p95 0.234/0.449 ms; paid peace including mirror 0.023/0.038 ms, final hash `bd679253`. Character battle effects are covered separately by actual-command tests and the browser Rally workflow.

First full Chromium run passes all 36 scenarios, including four new character workflows. Main-agent screenshot review found usable 390×844 paginated assignment controls and readable frozen leadership/used-Rally states. Fully explored Huge remains viewport-bound: near/pan/far frame p95 16.8 ms, one 4 MiB atlas, 48 locally visible entities, no camera-induced canonical change. Initial observed world transfer is still 13,375,582 bytes; first sprite submission 43.5 ms; these remain optimization targets. The short browser renderer sample is not a sustained memory or mainstream-device claim.
