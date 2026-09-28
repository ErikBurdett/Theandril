# Reinforcement, integrated delegation and negotiated supply

Implementation verified 28 September 2026; work began 27 September. Baseline:
`8e371b3290aaabd9421ce679b76cc8a5ce28d770`. Rules/save 34;
content `015468d1` unchanged. This packet advances ACT-32/M3, ACT-33/M4 and
DH-021/ACT-38 evidence. All fifteen release gates remain open. Full local headless,
affected Chromium, benchmark, paired pacing and built-production runs pass.
Publication verification is pending; this is not a prompt completion report.

## Implemented player outcomes

- Opt a defensive theater into up to four extra guards when visible wartime
  combat land armies approach its protected hearths. Preserve physical guard
  floors and direct orders; hold additional coverage through one quiet turn.
- Resolve grouped theater exceptions and keep delegated idle armies out of the
  ordinary movement queue. Exercise policies, shared production budgets, saved
  groups, travel, theaters and individual overrides in one explicitly authored
  128-army/30-hearth Huge realm with two wars.
- Negotiate paid supply from one observed foreign hearth or harbor. Use that
  canonical supply for land forces and loaded fleets, inspect shortages, end or
  lose service and recover through negotiated access. Preserve exact saves and
  history. Existing land, harbor, road and fleet-provision rules remain the source
  of supply effects.
- Compare three predetermined seeds (20260905, 20260906, 20260907), three headline
  paces and twelve realms under rules 33 and 34 before changing any pacing price.

[Architecture](../../architecture/0046-reinforcement-supply-access.md) describes
authority, bounds, fog, hold semantics, payment and historical migration.
[Supply evidence](supply-access-evidence.md) records scoped canonical/AI checks.

## Current verification

These scopes overlap; their counts must not be added.

| Scope | Recorded outcome |
| --- | --- |
| Genuine pre-change rules 33 | Ten save/archive checkpoints, 27 independently repeated accepted commands and seven continuations; original bytes and seals retained |
| Strict save/history/storage | 102 checks across seven files pass; see `compatibility-final.log` |
| Actual worker supply acceptance/recovery and response validation | 54 checks across five files pass, including direct provider, AI End turn and AI watch accepted-payment recovery; see `supply-ai-worker-recovery-affected.log` |
| Reinforcement/base theater/AI/UI/response | 43 checks across six files pass before the added hidden-order twin assertion; see `reinforcement-tests-final.log` |
| Canonical supply | 19 scoped checks pass; logs and exact identities in `supply-access-evidence.md` |
| All AI after peace-reserve correction | 280 checks across 35 files pass; see `supply-ai-all-corrected.log` |
| Supply Chromium | Both buyer and provider journeys pass in 13.8 seconds; initial selector failure retained, see `supply-browser-role-fixed.log` |
| Integrated delegation Chromium | 1/1 passes in 35.2s; final actual controls, matching AI-inclusive manual/portable futures, six reviewed native captures and observed worker/UI costs in `integrated-acceptance.md` |
| Whole-tree typecheck/lint | Both pass; see `typecheck-final.log` and `lint-final.log` |
| Affected Chromium | 49/49 pass in 5.8 minutes across seventeen files; see `affected-browser-final.log` |
| Final full suite | 2,146/2,146 checks across 266 files pass in 56.51s with four local workers; original limits unchanged, see `tests-final.log` |
| Reinforcement measurements | Four Huge/Legendary representative/ceiling cases pass, one warmup and three identical-save samples each; see `reinforcement-benchmark-final.json` |
| Supply and purchase-planner measurements | Both Huge/Legendary full workloads pass, one warmup and three identical-save samples per phase; see `supply-benchmark-final.json` and `supply-benchmark-final-corrected.log` |
| Paired headline pacing | All eighteen rules-33/34 runs complete; nine old rows match genuine pre-change hashes/command/event counts, see `pacing-comparison.json` |
| Built production | 2/2 pass in 10.4s without development hooks; generated theater and authored supply import, see `production-final.log` |
| Content/art and Pages-subpath build | Pass; see `content-final.log`, `art-final.log` and `build-initial.log` |
| Publication | Pending; no deployment or release-acceptance claim |

[Historical capture review](historical-capture-review.md),
[manifest](historical/manifest.json),
[independent reinforcement/integration review](reinforcement-integration-review.md)
and [grouped navigation review](next-action-review.md).

The independent review identified that early peace planning could spend a pending
supply fee before the private planning purse was reduced. Reservation now happens
before discretionary diplomacy. The specific three-realm regression and all 280 AI checks pass. Independent worker review also reproduced and closed missing recovery after AI acceptance inside End turn/watch; see [recovery evidence](worker-recovery-review.md).

