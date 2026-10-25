# Four deployed improvements toward 1.0

## Prompt

“Continue, do more this time, and each time you add a feature or fix, deploy it.”
Later: “open the local tracker in a browser on this machine so i can review the episode”.

## Delivered

Four separate updates were committed, deployed to [GitHub Pages](https://erikburdett.github.io/Theandril/) and verified there:

| Update | Player outcome | Publication and live proof |
| --- | --- | --- |
| Captured-hearth patrol retirement | An AI seat can retire an obsolete home circuit after observing its hearth captured, preserving existing travel and allowing ordinary reassignment. | `27a44f1`, implementation `68ef5fa`; [39 live journeys and exact readback](../2026-10-24-retirement-publication/deployment.json). |
| Posting and muster destination controls | “Where it stands” submits the current displayed position after movement. Unavailable saved destinations remain explicit and clearable; replacement requires a fresh choice. | `c52ce3e`; [five targeted live journeys and exact readback](../2026-10-24-posting-targets/deployment.json). |
| Imminent project counterplay | AI can reject peace and establish a legal adjacent siege in the same planning batch, then refuse later peace that would release its project-pausing siege. Actual combat can still be lost. | `a48755b`, implementation `bff9889`; [four live journeys and exact readback](../2026-10-24-counterplay-publication/deployment.json). |
| Army order filters | Find postings, waiting orders and paused patrols before paging; preserve checked armies and show policy/travel facts separately. Explicit Resume preserves existing travel. | `e0d8112`, implementation `da12978`; [live registry journey and exact readback](../2026-10-24-registry-publication/deployment.json). |

The three substantial checkpoints have reviewed dispatches 15–17. Prior journal entries and image bytes remain unchanged. The final catalogue retains all fifteen open release gates; editorial delivered bullets are not a release-completion percentage.

The local DHARMA tracker's **23 October 2026 edition** was opened through `tracker-open dharma latest`, which returned success for `/home/telephoneheater/Projects/DHARMA/dharma-tracker/site/weekly/2026-10-23/index.html`. This was the local tracker edition; no podcast episode was edited or published.

## Changed

- Simulation/AI: shared canonical siege establishment query, bounded visible project counterplay and maintenance, and captured-hearth patrol retirement; meaningful regression fixtures and historical command seals.
- UI: posting/muster destination intent, owned army-order presentation index, registry filters/counts and independent policy/travel explanations. No new canonical registry commands or worker protocol.
- Verification: public-control production journeys, exact saved continuation/replay evidence, isolated planner measurements and fixed-seed pacing comparisons. Raw failures and corrected results remain retained.
- Publication/status: dispatches, catalogue/evidence pins, one exact native selector image, canonical implementation/M3/performance records and this report. CI remains build-only.

## Verified

The final publication passes **2,320 tests across 282 files in 65.90 seconds**, using `pnpm test --maxWorkers=4`; [full log](../2026-10-24-registry-publication/full-tests-bounded.log). Typecheck, lint, content/art validation and the production build pass in the same [publication packet](../2026-10-24-registry-publication/README.md). The complete local Pages suite passes **47 journeys in one run, 2.4 minutes**; [log](../2026-10-24-registry-publication/local-pages.log). Independent [source and reader review](../2026-10-24-registry-publication/review-source.md) covers all twelve native reader captures at four viewport/text layouts.

Each publication above has both exact GitHub workflows succeeding and a public readback matching local HTML, JavaScript, CSS, worker, image/provenance, article pins and catalogue. Live gameplay scopes are separate: 39 retirement, five posting-target, four counterplay and one registry journey. These overlapping counts must not be added as distinct coverage, and the final registry deployment did not rerun all 47 journeys live. Its affected live journey passes in **12.8 seconds**; [log](../2026-10-24-registry-publication/live-pages.log).

The final registry journey preserves its initial eight-record archive/hash while browsing; one explicit Resume adds sequence 9 and restores exact saved history without altering any army or route. Counterplay includes real five-round Watch outcomes and preserves historical rules 16/19/34/35 command seals. Detailed counts, source identities, exact outcomes and retained corrections are in the [four-delivery inventory](../2026-10-24-registry-publication/prompt-evidence-inventory.md).

The initial final-publication full suite ran unrestricted alongside validation and timed out in Git-history reconstruction: 2,319 passed, one timeout. Its [log](../2026-10-24-registry-publication/full-tests.log) remains. The unchanged whole suite passes with the four-worker invocation used for prior implementation checks; no timeout or assertion was weakened.

Work took place in the user's primary checkout `/home/telephoneheater/Work/Theandril`, branch `master`. At final feature verification, local HEAD and `origin/master` both equal `e0d8112c69cf8a25b417b931199e70c07615c51f`, the live feature revision. The subsequent documentation commit records these completed results and this report; it changes no application, test, simulation or deployment workflow source.

## Not done / blocked / caveats

**DH-021 remains open. ACT-32/M3 and R06 remain partial. All fifteen release gates remain open.** This is a development deployment, not 1.0 acceptance.

The final nine-campaign matrix remains Standard 219/194/201, Long 329/309/287 and Epic 374/332/327. Counterplay's final hashes and non-timing fields match retirement; [comparison](../2026-10-24-project-counterplay/pacing-maintained-comparison.json). The original Long seed remains eighteen turns later than the retained rules-34 result, and two Epic seeds remain early. No prices or proxy bounds were tuned. The UI-only changes do not warrant new pacing runs.

The registry's 101-army scenario is authored, not an organically developed mature empire. It establishes a bounded workflow, not whole-world rendering, transfer, memory or accessibility certification. Source-level linear complexity is not a new timing result. The selector image is a clearly captioned control detail; its inline text is small on narrow screens and native inspection remains available.

## Follow-ups

Continue the existing [M3 plan](../../1.0-DEVELOPMENT.md) with broader delegation, escorts and multi-step programs, and obtain organic mature-realm acceptance. Broader project counterplay and strategic operations remain open under R06. Resolve pacing through fixed-pack headline measurements before changing prices or descriptions. Keep the [canonical status](../../IMPLEMENTATION_STATUS.md) and existing release gates authoritative.
