# Find the hearths whose land budgets need attention

## Identity

- Stable entry slug: commission-filters
- Publication state: draft follow-up to edition 23; not in the public catalogue
- Source revision: pending implementation commit; baseline 4cc8cd1
- Campaign/save/content: unchanged rules/save 37 and content 015468d1
- Categories: realm management, accessibility, campaign safety

## The player's problem

After commissioning land work across a realm, a player needs to find which hearths
have no allowance left. The registry already showed each commission, but finding
these hearths meant reading every row. A production charter and a land commission
also answer different questions, so one must not replace the other's filter.

## What changed

A separate **Land commission status** selector finds hearths with or without
commissions, zero allowances and reported waits. It combines with search and
**Settlement orders**; its counts reflect that combined cohort. Checked hearths
remain checked when the filter changes, and the group panel reports how many are
outside the current results. Existing group controls can replace only those
explicitly chosen budgets.

An authored thirty-hearth realm demonstrates the distinction. Eleven commissions
include five with no allowance left and eight reporting a wait. One of the five
has already paid for work, so it belongs in both categories. Filtering and browsing
leave the campaign and journal unchanged. Revising the five selected budgets spends
48 ordinary coin, reducing the treasury from 78 to 30; the previously paid work
remains intact. The resulting five commands replay and restore exactly.

**Reported waits is not a complete job eligibility check.** A hearth can have a
positive allowance and no summary wait while no suitable job exists. Selecting
one such hearth reveals the exact terrain/biome refusal from its ordinary land
query. No new prices or eligibility rules are calculated in React.

## Imagery and evidence

Native source captures and the exported campaign are retained in
[the work packet](../../development/2026-10-27-commission-filters/README.md).
`commission-filter-desktop.png` shows the filtered registry at 1440×1000;
`commission-filter-narrow-130.png` shows the 390×844 control at 130% text.
No crop, resize, recompression or public media addition is proposed. The native
select popup is not captured; keyboard filtering is exercised by the journey.
Independent displayed review records exact hashes. A future illustrated public
edition must still choose its imagery and undergo editorial/catalogue review.

## Developer notes

`land-commission-status.ts` indexes detached, already-observed owned hearth facts
in linear time. `realm-navigation.tsx` memoizes that index, reuses it for row
summaries and composes it with the existing search/production cohort before paging.
Historical observations without the commission contract hide and bypass the
selector. Existing command, lock, save and recovery paths remain authoritative.
No new worker queries, canonical fields, AI choices or pricing scans were added.

## Scope ledger and road to 1.0

This advances existing ACT-32/M3 and Gate I's exception-driven realm management.
It adds no new gameplay scope and does not change any release gate's status.
Broader land/cultivation strategy, whole-realm funding priorities and organically
matured combined-delegation acceptance remain open. DH-021 and all fifteen gates
remain open. Synthetic ownership and a finite authored purse are disclosed;
this is not a naturally developed empire or a full performance acceptance.

## Review and contributor handoff

[Work packet](../../development/2026-10-27-commission-filters/README.md) records
actual code review, local test/build/browser results and deployment separately.
Local integration has passing results for every test and browser case across
the retained full runs and focused reruns; see the packet for the old locator
correction and unchanged history-timeout recovery. Publication is still pending.
This draft is not a reviewed public edition or a claim of 1.0 acceptance.
Next work should deepen paid land decisions while preserving exact costs, manual
overrides and shared-purse consequences.
