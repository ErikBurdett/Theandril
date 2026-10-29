# Publication of the AI wardens slice — 2026-10-29

Commit `f747c50` (AI wardens: reaching hearth rites in organic play) is on
`master` and deployed to [GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build (`40973023463`) and Publish development demo to Pages (`40973023493`) | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `f747c50` | pass ([log](build.log)) |
| `node scripts/verify-pages.mjs f747c50 … --expect=docs/updates/ai-wardens-release-expectations.json` | **passed** ([readback.json](readback.json), [log](readback.log), live screenshots alongside) |
| scoped live journeys | not run; the complete gameplay (250/251, the one import timeout passing alone) and production (59/59) suites passed locally on this commit before publication, and the read-only readback is the live verification |

No new developer dispatch was published; edition 23 remains the newest, and the
roadmap catalogue's evidence links still pin snapshot `cfd660c`. The DHARMA
tracker records the deployment and 105 of 150 acceptance points.
