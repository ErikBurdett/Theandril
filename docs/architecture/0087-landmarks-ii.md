# ADR 0087 — Rules/save 57: the second landmark catalogue and its events

**Status:** accepted, 2026-10-31. Content only; no canonical field. Save 57
freezes the rules 54–56 pack. Evidence:
[`docs/development/2026-10-31-landmarks-ii/`](../development/2026-10-31-landmarks-ii/README.md).

## Context

Rules 51 placed twelve landmark kinds and rules 52 gave the old places five
events. The scope counts landmarks among its content targets, and a world of
twenty-four places drawn from twelve kinds repeats itself. The placement is
derived from the seed and the catalogue, so a larger catalogue must be read
for the rules it belongs to or a sealed reading would change.

## Decision

- **Twelve more kinds** from rules 57 — the Sunken Court, the Warden Tower,
  the Whale Road, the Ash Vineyard, the Singing Bog, the Ironwood Stand, the
  Lantern Reef, the Hermit Cells, the Old Ford, the Glass Lens, the Drum
  Hill, the Wreck Strand — with their terrains, shores and yields; twenty-four
  kinds in all.
- **Placement is read for a rules version.** `landmarks(world, rules)` places
  the catalogue of those rules from the seed and caches the reading per
  world and rules, so a rules 56 reading of a world keeps to the first twelve
  kinds and is read the same way again; the yield, the observation and the
  landmark condition read the campaign's rules. A loaded campaign plays under
  the current rules, as every other catalogue does, so its landmarks are
  read with the full catalogue from the first turn under rules 57.
- **Six more events of the old places**, one a chain: a hermit at the old
  place, stone-robbers and the bare place they leave, a market at the
  stones, travellers' tales, fire at the old place. Fifty-seven templates;
  the rules 56 catalogue is frozen.
- **Save 57** upgrades v56 envelopes unchanged under the new pack.

## Consequences

- Headline pacing under rules 57: Epic 382, Long 329, Standard 195; the two
  other seeds 366 / 322, 299 / 251, 215 / 179; proxies 366 / 439 / 302 / 203.
  Every Epic course is inside its band for the first time since rules 53.
- The re-placed landmarks of the tiny maps move two scenario tests: the
  AI-watch chronicle journey's pin, attributed in the packet, and the
  enclosed-basin ferry scenario, which shows its crossing on seed 55 under
  rules 57 as it did under rules 53. That scenario is seed-specific by its
  nature and moves whenever the world's content changes what the realm's
  land yields; it is noted in its own comment.
