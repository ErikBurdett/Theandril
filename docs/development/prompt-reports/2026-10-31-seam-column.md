# Prompt report — 2026-10-31: AI seam column, seam hearth watch, rules 45 and hearth events I and II

**Prompt:** "okay, continue closing the gap towards 1.0".

## Delivered

- AI seam column ([ADR 0072](../../architecture/0072-ai-seam-column.md)):
  a standing war is carried to the seam of the missing path (never a second
  front); the field companies within range gather on one rally hex and are
  concentrated into a column; the seam hearth is besieged by the strongest
  company beside it, its siege kept under a warding as the realm's quote of
  the walls and handed to a column that can storm them; no peace is offered
  to or accepted from the holder while the seam is pursued.
- Diagnosis from two new replays of the Epic headline campaign: the lost Rune
  seam hearth stood ungarrisoned under a warding recast every ten turns while
  Glass Tide laid twelve one-company sieges, lifted each as hopeless and made
  peace with the holder every eight turns of war.
- Evidence packet [docs/development/2026-10-31-ai-seam-column/](../2026-10-31-ai-seam-column/README.md);
  CHANGELOG, implementation status, the 1.0 plan's M7 section, the roadmap
  library (112 delivered, 49 remaining) and the release expectations updated.
- AI seam hearth watch ([ADR 0073](../../architecture/0073-ai-seam-watch.md)):
  the realm's own home watch adopts the hearths holding its seams with a spare
  company each. With seam hearths kept, the headline campaigns sealed the
  working on 283 / 226 / 148 at the rules 44 prices, so rules/save 45
  ([ADR 0074](../../architecture/0074-attunement-repricing-45.md)) re-prices
  Attunement to 7,200 / 12,000 / 18,000 from a measured sweep. Headline
  352 / 306 / 201, all by Attunement. Evidence packet
  [docs/development/2026-10-31-ai-seam-watch/](../2026-10-31-ai-seam-watch/README.md);
  roadmap library 114 delivered.
- Three-seed pacing matrix under rules 45 (Standard 201/184/181, Long
  306/269/251, Epic 352/360/315), recorded in that packet.
- Hearth events, rules/save 46 ([ADR 0075](../../architecture/0075-hearth-events.md)):
  the first slice of M6 — eight original templates, a seeded per-realm draw
  from turn forty, quoted answers, a lapse rule, the AI's answer, a Realm
  affairs panel and journal entries, save 46 with the rules 45 pack frozen.
  Its tests exposed a naval gap fixed in [ADR 0076](../../architecture/0076-ferry-landings-on-own-water.md).
  Evidence packet [docs/development/2026-10-31-hearth-events/](../2026-10-31-hearth-events/README.md);
  roadmap library 115 delivered, the epochs item now in progress.
- Hearth events II, rules/save 47 ([ADR 0077](../../architecture/0077-hearth-events-second-catalogue.md)):
  sixteen more templates with six new conditions and ashglass and garrison
  strength as effects; the rules 46 catalogue frozen. The chronicle journey's
  pinned victory turn moves 55 → 56, attributed headlessly. Evidence packet
  [docs/development/2026-10-31-hearth-events-ii/](../2026-10-31-hearth-events-ii/README.md).

## Verified

Typecheck, lint, unit 2,321 / 285 files, campaigns 57, build, three covering
gameplay journeys (6 of 6) and the `@scale` chronicles journey alone (1 of 1).
Pacing: headline **379 / 300 / 203**, every campaign in band; Long and Standard
unchanged. Seam watch and rules 45: unit 2,323, campaigns 57, build, the
covering journeys and the chronicles journey; headline **352 / 306 / 201**,
proxies 372 / 393 / 307 / 199. Hearth events: unit 2,329 / 288 files, campaigns
57, build, three covering journeys (one new) and the chronicles journey;
headline **393 / 301 / 210**, proxies 385 / 412 / 270 / 182. Hearth events II:
unit 2,330, campaigns 57, build, the same journeys; headline **388 / 313 /
216**, proxies 344 / 401 / 300 / 194. Epic replay: Glass Tide retakes the seam hearth on turn 246, holds
it to 373, seals the working on about 353, and Saltwind's Prosperity completes
first on 379.

## Left open

- A warden for every seam hearth (rites 40–42) is not built; the watch does
  not garrison every seam hearth at once.
- Only Sepulchral Synod reaches the path, on one seed, on every pace.
- Hearth events: twenty-four templates against a target of one hundred and
  fifty; no epochs, escalation or crises yet. One survey mission refused on
  the Epic headline at turn 130, a same-batch race, is recorded and open.
  Deployment of the rules 47 commit is recorded in its publication packet
  once the workflows finish. Commit `594ffdf` is deployed: both
  workflows succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-hearth-events/README.md)).
- Three-seed pacing coverage per pace under rules 44 remains unmeasured.
- Commit `68f4f5b` is deployed: both workflows succeeded and the live readback
  matched the build ([publication packet](../2026-10-31-publication-seam-column/README.md)).
- Commit `0e3c26b` (seam hearth watch, rules 45) is deployed the same way
  ([publication packet](../2026-10-31-publication-seam-watch/README.md)).
- Owner decisions unchanged: the e103a72 history purge; the other session's
  uncommitted Playwright config edits and reliability packet.
