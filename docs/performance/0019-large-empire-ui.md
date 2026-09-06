# Integrated compact reads and next-action gameplay

Verified 2026-09-06: **717 tests / 75 files**, full typecheck, lint, content
validation and production build; **all 60 Chromium gameplay scenarios** pass in
3.2 minutes with no skips. [Raw browser measurements](0019-large-empire-browser.json),
[matched scoped reads](0018-read-models.md), [packed-cell comparison](0017-cell-transfer.md),
[navigation helpers](0019-next-action.md). Each benchmark ran in its own reserved
window without concurrent build/test workloads.

The final Chromium WebGL run uses a 1440×1000 viewport, an 890×786 map canvas,
and a separately tested 390×844 touch layout. The synthetic fully explored Huge
fixture retains 196,608 cells, 32 factions, 1,500 global armies and 32 towns;
only 47 armies and one town belong to the observed player. Fog still limits live
enemy information. This renderer fixture is distinct from the 32/40-owned-town
read benchmarks and the new 100-owned-army/40-town navigation scenario.

Initial full-world update is **1,970,720 logical bytes**, down from 16,554,000
in the previous checkpoint. Of that, 1,769,695 bytes are packed cell data and
metadata. No land-detail query is issued while inspecting an army. Each camera
stage preserves `cff84c09`; frame p95 is 16.7–16.8 ms, steady CPU submission
about 0.1 ms, first art submission 37.0 ms, and art load 247.2 ms. These are
local Chromium observations, not mainstream-device or cross-browser signoff.

The renderer still uses the unchanged 2048² approved atlas: 16 MiB map residency
and potentially another 16 MiB DOM decode, accounted separately. Four to sixteen
visible chunks draw 1,024–4,096 terrain cells. Cached chunk count reaches 26;
maximum observed cached bounds remain 837×712 pixels. Their estimated
power-of-two backing reaches 104 MiB, excluding returned texture-pool allocations
and other GPU resources. Near rendering shows 48 entity sprites; far home view
aggregates to two heraldic sprites. No cache-saturation or retained-memory claim
follows from this short camera path.

The separate fog-limited generated Huge start transfers 6,548 bytes, including
589 packed-cell bytes for 61 cells. Generation is 412.5 ms, first art submission
25.1 ms and frame p95 16.8 ms. It is not an explored-world measurement.

Browser tests validate current-town quotes after paid commands, save/load and
rapid selection changes, then next-action wrapping, filters, typing/modal guards,
interrupted routes, standing missions, embarked armies, persisted remapping and
real touch controls. Navigation does not change the saved campaign hash. Retained
inspected screenshots show [packed near rendering](../screenshots/slice13-packed-fully-explored-near.png),
[current narrow land quotes](../screenshots/slice13-current-land-quotes-narrow.png),
[the 100-army/40-town navigation](../screenshots/slice14-large-empire-next-orders.png)
and [narrow touch navigation](../screenshots/slice14-next-orders-touch-narrow.png).

The unchanged Epic campaign, turn-500 continuation and full archive replay remain
verified; [raw Epic evidence](0018-epic-continuation.json) preserves the previous
turn-863 outcome and `177160fb` seal. Build output is 763.72 kB main (233.59 kB
gzip), 495.66 kB worker and 53.99 kB CSS (10.89 kB gzip). All ten JavaScript
chunks exclude development hooks and Art Lab. Existing large-chunk and upstream
Zod annotation warnings remain visible. No content, art, schema or archive format
changed; broader 1.0 systems, virtualization, larger retained-memory workloads
and Firefox/WebKit remain unfinished.
