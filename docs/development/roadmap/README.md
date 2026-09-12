# Public roadmap verification

Prepared 2026-09-12 against gameplay snapshot `fcae402da6c290b93a9a6933510c74538477ad04`; no gameplay, content-rule or save/schema changes. [Verification and source hashes](verification.json) describe the local implementation postimage. [Work packet](../../updates/roadmap-work-packet.md) contains the authoring and review record.

- Root typecheck and lint: pass.
- Journal and site-tooling suite: 48/48 tests in 18 files, including actual immutable Git object resolution.
- Parent-run content validation: pass, unchanged hash `b79c78ed`.
- Parent-run full headless suite: 1,715/1,716 tests, 212/213 files passing. [Unmodified output](full-headless.log) retains the existing Epic chronicle-victory 60-second budget failure at 69.21 seconds. No test is skipped or weakened. This invocation overlaps the journal subset.
- Pages production build: pass with existing Zod annotation and main game-chunk warnings.
- Rebuilt complete Pages browser suite: 27/27, 43.4 seconds; seven roadmap journeys, the established public-site journeys and actual-game production checks.
- Ordinary root-path production build and all seven roadmap journeys: pass, 7/7 in 5.1 seconds. The Pages build was restored afterward for publication review.
- Independent source/content/visual review: approved after the same-document history correction. The separate integrating maintainer retains the cross-project reviewer report.

The history regression was first reproduced against the pre-fix bundle: after a stage link and Pending filter, Back restored the old URL but left “All items” unselected. The retained final test restores both filters and linked-item disclosures on Back/Forward. It also verifies that the linked item can disappear under a Completed filter, reappear focused with open evidence on Back, and disappear again on Forward.

## Real browser images

These are untouched Playwright PNGs from the final `/Theandril/` production build in Chromium, with viewport/text scale encoded in their names. [Capture manifest and SHA-256 hashes](screens.json) preserve exact image bytes. Desktop and narrow inspection found legible status text, visible completed checkmarks, working disclosures and no horizontal overflow. A screenshot demonstrates layout only; it does not certify the full game or a release gate.

- [Desktop roadmap](screens/roadmap-1440-100-top.png), [expanded acceptance](screens/roadmap-1440-100-open-item.png), [pending systems](screens/roadmap-1440-100-pending.png).
- [390px / 130% roadmap](screens/roadmap-390-130-top.png), [expanded acceptance](screens/roadmap-390-130-open-item.png), [pending systems](screens/roadmap-390-130-pending.png).

The full Pages suite also regenerates two pre-existing compendium screenshot files in their historical directory. Those test side effects were restored rather than rewriting historical evidence in this change. Only the new roadmap images above are retained here.

Publication, GitHub CI results and live readback are owned by the integrating maintainer. Neither a deployment nor these scoped helper checks clears the fifteen open Theandril 1.0 gates.
