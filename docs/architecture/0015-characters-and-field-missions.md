# 0015 — Named command and escorted field missions

Date: 2026-09-05. Status: implemented; character tests, replay, browser workflows and scale measurements verified (see implementation status).

## Player outcome

Extend the composed-army foundation with named, paid appointments: a marshal leads an army and can Rally its formations; a surveyor charts terrain; an engineer refits damaged formations or undermines an ongoing siege. Assignments, two-turn commitments, interruption, advancement, wounds and death are real rules, not character slots. This advances the character/AI/commander portions of Gates B/C/F, not their full completion.

## State and ownership

`packages/sim` owns a sparse normalized character registry. Each living character is hosted by one owned army or settlement. Attachment requires co-location; there is no character teleport or second pathfinder. An army carries at most one marshal and two agents. Owned character read models expose commands, costs and blockers; foreign officers/agents remain private in ordinary strategic observations. An actual witnessed battle discloses its participating field officers' frozen identities, committed effects and aftermath, not unrelated people or missions. These practical field roles are not yet covert spies. A bounded, searchable roster dialog provides inspection and real orders without moving route controls below a long roster.

Character content, naming pools, mission parameters and mutually exclusive specializations are validated data. National magical research and personal aptitude are deliberately not invented here: caster capability must arrive alongside an effect it can actually enable. Similarly, loyalty, offices and political life are not decorative fields implying systems that do not exist.

## Combat and missions

New battles freeze participating character identity, leadership, abilities and aftermath. Manual and automatic Rally share one primitive before the existing deterministic round engine; the ability never resets combat randomness or heals strength. Battle experience and a specialization choice have material effects. Retreat wounds attached characters; destruction kills them. Surviving history remains factual through frozen reports and events.

Missions spend coin and commit the carrier to a location. Queued travel pauses, active work prevents ordinary movement/reorganization, and cancellation or combat/displacement interrupts without a refund. Completion happens at the turn boundary so the normal refresh permits action on the completed turn. Survey reveals remembered terrain, not unseen armies. Refit restores bounded existing formation losses, never deleted formations. Sabotage operates on an actual hostile siege with seeded failure/wound risk. Because current defenses cap at 30 and decay by 10 per turn, the Siege craft specialization improves reliability rather than offering an unreachable extra-damage bonus.

## Compatibility and evidence

Schema 7 recognizes schema-6 content `96918834`, adds an empty registry to migrated campaigns, and preserves original origins, command rules and battle seals. Old pending battles receive no retroactive leadership or experience. New character orders cannot be replayed as older accepted commands; nonempty modern character state cannot be silently stripped into an old save.

Before changes, genuine schema-6 archives were retained: merged caravan/scout travel and split, final seal `90ffebed`; mixed four-versus-three-formation battle, with pending and round-one saves, final seal `31b14677`. Exact old results and reports, new saved mission/battle continuation, AI usage, real browser controls and sparse-registry measurements now pass. The integrated character, storage and faction-art checkpoint also passes all 43 Chromium workflows. See [measurements](../performance/0008-characters-and-missions.md) and [current status](../IMPLEMENTATION_STATUS.md).
