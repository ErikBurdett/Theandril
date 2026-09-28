# Integrated empire delegation acceptance

Status: the integrated browser journey passed, 1/1 in 35.2 seconds (test 34.3 seconds), with the unchanged 45-second test limit and existing assertion limits. See [integrated-browser-final.log](integrated-browser-final.log). This is an authored mature-state exercise, not organic campaign growth or a closed M3/1.0 gate. The parent owns broader regression, pacing, benchmark and production verification separately.

## Scope

`packages/test-fixtures/src/empire-delegation-fixture.ts` starts with the Huge generated world (seed 20260905, generator 4), authors ownership of 30 hearths and 128 combat armies, preserves two living rival hearths, and changes one disclosed 720-cell frontier patch. Mature market infrastructure, ownership, purse and positions are synthetic. Wars, the interrupted journey, postings, charters and saved groups use canonical commands. The strict save loader validates the final snapshot.

The initial 44-coin purse deliberately cannot fund the whole production batch. After three accepted production orders it holds eight coin; ordinary empire and army upkeep then exhausts it. Market infrastructure does not make this 128-army, 30-hearth position sustainably funded. The corrected acceptance checks zero treasury, 28 empty charters waiting for the reserve, preservation of the same two paid queues, and advancing progress on the already-paid granary. It makes no claim that delegation creates new paid production without funds.

To isolate delegation from an unrelated tactical battle, the final authored setup places the already-interrupting patrol back at its distant home and surrounds the remaining visible wartime patrol with water. This second patrol remains within the protected western hearth's threat radius. The saved interrupted route's geography is untouched. This is not evidence that enemy AI cannot attack or that an organic frontier is safe.

`tests/gameplay/empire-delegation.spec.ts` imports that snapshot through the real file control. It joins exception navigation, 30-hearth policy changes, personal production templates, a finite shared budget, paid/refused production, explicit group route review, a stranded army, defensive assignment, visible-threat reinforcement, direct-order priority, individual detachment and save continuation. Keyboard controls and a 390-pixel viewport are included. Worker observation records request type strings while forwarding the original calls unchanged; it cannot change orders or game state.

Former owners' armies remain in the world despite the two remaining rival hearths. Ordinary faction AI remains active and may declare additional wars. The test verifies the two initial wars and that every new archived declaration comes from a foreign actor, rather than requiring the global war list to remain unchanged across an AI turn. It still requires no battle during the first theater-allocation phase.

Continuation uses an actual UI End turn as its reference because that action includes normal faction AI proposals before the canonical turn command. Its outcome may be an advanced turn or an ordinary enemy battle interruption. After manual restoration and, separately, portable restoration, repeating that action must produce the exact same complete canonical serialization. Every exported checkpoint/future also independently replays its archive. The evidence records the outcome; it does not count an interrupted phase as a completed turn or a tactical-battle acceptance test.

The next-action change reads canonical theater reports, suppresses ordinary idle prompts for members of enabled theaters, preserves direct paused routes and stalled postings, and exposes one bounded theater-attention group. The root integration opens the requested theater by stable ID.

Focused verification: 13 next-action unit tests pass. Scoped lint and repository typecheck pass (`integrated-lint-final.log`, `integrated-typecheck-final.log`). Independent source review found no blocker; see `next-action-review.md` (reviewer did not author the changed next-action/focus code).

## Final outcome

The passing run's [raw acceptance record](browser-evidence/integrated-settled/empire-delegation-a-mature-c8113--through-saved-continuation/integrated-acceptance.json) starts from hash `a46e0206`, with 128 owned armies, 30 owned hearths, two wars and 149 permitted events. Thirty charter changes preserved the existing queues and purse. The production batch accepted three orders and refused two, leaving eight of 44 coin; upkeep then reduced the treasury to zero and 28 charters reported their reserve wait while paid granary progress advanced.

Exactly one explicit group route review returned two available routes and one unavailable route without changing the canonical hash. Applying it accepted two and refused the stranded army. The new theater used 14 selected members, a one-army minimum and one possible extra guard. At turn 3, the western hearth reported one visible enemy, two required guards, zero stationed and two incoming. The theater recorded three accepted dispatches and one actual refusal. These outcomes do not imply arrival: the visible report still had incoming armies and a direct route override. Detaching `army.1217` left 13 members, kept the theater enabled, and preserved all travel routes and postings.

Twenty-seven archived war declarations came from foreign factions, taking the player's war list from two to 29. No battle interrupted the first allocation phase. The saved checkpoint hash was `9237d706`; the original UI continuation and both restored continuations reached turn 4 with **no pending battle**, identical full canonical serialization and hash `607cd0c7`. The final archive contained 1,668 commands. All four exported checkpoint/future archives replayed exactly. The final passing run reported no page errors and no horizontal document overflow at 390 pixels.

## Observed UI and worker costs

These are one correctness journey's wall-clock observations, not a sampled benchmark, frame-time measurement or performance threshold. The raw JSON above preserves full precision; the following stage durations are rounded to three decimal milliseconds. They include UI actions, assertions and native screenshot capture where those occur.

