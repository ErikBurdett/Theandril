# Publication of the AI glass surveys and save repairs — 2026-10-30

Commit `ae88204` (AI surveys the Ashfall glass; two save-load repairs) is on
`master` and deployed to [GitHub Pages](https://erikburdett.github.io/Theandril/).
GitHub Actions reported degraded performance that afternoon; the deploy job
waited about twenty minutes in its queue before running.

| Check | Result |
| --- | --- |
| Verify build (`41100410619`) and Publish development demo to Pages (`41100410673`) | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `ae88204` | pass ([log](pages-build.log)) |
| `node scripts/verify-pages.mjs ae88204 … --expect=docs/updates/ai-glass-surveys-release-expectations.json` | **passed**: served HTML, JS, CSS and worker bytes equal the local build; the roadmap reads 107 delivered and 49 remaining acceptance points, 6 of 23 items complete, 15 gates open; the game setup page loads without development hooks ([readback.json](readback.json), [log](readback.log), live screenshots alongside) |
| browser suites | none run for the deploy, per [`docs/TESTING.md`](../../TESTING.md); the slice's covering journeys and the `@scale` checkpoint are recorded in its own packets |

No new developer dispatch was published; edition 23 remains the newest. The
DHARMA tracker records the deployment, 107 of 150 acceptance points and the
measured pacing 354/316/224.
