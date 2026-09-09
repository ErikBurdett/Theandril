"""Original repaired Oath guard, real weighted armature and authored poses.

Rigid armor pieces carry full weights on named bones; cloth panels follow the
pelvis/thighs. This is a deliberately economical pixel-render rig, not mocap or
cloth simulation. All source geometry, materials, bones and Actions stay editable.
"""
import math
import bpy
from mathutils import Matrix, Vector
from battle_authoring import material


def v(value):
    return Vector(value)


def midpoint(a, b):
    return (v(a) + v(b)) / 2


def elbow(start, end, length_a, length_b, bend):
    """Two fixed-length links; bend is projected into their joint plane."""
    start, end = v(start), v(end)
    delta = end - start
    distance = max(.001, min(delta.length, length_a + length_b - .001))
    axis = delta.normalized()
    along = (length_a ** 2 - length_b ** 2 + distance ** 2) / (2 * distance)
    normal = v(bend) - axis * v(bend).dot(axis)
    if normal.length < .001:
        normal = axis.cross(v((1, 0, 0)))
    normal.normalize()
    return start + axis * along + normal * math.sqrt(max(0, length_a ** 2 - along ** 2))


def points(state, index, count):
    phase = index / count * math.tau
    walk = state == 'walk'
    idle = math.sin(phase) if state == 'idle' else 0
    hit = [0, 1, .6, .12][index] if state == 'hit' else 0
    fall = (index / (count - 1)) if state == 'death' else 0
    attack = [0, .2, .75, 1, .85, .5, .15, 0][index] if state == 'attack' else 0
    lean = .025 * idle + hit * .22 + fall * 1.25
    pelvis = v((0, -.035 * attack + .04 * hit, .94 - .025 * math.cos(phase * 2) * walk - .64 * fall))
    chest = pelvis + v((0, math.sin(lean) * .39, math.cos(lean) * .39))
    neck = chest + v((0, math.sin(lean) * .16, math.cos(lean) * .16))
    head = neck + v((.015 * math.cos(phase) if state == 'idle' else 0, math.sin(lean) * .21, math.cos(lean) * .21))
    result = {'root': (v((0, 0, 0)), v((0, 0, .15))), 'pelvis': (pelvis, chest),
              'chest': (chest, neck), 'head': (neck, head)}
    for side, label in [(-1, 'L'), (1, 'R')]:
        stride = math.sin(phase + (math.pi if side < 0 else 0)) if walk else 0
        lift = max(0, math.cos(phase + (math.pi if side < 0 else 0))) * .15 if walk else 0
        hip = pelvis + v((side * .105, 0, -.035))
        ankle = v((side * (.105 + fall * .10), .25 * stride - (.08 * attack if side > 0 else 0) + .12 * fall, .115 + lift))
        knee = elbow(hip, ankle, .41, .41, (0, -1, .05))
        toe = ankle + v((0, -.17, -.035 - .04 * lift))
        result['thigh.' + label] = (hip, knee)
        result['shin.' + label] = (knee, ankle)
        result['foot.' + label] = (ankle, toe)
        shoulder = chest + v((side * .21, -.005, .025))
        if side < 0:
            wrist = chest + v((-.35, -.20 + .06 * attack, -.20 - .05 * hit))
            wrist += v((.015 * math.cos(phase) if state == 'idle' else 0, -.11 * stride, .025 * idle))
            hand_direction = v((-.05, -.12, .01))
        else:
            wrist = chest + v((.34, -.13 + .10 * stride, -.25 + .022 * idle))
            hand_direction = v((.025, -.01, .12))
            if state == 'attack':
                positions = [(.34, -.13, -.25), (.40, .08, -.05), (.32, .12, .26), (.28, -.32, .16), (.06, -.42, -.16), (.15, -.31, -.28), (.32, -.18, -.28), (.34, -.13, -.25)]
                directions = [(0, 0, 1), (.15, .15, 1), (.1, .65, 1), (.1, -.7, .9), (-.3, -.7, -.55), (-.2, -.2, -.8), (0, -.25, .5), (0, 0, 1)]
                wrist = chest + v(positions[index])
                hand_direction = v(directions[index]).normalized() * .12
        if fall:
            wrist = wrist.lerp(v((side * .43, .34 + side * .13, .15)), fall)
            hand_direction = hand_direction.lerp(v((side * .11, .045, .01)), fall)
        arm_joint = elbow(shoulder, wrist, .285, .275, (side, .1, -.2))
        result['upper_arm.' + label] = (shoulder, arm_joint)
        result['forearm.' + label] = (arm_joint, wrist)
        result['hand.' + label] = (wrist, wrist + hand_direction)
    return result


def bind(obj, rig, bone):
    group = obj.vertex_groups.new(name=bone)
    group.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')
    modifier = obj.modifiers.new('Authored bone deformation', 'ARMATURE')
    modifier.object = rig
    obj['weighted_bone'] = bone
    return obj


