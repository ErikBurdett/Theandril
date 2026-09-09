# Deterministic campaigns B / C / D — retained audit

**Baseline:** `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`. Evidence root: `/home/telephoneheater/Work/Theandril/docs/hermes-analysis/campaigns/`.

## Outcomes

Eight primary generated campaigns submitted **125,150 commands, with zero command rejections**. All eight full command/result replays reproduce their final hashes and exact serialized bytes. Seven reached an actual Prosperity victory; the bounded sparse campaign stopped at turn 301 without victory. **Save integrity does not pass:** a real 24-faction midpoint and a victorious B campaign's final save are unloadable. These are deterministic simulation/save defects, not rejected policy commands.

All campaigns use **rules 16 / save schema 16 / generator 7 / roster 4**, default generated Continents geography, ordinary starting resources, and actual generated resource deposits. Map size and campaign pace are distinct columns below. B/C control only `faction.ashen_compact`; their opponents use unmodified production AI. D uses production AI for every seat. No grants, authored terrain, passive/scripted opponents, fog reveals, suppressed projects, or alternate combat/economic rules were used. Contact dates mean the first permitted foreign army/town observed at this harness's pre-plan or end-turn snapshot boundary; they are not a continuously sampled claim about the earliest possible within-round reveal.

| Scenario (directory under `runs/`) | Map / seats / pace | Seed | Final turn | Actual winner | Unique battles | Capture decisions | Final hash |
|---|---|---:|---:|---|---:|---:|---|
| B-tiny4-seed74-v2 | Tiny / 4 / Standard | 74 | 252 | Cinder March | 153 | 26 | `41f6fe76` |
| B-tiny4-seed99-v2 | Tiny / 4 / Standard | 99 | 222 | Glass Tide | 273 | 8 | `d15627df` |
| C-tiny4-seed74 | Tiny / 4 / Standard | 74 | 257 | Cinder March | 90 | 27 | `cef149e6` |
| C-tiny4-seed99 | Tiny / 4 / Standard | 99 | 215 | Glass Tide | 99 | 34 | `495733ff` |
| D-tiny4-seed74-standard | Tiny / 4 / Standard | 74 | 244 | Ashen Compact | 148 | 51 | `1c5b5201` |
| D-tiny4-seed99-epic | Tiny / 4 / Epic | 99 | 808 | Glass Tide | 59 | 13 | `cb09f975` |
| D-sparse4-seed748291 | Standard / 4 / Long | 748291 | 301 | None at bound | 12 | 0 | `3c565118` |
| D-standard24-seed74-300 | Standard / 24 / Standard | 74 | 227 | Mire Courts | 582 | 72 | `1ea09c56` |

The 24-seat run was scheduled for 300 rounds but correctly stopped at victory on turn 227, after 226 completed rounds. It meets 200+ turns without disabling victory to manufacture 300. Epic provides 800+ natural turns; sparse provides the turn-300 observation. None of the B/C policies won its controlled seat in these two seeds. This is evidence of distinct exercised policies, not an optimal-strategy or faction-balance claim.

`outcomes.csv`, `aggregate.json`, `deep-analysis.json`, and `verification-manifest.json` contain programmatically counted outcomes and underlying distinctions. A capture count means an accepted `resolveCapture` transaction; repeatedly taking the same settlement counts as multiple captures, not multiple unique settlements. Distinct captured settlement counts are separately retained. Battles are deduplicated by canonical battle ID, **not** broadcast event count. Battle results, real strength loss, field/siege/naval classification and raw broadcast counts are retained separately.

## Distinct controlled policies

Source: [`strategies.ts`](strategies.ts), with the exact source SHA in each scenario summary.

- **B aggressive:** early paid Shield cohesion; on two of three rounds, prefer currently legal military recruitment within actual treasury/upkeep limits; declare on a currently visible nearby rival when a three-formation force exists; retain binding treaties but reject peace and do not proactively negotiate it. Operational, founding, transport and siege logic reuse observed production AI decisions. It deliberately omits diplomatic offers/relations from its operational subplanner, not geography or hidden-state restrictions.
- **C economy/research/magic:** prioritize archives, markets and practical knowledge; explicitly buy the two separately gated Arcane discoveries; pay for and attach a real Waykeeper; avoid initiating new wars and retain ordinary peace/defensive decisions. Remaining development, workers, founding, navy and movement use production proposals. Both strategies honor eligible victory-project commands.
- Priority spending replaces the baseline paid batch instead of spending the same purse twice. Only no-coin operational orders and quoted funded founding survive that replacement. Stored plan reasons include baseline candidate reasons; **`commands.jsonl.gz` is the authority for what was actually submitted**, not every candidate reason string.

