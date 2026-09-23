# Making the measurement lesson a tool — 2026-09-23

## Prompt

“okay resolve the lessons found for measuring - also note that those kind of tests should be run on the local development machine testing suite, not in the github CI. Those tests run in the cloud should be a simple: does it build correctly, deep testing we do locally.”

## What was wrong

The lesson existed only as prose in one prompt report, and the measurement itself existed only as a throwaway test file I wrote and deleted five times in a single session. That is the shape of a lesson that will be lost: the next person to change a rule will read a red pacing bound, conclude the change broke campaign length, and revert work that was correct — which is exactly what happened twice before the headline campaign was measured.

## Delivered — no rules change

- **`pnpm measure:pacing`, a real local tool.** It plays AI campaigns to their victory and reports the turn each ended on, the victory path, the depots standing and — deliberately — any order the planner asked for that the rules refused. Cases are named: `headline` (a standard map with twelve realms, the campaign the 350–400 target actually describes), its Long and Standard siblings, and the four `proxy-*` cases the pacing tests play. `pnpm measure:pacing all` runs the lot.
- **The standard is written where it will be read.** `AGENTS.md` now says plainly that the headline campaign is the thing to judge against, that the tiny four-realm campaigns are proxies whose bounds are derived from the tool rather than defended, and that when a change genuinely moves the headline the choice is to fix the change or to re-price the pace deliberately with the current pack frozen — not to tune a constant until a proxy goes green. The three pacing test files each point at the tool from the top.
- **Refused orders are part of the report.** Both AI bugs found this session — a planner ignoring foreign land claims, and a budget that offered the same coin twice — showed up first as a refused order inside a long campaign. The tool surfaces that count instead of leaving it to a thrown assertion in a test.

## Local testing, and what CI is for

CI was already correct and stays that way: `Verify build` runs install, typecheck and the production build, and the Pages workflow publishes it. There are no test steps in either workflow and none should be added. The comment at the top of `verify.yml` now names all three local checks — `pnpm test`, `pnpm test:gameplay` and `pnpm measure:pacing` — and says why they belong on the development machine: hosted runners render WebGL in software and are several times slower, so long AI campaigns and browser journeys time out there and turn CI red while the game is correct.

`pnpm measure:pacing` is the strongest example of that rule. A single headline campaign is minutes of simulation; `all` is considerably more. It is a local instrument, not a gate.

## Verified locally

- Typecheck, lint and build pass; `packages/content` untouched and the seal stays `015468d1`.
- `pnpm test`: 1,826/1,826.
- `pnpm measure:pacing proxy-standard` reports turn 200, prosperity, no refused orders, in two seconds.

## Not done

- The tool reports; it does not judge. Nothing fails if the headline campaign drifts out of band — that stays a decision for whoever reads it, which is the point.
- Only campaign length is measured. Nothing yet reports how a change moved the shape of a campaign: how many wars, how much territory changed hands, how often a supply line was cut.