## Completed measurements

Both headless benchmarks use Node 26.7.0 on the i9-13900K host. Setup, strict
loading, hashing, comparisons and archive replay are outside the timed phases.
The tables show medians from one discarded warmup and three identical-save
samples, not end-to-end latency, tail confidence or a frame-time gate.

### Threat reinforcement

[The four final workloads](reinforcement-benchmark-final.json) use generator-4
Huge/Legendary dimensions, 196,608/307,200 cells and 32/40 realms. Representative
cases retain generated geography and author a second hearth, charted corridor,
100 members and visible wartime pressure. Ceiling cases replace the map with
authored flat land and isolated member islands, filling one realm's eight
theaters/128 hearths/1,024 members. The configured reinforcement limit is two.

| Case | Global armies | Attempted / accepted / refused routes | Allocation ms | Theater read ms | Complete own observation ms | Observation JSON bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Huge representative | 1,556 | 16 / 16 / 0 | 1.600 | 0.755 | 4.953 | 495,397 |
| Huge ceiling | 2,605 | 128 / 64 / 64 | 9.259 | 1.825 | 37.787 | 6,861,674 |
| Legendary representative | 4,003 | 16 / 16 / 0 | 2.338 | 1.262 | 5.956 | 455,199 |
| Legendary ceiling | 5,052 | 128 / 64 / 64 | 9.466 | 2.749 | 40.392 | 6,863,616 |

Repeated phases, strict saves and ordinary End-turn archive/observation replay
match. Complete observation follows the phase and isolated read with caches
already available. Coverage indexes global army/posting/siege collections once,
then checks at most 37 nearby hexes/occupants per protected hearth. Sixteen route
attempts per theater include refusals. The measurements cover one active realm,
not simultaneous 64-realm or maximum-search saturation, and have no matched old
rules timing with which to claim a speedup. The multi-megabyte ceiling observation
remains a material read-model cost.

### Imported supply and bounded AI purchases

[The final supply result](supply-benchmark-final.json) preserves generated
geography/resources while authoring eight three-company witnesses, 7/5 naturally
coastal harbors and sufficient funds. Huge/Legendary have 1,508/4,008 armies after
those additions. One buyer pays 80 coin through eight ordinary proposals and
acceptances. All eight witnesses change from unsupplied to actually supplied;
actual reach grows from 61 to 549 cells, while the permitted forecast reaches 213.

| Phase | Huge no contracts → eight imports | Legendary no contracts → eight imports |
| --- | ---: | ---: |
| Actual source graph, median ms | 0.137 → 0.837 | 0.231 → 0.605 |
| Permitted forecast, median ms | 0.017 → 0.385 | 0.020 → 0.281 |
| Complete own observation, median ms | 9.829 → 12.196 | 27.222 → 26.999 |
| Own observation JSON bytes | 617,174 → 623,834 | 1,256,745 → 1,263,528 |

The small lower Legendary observation median is sample variability, not an
established speedup. Useful AI planner medians are 0.208/0.200 ms and the verified
nearer-own-line veto 0.259/0.294 ms. The useful cases actually propose, obtain AI
consent, pay 20 coin once and feed their witnesses; the veto cases retain a real
one-step own-supply route and issue no proposal. The bound is two actors, four
sources and eight route previews, not an instrumented query count.

Ordinary war termination, isolated source-loss/expiry cleanup, exact strict saves,
five actual expiry End turns and complete replay pass. [The retained failure and
correction](supply-benchmark-review.md) explain the loss-boundary setup: 47/100
old-owner guards are explicitly displaced onto empty adjacent land before the
source changes owner. This authors no battle/capture/retreat and changes no
geography or validator. Final source fingerprints match.

Eight imports/eight offers per buyer bound the 64-realm registers to 512 records
of each kind. Graph filtering/cleanup scan those registers; ordinary source
propagation uses nine cost buckets and at most eight road steps/217 nearby hexes
per isolated source, with overlapping work shared. This benchmark measures one
buyer, not full global-register saturation or organic overseas expansion. Actual
supply and permitted forecasts remain distinct; browser rendering is unmeasured.

### Joined M3 observation and transfer costs

The [passing integrated journey](integrated-acceptance.md) is explicitly authored
and has a finite shared purse: 44 coin becomes eight after three paid orders, then
zero after upkeep; 28 charters wait for reserve funds while paid work advances.
It proves real controls and exact AI-inclusive manual/portable continuation,
not a sustainably funded mature empire or complete governor.

