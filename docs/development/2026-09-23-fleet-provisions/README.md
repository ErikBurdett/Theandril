# Fleet provisions — local ACT-35 evidence

2026-09-23, working tree based on `303434733f09dee86a4f46c65c34f5aa2af35152`.
Rules/save **31**, content **`015468d1`**. No content-price change, commit, push or
deployment. Source hashes are retained in `source-manifest.json`; screenshots
have their own [provenance](screenshots/provenance.json).

## Delivered behavior

Eight turns of fleet endurance beyond friendly supply, shared passenger
attrition after the final ration, resupply at harbour reach, private observation,
saved continuation and conservative split/merge endurance. The AI uses observed
routes to return, stops for replenishment, can finish an immediate landing and
funds an actual coastal staging harbour. [Architecture](../../architecture/0038-fleet-provisions.md).

ACT-35's headline acceptance is met by the final Epic measurement. This is a
bounded local implementation of M4, not release acceptance or proof that every
naval operation avoids supply losses.

## Verification

| Check | Evidence |
| --- | --- |
| Typecheck | [pnpm typecheck](typecheck.log), passes |
| Lint | [pnpm lint](lint.log), passes |
| Content references/seal | [pnpm content:validate](content-validation.log), passes with unchanged `015468d1` |
| Production Pages-subpath build | [VITE_BASE_PATH=/Theandril/ pnpm build](build.log), passes; existing large-chunk warning remains |
| Complete local tests | [pnpm test](tests-final.log), **1,861/1,861 pass across 232 files**, 29.36s |
| Affected browser journeys | [9/9 pass](browser-final.log): army 3, naval 4, postings 1, supply 1 |
| Historical save/replay | [Compatibility tests](../../../packages/chronicle/src/fleet-provisions-compatibility.test.ts), six captured rules30 checkpoints; [storage/export tests](../../../packages/persistence/src/fleet-provisions.test.ts) |
| Code review | [Independent sim/AI review](code-review.md), reproduced coastal-depth defect fixed and regression verified |
| Persistence review | [Independent save/archive/storage review](persistence-review.md), no actionable finding; all six original SHA256/FNV seals recomputed |
| Factual review | [Counts, claims and artifact hashes](factual-review.md), no material correction |

The new browser voyage uses real controls to move offshore, save/reload at two
stores, consume two turns without damage, observe four strength lost per hull
and passenger on the next turn, return to supply, refill and save again. Captures
are inspected at 1440×1000 and 390×844. Setup is explicitly authored and funded;
it does not represent an earned campaign.

Earlier unsuccessful checks are retained honestly. `supply-before.log` records
missing behavior before implementation, plus one invalid test entity ID that
was corrected. An initial browser text expectation said “Out of supply” where
the canonical fleet reason correctly said “Out of stores”; the corrected
journey and the final combined run pass. The first broad run was sandbox-blocked
from spawning git/pnpm in six repository checks. The next run passed 1859 of 1860
then-existing checks but its history-feed test hit 20s during overlapping
workloads ([log](tests-before-isolation.log)); final verification keeps the
original timeout and runs after those workloads finish. No failing assertion or
test budget was weakened.

## Pacing: compare the headline, retain the proxies

`pnpm measure:pacing all`, final depth-corrected AI:
[raw results](pacing-final.log). All seven cases reach Prosperity with **zero
refused orders**. Baseline uses explicit rules30 commands and observations with
the planner's unchanged no-provisions branch: [driver](measure-rules30.ts),
[results](pacing-rules30.log). It reproduces the previously recorded Epic 388.

| Standard map, 12 realms, seed 20260905 | Rules30 | Rules31 | Design target |
| --- | ---: | ---: | --- |
| Epic | 388 | **379** | 350–400 |
| Long | 367 | **342** | about 300 |
| Standard | 223 | **234** | about 200 |

Long improves but remains slower than its stated design target. Standard gains
eleven turns (about 5% over the prior result), and also remains above its target.
Those are open balance work, not grounds to claim every pace is accepted. No
price, proxy threshold or campaign cap was tuned to hide them.

Tiny/four-realm proxies finish at 363 and 378 (Epic seeds 74/20260905), 261 (Long
seed 99) and 215 (Standard seed 74). They retain existing test bounds and are not
substitutes for the headline measurement. Earlier measurements before the
reviewed depth fix are kept separately, not pooled as additional final proof.

## Generated play: use supply and still cross water

The [benchmark](benchmark-fleet-supply.json) includes an unchanged Small/islands
input, seed 20260905, four realms, Epic,100 rounds to turn 101. No ships, funds,
harbours, map knowledge or proposals are granted or altered. It records:

- 2,819 accepted orders, zero refusals; 2,477 commands match a saved mirror.
- 289 return movement steps, 86 resupply events and 11 paid harbour orders.
- Ten embarkations, six landings and two settlements founded by transported
  armies; five distinct armies landed.
- Six empty-store events. One fleet and one passenger army suffer one attrition
  turn each, losing four strength each. This is evidence of working logistics,
  not a claim of perfect supply planning.
- Final saved/mirrored hash `afc149a5`.

## Separate simulation and AI costs

Run `./node_modules/.bin/tsx scripts/benchmark-fleet-supply.ts`.
The benchmark alternates comparisons after three warmups, retains twelve samples
per measurement, asserts exact repeated outputs and strict save roundtrips.
Setup, restore, hash and validation work are outside timing. The input is an
authored resource-free island grid with a complete chart and ordinary entity
sight; it is not an organically grown empire or a sustained scale soak.

| Synthetic workload | Supply resolution median, rules30→31 | Naval proposal median, no provisions→aware | Current AI p95 |
| --- | ---: | ---: | ---: |
| Huge 196,608 cells; 128 harbours; 64 loaded fleets | 5.36→5.81ms | 33.77→41.89ms | 48.17ms |
| Legendary 307,200 cells; 256 harbours; 128 loaded fleets | 10.18→10.42ms | 63.04→79.53ms | 108.85ms |

The extra AI decisions cost about 8ms/16ms median on these particular complete
charts. Current planner caps remain eight fleets and eight shared route queries;
those are configured bounds, not instrumented per-sample query totals. Multiple
independent realms, contested routes, full economic turns, archive cost, retained
memory and rendering are outside these timings. No frame-time improvement or
whole Gate K acceptance is claimed.

## Remaining work and publication

Return planning retains two nearby permitted targets, so obstructed or unknown
geography may still hide a better harbour route. Estimates can be invalidated by
movement, wages, enemy positions or lost supply. The generated run records actual
remaining losses rather than suppressing them. Material supply costs, trade,
taxation, treaty access, escorts, reinforcement and broad lost-port recovery are
still M4 work. All fifteen release gates remain open.

The [developer dispatch](../../updates/fleet-provisions-work-packet.md) stays in
draft. The public journal/catalogue retains its historical source pins until an
implementation revision exists and publication is authorized. Existing accepted
scope is unchanged; no new feature obligation or release completion percentage
is introduced.

The [local tracker readback](tracker-readback.json) records ACT-35 as done locally,
while ACT-33/M4 remain in progress and published acceptance-point totals stay
unchanged. Its regenerated page explicitly distinguishes the verified local
rules31 candidate from published rules30. The task's temporary Vite server has
been stopped; unrelated development servers were left alone.
