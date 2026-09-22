# Journal structure and verification

This is a static React/Vite multi-page entry, not a CMS or a second game shell.
Start with [CONTRIBUTING.md](CONTRIBUTING.md) and [TEMPLATE.md](TEMPLATE.md) for the editorial workflow.

## Public content contract

- `apps/web/updates/index.html` loads `src/updates/main.tsx`. The parent Vite configuration must include this HTML in its multi-page inputs.
- `types.ts` defines dispatches, sections, evidence and scope entries. `content.ts` is the checked public catalog. Each entry has a stable slug, explicit `publication: 'published'`, immutable evidence revision and numeric `sequence` (higher is later work). `edition` is an editorial folio number, **not** a version or publication date.
- Drafts live in Markdown work packets/branches outside the imported public catalog. There is deliberately no private draft route, API or runtime draft filter: client bundles are public. Only add an entry to the public catalog after review and publication authorization.
- Publication in this catalog means “public journal content”, not proof that the described game build has deployed. Deployment must be verified separately. Do not add a made-up publication date while preparing a release. The initial catalog is a retrospective of reviewed work at `8b3b8c148b7e8ee3689001210033fee7a1b8a6ef`.
- Do not update the initial `sourceRevision` constant to retcon old evidence. New stories can set their own explicit full commit hash. Their reader links use their own revision. If the current scope/library moves to a new checkpoint, preserve the old stories' literal revision before changing library defaults.
- `libraryRevision` pins the current scope/reference shelf and roadmap independently of the historical dispatch default. The 21 September campaign-foundation story uses its own committed implementation checkpoint; earlier stories and images keep their original pins.
- A section has a stable `id`, title, plain-text paragraphs, optional bullet list and optional image ID. React escapes the text. Do not introduce raw HTML. Cross-references, IDs, actual Git objects and minimum substantive content are checked by Vitest.
- `library.ts` provides a **selected** gate/decision ledger and the documentation shelf. It does not replace the complete release gates. Never add percentages or silently turn a proposal into accepted scope.

## Routes and interaction

Permanent stories use `updates/?dispatch=stable-id`; every story is served by the actual `updates/index.html`. No history-router rewrite or SPA fallback is required. Missing/unknown IDs show an honest unlisted page and recovery link. Native full navigations retain browser Back/Forward semantics; no simulation worker or renderer is mounted.

Search and topic filters combine across full story text, preserve editorial order, update `q`/`topic` query parameters and restore after refresh. They do not modify campaign storage. A native modal image dialog supports keyboard activation, focus containment, Escape and focus return.

All local links and image/material paths use `import.meta.env.BASE_URL`, including CSS material URLs supplied as custom properties. Keep `journal.css` imported only by the journal entry, not the game. Query/hash anchors are same-document links, and evidence URLs are pinned GitHub paths. No CDN fonts or extra dependencies are needed.

## Image handling

`prepare-images.py` reproduces the selected journal imagery from retained source screenshots. The original four derivatives use Pillow lossless WebP encoding and literal source-coordinate crops; the two campaign-foundation PNGs are exact byte copies with no crop, resize or re-encoding. No art generation, resampling, repainting or native-art approval is claimed. Review original pixels and actual dimensions before choosing coordinates. Pillow can silently pad an out-of-bounds crop—bounds are therefore regression-tested.

The script writes identical metadata to `src/updates/media.json` and `public/updates/provenance.json`. Vite does not support importing a JSON module directly from `public/`; the source-side metadata is intentional and its equality is tested. Runtime image bytes remain only in `public/updates/`. Existing `public/ui/hearth-card/` material bytes are reused by URL, never duplicated. Their original provenance/license records remain authoritative:

- `docs/art/reviews/slice25-hearth-materials.json`
- `assets/art/source/hearth-card-ui/ASSET_LICENSE.md`

Retain source and output SHA-256s, crop, encoding, dimensions, byte counts, accurate alt and captions. Captions distinguish authored regression scenes, retained organic campaigns, and the claims a screenshot does **not** establish. Image checks enforce a three-MiB journal budget. Inspect final derivatives and actual page screenshots; a passing hash is not aesthetic approval.

## Scoped local checks

From the repository root:

```sh
pnpm exec vitest run apps/web/src/updates --maxWorkers=1
pnpm exec tsc --noEmit
pnpm exec eslint apps/web/src/updates tests/gameplay/updates.spec.ts docs/development/dispatches/frontend-playwright.config.ts
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium pnpm exec playwright test --config docs/development/dispatches/frontend-playwright.config.ts --reporter=line
```

The isolated harness owns port 5196 and fails if occupied; it does not reuse or stop the user's 5173 server. Playwright stops its server at completion. It exercises `/Theandril/updates/`, deep-link reload, combined search/filter/reset, source links, unknown routes, keyboard skip navigation, image dialog, 1440/1366 desktop and 390px at 100%/130% text with reduced motion. It captures real pixels after decoding images. Await the destination heading before issuing a keyboard event following document navigation; a pre-render keypress is a harness race, not a proven focus defect.

These journal checks do **not** rerun game AI/contact or blocked supplemental probes, the historical replay corpus, or a full release gate. The parent owns ordinary game/release gates and built-Page integration. Evidence and limits for this implementation live in `docs/development/dispatches/frontend-evidence/REPORT.md`.
