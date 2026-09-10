# Theandril developer dispatches — design reference

## Decision

**An Explore journal with Decide/Learn articles, not a dashboard.** Give one important change visual priority, then explain what changed, why, how to inspect it, and what remains unfinished. The owner should be able to review a development decision; a contributor should be able to find its implementation and reproduce its evidence.

Use **Theandril · Developer dispatches** as the plain-language identity. Keep this public journal separate from the in-game **Campaign journal** and **Campaign chronicles**, which describe an individual campaign. Dates are real publication dates, not invented in-world dates. “Road to 1.0” means an evidence-backed account of the existing release scope, not a completion percentage or a newly enlarged promise.

This document specifies a direction for the integration owner; it does not implement or publish a site. Reference checkout: `/home/telephoneheater/Projects/theandril-hearth-and-card`, read-only at `57d42fe`. Target: `/home/telephoneheater/Work/Theandril-release`, `feat/developer-dispatches`, inspected at `8b3b8c1`. Evidence was gathered on 2026-09-09 (America/Chicago).

## What the references actually show

### Hearth & Card: borrow the materials and reading hierarchy

Read the reference's `AGENTS.md`, `README.md`, `docs/IMPLEMENTATION_STATUS.md`, `.agents/skills/hearth-visual-design/SKILL.md`, `docs/WORLD_AND_SETS.md`, and actual UI/CSS. Its existing production `dist` was served without rebuilding or editing it. The visible cascade matters: old green/felt descriptions and earlier CSS declarations are not the final walnut interface.

- **Room versus document:** the tavern is an illuminated room; UI is a dark bound object placed over it. Brown timber, small candle/brass highlights, cream lettering, and recessed shadows carry the identity. See [actual tavern](reference-evidence/hearth-tavern-desktop.png).
- **Bound volume:** the grimoire has a double brass perimeter, a dark spine/inset shadow, two restrained corner ornaments and a clear serif title. Controls are short embossed plaques, not floating glass pills. See [actual binder](reference-evidence/hearth-binder-desktop.png).
- **Art is framed evidence:** each card painting appears once, contained in a dark art window, with title/rules on pale stock. The frame is not a blurred duplicate of the image. `src/ui/CardView.tsx` and the `.full-card-art`/`.full-art-card` rules are the implementation references; the inspected element computes `object-fit: contain`.
- **A reading spread, not just a catalog:** `src/ui/SetLibrary.tsx` separates an illustration, a historical question/account, an explicit uncertainty note, and an adjacent practical interpretation. `src/ui/CardDetail.tsx` adds chapter attribution, collector marginalia and a separate keeper's note. See [set-history entry](reference-evidence/hearth-set-histories-desktop.png) and [scrolled reading spread](reference-evidence/hearth-reading-spread-desktop.png). Transfer this fact / interpretation / uncertainty separation to development prose.
- **Do not transfer the game's browsing grid or tiny UI type.** A card binder needs repeated collectible objects; a developer journal needs an argument and a chronological reading path. The reference's 11px uncertainty text is not an appropriate size for important release limitations.

Source anchors: `src/ui/style.css:1–95` (font stacks/type); `src/ui/ornate-tome.css:1–63` (bound shell/corners); `src/ui/tome-materials.css:1–98,323–367,433–436` (materials and final overrides); `src/ui/SetLibrary.tsx:67–109` (account, uncertainty, practical aside). Computed values are retained in [material evidence](reference-evidence/hearth-computed-materials.json) and [editorial structure](reference-evidence/hearth-editorial-structure.json).

### No Man's Sky: borrow editorial scale, not its identity

The live release archive gives major updates large illustrated horizontal entries with an adjacent synopsis, while minor patches occupy smaller, text-dense cells. **It really does use a patch grid**; do not copy that grid into this journal. Transfer only the distinction between a substantial illustrated dispatch and a terse maintenance note.[1] See [archive opener](reference-evidence/nms-release-log-top.png) and [major/minor transition](reference-evidence/nms-release-log-rows.png).

