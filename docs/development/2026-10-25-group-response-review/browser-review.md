# Corrected production recovery and export review

Scoped verdict: all six new production recovery cases passed, and independently replaying their twelve retained exports found no discrepancy. The reviewer authored the six tests; this is an independent replay/check of their saved outputs and a visual inspection, not independent authorship of the test design. No extra browser run, build or campaign was performed for this review.

[Pages log](pages.log) records the six cases at entries 36–41: posting missing-row/duplicate/wrong-actor (4.3/4.5/4.2 seconds) and charter missing-row/duplicate/wrong-actor (4.5/4.5/5.0 seconds). The complete first corrected Pages run subsequently finished with **57 passed in 2.9 minutes**, including normal posting/charter and the preceding group-patrol flows. Final broad acceptance and deployment remain the parent's separate work.

## Actual mutation and recovery

Each retained `*-reply.json` records the genuine completed worker response before presentation damage. Two ordinary posting commands yield `782d91b7`; two ordinary charter commands yield `caafaa3d`. The origin is `1a71b4f1`. Each altered array is deliberately missing, duplicated or misidentified, without replacing canonical state, observation, hash or command results in the worker.

For all six cases the captured UI has no success-results text, both selected actors remain checked, End turn is disabled, and the panel contains the restore-before-continuing explanation. The passing tests also require settled pending status and disabled retry, then recover through the public Load control. A normal retry after recovery succeeds once. No test forces a command refusal or fabricates a recovery state.

The [read-only export script](export-review.ts), [log](export-review.log) and [detailed output](export-review.json) independently decoded all twelve portable public downloads through the production persistence loader and ran exact canonical replay:

| Case family | Restored exports | Retried exports | Exact records after restoration/retry |
| --- | --- | --- | --- |
| Posting, three faults | `1a71b4f1` | `782d91b7` | 0 / 2 |
| Charter, three faults | `1a71b4f1` | `caafaa3d` | 0 / 2 |

For every pair, applying the two captured ordinary commands to its restored snapshot through a fresh journal produces the exact retried snapshot **and entire archive**. All retry records are accepted rules-35 records. All armies and routes remain identical. Charter pairs additionally preserve all settlement and faction values, including queues and treasury. The restore point is the explicit pre-action manual save; this does not imply that the uncertain pre-restore worker mutation was rolled back automatically. Portable gzip byte identity is not claimed.

## Native image inspection

All six 1440×1000 native fault captures were opened with `view_image`. They show retained two-actor selection, disabled submit controls and disabled End turn. Charter captures also show the full panel recovery instruction near the bottom of the dialog. In the posting captures the panel alert is below the current scroll position and the global feedback sits behind the dialog; those images do **not** establish a fully readable restoration instruction. Its exact presence is established by the passing DOM assertions and retained panel text. This is an evidence/framing limitation, not a claim that the scrolling panel cannot reveal its alert.

No screenshot was resized, transformed or recaptured for this review. Paths, dimensions, bytes and SHA-256 hashes for all six PNGs and twelve exports are in [export-review.json](export-review.json). These screenshots are technical recovery evidence, not new publication imagery or a journal dispatch.

The [original failures](fail-before-review.md) remain immutable and accurately demonstrate the old behavior. Current success does not erase those failures or imply that healthy worker execution spontaneously emits damaged replies. Rules, pacing, delegation policies and remaining 1.0 gates are unchanged by this transport fix.