### Controlled seat at turn 100

| Policy / seed | Towns / population | Armies / formations | Treasury | Knowledge | Practical nodes | Arcane nodes | Net coin / queued upkeep |
|---|---:|---:|---:|---:|---:|---:|---:|
| B / 74 | 3 / 22 | 5 / 16 | 310 | 262 | 8 | 0 | 15 / 0 |
| C / 74 | 8 / 59 | 16 / 26 | 2,323 | 1,250 | 10 | 2 | 92 / 3 |
| B / 99 | 3 / 21 | 6 / 9 | 660 | 460 | 6 | 0 | 27 / 0 |
| C / 99 | 7 / 49 | 14 / 26 | 1,012 | 702 | 10 | 2 | 66 / 0 |

B produced more repeated military encounters, not a stronger eventual economy: the controlled seat participated in 87/219 battles and made 5/3 captures for seeds 74/99; C participated in 18/36 and made 1/6 captures. B seed99's 273 total battles include **263 ordered withdrawals** and only **106 battles with actual strength loss**. Even unique battle IDs are not a proxy for 273 substantial battles. In the 24-seat run, 559 of 582 battles ended in ordered withdrawal, and 330 had actual strength loss.

### Earned magic, not an injected demonstration

C74 paid for Ember projection on turn 20 and Rune binding on turn 34; C99 paid on turns 10 and 30. The controlled factions completed all ten practical nodes by the recorded turn boundaries 75 and 84 respectively. B's final controlled research remained at eight/six practical nodes and no Arcane discoveries.

C74 emitted four actual spell-use events, all Bound ward. C99 emitted twelve, including both Bound ward and Cinder thread. **C99 `battle.80`, turn 37, command sequence 506** is an ordinary generated encounter: paid Waykeeper `character.13`, attached to `army.21`, has explicit Flame1/Rune1 aptitudes; both discovered spell IDs appear in the battle snapshot, automatic casts execute, and saved caster strain reaches 10. Its Bound ward has zero uses remaining and Cinder thread one remaining. Full battle, paid appointment/attachment/research commands and spell events are excerpted in [`key-evidence.json`](key-evidence.json). This demonstrates the implemented two-spell foundation, not strategic rituals, summons, sacred/occult systems or magical crafting. The separate national/personal requirements and strain authority are in `packages/sim/src/magic.ts:20–50` and `battle-abilities.ts:60–116`.

## Current 24-faction Standard campaign

Cumulative battles/captures; population, stocks, forces and wars are current at the stated turn boundary. Full per-faction metrics, claims/workers, characters, observed contacts, research and resource production are retained every turn.

| Turn | Towns | Population | Armies / formations | Hulls | Wars | Battles / captures | Seats with contact | Treasury / knowledge |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 0 | 0 | 48 / 48 | 0 | 0 | 0 / 0 | 0 | 1,440 / 0 |
| 30 | 58 | 287 | 91 / 131 | 9 | 0 | 0 / 0 | 5 | 1,863 / 1,146 |
| 60 | 107 | 659 | 255 / 413 | 59 | 4 | 23 / 0 | 23 | 6,220 / 4,756 |
| 100 | 160 | 1,238 | 364 / 600 | 68 | 7 | 122 / 8 | 24 | 34,479 / 36,403 |
| 200 | 250 | 2,613 | 470 / 913 | 77 | 10 | 475 / 48 | 24 | 225,623 / 203,170 |
| 227, victory | 269 | 2,964 | 471 / 979 | 78 | 14 | 582 / 72 | 24 | 279,132 / 260,930 |

First observed foreign-entity contact ranges from Vesper Court turn19 to Margin Observance turn72; the Ashen seat contacts at34. The final realm set has 4,751 claims and 2,935 worked tiles; largest town population26. All24 authored cultures are generated once. Research saturates unevenly: sixteen seats acquire all ten practical nodes by victory, while several accumulate knowledge without buying every situational branch. Exact per-seat dates and node lists are in the aggregate.

