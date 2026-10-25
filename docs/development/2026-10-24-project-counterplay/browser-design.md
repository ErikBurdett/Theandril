# Proposed production browser acceptance

Prepared from the retained diagnostic packet and current public controls. This is a design, not executed acceptance or permission to relax an assertion. No browser, build, simulation or AI source was changed for it.

## Critical worker boundary

`apps/web/src/simulation.worker.ts` currently calls `planTurn` once for each realm in a Watch round, and once for each non-player realm during player End turn. It then advances the canonical turn. The prepared incoming-offer policy returns only an ordinary rejection and relies on a fresh observation for a later siege proposal. A unit harness that explicitly calls the planner again can prove those proposals but cannot establish that the worker makes that second call before the project advances.

The retained project is already 4/5 complete. Consequently the first browser acceptance must require both rejection and actual interruption before that same End turn completes. A rejection alone followed by victory is a failure, even if the next hypothetical plan would besiege. Parent integration must preserve that opportunity without repeatedly planning unrelated work. The subsequent [same-batch probe](reject-siege-batch-evidence.json) demonstrates that rejecting this offer leaves relevant siege facts unchanged, so an ordinary rejection followed by the prevalidated siege can protect the host before End turn. The AI owner is integrating that bounded coherent pair; no broad worker replan is claimed or proposed as delivered here.

## Primary incoming-offer journey

Use the retained `near-complete.theandril`, raw SHA-256 `f77d05d363e8065bbcc263632100797afd8ee1502b47df2bf9f5149413ed1a4a`, canonical hash `c705fc04`, turn 27. This is the explicitly authored Short-pace regression: infrastructure, budgets and guard placement were authored, while research, payment, war duration and progress came from ordinary commands. Do not describe it as a generated mature campaign or as the explanation for the headline pacing results.

1. Deserialize the exact retained state and wrap it in a portable player-mode archive with coverage beginning from the save. Assert project 4/5, visible host `settlement.5` at 488 and Reedbound `army.4` adjacent at 489. Start at the real production base URL and assert development hooks are absent.
2. Import through Import save file. The player seat is Ashen Compact, the project owner. Open Realm affairs and the public project panel; read the actual 4/5 active project. No spectator fog override is needed to see the player's own host.
3. Use Negotiate peace with Reedbound Council and the existing peace builder to send a ten-turn, zero-coin offer. Do not inject that offer through a browser hook. The ordinary player peace preview remains its existing assessment; the AI-specific imminent-project policy must not be represented as a changed canonical treaty rule or a guaranteed preview result.
4. Close the real management window and press End turn once. Require the worker to finish at turn 28 with no victory. Open Realm affairs and require the project to report paused at 4/5 with its canonical siege/blockade reason.
5. Export through the public menu. Require an accepted `proposePeace` from Ashen, then an accepted `respondPeace` with `accept:false` from Reedbound, then an accepted `besiege` by `army.4` against `settlement.5`, all before the relevant `endTurn` record. Reject a sequence that delays interruption until a later turn. Verify war remains, no binding treaty was created and the siege/project state agrees with the public panel.
6. Verify exact archive replay, manually save, reload and export again. Compare the whole archive and state hash. Retain a native desktop project-panel screenshot and a 390px/130%-text view of the canonical paused status, plus command-sequence JSON and the final portable save. Coverage remains explicitly partial.

If a public action pauses for another genuine battle/capture decision, record and resolve the actual available control rather than granting state, filtering the archive or faking the project status. Do not silently substitute a different fixture if the intended action is unavailable.

## Outgoing-offer decision journey

Import the same exact state in player mode without submitting peace. Press ordinary End turn. Reedbound's AI must choose the available immediate siege instead of its previous prolonged-war white-peace offer. Require accepted `besiege` before the first turn advance, paused 4/5, no victory and no new Reedbound peace proposal in that decision pass. Preserve exact save/replay as above.

