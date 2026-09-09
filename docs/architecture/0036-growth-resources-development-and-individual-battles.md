# Growth, resources, development and individual battles

Slice 27 adds rules/save 16, resource layer 1 and battle rules 10. Physical generator 7 and culture roster 4 remain independent. Content seal: `b79c78ed`; genuine pre-change rules 15: `eec4003a`.

## Expansion and visibility

Modern hearths have no fixed settlement count, population, worker count or claimed-area ceiling. Workers are limited by actual households, claims must form legal connected territory, and the finite world and safe integer precision remain technical constraints. A realm with `n` existing hearths pays `n × (12 + 2n)` coin to found another. Population `p` needs `12p + floor(p²/2)` stored food for its next household and consumes `2p + floor(p²/100)` per turn. Civic upkeep combines population, claimed land and realm administration. Existing distance and completed-work prices also make extensive development more expensive. Quotes come from simulation observations.

Modern capture decisions also support the expanded population and wallet ranges. A decision records `rulesVersion: 16` when its assault succeeds, so a pending historical capture retains its original quoted consequences when resumed today. Genuine siege/capture tests sack and raze a 100-household hearth with treasuries above one billion, and save/reload the pending decision before applying its exact quote. Modern peace transfers use the same safe-integer wallet boundary.

Land details support an explicit window of at most 64 cells, including focused tile selection. The player inspector requests 24 cells per page to keep complete improvement/cultivation quotes within its measured 200 kB transfer budget. Arbitrary map selection anchors the page containing that tile; all other pages remain accessible. Full claim/worker summary counts remain available; pagination does not limit canonical ownership. Incremental frontier indexes avoid evaluating the entire world for each new claim. Housing derives from actual observed claims, reserves resource deposits and real works, and walks its plot list without repeated shifts.

Owned modern claims give one ring of sight. `land.visibilityVersion` is canonical: new campaigns start at 1, while old saves migrate to 0. Only a successful modern command upgrades that flag and explicitly refreshes exploration, land memory and roads. Loading and querying preserve old exploration exactly. Old-rule commands preserve their historical visibility and limits. A departed scout and a 37-claim old city exercise the otherwise easy-to-miss outer sight ring.

AI site spacing depends on observed fertility and neighboring hearth population/footprint. Founding supplies, queued upkeep, existing income and civic costs inform its spending. This replaces fixed town targets with actual affordability, without granting hidden-resource or hidden-owner knowledge.

## Deposits and their economic use

Eight original deposits are generated deterministically from the explicit world seed and physical ecology: grain, iron, copper, salt, timber, horses, silver and ashglass. A separate sparse resource state preserves physical generator seals. Deposits are immutable, sparse and visible only after charting; changing cultivated biomes cannot convert their material. Older worlds keep resource version 0, empty deposits and empty stockpiles.

Every resource has a matching improvement, approved map sprite, construction cost, turn requirement and real site constraint. Completed extraction requires a worked tile. Output enters the owning realm's stockpile on an active turn; siege and occupation suspend it. Advanced company, hearth and faction choices consume these materials. An active owned market can sell a specified quantity at the content price. Validation precedes spending, and refused contracts leave all state unchanged. Stocks remain private.

Packed worker cells use transport version 3 for resource codes, preserving v1/v2 readers. Codes 1–8 identify current resources, zero means absent and 255 is explicit removal. World chunks draw deposits until completed improvements replace them. Native UI and Pixi share the approved catalog. Exact opaque geometry is computed offline for all resource, tile-work and civic sprites.

## Branching development

Data defines eight company-training nodes, nine hearth-specialization nodes and eight faction traditions. Six advanced officer skills extend the existing eleven character skills. Nodes have real prerequisites, progress and coin costs, optional material obligations, exclusivity and upkeep. Companies earn experience from surviving participation in combat; hearths accumulate civic points and factions gain influence. Captures, lost entities, occupation and active field missions have explicit ownership/eligibility rules.

AI observations include the faction tree and a bounded rotating candidate set. The player worker explicitly omits unused AI candidate trees, while retaining the faction tree. Focused queries retrieve a selected company's or hearth's tree; UI pages do not expand every tree in a large empire. Both human and AI choices use the same `develop` or character-promotion command and the same refusal reasons.

Canonical serialization sorts development entity dictionaries and resource stock dictionaries. This matters when loading alphabetically ordered settlements versus replaying their original creation order. Genuine generator-5/6/7 continuation tests caught and now cover that difference.

## Individual battle simulation and presentation

Each land formation saves the stable slots of its living members, forward/lateral position and cohesion. Soldier IDs combine the formation ID with its original slot. Casualties remove those slots permanently during the battle; gaps cannot create replacement troops. A naval formation has one hull actor, with strength describing hull integrity. Embarked passengers do not become battlefield actors or earn participation experience.

Advance closes the approach; brace holds position and restores cohesion; flank changes lateral position at a cohesion cost. Melee frontage limits how many soldiers can engage. Ranged formations fire with their actual members; armor, fatigue, cohesion, supporting ranks, charge and pike screens affect seeded attempts. Protection absorbs hits before member removal. Pursuit and spells use the same stable casualty identities. Old battle kernels remain frozen.

Battle facts name actual attacking, targeted and killed members and record authoritative movement. The renderer interpolates only those facts. It uses one pooled sprite per member or hull, no per-soldier React component, texture, ticker or text label. A casualty plays its recorded death/sink clip and remains in its final pose through that presentation packet. Culture banners remain separate from the shared mechanical-role animation sheets. Pause, speed, skip and reduced motion cannot change gameplay state. Tactical inspection uses a bounded 1×–4× presentation camera, selected-formation focus and clamped pan. Pointer coordinates invert that same transform; zoom never moves the canonical tactical line. The close view uses a bounded canvas height with persistent controls on narrow screens.

Battle 10 freezes company and faction training snapshots beside existing character snapshots. Load validation checks snapshot prerequisites, permanent choices, exact opening stats and member slots against entering strength. Manual and automatic resolution preserve combat, aftermath, company experience and saved RNG. Their full campaign hashes may differ because manual orders retain their real round events.

## Art and budgets

Thirteen editable Blender rig/action sources generate 832 frames: independent east/west views with idle, walk/sail, attack/fire, hit and death/sink clips. Real Pixel Snapper and Aseprite processing retain exact native originals, processing receipts, editable exports and individual visual approvals. Eight resource deposits and eight extraction works come from sixteen separate image-generation originals with retained prompts and native review sheets.

The published pack contains 545 assets and 1,427 frames. Foundation remains byte-identical. Map residency stays 17 MiB; opening a battle adds the 4 MiB effects page and two 16 MiB unit pages, for 53 MiB decoded atlas residency. These figures exclude viewport caches, DOM image decoding and other GPU allocations. Headless and browser measurements, screenshots and remaining limits are tracked separately in [slice 27 evidence](../performance/0039-growth-resources-and-battles.md).
