# Group patrol control implementation

24 October 2026. Local implementation in progress after published `24dab68`.
The user retains authorization to commit and deploy each verified feature.

Acceptance: use registry checks to pause enabled patrols, resume disabled patrols
and remove selected policies, preserving exact active/paused travel, army state,
unaffected/refused checks and ordinary saved command history. Expected-hash
validation and exact response correlation protect the player's current intent.

See [architecture decision](../../architecture/0051-group-patrol-controls.md).
Root owns main-thread integration, recovery journeys and integrated verification;
worker owner owns protocol, bounded execution and correlation; UI owner owns
controls/registry locks; browser owner owns genuine fixture and public gameplay.
No canonical simulation, AI, rule/save version, content or price change is planned.
Verification and publication results will be recorded only after they occur.

## Integrated local acceptance

All **2,339 tests / 285 files pass in 62.78 seconds**, with
`pnpm test --maxWorkers=4` ([log](full-tests.log)). [Typecheck](typecheck.log),
[lint](lint.log) and the [Pages-base build](build.log) pass. The focused UI and
worker counts overlap this full suite and are not additive. Initial authoring
failures and their corrections remain in the focused logs and owner reviews.

Seven affected production journeys pass on their first integrated run in
**44.5 seconds** ([log](browser-first.log)): one new normal workflow, three new
reply-failure recovery cases, and existing registry filtering, group travel and
group postings. All use public controls against the production build; development
hooks are absent. The normal case takes 9.0 seconds, functional execution metadata.

The authored 101-army fixture establishes 99 policies through ordinary commands.
Pause/Resume/Remove accept **49/99/99** orders and retain **52/2/2** unaffected
checked actors. Its exact archive grows **105 → 154 → 253 → 352** records, with
hashes `c6f43460 → acebff08 → f89dea4d → a488bb10`. Every army, active/paused
route and posting remains identical. Independent export checks, exact ordinary
journal/replay and manual saved restoration are in [browser review](browser-review.md)
and [source/image evidence](browser-evidence.json).

Three separate cases let the real worker change one patrol before deliberately
damaging its final reply or injecting its error event. The UI retains checks,
locks further play, restores the actual eight-record manual save and retries to
the correct nine-record history. These are client fault-injection cases, not
physical process-kill proof or manufactured canonical refusals. Genuine partial
canonical refusals and interrupted recording are covered by the worker tests.

Six exclusive Huge/Legendary 128-policy batches pass after an untimed Huge
fixture-verification run. [Raw results](worker-benchmark-results.json) retain
every single sample, scopes and source hashes. Request-through-response times
are **330.824–389.917 ms Huge** and **634.563–673.485 ms Legendary**. Each issues
128 ordinary records, one autosave and one final state, with no detail/path-query
request and exact mirror/replay/autosave. The existing nonempty route and all
armies remain identical. This executes the actual worker module in a same-thread
Node host with structuredClone and fake IndexedDB; it does not measure browser
Worker scheduling, physical storage, frame time, organic recruitment or percentile
latency. Ordinary local fog is retained rather than charting the whole map.

Rules/save remain **35** and content **015468d1**; no canonical rules, AI, campaign
prices or automatic turn behavior changed. No pacing rerun is warranted. All
fifteen release gates, DH-021, R06 and ACT-32/M3 remain open. Publication awaits
the reviewed implementation pin and its separate workflow/live verification.