This isolates the opponent's outgoing policy while the player seat's own AI is not also planning. A Watch-mode smoke case can be added only if it supplies distinct worker coverage; it must use public Step one round and must not assume the full-world branch matches an isolated planner branch.

## Meaningful control

The retained `own-faster-near.theandril` is a separate authored six-town fixture, raw SHA-256 `9e2752dfd198ba96e432128993ea57e8cde3040e5d02f011a5294c2eba9f9a80`, canonical hash `626f4259`. Reedbound's own active project is 4/5 while Ashen's is 3/5. The diagnosis proves that an immediate siege is otherwise legal and accepting peace lets Reedbound win next turn.

After confirming the saved player seat and public controls, import this state, send the same ordinary offer from Ashen and End turn. Require accepted peace and Reedbound's prosperity victory, with no counterplay siege substituted for its strictly sooner project. Export and replay the actual archive. This is a negative policy control, not evidence that every treaty is valued well. Unavailable-force, hidden-host, direct-order, delegated-actor and budget cases remain focused unit/query coverage unless separate browser cases are warranted.

## Scheduling and limits

Author production tests only after parent approval of the integrated query/policy contract. Retain any first browser failures in a unique packet directory. Build and run during the parent's quiet integration window; keep publication live-readback scopes tied to their already-collected identities. No worker or AI mutation belongs in the browser helper. Parent owns full-suite checks, query/command parity, historical execution, benchmark and the unchanged headline pacing matrix. None of these proposed journeys closes R06, DH-021 or a 1.0 gate by itself.

## Outside-discovery draft

[production-counterplay.draft.txt](production-counterplay.draft.txt) prepares four real worker cases: player End turn with/without a public offer, and Watch Step one round with/without an initial offer. Watch incoming setup records an ordinary proposal in the imported archive because Watch does not allow player diplomacy commands. Its no-initial-offer case allows the other AI realm to introduce an offer during that full round; it does not pretend this isolates the outgoing branch. The player no-offer case isolates outgoing policy. Every case requires actual siege before the first endTurn record, paused 4/5, no victory, continued war and exact replay/save recovery. The draft is stored as text so it neither enters Playwright discovery nor the packet TypeScript wildcard while its helper paths target the eventual production location. It has not been run or claimed passing.

After the parent confirmed that the posting fix's live suite had collected, the four cases were promoted to `tests/production/project-counterplay.spec.ts`. Playwright collection finds all four and scoped ESLint passes. Browser execution and the counterplay candidate production build remain on hold while parent-owned full-suite and headline pacing measurements run. The earlier live publication keeps its already-collected scope; these four tests are not retroactive evidence for it.

## Sustained Watch follow-up (authored, awaiting final build/run)

The first four cases passed only the immediate turn-28 interruption. Follow-up diagnosis found a later actual Watch offer accepted at turn 30, releasing the siege and allowing completion at turn 31. Preserve that first checkpoint; it does not validate the extended policy.

The production test now advances each Watch branch through five ordinary rounds, from turn 27 to turn 32. Each intermediate public export must replay exactly. Through turn 31 the project must remain paused at 4/5 with Reedbound's actual siege, no victory and no treaty. The fresh turn-30 offer must be followed by an accepted rejection. No Reedbound proposal or accepted peace may release the host. Player End-turn cases retain their distinct first-round scope.

The fifth round preserves real combat rather than granting a defender win. The diagnostic predicts two branches: the initial-offer Watch battle ends in mutual withdrawal, which lifts the siege and permits Ashen's legitimate turn-32 prosperity victory; the no-initial-offer branch wins the assault, occupies the host and cancels its project. Tests assert the actual assault, resolved battle and capture or siege-lift events, as applicable. Neither result may be replaced by a fake state mutation or described as universal AI victory.

Final save/reload compares the whole five-round archive and state hash. Desktop imagery remains the initial paused project; the final narrow image is named `project-outcome-narrow.png` to distinguish completion/cancellation from a still-paused state. Retain the new run in a separate directory from `browser-results`. Collection and scoped lint pass; browser acceptance remains pending parent build approval.
