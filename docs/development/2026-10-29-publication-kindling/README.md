# Publication of rules 42 seam kindling — 2026-10-29

Commit `c774ab9` (seam kindling, rules/save 42, plus the post-publication
browser record of the rules 41 checkpoint) is on `master` and deployed to
[GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build (`40967049829`) and Publish development demo to Pages (`40967049727`) | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `c774ab9` | pass ([log](build.log)) |
| `node scripts/verify-pages.mjs c774ab9 … --expect=docs/updates/seam-kindling-release-expectations.json` | **passed** ([readback.json](readback.json), [log](readback.log), live screenshots alongside) |
| scoped live journeys | not run; the complete gameplay (251/251) and production (59/59) suites passed locally on this commit before publication, and the read-only readback is the live verification |

No new developer dispatch was published; edition 23 remains the newest, and the
roadmap catalogue's evidence links still pin snapshot `cfd660c`. The DHARMA
tracker records the deployment and 104 of 150 acceptance points.
