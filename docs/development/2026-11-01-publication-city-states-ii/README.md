# Publication of the second city-state roster — 2026-11-01

Commit `9bb719b` (the second city-state roster, rules/save 69) is on
`master` and deployed to [GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build and Publish development demo to Pages | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `9bb719b` | pass ([log](pages-build.log)) |
| `node scripts/verify-pages.mjs 9bb719b… --expect=docs/updates/city-states-ii-release-expectations.json` | **passed**: served HTML, JS, CSS and worker bytes equal the local build; the roadmap reads 138 delivered and 49 remaining acceptance points, 6 of 23 items complete, 14 in progress, 15 gates open; the game setup page loads without development hooks ([readback.json](readback/readback.json), live screenshots alongside) |
| browser suites | none run for the deploy, per [`docs/TESTING.md`](../../TESTING.md); the slice's covering journeys and the chronicles journey are in [its own packet](../2026-11-01-city-states-ii/README.md) |

No new developer dispatch was published; edition 23 remains the newest. The
DHARMA tracker records the deployment, 138 of 150 acceptance points and the
measured pacing 380/296/197.