## Long-horizon AI: progress versus repetition

### Tiny4 Epic seed99

| Turn | Towns | Population | Armies / formations | Wars | Battles / captures | Treasury / knowledge |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 0 | 0 | 8 / 8 | 0 | 0 / 0 | 240 / 0 |
| 30 | 7 | 43 | 20 / 23 | 0 | 0 / 0 | 230 / 161 |
| 60 | 16 | 102 | 37 / 62 | 3 | 18 / 0 | 756 / 465 |
| 100 | 25 | 194 | 49 / 98 | 1 | 37 / 8 | 4,066 / 4,062 |
| 200 | 31 | 385 | 52 / 125 | 0 | 57 / 12 | 46,363 / 18,500 |
| 300 | 32 | 476 | 53 / 126 | 0 | 59 / 13 | 112,483 / 41,960 |
| 500 | 32 | 603 | 53 / 127 | 0 | 59 / 13 | 283,570 / 91,633 |
| 800 | 32 | 695 | 53 / 127 | 0 | 59 / 13 | 336,295 / 170,189 |
| 808, victory | 32 | 699 | 53 / 127 | 0 | 59 / 13 | 342,992 / 172,421 |

This finishes rather than deadlocking, but the late duration is mainly accumulation, growth and repetitive movement, not sustained conflict. Last founding:288; last war declaration:290; last battle/capture:297. All four practical trees are complete by boundary146. No Arcane discoveries occur in this run. Glass Tide pays the real **240,000 coin on turn748**, and its actual 60-active-turn project finishes808 with no recorded project pause/cancellation. The price/window are the current content rules, not harness choices (`packages/content/src/progression.ts:44–48`; `packages/sim/src/progression.ts:112–155`).

Movement is not merely inferred from a stationary final screenshot. `army.145` appears from turns57–808, visits eight distinct cells, and makes720 observed A→B→A returns. Across turns300–808 it uses only two cells, ending in exact158↔159 alternation. `army.46` similarly alternates160↔157. These are diagnostic trajectory counts, not proof every reversal is illegal; the associated production plan reasons and movement commands remain available. Navigation policy is in `packages/ai/src/index.ts:251–269`. The late absence of wars alongside these loops is the meaningful weakness.

The final maximum town population is32; 1,055 claims and687 workers demonstrate real uncapped growth beyond old limits. Resource progress is narrower: only Glass Tide has nonzero final material extraction, with Ironstone14 (+4/turn), Redcopper10 (+4), Whitesalt22 (+4) and Heartwood12 (+2). Other seats' final material stocks/production are zero. The 172,421 accumulated knowledge cannot be spent on additional practical nodes in the current ten-node catalog. Duration therefore must not be presented as completed deep research or strategic engagement (`DEFINITION_OF_DONE.md:16–35`).

### Standard-map sparse4, seed748291, Long pace

At turns30/60/100:10/21/30 settlements, and0/2/2 seats with contact. The player Ashen seat has **no contact by100**; its first actually observed foreign entity is at137. Reedbound contacts130; Cinder March and Glass Tide57. This reproduces the unchanged sparse scenario's100-turn contact expectation failure without weakening its threshold (`packages/ai/src/contact.test.ts:9–10,78–90`).

At200 there are40 towns,463 population,89 armies/142 formations,11 battles and0 captures. At301:44 towns,627 population,104 armies/162 formations,21 hulls,12 battles,0 captures and no victory. Total treasury120,896 and knowledge67,034. The Ashen seat participates in **zero** battles across this run despite ten final settlements. No faction has nonzero final material extraction. Paid movement, fleets and eventual contact are real, but sparse contact and meaningful engagement remain weak. All300 rounds, a turn51 resume and the entire11,051-command replay agree exactly.

## Reproducible save defect — do not mask it

The initial 24-seat attempt (`runs/D-standard24-seed74/`, preserved with `run-campaign-v1.ts`) aborted on its turn101 midpoint load:

> `Error: Invalid save: battle formation differs from unit content`

The current runner records the failed load and continues **the original untouched canonical campaign**; it does not repair the save, remove reports, replace rules or downgrade the schema. Full replay is checked independently of final/midpoint loading. The run still exits nonzero for save failures.

