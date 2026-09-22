# Campaign-foundation publication review

## Verdict

**Approve the bounded development-journal publication changes.** No blocking source, factual or inspected-layout issue was found. Final production Pages verification passes, and the reviewer independently inspected all five retained publication screenshots. This is approval of a bounded development-journal change, not M0, DH-015, hosted CI, deployment success or any whole 1.0 gate.

The reviewer did not author these journal changes and did not run competing tests, benchmarks or browsers. The earlier inventory report is by this reviewer. Review compared the working publication changes with committed implementation checkpoint **`1e41ec24965e46e8035c57b4f54632a690b8b712`**, examined source and retained logs, and independently checked Git objects and asset hashes.

## Source and evidence identity

- The implementation checkpoint changes 248 files and contains all eight added regression files plus the four direct documentation-fixture inputs listed in [the inventory](inventory.md#exact-regression-dependency-closure). Naval fixture references resolve to the already committed compressed campaign saves. No untracked fixture is required to reproduce those tests from this checkpoint.
- The new dispatch explicitly pins `sourceRevision` to `1e41ec24965e46e8035c57b4f54632a690b8b712`. Every new dispatch evidence target exists as a real Git object at that revision.
- `libraryRevision` and `roadmapSnapshot.revision` use the same checkpoint. The shelf and scope links now pass that revision explicitly, preventing their current claims from resolving to the old default.
- The source text beginning with the existing sequence-3 dispatch through the end of `content.ts` is byte-identical to the committed file. All three historical stories retain their bodies, sequence/edition identities and original revision `8b3b8c148b7e8ee3689001210033fee7a1b8a6ef`. The global historical default was not rewritten.
- The current roadmap date is 21 September 2026. Rendering derives its display date from the snapshot in UTC, avoiding a stale hard-coded September 12 label.

## Claims and acceptance

The new story distinguishes the original paid-harbor/founder fixes from later movement, observation, save ordering, formatting and lazy-naval optimizations. Claims correspond to the retained checkpoint reports and scoped independent reviews. It does not describe the rejected hash/cache/heap experiments as production features or claim uniform campaign speedups from mixed query measurements.

The **1,857/1,858 headless result**, **64.779-second Epic failure against 60 seconds**, unsuccessful worker-cap diagnostics and unchanged acceptance budgets are prominent. The **25/25 affected gameplay** and **27/27 Pages** results are explicitly retained local checkpoint results with limited scope. No subsequent hosted-CI or deployment result is invented.

The campaign-review roadmap item remains `in-progress`; the two original naval findings move into its delivered detail while actual runtime and hosted integration proof remain open. Existing item IDs and complete/open distinctions are preserved. All fifteen whole release gates remain open. Client contracts, tribute, unification and subsequent roadmap milestones are explicitly future implementation. There is no new gameplay scope, percentage or 1.0 announcement.

The dispatch links the earlier draft work packet as a **pre-publication reviewed checkpoint**, so its historical lack of publishing authorization is not silently rewritten. The current user request separately authorizes publishing the development checkpoint.

## Images, provenance and layout code

The first four image records and all shared material records are unchanged from the committed metadata. Both source-side and downloadable provenance JSON files are byte-identical. The total journal image payload is **870,767 bytes**, below the unchanged three-MiB test budget.

| New image | Independent byte check |
| --- | --- |
| Technical ledger, 1440 × 1000 | Published PNG equals the exact committed screenshot, 505,160 bytes, SHA-256 `bf6c0c3924d3aa25ab8f2c186e0aed97a852489355eb62f805067beeda3cb799`. |
| Transport landing, 390 × 844 | Published PNG equals the exact committed screenshot, 217,703 bytes, SHA-256 `7dea9b20985e5f917910eb632281b2b796d11c7526c9d3f929e19c88f644f516`. |

The image preparation script copies the two PNGs without crop, resize or re-encoding and preserves the historical derivative workflow. Captions distinguish the generated Short campaign from the authored human-command naval regression and deny Epic/organic-AI inference appropriately. Both images have descriptive alt text and continue to use the existing labelled enlargement dialog and original-source link.

The new landing illustration has an article-specific `max-width: 390px`; it cannot be enlarged beyond the source width in the main article. Existing responsive width/height and dialog constraints remain in place. This source inspection does not substitute for inspection of the final browser layout or prove comprehensive accessibility.

## Regression integrity

No test was skipped or disabled, and no timeout, size budget, contrast requirement, overflow allowance or substantive assertion was relaxed. Asset-path validation now permits the two intentional PNGs while retaining path restrictions, checksums, provenance, alt/caption checks and the existing size budget.

The featured-story browser assertions and screenshot targets now follow the new entry. Existing desktop/narrow/text-scale dimensions, loaded-image checks, no-worker/no-error checks, contrast, search/filter recovery, keyboard skip and dialog journeys remain. The permanent-link journey additionally opens the historical campaign-safety story and checks its exact original evidence pin. Roadmap assertions now require the repaired harbor finding in delivered text while explicitly preserving the failed Epic duration and `in-progress` status.

The author-run focused journal log inspected at `/tmp/theandril-release-journal-tests-unsandboxed.log` reports **44/44 tests across 16 files**, 13.95 seconds. Two subsequent assertions check the rendered current-status and campaign-evidence links; their file passes **3/3** in `/tmp/theandril-release-journal-links.log`. The reviewer inspected those additions and both logs; overlapping counts are not combined. These results were not independently rerun by this reviewer. The parent owns permanent evidence retention and final typecheck/lint/build/browser verification. Initial whitespace validation also passes.

## Reviewed source hashes

| Source | SHA-256 |
| --- | --- |
| `apps/web/src/updates/content.ts` | `153c555755fbdcbbf40305237e848071637f7157adcfda9d68cc4e0acd51cb5c` |
| `apps/web/src/updates/library.ts` | `7ed6364bc0ad20b1e4184175a0bd4588618a131bcbdb39c6ac1d7b6927cfa783` |
| `apps/web/src/updates/Journal.tsx` | `20d3659be8afc40fa67f29ab418ff21a7d7dbaed98292ea2ce8de69d611291f9` |
| `apps/web/src/updates/Roadmap.tsx` | `814309abd354c33e73d1e29d5e2aa3bc280efd09adff8a1b74f00e85827cf54a` |
| `apps/web/src/updates/journal.css` | `e4482f5e7d0a79447c956ed141d5269a213045af841e8b125eb1b1cb626dbb1c` |
| Both image metadata files | `632d3132fbf6e72c551633fd2b806451201d14c21ef6e92383d6506123badfda` |
| `docs/updates/prepare-images.py` | `8a3ed85426130c5fefe74c20481f25b2622d4b4409b3fa34d13eeb85d74e0ba1` |
| `tests/gameplay/updates.spec.ts` | `8258d1c12240e46794df24ad111dfed1a10fd804db920577f77ba620308599db` |
| `tests/gameplay/home.spec.ts` | `05e66d97491885e94d9256489b39a441830667f6e77a724715e9ba9668e0bf79` |

## Final production browser and visual review

The parent-run [production Pages log](browser-pages.log) reports **27/27 cases passing in 28.8 seconds** against the rebuilt `/Theandril/` production bundle. Its checks include the new featured dispatch at desktop and narrow/text-scale settings, historical story/evidence navigation, search/empty-state recovery, keyboard skip and image-dialog focus, roadmap navigation, and actual built-game worker/assets/battle/map/save journeys. No browser check was rerun by this reviewer. This scoped Chromium production suite does not establish complete gameplay or cross-browser acceptance.

The reviewer opened all five retained images individually with `view_image`, compared each file with its named original Playwright output, independently recomputed SHA-256 values and read PNG dimensions. Every image matches [the provenance manifest](screens/provenance.json), with no transform or re-encoding. All initially reviewed source hashes above still match after the browser run; publication source remained frozen.

- [Desktop dispatch](screens/dispatch-desktop.png), **1440 × 1000**: the title, reviewed-checkpoint label, date, summary, navigation and opening takeaways are legible and aligned. The summary exposes the remaining Epic timing failure; the visible takeaways explicitly keep M0 and all fifteen gates open. The contents continue below the viewport without overlap.
- [Dispatch at 390 pixels and 130% text](screens/dispatch-390-130.png), **390 × 844**: navigation wraps across rows, the return link remains visible, and the long title wraps within the paper. The subtitle and article continue below the screenshot. No claim is made that this top-of-page capture simultaneously displays the whole article or its acceptance details.
- [Desktop landing illustration](screens/landing-desktop.png), **391 × 966** including its frame/caption: the game screenshot stays within its native-width article frame. The passenger's landing selector and Disembark army control are visible; the image-inspection control, caption and original-image link remain readable. The 391-pixel figure capture includes the surrounding rendered border/rounding; the source PNG remains exactly 390 pixels wide. The original gameplay panel continues below its own captured scroll position, as disclosed by the caption context.
- [Landing illustration at 390 pixels and 130% text](screens/landing-390-130.png), **292 × 880** for the whole figure: the screenshot scales down within the column while the HTML inspection control and caption enlarge and wrap correctly. Small text inside the screenshot is correspondingly small and does not respond to text scaling; the image-detail control, descriptive alt text and source-image link provide the existing inspection path. This is an illustrative image, not a replacement for accessible live game controls or proof of comprehensive accessibility.
- [Roadmap at 390 pixels and 130% text](screens/roadmap-390-130.png), **390 × 844**: title, introduction and bounded-completion explanation wrap within the page. The explicit “No overall 1.0 gate is signed off” text is readable. The capture ends as the completed-checkpoint legend begins; it does not purport to show all 23 rows or independently certify each gate.

Retained log SHA-256: `0985202812a70f25a330bb2c3e292ae221c2e3023ec3c4a451bfd90867c6c91e`. Screenshot provenance SHA-256: `146d8075f822955f185c3bbb0e3127038cf81d3f5b3b55d8921b98be0295a23b`.

No publication-layout correction is requested. The parent still owns Git publication and verification of the actual deployed revision, Actions results and public URLs. The unresolved full-suite performance evidence and release gates remain unchanged by this approval.
