# Publication of legitimacy — 2026-11-01

Commit `62f736e` (legitimacy, rules/save 82) is on `master` and deployed to
[GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build and Publish development demo to Pages | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `62f736e` | pass ([log](pages-build.log)) |
| `node scripts/verify-pages.mjs 62f736e… --expect=docs/updates/legitimacy-release-expectations.json` | **passed**: served HTML, JS, CSS and worker bytes equal the local build; the roadmap reads 153 delivered and 49 remaining acceptance points, 6 of 23 items complete, 14 in progress, 15 gates open; the game setup page loads without development hooks ([readback.json](readback/readback.json), live screenshots alongside; [log](readback.log)) |
| browser suites | none run for the deploy, per [`docs/TESTING.md`](../../TESTING.md); the slice's legitimacy, taxes and unrest journeys and the chronicles journey are in [its own packet](../2026-11-01-legitimacy/README.md) |

No new developer dispatch was published; edition 23 remains the newest. The
DHARMA tracker records the deployment and 153 of 199 acceptance points.
