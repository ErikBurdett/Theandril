# Dispatch 21 draft — Keep growing hearths at work

**Draft only, 2026-10-25.** Source commit, final integration checks, browser
results, image review and publication are pending. This file is an authoring
packet, not a published or accepted checkpoint. It follows the existing
[dispatch contract](../../updates/CONTRIBUTING.md).

Suggested stable ID: `worker-stewardship`. Edition: `21`. Topic: Engineering.
Suggested tags: Settlement management, Workers, Governors, Saves, Campaign pacing.
Rules/save: **36**. Content: **015468d1**, unchanged. Source revision: **pending**.

## Proposed player-facing copy

### Keep growing hearths at work

A new household or a wider border creates another decision about who works
where. Worker stewardship lets you choose a hearth’s economic priority once
and let it revisit those assignments as the town develops. Choose Balanced,
Food, Industry, Coin or Knowledge in Land & stewardship, or apply one priority
to a checked group of hearths.

Applying a policy assigns workers immediately where land management is
available. It then checks again after each turn’s growth and land work, ready
for the following harvest. It uses the hearth’s existing claims and ordinary
worker capacity. It spends no coin and makes no purchases, improvements or
cultivation orders. Production charters remain a separate choice.

Named priorities favor their particular yield; Balanced values food more when
reserves are low while also considering industry, coin and knowledge. There
is a real tradeoff: choosing a different set of tiles can reduce other yields
or stop material extraction from a deposit that loses its worker. Stewardship
does not secretly protect extraction sites. Inspect the result and choose
manual assignments when the hearth needs a more particular arrangement.

Returning to manual control keeps the current workers in place. A successful
individual Assign worker or Remove worker order also ends the policy, so it
will not undo that correction next turn. Siege and occupation pause allocation
with a stated reason. Capture or razing removes the old policy.

### One priority across several hearths

The settlement registry applies the same chosen priority to up to 128 checked
hearths, including checks outside the current filter. Ordinary refusals remain
per hearth. Accepted and refused results use the existing named, filtered and
paged receipt; unaffected and refused selections remain available for review.
Removing policies acts only on checked hearths that currently have one.

The submitted group request is tied to the campaign the player reviewed. A
stale request is refused before any command begins. If recording or publishing
results fails after execution starts, gameplay requires saved restoration.
These batches follow the existing charter workflow and do not create an
immediate autosave; manual save, export and replay remain separate operations.

### Preserve the history; measure the consequences

Worker policies are canonical campaign state in rules/save 36. Earlier saves
migrate with no policies. A genuine rules35 save and fourteen-record archive
were captured before implementation, preserving their bytes, original seals
and old-command outcomes. The compatibility checks also cover adding modern
policies and turns without rewriting those earlier records.

The first AI adoption experiment was too broad. For the twelve-realm Standard
map at seed 20260905, Standard/Long/Epic campaigns ended at 233/346/385 turns,
compared with the pre-change 219/329/374. That measurement is retained. The
planner now delegates only a completely quoted, resource-free hearth whose
available workers can cover all its legally workable quoted claims and which
does not need its special project-funding allocation. Scarce-worker tradeoffs,
material decisions and incomplete land pages retain direct management.

The corrected runs end at **219/329/374**, matching that baseline without
changing prices or proxy test bounds. Epic includes three policy installations
and six automatic allocation events; Standard and Long install none. These
results establish a narrow before/after comparison, not general AI competence
or completed pacing. The existing Long result remains later than the roughly
300-turn target, other seeds have not yet been remeasured under these rules,
and DH-021 remains open.

## Evidence to attach before publication

- Actual generated browser example: founding, Food policy, ordinary growth,
  automatic assignment of the new worker, then exact save/restoration. **Run
  pending; insert actual turn, counts and evidence after verification.**
- A second ordinary-founded generated seed17 journey changes Industry to Food,
  then makes a direct manual correction at 390px and 130% text. **Browser run
  pending; do not present the planned outcome as passed.**
- Authored group workflow and failure/recovery journeys: **results pending**.
  Keep the large setup labelled authored, separate from organic campaign proof.
- Genuine historical capture: [metadata](prechange-metadata.json),
  [raw save](../../../packages/sim/src/fixtures/worker-policy-v35-save.json),
  [archive](../../../packages/sim/src/fixtures/worker-policy-v35-archive.json),
  [compatibility checks](../../../packages/chronicle/src/worker-policies-compatibility.test.ts).
- Pacing: [before](pacing-before.json), [retained broad-adoption experiment](pacing-broad-adoption.json),
  [corrected result](pacing-after.json). These are three separate runs, not
  additive acceptance counts.
- Final full local suite, typecheck, lint, build, land-scale benchmark and
  browser evidence: **pending final review**. Do not copy a partially written
  log’s count or claim a current failure is already resolved.
- Independent [canonical/AI source review](source-review.md) and
  [group-path source review](group-source-review.md). Both describe source
  scope and their limits, not deployed acceptance.

## Image candidate — not approved

Candidate: `worker-policy-growth-summary-native.png`, captured by
`tests/production/worker-policy.spec.ts` from the real generated growth journey.
Suggested caption after verification: “Food stewardship after a generated
hearth gains a household. The policy assigns the new worker for the next
harvest.” Suggested alt: “Worker policy set to Food with two of two workers
assigned.” These numbers must match the actual retained capture.

The current public imagery budget has 42,033 bytes of headroom. Confirm the
candidate’s actual native dimensions, bytes, hash and displayed legibility;
record exact source and provenance before copying any pixels into public media.
No image has been approved by this draft. Reuse existing reviewed imagery if
the candidate does not fit. Do not enlarge the cap or change historical images
to make room without a separate justified decision.

## Existing roadmap update plan

Update the existing `apps/web/src/updates/library.ts`; retain every stable item
ID, all historical dispatch pins, and the fifteen separate open release gates.
After source and evidence review, set its current reference revision to the
verified source commit and its snapshot rules to36.

- `empire-management`: retain **In progress**. Add the bounded worker-policy
  behavior and the verified individual/group outcomes to delivered work. State
  that free worker allocation now extends governors beyond queue production.
  Preserve broader governor decisions, paid land programs, coordinated strategy,
  escorts, templates and organically developed mature-empire acceptance as open.
- `empire-delegation` scope entry: retain **Current / partial**. Include clear
  manual takeover, blocked-policy review, group results and the absence of
  automatic paid land work. Avoid claiming that all empire governors are done.
- `campaign-integrity`: retain **Current / partial**. Add rules/save36, genuine
  rules35 preservation and mixed-history continuation. Do not overwrite the
  previous patrol/history evidence or imply that Gate E is closed.
- `ai-integration` and campaign pacing references: replace current-checkpoint
  counts only with final verified counts. Link both the failed broad-adoption
  experiment and corrected headline comparison; retain DH-021 and its existing
  baseline limitations.
- Preserve all completed bounded checkpoints and pending systems. This is an
  implementation of the accepted M3 governor scope, with **no new gameplay
  obligation or scope cut**. ACT-32/M3, R06 and all release gates remain open.

The next useful governor extension should carry paid land-work choices through
their budget, interruption, material and AI consequences while preserving these
manual overrides. That is an existing-scope handoff, not a promise of a completed
construction planner in this dispatch.

## Publication handoff

Root must replace pending evidence with reviewed results, create the structured
entry through the existing journal components, review desktop/narrow/text-scale
and keyboard behavior, and attach immutable source/evidence links. Only then
commit/deploy under the user’s existing authorization and record exact Actions
and public readback. Deployment itself does not accept M3 or any release gate.
