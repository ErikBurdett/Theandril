# Publication of salvage from the ruins — 2026-11-01

Commit `4a60d10` (salvage from the ruins, rules/save 81) is on `master` and
deployed to [GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build and Publish development demo to Pages | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `4a60d10` | pass ([log](pages-build.log)) |
| `node scripts/verify-pages.mjs 4a60d10… --expect=docs/updates/salvage-release-expectations.json` | **passed**: served HTML, JS, CSS and worker bytes equal the local build; the roadmap reads 152 delivered and 49 remaining acceptance points, 6 of 23 items complete, 14 in progress, 15 gates open; the game setup page loads without development hooks ([readback.json](readback/readback.json), live screenshots alongside; [log](readback.log)) |
| browser suites | none run for the deploy, per [`docs/TESTING.md`](../../TESTING.md); the slice's salvage and conquest journeys and the chronicles journey are in [its own packet](../2026-11-01-salvage/README.md) |

No new developer dispatch was published; edition 23 remains the newest. The
DHARMA tracker records the deployment and 152 of 199 acceptance points.