| Stage | Milliseconds |
| --- | ---: |
| Fixture construction and strict validation | 942.996 |
| Navigation, portable import and rendered state | 2,120.274 |
| Wars, journal and grouped exception navigation | 1,534.412 |
| 30-hearth registry recall and policy application | 876.955 |
| Production template and partial budget batch | 1,958.950 |
| Group route review and partial application | 2,087.830 |
| Narrow theater setup, focus, allocation and detachment | 4,911.857 |
| Manual/portable restoration, replay and exact future comparison | 19,590.214 |

The instrumented total was 34,127.919 ms. The restoration stage includes repeated archive replay and complete serialization comparisons; it is not a claim that an individual UI control takes 19.6 seconds.

The observer captured 26 request/reply pairs across the original session and two restored sessions: two imports, one load, one save, four exports, six ordinary command requests, one each of group charter/production/travel/review, seven ordinary movement queries and one land query. There were no development queries. The explicit group review added precisely one request; registry/template/draft edits did not initiate extra group reviews.

| Original-session operation | Roundtrip ms | Worker command/query ms | Worker-reported result bytes |
| --- | ---: | ---: | ---: |
| Initial import | 1,128.5 | Not separately timed | State: 1,993,343 |
| 30-hearth charter batch | 120.4 | Command: 1.2 | Results: 1,495 |
| Partial production batch | 112.2 | Command: 0.6 | Results: 472 |
| Three-army route review | 64.0 | Query: 0.9 | Compact review: 582 |
| Reviewed travel application | 582.7 | Command: 1.4 | Results: 319 |
| Create theater | 527.7 | Command: 0.7 | State: 1,983,504 |
| First End turn | 754.5 | Command: 219.6, including AI: 156.7 | State: 1,686,392 |
| Detach one member | 501.9 | Command: 0.2 | State: 1,685,905 |
| Original future End turn | 737.0 | Command: 187.9, including AI: 128.3 | State: 1,652,451 |

The single land query reported 141,765 bytes and a 31.3 ms roundtrip. The seven ordinary movement-query roundtrips ranged from 7.3 to 13.0 ms. Manual load took 785.9 ms; portable reimport took 1,638.5 ms. Their End-turn roundtrips were 770.6 and 690.2 ms respectively. The save roundtrip was 417.2 ms, and the four export roundtrips were 919.6, 1,018.9, 1,017.4 and 1,134.2 ms.

The compact query count should not conceal the larger read-model cost: 12 state publications reported 1,652,451–1,993,343 bytes each, totaling 21,670,006 bytes across the three sessions. These are existing worker metrics, not a new direct measurement of browser structured-clone size. Command/result metrics and roundtrips measure different scopes; their difference cannot be attributed solely to main-thread rendering. This evidence exposes the transfer cost and leaves broader UI/frame-time budgets open.

## Native visual inspection

All six final PNGs in [the settled browser packet](browser-evidence/integrated-settled/empire-delegation-a-mature-c8113--through-saved-continuation/) were inspected at their original pixels using `view_image`; none was resized or edited. Verdict: pass for the pictured states. This inspection was performed by the fixture/test author; the root authored the new reinforcement controls and focus correction, and separate source reviews are linked above.

- Desktop, 1440×1000: production template, the three accepted/two refused result breakdown, both funding refusal reasons and the remaining eight-coin treasury are readable.
- Five captures at 390×844: the reinforcement minimum/extra guard controls and rule explanation fit; the explicit 14-member copy/create controls and route-preservation warning remain usable; the requested theater summary visibly holds keyboard focus and sits within the dialog viewport.
- The report capture distinguishes **zero stationed** from incoming coverage, shows one visible threat and one extra guard at Frontier west, and lists zero extra guards at Frontier east. Its summary is `0 missing guards · 2 incoming · 9 in reserve · 2 direct overrides`. The summary counts theater members; hearth coverage also includes other owned armies, so the two hearths each showing two incoming does not imply four incoming theater members.
- The dispatch capture shows the actual turn-3 attempts, the stranded army's safe-route refusal, the standing-posting override explanation, and the explicit warning that accepted travel can arrive or pause. It supports neither synchronized arrival nor an automatic attack claim.

| Native PNG | Bytes | SHA-256 |
| --- | ---: | --- |
| joined-budget-refusals-desktop.png | 716,876 | `463c70a7006db82d953020c9f569bceffca301fd02e9aab181a778bf77c22ad5` |
| joined-reinforcement-controls-narrow.png | 109,314 | `39972bcdd1523e18832eb404f0d46a869ddb68829c1357f123e61960c212692f` |
| joined-watch-controls-narrow.png | 184,898 | `a73fe602e9efa0c8238579f043d9a3ef8d6b590679500d27035d214d5ac84e7f` |
| joined-attention-focus-narrow.png | 121,262 | `ba40f75b6e4aa94578cda535bf668c0df87a0efbbdf690b0d0d996fca3b7873a` |
| joined-watch-report-narrow.png | 153,083 | `67c8f3c75b41c824f2aea37268a2805f2b291f07e87e40f28d81ac826dcbd615` |
| joined-watch-dispatches-narrow.png | 136,726 | `9edf0a20146f0468c322d3abcf5f7ad7cf4a4d46694d780e2e0b2bbff4f5ed83` |

