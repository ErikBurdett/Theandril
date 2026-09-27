# Dispatch 12 draft — Give your hearths a standing watch

**Historical pre-final draft, 27 September 2026. Not the reviewed article.**
The final reachability fix, pacing comparison and measurements supersede pending claims below; see [the implementation evidence](README.md). Retained as authoring history, not publication copy.
Prepared under [the dispatch authoring contract](../../updates/CONTRIBUTING.md).
This document changes no public journal entry, image, catalogue count or release gate.

- Suggested stable slug: `defense-theaters`; sequence: 12.
- Suggested subtitle: `Defensive theaters`.
- Source revision: **pending final reviewed implementation pin**. Baseline is
  `c5aa2615798bbc09efc9ca011dbb77f3d198980e`; it does not contain this feature.
- Candidate rules/save: **33**, following 32. Content remains **`015468d1`**.
- Categories: Empire management, Army orders, AI, Saved campaigns, Performance.
- Suggested summary: Name the hearths to protect, assign their watch companies
  and choose a reserve. Idle members fill missing garrisons on later turns while
  your direct routes and standing postings keep priority.

## Proposed article copy

### Protect a group of hearths

A standing posting gives an army a destination and an arrival duty. Group travel
lets several armies receive their separate marches together. Keeping several
hearths staffed still means deciding which idle company should fill each gap.
Defensive theaters give that recurring decision a home: choose the hearths,
assign the armies allowed to serve them and set a reserve hex for the surplus.

The candidate lets a realm keep eight named theaters. Each can protect up to
sixteen owned hearths and contain up to 128 combat land armies. Set a floor of
one to four **whole army containers** per hearth. A twenty-formation field army
and a single-company detachment each count as one guard; the setting does not
promise equal strength. Founding caravans cannot be added, and new members must
be ashore. An army or hearth belongs to only one theater in its realm.

Recall an existing saved army group or check armies in the registry, then copy
those checks into the theater draft. Name the watch, select its hearths and
choose an explored reserve destination. Editing and copying checks leave the
campaign alone. Creating or saving the theater commits the configuration;
automatic assignment begins on the next End turn. Updating membership replaces
the list, with additions and removals shown before saving.

### Watch the gaps close

The authored browser exercise uses two hearths, West watch and East watch, and
one hundred explicitly created companies. Both hearths begin empty. A player
sets two armies per hearth, leaves one company's hold posting intact and saves
the theater. On the next turn the allocator sends four eligible companies
toward the two hearths. The report distinguishes guards physically stationed
there from those incoming. It can show zero missing guards while all four are
still on the road; that is promised coverage, not an assertion that they have
arrived. This controlled fixture is not an organically grown campaign.

Allocation repeats after ordinary travel and postings each turn. Existing own
guards count even when they are not theater members, but only assigned members
receive new orders. An active route whose final waypoint is a protected hearth
counts as incoming. That promise prevents duplicate dispatches; it never
licenses taking the last required physical guards away from their own hearth.
Eligible surplus members gather at the reserve.

Each theater attempts at most sixteen new routes per turn, including refusals.
Member and destination rotation share later attempts among candidates instead
of repeatedly giving the first inaccessible destination every opportunity.
The report retains actual accepted and refused dispatches. Ordinary explored
routes keep their movement costs, search bounds and interruptions; the theater
cannot start a battle or declare war to complete an assignment.

### Keep direct orders in charge

Active and paused routes take priority, as do standing postings. An embarked
army, a force maintaining a siege or a company supporting a stationary character
mission is not reassigned. An earlier theater route is still ordinary travel:
it finishes or waits for the same explicit intervention as any other route.

Pausing a theater, deleting it or detaching one army stops future delegation.
Existing travel continues. Cancel a route separately when it should stop; if
the army remains an idle member of an enabled theater, it can receive another
assignment next turn. Captured hearths remain listed as unavailable without
refreshing their enemy names or locations. Lost members are pruned, and an
empty theater can be edited and staffed again.