The inspected *Worlds Part II* page opens with a large illustrated update identity, then treats individual changes as chapters: a strong heading, brief explanatory copy and a large image that demonstrates the subject. Its landscape chapter leaves the picture substantially more space than the caption.[2] See [update opener](reference-evidence/nms-worlds-ii-hero.png) and [feature chapter](reference-evidence/nms-worlds-ii-feature.png).

The page's actual heading structure moves through named feature explanations before the detailed versioned patch notes; a reader can consume the illustrated narrative without first reading every fix.[2] The transferable rule is **show the consequence, explain the decision, then expose the technical detail**. Theandril should provide a visible “Technical changes” anchor near the beginning rather than making contributors traverse an enormous promotional page. [Retained structure](reference-evidence/nms-worlds-ii-structure.json).

Do not reuse NMS screenshots as Theandril art, its branded title treatment, sci-fi type, blue material palette, wording, purchase blocks, or page length. The web screenshots here are research evidence only; keep them outside the deployed public asset payload. No proprietary artwork or text is proposed for the journal.

## Exact Theandril materials to reuse now

These files already exist in the target. **Do not recopy a sibling art catalog or create a new art pipeline.** The three runtime WebPs were checked against their retained hashes and the reference's current optimized files: all are byte-identical. They total **68,784 bytes**; they are DOM materials, not three new gameplay illustrations or Pixi atlas assets.

| Existing target path | Native size / bytes | Visible role and direction |
| --- | --- | --- |
| `apps/web/public/ui/hearth-card/wood.webp` | 512×512 / 36,532 | Broad walnut boards, carved corner work and brass pins. Use on the outer masthead/perimeter under a dark wash, not untreated behind paragraphs. |
| `apps/web/public/ui/hearth-card/parchment.webp` | 512×512 / 30,180 | Cream/ochre stock, worn edges, visible fibers/speckling and corner ornament. Use behind a quiet reading wash; it is not a seamless-paper guarantee. |
| `apps/web/public/ui/hearth-card/ornament.corner-idle.webp` | 128×128 / 2,072 | Transparent L-shaped gold foliage with small colored jewel accents. Use one static corner on the opening folio, with reserved space; no decorative symbol needs invented lore. |

Source equivalents are `public/art/optimized/materials/{wood,parchment}.webp` and `public/art/optimized/animation/ornament.corner-idle.webp` in Hearth & Card. The source CSS still names PNGs; the existing build resolves optimized WebPs. Reuse the target's actual runtime URLs, not absent PNG source paths.

Provenance: [existing import/review record](../../art/reviews/slice25-hearth-materials.json), `assets/art/source/hearth-card-ui/{ui.wood.json,ui.parchment.json,ornament.corner.json,optimized-entries.json,ASSET_LICENSE.md}`. Erik Burdett's artwork/world rights are separately reserved; MIT code licensing is not an open-art license. Keep the existing attribution and license terms. No generation, raster modification or new native-tool approval was performed for this brief.

### Token and typography contract

Use [the existing target theme](../../../apps/web/src/hearth-theme.css), not the superseded green declarations in `style.css`.

| Role | Existing value / treatment |
| --- | --- |
| Outer ground | `#1b1713`; material backing `#302119` |
| Reading ink | `--hearth-ink: #352619` |
| Cream on walnut | `--hearth-text: #f0dfb7` |
| Secondary on walnut | `--hearth-muted: #c5b89b` |
| Brass / edge / fine rule | `#c5a46a` / `#8a704b` / `#68553d` |
| Quiet parchment | `linear-gradient(#ead8b3e6,#ead8b3e6)` over the existing parchment WebP |
| Darkened walnut | `linear-gradient(#261a13dc,#261a13dc)` over the existing wood WebP |
| Quiet leather inset | `linear-gradient(120deg,#35261d,#251b15)` |
| Bound opening folio | `3px double #bfa068`; existing shell radius `9px`; inset `0 0 0 2px #17110c` |
| Focus | `2px solid #f1cd81`, offset `3px`; test contrast against the actual adjacent surface |
| Primary plaque | `linear-gradient(120deg,#694a28,#47301c)`, brass edge `#e9c176`, text `#fff0cd` |

