"""Original planked hulls, articulated sails/oars and deck torsion weapons."""
import math
import bpy
from mathutils import Vector
import guard_base as base
from battle_authoring import material

v, bind = Vector, base.bind
ROLE = 'transport'


def points(state, index, count):
    phase = index / count * math.tau
    sail = state == 'sail'
    sink = index / (count - 1) if state == 'sink' else 0
    recoil = [0, .1, .3, 1, .55, .2, .05, 0][index] if state == 'fire' else 0
    hit = [0, 1, .5, 0][index] if state == 'hit' else 0
    center = v((0, 0, .08 - 1.55 * sink))
    result = {'root': (v((0, 0, 0)), v((0, 0, .1))),
              'hull': (center, center + v((.10 * hit + .24 * sink, -.4, -.20 * sink))),
              'mast': (center + v((0, .05, .24)), center + v((.36 * sink, .05, 1.85 - .35 * sink))),
              'sail.upper': (center + v((0, .05, 1.45)), center + v((.04 * math.sin(phase), .05 + .045 * math.cos(phase), 1.77))),
              'sail.lower': (center + v((0, .05, .75)), center + v((.09 * math.sin(phase + .5), .05 + .07 * math.cos(phase), 1.4))),
              'weapon': (center + v((0, -.80 + .10 * recoil, .45)), center + v((0, -1.02 + .10 * recoil, .48))),
              'weapon.L': (center + v((-.10, -.91 + .10 * recoil, .53)), center + v((-.38, -.91 + .25 * recoil, .53))),
              'weapon.R': (center + v((.10, -.91 + .10 * recoil, .53)), center + v((.38, -.91 + .25 * recoil, .53)))}
    for index_oar in range(6):
        y = -.70 + index_oar * .28
        for side in (-1, 1):
            rhythm = phase + index_oar * .13
            length = .71 if ROLE == 'coastal_warship' else .51
            a = center + v((side * .31, y, .12))
            b = center + v((side * (.31 + length), y + (.22 * math.sin(rhythm) if sail else .015 * math.sin(phase)), -.035 + (.10 * math.cos(rhythm) if sail else 0)))
            result[f'oar.{index_oar}.' + ('L' if side < 0 else 'R')] = (a, b)
    return result


