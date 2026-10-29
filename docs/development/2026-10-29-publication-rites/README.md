# Publication of rules 40 seam warding — 2026-10-29

Feature commit `e103a72` (seam warding, rules/save 40) and the follow-up
`52b8436` (drops the raw trace material that the stopped gameplay run had left
in the packet) are on `master` and deployed to
[GitHub Pages](https://erikburdett.github.io/Theandril/).

| Check | Result |
| --- | --- |
| Verify build (`40952896131`) and Publish development demo to Pages (`40952896044`) on `52b8436` | success ([actions.json](actions.json)); the runs for `e103a72` were superseded |
| `pnpm changelog:build` + `VITE_BASE_PATH=/Theandril/ pnpm build` from `52b8436` | pass ([log](build.log)) |
| `node scripts/verify-pages.mjs 52b8436 … --expect=docs/updates/seam-warding-release-expectations.json` | **passed** ([readback.json](readback.json), [log](readback.log), live screenshots alongside) |
| scoped live journeys | **not run**: the headless browser on this desktop was crashing on page start throughout the afternoon (see the [slice packet](../2026-10-29-seam-warding/README.md)); the read-only readback is the live verification for this publication |

No new developer dispatch was published; edition 23 remains the newest, and the
roadmap catalogue's evidence links still pin snapshot `cfd660c`. The DHARMA
tracker records the deployment and 102 of 150 acceptance points.

Note for review: `e103a72` carries 586 MB of unzipped trace screenshots in
history. Removing them needs a history rewrite of `master`, which was not
authorized; the follow-up commit removes them from the tree only.
