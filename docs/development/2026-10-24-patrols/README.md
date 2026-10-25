# Saved land patrols — local implementation packet

Prompt: “continue”, following the verified personal posting-template checkpoint.
Base commit `d06ba4b`; prior prompt changes remain local and preserved. This slice
is implemented locally, with no publication or release acceptance. Campaign
pacing remains unresolved; the Long campaign lengthened by 24 turns.

## Acceptance and ownership

Give an owned combat land army two explored endpoints. Its saved patrol repeatedly
uses ordinary travel, reports its next target or refusal, respects direct routes
and postings, and can be paused or removed without silently canceling existing
travel. Player controls, attention/registry reports and AI all use the canonical
command path. Save/replay, foreign privacy and bounded allocation must be verified.

- Parent: version/command/observation integration, save and history projections,
  independent old fixture capture, persistence acceptance, pacing/performance,
  browser/integration runs and final records.
- Simulation delegate: pure patrol state/schema, canonical order/allocation/report
  module, theater override and focused simulation tests.
- UI delegate: individual army controls, registry/attention, browser journeys;
  independent review of AI source.
- AI delegate: bounded adoption and held-army integration; independent review of
  parent save/history integration and patrol simulation.

No art, content-price, tactical-combat or online protocol changes are in this
slice. Existing posting templates from the preceding prompt are preserved.

## Compatibility

[Architecture 0048](../../architecture/0048-land-patrols.md) defines rules/save 35,
with content `015468d1` unchanged. Before changing any canonical source,
`node --import tsx scripts/capture-patrols35.ts` captured six genuine rules-34
save/archive checkpoints. Every accepted command was independently repeated
after reload, comparing complete results/events and saved bytes. The immutable
[manifest](historical/manifest.json) records exact source fingerprints and raw/gzip
seals. Generated complete histories and authored from-save orders remain distinct.

Frozen34 rejects added patrol fields and commands. Older valid loads initialize
an empty register. Downgrading a campaign containing patrols is refused. Exact
old replay, independent continuations, mixed34→35 history, reopened IndexedDB and
portable archive recovery are covered by the new compatibility/persistence tests.

The initial focused run retained two failures in older tests that asserted a
current envelope was literally version34. Those modern-envelope expectations
now use `SAVE_VERSION`; their frozen historical assertions remain unchanged.
[Initial failures](compatibility-initial.log), [corrected 25-test run](compatibility.log).

## Scope and bounds

Two points, land combat armies ashore, ordinary movement and explicit pause/remove.
At most128 patrols/realm and8192 globally; at most8 route attempts/realm/turn,
with stable turn rotation. Active or paused routes, postings, transports, missions
and sieges take priority. Enabled patrols override theater dispatch. Removing or
pausing a patrol preserves routes already issued. No automatic attacks or wars.

The AI considers one spare peacetime patrol between nearby owned hearths. It
preserves scouts, caravans, leaders, specialists, existing assignments and its two
strongest field armies. At most two candidate armies, four candidate hearths and
four ordinary permitted previews bound adoption. Existing configured patrols,
including paused ones, are not rewritten. Each endpoint must be the current cell
or pass an ordinary permitted preview from it; later legs use normal bounded
routing and may pause or fail.

## Verification

The [final full suite](full-tests-final.log) passes **2,206 tests across 273 files
in 56.85 seconds**, with four workers and unchanged test limits. The corrected
historical fixture projection is included. No tests are disabled or skipped in
this final suite.

- [Typecheck](typecheck-final.log), [lint](lint-final.log),
  [content validation](content.log) and [production build](build-final.log) pass.
  The build retains upstream annotation and bundle-size warnings.
- Eleven distinct affected gameplay journeys pass across retained runs: three
  patrol, six posting-template and two group-posting cases. The
  [initial run](browser-initial.log) passed ten and failed the first patrol case
  after a Vite reload interrupted the registry click. A final AI source edit
  triggered that reload according to the session's server output; the retained
  trace records a second Vite connection/module load, and its error image shows
  the start screen.
  [Frozen-source rerun](browser-fixed.log): one pass in 10.8 seconds. The later
  [policy-update case](browser-policy.log) adds changing the checkbox on a paused
  patrol and passes in 14.0 seconds. No timeout or assertion was relaxed.