### A small watch for the AI

The AI uses the same observed facts and `setTheater` command. Once it has at
least two hearths and enough ordinary combat containers, it can delegate up to
two idle single-company spares to a Home watch. It reserves the two strongest
ordinary armies for field operations, retains scouts and caravans, and assigns
no more than one third of the eligible combat-container count. Each selected
hearth receives a floor of one army.

Delegated members stay reserved across the rest of that proposal and later
movement, merging, naval, survey, depot, character and siege planning. This is
deliberately conservative adoption: the AI does not replace an existing custom
or paused theater, refill an empty one after casualties or redesign a frontier
in response to threats. Headline campaign pacing must be evaluated with this
policy before the checkpoint is accepted.

### Preserve the campaign's history

Configuration, its independent identifier counter and the latest bounded
dispatch report belong to the simulation. React edits drafts and displays own
read models; the worker submits ordinary commands and attempts an autosave
after accepted edits. Reports do not run path searches. Interrupted publication
requires saved-campaign recovery before further orders, and storage failure is
shown rather than silently represented as a durable save.

Rules/save 33 adds the theater register while preserving rules-32 command and
hash projections. Older campaigns receive an independent empty register when
continued under current rules. Retained pre-change saves and archives include
generated campaigns, direct travel alongside standing postings, and an actual
sixty-four-seat boundary. They must replay against their recorded historical
semantics; neither theater configuration nor consumed theater identifiers may
be silently discarded by a downgrade. This is a save/rules change, with AI
behavior to measure, even though the content pack and prices are unchanged.

### Continue toward 1.0

This implements a bounded part of the existing ACT-32/M3 delegation work.
There is no additional gameplay obligation or scope cut in this checkpoint.
Threat assessment, patrol and escort roles, invasion strategy, reusable army
order templates, broader governor choices and combined mature-realm acceptance
remain unfinished. The existing military-depth and empire-management catalogue
items remain in progress. **All fifteen release gates remain open.**

**Verification paragraph is intentionally pending.** Insert only the final
retained source-linked results for headless integration, compatibility,
browser/production journeys, pacing, measured workloads, review and publication.
Do not add overlapping focused and full-suite counts together or treat a
screenshot, a short authored workload or successful deployment as release
acceptance.

## Images: reviewed reuse and a bounded new candidate

Recommended existing illustration: **`selection-groups-recall`**, reused by its
existing URL. The exact public native PNG is 318 × 121 pixels and 15,348 bytes,
SHA-256 `28236174d7b432ccf6ed1188b9529fe9a5f41d8b45ca61a7c59358a58f42e2ec`.
Its published source is `0d26fa3c34ac89164637f515e95671420400a841`, with retained
source at
`docs/development/2026-09-25-selection-groups/screenshots/selection-groups-recall.png`.
The file's hash was checked against the existing manifest and its final pixels
inspected for this draft. Reusing its existing URL adds no public image bytes.

Keep its historical provenance/caption intact. Adjacent article text should
say: **“The existing saved-group Recall control supplies the checked armies
used by the new theater editor. This earlier authored capture shows Recall,
not the new theater report or an automatic dispatch.”** It visibly depicts the
correct prerequisite workflow, not a claim that its old interface contained
theaters. Alt text remains the existing meaningful description of the selector
and Recall button.

The inspected `group-postings-narrow` capture is also truthful as a separately
labelled historical comparison: it shows individual hold postings issued as a
group. It should not be the new theater's hero image. The inspected
`group-travel-results` clip says only “100 orders accepted · 0 refused”; reusing
that as a theater result would imply a false allocation count, so avoid it here.

The public manifest currently contains sixteen journal images totalling
**3,141,226 bytes**, leaving **4,502 bytes** under the unchanged 3 MiB cap.
A useful new candidate would be a **native browser clip of the actual theater
summary paragraph after the first allocation**, including both missing and
incoming counts. At a real 390 px viewport this may occupy two lines; its exact
encoded size is not yet known. Keep it only if the complete readable clip fits
the remaining 4,502 bytes and receives independent pixel review. Its caption
must distinguish incoming guards from arrived guards and identify the authored
hundred-company setup. Do not cut the incoming qualifier to fit the budget.

