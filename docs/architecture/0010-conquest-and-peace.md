# ADR 0010 — Settlement warfare and negotiated peace

Status: accepted for the 0.1.0 campaign slice, 2026-09-05.

The field-battle slice left settlements invulnerable and wars permanent. Extend the existing command boundary rather than introducing UI-only capture or a separate autoresolve formula.

- Sparse settlement sieges track the adjacent besieging army, supplies, defenses and militia. A siege suppresses production and depletes defenses/supplies each turn. Assault uses the existing formation engine; empty towns contribute a persistent militia formation. Relief attacks and withdrawing the besieger can release the siege.
- A successful assault creates an explicit capture decision. Occupation, sack, raze and context-legal liberation have different ownership, population, treasury, devastation and reconstruction consequences. Razing leaves a saved ruin that a caravan may resettle. Client rule, advanced fortification construction, siege engineers, naval blockade and refugee migration remain separate unfinished work.
- Pending battles and capture choices block strategic commands. The worker pauses for human choices; AI resolves its own choices through the same commands. Existing end-turn interruption still replans rather than persisting a phase cursor.
- Peace offers contain a single net coin direction and a binding peace duration. Proposals expire after three turns; funds are not escrowed and are rechecked atomically on acceptance. Accepted terms exchange coin, end the war and its sieges, retain settlement ownership, and prohibit another declaration until the treaty expires. No unilateral treaty breach is supported yet.
- Pair-level trust, respect and grievances preserve a small relationship memory. This is not the full directional relationship, fear, alliance, access, vassalage or political system required for 1.0. AI evaluates complete offers from its permitted observation; the player receives only qualitative reasons, objections and an acceptance band.
- Schema 3 explicitly migrates schema 2, with older migration chains retained. Canonical rules, valuation and save validation live in `packages/sim`; AI proposes commands, and the worker/UI only orchestrate and display them.

Verification must cover defended and militia assaults, tactical/autoresolve parity, capture options and resettlement, peace funding and expiry, fog/privacy, corrupt-reference rejection, midpoint saves/replay, AI use, browser gameplay and the established Huge/Legendary benchmarks. No complete release gate is claimed by this slice.