def taper(ctx, name, center, low, high, depth, color, rig, bone):
    x, y, z = center
    vertices = [(x + sx * width, y + sy * depth, z + level) for level, width in [(-high / 2, low), (high / 2, low * .83)] for sx, sy in [(-1, -1), (1, -1), (1, 1), (-1, 1)]]
    obj = ctx.mesh(name, vertices, [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)], color)
    return bind(obj, rig, bone)


def build(ctx):
    colors = [('iron', '#a1afb1'), ('ironlight', '#d2ddcf'), ('ironshade', '#657680'),
              ('mail', '#45414b'), ('cloth', '#b7a07a'), ('clothshade', '#88765a'),
              ('leather', '#553e2c'), ('leatherlight', '#806042'), ('wood', '#8e7550'),
              ('brass', '#977544'), ('skin', '#d4a478'), ('shadow', '#28272d')]
    for name, color in colors:
        material(ctx, name, color, rough=.82 if name not in ('iron', 'ironlight') else .58)
    rest = points('idle', 0, 4)
    bones = bpy.data.armatures.new('Oathguard articulated skeleton')
    rig = bpy.data.objects.new('Oathguard rig', bones)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    parents = {'pelvis': 'root', 'chest': 'pelvis', 'head': 'chest'}
    for side in ('L', 'R'):
        parents.update({'thigh.' + side: 'pelvis', 'shin.' + side: 'thigh.' + side, 'foot.' + side: 'shin.' + side,
                        'upper_arm.' + side: 'chest', 'forearm.' + side: 'upper_arm.' + side, 'hand.' + side: 'forearm.' + side})
    for name, (head, tail) in rest.items():
        bone = bones.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        if name in parents:
            bone.parent = bones.edit_bones[parents[name]]
    bpy.ops.object.mode_set(mode='OBJECT')
    rig.select_set(False)
    for bone in rig.pose.bones:
        bone.rotation_mode = 'QUATERNION'
    # Repaired equipment has large readable planes and joins, not random wear.
    pelvis, chest, neck = rest['pelvis'][0], rest['chest'][0], rest['head'][0]
    taper(ctx, 'padded waist coat', pelvis + v((0, -.015, -.04)), .16, .27, .105, 'clothshade', rig, 'pelvis')
    taper(ctx, 'overlapping breastplate', midpoint(pelvis, neck) + v((0, -.035, .035)), .205, .46, .13, 'iron', rig, 'pelvis')
    bind(ctx.box('breastplate center ridge', (0, -.177, 1.235), (.024, .04, .30), 'ironlight', .007), rig, 'pelvis')
    bind(ctx.box('left leather shoulder binding', (-.135, -.164, 1.31), (.037, .03, .25), 'leather', .005, (0, .13, -.18)), rig, 'pelvis')
    bind(ctx.box('right replaced iron patch', (.10, -.173, 1.25), (.11, .025, .105), 'ironshade', .008), rig, 'pelvis')
    for x, z in [(.065, 1.215), (.14, 1.285), (-.13, 1.35)]:
        bind(ctx.sphere('broad brass repair fastener', (x, -.19, z), (.018, .015, .018), 'brass', False), rig, 'pelvis')
    bind(ctx.box('thick working belt', (0, -.015, .98), (.355, .285, .055), 'leather', .008), rig, 'pelvis')
    bind(ctx.box('square brass belt buckle', (0, -.171, .98), (.067, .025, .056), 'brass', .005), rig, 'pelvis')
    for side, label in [(-1, 'L'), (1, 'R')]:
        thigh, knee = rest['thigh.' + label]
        ankle, toe = rest['foot.' + label]
        shoulder, joint = rest['upper_arm.' + label]
        wrist = rest['hand.' + label][0]
        bind(ctx.beam('quilted thigh ' + label, thigh, knee, .079, 'clothshade', 8), rig, 'thigh.' + label)
        bind(ctx.beam('iron shin guard ' + label, knee, ankle, .063, 'ironshade', 8), rig, 'shin.' + label)
        bind(ctx.sphere('rounded knee cop ' + label, knee + v((0, -.045, 0)), (.080, .08, .09), 'iron', False), rig, 'shin.' + label)
        bind(ctx.box('leather boot ' + label, midpoint(ankle, toe) + v((0, 0, -.035)), (.15, .25, .135), 'leatherlight', .022), rig, 'foot.' + label)
        bind(ctx.box('boot sole ' + label, midpoint(ankle, toe) + v((0, 0, -.083)), (.16, .26, .037), 'leather', .005), rig, 'foot.' + label)
        taper(ctx, 'split linen coat tail ' + label, (side * .105, -.135, .795), .086, .30, .018, 'cloth', rig, 'thigh.' + label)
        bind(ctx.beam('mail upper sleeve ' + label, shoulder, joint, .079, 'mail', 8), rig, 'upper_arm.' + label)
        bind(ctx.sphere('segmented shoulder plate ' + label, shoulder, (.125, .13, .11), 'iron', False), rig, 'upper_arm.' + label)
        bind(ctx.beam('steel vambrace ' + label, joint, wrist, .070, 'ironshade', 8), rig, 'forearm.' + label)
        bind(ctx.sphere('elbow plate ' + label, joint, (.083, .072, .074), 'iron', False), rig, 'forearm.' + label)
        bind(ctx.sphere('leather gauntlet ' + label, wrist, (.065, .065, .072), 'leatherlight', False), rig, 'hand.' + label)
    bind(ctx.cylinder('mail collar', (0, -.005, 1.51), .116, .145, 'mail', vertices=10), rig, 'head')
    bind(ctx.sphere('adult face', (0, -.018, 1.645), (.105, .103, .136), 'skin', False), rig, 'head')
    bind(ctx.sphere('forged kettle helmet', (0, .008, 1.755), (.137, .136, .095), 'iron', False), rig, 'head')
    bind(ctx.cylinder('kettle brim', (0, -.009, 1.712), .16, .031, 'ironlight', vertices=12), rig, 'head')
    bind(ctx.box('selective eye shadow', (0, -.12, 1.658), (.13, .016, .020), 'shadow', .003), rig, 'head')
    bind(ctx.box('nasal helmet guard', (0, -.137, 1.653), (.026, .024, .095), 'ironshade', .004), rig, 'head')
    # Thick shield boards, metal rim and a raised square reinforcement identify
    # the guard role without inventing a culture-specific painted crest.
    grip = rest['hand.L'][0]
    outline = [(-.22, .27), (.22, .27), (.245, -.04), (0, -.36), (-.245, -.04)]
    for depth, scale, color, name in [(-.105, 1, 'brass', 'shield perimeter'), (-.123, .89, 'wood', 'repaired shield boards')]:
        verts = [(grip.x + x * scale, grip.y + depth, grip.z + z * scale) for x, z in outline]
        bind(ctx.mesh(name, verts, [tuple(range(5))], color), rig, 'hand.L')
    bind(ctx.box('shield steel spine', grip + v((0, -.139, -.015)), (.044, .028, .50), 'ironshade', .005), rig, 'hand.L')
    bind(ctx.box('shield cross reinforcement', grip + v((0, -.142, .02)), (.33, .027, .036), 'ironshade', .005), rig, 'hand.L')
    for x in [-.10, .10]:
        bind(ctx.box('shield board seam', grip + v((x, -.128, .04)), (.012, .015, .35), 'leather', .002), rig, 'hand.L')
    hand = rest['hand.R'][0]
    bind(ctx.cylinder('sword leather grip', hand + v((0, 0, -.04)), .035, .18, 'leather', vertices=8), rig, 'hand.R')
    bind(ctx.box('sword straight crossguard', hand + v((0, 0, .07)), (.235, .052, .036), 'brass', .007), rig, 'hand.R')
    for side, color in [(-1, 'iron'), (1, 'ironlight')]:
        verts = [hand + v((0, -.027, .10)), hand + v((side * .042, 0, .10)), hand + v((side * .035, 0, .63)), hand + v((0, 0, .75))]
        bind(ctx.mesh('sword bevel ' + str(side), verts, [(0, 1, 2, 3)], color), rig, 'hand.R')
    bind(ctx.sphere('sword pommel', hand + v((0, 0, -.15)), (.046, .037, .046), 'brass', False), rig, 'hand.R')
    return rig, {'description': 'Original adult Oath guard: repaired plate, quilted legs, kettle helmet, reinforced wood shield and a separately articulated sword. Sixteen weighted bones; no imported character mesh.',
                 'boneCount': len(bones.bones), 'weights': 'Rigid per-piece full vertex weights with real Armature modifiers; no cloth simulation.'}


def pose(rig, state, index, count):
    for name, (start, end) in points(state, index, count).items():
        direction = end - start
        rest = rig.data.bones[name]
        rotation = (rest.tail_local - rest.head_local).rotation_difference(direction)
        matrix = (rotation.to_matrix() @ rest.matrix_local.to_3x3()).to_4x4()
        matrix.translation = start
        rig.pose.bones[name].matrix = matrix
        bpy.context.view_layer.update()


def action(rig, state, frames, duration):
    rig.animation_data_create()
    clip = bpy.data.actions.new('Oathguard.' + state)
    rig.animation_data.action = clip
    step = duration // 100
    for index in range(frames + int(state in ('idle', 'walk'))):
        pose(rig, state, index % frames, frames)
        for bone in rig.pose.bones:
            for path in ('location', 'rotation_quaternion', 'scale'):
                bone.keyframe_insert(data_path=path, frame=1 + index * step, group=bone.name)
    clip['native_state'] = state
    clip['frame_count'] = frames
    clip['duration_ms'] = duration
    clip['loop'] = state in ('idle', 'walk')
    clip.use_fake_user = True
    return clip
