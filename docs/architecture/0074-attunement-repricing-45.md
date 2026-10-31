# ADR 0074 — Rules/save 45: Attunement re-priced once seam hearths are guarded

**Status:** accepted, 2026-10-31. Content prices only; no canonical field
changes. Save 45. Evidence: [`docs/development/2026-10-31-ai-seam-watch/`](../development/2026-10-31-ai-seam-watch/README.md).

## Context

ADR 0069 priced the working (3,600 / 6,000 / 9,600 knowledge) from headline
campaigns in which every AI realm lost the hearths holding its seams to the
first company at the gate, so only one realm ever reached the path and only
late. With the seam hearth watch (ADR 0073) the knowledge-rich realm of the
headline campaigns keeps both paths from about turn 100 and seals the working
the moment the price is met: the headline campaigns ended on 283 / 226 / 148,
all by Attunement, against bands of 350–400, about 300 and about 200. The
repository's rule for a change that moves the headline out of band is to fix
the change when the AI cannot play the rule, or to re-price deliberately with
the current pack frozen. The AI plays the rule; the price was set when it
could not.

## Decision

`ATTUNEMENT_VICTORY.knowledgeCost` becomes 7,200 / 12,000 / 18,000 for
Standard, Long and Epic (Short unchanged at 60), from the price sweep in the
evidence packet: Standard 4,800 → 167, 6,000 → 183, 7,200 → 201; Long 8,400 →
255, 9,600 → 272, 12,000 → 306; Epic 12,000 → 304, 14,400 → 324, 18,000 →
352, 21,600 → 378, each sealed by Sepulchral Synod against a rival Prosperity bid already
started. The rules 44 working is frozen as `SCHEMA44_ATTUNEMENT_VICTORY` under
pack `88b0823d` (`PRE_SEAM_WATCH_PRICING_CONTENT_HASH`); the pace table is
unchanged. The simulation reads the working's price by rules version (38–43
the rules 38 price, 44 the rules 44 price, 45 the new one), so a campaign keeps
the price it was sealed under. Save 45: a v44 envelope is accepted under the
frozen hash and continues unchanged under the new pack, as v42 and v43 do.

## Consequences

- Headline pacing is **352 / 306 / 201**, every campaign in its band, all by
  Attunement with a Prosperity bid in the race. Proxies: Epic 372, chronicle
  Epic 393, Long 307, Standard 199, all Prosperity and within their bounds.
- The third path is now the measured headline outcome on every pace for this
  seed; three-seed coverage per pace is still unmeasured, and whether a seed in
  which no realm keeps both seams ends by Prosperity in band is not shown here.
