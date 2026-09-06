# 0019 — Territory, worked land and faction ecology

Status: implemented across simulation, AI, player UI and reviewed artwork; integrated gameplay and deterministic campaign checks pass. This is a development slice, not a completed 1.0 gate.

The campaign's immutable generated world retains physical movement terrain, fertility,
water depth and original biome. Generator4 adds coherent ash scrub and chalkland while
explicit generators1–3 preserve their historical arrays and starts. Current campaigns
match cultures to the generator's already viable, spaced candidate starts; this reorders
candidates, not the land itself. Explicit historical generators retain the four-culture
catalog. Iron Covenant and Sepulchral Synod come from the existing Book of Broken Roads.

Schema9 stores a sparse land registry: each living settlement has ordered connected
claims, up to six worked hinterland tiles, improvements and at most one paid work order.
The center works automatically. Colony(population1–2), settlement(3–7) and city(8+) expand
claim reach from one to two to three hexes, bounded at37 claims. Losing population trims
workers but does not erase established borders. Capital designation is independent of
size, with a deterministic replacement after conquest. Borders currently allocate yields
and work; they do not silently create access treaties or block military movement.

Seven deterministic natural features and six authored ecology traditions contribute
signed integer yield modifiers. Five improvements enforce terrain, biome, water-depth
and feature predicates. Modifiers are combined before final zero clamping. Only legally
worked tiles and the center supply land yields, before the existing devastation,
occupation and siege penalties. Tile work uses a separate local active-turn commitment,
not a hidden building-queue item or a movable worker army. Its coin price is paid upfront
and grows with distance, completed faction works and off-affinity adaptation. Starting a
second order requires finishing or explicitly cancelling the first. Occupation/blockade
pause progress; capture cancels the remaining work time without refund. Improvements pass
with the town. Razing releases claims and removes improvements; cultivated biomes remain.

Cultivation can change an eligible claimed land tile to an authored faction target biome.
It is not a spell, caster, climate simulation or land/water conversion. It does not grant
mountain/ocean movement or alter a historical battle's physical terrain. A future physical
terraforming system must separately reconcile routes, ships, buildings and old battles.

Land knowledge is sparse canonical last-seen information. Sight changes, surveys and
authoritative land changes update it explicitly. Fogged observations never query the
current foreign landscape. Out-of-reach claim refusals run before live ownership lookups,
so an invalid order cannot probe hidden border changes. Current saves reject inconsistent visible knowledge rather
than fixing it while loading. Legacy saves receive deterministic initial claims and
knowledge only after their original shape, references, checksum and content are checked.
Historical commands execute their original economy, then rebuild modern land defaults
for deterministic modern continuation. Schema4–8 projections preserve exact original
save bytes and archive seals; new cultivated/improved land cannot be downgraded.

The player and AI consume the same exact quotes/blockers. AI orders rotate across at
most eight towns per pass and reserve ordinary military/production funding. It issues
at most one paid land order per proposal batch, avoiding quotes invalidated by other
spending. No hidden world cells, treasury grants or minimum-turn victory lock are added.

Verification includes true pre-change schema8 archives (queued navy, landing, pending and
completed naval combat, generated growth and Epic spending), refused-command hash
atomicity, contested centers, growth/worker limits, signed feature effects, paused work,
capture/raze memory, current-save corruption, mirrors and complete technical replay.
All 54 Chromium gameplay scenarios pass, including saved cultivation, real feature/yield
breakdowns, capital succession, all six culture selections and narrow controls. The
reviewed factory adds 37 assets without changing the existing 97 approved images.
[Integrated measurements](../performance/0016-territory-integration.md) and
[mature territory measurements](../performance/0015-territory.md) retain the actual
workloads and limitations, including large-empire quote payloads. This decision does not
claim a completed 1.0 gate.
