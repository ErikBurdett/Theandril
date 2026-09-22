# Simplification, efficiency and gameplay-depth audit — 22 September 2026

This is planning input for the existing [roadmap](../../1.0-DEVELOPMENT.md#active-development-roadmap).
It does not replace or extend the roadmap. A read-only review of the code at
`fix/campaign-verification-cost` produced it; the parent session then spot-checked the
headline claims marked ✔. Line references are from that review and may drift.
Anything that changes rules needs **rules/save 18** with frozen v17 behavior. Any
content edit changes `CONTENT_HASH` and needs a frozen pack.

## The design principle to apply

The goal is a very large 4X that is still easy to learn. Get depth from interactions
between systems that already exist, not from more rules, and hide scale behind
delegation. Each proposal below either links two existing systems through one small
rule, or turns a hard-coded special case into data. None adds a parallel subsystem.

## Where decisions are shallow today

- **Coin does almost everything.** It pays for founding, claims, works, units,
  characters, institutions, development, roads and victory. The five buildings are
  flat bonuses every town eventually gets, and the AI builds them in content order.
- ✔ **Sieges are a fixed timer:** 3 supply turns, then morale loss (`siege.ts:52`,
  `:126`). The town's stored food, granaries and stewardship play no part.
- ✔ **Diplomatic memory has no consequences.** `trust` and `respect` are written
  (`diplomacy.ts:79`, `:87`, `:138`) but no rule, AI or UI reads them. Declaring
  war costs nothing.
- ✔ **Institutions are a single choice the AI always makes the same way**
  (Charter compact, `ai/progression.ts:121`).
- **One victory path (Prosperity).** Once three towns qualify, the AI waits for coin,
  which is exactly the funding wait Gate B says is not engagement. Besieging the host
  town is the only counterplay.
- ✔ **The AI ignores several player systems:** ruins and resettlement, capital moves,
  army splitting, and trust/respect.

## Six interlocking mechanics (ranked)

| # | Mechanic | New decision | Systems linked | Rule surface |
| --- | --- | --- | --- | --- |
| G1 | **Victory registry.** Prosperity requires three *specialized*, road-linked hearths, at a lower coin cost. Unification (M1) is a second path on the same machinery. | Which towns specialize; which roads to guard. Rivals can cut a road instead of only besieging. | Hearth specialization, roads, sieges, M1 clients | Small data-driven condition set. Removes the AI's duplicated eligibility rule. |
| G2 | **Grievance and reputation.** Border claims that touch another faction's claims build grievance. Declaring war without grievance costs trust with everyone who knows both sides. | Earn a pretext or pay in reputation; sack or occupy now matters later. | Claims, diplomacy memory, peace, M1 client consent | Uses fields that are already saved; one shared offer evaluation. |
| G3 | **Strategic resources gate elite units.** | Resource deposits become military objectives; selling at market competes with fielding armies. | Resources, recruitment, sieges (extraction already halts) | One cost check plus content data. |
| G4 | **Stored food is siege endurance.** It replaces the constant 3; the observation shows a fog-safe ample/low/exhausted band. | Granaries and stewardship defend; the attacker chooses between starving and assaulting. | Food, growth, sieges, fog | Replaces a magic number (siege schema bump). |
| G5 | **Army supply.** Armies are supplied near their own or allied claims, on known roads, or in their culture's favored biomes. | Roads and claims matter militarily; cultures gain a logistics identity. | Territory, roads, faction ecology, upkeep | Derived per army, with no stored state. |
| G6 | **Surplus industry becomes local labor** (land works, then roads). | Workshops matter in towns that don't recruit; coin loses its monopoly. | Production, land works, roads | Deletes the AI's idle-town special case. |

## Learnability and scale (no rules change)

- **L1 Advisors = the AI's own rankers.** Extract the worker-tile and production scorers
  into shared advisors. A per-town "Auto" toggle issues ordinary commands, so the player
  and AI share one scoring function. This is the start of M3 delegation.
- **L2 Alert inbox.** The player sees only recent entries of a 200-event feed shared by
  all factions. Group the player's own command-result events (paused production, upkeep
  shortfall, sieges, rival projects) into locatable alerts.
- **L3 Goal tracker with reasons.** Show victory blockers and turns-to-afford. After G2,
  add a war-declaration preview.
- **L4 Progressive disclosure.** Reveal tabs as their systems unlock (Arcane after an
  archive, Naval after coastal navigation, Resources after the first deposit).

## Code simplification (ranked)

1. **Command registry.** Replace the long `applyCommand` branch chain and its
   command-type lists with a registry run in today's order, so M1 commands become one
   row each. Order-preserving, and gated on the historical archives.
2. **Rule profile.** `rulesVersion` comparisons are scattered through `simulation`,
   `warfare`, `territory`, `characters` and `combat`. Publish named capability flags per
   version, and move the per-version command schemas and guards into a
   `legacy-commands` table.
3. **Split `save.ts`** into schemas, frozen content packs, migration steps and validation.
   Frozen ID sets are duplicated in four places. Keep every schema object verbatim, since
   key order is part of the historical hashes.
4. **One terrain step-cost function and one blocker vocabulary.** Step cost is currently
   implemented five times.
5. **Package boundaries.** Stop `export *` from exporting internal mutators, move the
   AI's `planDevelopment` out of `sim`, and break the `simulation` import cycles.
6. **Split `apps/web/src/main.tsx`** (80 KB) before M3 adds delegation UI.

## Efficiency, next steps

- **Worker:** stop hashing the full state after every click. The hash is only a staleness
  token for query replies, so use a journal revision instead. Autosave at turn end,
  capture and battle end. About 60 ms is saved per command on Standard/24 maps.
- **Observations:** add an AI profile that omits fields the planners never read
  (battle reports, events, scenes, abilities, ruins). Maintain a per-faction
  known-faction set instead of walking all remembered land per observation.
- **Land knowledge:** the end-of-turn refresh re-observes every visible cell of every
  faction. Refresh only changed land cells instead.
- **Memoize per faction per turn** values that are currently recomputed per settlement
  (progression yields, growth).

## Suggested next slices (after M0)

1. **M1a:**
   - Grievance, reputation and client offers (G2 plus M1 client states), with a
     hash-neutral command-registry refactor first.
   - Acceptance: v0–17 fixtures stay byte-identical; tests cover cycles,
     refusal/expiry, funding and capture-boundary replay; Playwright shows AI
     refusal, acceptance, inspection and ending a client relationship.
2. **M1b:**
   - The victory registry: contestable Prosperity plus Unification (G1 and L3).
   - Acceptance: winning fixtures for both paths, interruption by siege, a cut road
     and client defection, unchanged historical Prosperity archives, and browser
     journeys for both paths.
3. **M3-early, in parallel, no rules change:**
   - Advisors, alerts and cheap worker publication (L1, L2 and the worker item).
   - Acceptance: AI commands stay byte-identical after extraction, zero full hashes
     on non-turn publishes, and a Playwright auto-assign journey that survives
     save/load.
