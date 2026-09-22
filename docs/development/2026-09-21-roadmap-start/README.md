# Roadmap implementation checkpoint — 2026-09-21

Local work at base revision `f07024fe23ad3386874656d48fbbc33a5380d979`, with exact [working-source hashes](source-manifest.json) and [baseline hashes](baseline.json). Nothing was committed, pushed or deployed. Rules/save **17**, content **`b79c78ed`**; historical seals and test budgets remain unchanged.

The [canonical roadmap](../../1.0-DEVELOPMENT.md#active-development-roadmap) orders accepted work into eleven milestones, with dependency and acceptance details. [Implementation status](../../IMPLEMENTATION_STATUS.md) records actual delivery; the [draft dispatch](../../updates/campaign-foundation-work-packet.md) explains the player outcomes. M0 remains in progress because the full headless run still fails its Epic timing gate.

## Delivered and reviewed

- [Naval corrections](naval/README.md): queued paid harbors count toward the isolated outlet limit; founder selection and shared observed geography bound repeated work. Includes failing-before evidence, payment/scout/saved-route regressions and a paired synthetic benchmark. [Independent review](review/naval.md).
- [Movement and replay performance](performance/README.md): exact search pruning and structural record comparisons, captured query equivalence, historical corruption rejection, campaign profiles and unchanged technical export bytes. [Movement review](review/movement.md), [replay review](review/chronicle.md).
- [Roadmap review](review/roadmap.md): scope, stable catalogue IDs, fifteen open gates, dependencies and deferred acceptance.
- [Final factual/visual review](review/final.md): raw results, source hashes, captions and exact retained screenshot pixels approved for this local checkpoint; no release or publication approval.

## Integrated verification

Node **22.23.2**, Chromium at `/usr/bin/chromium`. Each command ran from the repository root with Node 22 on `PATH`; browsers also set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. No tests or budgets were weakened. Logs below are separate invocations, not additive counts.

[Machine-readable results and log hashes](verification.json).

| Command / scope | Result | Evidence |
| --- | --- | --- |
| `pnpm typecheck` | Pass | [log](typecheck.log) |
| `pnpm lint` | Pass | [log](lint.log) |
| `pnpm content:validate` | Pass; `b79c78ed` | [log](content.log) |
| `pnpm art:validate` | Pass on existing assets; no new visual approvals | [log](art.log) |
| `VITE_BASE_PATH=/Theandril/ pnpm build` | Pass; existing bundle-size/Zod warnings | [log](build.log) |
| `pnpm test` | **1,768/1,769**, 215/216 files, 98.44 seconds. Epic archive case fails at 66.351 seconds against 60. | [final log](full-headless.log) |
| Affected gameplay browser suite below | **20/20**, 2.1 minutes | [log](browser-gameplay.log) |
| Complete Pages browser suite below | **27/27**, 28.4 seconds | [log](browser-pages.log) |

```sh
./node_modules/.bin/playwright test tests/gameplay/contact.spec.ts tests/gameplay/movement.spec.ts tests/gameplay/naval.spec.ts tests/gameplay/chronicles.spec.ts tests/gameplay/battle-defense.spec.ts tests/gameplay/hermes-ui-slices.spec.ts --output=test-results/roadmap-start-gameplay
./node_modules/.bin/playwright test --config playwright.pages.config.ts --output=test-results/roadmap-start-pages
```

The final full headless run passes Standard/24 contact, Huge/32 contact and Epic seed-74 pacing locally. It does **not** establish hosted CI recovery. The isolated Epic test passed in 52.03 seconds, and the exact paired generated campaign preserves victory turn 910, 22,914 commands, 52,393 events, 249 battles, zero rejections and hash `1e4534db`; neither result clears the failed parallel-suite gate. See the performance record for commands and limits.

The [first unrestricted full run](full-headless-before-replay-optimization.log) passed 1,743/1,744 with the same Epic failure before the 25 new comparison tests. The [sandbox-interrupted attempt](full-headless-sandbox-interrupted.log) encountered denied Git child execution and was stopped; it is not a completed product verification result. These earlier logs remain historical evidence.

## Retained images

Exact PNGs and [provenance](screens/provenance.json) were copied from the passing browser runs, outside ignored test-results. No transformations or generated images were used. Parent inspected all four saved captures: the paused seeded campaign, legible narrow landing controls, the expanded historical roadmap item, and the narrow roadmap introduction. These illustrate actual browser output, not performance or full art approval. The item screenshot deliberately retains the public catalogue's historical evidence checkpoint; new local corrections are described by current implementation status and the draft dispatch.

The [contact witness](standard-contact-witness.json) and [paused state](standard-contact-post-pause.json) accompany the campaign image. Browser tests that rewrote two historical compendium screenshots were returned to their exact committed bytes; no unrelated art update is included.

## Open work

Close the unchanged default-suite Epic archive timing failure before declaring the foundation checkpoint complete. Obtain hosted verification only through a separately authorized publication. Full gameplay, multi-browser, sustained giant-scale and all whole release gates remain open. Next feature: M1 client states and unification, followed by the M2 magic loop and M3 empire delegation according to the canonical plan.