## Retained initial diagnostics

- `integrated-fixture-initial.log`: tsx could not create its IPC socket in the sandbox. The same smoke check was subsequently run with the required process permission.
- `integrated-fixture-smoke.log`: the first fixture correctly refused a war declaration because the rival was not yet scouted. The fixture now puts a real forward company in sight of that rival before declaring war; no rule was relaxed.
- `integrated-fixture-scout-fixed.log`: canonical fixture smoke passed at turn 2, with 128 owned armies, 30 owned hearths, two wars, 149 permitted events and 44 coin.
- `next-action-tests-initial.log`: four setup failures while rules 34 save initialization was still being integrated. `next-action-tests-final.log` subsequently passed all 13 tests in one file (1.05 seconds).
- `integrated-browser-initial.log` and `browser-evidence/integrated-initial/`: the first browser journey failed at the 45-second test limit. The trace shows the reserve lookup alone waited 32.35 seconds after approximately 12 seconds of successful policy, production and travel assertions. The requested reserve (Frontier reserve, hex 10776) was present in the retained DOM. An exact `getByLabel` lookup did not match the select's full label text; the correction uses its exact accessible combobox name, consistently with the existing theater journeys. No timeout or assertion was weakened.
- `integrated-browser-role-fixed.log` and `browser-evidence/integrated-role-fixed/`: the second run passed theater creation and selected/opened the correct report, then found a real keyboard-focus defect (28.7-second run; five-second focus expectation). The child theater effect attempted focus before the parent campaign window opened and focused its heading. The retained narrow screenshot visibly has the registry heading focused, leaving the theater below the fold. The root owner corrected `DefenseTheaters` with a deferred, cancellable animation-frame focus/scroll callback. Independent review checked the corrected ordering; the unchanged browser assertion passed in subsequent runs.
- `integrated-browser-focus-fixed.log` and `browser-evidence/integrated-focus-fixed/`: the corrected keyboard focus passed. The first real End turn then let ordinary rival AI attack a traveling relief company, leaving a tactical battle pending rather than advancing the turn (21.8-second failed run). The native screenshot explicitly identifies the player as defender. The authored isolation described above prevents that unrelated tactical interruption; no runtime combat, AI or theater rule was changed to satisfy the test.
- `integrated-browser-isolation.log` and `browser-evidence/integrated-isolation/`: the isolated fixture passed its strict constructor validation, but initial browser import was still resolving at the unchanged five-second assertion (14.2-second failed run). The trace has no page script errors. This coincided with pacing and full-suite work, which also hit unrelated existing time limits. The subsequent quiet run imported successfully with the same assertion. No timeout was changed. Later attempts retain worker request/reply observations even on failure.
- `integrated-browser-quiet.log` and `browser-evidence/integrated-quiet/`: a 14.4-second run passed the focus and allocation assertions but found the test incorrectly required unchanged wars after ordinary AI ran. The permitted war list grew from two to 29. The corrected archive-based checks above distinguish foreign declarations from player orders without suppressing AI.
- `integrated-browser-budget-oracle.log` and the retained budget-failure captures: the next run failed after 14.0 seconds because the test incorrectly expected more than two funded queues despite a zero treasury. The parent corrected this to the explicit reserve-blocker, paid-queue preservation and granary-progress checks described above. Review of that source correction found no blocker: it tests the canonical funding stop and continued paid work rather than inventing affordable production. These assertions passed in the final run.
- `integrated-browser-detach-observation.log` and `browser-evidence/integrated-budget-fixed/`: a synchronous test read after clicking Detach still saw 14 members while the asynchronous canonical response was pending. The correction waits for the actual worker observation to report 13 before taking the snapshot, then retains the enabled-theater and exact route/posting preservation assertions. It adds no sleep and changes no runtime behavior. The final settled run passed.

An intervening browser submission was interrupted while awaiting its tool result after 335 seconds; it returned no cell or process identifier, so it is not counted as an executed test. The parent subsequently took ownership of all browser execution. Oversized trace archives are retained outside Git under [local-trace-manifest.json](local-trace-manifest.json); failure logs and native captures remain preserved.

The browser's read-only worker wrapper also records request/reply types, wall-clock roundtrips and the worker's existing numeric metrics. UI phase durations are recorded alongside correctness evidence. It forwards original messages and transfers unchanged, adds no queries, and never serializes the observation graph for measurement. These single-run observations include assertions, screenshots and concurrent development work; they are not quiet benchmark results or performance gates.

Performance measurements, generated production acceptance and organic pacing remain separate evidence. This journey does not make those claims.
