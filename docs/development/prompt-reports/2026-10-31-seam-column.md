# Prompt report — 2026-10-31: AI seam column

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

## Verified

Typecheck, lint, unit 2,321 / 285 files, campaigns 57, build, three covering
gameplay journeys (6 of 6) and the `@scale` chronicles journey alone (1 of 1).
Pacing: headline **379 / 300 / 203**, every campaign in band; Long and Standard
unchanged. Epic replay: Glass Tide retakes the seam hearth on turn 246, holds
it to 373, seals the working on about 353, and Saltwind's Prosperity completes
first on 379.

## Left open

- The Epic headline is now a race the working loses by a few turns. The Epic
  Attunement price is scaled, not measured against a sealed working; whether
  to re-price it is a deliberate pacing decision not taken here.
- The retaken hearth is lost again on 373: defending a seam hearth is not an
  AI concern yet.
- Three-seed pacing coverage per pace under rules 44 remains unmeasured.
- Deployment and live readback are recorded in the publication packet named in
  the implementation status entry once the workflows finish.
- Owner decisions unchanged: the e103a72 history purge; the other session's
  uncommitted Playwright config edits and reliability packet.
