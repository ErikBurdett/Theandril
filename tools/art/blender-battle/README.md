# Registered Blender battle-animation source

This project-local extension exercises BlenderArtFactory's actual geometry helpers,
profile loader, PNG decoder and nearest/palette reducer. It adds the stages the
stock static-facing workflow does not provide: eight authored object-keyed poses,
one fixed camera, measured origin projection, uniform timeline timing and retained
per-frame provenance. No live Blender scene is opened or edited.

From the repository root, dry-run a new immutable version:

```sh
python3 -B tools/art/blender-battle/build.py --factory-root /home/telephoneheater/Projects/BlenderArtFactory --effect ward --version 2
```

Add `--build` to render it in background Blender. Existing version directories are
refused, even on a failed render. Choose a new version; do not replace evidence.
Registered choices are `melee`, `projectile`, `ember`, `ward`, `rally`, `waykeeper`.

Each source version under `assets/art/source/blender-battle/<id>/vN/` retains the
editable `.blend`, actual 256² raw PNGs, palette-reduced 64² PNGs, factory dependency
snapshots, authored recipe/profile/driver, settings, build log, validation and a
hash inventory. No per-frame crop or bounds normalization is used. Effects use
original layered polygon meshes; the adult Waykeeper is a low-poly model with
separately keyed arms, tablet, staff and head, not an armature or a complete unit
animation set. The ground pivot is `(32,56)`; perspective toes extend to row 58.
Effect origins are `(32,32)`. Eight 100ms frames equal an 800ms one-shot and an
editable Blender timeline at 10fps.

Selected source-review candidates are melee v3, projectile/ember/ward/rally v1,
and Waykeeper v2. Melee v1 retains its empty-tail validation failure. Melee v2 is
visually identical to v3, but its editable timeline was incorrectly 100fps; v3
corrects that without changing any native PNG. Waykeeper v1 is retained with an
explicit dark-background contrast rejection; v2 adjusts physical lighting and
authored material values before quantization, not painted output pixels.

`review-1x.png` and `review-4x.png` show every frame on peat, linen and olive.
`preview.html` is a standalone one-shot review player, not evidence of an engine
round trip. Adjacent `review-vN.json` files record actual contact-sheet inspection,
not approval. Pixel Snapper/Aseprite processing, temporal gameplay review and
runtime publication remain separate root-owned steps. This tool never writes an
active brief, approval, candidate atlas or runtime binding.

Focused read-only checks:

```sh
python3 -B tools/art/blender-battle/test_build.py
python3 -B tools/art/blender-battle/test_sources.py
```

The first checks malformed alpha/palette/frame/anchor inputs and immutable paths.
The second checks the actual retained six candidates' complete file hashes, 48
unique rendered native poses, raw diversity, palette, padding, 10fps metadata and
the Waykeeper's planted feet. Passing these checks is not artistic approval.
