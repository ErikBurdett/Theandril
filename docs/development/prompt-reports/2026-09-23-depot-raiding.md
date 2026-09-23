# Raiding a supply line — 2026-09-23

## Prompt

“Continue”, taking the next M4 item: the AI built depots but would not cut anyone else's.

## What was missing

Rules 28 made a depot destructible by any enemy company that walks onto it, and rules 29 taught the AI to build them. Nothing taught it to take one. A human could strand an AI army by slipping a company behind it and sitting on the post it was eating from; the AI would march past an undefended depot without noticing, so the most interesting thing supply added was something only one side could do.

## Delivered — no rules change

- **A visible enemy depot is a target of opportunity.** A military company already scoring a destination now counts a hostile depot within three hexes among its objectives, weighted below the ordinary approach to an enemy force. It takes a post that lies on its way and never marches for one.
- **No rules, save or content change.** The depot, its destruction and its reach were all built in rules 28; this is the AI client learning to use them. The seal stays `015468d1` and the save version stays 29.

## Measured, and tuned to what the measurement said

The first cut looked for depots within eight hexes and weighted them at 400 a hex — four times the pull of an enemy army. It worked, and it was wrong: the headline twelve-realm campaign ran **446 turns**, well past the 350–400 target, with three hundred depots razed. Armies were chasing supply posts instead of fighting, so wars stopped resolving and both sides spent the campaign rebuilding.

Narrowing it to three hexes at 80 a hex — below the approach weight, so a depot never outranks an enemy force — put the campaign back at **389 turns**, one turn off the 388 it ran without raiding at all, while still razing two hundred and thirty-eight depots. The dynamic is real; it simply stopped being a distraction.

| | Turns | Depots razed |
|---|---|---|
| No raiding (rules 29 as shipped) | 388 | — |
| Raiding within 8 hexes, weight 400 | 446 | 300 |
| Raiding within 3 hexes, weight 80 | **389** | 238 |

## Verified locally

- Typecheck, lint and build pass; `packages/content` is untouched and the seal stays `015468d1`.
- `pnpm test`: 1,825/1,825, with every pacing campaign inside its window.
- The headline twelve-realm epic campaign measured at 389 turns, inside the 350–400 target.

## Not done

- The AI still does not avoid marching into open country in the first place, and does not garrison a depot it expects to lose.
- Ports do not exist; fleets carry their own stores.
- Supply still costs nothing material. Trade routes, tax policy and treaty access are the rest of M4.
