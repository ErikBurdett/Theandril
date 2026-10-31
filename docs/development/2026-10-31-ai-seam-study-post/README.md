# AI study post: a Waykeeper studies where a seam is held — 2026-10-31

AI only; no rules, content or save change. Design:
[ADR 0071](../../architecture/0071-ai-seam-study-post.md).

## Diagnosis

[attunement-blockers-probe.ts](attunement-blockers-probe.ts) replays the Epic
headline campaign (seed 20260905, twelve realms) and prints, for every realm
holding a seam of every path, its Attunement blockers whenever they change and
the Glass Tide Waykeeper every forty turns.
[Before](attunement-blockers-epic-before.txt): Glass Tide holds both paths
from turn 80, has two of three discoveries by 90, and its first-degree
Waykeeper, lodged at the capital, sits at zero experience through turn 360
while the realm banks 12,725 knowledge; it starts a Hearth Exchange on 362.
Rules 39 pays study experience only at a hearth whose borders hold a seam;
the study post chose an archive hearth.

## What changed

`packages/ai/src/characters.ts`: the study post is a seam hearth (one that
could host the working first, else the seam hearth holding the most paths); a
Waykeeper lodged at any seam hearth stays; one lodged elsewhere is released;
while no caster studies, a second Waykeeper (at most two) is raised for the
seam hearth. Test: `packages/ai/src/attunement.test.ts` (archive hearth
without a seam is passed over for the seam hearth; a caster lodged at the
seamless archive hearth gets a studying colleague and is not held; the student
earns experience and the colleague does not).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,320 tests / 285 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **369 / 300 / 203**, unchanged ([log](pacing-after.log), [json](pacing-after.json)) |
| Epic blockers trace, after | second degree of Flame by turn 120 and Rune by 160, Arcane Theory complete by 110, the working ready but for its price ([trace](attunement-blockers-epic-after.txt)) |
| [late-standing-probe.ts](late-standing-probe.ts), turns 300–365 | the Rune seam hearth is lost to war by 300; knowledge passes the 9,600 price on 330; the realm is at war until 350 and never seals |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: attunement, seam-warding | 5 passed in 11 s ([log](browser-covering.log)) |
| `@scale` chronicles journey, alone | 1 passed in 22 s ([log](browser-chronicles.log)) |

## Known limits

- The measured gap is now keeping a seam hearth through a long campaign's
  wars, or retaking it; the bounded seam objective fires only at peace.
- Study experience accrues on every seat's end of turn, a pre-existing rule
  detail the test tolerates rather than pins.
