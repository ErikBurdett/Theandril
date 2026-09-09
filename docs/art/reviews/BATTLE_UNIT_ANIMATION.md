# Original articulated battle roles

The battle family contains 13 original shared role rigs, 832 actual rendered and
processed frames, and 130 directional clips. It preserves all 24 culture kits
and the exact foundation atlas. Existing banners carry culture identity in the
individual scene; these shared roles are not 312 new culture animations.

[Exact source/native inventory](battle-units/source-native-manifest.json) records
each selected source version, editable Blender SHA-256, approved input hash,
original review notes, processed contact sheets and atlas binding. It verifies
all retained contact-sheet hashes. Every approval keeps the real `.aseprite`,
sheet metadata and complete hash-bound Pixel Snapper/Aseprite processing receipt.

## Native review

The accepted sources are guard v4, scout v1, spearman v3, heavy infantry v1,
halberdier v2, colonist v2, skirmisher v2, arbalester v1, cavalry v1, lancer v1,
transport v2, coastal warship v3 and ocean warship v2. Earlier camera/polearm/oar
margin failures remain retained as rejected calibration versions.

All processed frames were inspected at native scale and enlarged nearest-neighbor
scale. The Oathguard pilot established repaired steel, warm leather, quilted
layers, edged wood and modest brass; its planted feet, sword anticipation and
grounded backward collapse were independently reviewed before the role batch.
Both directions are actual camera renders with opposite travel/weapon bearings;
backward collapse deliberately moves opposite the forward facing.

The infantry kits remain distinguishable by pack/staff, hood/bow, shield/sword,
pike, tower shield/hammer, buckler/javelins, crossbow and hooked polearm. Their
weapons have distinct attack timing and articulated arms. Some thin bowstring,
mail and face detail becomes single-pixel texture at native scale. The eight
frames preserve complete weapon silhouettes inside the fixed camera; no frame
was independently cropped, enlarged, translated into apparent motion or mirrored.

Cavalry and lancer show separate rider and horse anatomy, four moving hooves,
curved sword versus couched lance, saddle equipment and a joint horse/rider
collapse. The parent reviewer independently accepted attack and opposite-facing
death examples. Hulls show separate oars, flexible sail panels, launcher movement
and a hull sinking below a rendered waterline. The transport retains cargo,
the coastal ship a long galley and oars, and the ocean ship a broader armored
fighting deck. The parent reviewer accepted transport sail and sinking examples.
The final sink frame retains a small sail/spar fragment; this is intentional.

The [factory contract](../../../tools/art/blender-battle/units/README.md) documents
64px foot and 96px mounted/hull canvases, exact anchors, two real facings and
idle/walk/attack/hit/death or idle/sail/fire/hit/sink. Relative-bone QA rejects
translated stills, frozen feet/hooves, rigid sails/launchers and unmoving deaths.
These checks support the inspected frames; they are not automatic approval.

## Runtime scope

The renderer now pools one sprite for each exact canonical member slot and one
for each naval hull. It uses only recorded movement and source/target/killed IDs.
Hit/death timing follows the canonical presentation packet; paused playback,
skipping and reduced motion cannot change the state. Dead sprites hold their
last exact pose through packet completion. Formation annotations retain strength
and culture banners; the individual sprites do not each allocate a text label.

The current publication is 545 assets / 1,427 frames. Map pages remain 17 MiB;
the effects page adds 4 MiB and the two unit pages add 32 MiB only on first
battle. All five pages total 53 MiB decoded atlas storage and 4,150,190 PNG bytes.
This excludes separate DOM decoding, chunk caches and other GPU allocations.

## Actual battle review

