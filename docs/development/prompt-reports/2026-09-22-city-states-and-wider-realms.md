# City-states, wider realms and forty-two-realm maps — 2026-09-22

## Prompt

“Okay, go ahead and continue. Let's also create city state faction, lore for them, (use existing assets with different colors on them, then we will make specific ones later in another run), we also want to make sure that the map feels alive with factions. Let's also make sure that factions spread out more and can run more settlements, and let's add the option to have up to 42 factions on the map as the large maps still seem a bit empty towards the end of gameplay even on the standard size, we want it to feel like the entire map is ‘painted’ by the end of a game - there can be variants of factions, they use the same assets but like city states their assets are colored.”

## Delivered — rules/save 21

- **City-states.** Twenty-four chartered single-hearth powers, each borrowing one culture's art and unit roster while keeping its own name, colour, motto and lore. A campaign seats up to twenty-four of them beside its realms. They found nothing, declare no wars and pursue no victory, but they build, defend, hold territory and answer peace offers through the ordinary commands.
- **Lore.** `docs/lore/CITY_STATES.md` is a new book in the site's lore library, written against the faction bible at the same reference present (RR 2447).
- **Repeated cultures become variants.** Past the authored roster a seat now takes its own epithet and its own colour, so a crowded map never shows two identical banners. Borrowed art is tinted to the seat's colour in the renderer.
- **Wider realms.** Founding costs less as a realm grows, borders grow in a handful of turns instead of dozens, and administration and territory upkeep are gentler, so realms plant and keep far more hearths.
- **Up to forty-two realms** (plus city-states) per campaign, with generator 8 seating up to sixty-four starts.
- **Unification** needs two thirds of the world's hearths and at least eight, since realms now hold more of them.

## Fixed while calibrating

- The growth panel quoted founding and upkeep at rules-16 prices while the turn charged rules-21 prices. Quotes now follow the campaign's own rules.
- The AI could reserve more coin for its victory project than it actually had free, silently cancelling the caravan and hull it had already protected.
- Within the last tenth of a project's price the AI now finishes the bid instead of also saving for another hearth.
- The Epic project price is set from measured rules-21 campaigns (44,000) rather than extrapolated from the older economy.

## Measured campaigns

Full AI campaigns to an earned victory, with the share of passable land inside some realm's borders at the end:

| Campaign | Ends on turn | Hearths | Land claimed |
| --- | --- | --- | --- |
| Standard map, 12 realms + 8 city-states, Standard pace | 199 | 92 | 41% |
| Standard map, 12 realms + 8 city-states, Long pace | 303 | 126 | 74% |
| Standard map, 12 realms + 8 city-states, Epic pace | 447 | 155 | 89% |
| Standard map, 42 realms + 12 city-states, Standard pace | 193 | 227 | 88% |
| Legendary map, 42 realms + 22 city-states, Standard pace | 187 | 285 | 47% |
| Tiny map, 4 realms, Epic pace | 398 | 21 | 100% |

A crowded map is painted by the time it ends: 42 realms and their city-states claim 88% of the standard map's land inside two hundred turns. The longest paces fill the default twelve-realm map on their own. The biggest map still wants a long pace — a Standard-pace campaign there concludes before its realms have filled it.

## Verified locally

- Typecheck, lint, `content:validate` and build pass.
- `pnpm test`: 1,798/1,798 across unit, campaign and repository projects.
- `pnpm test:gameplay`: browser journeys pass.
- A genuine rules-20 save and its 1,192-order archive from deployed `c7089f1` load, re-seal to identical v20 bytes, replay exactly, re-seal into a v21 envelope and continue ten rounds of AI play.

## Not done

- City-states still wear recoloured culture art; unique portraits, crests and unit kits are a later pass.
- City-state diplomacy is ordinary war and peace — no tribute, protection or favour yet.