Its read-only worker observer records 26 request/reply pairs and twelve state
publications of 1,652,451–1,993,343 bytes, totaling 21,670,006 across the original
and restored sessions. The explicit three-army review returns 582 bytes in a
64.0 ms roundtrip with 0.9 ms worker query time. Charter/partial-production/travel
roundtrips are 120.4/112.2/582.7 ms, versus command times 1.2/0.6/1.4 ms. The first
End turn is 754.5 ms roundtrip, 219.6 ms command time including 156.7 ms AI.

These are a single correctness journey's observations and existing result-byte
metrics, not direct structured-clone, quiet sampled latency or frame-time
measurements. Stage timings include assertions/screenshots; costs cannot be
attributed solely to rendering. [The global performance record](../../PERFORMANCE.md)
keeps these scopes separate from the sampled headless phases.

## Paired pacing and method

The final [eighteen-run matrix](pacing-matrix.json), [console output](pacing-matrix.log)
and [comparison](pacing-comparison.json) contain nine paired configurations:
three predetermined seeds × three paces on Standard maps with twelve realms,
under rules 33 and 34. The genuine pre-change [JSON](pacing-rules33.json) and
[console output](pacing-rules33.log) remain unchanged. Every new historical row
matches its original hash and command/event counts; the current counterpart has
the same outcome and command/event counts. Both versions finish at:

| Seed | Standard | Long | Epic |
| --- | ---: | ---: | ---: |
| 20260905 | 233 | 311 | 349 |
| 20260906 | 211 | 312 | 367 |
| 20260907 | 225 | 309 | 373 |

Every final campaign ended through Prosperity with zero submitted-order and
automatic-theater refusals. Across the nine current campaigns, five accepted
ordinary theater routes target cells associated with reinforcement holds. This
does not prove arrival or that extra reinforcement caused those dispatches;
paired command/event counts are unchanged. No supply requests or responses occur,
so the authored purchase evidence remains separate from organic adoption.

These are nine paired seed/pace configurations, not eighteen independent seeds.
DH-021 remains open: Standard/Long are above the approximate 200/300 targets and
one Epic seed is a turn below 350. No content prices, targets or tiny proxy bounds
changed. Initial matrices remain as `pacing-matrix-initial.*` and
`pacing-matrix-context-defect.*`: creation selected historical rules but later
observations, AI and commands ran current rules, invalidating those paired claims.
The corrected tool scopes complete execution in `withRules` and uses historical
hash projection. The genuine pre-change baseline is unaffected, and its exact
match is now checked by the completed matrix. Campaign elapsed times are not
quiet performance measurements.

## Bounds and remaining scope

Theaters still attempt at most sixteen ordinary routes each turn. Reinforcement
counts visible army containers, not opposing combat strength. Existing watches
are not refilled or rewritten automatically. Patrols, escorts, reusable army
order templates and broader governors remain unfinished M3 work.

Supply access imports one named source. It is not shared intelligence, passage,
alliance, recurring trade caravans, guarantees, joint-war coordination or a full
material economy. Either party may terminate without refund. Actual own-force
feeding is distinct from the map's last-known contracted forecast. A generic
offer-settlement blocker is a bilateral feasibility fact, not disclosure of the
other realm's treasury balance.

The integrated realm and naval acceptance fixtures are explicitly authored.
They do not prove an organically earned mature empire or a complete AI overseas
war. Huge/Legendary measurements distinguish setup, isolated phases,
read-model work, worker/browser costs and unmeasured all-realm saturation.
Canonical source-loss phase fixtures do not substitute for a complete capture
journey. Publication will be development deployment, not 1.0 acceptance.

## Retained integration failures

The first full suite retained six sandbox subprocess failures (`tests-initial.log`); its unsandboxed correction passed 2,144 checks. After adding two worker regressions, the concurrent full run passed 2,144/2,146, with unchanged 20-second artifact/changelog limits expiring. The default-worker quiet run passed 2,145/2,146 with the changelog limit still expiring. Final verification uses a bounded local worker pool without altering assertions or timeouts. See `tests-concurrent.log` and `tests-default-workers.log`. Large diagnostic traces are retained locally with exact hashes in [the trace manifest](local-trace-manifest.json); published failure logs, error contexts and native screenshots remain reviewable in this packet.

The final typecheck caught an unknown command read in the acceptance test (`typecheck-test-boundary-initial.log`). Its archive assertions now parse each command with the canonical schema for its recorded rules version. Production runtime did not change; final typecheck and lint pass.

The focused strict-parser browser rerun passes 1/1 in 37.7 seconds; see `integrated-typed-final.log`. This overlaps the 49-journey scope.