Headings: existing `Georgia, 'Times New Roman', serif`. Body: existing `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`. Hearth declares an Inter-first fallback stack, but there is no need to download Inter; the target already intentionally uses local serif/system sans. Use monospace only for commits, schemas and literal commands.

**Proposed editorial dimensions, not extracted reference measurements:** title `clamp(2rem,4.2vw,3.5rem)`; chapter titles 28–36px; body 17–18px at roughly 1.65 line height; metadata/captions 14–16px. Reading measure 62–72ch; broad image measure up to 1120px. Use substantial 48–72px chapter spacing instead of boxing every paragraph. Keep patina at edges and preserve a sufficiently opaque writing wash. Underline inline links; do not depend on brass color alone. Validate final rendered contrast, including captions and focus indicators—this brief is not a WCAG certification.

## Concrete composition

### Public index: one chronological spine

1. **Compact masthead:** Theandril, Developer dispatches, Archive, Road to 1.0, Contribute, and a distinct “Play development build” link. Avoid a game HUD, counters, power-user sidebar or ornamental icon per item.
2. **Latest substantial dispatch:** one large, real game image with a live-text title/deck beside it on desktop; stack on phones. Keep title outside the image. The heading describes the actual change, not a vague “new era.” A small line carries date, category, build/commit and **Published in demo** or **Development only**, as appropriate. Primary action: “Read dispatch.”
3. **A brief current-scope paragraph:** what can be played today and the largest remaining constraint. Link to the evidence-backed 1.0 page. No oversized stats, invented trend charts or percent-complete ring.
4. **Chronological archive:** single-column dated entries separated by fine rules. Major entries may have a small thumbnail and a specific deck; maintenance entries are compact text. Initial filters, only if supported by real content: All / Releases / Engineering / Art & UX / Decisions. Filters must not replace a useful default reading order.
5. **Contribution footer:** repository, setup, report a bug, propose a change, artwork/license distinction. Use existing GitHub workflows, not a new commenting backend.

### Dispatch page: a technical field journal

```text
Theandril / Developer dispatches                 Play development build
REAL DATE · CATEGORY · BUILD/COMMIT · PUBLICATION STATE
Specific change title
What changed for the player, in two sentences
[one large owned screenshot, uncropped where it explains a UI]
Caption: version • scenario • what the image proves • limitations
On this page: Changes / Decisions / Remaining work / Technical evidence

01  Change and consequence
    Short explanation + substantial screenshot or native example
    Why this approach / cost or rejected alternative

02  A second genuinely different change, only if there is one
    Another useful composition, not a repeated marketing tile

Decision record: kept / deferred / declined / needs a decision
Road to 1.0: affected existing gate, evidence state, remaining gap
Technical changes: code links, test scope, compatibility, known failures
Try or contribute: reproducible action and a bounded contribution task
Previous dispatch / Archive / Next dispatch
```

Treat chapter headers as inked folio headings with a thin rule, not faux tabs. Reserve a small adjacent note column for developer rationale on wide screens; move it into ordinary reading order on small screens. Important failures and compatibility warnings stay in the main flow, not in an easily missed aside or collapsed disclosure. Use a single parchment article body on a walnut surround rather than nested parchment cards inside brown cards.

Use real comparisons when they teach a decision. Label states **Rejected experiment** and **Accepted slice**, with the same scene/camera when available. Provide explicit two-state buttons or stacked images and text; a drag-only comparison is not sufficient. Do not call a rejected prototype “the previous shipped version.” Keep decorative hover lifts/press shadows short and optional; no scroll-jacking, auto-playing trailer, continuous foil shimmer or animation needed to read an article.

