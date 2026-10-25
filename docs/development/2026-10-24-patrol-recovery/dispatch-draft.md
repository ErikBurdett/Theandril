# Draft dispatch — A patrol can return after the danger passes

Publication: **draft, local only**. Base revision `d06ba4b` plus the local
[source manifest](source-manifest.json). Rules/save 35; unchanged content
`015468d1`. No release gate is closed.

## The order that never woke up

A patrol should stop to review a newly seen enemy. In one generated Long
campaign, a Mire Courts company stopped on turn 50 and was still waiting near
the end of the campaign. Peace had already removed the immediate danger by
turn 58. The route home was only three steps, and both hearths were still owned.

The two parts of the system were each waiting for the other: ordinary travel
correctly required explicit review, while the AI kept the company reserved for
its saved patrol and never reviewed that route. The captured campaign shows
284 elapsed sampled turns in the paused state. An isolated ordinary resume from
the original turn-58 save gets the company home without changing its policy.

The AI now reviews that specific kind of interruption. It checks current sight,
supply, ownership, direct commitments and the saved destination, then issues
the same Resume command a player can use. The review has four route queries and
four orders per planning pass. A failed path spends that budget too.

This does not make player patrols resume themselves. It applies when the AI is
controlling a realm. Disabled patrols stay disabled; different direct destinations,
multi-waypoint journeys, nearby enemies and lost home endpoints remain protected.
Routes have no source marker, so an identical manual leg may be reviewed after
explicit AI takeover. The AI does not replace or erase the patrol's settings.

## Played through the production build

The production browser journey imports the genuine snapshot as a clearly labeled
partial-history Watch campaign, steps a real round, exports the recorded resume
and movement, and restores the exact saved archive. The whole round begins from
that snapshot; it is not a claim to replay the original campaign's missing history.
The separate player patrol journey still passes, including narrow enlarged-text
controls. [Production evidence](production.log) records two passes in 11.2 seconds.

Image: [native production Watch capture](production-results/patrol-recovery-production-1df3d-story-through-save-recovery/production-watch-patrol-recovered.png).
Caption: “The recovered Watch campaign at turn 59, viewed through Ashen Compact
fog after save restoration.” Alt: “AI watch paused on turn 59, showing the Ashen
Compact map and the partial-archive notice.” This image illustrates the actual
Watch/recovery flow; it does not show the foreign Mire company through fog or
prove its individual movement. That evidence is in the exported command archive.
The parent inspected the native pixels; no crop, resizing or generation is used.

The generated regression fails before the correction and passes after it.
Authored tests separately cover a threat leaving sight during an ongoing war,
overrides, hidden information, bounded rotation, saved route cleanup and exact
replay. Independent review checks both the AI-seat authority and its work bounds.
The full local suite passes 2,217 tests across 275 files in 61.66 seconds.
Isolated safe reviews of 128-patrol Huge/Legendary fixtures measure 0.666/0.984 ms
median; setup, observation, execution and rendering are excluded. Full integration
and performance results are linked from the [packet](README.md), with
[independent factual review](final-review.md) and [image provenance](image-manifest.json).

## Recovery is not balance acceptance

Across seeds 20260905–20260907, the final Standard campaigns end at 219/193/214,
Long at 336/304/286, and Epic at 374/278/320. The original Long seed is one turn
later than the preceding patrol checkpoint, so the original slowdown is not
fixed. Two Epic seeds now finish below the 350–400 target. Those adverse results
remain beside the recovered-order evidence. One Standard campaign also records
an automatic patrol route refusal; no submitted order is refused.

No price, proxy test bound or release target was changed to make a seed pass.
Next work needs to distinguish victory funding, counterplay and strategic
opportunity costs with the corrected AI before deliberately adjusting pacing.
The [full comparison](pacing-comparison.json) retains the frozen rules-34 baseline,
the first patrol policy and this correction as separate columns.

This advances ACT-32/M3 and the existing AI/empire-management work. No new gameplay
obligation was added and none was cut. Obsolete circuits, mobile escorts, larger
programs, broader governors and organic scale acceptance remain unfinished.
DH-021 and all fifteen release gates remain open. This draft needs a pinned
publication revision, journal reader review and explicit publication authority
before entering the shipped journal.
