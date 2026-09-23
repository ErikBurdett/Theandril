# Fleet provisions journal preparation

Prepared edition **05**, `fleet-provisions`, for the user's authorized publication on 2026-09-23. The article and current reference/roadmap evidence pin the verified implementation commit **`b623c2c91d4d852cba710f2d996c28a6b1b5d624`**, rules/save **31**, content **`015468d1`**. This is the author's preparation record, not an independent editorial approval or deployment receipt.

The article explains finite shared stores, the last-ration boundary, replenishment timing, conservative reorganization and bounded AI returns/staging. It distinguishes the authored player-control screenshots from generated island play, headline pacing and synthetic throughput samples. The headline remains **Standard 234 / Long 342 / Epic 379**. Standard and Long balance, actual remaining naval attrition and added planning cost are explicit. Existing accepted scope is unchanged; all fifteen whole release gates remain open.

The current ledger recognizes implemented land/depot/harbor supply, fleet provisions and existing charters/postings while keeping wider supply/trade, military coordination and mature-realm acceptance partial. Its old “latest 1,857/1,858” statement is replaced by the pinned current 1,861-test evidence. Historical evidence remains dated, and a byte comparison confirms all four previous dispatch objects and their source pins are unchanged.

## Verification performed

```text
./node_modules/.bin/vitest run apps/web/src/updates/content.test.ts apps/web/src/updates/media.test.ts apps/web/src/updates/roadmap.test.ts apps/web/src/updates/validation.test.ts apps/web/src/updates/journal.test.ts
5 files passed; 21 tests passed; 632ms
```

The first sandboxed execution passed 18 checks and could not run three immutable-source assertions because spawning `git` was refused with `EPERM`. The same complete command passed outside the sandbox; no assertion changed in response. Scoped ESLint and `git diff --check` pass. Source validation confirms all referenced evidence and original images exist at their exact declared commits. The frontend and public download manifests remain byte-identical.

`tests/gameplay/updates.spec.ts` now targets the fifth dispatch, its five-entry catalog, current scope text and immutable factual-review link. Its existing desktop, narrow, 130% text-scale, search, refresh, keyboard and image checks remain. The two narrow fleet figures are explicitly loaded and captured. These browser changes are prepared for the parent's Pages run; this author did not start a development server or run concurrent browser work.

## Exact image publication

All three public PNGs are untransformed copies of the reviewed files under `docs/development/2026-09-23-fleet-provisions/screenshots/`. The original scenario seed is **20260905**, an authored tiny two-realm island map with funded ships and an explicit initial two-turn store count. The scenario then uses normal movement, turn and save/load controls. Public captions disclose those boundaries. No pixels were generated, cropped, resized or re-encoded.

| Public image | Viewport | SHA256 |
| --- | --- | --- |
| `updates/fleet-provisions-saved-voyage.png` | 1440 × 1000 | `a32c0745c070cad932f56cf7571cad5bd73691e0013f99eca8799ae68bc4138f` |
| `updates/fleet-provisions-exhausted-narrow.png` | 390 × 844 | `2fc765abcdb8a6a507d7e3834722b2a0fe93e0a32db630bf9ae6608ad1606fbf` |
| `updates/fleet-provisions-refilled-narrow.png` | 390 × 844 | `0f76fdf207fa30ba20f4b1397ad8ef7fff7c752e1ac175f8d46f779b831e6be4` |

Source/public byte equality and each SHA256 were checked directly and by the media test. Total journal images are **2,156,459 bytes**, below the existing **3 MiB** budget. The two portrait figures reuse the existing 390px article display constraint through a selector-only CSS extension. Their final displayed page layout still needs the parent's production-subpath review.

## Remaining publication checks

An independent reviewer should compare the new article and reconciled current ledger with the pinned implementation/evidence. Parent review should verify the real Pages-base layout, captions, source links, narrow/text-scale behavior, browser journeys and production build, then read back the authorized publication commit and URLs. The retained implementation evidence README and original factual verdict describe their original pre-publication boundary; the updated work packet records the subsequent authorization without changing those historical statements.
