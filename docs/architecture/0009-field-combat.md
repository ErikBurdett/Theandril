# ADR 009: Field combat and save schema 2

The deterministic formation kernel is shared by tactical orders and autoresolve. A campaign engagement references one initiating army and every defender on the target hex, up to twelve defenders. A larger stack is rejected explicitly until attacking groups and larger battlefield orchestration exist. One pending engagement blocks strategic commands, so armies cannot move or duplicate resources while their battle is unresolved.

Human participants control their own side's orders; the opponent uses the same bounded battle AI. An AI attack interrupts end-turn planning for human intervention. After resolution the player can end turn again; planners use remaining legal movement and resources. This foundation does not persist a phase-resume cursor.

Canonical aftermath stores entering strength separately from unit capacity and records final strength, destination and destroyed/retreated/held/advanced outcomes. Reports can reference armies that no longer exist. Saves validate pending battle positions, participants, defending-stack coverage, content stats, seed, war, army movement and report aftermath before replacing a campaign.

Save schema 2 adds wars, battle state/history and army morale/fatigue. Migration verifies a schema-1 checksum and known compatible content hash before adding the new defaults. Schema-0 support remains a synthetic migration fixture. Combat adds no runtime network or browser dependency to simulation.