## Owned imagery and first article opportunities

The following existing target images were actually opened and inspected. They are **retained development evidence**, not new screenshots or fresh gameplay verification from this research pass. The parent should publish only selected copies/derivatives with source attribution, original access and honest captions; repository `docs/` files are not automatically public runtime assets.

| Topic and existing path | Useful picture / required caption boundary |
| --- | --- |
| `docs/art/reviews/slice26/mature-hearth-near.png` | A developed Ashen settlement in its claimed landscape. Strong image for a settlement/art article, not generic decoration for unrelated storage news. Caption it as the slice-26 development fixture: authored terrain/resources/population, ordinary paid founding/building/work commands. |
| `docs/art/reviews/slice26/rejected-first-mature-hearth-near.png` | Exact useful rejected counterpart: large pale-grey hex pads, rigid lanes and flat civic symbols compete with the textured town. Contrast with the accepted near view to explain why the first visual approach failed. Do not present it as current art. |
| `docs/art/reviews/battle-units/runtime/land/roles-live-impact.png` | Actual tactical view with individual formations, visible action/casualty poses and textual battle context. Use at generous width with an optional detail crop linked to the original. Shared battle roles are not distinct culture-specific animation sets. |
| `docs/screenshots/slice20-huge-archipelago-final.png` | Broad archipelago/map silhouette suitable for a generator retrospective. It is historical generator evidence, not current rules-17 campaign or current UI proof. Preserve the documented scenario label. |
| `docs/development/ui-review-current/production-artifacts/deployment-assets-built-ga-48619--configured-deployment-base/deployment-new-campaign.png` | Current retained production-game framing, warm controls and a fog-limited start. Useful for a “what is playable” explanation; mostly unexplored space makes it weaker as a dramatic art hero. |

For the settlement pair, source the explanation from [the retained review](../../art/reviews/slice26/README.md): repaired art and quieter ground do not add canonical buildings or road movement bonuses. For the battle example, source [the battle review](../../art/reviews/BATTLE_UNIT_ANIMATION.md): it records shared role animation, actual camera behavior and unresolved dense-rank/performance limitations. Do not infer performance from a still image.

Draft editorial angles, **not promises of new work**:

- **“When a town looked like a diagram”** — rejected/accepted town evidence; material and silhouette decisions; cosmetic districts versus paid canonical development.
- **“Individual soldiers, shared battle rules”** — real battlefield images; what became visible; why presentation remains separate from deterministic outcomes; honest readability/performance limits.
- **“What keeping a campaign costs”** — current save/history corrections, compatibility and remaining verification. Use actual save/UI evidence or a clearly labeled evidence excerpt, not unrelated heroic art or fabricated benchmark graphs.

## Honesty and scope contract

Every dispatch needs explicit fields or visible prose for:

- **Publication:** date, immutable source commit/build, last edited date when corrected; separately say whether the described change is in the hosted demo. A successful local test is not publication evidence.
- **Implemented:** the player-visible consequence and exact way to try it.
- **Evidence:** source artifact or test report, tested revision/scenario, and what was not tested. Never add overlapping historical test runs into a fake green total.
- **Compatibility:** campaign/save/rules versions when affected, old-save behavior and any required action. The inspected target's current development status names campaign/save rules 17; older prose and screenshots may describe earlier versions.
- **Remaining work:** known defects, partial systems and blocked verification, stated beside the achievement.
- **Decision:** problem; alternatives; kept/deferred/declined choice; cost; reason; revisit trigger; link to the existing scope/gate. Mark an unapproved cut as **Proposed**, not an adopted scope reduction.
- **Contributor next step:** a small reproducible task with acceptance criteria and relevant source paths, not an unsupported “Help wanted” button.

