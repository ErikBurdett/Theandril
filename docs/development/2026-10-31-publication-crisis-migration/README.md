# Publication of the migration a crisis leaves behind — 2026-10-31

Commit `afb4b63` (the migration a crisis leaves behind, rules/save 55) is on
`master` and deployed to [GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build and Publish development demo to Pages | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `afb4b63` | pass ([log](pages-build.log)) |
| `node scripts/verify-pages.mjs afb4b63… --expect=docs/updates/crisis-migration-release-expectations.json` | **passed**: served HTML, JS, CSS and worker bytes equal the local build; the roadmap reads 123 delivered and 49 remaining acceptance points, 6 of 23 items complete, 14 in progress, 15 gates open; the game setup page loads without development hooks ([readback.json](readback/readback.json), live screenshots alongside) |
| browser suites | none run for the deploy, per [`docs/TESTING.md`](../../TESTING.md); the slice's covering journeys and the chronicles journey are in [its own packet](../2026-10-31-crisis-migration/README.md) |

No new developer dispatch was published; edition 23 remains the newest. The
DHARMA tracker records the deployment, 123 of 150 acceptance points and the
measured pacing 408/275/215.
