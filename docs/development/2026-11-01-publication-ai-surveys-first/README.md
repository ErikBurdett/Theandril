# Publication of the AI surveys before the march — 2026-11-01

Commit `07c58b6` (AI surveys before the march, and the characters-tree
journey's veteran) is on `master` and deployed to
[GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build and Publish development demo to Pages | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `07c58b6` | pass ([log](pages-build.log)) |
| `node scripts/verify-pages.mjs 07c58b6… --expect=docs/updates/ai-surveys-first-release-expectations.json` | **passed**: served HTML, JS, CSS and worker bytes equal the local build; the roadmap reads 154 delivered and 49 remaining acceptance points, unchanged by this fix; the game setup page loads without development hooks ([readback.json](readback/readback.json), live screenshots alongside; [log](readback.log)) |
| browser suites | none run for the deploy, per [`docs/TESTING.md`](../../TESTING.md); the slice's characters journeys and the chronicles journey are in [its own packet](../2026-11-01-ai-surveys-first/README.md) |

No new developer dispatch was published; edition 23 remains the newest. The
DHARMA tracker records the deployment; the count stays at 154 of 199.
