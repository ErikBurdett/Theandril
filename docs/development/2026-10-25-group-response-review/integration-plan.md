# Proposed follow-on integration boundary

Application edits remain deferred until the group-patrol publication is frozen. The six-case [production draft](group-response-recovery.spec.ts.txt) is outside Playwright discovery and imports paths appropriate to its future home, `tests/production/group-response-recovery.spec.ts`.

## Ownership and minimal changes

- Parent: `main.tsx` integration. Enqueue posting/charter commands with request metadata, invoke their strict validators beside existing patrol/production/movement validators before state/render adoption, then finish only validated results or explicit recorder errors. Preserve the existing catch/finally recovery path and campaign restoration behavior.
- Request-class owner: a bounded submitted-faction/actor wrapper for posting and charter. Keep generic `GroupOrderRequests<Result>` available unchanged for other uses. `enqueue(id, commands)` retains faction and sorted actor IDs; `validate(id, factionId, results, error)` validates the matching request only; `finish/reset` discard metadata. Limit actor/result counts to `MAX_GROUP_ORDER_COMMANDS`, reject wrong length/order/identity, unknown row keys, wrong boolean, invalid text and refusal rows without meaningful reasons. Explicit recorder error means uncertainty even if partial results look valid. No simulation legality logic belongs here.
- Browser owner: promote the draft after the first publication's tests/build are fixed. Run two representative cases against the preserved **old** production build before applying the fix: posting duplicate, charter wrong-actor. Their expected failure is the restore-before-retry assertion, after the original native worker hash/result proof and visible false-completion evidence are written. Then run all six corrected cases against the new build.

The request-ID primitive does not know submitted actors today. A general rewrite could unintentionally alter selection groups or the newer wrappers; two narrow typed wrappers or a small parameterized actor-correlator are both suitable. Preserve normal complete mixed accepted/refused results and stable canonical ordering. Runtime cost is bounded by at most 128 submitted/result rows, with no world/army/settlement scans.

## Draft scenario details

The fixture uses `theaterCampaign(2)`: authored open terrain, treasury, two ashore guards and two canonically founded hearths. Its archive begins from that strict save and initially contains zero records. A public action submits exactly two legal `setPosting` or `setCharter` commands. The worker wrapper waits for their genuine completed state response and saves the real hash/results; only then it drops one row, duplicates a row or substitutes an actor ID in the presentation copy.

Each case asserts the original response hash equals an independent ordinary two-command journal. It records the UI's actual result text, selection text and End-turn disabled state **before** checking recovery, so an old-build failure retains the relevant observation. The corrected application must keep both actors selected, show no success table, settle pending status, and require restoration. Public Load returns to the exact zero-record manual save; a normal retry then yields the exact expected two-record archive and state. Both public exports replay through the shared helper and are retained as files.

The helper preserves every army and route. Charter scenarios additionally assert all settlement queues/state and faction treasury/state are unchanged. The deliberate injection is presentation damage, not invented canonical refusal or substituted state. Existing missing-field/malformed-boolean controls stay unchanged; those already reach recovery. Future implementation must also retain normal posting/charter production journeys.

Suggested focused fail-before selector after promotion, with the parent's frozen old build and explicit retained output directory:

```sh
./node_modules/.bin/playwright test --config playwright.pages.config.ts tests/production/group-response-recovery.spec.ts --grep 'posting duplicate|charter wrong-actor' --output docs/development/2026-10-25-group-response-review/browser-fail-before
```

No source mutation, build or browser run is implied by this plan. The exact-source probe has already run; production evidence remains pending.
