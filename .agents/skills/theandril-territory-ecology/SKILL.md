---
name: theandril-territory-ecology
description: Implement and verify Theandril settlement territory, worked tiles, land improvements, faction biome affinities and cultivation. Use for changes crossing land ownership, yields, fog, conquest and save compatibility.
---

# Territory and faction ecology

Read the repository core and simulation skills first. Inspect current `territory.ts`, content ecology definitions, save migrations and historical archive fixtures before changing rules.

Keep settlement size and capital designation separate. Owned, worked and improved tiles are distinct; never let one tile feed two towns. All land orders go through the same public command boundary for AI and player. Show exact current quotes and refusal reasons in the observation rather than inventing UI prices.

Cultivated biomes are a sparse canonical overlay on immutable generated geography. Changing a biome does not move a coast, grant mountain access or erase the terrain of a recorded battle. Physical geography changes require their own movement, transport and battle-history design.

Fog remembers the last observed land state, not the current unseen state. Keep that memory sparse; update it at authoritative observation events, never in a read selector or while silently repairing a modern save. Survey knowledge and military visibility are distinct.

Refusal text is also an observation. Check charting and legal range before querying live remote ownership; a rejected distant claim must not disclose an unseen rival purchase. Test the same probe before and after a real hidden change, comparing both errors and unchanged hashes.

Capture, liberation, razing and population loss must reconcile claims, workers, capital designation and paid work. Record cancellations honestly; do not refund a work order after it changed ownership. Preserve historical rules and genuine pre-change archive seals when adding canonical fields.

Verify failed commands leave hashes unchanged; compare replay/save continuations; test unseen foreign changes and conquest during unfinished work. Measure bounded land queries on mature large-map campaigns, not only empty new worlds. Browser checks must cover readable borders, tile selection, actual paid work completion, narrow layouts and correct faction/biome asset bindings.

Distinguish one-town queries against a large registry from one faction owning many towns. Measure both: repeated tile-option prose can outweigh the sparse canonical land state. Do not infer full observation or worker-transfer cost from the land selector alone. Avoid directing players to demolition or replacement controls that do not actually exist.
