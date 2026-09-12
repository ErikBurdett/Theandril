# A roadmap with a visible finish line

## Identity

- Stable entry slug: `a-readable-roadmap`
- Publication state: **draft** — outside the shipped dispatch catalog until independent review.
- Prepared: 2026-09-12.
- Gameplay evidence revision: `fcae402da6c290b93a9a6933510c74538477ad04`.
- Implementation revision: the commit containing this work packet; final publication is owned by the integrating maintainer.
- Campaign/save/content versions affected: none. Current gameplay remains rule/save 17.
- Categories: development helper, scope visibility, accessible public navigation.

## The player's problem

The development journal already explained substantial changes, their source evidence and selected open gates. A reader still had to assemble a practical roadmap from historical dispatches and long status documents. The home page's short scope list also used broad states such as “Current / partial” without distinguishing a delivered checkpoint from an entire unfinished release system.

The new roadmap lets a player or contributor answer three immediate questions: what has been delivered, what has a working foundation but needs more work, and what remains missing. It makes the existing accepted scope readable without changing the scope or inventing a release percentage.

## What changed

The public `/updates/roadmap/` page groups twenty-three items into four ordered stages. Six bounded foundations have checked **Completed** labels. Eleven partial systems/review items say **In progress**, and six missing systems or proof obligations say **Pending**. Labels are textual as well as symbolic; color is supplementary. All fifteen overall release gates remain open in their own complete reference below the roadmap.

Every item explains the player-visible behavior, shows the next remaining acceptance step and provides an expandable delivered/remaining/evidence record. Evidence points to real files at the immutable gameplay snapshot. A newcomer can search for “second-harbor” to find the current AI review work, or filter Pending and search “authoritative” to find the online-campaign obligation. “Gate M” matches the exact release gate rather than unrelated letters in prose.

Status/search state is retained in the URL. A stable item link clears unrelated filters, opens its evidence, scrolls and focuses the item, and remains usable after refresh. Empty search and outdated item links provide a recovery path. Home and shared navigation expose the roadmap, while the existing dispatch ledger links to the same catalog. The game continues to open its existing development helper without discarding the campaign.

`library.ts` owns this structured view beside the existing scope ledger. Historical dispatches retain their original claims and source pins. `DEFINITION_OF_DONE.md`, `GAME_1_0_SCOPE.md` and implementation status remain authoritative. No competing game rules, new simulation state, dependency or raster artwork is introduced.

## Scope and the road to 1.0

- No gameplay scope is added, cut or deferred out of the agreed release.
- Checked foundations advance named gates without declaring those gates complete.
- Open AI findings, archive costs, missing independent powers, full magic, broader diplomacy, online play and cross-browser proof stay visible.
- This improves the release-hygiene and contributor handoff surface. It does not finish a gameplay gate or certify performance.

## Verification and review record

- `pnpm typecheck`: pass.
- `pnpm lint`: pass.
- Journal plus site-tooling Vitest: **48/48 tests, 18 files**, including all evidence paths at their pinned Git revisions. The first sandbox attempt could not spawn read-only Git/Playwright children; the unrestricted rerun exposed one real gate-search failure, which was corrected and verified by the final passing run.
- `VITE_BASE_PATH=/Theandril/ pnpm build`: pass. Existing upstream Zod annotations and game main-chunk size warnings remain.
- Parent-run content validation: pass, unchanged content hash `b79c78ed`.
- Parent-run full `pnpm test`: **1,715/1,716 tests, 212/213 files passing**. The existing Epic chronicle-victory test exceeded its 60-second budget at 69.21 seconds, matching the previously documented parallel timing gate. It remains a failed check; no test is skipped, timeout weakened or simulation changed. This invocation overlaps the scoped journal suite and must not be added to it.
- Final production browser result: **27/27** rebuilt Pages cases in **43.4 seconds**, including all seven roadmap journeys and the existing game production checks. Roadmap coverage includes 390px/130% text, keyboard, filters, refresh, same-document and full-page Back/Forward, unknown items, evidence deep links and the sibling Hearth & Card link. This supersedes the narrower initial 19-case run rather than adding to it.
- Root deployment base: a separate `VITE_BASE_PATH=/ pnpm build` passes, and the same seven roadmap browser journeys pass **7/7 in 5.1 seconds** at `/updates/roadmap/`. The `/Theandril/` production build is restored afterward.
- Independent code, factual-claim and visual review: **approved** by the separate development-sites reviewer. All fifteen gate states and inspected desktop/narrow screenshots match the source. The reviewer found a real same-document browser-history issue after a stage/gate link and status change; a new regression reproduced stale filter state on Back. A `popstate` listener now restores filters and the linked item, while preserving explicit gate/stage destinations. The correction passed re-review and the expanded built-browser run. The integrating maintainer retains the separate signed-source review record.
- Real images: six unmodified Chromium screenshots are retained with capture settings and hashes in [roadmap evidence](../development/roadmap/README.md). The native desktop and 390px/130% views show actual UI, including pending rows and expanded review evidence. No new image has been added to the public media catalog; selection for a later dispatch remains editorial work.
- Publication/readback: pending parent-owned commit, CI and deployment verification.

## Contributor handoff

Update the relevant existing item when a playable slice closes one of its acceptance criteria. Keep the item ID stable, attach the actual evidence revision, reconcile the gate and current status, then independently review the change. A new idea should be identified as a proposal before becoming accepted release scope. Shared roadmap counts are calculated from the catalog and must never be presented as a whole-game completion score.
