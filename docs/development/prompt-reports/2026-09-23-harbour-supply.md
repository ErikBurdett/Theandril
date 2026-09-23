# Harbours carry supply over water — 2026-09-23

## Prompt

“continue”, taking the next M4 item. Supply had one place it still hand-waved: fleets were simply exempt, and a landing force had no way to be fed except to raise a depot on the beach.

## What was missing

Supply spread over passable ground and stopped dead at the shoreline, because the search walks land. That gave two wrong answers at once. A fleet was declared supplied wherever it was, including the far side of an ocean, on the grounds that it carries its own stores — true for a week, not for a campaign. And an army put ashore on a friendly coast, within sight of a harbour across the strait, was out of supply until it spent forty coin on a post of its own.

## Delivered — rules/save 30

- **A hearth with a harbour carries its line out over the water.** The same budget, the same road bonus, the same enemies cutting it — but water is passable to a line that began at a harbour, so a fleet or a landing near a friendly coast is fed without building anything.
- **Only a harbour line crosses.** An ordinary hearth still stops at the shore, and a depot is a land post. Harbours now have a second reason to exist beyond launching hulls.
- **The search became two clean passes.** Water-crossing used to depend on which line won a tie to a hex, which is exactly the kind of order-dependence that produces a bug nobody can reproduce. Supply is now one land pass seeded from hearths and depots, then one water-capable pass seeded from harbours, merged so the first line to reach a hex feeds it. Cheaper to read and independent of traversal order.
- **Purely additive.** Nothing that was fed stops being fed. This slice removes no exemption and starves nothing new: fleets still carry their own stores, and that remains the next thing to take away.

## Measured

The headline twelve-realm epic campaign runs **389 turns** with seventeen harbours standing — identical to the 389 it ran before this change, and inside the 350–400 target. That is the expected result for an additive rule, and it was measured rather than assumed.

## Verified locally

- Typecheck, lint, `content:validate` and build pass. Rules 30 changes behaviour, not state or content: the seal stays `015468d1`.
- `pnpm test`: 1,826/1,826, with every pacing campaign inside its window.
- A genuine rules-29 campaign and its archive from deployed `d70f18e` load at turn 61, re-seal to identical v29 bytes, replay exactly and round trip through a v30 envelope.

## Not done

- **Fleets are still exempt.** A hull at sea is fed wherever it is; harbours extend supply to the water but nothing yet requires a fleet to stay inside it. Taking that exemption away is a real balance change and belongs in its own measured slice.
- Depots remain land-only, so an island chain still needs a hearth or a harbour to reach it.
- Supply still costs nothing material. Trade routes, tax policy and treaty access are the rest of M4.
