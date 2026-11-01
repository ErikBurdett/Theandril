# Publication of the city-state kinds — 2026-11-01

Commit `5b15480` (the follow-up that fixed the kinds hire test and filled the
packet's figures; the kinds themselves, rules/save 77, landed in `d369bfc`)
is on `master` and deployed to [GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build and Publish development demo to Pages | success on `5b15480` ([actions.json](actions.json)); the `d369bfc` Verify build was cancelled by the follow-up push, its Pages publish succeeded and was superseded |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `5b15480` | pass ([log](pages-build.log)) |
| `node scripts/verify-pages.mjs 5b15480… --expect=docs/updates/kinds-release-expectations.json` | **passed**: served HTML, JS, CSS and worker bytes equal the local build; the roadmap reads 147 delivered and 49 remaining acceptance points, 6 of 23 items complete, 14 in progress, 15 gates open; the game setup page loads without development hooks ([readback.json](readback/readback.json), live screenshots alongside; [log](readback.log)) |
| browser suites | none run for the deploy, per [`docs/TESTING.md`](../../TESTING.md); the slice's covering journeys and the chronicles journey are in [its own packet](../2026-11-01-city-state-kinds/README.md) |

No new developer dispatch was published; edition 23 remains the newest. The
DHARMA tracker records the deployment and 147 of 150 acceptance points.
