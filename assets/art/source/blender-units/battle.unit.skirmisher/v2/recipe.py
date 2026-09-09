"""Shared original human anatomy, separately authored equipment and role poses.

The guard pilot establishes scale and materials. These are explicit shared-rig
mechanical role variants, not independent culture illustrations or recolors.
"""
import bpy
from mathutils import Vector
import guard_base as base
from battle_authoring import material

ROLE = 'guard'
v, bind = Vector, base.bind


def remove(prefixes):
    for obj in list(bpy.context.scene.objects):
        if obj.type == 'MESH' and any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def extra_bones(rig):
    bpy.context.view_layer.objects.active = rig; rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for side in ('L', 'R'):
        parent = rig.data.edit_bones['hand.' + side]
        bone = rig.data.edit_bones.new('weapon.' + side)
        bone.head, bone.tail, bone.parent = parent.head, parent.tail, parent
    bpy.ops.object.mode_set(mode='OBJECT'); rig.select_set(False)
    for bone in rig.pose.bones: bone.rotation_mode = 'QUATERNION'


def build(ctx):
    global ROLE
    ROLE = ctx.profile['role']; base.ROLE = ROLE
    rig, description = base.build(ctx); extra_bones(rig)
    rest = base.points('idle', 0, 4)
    left, right = rest['hand.L'][0], rest['hand.R'][0]
    for name, color in [('greencloth', '#778564'), ('sandcloth', '#c1b597'), ('redcloth', '#915647'), ('darkwood', '#604733'), ('ivory', '#d2ddcf')]:
        material(ctx, name, color)
    remove(['sword ', 'shield ', 'repaired shield'])
    light = ROLE in ('colonist', 'scout', 'skirmisher')
    if light:
        remove(['overlapping breastplate', 'breastplate center', 'right replaced', 'broad brass', 'segmented shoulder', 'iron shin', 'rounded knee', 'steel vambrace', 'elbow plate', 'kettle ', 'forged kettle', 'nasal helmet'])
        base.taper(ctx, 'stitched traveling tunic', (0, -.035, 1.225), .22, .45, .135, 'greencloth' if ROLE == 'scout' else 'sandcloth', rig, 'pelvis')
        for side in ('L', 'R'):
            knee, ankle = rest['shin.' + side]
            bind(ctx.beam('wrapped lower leg ' + side, knee, ankle, .06, 'clothshade', 8), rig, 'shin.' + side)
        if ROLE == 'scout':
            bind(ctx.sphere('deep traveling hood', (0, .035, 1.718), (.14, .135, .15), 'greencloth', False), rig, 'head')
            bind(ctx.box('hood open face', (0, -.105, 1.68), (.13, .035, .15), 'skin', .02), rig, 'head')
        else:
            bind(ctx.sphere('weathered wool cap', (0, .0, 1.74), (.13, .13, .085), 'clothshade', False), rig, 'head')
    if ROLE == 'colonist':
        bind(ctx.box('canvas pack', (0, .19, 1.24), (.36, .24, .42), 'sandcloth', .035), rig, 'pelvis')
        bind(ctx.cylinder('rolled bed blanket', (0, .24, 1.51), .12, .42, 'greencloth', 10, 'X'), rig, 'pelvis')
        for x in (-.13, .13): bind(ctx.box('pack leather securing strap', (x, .318, 1.25), (.035, .035, .39), 'leather', .006), rig, 'pelvis')
        bind(ctx.beam('defensive walking staff', right + v((0, 0, -.78)), right + v((0, 0, .53)), .033, 'darkwood', 8), rig, 'weapon.R')
        bind(ctx.box('waist provisions bag', (-.20, .025, .88), (.17, .15, .20), 'leatherlight', .025), rig, 'pelvis')
    elif ROLE in ('spearman', 'halberdier'):
        bind(ctx.beam('long ash pole shaft', right + v((0, 0, -.95)), right + v((0, 0, .64)), .029, 'wood', 8), rig, 'weapon.R')
        tip = right + v((0, 0, .64))
        verts = [tip + v((-.055, 0, 0)), tip + v((.055, 0, 0)), tip + v((0, 0, .25)), tip + v((0, -.023, .05))]
        bind(ctx.mesh('forged leaf spear tip', verts, [(0, 1, 2), (0, 2, 3), (1, 3, 2)], 'ironlight'), rig, 'weapon.R')
        if ROLE == 'halberdier':
            verts = [tip + v((x, -.015, z)) for x, z in [(-.03, .02), (-.23, -.02), (-.25, -.28), (-.04, -.20), (.12, -.11), (.05, -.03)]]
            bind(ctx.mesh('broad hooked halberd blade', verts, [(0, 1, 2, 3, 4, 5)], 'iron'), rig, 'weapon.R')
            bind(ctx.sphere('heavy bevor', (0, -.075, 1.53), (.14, .12, .105), 'ironshade', False), rig, 'head')
            for side in (-1, 1):
                bind(ctx.box('lamellar shoulder overlap', (side * .22, -.035, 1.365), (.22, .26, .06), 'ironlight', .02), rig, 'upper_arm.' + ('L' if side < 0 else 'R'))
    elif ROLE == 'heavy_infantry':
        bind(ctx.box('closed visor', (0, -.132, 1.656), (.20, .046, .15), 'iron', .015), rig, 'head')
        bind(ctx.box('visor eye slit', (0, -.16, 1.688), (.14, .016, .018), 'shadow', .001), rig, 'head')
        for side in (-1, 1):
            bind(ctx.sphere('heavy overlapping pauldron', (side * .22, -.03, 1.36), (.17, .17, .14), 'ironshade', False), rig, 'upper_arm.' + ('L' if side < 0 else 'R'))
        bind(ctx.box('large iron tower shield', left + v((0, -.12, -.10)), (.49, .045, .80), 'ironshade', .035), rig, 'weapon.L')
        bind(ctx.box('tower shield central rib', left + v((0, -.16, -.10)), (.042, .025, .74), 'ironlight', .005), rig, 'weapon.L')
        for z in (-.25, .12): bind(ctx.box('shield raised binding', left + v((0, -.163, z)), (.44, .023, .038), 'brass', .005), rig, 'weapon.L')
        bind(ctx.beam('war hammer haft', right + v((0, 0, -.14)), right + v((0, 0, .52)), .034, 'leather', 8), rig, 'weapon.R')
        bind(ctx.box('forged hammer head', right + v((0, 0, .51)), (.31, .12, .14), 'iron', .022), rig, 'weapon.R')
    elif ROLE == 'scout':
        # Bow and string are individually authored structural meshes. The draw
        # hand and the bow hand animate separately; the event supplies flight.
        bow = [(-.36, -.045), (-.20, -.15), (0, -.19), (.20, -.15), (.36, -.045)]
        for index in range(4):
            a, b = bow[index], bow[index + 1]
            bind(ctx.beam('recurved bow limb', left + v((0, a[1], a[0])), left + v((0, b[1], b[0])), .023, 'wood', 8), rig, 'weapon.L')
        bind(ctx.beam('bow string', left + v((0, -.045, -.36)), left + v((0, -.045, .36)), .008, 'ivory', 4), rig, 'weapon.L')
        bind(ctx.cylinder('back arrow quiver', (.18, .20, 1.28), .077, .52, 'leather', 8), rig, 'pelvis')
        for x in (.14, .20): bind(ctx.beam('quiver arrow shaft', (x, .20, 1.40), (x, .20, 1.72), .012, 'wood', 6), rig, 'pelvis')
    elif ROLE == 'arbalester':
        bind(ctx.beam('crossbow stock', left + v((0, .12, 0)), left + v((0, -.36, 0)), .055, 'darkwood', 8), rig, 'weapon.L')
        bind(ctx.beam('steel crossbow prod', left + v((-.30, -.22, 0)), left + v((.30, -.22, 0)), .026, 'ironshade', 8), rig, 'weapon.L')
        for side in (-1, 1): bind(ctx.beam('crossbow string', left + v((side * .30, -.22, 0)), left + v((0, .03, 0)), .009, 'ivory', 4), rig, 'weapon.L')
        bind(ctx.box('crossbow winding drum', left + v((0, .03, .06)), (.12, .10, .10), 'brass', .01), rig, 'weapon.L')
        bind(ctx.box('bolt case', (.22, .06, .89), (.12, .18, .25), 'leatherlight', .015), rig, 'pelvis')
        bind(ctx.box('short witness mantle', (0, .15, 1.30), (.36, .04, .34), 'redcloth', .015), rig, 'pelvis')
    elif ROLE == 'skirmisher':
        bind(ctx.beam('throwing javelin', right + v((0, 0, -.45)), right + v((0, 0, .68)), .022, 'wood', 8), rig, 'weapon.R')
        bind(ctx.beam('javelin iron tip', right + v((0, 0, .68)), right + v((0, 0, .83)), .030, 'ironlight', 6), rig, 'weapon.R')
        bind(ctx.cylinder('small reed buckler', left + v((0, -.12, 0)), .20, .035, 'wood', 10, 'Y'), rig, 'weapon.L')
        bind(ctx.sphere('buckler iron boss', left + v((0, -.15, 0)), (.07, .025, .07), 'iron', False), rig, 'weapon.L')
        for x in (.12, .19): bind(ctx.beam('spare strapped javelin', (x, .19, .80), (x, .19, 1.83), .023, 'darkwood', 8), rig, 'pelvis')
    description.update({'description': f'Original {ROLE} equipment meshes and authored role poses on the reviewed shared adult guard skeleton; no culture repaint claim.', 'boneCount': len(rig.data.bones)})
    return rig, description


def action(rig, state, frames, duration):
    rig.animation_data_create(); clip = bpy.data.actions.new(ROLE + '.' + state); rig.animation_data.action = clip
    for index in range(frames + int(state in ('idle', 'walk'))):
        pose_index = index % frames; base.pose(rig, state, pose_index, frames)
        rig.pose.bones['weapon.R'].scale = (0, 0, 0) if ROLE == 'skirmisher' and state == 'attack' and pose_index in (4, 5) else (1, 1, 1)
        for bone in rig.pose.bones:
            for path in ('location', 'rotation_quaternion', 'scale'):
                bone.keyframe_insert(data_path=path, frame=1 + index * (duration // 100), group=bone.name)
    clip['native_state'], clip['frame_count'], clip['duration_ms'], clip['loop'] = state, frames, duration, state in ('idle', 'walk')
    clip.use_fake_user = True
    return clip
