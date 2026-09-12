# Roadmaps for both games and a Hearth & Card development helper

## Prompt

Inspect Theandril and Theandril: Hearth & Card, extend the recent development helper with clear roadmaps whose completed items are checked and whose remaining items are Pending or In progress, implement a Hearth & Card-specific helper, and push both repositories for deployment.

## Delivered

- [Theandril roadmap](https://erikburdett.github.io/Theandril/updates/roadmap/): 23 source-linked checkpoints, with 6 Completed, 11 In progress and 6 Pending. The 15 overall release gates remain explicitly open. Home, shared navigation and the existing journal expose the same catalogue.
- [Hearth & Card development helper](https://erikburdett.github.io/theandril-hearth-and-card/updates/): a current-state overview, reviewed change summaries, contributor/source guides and a build-generated first-parent Git change ledger.
- [Hearth & Card roadmap](https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/): 26 checkpoints, with 12 Completed, 5 In progress and 9 Pending. One typed catalogue also generates `docs/ROADMAP.md`; CI rejects site/document drift. Later ideas are separated from release acceptance.
- Both offer status/search filters, item links, explicit completion limits, evidence and remaining acceptance. H&C's Ledger and phone menu link to its helper; both sites link to the sibling roadmap.

## Changed

- Theandril: `apps/web/src/updates/` catalogue, page, shared navigation and styles; static Vite entry; roadmap unit/browser cases and Pages contracts; status/contribution documentation; `docs/development/roadmap/` evidence and a reviewed draft dispatch work packet.
- H&C: `src/development/`, three `updates/` HTML entries, Git/checklist build script and CI integration; game links; source/status documentation; browser and evidence tests. The production smoke now waits for actual card image completion and can run directly against `PAGES_SMOKE_URL`.
- No simulation rules, save schemas, stable content IDs or original art changed. The existing game URLs are retained.

## Verified

The local evidence and independent review are retained in [Theandril's verification record](../roadmap/verification.json), [independent review](../roadmap/independent-review.md), and [H&C's verification record](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/main/docs/development/VERIFICATION.md).

- Theandril: typecheck, lint, content validation (`b79c78ed`) and build pass; scoped unit/tooling tests **48/48**; complete production Pages suite **27/27**; root-base roadmap scenarios **7/7**. Existing art validation passed for **545** approved/candidate manifests, with no new approvals. Full headless checkpoint: **1,715/1,716**, with the existing Epic archive test exceeding its unchanged 60-second limit.
- H&C: full restored-source unit/content/art suite **102/102** across 16 files, complete Chromium gameplay **38/38**, local production-subpath checks **4/4**, plus build, typecheck, formatting and roadmap consistency. Source archives were restored with their committed SHA-256 checks; no native-tool run was invented.
- Live Theandril verification: **8/8**, covering all roadmap journeys and game-to-helper navigation. [Live log](../roadmap/live-browser.log).
- Live H&C verification: **4/4**, covering helper behavior/save independence and the actual production game/card art. [Live record](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/main/docs/development/DEPLOYMENT.md).
- Independent code, factual and screenshot review approved both sites. Theandril's same-document Back/Forward defect was reproduced, fixed and regression-tested. H&C's enlarged heading, filter labelling and image-readiness test corrections are recorded in its verification notes.

Publication readback for the functional changes:

| Repository | Published revision | Hosted result |
| --- | --- | --- |
| Theandril `master` | [`11b6c47`](https://github.com/ErikBurdett/Theandril/commit/11b6c47635d400362f86b29255cdb2bc290356fe) | [Pages succeeded](https://github.com/ErikBurdett/Theandril/actions/runs/34722854113); live roadmap/game navigation passed |
| H&C `main` | [`bae1c4c`](https://github.com/ErikBurdett/theandril-hearth-and-card/commit/bae1c4c27a6c571c93af5d2fa9d84b5fc7709a25) | [Checks succeeded](https://github.com/ErikBurdett/theandril-hearth-and-card/actions/runs/34723245367), [Pages succeeded](https://github.com/ErikBurdett/theandril-hearth-and-card/actions/runs/34723494221); live helper/game checks passed |

This report and the live-smoke test correction are follow-up records; the table pins the exact functional publication and its evidence rather than predicting a reporting commit's hash. Subsequent ordinary builds refresh both Git change feeds automatically.

Theandril's primary checkout `/home/telephoneheater/Work/Theandril` is on `master` at the published change. H&C's primary checkout `/home/telephoneheater/Projects/theandril-hearth-and-card` was fast-forwarded onto `main` at its published change; its prior dependency staging branch remains available. H&C was implemented in an isolated worktree. The unrelated dirty art reports in `/home/telephoneheater/Work/Theandril-release` were untouched.

## Not done / caveats

- This is a development-site release, not either game's 1.0 acceptance.
- Theandril's separate [Verify campaign run](https://github.com/ErikBurdett/Theandril/actions/runs/34722854132) passed **1,712/1,716** tests and timed out in four existing cases: Epic archive victory, Standard/24 contact, Huge/32 contact and Epic pacing. Its independent Pages workflow passed. No test timeout, assertion, simulation or release gate was relaxed. [Hosted failure log](../roadmap/hosted-campaign-failures.log).
- Browser review uses Chromium and emulated narrow/text-scale layouts. Physical phones and other browsers remain open.
- Theandril's substantial-work dispatch is prepared and independently reviewed in `docs/updates/roadmap-work-packet.md`; it remains outside the illustrated public dispatch catalogue. The roadmap itself and automatic commit ledger are public.
- Suite totals overlap; do not add unit subsets or local/live browser runs into a larger unique count. Terminal evidence logs retain original result text. Hosted Theandril logs remove terminal color escapes and trailing whitespace; H&C text copies normalize trailing whitespace only.

## Follow-ups

Maintain each game's existing roadmap catalogue as features change, with exact evidence and acceptance boundaries. Theandril's campaign timing and remaining 1.0 gates, and H&C's tactical depth, human balance, device coverage and scope decisions, remain visible development work rather than silently added tasks for this prompt.
