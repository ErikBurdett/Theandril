# Project status and next development

## Prompt

“Where are we at with this project? What's next to develop? Use Jev if needed to help you”

## Delivered

A source-checked assessment and ordered development recommendation. Theandril is a substantial playable development build; the [canonical release gates](../../../DEFINITION_OF_DONE.md) remain open. The [existing roadmap catalogue](../../../apps/web/src/updates/library.ts) remains authoritative rather than introducing another roadmap or a completion percentage.

The playable foundation includes seeded worlds and fog, [twenty-four cultures, eight resource economies and twenty-five development nodes](../../../apps/web/src/updates/library.ts), settlement growth and cultivation, general-led armies, fleets and transport, tactical combat, conquest/peace, saves/replay and campaign chronicles. Recent rule-17 combat and storage corrections have scoped independent approval; [full integration remains unapproved](../post-fix-review/summary.json).

Recommended order:

1. Close the [two outstanding naval AI findings](../integrated-review/ai.verdict.json): count queued harbor construction as a funded commitment, and avoid rebuilding observed geography for every eligible founder. Reproduce and verify within the authorization for the next development task. Investigate campaign timing failures and perform integrated verification on the resulting revision, preserving existing assertions and budgets.
2. Deliver client-state diplomacy and a contestable unification/conquest victory. Include visible obligations and termination, AI acceptance and resistance, victory progress and counterplay, and historical save/replay compatibility. The [victory schema](../../../packages/sim/src/progression.ts) currently permits only Prosperity; working war, peace and capture rules provide extension points. This slice would add another campaign objective without claiming all diplomacy or victory requirements complete.
3. Deliver a small complete magical-site → research → qualified caster → effect/counter-magic loop with meaningful faction differences. The [current magic implementation](../../../packages/sim/src/magic.ts) already distinguishes national research from personal aptitude, but full rituals, items, summons and sacred/occult systems remain open.
4. Add empire delegation through production policies, grouped alerts and bounded theater/rally orders. Supply/trade, independent powers, politics/epochs/crises, broader content, multiplayer and final browser/scale verification remain accepted release work.

## Changed

- `docs/IMPLEMENTATION_STATUS.md`: current branch/CI readback and a reminder that newer records supersede historical milestone descriptions.
- This prompt report and `INDEX.md`: local review record.
- No gameplay, tests, content, assets, saves, roadmap states or release verdicts changed.

## Verified

- `git status --short`, `git log` and GitHub commit readback confirmed a clean starting checkout on `master`, with local and remote at `f07024fe23ad3386874656d48fbbc33a5380d979`, dated September 12.
- `gh run list` and the latest job/log readback confirmed [Pages publication succeeded](https://github.com/ErikBurdett/Theandril/actions/runs/34724815655), but [Verify campaign failed](https://github.com/ErikBurdett/Theandril/actions/runs/34724815613). That hosted run passed **1,712/1,716 tests** and timed out in Epic archive victory, Standard/24 contact, Huge/32 contact and Epic seed-74 pacing. Those contact timeouts are not evidence of failed contact assertions. No test was rerun for this assessment.
- A parallel coding-agent source review corroborated the remaining AI code paths, Prosperity-only schema and recommended next feature. It ran no probes or tests and made no edits.
- Core and release-QA skills guided the assessment. No callable Jev integration was discovered; existing retained independent reviews and the parallel source review supplied additional context.

## Not done / blocked / caveats

This was an assessment, not authorization to implement the suggested systems or retry previously blocked review probes. Historical AI authorization blocks and scoped acceptance boundaries remain recorded unchanged. Current GitHub metadata was checked; the hosted game was not freshly browser-tested. No complete local test suite, benchmark, art review or release audit ran. Older status paragraphs contain superseded counts and limitations; current slice-28 records and the roadmap take precedence.

Nothing was committed, pushed or deployed. The primary checkout already matched remote `master`; no publication sync was needed. This local status report is not a public developer dispatch.

## Follow-ups

Use the existing campaign-safety roadmap item as the next implementation work packet, then the victory/diplomacy item. Retain both earlier failures and new verification evidence separately, and update the existing status/catalogue as actual features and acceptance change.