Root-cause evidence:

1. At turn96, `battle.1417`, sequence15075, `formation.543` (arbalesters with Field habits) finishes with morale74.
2. A second real engagement in the same turn, `battle.1419`, sequence15151, finishes with morale78. There is no Rally in either report. The same74→78 pattern repeats in turn97.
3. `packages/sim/src/warfare.ts:55–65` adds the training morale bonus on deployment. `warfare.ts:215` stores the resulting battle morale back onto the strategic formation. A further same-turn engagement adds the opening bonus again. The next end-turn clamps live morale to the unit baseline (`simulation.ts:301`), but does not rewrite the historical report.
4. The save validator requires report morale ≤ unit base + training (`save.ts:827–828`). The retained arbalester report has78 where the authoritative validator ceiling is74. Other attack/armor/range/initiative/strength values match. [`audit-save.ts`](audit-save.ts) calls the actual loader and canonical effect helpers and exposes those exact mismatches; [`save-failure-analysis.json`](save-failure-analysis.json) and [`save-failure-B74.json`](save-failure-B74.json) retain its results.

The complete 24-seat final save at227 loads, but its midpoint101 does not. A later loadable snapshot **does not invalidate the earlier defect**: retained battle history is bounded (`warfare.ts:273–274`). B74's actual victorious final252 save independently reproduces the same validator failure, while its full replay and turn51 continuation both reach the exact same bad final bytes/hash. That is deterministic corruption, not nondeterministic replay divergence.

`verification-manifest.json` independently reopens the compressed files and reruns all eight traces. Seven midpoint-to-final continuations are exact; the sole blocked midpoint is Standard24 turn101. Seven final saves load; B74 is the sole failing final. The two affected scenarios produce nonzero verification exits. All eight full replays remain exact. No production fixes or test-threshold changes were authorized or made.

## Evidence, scope, and caveats

- `runs/<scenario>/commands.jsonl.gz`: every actual command/result with sequence and pre-command turn; `plans.jsonl.gz`: scoped policy proposals/reasons; `events.jsonl.gz`, `battles.jsonl.gz`, `captures.jsonl.gz`: full ordinary evidence; `metrics.jsonl.gz` and `positions.jsonl.gz`: every turn; `initial/midpoint/final/turn-N.json.gz`: actual compressed snapshots.
- Each `summary.json` records setup, content/source hashes, real SHA-256 seals, command counts, rejections, final hash, runtime environment and verification/timings. JSONL compression is lossless and byte-verified in `compression-manifest.json`.
- Two exploratory artifacts are retained but **excluded from the eight-primary totals**: initial24 aborted-at101 run and `B-tiny4-seed74` pilot. The pilot used a harness quote-property mistake, so its intended recruitment override was inactive; corrected B runs use the `-v2` names, actual content coin prices and authoritative `canQueue`. `strategies-v1.ts` preserves that pilot source. Nothing in production was changed to compensate.
- Existing frozen `scripts/benchmark-cohort24.ts:15–16` requires schema13/old content and cannot honestly certify current schema16 as-is. The audit runner follows its public-command/replay pattern with current explicit settings. Existing contact/pacing tests informed scenario choices; this audit does not claim their complete suite passed.
- Scoped harness TypeScript and ESLint checking pass. No browser/UI play, storage-adapter export/import, multiplayer, alternative layouts, higher difficulty, human strategic expertise, exhaustive faction balance, all battle edge cases, manually targeted spells, rituals/summons or non-Prosperity victory paths were verified here. No controlled resource injection or authored combat fixture was needed for the exercised magic/conquest coverage.
- Campaign execution was bounded, with at most two campaign processes at once and other QA activity possible. Timing includes file logging, per-turn diagnostic reads, compression and save mirrors; it is **exploratory, not isolated performance certification**. No runtime budget was hit in the primary campaigns. Higher-level repo release checks belong to the coordinating QA report.

See [`README.md`](README.md) for exact reproducible commands and evidence readers. Only `docs/hermes-analysis/campaigns/` was edited inside the repository for this delegated work; no gameplay changes, commits or pushes. A generic campaign-audit procedural skill was also recorded in the active Hermes profile.
