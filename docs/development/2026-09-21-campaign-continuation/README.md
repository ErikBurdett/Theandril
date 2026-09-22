# Campaign continuation — 2026-09-21

Local continuation of the [roadmap implementation checkpoint](../2026-09-21-roadmap-start/README.md), at base revision `f07024fe23ad3386874656d48fbbc33a5380d979`. The [starting source manifest](baseline.json) distinguishes this pass from the existing uncommitted work. No commit, publication or deployment is included. Rules/save remain **17**, content **`b79c78ed`**.

## Implemented work

- [Explored-cell sorting](serialization/README.md) uses native unsigned sorting only for an exactly representable numeric domain, retaining the old comparator for other inputs. It preserves complete save bytes and avoids persistent caching. [Independent review](review/canonical-cells.md).
- [Observation construction](observations/README.md) reduces repeated object copying while retaining every captured field, optional-field presence and fog boundary. The corpus includes 91 observations, historical rules, current land quotes and explicit authored fixtures. [Independent review](review/observations.md).
- [Technical-record formatting](performance/README.md) avoids parsing and re-encoding already sorted JSON. Generated values and a frozen historical archive retain the original complete output. [Independent review](review/pretty-json.md).
- [Naval target previews](movement-preview/README.md) retain the full query's range search and shared 4,096-node budget, while omitting the overlay unused by three AI callers. All 22 captured previews, 91 proposal variants and an eight-turn paid voyage retain their original complete results. [Independent review](review/movement-preview.md).

These are changes to campaign processing, not additional game rules or a completed release gate. Microbenchmarks separate real retained states from synthetic workloads and disclose their timing scope.

## Integration checkpoint

The final unchanged default full-suite run passed **1,818/1,819 tests across 218/219 files** in **90.01 seconds**. Epic chronicle verification remains the sole failure at **64.312 seconds** against its existing 60-second budget; the [final failed log](full-headless-final.log) is retained. The prior invocation passed 1,791/1,792 with Epic at 65.905 seconds; that [failed log](full-headless-m0.log) is also retained. No repeated run was made on an unchanged implementation merely to seek a faster sample. Counts from these overlapping runs must not be added together.

The separately [profiled isolated Epic run](performance/epic-before-hash.log), taken before the new preview API, passed in **50.45 seconds**; it does not clear the failed default-suite gate. The profile's inclusive times overlap. These runs and focused microbenchmarks do not establish a whole-campaign speedup percentage or hosted CI recovery.

The encoded save/hash prototype was **rejected** and has no production import. Its [measurement and final disposition](performance/hash-investigation.md) show 18–45% slower whole hashes across the four cases when land changes on every read, despite faster repeated unchanged reads. [Independent review](review/hash-prototype-notes.md) also identified unresolved serialization-hook behavior and additional retained memory. The experiment is retained for reproducibility, not as approved implementation. No timing budget, scheduling configuration, campaign activity requirement or historical seal has been relaxed.

Final typecheck, lint, content/art validation and the production Pages build pass. Rules/save and the content hash are unchanged. Existing build annotation and bundle-size warnings remain. The [source manifest](source-manifest.json) records 21 final source/configuration hashes, including unchanged budgets and test scheduling.

| Command / scope | Result | Raw evidence |
| --- | --- | --- |
| `pnpm typecheck` | Pass | [log](typecheck-final.log) |
| `pnpm lint` | Pass | [log](lint-final.log) |
| `pnpm content:validate` | Pass, `b79c78ed` | [log](content.log) |
| `pnpm art:validate` | Pass on existing assets; no new visual approvals | [log](art.log) |
| `VITE_BASE_PATH=/Theandril/ pnpm build` | Pass | [log](build.log) |
| `pnpm test` | **1,818/1,819**, sole Epic timeout | [log](full-headless-final.log) |
| Affected Chromium gameplay below | **25/25**, 2.5 minutes | [log](browser-gameplay.log) |
| Complete Pages suite below | **27/27**, 33.2 seconds | [log](browser-pages.log) |

All commands run from the repository root with Node 22.23.2 on `PATH`. Browser runs set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`.
The [verification manifest](verification.json) records each result and its raw-log hash.

```sh
./node_modules/.bin/playwright test tests/gameplay/contact.spec.ts tests/gameplay/movement.spec.ts tests/gameplay/naval.spec.ts tests/gameplay/chronicles.spec.ts tests/gameplay/battle-defense.spec.ts tests/gameplay/land-query.spec.ts tests/gameplay/land.spec.ts tests/gameplay/diplomacy.spec.ts --output=test-results/campaign-continuation-gameplay
./node_modules/.bin/playwright test --config playwright.pages.config.ts --output=test-results/campaign-continuation-pages
```

The scoped gameplay run covers actual paid land work, fresh quotes, saved routes, transport, naval combat, peace payments, contact and complete chronicle export. Pages verifies the rebuilt `/Theandril/` bundle, worker/assets, journal journeys and existing production game cases. These are not a full gameplay run, other browsers or hosted CI. The failed sandbox attempts for content/art validation remain in `content-sandbox.log` and `art-sandbox.log`; their denied local IPC socket is an environment failure, followed by successful authorized runs.

## Current browser imagery

Three exact PNGs and [provenance](screens/provenance.json) are retained outside ignored test output. Parent inspected the actual technical ledger, narrow history dialog and narrow land quotes. The first two depict a generated Short AI-watch campaign after saved continuation and victory on turn 42; the land image comes from an explicitly authored paid-work regression. These are illustrations of actual browser output, not Epic performance proof or new art approvals. The two historical compendium captures rewritten by the Pages test were restored to their exact pre-run committed bytes.

The independent [final factual/visual review](review/final.md) approves the bounded local checkpoint and draft claims, verifying all source/log/image hashes and the original capture bytes. It does not approve the rejected cache or close M0.

## Next feature preparation

A [genuine rules-17 diplomacy archive](m1-fixture/README.md) retains pre-change bytes, paid peace, a pending offer, continuation commands and exact seals. Its authored initial contact placement is disclosed. This fixture and the [implementation inspection](m1-inspection.md) prepare M1 compatibility work; they do **not** implement client contracts or unification victory.

The [canonical roadmap](../../1.0-DEVELOPMENT.md#active-development-roadmap) remains the single development plan. All fifteen whole release gates remain open.
