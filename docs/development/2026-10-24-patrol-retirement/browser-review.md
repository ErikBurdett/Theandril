# Production browser acceptance

The production journey is `tests/production/patrol-retirement.spec.ts`. It imports the genuine corrected Long campaign snapshot retained at `../2026-10-24-patrol-recovery/diagnosis-recovered/snapshot-3-turn-150.json` (SHA-256 `e8b68f936e8f7042f04465f879e669ef038cc27a9c927781fe368075a9e92b25`, canonical state hash `4f60f2e3`). No fixture state is changed. The imported archive explicitly starts coverage from this save; the captured mid-round state starts a new full Watch round and does not reconstruct earlier history.

Acceptance requires public import and Step one round controls, an accepted `clearPatrol` for Wardhall `army.408`, a subsequent accepted `moveTo` and actual displacement within at most three Watch rounds, then export/replay and exact archive/state recovery after manual save and reload. The test retains a portable final save, command evidence JSON, and a native viewport screenshot. The displayed realm is the Ashen observer; the archive, rather than a screenshot of foreign controls, proves the Wardhall orders. No player movement is injected and no development hooks are used.

Authoring checks: Playwright collection found one journey; scoped ESLint passed. After parent clearance and its successful candidate Pages build, the following command passed all three journeys in 19.6 seconds (recovery 5.4s, retirement 9.9s, player patrol 3.3s). The unmodified first browser run passed; no browser failure or assertion relaxation occurred.

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium ./node_modules/.bin/playwright test --config playwright.pages.config.ts tests/production/patrol-retirement.spec.ts tests/production/patrol-recovery.spec.ts tests/production/patrols.spec.ts --output docs/development/2026-10-24-patrol-retirement/browser-results
```

The output is retained in [browser-first.log](browser-first.log). The real full-world branch accepted `clearPatrol` at archive sequence 47, turn 150. The first completed Watch round reached turn 151 with the army still at hex 8659 and hash `eef00241`. The following round accepted `moveTo` at sequence 156, turn 151, with target 8879; recorded movement events crossed 8658, 8657, 8656 and 8879. It completed at turn 152 with actual cell 8879 and hash `968ad111`. All 179 archive records replayed exactly, and manual save/reload preserved the entire archive and state hash. This establishes subsequent ordinary movement in this browser branch without claiming that an isolated immediate fresh plan must choose movement over other legitimate priorities.

Retained [command and round evidence](browser-results/production-patrol-retireme-17ca2-ubsequent-ordinary-movement/production-watch-patrol-retirement.json), [portable final save](browser-results/production-patrol-retireme-17ca2-ubsequent-ordinary-movement/production-watch-patrol-retired.theandril), and [native retirement viewport](browser-results/production-patrol-retireme-17ca2-ubsequent-ordinary-movement/production-watch-patrol-retired.png) accompany the log. I opened all three native PNGs from this invocation. The retirement capture shows the Ashen Compact observer, Long pace with 12 realms, paused Watch, partial archive, and turn 152; its controls and labels are legible with no viewport clipping. The recovery capture likewise shows the Ashen observer at turn 59. The 390×844 player patrol capture at 130% text scale shows the scrolled selected-orders form with readable war-pause explanation and fully visible Update, Resume and Remove controls. These are contextual UI captures, not screenshots of Wardhall's foreign orders or proof of broader release gates.

Observed source/artifact SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `tests/production/patrol-retirement.spec.ts` | `c1e0451549c67c318a535a043ceb1d16439d64108f4dc0c87520f86c011483e7` |
| `packages/ai/src/patrol-recovery.ts` | `2fe6d9117312370adf8bce235732d1b012b2b09a210e85b2a3ccc4f76799ef58` |
| `packages/ai/src/patrols.ts` | `7119881ed29d16c6f1c60d45a980cbb3ba2a7871590329fedb10ff2e1fd965f0` |
| Retirement PNG | `bf7790cdf5c07e35aeb8f056a3bc536df5433e1f925437ba5a7165d8e6834f6b` |
| Final portable save | `4e49b303772e70cb4d70d0ddab902d424753f860ad129ebce640d0b45df031ce` |

No browser blocker found in this scoped acceptance. These local candidate results do not establish deployment, overall pacing acceptance, or an automatic player-controlled patrol change. Parent integration retains full-suite, independent source review and campaign measurement responsibility.
