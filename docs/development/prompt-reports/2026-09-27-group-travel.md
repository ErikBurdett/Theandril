# Group travel and verified deployment

## Prompt

“continue” — continue Theandril toward 1.0 under the existing development and
deployment authorization, using the DHARMA briefing and repository skills.

## Delivered

Review a shared destination for up to 128 checked or recalled land armies ashore,
then apply ordinary routes, append waypoints, resume paused journeys or cancel
routes. Individual control and standing postings remain. Refusals stay selected;
accepted outcomes report what actually happened. Stale reviews cannot apply, and
uncertain worker replies require saved restoration. No new simulation rule,
content price, AI policy or save version is introduced.

[Dispatch 11](https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=group-travel)
and the existing roadmap are published with source
`3b0918999a166f36f6f3d51fbcb49413de549163`. Gameplay/publication checkpoint:
`7dfe0c6a587e019eeec2501d21d212928f6e0918`.

## Changed

- Registry travel UI, worker/protocol batching, preview/result request ledgers and
  main-thread recovery; ordinary canonical movement remains in `packages/sim`.
- Meaningful UI/worker/response checks and actual-control gameplay/production
  journeys, representative worker harness, native captures and independent reviews.
- ADR0044, canonical status/performance/M3 notes, reviewed journal/catalogue,
  and guarded ACT-32/M3 tracker progress. ACT-36 done, DH-020 resolved and DH-021
  open are preserved.

## Verified

- [Final full suite](../2026-09-26-group-travel/publication-tests.log): **2,000 tests /
  250 files**, 53.68 seconds. Typecheck, lint, content/art validation and Pages build pass.
- [Affected run](../2026-09-26-group-travel/browser-final.log)21 plus
  [focused follow-up](../2026-09-26-group-travel/browser-focused.log)6 with four
  overlaps: **23 distinct gameplay journeys**, including eight new travel cases.
- [33 local Pages](../2026-09-26-group-travel/publication-pages.log),
  [33 live Pages](../2026-09-26-group-travel/live-pages.log) and a separate
  generated-production journey pass. Counts overlap and are not additive totals.
- [Four worker samples](../2026-09-26-group-travel/worker-movement-benchmark-final.log)
  verify serial archives, replay, autosave and permitted fog. These authored
  short-route samples are not percentile, renderer or organic mature-campaign proof.
- [Deployment](../2026-09-26-group-travel/deployment.json) and
  [live readback](../2026-09-26-group-travel/live-readback.json) bind the exact
  GitHub workflows, game/worker/image bytes, source links and all roadmap records.
  [Independent reviews and retained failures](../2026-09-26-group-travel/README.md)
  distinguish corrected fixture/capture/helper failures from gameplay behavior.
- [Tracker readback](../2026-09-26-group-travel/tracker-readback.json) matches the
  reviewed output hashes; the normal DHARMA build passed. Work used the user's
  primary checkout on `master`, synchronized with `origin/master` at the verified
  publication. This follow-up report records evidence without changing runtime.

## Not done / caveats

ACT-32/M3 and all fifteen 1.0 release gates remain open. Rules/save32 and content
`015468d1` are unchanged. No new pacing measurement is claimed. The authored
hundred-army gallery and four worker samples do not establish an organically
mature realm, maximum path-search cost, sustained memory or cross-browser acceptance.

## Follow-ups

Continue the existing M3 scope through bounded theaters, patrol/escort roles,
reusable army orders or broader governors, preserving ordinary command authority,
individual override and saved continuation. Combined mature-realm acceptance,
Standard/Long pacing and wider release gates remain separate work.
