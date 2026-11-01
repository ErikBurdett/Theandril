# Publication of the held-ferry fix — 2026-10-31

Commit `dc548dd` (a held ferry puts its passengers ashore) and its correction
`a0e97a7` (the roadmap bullet moved from the item's remaining list to its
delivered list, where the roadmap test had caught it) are on `master`;
`a0e97a7` is deployed to [GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build and Publish development demo to Pages | success for both commits ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `a0e97a7` | pass ([log](pages-build.log)) |
| `node scripts/verify-pages.mjs a0e97a7… --expect=docs/updates/ferry-ashore-release-expectations.json` | **passed**: served HTML, JS, CSS and worker bytes equal the local build; the roadmap reads 130 delivered and 49 remaining acceptance points, 6 of 23 items complete, 14 in progress, 15 gates open; the game setup page loads without development hooks ([readback.json](readback/readback.json), live screenshots alongside) |
| browser suites | none run for the deploy, per [`docs/TESTING.md`](../../TESTING.md); the slice's chronicles journey is in [its own packet](../2026-10-31-ferry-ashore/README.md) |

The first commit was pushed with the roadmap test failing on the misplaced
bullet; the correction followed within minutes and no other check was
affected. No new developer dispatch was published; edition 23 remains the
newest. The DHARMA tracker records the deployment, 130 of 150 acceptance
points and the unchanged pacing 395/302/203.
