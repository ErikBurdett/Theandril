# Saved two-point land patrols

## Prompt

“continue”, following project orientation and the reusable posting-template
checkpoint toward a complete 1.0.

## Delivered

An owned combat land army can now keep a saved two-point patrol through explored
hexes. Ordinary travel moves it between endpoints; selected orders show the next
point and actual blockers. Players can update, pause, resume or remove the
patrol, and may opt into pausing future assignments when war begins. Updating a
paused patrol preserves that pause. Existing travel is preserved and has its
own explicit cancellation control. Patrols do not attack or declare war.

Direct travel, postings, voyages, missions and sieges retain priority. Patrols
respect fog and normal route pauses. Healthy patrols leave generic idle alerts,
while stalled orders remain actionable. The AI adopts bounded home circuits
during peace, preserving its strongest field armies and other commitments.
Enabled patrols remain reserved through war; the optional public war-pause policy
also releases assignments correctly when explicitly selected.

## Changed

- Simulation: canonical patrol schemas, commands, allocation, private reports,
  theater priority, rules/save 35 and deterministic migration/projection.
- AI: bounded adoption and held-army propagation through conquest, specialists,
  arcane surveys, depots and naval planning.
- UI: army inspector, registry summaries, attention and real browser journeys.
- Chronicle/storage: genuine pre-change rules-34 fixtures, strict historical
  command/state handling, mixed replay and database reopen/export recovery.
- Tooling/records: allocator benchmark, patrol pacing counters, architecture
  0048, status/M3/performance records, source/image manifests and a draft dispatch.

Content remains **`015468d1`**. Existing posting-template changes are preserved.
Work remains uncommitted in the primary checkout on `master`, based on
`d06ba4bcbc7e64a0ba3aa26e2b7460d174bb4333`. The
[packet](../2026-10-24-patrols/README.md) records ownership and exact evidence.

## Verified

- [Full local suite](../2026-10-24-patrols/full-tests-final.log): **2,206 tests /
  273 files**, 56.85 seconds, four workers, unchanged test limits.
- [Initial gameplay](../2026-10-24-patrols/browser-initial.log),
  [frozen-source rerun](../2026-10-24-patrols/browser-fixed.log) and
  [policy update](../2026-10-24-patrols/browser-policy.log): **11 distinct affected
  journeys pass** across runs. The first run's one failure was a source-edit
  Vite reload interrupting a registry click; its trace and start-screen image
  remain. Unchanged replay/recovery assertions pass after source freeze. The
  revised lifecycle also proves a paused checkbox update stays paused.
- [Built production](../2026-10-24-patrols/production.log): **3 journeys**, 11.3
  seconds, no development hooks. Patrol movement, exact manual save/archive
  restoration, keyboard controls, 390px width and 130% text scale pass.
- [Compatibility](../2026-10-24-patrols/compatibility.log): **25 tests / 4 files**,
  genuine original bytes, independent continuations, mixed history and reopened
  storage. Six captured checkpoints retain the original manifest seal.
- [Typecheck](../2026-10-24-patrols/typecheck-final.log),
  [lint](../2026-10-24-patrols/lint-final.log),
  [content validation](../2026-10-24-patrols/content.log) and
  [build](../2026-10-24-patrols/build-final.log) pass. Upstream annotation and
  bundle-size build warnings remain.
- [Independent history/simulation review](../2026-10-24-patrols/integration-review.md)
  and [independent AI review](../2026-10-24-patrols/ai-review.md): no blocking
  source findings. UI author inspection and parent narrow/production inspection
  are distinguished in the [visual review](../2026-10-24-patrols/ui-review.md).
  The [final factual review](../2026-10-24-patrols/final-review.md) checks counts,
  pacing and evidence attribution; its wording corrections are applied.
- [Isolated benchmark](../2026-10-24-patrols/benchmark.json): Huge/Legendary
  authored worlds with 1,500/4,000 patrols; allocation medians **4.588/6.281 ms**,
  all-realm report medians **0.591/1.785 ms**, **256/320** route attempts with no
  refusals, identical hashes across three samples after one warmup.

Overlapping tests are not additive. The historical migration tests initially
retained a future field in their synthetic old-shape helper; the helper now
rejects nonempty patrols before omitting the empty field. Production historical
schemas remain strict. Initial failures and the corrected 30-test save run are
retained. Two modern-envelope expectations now use `SAVE_VERSION`; genuine old
fixture assertions remain version 34. War-policy fail-before checks and their
authored contact-fixture correction also remain in the packet.

## Not done / blocked / caveats

**Pacing is unresolved.** Final headline Standard/Long/Epic results are
**236/335/374 turns**, versus rules 34's **233/311/349**. All use seed 20260905,
the Standard map and twelve realms, ending with no submitted or automatic
refusals. **Long lengthened by 24 turns.** Epic is within 350–400, but Standard
and Long remain above approximate targets. An AI automatic-war-pause experiment
was rejected after **243/375/427**; the player option remains. This is one-seed
evidence, not a causal explanation or broad balance acceptance. Prices and
proxy test bounds are unchanged. [Final pacing](../2026-10-24-patrols/pacing-final.json)
and [historical readback](../2026-10-24-patrols/historical-pacing-readback.json).

**ACT-32/M3 and DH-021 remain open. All fifteen release gates remain open.**
No gameplay scope target was removed. Native images use an authored mature realm
and a generated production start; they do not prove organic large-empire play.
Short-route allocator timings exclude other turn phases, transfers, rendering,
worst-case route searches and sustained-memory acceptance. Campaign wall times
overlapped other checks and are not timing certification. No non-Chromium claim.

No commit, push, deployment, external tracker edit or public journal publication
was performed. The shipped journal stays pinned to reviewed published work; the
new illustrated dispatch remains draft under docs. Work was performed directly
in the primary checkout, so no publication sync was needed.

## Follow-ups

First investigate the Long-campaign patrol opportunity cost using fixed prices,
decision evidence and additional headline seeds. Keep the measured regression
visible rather than adjusting proxy bounds. Then continue M3's mobile escorts,
larger order programs, broader governor decisions and organic mature-realm
acceptance. Recurring trade, politics, deeper magic, the third victory path,
content breadth, online campaigns and full release certification remain in the
existing 1.0 scope. Publication requires its own reviewed, pinned journal update
and explicit authorization.
