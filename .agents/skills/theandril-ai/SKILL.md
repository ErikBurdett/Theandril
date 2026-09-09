---
name: theandril-ai
description: Use when implementing faction AI, economy AI, diplomacy AI, military theaters, operational planning, tactical battle AI, agent AI, difficulty, automation, or AI performance.
---

# Theandril AI

AI must play through the same public command rules as a human.

## Hierarchy

Plan at separate horizons:
- grand strategy;
- theaters/fronts;
- operations;
- settlement/economy;
- diplomacy;
- progression;
- characters/agents;
- tactical battle.

Do not let a low-level unit heuristic decide national strategy.

## Planning model

Prefer a hybrid:
- utility scoring;
- goal decomposition;
- cached influence maps;
- bounded candidate generation;
- limited lookahead for high-value decisions.

Avoid brute-force search over every possible command.

## Geography

Military AI should reason about:
- theaters;
- fronts;
- chokepoints;
- travel time;
- supply;
- force concentration;
- enemy threat estimates;
- objectives.

Do not assign every army independently from scratch.

## Parallelism

Workers receive immutable observations and deterministic substream seeds.

Workers return ranked plans/proposals.

Canonical sim validates/applies them in stable order.

Worker timing must not change outcomes.

## Debuggability

For major decisions, retain compact debug reasoning:
- chosen goal;
- top alternatives;
- important utility terms;
- rejected red-line constraint.

Show this in development AI inspection tools, not as omniscient player information.

## Testing

Include scenarios for:
- expansion;
- economic recovery;
- defense;
- invasion;
- peace;
- alliance;
- supply-aware retreat;
- naval transport if supported;
- victory pursuit;
- 32-faction stress.


## Roster growth and exploration regressions

New formations can change paid recruitment timing, fog coverage and global entity
allocation even when their combat implementation uses existing mechanics. Run the
unchanged generated contact scenarios alongside authored recruitment tests. A
new threshold failure is a regression to investigate, not a reason to lower the
contact target or silently suppress the new roster in a campaign fixture.

Use the complete observed observer set to explain first contact. A foreign fleet
in sight may have been discovered by an embarked caravan or a land scout; the
presence of a nearby friendly warship alone does not identify the witness.
Compare actual coordinates and sight ranges before changing naval policy.

Reserve a required ship's real, currently legal quote before optional character
appointments. End that reserve when the ship is queued, operating, or blocked;
keep transport capacity, harbor eligibility and knowledge budgets authoritative.
Prove the behavior with paid production and a save/replay mirror.

When investigating exploration, separate immediate sight gain from transit to a
distant frontier. Record the branch and relevant scores before changing weights.
Preserve search budgets and the historical default-navigation oracle; policy
changes should have a distinct observed-purpose regression, including immunity
to unrelated global ID allocation where that identity is not operationally useful.

## Uncapped realms and shared economic obligations

Rules16 founding preferences use the real growing establishment fee and the
observed fertility/developed footprint of neighboring hearths. A4/6/8-town target
must not block an otherwise affordable modern settlement. Hold a pending
caravan's quoted founding funds against optional purchases; count multiple
proposals in one batch and charge the increasing fee for each.

Use actual observed ongoing income/upkeep and queued obligations when expanding
optional forces or appointments. A one-time coin balance does not prove that a
realm can maintain another specialist. Keep a bounded operating purse capable of
paying one genuinely missing unlocked role; a fixed24-coin purse can permanently
starve a32-coin role. Preserve the final victory-project funding guard.

Resource planning sees only charted deposits and canonical extraction quotes.
Prioritize the first worked source while the material buffer is low; reduce demand
for duplicates, retain the last productive source, and sell only actual quoted
surplus while preserving development supplies. Verify all resource types through
paid construction, workers, turn extraction, exact market sales and save mirrors.

For an isolated realm with other faction seats, save toward a real expedition
before its entire funding threshold is met. Preserve the next basic building and
the first currently legal ocean-scout quote. Carry that quote through long-term
project savings as well as optional appointment budgets; reserving it only after
the project reserve was computed can still make an affordable ship unreachable.

A ready open-sea harbor is a concrete first-contact research goal for modern
isolated realms. The strategic and naval planners must agree on that goal before
cheaper land research spends its knowledge. Test an underfunded observation and
the subsequent exact paid research command; do not invent knowledge, silently
complete prerequisites, or relax the existing contact-turn thresholds.

Modern individual combat retains wall armor and braced cohesion. Validate siege
policy with real battles at different observed defense levels; an ordinary
numerical advantage is not sufficient evidence for an early assault. Keep the
historical command and combat fixtures exact when changing current AI choices.
