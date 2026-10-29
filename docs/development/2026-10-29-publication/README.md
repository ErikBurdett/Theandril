# Publication of rules 38–39 — 2026-10-29

Feature commit **a7a4c164abb0ae86915a5ae2d2b0e9299aa97eb2** is deployed on
[GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| GitHub workflows | both pass: Verify build 40942698196 and Publish development demo to Pages 40942698403 ([actions.json](actions.json)) |
| Exact local rebuild of the published revision | change feed regenerated from the pushed history ([feed log](feed-a7a4c16.log)) and the Pages subpath built ([build log](build-a7a4c16.log)); the tracked fallback feed was restored afterwards |
| Read-only live readback | passes: newest build-ledger SHA a7a4c16, exact local HTML/JS/CSS/worker bytes, production game setup without development hooks, dispatch 23 at source cfd660c, roadmap aggregate 101 delivered / 49 remaining / 15 open gates ([log](public-readback.log), [readback.json](public-readback/readback.json), [expectations](../../updates/attunement-release-expectations.json)) |
| Scoped live journeys (24 cases: home, roadmap, journal, developer navigation, battlefield, land commissions) | 18 pass on the first run ([log](live.log)). Two reruns of the six failures ([log](live-rerun.log), [log](live-rerun2.log)) leave five cases without a live pass: three journal screenshots fail at capture (`Unable to capture screenshot`) with the page fully rendered in the retained snapshots, one dispatch permalink assertion and one generated land-commission case; the battlefield case passed on the second rerun after `Page crashed`. The same specs pass against the identical local bundle in the complete production suite ([log](../2026-10-29-full-production/production.log)); the live failures carry browser-crash signals from a desktop in active use and are recorded as unverified live cases, not as site defects |

The public journal keeps edition 23 (source cfd660c); no new dispatch was
published with this feature deployment. The roadmap catalogue text describes the
new slices without linking uncommitted evidence; its evidence links can move to
this revision in a reviewed dispatch.