The coordinated one-worker Chromium run passes **7/7 in 1.4 minutes**: all ten
land roles, all three hull roles, field/siege/naval playback, actual spell effects
and the separate dense battlefield sample. The exact
[runtime manifest](battle-units/runtime/manifest.json) retains source paths,
SHA-256 values and scope for desktop/390px deployment, actual mid-impact and
completed casualties. Authored funded armies still declare war, attack and issue
real orders; expected participant and casualty IDs come from the canonical
packet, not injected animation outcomes. Earlier interrupted, shared-server and
hot-reload attempts are excluded from acceptance.

The [land impact](battle-units/runtime/land/roles-live-impact.png) and
[naval impact](battle-units/runtime/naval/roles-live-impact.png) show the approved
role artwork in real movement, attack and death/sink poses. The retained JSON
checks exact frame IDs and participant identities. Land casualties leave visible
holes and grounded bodies; hull deaths pass through a mid-sink pose to the
retained sail fragment. Culture banners remain separate and readable. Formation
Fit deliberately makes large ranks small; it cannot expose all native equipment
detail at 390px. The parent reviewer independently accepted these actual land
and naval captures, then requested a real inspection camera for narrow screens.

That follow-up passes **5/5 in 36.5 seconds**: one new 390px camera interaction
and the four existing field/caster/siege/naval flows. **Battle view** offers
**Fit field**, **2× detail**, **3× detail** and **4× detail**. **Focus selected**
centers a selected formation or officer at at least 3×; four pan controls remain
bounded by the battlefield. The same Pixi scene and nearest-sampled sprite
textures are enlarged inside a clipped viewport. Inverse camera picking maps an
actual visible soldier back to its formation. Paused elapsed time, exact frame
IDs, living identities and canonical hash survive pan, selection and Fit restore.

All three camera captures were visually inspected. In the
[4× inspection view](battle-units/runtime/camera/battle-inspection-controls-390.png),
the 60-man formation fills the narrow field and separate helmets, shields, boots
and limb silhouettes can be inspected. The sticky camera controls remain
accessible. Dense ranks still overlap and scaled count text is softer than the
native sprite pixels. [Restored Fit](battle-units/runtime/camera/soldiers-fit-restored-390.png)
shows the same soldiers and selected formation at an overview scale. The camera
does not invent additional sprite detail or alter combat.

The isolated **2,240-soldier** sample uses 40 actual formations, six officers and
120 warmed animation frames. Actual Chromium reports ANGLE/SwiftShader software
rendering: frame p50 **50 ms**, p95 **66.7 ms**; render CPU p50 **0.7 ms**, p95
**8.8 ms**. It retains a bounded 2,240-sprite pool, at most 12 effects, unchanged
world chunks and 53 MiB decoded atlases. The
[exact focused measurement](../../performance/0039-battle-render-focused.json) predates the
camera controls and measures Fit; the camera follow-up is functional evidence.
This is not 60 FPS or physical-GPU approval. Large battle optimization, dense-rank
occlusion and native-detail limits at overview scale remain explicit.

The later [full-suite battle sample](../../performance/0039-battle-render.json),
recorded at 2026-09-09 02:15:29 UTC, repeats **50.0 ms p50 / 66.7 ms p95**
frame time, with **66.8 ms maximum** and **0.7 / 8.7 ms** renderer CPU.
The earlier focused CPU p95 was 8.8 ms; this small sample difference does not
establish an optimization. Workload/content/command hashes, 120 sampled frames,
18 active frames, 2,240 soldier pool, 12 effects and 53 MiB atlas residency agree.
The later sample includes the camera controls at exact Fit (zoom 1, identity
transform), uses the same actual SwiftShader backend, reports no page errors and
leaves world chunk rebuilds unchanged at two. Its passing battle performance
case does not imply that every case in the 149-test invocation passed.

After the full invocation, a documentation audit verified 411 retained
source/native/runtime file references and their supplied SHA-256 values across
the battle roles, camera, earlier hearth and improvement evidence. The accepted
focused JSON retained in the runtime manifest is still byte-identical to
`0039-battle-render-focused.json`; it is not relabeled as the later sample.
All links in the current battle, hearth and art overview documents resolve.
