# 0054 — Standing worker stewardship

Rules/save36 extends existing M3 governor scope from paid production charters to
free worker allocation. Production, claims, improvements and cultivation remain
separate decisions. The player can apply a policy individually or through the
existing checked-hearth registry and saved selections.

## Canonical contract

`setWorkerPolicy` installs Balanced, Food, Industry, Coin or Knowledge for one
owned settlement. Installation immediately selects legal workers unless siege or
occupation blocks assignment. A blocked policy waits. Removing it preserves the
current assignments. A successful direct `setWorkedTiles` validates first, then
revokes the policy; a refused order changes neither workers nor policy. Capture,
liberation and razing remove the former owner's policy at the ownership boundary.

After settlement harvest, production, growth, land-work completion and occupation
countdown, policies reassign workers for the following harvest. A new person or
claim can therefore be used without another click. The policy neither grants an
extra harvest nor spends coin. Only actual allocation changes emit allocation
events. Existing charters, queues, musters, paid work and treasury stay independent.

Named priorities compare their named yield first, then balanced utility. Balanced
uses food×5 while food reserves are below population×8, otherwise food×2, plus
industry×3, coin and knowledge×2. Equal scores prefer the lower numeric cell.
Material extraction is a separate output: a policy can unwork its deposit and
stop extraction. Both individual and group controls disclose that consequence.

## Bounds and ownership

`packages/sim` selects from legal, charted, owned claims using the existing land
read contexts, biome affinities and completed improvements. It excludes the free
center and illegal deep ocean. No UI page limits the candidate set. A top-k heap
uses O(claims log worker capacity) scoring and O(worker capacity) ranking memory;
shared owner/index data is detached, not saved. Per-turn work visits governed
claims, never every world cell for every town. Policy summaries contain current
assigned/capacity counts and canonical blockers, not candidate arrays or previews.
Only the owning realm receives policy metadata.

Policy records are sorted and unique by settlement; schema capacity reflects the
finite350,000-cell world, not an artificial governor cap. Group requests retain a
128-hearth transport bound. They validate every envelope and the reviewed hash
before mutation, use stable ordinary commands, retain per-hearth refusals and
publish once. They do not add an implicit autosave. Correlation failures or
publication interruptions after commands begin require saved restoration.

## AI and historical compatibility

The AI adopts Balanced only for completely quoted, non-resource hearths that can employ every legal claim and have no
project-funding worker exception. Scarce-worker tradeoffs stay with the strategic
planner. Material planning, incomplete tile windows
and fiscal optimization keep direct worker commands; those explicitly revoke an
existing policy even when the desired allocation is unchanged. Paid land planning
continues independently. Historical observations omit the capability entirely.

Save36 migrates older state with an empty policy registry. Rules35 serialization,
command validation and replay remain frozen; old envelopes cannot discard a
nonempty new registry. The pre-change generated35 archive and raw save retain
their original bytes and seals. Mixed historical-to-modern continuation records
the explicit rule transition. Persistence accepts36 journal checkpoints.

## Evidence and limits

See [the implementation packet](../development/2026-10-25-worker-stewardship/README.md)
for actual checks, retained failures, pacing and scale measurements. This is a
bounded worker governor, not automatic land purchasing, construction, cultivation,
whole-empire optimization or completed M3 acceptance. DH-021 and the full release
gates require their existing broader evidence.
