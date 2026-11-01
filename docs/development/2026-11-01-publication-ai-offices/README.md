# Publication of the AI offices — 2026-11-01

Commit `bd0fc2a` (AI offices) is on `master` and deployed to
[GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build and Publish development demo to Pages | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `bd0fc2a` | pass ([log](pages-build.log)) |
| `node scripts/verify-pages.mjs bd0fc2a… --expect=docs/updates/ai-offices-release-expectations.json` | **passed**: served HTML, JS, CSS and worker bytes equal the local build; the roadmap reads 154 delivered and 49 remaining acceptance points, 6 of 23 items complete, 14 in progress, 15 gates open; the game setup page loads without development hooks ([readback.json](readback/readback.json), live screenshots alongside; [log](readback.log)) |
| browser suites | none run for the deploy, per [`docs/TESTING.md`](../../TESTING.md); the slice's legitimacy and offices journeys and the chronicles journey are in [its own packet](../2026-11-01-ai-offices/README.md) |

No new developer dispatch was published; edition 23 remains the newest. The
DHARMA tracker records the deployment and 154 of 199 acceptance points.
