# Hearth development and strategic marker review

Reviewed 2026-09-08 in the actual Chromium game. Final runtime presentation is accepted for this development slice. This is a scoped visual and interaction review, not a 1.0 or performance signoff. Exact screenshot hashes and originating test paths are retained in [runtime-review-manifest.json](runtime-review-manifest.json).

## Hearth development

The [normal camera](mature-hearth-normal.png) and [2.2× camera](mature-hearth-near.png) show a population-12 Ashen hearth spreading across its claims. Ten culture village sprites surround four distinct, actually completed civic buildings. The textured Root cellar, Cinder workshop, Charter market and Witness archive now sit on muted earth with narrow approach lanes. Their materials and silhouette detail fit the existing pixel settlements substantially better than the rejected flat symbols. Actual worked ground and completed fields remain distinguishable from residential blocks.

The fixture authors terrain, starting resources and population. Its founding, 37 claims, four buildings, worker assignments and field improvement use ordinary commands and real costs; construction advances through real turns. Population 12 is the largest current cosmetic housing tier, not a newly implemented maximum-level settlement rule. Housing reuses the existing culture village artwork; this review does not claim ten independently authored house assets.

[Paid construction](paid-hearth-and-tile-construction.png) uses visible scaffolding, followed by the [completed cellar and fields](completed-cellar-and-fields.png). Real browser controls verify the coin deductions, worker ground, saved pending work, cancellation without refund, exact restored hash, positive work progress and completed improvement. A later cultivation order changes its visible progress and disappears on cancellation while retaining its original biome. Remembered foreign land does not expose a newly completed unseen field or a queued workshop.

At [far zoom](mature-hearth-far.png), detailed district buildings are suppressed while the occupied ground and screen-sized heraldry remain visible. Diagnostics report ground presentation and no rendered civic asset ID at this scale. The [390-pixel view](mature-hearth-narrow.png) retains that same far scale: it verifies readable heraldry, map controls and no horizontal document overflow. It is not a second close-camera mobile screenshot.

The separate [coastal harbor view](charter-harbor-near.png) and [390-pixel harbor view](charter-harbor-near-390.png) both retain the 2.2× near camera. The approved timber storehouse and lifting crane sit on a land district directly beside visible shallow water, with a distinct working silhouette and the whole harbor clear of the controls at both widths. This closes the fifth civic asset's runtime visual review. The fixture uses authored coast/resources/population but actual founding, paid navigation research, a paid harbor queue and completed construction turns. Exact served atlas pixels remain within the district hex; zoom and resizing preserve local terrain, naval production permissions and the campaign hash. The [unedited evidence JSON](charter-harbor-evidence.json) records 30 knowledge, 20 coin, six construction turns, the approved harbor at cell 640, its 39.750566-world-pixel opaque width and unchanged hash `775f8474`. It comes from the final evidence-export rerun; the reviewed screenshots retain their earlier source paths in the manifest. This is a coastal building review, not a change to ship launch or navigation rules.

The first [normal](rejected-first-mature-hearth-normal.png) and [near](rejected-first-mature-hearth-near.png) candidates were rejected during independent inspection. Large grey hex pads, dense straight connections and flat civic symbols made the town resemble a diagram. These files remain as rejected runtime evidence; they are not alternate approved sprites.

## Strategic selection

The [strategic badge view](strategic-badges-inspected-without-orders.png) includes a garrison whose badge is displaced 26 screen pixels diagonally from its canonical cell. A real click on that badge previously mapped to an adjacent hex. The renderer now resolves visible far badge bounds in painter order and supplies the original entity and cell. Ordinary badge clicks inspect the exact own army or town, or the observed foreign cell, without moving the previously selected army.

Actual shift-click still follows the command path to the original hearth cell. In the tested three-step case, canonical queued travel immediately consumes the guard's available movement, reaches that hearth and removes its completed route. Near-camera co-located army cycling and fleet/passenger rendering retain their existing browser checks. World overview and hidden foreign armies do not supply strategic entity hit targets.

## Verification

- Final hearth gameplay and visual cases: **3/3**, **13.9 seconds**.
- Strategic picking plus existing army size/fleet cases: **4/4**, **14.5 seconds**.
- Coastal Charter harbor at desktop and narrow near zoom: **1/1**, **3.5 seconds** in the final Chromium batch; durable JSON evidence rerun **1/1**, **4.4 seconds**.
- Marker hit ordering unit check passes; scoped ESLint and whole typecheck pass at the focused checkpoint.
- Zoom, inspection, desktop/narrow layout and save restoration preserve the expected canonical hashes. Idle district chunks do not rebuild between unchanged frames.

The integration owner's complete browser/build/unit and benchmark results are recorded separately. These local durations measure complete test runs, not rendering frame time or campaign balance.