Ground “Road to 1.0” in [GAME_1_0_SCOPE.md](../../../GAME_1_0_SCOPE.md), [DEFINITION_OF_DONE.md](../../../DEFINITION_OF_DONE.md), [current implementation status](../../IMPLEMENTATION_STATUS.md), and [development workflow](../../1.0-DEVELOPMENT.md). Show named existing gates with **evidence-backed / partial / not implemented / blocked / not yet reverified** descriptions and dates. Prefer a readable ledger with linked explanations over progress bars. If counts are ever introduced, compute them from a stable, explicitly named denominator and show what a count means; feature count is not strategic depth or percentage readiness.

At the inspected checkpoint, backend/storage/UI have scoped accepted evidence, while overall integration remains blocked by AI authorization and incomplete final verification. The main game remains a development 4X, not 1.0 or an online multiplayer service. State those boundaries without rerunning the consent-blocked AI/contact or freshness probes. This task did not run them.

**Keep world canon separate from borrowed atmosphere.** Hearth's tavern downstream of Grey Weir, its proprietor Erilian Kantonine, Tamsin and other tavern visitors, booster commerce, the collectible game, card mechanics, keeper notes and card interpretations are adaptation additions—not automatically canonical main-game people, systems or history. Erilian is not Ilthen Vael/Ledgerbone. Hearth's older `b17900d` lore snapshot and twelve-culture presentation must not override the main game's newer authored roster. Do not explain the disputed Witness mechanism or Ashfall causes as fact. Reuse materials, not unexamined lore.

## Integration and acceptance handoff

- Keep the public journal reachable without creating/loading a campaign. Link it from the existing game, but do not mount a simulation worker or Pixi canvas merely to read an article. Scope journal CSS so game panels do not inherit its editorial sizes/layout.
- Preserve the existing GitHub Pages project base. Reuse `apps/web/src/asset-url.ts` (`publicAssetUrl`) at public request boundaries, or equivalent build-resolved URLs. Test `/Theandril/`, direct article entry and refresh. Do not assume arbitrary nested SPA routes receive an HTML fallback on Pages; use a build-emitted static document or verified hash routing.
- Do not ship this research directory, NMS images, the whole screenshot archive, editable art sources or any raw campaign/private data. Curate only relevant owned article media. Provide image dimensions, descriptive alt text/captions and lazy loading below the initial feature; nearest sampling is for native pixel-art examples, not a license to enlarge every screenshot indiscriminately.
- At **1366×768** and **390×844**, inspect real pixels: no horizontal overflow, no clipped controls, legible caption/limitation text, a clear reading path, no title over busy terrain. Check enlarged text, keyboard order/focus, reduced motion, broken-image fallback, working filters and back/forward navigation.
- Verify the published route and exact intended article/media after deployment; source presence and local build success do not establish a live hub. Parent owns implementation, tests, integration and authorized publication. No application code, source artwork, commit, push or deployment was changed in this reference pass.

## Evidence and limitations

The small [reference-evidence directory](reference-evidence/) contains browser captures and structured observations. Native target materials and the listed owned screenshots were inspected in place; no new art was created. The local read-only preview used agent-owned `127.0.0.1:5187` with a handler stripping `/theandril-hearth-and-card/` before serving the existing `dist`. Root-only static serving initially returned asset 404s; prefix-aware serving returned 200s and rendered the real app. The agent-owned preview was stopped after inspection; the final port check shows 5187 closed and user port 5173 still listening. `reference-evidence/verification.json` records the eight successful captures, exact three-material checks and 20 resolving local Markdown links.

Several browser captures immediately after scrolling timed out. Settled viewport capture with CDP `Page.captureScreenshot`, `fromSurface:false`, retained successful actual pixels; failed attempts are not evidence. Cookie settings were dismissed using their close control without accepting optional cookies. The text extractor's archive top entry lagged the live browser, so the captured browser—not that stale extract—supports the composition findings. No new gameplay, release, physical-device or performance certification is claimed.

## Sources

[1] https://www.nomanssky.com/release-log — No Man’s Sky release log
[2] https://www.nomanssky.com/worlds-part-ii-update — No Man’s Sky Worlds Part II update
