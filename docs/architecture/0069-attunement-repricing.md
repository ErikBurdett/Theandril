# ADR 0069 — Rules 44: re-pricing Attunement and the Epic Hearth Exchange

**Status:** accepted, 2026-10-31. Rules/save 44; content prices only, no canonical
field. Evidence: [`docs/development/2026-10-31-ai-seam-expeditions/`](../development/2026-10-31-ai-seam-expeditions/README.md).

## Context

The Attunement prices of rules 38 (600 / 1,200 / 2,400 knowledge for Standard,
Long and Epic) were set when no AI realm could reach the path; the headline
campaigns kept ending by Prosperity on turns near their targets. ADR 0068
taught AI realms to hold the seams they find, and the next headline
measurement under the rules 43 prices read: Epic 328 by Prosperity, Long 177
by Attunement, Standard 127 by Attunement. Glass Tide held a seam of both
paths, finished three Arcane Theory discoveries, deepened a Waykeeper and
sealed a working with 600 knowledge on turn 127 of a campaign meant to run
about 200. The Epic Prosperity winner also funded its Hearth Exchange sooner
from more hearths, below the 350–400 band.

`docs/1.0-DEVELOPMENT.md` gives two choices when a change moves the headline
campaign out of its band: fix the change, or re-price the pace deliberately
with the current pack frozen, as rules 18, 21 and 22 did. The AI plays the rule
well here; the price was wrong. This is the re-pricing.

## Decision

The rules 22–43 pace table and the rules 38–43 Attunement definition are
frozen as `SCHEMA43_CAMPAIGN_PACES` and `SCHEMA43_ATTUNEMENT_VICTORY`, with
their pack sealed as `f738e917` (`PRE_SEAM_PRICING_CONTENT_HASH`). Rules 44
sets, from measured headline campaigns (seed 20260905, twelve realms,
[probe](../development/2026-10-31-ai-seam-expeditions/price-probe.txt)):

| Price | Rules 38–43 | Rules 44 | Headline result |
| --- | --- | --- | --- |
| Attunement, Standard | 600 knowledge | 3,600 | sealed turn 203 (started 183; rival Prosperity bid started 196) |
| Attunement, Long | 1,200 knowledge | 6,000 | sealed turn 300 (started 260; rival Prosperity bid started 292) |
| Attunement, Epic | 2,400 knowledge | 9,600 | no headline realm reached the path at 9,600 or 12,000; scaled with the window |
| Attunement, Short | 60 knowledge | 60 | unchanged; a short campaign is a test or skirmish |
| Hearth Exchange, Epic | 36,000 coin | 44,000 | Prosperity turn 369 (36,000 gave 328; 40,000 gave 350) |
| Hearth Exchange, Standard and Long | 18,000 / 32,000 | unchanged | Standard and Long now end by Attunement near their targets |

The simulation reads the pace table and the working's price by rules version,
so a rules 38–43 campaign keeps the price it was sealed under; `withRules`
projections reproduce it. A v42 or v43 envelope carries the frozen pack hash
and loads unchanged under rules 44 with the new hash; the save loader rejects
any other hash for those versions as before. The working's requirements,
window, pauses and counterplay are untouched.

## Consequences

- Headline campaigns under rules 44: **369 / 300 / 203** for Epic / Long /
  Standard, by Prosperity, Attunement and Attunement, each inside its band and
  each contested by a rival bid. The Long and Standard results are the first
  third-path victories in measured headline play.
- The four-realm proxies move with the Epic price: proxy Epic (seed 74) ends on
  turn 473 and the chronicle proxy (seed 20260905) on 452, both by Prosperity,
  so `pacing-epic.test.ts` re-derives its maximum from 450 to 550; the Long
  (357) and Standard (263) proxies stay inside their bounds. The proxies under
  the frozen prices are kept beside them in the evidence packet.
- Glass Tide wins both lighter headline campaigns by Attunement. Whether other
  seeds and other cultures reach the path, and how often Prosperity still wins
  Standard and Long, is unmeasured; three seeds per pace remain the next
  pacing check.
