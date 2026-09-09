---
name: theandril-territory-ecology
description: Implement and verify Theandril settlement territory, worked tiles, land improvements, faction biome affinities and cultivation. Use for changes crossing land ownership, yields, fog, conquest and save compatibility.
---

# Territory and faction ecology

Read the repository core and simulation skills first. Inspect current `territory.ts`, content ecology definitions, save migrations and historical archive fixtures before changing rules.

Keep settlement size and capital designation separate. Owned, worked and improved tiles are distinct; never let one tile feed two towns. All land orders go through the same public command boundary for AI and player. Show exact current quotes and refusal reasons in the observation rather than inventing UI prices.

Rules 16 removes the 20-population, 37-claim and six-worker ceilings. Settlement
count, households and connected claims grow through rising founding prices,
food demand, border prices and civic upkeep. Finite map area, actual households
and safe integer precision remain real constraints. Do not reintroduce gameplay
caps to bound a UI: use the 64-cell land query window and preserve full summary
counts. Frozen rules 15 and earlier retain their own limits and exact formulas.

Owned claims provide one-ring sight only when `land.visibilityVersion` is 1.
Migration preserves version 0 until a successful modern command explicitly
upgrades it. Loading, querying, failed commands and historical replay cannot
upgrade sight, exploration or remembered land/roads. Validate the full required
sight before rebuilding indexes; keep a departed-scout/outer-claim regression.

Resource extraction requires the deposit's matching completed improvement and
a genuinely worked tile. Ordinary settlement yields and stockpile output are
separate. Siege and occupation suspend extraction. Material costs are validated
before atomic spending; market contracts use the owning faction's stocks and
an active owned market. Test paid construction, turn output, material spending,
trade, capture, fog and exact save continuation together.

Cultivated biomes are a sparse canonical overlay on immutable generated geography. Changing a biome does not move a coast, grant mountain access or erase the terrain of a recorded battle. Physical geography changes require their own movement, transport and battle-history design.

Fog remembers the last observed land state, not the current unseen state. Keep that memory sparse; update it at authoritative observation events, never in a read selector or while silently repairing a modern save. Survey knowledge and military visibility are distinct.

Refusal text is also an observation. Check charting and legal range before querying live remote ownership; a rejected distant claim must not disclose an unseen rival purchase. Test the same probe before and after a real hidden change, comparing both errors and unchanged hashes.

Capture, liberation, razing and population loss must reconcile claims, workers, capital designation and paid work. Record cancellations honestly; do not refund a work order after it changed ownership. Preserve historical rules and genuine pre-change archive seals when adding canonical fields.

Verify failed commands leave hashes unchanged; compare replay/save continuations; test unseen foreign changes and conquest during unfinished work. Measure bounded land queries on mature large-map campaigns, not only empty new worlds. Browser checks must cover readable borders, tile selection, actual paid work completion, narrow layouts and correct faction/biome asset bindings.

Distinguish one-town queries against a large registry from one faction owning many towns. Measure both: repeated tile-option prose can outweigh the sparse canonical land state. Do not infer full observation or worker-transfer cost from the land selector alone. Avoid directing players to demolition or replacement controls that do not actually exist.

## Rules16 growth and migration

Modern hearth count, population, worked land and claimed land have no gameplay
ceiling. Use the canonical rising founding fee, food threshold/consumption and
population/territory/administration upkeep. Array and numeric limits must express
finite world capacity or safe serialization, never a disguised development cap.
Keep rules15 and earlier arithmetic, six workers, radius three and37 claims frozen.

Quote at most64 cells per selected hearth page. Build detached ownership/frontier
indexes once and update affected claim edges; never scan the world or enumerate a
growing radius disk for each quote. Preserve off-page worker assignments. Advance
AI pages by actual town visits so rotating a large realm cannot repeatedly select
the same page. Test paid acquisition beyond37, workers beyond6, actual food-funded
growth beyond20, all-page reachability, direct selection and save mirrors.

Land visibilityVersion is canonical: new16 campaigns use1; migrated older saves
retain0. Owned claim sight is enabled only for1 under modern rules. Upgrade0→1
only after a successful modern command, explicitly refreshing sight and sparse
land/road memory. Loading, failed commands and every selector must leave it alone.
Test an old37-claim town with its scout away and an unexplored outer ring through
old load, modern reserialization, reload, rejected action and successful transition.
