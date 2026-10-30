# Publication of the warden fallback — 2026-10-29

Commit `d10c243` (appoint the warden when no battle stack can take a caster)
is on `master` and deployed to [GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build (`40979288935`) and Publish development demo to Pages (`40979288894`) | success ([actions.json](actions.json)) |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `d10c243` | pass ([log](build.log)) |
| `node scripts/verify-pages.mjs d10c243 … --expect=docs/updates/ai-wardens-release-expectations.json` | **passed** ([readback.json](readback.json), [log](readback.log), live screenshots alongside) |
| scoped live journeys | not run; the complete gameplay (249/251, two timeouts passing alone) and production (59/59) suites passed locally on this commit before publication, and the read-only readback is the live verification |

No new developer dispatch was published; edition 23 remains the newest. The
DHARMA tracker records the deployment and the measured pacing 385/343/229.
