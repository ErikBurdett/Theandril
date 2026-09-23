# Seeing supply, playing supply, and what pacing actually measures — 2026-09-23

## Prompt

“Continue and improve the last few things you've left undone”, then “Resolve this in the best way possible.” Three items had been carried across the supply slices: there was no way to see supply, no way to stop paying for a depot, and the AI could not play any of it. The third had been attempted twice and reverted twice.

## Delivered — rules/save 29

- **Supply is drawn on the map.** The ground a realm's hearths and depots can feed is outlined under everything else, so the constraint that now governs every campaign is visible instead of inferred. On by default, switchable from the map guide.
- **The observation carries the reach it already computed.** `suppliedCells` is the same search that answers every army's supply status, computed once per observation rather than twice, so the overlay costs nothing new.
- **A depot can be pulled down.** Rules 28 let a realm create an upkeep obligation with no way to end it short of an enemy taking it — a flaw I introduced and have now fixed. A realm may abandon its own depot from the company standing on it; the upkeep stops at once and the ground it fed goes out of supply.
- **The AI plays supply.** A realm at war whose force is wasting outside supply raises a depot under it rather than abandon the operation — one a turn, out of surplus, under the largest suffering force, never in peacetime, because a depot and its upkeep are a war expense rather than a standing budget line.

## Three planner bugs, each found by measurement

The AI work failed twice before because I measured pass/fail and stopped there. Measuring *what actually happened* found three real defects, all of which would have shipped:

1. **It ignored foreign land claims** and issued `buildDepot` on ground the rules refuse, failing a campaign at turn 69.
2. **It took a company the arcane survey had already spent**, issuing an order against a stale snapshot, failing a campaign at turn 276.
3. **It ignored the thirty-two-depot cap**, failing the headline campaign at turn 279 after accumulating a full network.

Each is the same class of mistake: a planner reading one snapshot and not reconciling with either the rules or its own earlier orders in the same pass.

## What pacing actually measures

The previous two reverts both concluded “this shifts campaign length outside its band”. That conclusion was wrong, and the reason is worth recording.

The pacing tests play a **four-realm tiny map**. The 350–400 turn target describes the **headline campaign**: a standard map with twelve realms. Those are different campaigns, and the proxy was being defended as though it were the target.

Measured under rules 29, with the AI playing supply and **no content change at all**:

| Campaign | Turns |
|---|---|
| Headline epic — standard map, twelve realms | **388** |
| Epic proxy — tiny map, four realms, seed 74 | 296 |
| Epic proxy — tiny map, four realms, seed 20260905 | 464 |
| Long proxy — tiny, seed 99 | 290 |
| Standard proxy — tiny, seed 74 | 201 |

The headline campaign lands at 388, inside the 350–400 target, at the **unchanged** Epic price. Supply and depots lengthened it — attrition slows conquest — and the AI playing supply does not push it out of band. I swept the Epic project price at 44,000 and 52,000 before measuring the headline, and both overshot it to 411 and 440; the right answer was to change nothing and re-derive the proxy bounds, so the content pack is untouched and the seal is unchanged.

The two tiny-map epic seeds now sit 168 turns apart, which is what a four-realm map does: it is fast and noisy. Its bounds are now set from measurement and labelled as a proxy, with the headline figure named beside them.

## Verified locally

- Typecheck, lint, `content:validate` and build pass. Rules 29 adds one order and no content: the seal stays `015468d1` and `git diff` on `packages/content` is empty.
- `pnpm test`: 1,825/1,825 across unit, campaign and repository projects.
- A genuine rules-28 campaign and its archive from deployed `e8cb13e` load at turn 61, re-seal to identical v28 bytes, replay exactly, round trip through a v29 envelope and continue ten more turns.
- A browser journey reads a starving column, raises a depot, toggles the overlay off, pulls the depot down and watches the column fall out of supply again.

## Not done

- The AI builds depots but does not raid an enemy's, and does not avoid marching into open country in the first place. It answers supply; it does not yet use it as a weapon.
- Ports do not exist; fleets carry their own stores and a landing must still raise a depot.
- Depots are drawn only through the supply they project; they have no marker of their own.
- Supply still costs nothing material. Trade routes, tax policy and treaty access are the rest of M4.
