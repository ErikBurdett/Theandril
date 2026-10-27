# Independent code and displayed-layout review — 2026-10-27

Reviewer: independent `commission_filter_review` agent. Baseline: `4cc8cd1`.
Verdict: **approved for this bounded filter slice; no blocking findings**.
The reviewer made no implementation edits and ran no tests. The parent owns
integration, deployment and release acceptance.

## Code scope

Reviewed `land-commission-status.ts`, its unit tests, the registry integration
and static rendering tests, and the production commission-filter journey.

- The index copies only existing compact observation fields, admits owned hearths
  and matching-faction policies, and ignores foreign/orphan metadata. Its cost is
  linear in observed hearths and policies; it does not query land or prices.
- Missing historical policy observations remain unavailable, rather than becoming
  an empty modern policy list. Both the selector and any retained active filter
  are bypassed in that case.
- Commission counts follow search plus the production-filter cohort before the
  commission filter and pagination. Existing production counts retain their
  search cohort. Final filtered entries supply matching selection IDs.
- Checked hearths outside a filter remain checked and disclosed. The new filter
  participates in page resets and the existing shared pending lock.
- Zero allowance and reported waits intentionally overlap, including existing
  paid work. Null compact blockers are not labelled ready, funded or affordable.
  The help directs players to selected-hearth details for exact eligibility.
- No simulation rule, worker command, save format, AI decision or history is
  changed. Existing ordinary commands still perform the actual purchases.

The [production log](browser-initial.log) records one first-attempt journey passing
in 22.7 seconds (24.5 seconds including runner overhead). Its source checks native
keyboard filtering, search/production composition, off-filter selections, exact
selected details, a real pending lock, five ordinary commands, paid work, replay,
save restoration and unchanged campaign/archive while browsing. Those are test
assertions, not claims inferred from screenshots.

## Inspected native captures

Both images were opened individually with `view_image` at original resolution.
They are unmodified Playwright captures in
`browser-results/production-land-commission-1cf90-paid-replay-and-restoration/`.

| Capture | Dimensions / text | SHA-256 |
| --- | --- | --- |
| `commission-filter-desktop.png` | 1440×1000 / default text | `507b1c2245946730e244785a2d079d658c93ab439fed44fc4df812c05a61d4af` |
| `commission-filter-narrow-130.png` | 390×844 / 130% text | `1e531f3ceafe43685e93ae17125c8f29cbfa519ade097296241c0b12a6e0ef89` |

Desktop: the new labelled selector reads **Zero allowance (5)**, the production
selector remains **All hearths (30)**, and the resulting directory count is five
towns. The selection disclosure visibly retains six checked hearths with one
outside the filter. Labels, values and surrounding controls are separated and
readable, with no overlap or clipped new control.

Narrow: search, both filters, help disclosure and registry ordering fit the window.
The selector label and **Zero allowance (5)** value remain readable at 130% text.
The close button, tabs and scrollable management window remain legible. Group
buttons stack within the window. Content below the viewport requires scrolling;
this capture does not claim that all group details fit simultaneously.

The accompanying JSON records the narrow selector at x25/y458.78125, size 340×44,
fully within its x11–379/y127.890625–833 window body, with zero page overflow.
This agrees with the inspected pixels and the retained 44px/four-edge assertions.

## Evidence interpretation and limits

The evidence explicitly identifies a synthetic mature realm with authored
ownership, markets, army placement, frontier patch and a finite 100 coin purse.
Workers and commissions use ordinary commands; the first 22 coin work is actually
paid before the from-save archive. Initial and browsed hashes both equal
`6c3dffa5`; the changed/restored hash is `7dbe8a11`. Five recorded budget changes
leave treasury 30 from 78. The exact selected-hearth blocker concerns unsuitable
terrain/biome/features despite a null compact blocker, demonstrating why the
registry cannot promise readiness. This is not organic mature-realm acceptance.

The captures show closed selectors, not the native option popup. Expanded help
layout was not visually reviewed. Post-payment receipts, replay correctness and
save restoration are not visually proved by these two images; the browser
assertions provide their separate scoped evidence. No artwork was generated,
transformed or approved for runtime by this
review. Public deployment, other browsers, sustained scale and all 1.0 gates remain
outside this verdict.

Reviewed metadata SHA-256:
`84edfda39402a3b2d8c0cb24291ccffc6a347d1c555283f9248cf61c70e3ecf6`.
Retained exported campaign SHA-256:
`81865fceb74e8e34a77a943efce496833be575cf7b708dbb20a7457230521c2c`.

Reviewed source SHA-256:

- `apps/web/src/land-commission-status.ts`: `b3967366774d71d0871b0433092c6c8fbfacb4c813bf52539f455853d01e7c2e`
- `apps/web/src/realm-navigation.tsx`: `3b0e57f890003391556399e70dce5fd7157565d3a5be4052082207180b99c9be`
- `tests/production/land-commission-filters.spec.ts`: `a1f2c8974e363667b01a2ce71d1b491c1a0fd4228c000e9a9aee295531eb8fce`

## Addendum: existing help test correction

Reviewed the test-only change to `tests/production/settlement-order-filters.spec.ts`.
The [full local Pages run](browser-full.log) passed 78 cases and failed this one
because its former single-paragraph visibility locator matched both the original
production explanation and the newly added commission explanation. This is an
explicit strict-locator failure, not an observed hidden-help defect.

The correction asserts exactly two paragraphs, checks each paragraph is visible,
and checks the second contains the specific sentence defining commission counts
as following search plus the Settlement orders filter. Existing disclosure
open/close keyboard assertions and existing explanation checks remain intact.
It does not pick an arbitrary first match, remove visibility coverage, loosen a
timeout or change runtime behavior. **Approved.**

The [affected two-case rerun](browser-final.log) passes in 51.7 seconds, including
the new commission journey and the existing settlement-filter journey. Thus all
79 distinct local Pages cases have passing results across retained runs, rather
than a single uninterrupted 79-case pass. The three source hashes above remain
unchanged. Corrected test SHA-256:
`50e7e4cbd23b92704c482a61006818a2f686fbd3fc7eb2177e935f4fdd13f0a4`.
No additional images were inspected for this addendum; visual scope remains the
two native captures listed above.