- [Built production](production.log): three journeys pass in 11.3 seconds on
  the final bundle. The generated patrol journey has no development hooks,
  makes actual movement, restores the exact manual save/archive, and exercises
  keyboard pause plus visible controls at 390px and 130% text scale.
- [Compatibility](compatibility.log): 25 tests across four files pass, including
  genuine old bytes, mixed history and reopened storage. The
  [first full suite](full-tests-initial.log) passed 2,200 tests and failed six
  synthetic pre-patrol migrations because their builder retained the future
  field. The helper now rejects nonempty patrols before omitting the empty field;
  [all 30 save tests pass](save-projection-fixed.log). Production historical
  schemas were not relaxed.
- [Scoped allocator benchmark](benchmark.json): one warmup and three
  identical-save samples; Huge has 1,500 patrols and Legendary has 4,000.
  Allocation medians are 4.588/6.281 ms, and all-realm patrol reports are
  0.591/1.785 ms. Each world makes 256/320 route attempts with no refusals and
  identical resulting hashes. These authored short routes exclude setup,
  loading, hashing, other turn phases, worker traffic and rendering.
- Independent [simulation/history review](integration-review.md) and
  [AI review](ai-review.md) found no blocking source findings. The
  [UI review](ui-review.md) identifies its author's own screenshot inspection;
  the parent also inspected the narrow action and final production enlarged-text
  captures. Controls and explanatory text remain readable within the scrolling
  window. The endpoint and action sections require separate vertical positions.

Environment: Node 26.7.0, pnpm 10.32.1, Chromium 154.0.8037.97 on Arch Linux.
Overlapping checks are not additive. Authored mature worlds do not prove organic
realm development. Browser screenshots are native, unedited captures; source and
image manifests identify the final local bytes.

[Source manifest](source-manifest.json), [native image manifest](image-manifest.json),
[prompt report](../prompt-reports/2026-10-24-land-patrols.md) and
[draft dispatch](dispatch-draft.md). The [final factual review](final-review.md)
checks the recorded outcomes and retains the wording corrections. The source manifest includes preserved
posting-template work from the preceding prompt and labels that cumulative scope.

## Campaign pacing

The [first pacing candidate](pacing-initial.json) completed the seed20260905
Standard-map/twelve-realm headline campaigns at Standard236, Long335 and Epic374,
against genuine rules34 results233/311/349. It submitted no refused orders and
its patrol route attempts had no refusals, but retained peacetime patrol companies
through subsequent wars. The implementation now offers a public saved
“Pause when war begins” policy. The [AI experiment](pacing-war-pause.json) choosing
that policy released its companies correctly but finished later: Standard243,
Long375 and Epic427. The winning realm changed on Long/Epic, and battle/war
counts rose; those observations do not isolate a single causal mechanism.
Keep the public player option but restore persistent home coverage as the AI
default. The [final remeasurement](pacing-final.json) reproduces Standard 236,
Long 335 and Epic 374 on the completed source. Prices and proxy bounds are unchanged;
the initial adverse Long result and rejected automatic-pause experiment remain
visible beside the favorable initial Epic result. Standard/Long both remain above
their approximate targets and DH-021 remains open, including the new Long drift.

| Headline pace | Frozen rules 34 | Final rules 35 | Difference | Patrol orders / route attempts / refusals |
| --- | ---: | ---: | ---: | ---: |
| Standard | 233 | 236 | +3 | 11 / 767 / 0 |
| Long | 311 | 335 | +24 | 11 / 521 / 0 |
| Epic | 349 | 374 | +25 | 12 / 526 / 0 |

All final campaigns end in Saltwind Remnant prosperity with no submitted or
automatic order refusals. Final hashes differ from the first candidate because
the canonical patrol now includes the explicit boolean policy. These are one
seed and one map/realm configuration, not broad balance acceptance. The
[historical readback](historical-pacing-readback.json) matches all three rules-34
campaign turns, paths, winners, hashes and complete command/event counts against
the genuine September baseline. Campaign wall times overlapped other checks and
are not performance certification.

## Remaining work

ACT-32/M3 remains in progress. Mobile escort, multiple-waypoint patrols, multi-step
programs, broader governors and organically developed mature-realm acceptance are
unfinished. Next, investigate AI patrol opportunity cost in the headline Long
campaign with fixed prices and multiple seeds before expanding delegation.
The existing DH-021 pacing issue and all fifteen release gates remain
open. No scope targets were removed, prices changed or proxy bounds relaxed.
