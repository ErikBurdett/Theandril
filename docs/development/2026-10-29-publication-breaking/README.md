# Publication of rules 41 ward breaking — 2026-10-29

Commit `b7b99c0` (ward breaking, rules/save 41) is on `master` and deployed to
[GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build (`40955664445`) and Publish development demo to Pages (`40955664452`) | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `b7b99c0` | pass ([log](build.log)) |
| `node scripts/verify-pages.mjs b7b99c0 … --expect=docs/updates/ward-breaking-release-expectations.json` | **passed** ([readback.json](readback.json), [log](readback.log), live screenshots alongside) |
| scoped live journeys | **not run**: the headless browser on this desktop failed to start the campaign worker or crashed on every attempt during the slice (see the [slice packet](../2026-10-29-ward-breaking/README.md)); the read-only readback is the live verification |

No new developer dispatch was published; edition 23 remains the newest, and the
roadmap catalogue's evidence links still pin snapshot `cfd660c`. The DHARMA
tracker records the deployment and 103 of 150 acceptance points.