Capture through the normal browser screenshot mechanism after asserted text
and settled layout. Retain the uncropped surrounding screenshots, source pin,
viewport/device scale, native clip bounds, exact dimensions, PNG bytes and
SHA-256. No new image was captured, edited, approved or published by this
draft. If the honest summary does not fit, reuse the existing Recall image and
link the complete repository captures; do not enlarge the cap or relabel old
results as current evidence.

## Source and evidence checklist

| Claim | Authoritative source / evidence | Draft status |
| --- | --- | --- |
| Bounds, eligibility, guard units, own-only report | `packages/sim/src/theater-state.ts`; `packages/sim/src/theaters.ts`; `docs/architecture/0045-defense-theaters.md` | Implemented candidate; final review pending |
| Allocation, incoming/physical floor, overrides, refusals | `packages/sim/src/theaters.test.ts`; `packages/sim/src/theater-lifecycle.test.ts` | Final integrated result and source pin pending |
| Human editor, explicit replacement and recovery | `apps/web/src/defense-theaters.tsx`; `apps/web/src/theater-response.ts`; matching focused tests; main/worker integration | Final independent review pending |
| Historical 32 → 33 continuation and rejection boundaries | `historical/manifest.json`; `packages/chronicle/src/defense-theaters-compatibility.test.ts`; `packages/sim/src/theater-save.test.ts`; `packages/persistence/src/defense-theaters.test.ts` | Retained historical bytes and focused logs exist; final source-linked integration pending |
| Actual AI commands, held actors, saves/replay and hidden-state independence | `packages/ai/src/theaters.ts`; `packages/ai/src/theaters.test.ts`; AI planner integration | Focused results passed; durable feature-packet log and final aggregate pin pending |
| Authored hundred-army workflow and saved recovery | `tests/gameplay/defense-theaters.spec.ts`; retained `browser-initial.log` and `browser-evidence/` | **Browser acceptance pending**, including affected regressions, generated production and visual review |
| Generated production without development mutation hooks | `tests/production/defense-theaters.spec.ts` | **Pending final run/readback** |
| Campaign-resolution consequences | `scripts/measure-pacing.ts`; retained initial/final pacing logs | **Pacing acceptance pending**; do not excerpt an incomplete stream as a completed result |
| Huge/Legendary active phase and observation costs | `scripts/benchmark-defense-theaters.ts` | **Benchmark pending**; no timing or throughput claim yet |
| Image bytes and historical reuse | `apps/web/public/updates/provenance.json`; `apps/web/src/updates/media.json`; native files | Existing Recall image hash/pixels checked; any new capture and publication layout pending |
| Canonical status, catalogue and gates | `docs/IMPLEMENTATION_STATUS.md`; `docs/1.0-DEVELOPMENT.md`; `apps/web/src/updates/library.ts`; `DEFINITION_OF_DONE.md` | Final current-snapshot reconciliation pending; preserve every historical dispatch |

The benchmark's proposed evidence covers one active realm per case, independent
same-save samples after one warmup, headless theater allocation and observations.
Its ceiling uses authored flat geography, eight theaters, sixteen hearths each
and 128 members each, including disconnected members. It does not establish
simultaneous sixty-four-realm saturation, worst-case 4,096-node searches,
browser-worker transfer, sustained memory, rendering or full-campaign pace.
Movement may change sight; any eventual fog claim must compare permitted
observations rather than assert unchanged fog.

Before public content authoring, pin the final reviewed implementation, copy
all retained relevant failures and successful logs into this packet, reconcile
the existing catalogue without inventing completion percentages, and obtain
independent factual/image review. Then run the normal journal/Pages checks.
Publication and live readback remain separate authorized steps; neither has
occurred for this draft.
