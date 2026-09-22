# Client states, and a roadmap the tracker can show — 2026-09-22

## Prompt

“okay continue towards 1.0 and make sure that the dharma tracker theandril contains a roadmap to 1.0 along with a progress bar and the next up section includes the next features/fixes etc towards 1.0”

## Delivered — rules/save 22

- **Patronage between realms.** A realm may take another as its client: a subsidy paid on acceptance, tribute every turn for an agreed term, and no war between patron and client while the oath holds. The client keeps its own hearths, armies and orders — patronage is an obligation, not a conquest.
- **Every term is disclosed before consent.** The offer states the subsidy, the tribute, the term and what the obligation forbids; the panel repeats it, and an offer that can no longer be funded says so instead of failing on acceptance.
- **Ending it.** A patron may release a client at any time. A client may renounce: lawfully once the term has run, or as a breach that ends the binding peace between them and is remembered as a grievance. A client that cannot pay for three turns running falls out of its obligation.
- **Unification can now be negotiated.** A client’s hearths stand behind its patron’s bid, so the second victory path is reachable through diplomacy as well as conquest. The Victory tab names how many hearths are the realm’s own and how many are pledged.
- **The AI plays it.** Realms court weaker neighbours — city-states first — at most once every ten turns, weigh an offer against their own hearths, income and wars, and never plan a war on their own patron or client.
- **Refusals cannot chain or cycle:** a client may not take clients, a realm may not have two patrons, and patronage may not cross an active war.

## Also in this slice

- **The Epic and Long prices are re-measured.** Patronage keeps patrons and clients out of each other’s wars, which lengthened the longest campaigns; Long is now 32,000 and Epic 36,000. The rules-21 pack is frozen as `f70d99d5` so saves from the deployed build still load.
- **The DHARMA tracker shows the road to 1.0.** A project’s registry entry may now carry a roadmap — a measure, a delivered/total count and milestones in order. Theandril’s project page shows a progress bar and the eleven milestones, the roster card shows the percentage, and `tracker-context` prints both. Projects without a roadmap are unchanged.
- **The queue names the next work:** re-running the campaign-safety scenarios at rules 21, client obligations, the Epic overshoot, city-state artwork, city-state diplomacy and the magical discovery loop.

## Measured campaigns

| Campaign | Ends on turn | Hearths | Land claimed |
| --- | --- | --- | --- |
| Standard map, 12 realms + 8 city-states, Standard pace | 205 | 115 | 49% |
| Standard map, 12 realms + 8 city-states, Long pace | 283 | 126 | 70% |
| Standard map, 12 realms + 8 city-states, Epic pace | 342 | 165 | 87% |
| Tiny map, 4 realms, Epic pace (seeds 74 / 20260905) | 302 / 412 | 26 / 21 | 100% |

A standard twelve-realm campaign forms dozens of patronage bonds over its length; city-states are the most-courted clients, which is the point of seating them.

## Verified locally

- Typecheck, lint, `content:validate` and build pass.
- `pnpm test`: 1,805/1,805 across unit, campaign and repository projects.
- A genuine rules-21 save and its 2,037-order archive from deployed `cce82cf` load, re-seal to identical v21 bytes, replay exactly, re-seal into a v22 envelope and continue ten rounds of AI play.

## Not done

- No client capture outcomes or settlement transfers between patron and client yet.
- A bid cannot yet be lost to politics — only to lost hearths or a lost capital.
- City-states still wear recoloured culture art, and their own bargains (tribute, protection, favour) remain queued.
