# Specialist formations and versioned replay

The previous land roster covered five military silhouettes but left little
choice after researching an estate's infrastructure. Four additional land
formations reuse the existing formation, range, armor, initiative, movement,
upkeep and recruitment rules:

- Reed skirmishers: mobile short-range troops; Stewardship and a granary.
- Witness arbalesters: long-range, hard-hitting troops with slow initiative;
  Cinder masonry and a workshop.
- Kiln halberdiers: armored reach infantry with slow campaign movement;
  Quarry cranes and a workshop.
- Road lancers: mobile close-combat cavalry; Surveyed estates and a market.

Their costs and unlocks come from canonical production quotes. Human and AI
orders use the same paid research, queue, completion and army capacity rules.
Faction preference weights include the new formations. The original five-role
cohort fixture remains an explicitly basic-roster comparison; separate tests
prove the AI legally pays for each missing researched specialist.

Appending IDs changes the content seal even without changing state shape.
Rules, saves and journal commands advance to version 15. Version 14 retains
its original `b6e3bce2` seal, and the prior nine unit definitions and historical
pack projections remain frozen. Migration validates the old checksum and
rejects specialist IDs in old armies, production queues and battle bindings
before adopting the new seal. A captured pre-change journal is replayed with
its original bytes and can then accept version-15 commands. New commands
cannot be replayed under an older roster by resealing their envelope.

These are distinct game formations with explicitly shared art. The pure
`unitArtRole` presentation adapter selects existing culture-qualified scout,
pike and cavalry silhouettes for map, battlefield and recruitment cards. It
does not invent dedicated asset IDs, export provenance or approvals. Actual
asset IDs and explanatory shared-silhouette titles remain available in the UI;
all 24 cultures still use their own approved source family. Dedicated future
art can replace an adapter entry after the normal source and runtime review.

Verification includes all four paid browser recruitment flows, save/reload of
unfinished orders, earned-knowledge unlocks, exact mirrored state hashes,
historical journal replay, real combat range/initiative behavior, and
culture-qualified shared-art coverage. Native and narrow-screen screenshots
are captured by the browser roster scenario.