def build(ctx):
    global ROLE
    ROLE = ctx.profile['role']; rest = points('idle', 0, 4)
    data = bpy.data.armatures.new('Ship working mechanism rig'); rig = bpy.data.objects.new(ROLE + ' rig', data); bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig; rig.select_set(True); bpy.ops.object.mode_set(mode='EDIT')
    for name, (head, tail) in rest.items():
        bone = data.edit_bones.new(name); bone.head, bone.tail = head, tail
        if name != 'root': bone.parent = data.edit_bones['root' if name == 'hull' else 'hull']
    bpy.ops.object.mode_set(mode='OBJECT'); rig.select_set(False)
    for bone in rig.pose.bones: bone.rotation_mode = 'QUATERNION'
    for name, color in [('planks', '#806042'), ('planklight', '#b7a07a'), ('timber', '#553e2c'), ('iron', '#657680'), ('ironlight', '#a1afb1'), ('canvas', '#d2ddcf'), ('canvasShade', '#b7a07a'), ('rope', '#977544'), ('dark', '#28272d'), ('redcloth', '#915647')]: material(ctx, name, color)
    length = 2.8 if ROLE == 'coastal_warship' else 2.5
    width = .47 if ROLE == 'ocean_warship' else .38 if ROLE == 'transport' else .30
    # Ring-built hull includes a visible curved keel and separate top gunwale.
    rings = [(-length / 2, .02), (-length * .35, width * .76), (0, width), (length * .35, width * .80), (length / 2, .055)]
    vertices = []
    for y, breadth in rings:
        vertices.extend([(-breadth, y, .26), (-breadth * .84, y, -.05), (0, y, -.21), (breadth * .84, y, -.05), (breadth, y, .26)])
    faces = []
    for ring in range(len(rings) - 1):
        for side in range(4): faces.append((ring * 5 + side, (ring + 1) * 5 + side, (ring + 1) * 5 + side + 1, ring * 5 + side + 1))
    faces += [(0, 1, 2, 3, 4), (20, 24, 23, 22, 21)]
    bind(ctx.mesh('curved original planked hull', vertices, faces, 'planks'), rig, 'hull')
    deck = [(x, y, .27) for y, breadth in rings for x in (-breadth, breadth)]
    bind(ctx.mesh('open timber deck', deck, [(index * 2, index * 2 + 1, index * 2 + 3, index * 2 + 2) for index in range(4)], 'planklight'), rig, 'hull')
    for side in (-1, 1):
        for index_ring in range(4):
            a, b = rings[index_ring], rings[index_ring + 1]
            bind(ctx.beam('raised continuous gunwale', (side * a[1], a[0], .31), (side * b[1], b[0], .31), .035, 'timber', 8), rig, 'hull')
        for y in (-.65, -.30, .05, .40, .75):
            bind(ctx.box('exposed hull rib fastening', (side * width * .95, y, .10), (.025, .052, .25), 'iron', .004), rig, 'hull')
    for y in (-.9, -.6, -.3, 0, .3, .6, .9): bind(ctx.box('deck plank join', (0, y, .278), (width * 1.7, .013, .012), 'timber', .001), rig, 'hull')
    bind(ctx.beam('stepped main mast', (0, .05, .28), (0, .05, 1.94), .043, 'timber', 8), rig, 'mast')
    bind(ctx.beam('upper yard', (-.64, .05, 1.76), (.64, .05, 1.76), .026, 'timber', 8), rig, 'sail.upper')
    # Two bent quadrilateral sail panels with separate bones retain a visible
    # belly. Their independent motion is not a translated whole ship sprite.
    for bone, bottom, top, breadth in [('sail.lower', .76, 1.28, .54), ('sail.upper', 1.28, 1.75, .61)]:
        verts = [(-breadth, .05, top), (0, -.07, top), (breadth, .05, top), (-breadth * .83, -.04, bottom), (0, -.16, bottom), (breadth * .83, -.04, bottom)]
        bind(ctx.mesh('stitched canvas panel ' + bone, verts, [(0, 1, 4, 3), (1, 2, 5, 4)], 'canvas'), rig, bone)
        bind(ctx.beam('broad vertical sail seam', (0, -.075, top), (0, -.165, bottom), .009, 'canvasShade', 4), rig, bone)
    for side in (-1, 1): bind(ctx.beam('standing rigging stay', (0, .05, 1.82), (side * width, .55, .32), .009, 'rope', 4), rig, 'mast')
    if ROLE == 'transport':
        bind(ctx.box('covered cargo cabin', (0, .50, .53), (.57, .64, .47), 'planks', .03), rig, 'hull')
        bind(ctx.box('canvas cargo roof', (0, .50, .79), (.65, .73, .08), 'canvasShade', .025), rig, 'hull')
        for y in (-.37, -.12): bind(ctx.box('strapped cargo crate', (0, y, .43), (.35, .20, .28), 'planks', .02), rig, 'hull')
    else:
        bind(ctx.beam('bronze reinforced prow ram', (0, -length / 2 + .15, .04), (0, -length / 2 - .24, .06), .09, 'iron', 8), rig, 'hull')
        if ROLE == 'ocean_warship':
            bind(ctx.box('raised stern fighting deck', (0, .67, .51), (.71, .57, .45), 'planks', .025), rig, 'hull')
            for side in (-1, 1):
                for y in (-.6, -.2, .2, .6): bind(ctx.box('iron hull armor overlap', (side * .43, y, .13), (.05, .34, .31), 'iron', .014), rig, 'hull')
            bind(ctx.box('stern red command cloth', (0, .98, .60), (.46, .025, .22), 'redcloth', .006), rig, 'hull')
    for name, (start, end) in rest.items():
        if name.startswith('oar.'):
            if ROLE != 'coastal_warship' and int(name.split('.')[1]) % 2: continue
            bind(ctx.beam('working rowing shaft ' + name, start, end, .023, 'timber', 8), rig, name)
            bind(ctx.box('wide carved oar blade ' + name, end, (.24, .105, .035), 'planklight', .006), rig, name)
    bind(ctx.box('deck torsion weapon bed', (0, -.83, .47), (.21, .37, .12), 'timber', .015), rig, 'weapon')
    for side in ('L', 'R'):
        bind(ctx.beam('flexing ballista arm ' + side, *rest['weapon.' + side], .028, 'iron', 8), rig, 'weapon.' + side)
    bind(ctx.beam('loaded deck bolt', (0, -.7, .55), (0, -1.16, .55), .015, 'planklight', 6), rig, 'weapon')
    # Transparent holdout represents the sea surface: hull geometry really
    # descends beneath it in sink frames, while cloth and spars collapse above.
    hold = bpy.data.materials.new('sea surface alpha holdout'); hold.use_nodes = True
    hold.node_tree.nodes.clear(); shader = hold.node_tree.nodes.new('ShaderNodeHoldout'); out = hold.node_tree.nodes.new('ShaderNodeOutputMaterial'); hold.node_tree.links.new(shader.outputs[0], out.inputs['Surface'])
    ctx.materials['water-mask'] = hold
    bind(ctx.mesh('fixed waterline occlusion', [(-5, -5, -.055), (5, -5, -.055), (5, 5, -.055), (-5, 5, -.055)], [(0, 1, 2, 3)], 'water-mask'), rig, 'root')
    return rig, {'description': f'Original {ROLE}: independently constructed planked hull, deck equipment, articulated sail panels, rowing oars and flexing ballista; sink descends beneath actual alpha waterline.', 'boneCount': len(data.bones), 'weights': 'All geometry weighted to actual named armature bones, including fixed alpha waterline.'}


def action(rig, state, frames, duration):
    rig.animation_data_create(); clip = bpy.data.actions.new(ROLE + '.' + state); rig.animation_data.action = clip
    for index in range(frames + int(state in ('idle', 'sail'))):
        for name, (start, end) in points(state, index % frames, frames).items():
            rest = rig.data.bones[name]; rotation = (rest.tail_local - rest.head_local).rotation_difference(end - start)
            matrix = (rotation.to_matrix() @ rest.matrix_local.to_3x3()).to_4x4(); matrix.translation = start
            rig.pose.bones[name].matrix = matrix; bpy.context.view_layer.update()
        for bone in rig.pose.bones:
            for path in ('location', 'rotation_quaternion', 'scale'): bone.keyframe_insert(data_path=path, frame=1 + index * (duration // 100), group=bone.name)
    clip.use_fake_user = True
    return clip
