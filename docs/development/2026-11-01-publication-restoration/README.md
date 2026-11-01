# Publication of restoration — 2026-11-01

Commit `1ce53d2` (restoration, rules/save 80) is on `master` and deployed to
[GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build and Publish development demo to Pages | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `1ce53d2` | pass ([log](pages-build.log)) |
| `node scripts/verify-pages.mjs 1ce53d2… --expect=docs/updates/restoration-release-expectations.json` | **passed**: served HTML, JS, CSS and worker bytes equal the local build; the roadmap reads 150 delivered and 49 remaining acceptance points, 6 of 23 items complete, 14 in progress, 15 gates open; the game setup page loads without development hooks ([readback.json](readback/readback.json), live screenshots alongside; [log](readback.log)) |
| browser suites | none run for the deploy, per [`docs/TESTING.md`](../../TESTING.md); the slice's restoration, unrest and conquest journeys and the chronicles journey are in [its own packet](../2026-11-01-restoration/README.md) |

No new developer dispatch was published; edition 23 remains the newest. The
DHARMA tracker records the deployment and 150 of 150 acceptance points.
