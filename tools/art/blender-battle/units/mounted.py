"""Original articulated horse and rider; shared adult anatomy, distinct mounts/kit."""
import math
import bpy
from mathutils import Vector
import guard_base as base
from battle_authoring import material

v, bind = Vector, base.bind
ROLE = 'cavalry'


def horse_points(state, index, count):
    phase = index / count * math.tau
    fall = index / (count - 1) if state == 'death' else 0
    walk = state == 'walk'
    bob = .025 * math.sin(phase * 2) if walk else .012 * math.sin(phase)
    center = v((.14 * fall, 0, 1.00 + bob - .66 * fall))
    head = center + v((0, -.84, .48 - .18 * fall + .035 * math.sin(phase)))
    result = {'horse.body': (center, center + v((.20 * fall, -.40, -.16 * fall))),
              'horse.neck': (center + v((0, -.46, .15)), head),
              'horse.head': (head, head + v((0, -.28, -.10))),
              'horse.tail': (center + v((0, .65, .04)), center + v((.13 * math.sin(phase), .93, -.28)))}
    for front in (False, True):
        for side in (-1, 1):
            label = ('front' if front else 'back') + ('.L' if side < 0 else '.R')
            cycle = phase + (math.pi if (side < 0) == front else 0)
            stride = .24 * math.sin(cycle) if walk else 0
            lift = .18 * max(0, math.cos(cycle)) if walk else 0
            y = -.43 if front else .48
            hip = center + v((side * .22, y, -.06))
            ankle = v((side * (.24 + .25 * fall), y + stride + .08 * fall, .12 + lift))
            knee = base.elbow(hip, ankle, .45, .45, (side * .2, -.8 if front else .8, 0))
            result['horse.upper.' + label] = (hip, knee)
            result['horse.lower.' + label] = (knee, ankle)
            result['horse.hoof.' + label] = (ankle, ankle + v((0, -.13, -.05)))
    return result


def build(ctx):
    global ROLE
    ROLE = ctx.profile['role']; base.ROLE = 'guard'
    rig, info = base.build(ctx)
    remove = ['shield ', 'repaired shield', 'sword ']
    for obj in list(bpy.context.scene.objects):
        if obj.type == 'MESH' and any(obj.name.startswith(name) for name in remove): bpy.data.objects.remove(obj, do_unlink=True)
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH': obj.location.z += .70
    bpy.context.view_layer.objects.active = rig; rig.select_set(True); bpy.ops.object.mode_set(mode='EDIT')
    for bone in rig.data.edit_bones:
        bone.head.z += .70; bone.tail.z += .70
    rest = horse_points('idle', 0, 4)
    for name, (head, tail) in rest.items():
        bone = rig.data.edit_bones.new(name); bone.head, bone.tail = head, tail
        parent = 'root' if name == 'horse.body' else 'horse.body'
        if '.lower.' in name: parent = name.replace('.lower.', '.upper.')
        if '.hoof.' in name: parent = name.replace('.hoof.', '.lower.')
        if name == 'horse.head': parent = 'horse.neck'
        bone.parent = rig.data.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT'); rig.select_set(False)
    for bone in rig.pose.bones: bone.rotation_mode = 'QUATERNION'
    for name, color in [('horsecoat', '#806042' if ROLE == 'cavalry' else '#88765a'), ('horsehighlight', '#b7a07a'), ('mane', '#302b2c'), ('saddlecloth', '#915647'), ('rope', '#c1b597')]: material(ctx, name, color)
    bind(ctx.sphere('horse ribcage', (0, .05, 1.04), (.33, .69, .35), 'horsecoat', False), rig, 'horse.body')
    bind(ctx.sphere('horse haunch', (0, .47, 1.04), (.36, .30, .37), 'horsecoat', False), rig, 'horse.body')
    bind(ctx.beam('muscular rising neck', rest['horse.neck'][0], rest['horse.neck'][1], .20, 'horsecoat', 8), rig, 'horse.neck')
    bind(ctx.sphere('long horse head', (0, -.98, 1.43), (.15, .30, .18), 'horsecoat', False), rig, 'horse.head')
    bind(ctx.sphere('lighter muzzle', (0, -1.17, 1.32), (.135, .13, .11), 'horsehighlight', False), rig, 'horse.head')
    for side in (-1, 1):
        bind(ctx.sphere('horse alert ear', (side * .075, -.81, 1.67), (.038, .055, .13), 'horsecoat', False), rig, 'horse.head')
        bind(ctx.sphere('horse dark eye', (side * .137, -.95, 1.48), (.012, .025, .022), 'shadow', False), rig, 'horse.head')
    bind(ctx.beam('dark mane crest', (0, -.39, 1.36), (0, -.79, 1.66), .075, 'mane', 8), rig, 'horse.neck')
    bind(ctx.beam('flowing horse tail', *rest['horse.tail'], .082, 'mane', 8), rig, 'horse.tail')
    for name, (a, b) in rest.items():
        if '.upper.' in name: bind(ctx.beam('horse leg muscle ' + name, a, b, .080, 'horsecoat', 8), rig, name)
        if '.lower.' in name: bind(ctx.beam('horse lower leg ' + name, a, b, .048, 'horsehighlight', 8), rig, name)
        if '.hoof.' in name: bind(ctx.box('dark planted hoof ' + name, (a + b) / 2, (.13, .20, .12), 'mane', .015), rig, name)
    bind(ctx.box('hanging saddle blanket', (0, .02, 1.23), (.75, .58, .055), 'saddlecloth', .025), rig, 'horse.body')
    bind(ctx.box('saddle leather seat', (0, .05, 1.40), (.38, .43, .13), 'leather', .022), rig, 'horse.body')
    for side in (-1, 1):
        bind(ctx.box('saddle travel pannier', (side * .36, .42, 1.1), (.20, .29, .28), 'leatherlight', .03), rig, 'horse.body')
        bind(ctx.beam('bridle cheek strap', (side * .15, -1.07, 1.36), (side * .14, -.79, 1.60), .019, 'leather', 6), rig, 'horse.head')
        bind(ctx.beam('held leather rein', (side * .14, -1.03, 1.38), (side * .16, -.15, 1.81), .010, 'leather', 6), rig, 'horse.body')
    right = base.points('idle', 0, 4)['hand.R'][0] + v((0, 0, .70))
    if ROLE == 'lancer':
        bind(ctx.beam('road lance shaft', right + v((0, 0, -.78)), right + v((0, 0, .88)), .029, 'wood', 8), rig, 'hand.R')
        bind(ctx.beam('steel lance point', right + v((0, 0, .88)), right + v((0, 0, 1.12)), .04, 'ironlight', 6), rig, 'hand.R')
        bind(ctx.mesh('small lance pennon', [right + v((x, .005, z)) for x, z in [(0, .83), (.29, .79), (.16, .60), (0, .62)]], [(0, 1, 2, 3)], 'saddlecloth'), rig, 'hand.R')
        for y in (-.34, -.12, .1, .32): bind(ctx.box('overlapping horse barding plate', (0, y, 1.31), (.64, .18, .055), 'ironshade', .012), rig, 'horse.body')
        bind(ctx.sphere('horse forged chamfron', (0, -1.01, 1.52), (.12, .20, .047), 'iron', False), rig, 'horse.head')
    else:
        verts = [right + v((x, 0, z)) for x, z in [(-.025, .08), (.03, .08), (.055, .47), (.13, .68), (.07, .64), (-.02, .43)]]
        bind(ctx.mesh('curved outrider saber', verts, [(0, 1, 2, 3, 4, 5)], 'ironlight'), rig, 'hand.R')
        bind(ctx.box('saber brass guard', right + v((0, 0, .06)), (.18, .045, .04), 'brass', .006), rig, 'hand.R')
    info.update({'description': f'Original articulated {ROLE} horse, tack and weapon; reviewed shared adult rider anatomy. Horse limbs, neck, tail and rider weapon independently keyed.', 'boneCount': len(rig.data.bones)})
    return rig, info


def pose(rig, state, index, count):
    fall = index / (count - 1) if state == 'death' else 0
    person = base.points(state if state != 'walk' else 'idle', index if state != 'walk' else index % 4, count if state != 'walk' else 4)
    shift = v((.35 * fall, 0, .70 * (1 - fall)))
    for name, (a, b) in person.items(): person[name] = a + shift, b + shift
    if not fall:
        for side, label in [(-1, 'L'), (1, 'R')]:
            hip = person['thigh.' + label][0]; ankle = v((side * .36, .08, .89))
            knee = base.elbow(hip, ankle, .41, .41, (side, -.1, 0))
            person['thigh.' + label], person['shin.' + label] = (hip, knee), (knee, ankle)
            person['foot.' + label] = (ankle, ankle + v((0, -.17, -.035)))
    for name, (start, end) in {**person, **horse_points(state, index, count)}.items():
        rest = rig.data.bones[name]
        rotation = (rest.tail_local - rest.head_local).rotation_difference(end - start)
        matrix = (rotation.to_matrix() @ rest.matrix_local.to_3x3()).to_4x4(); matrix.translation = start
        rig.pose.bones[name].matrix = matrix; bpy.context.view_layer.update()


def action(rig, state, frames, duration):
    rig.animation_data_create(); clip = bpy.data.actions.new(ROLE + '.' + state); rig.animation_data.action = clip
    for index in range(frames + int(state in ('idle', 'walk'))):
        pose(rig, state, index % frames, frames)
        for bone in rig.pose.bones:
            for path in ('location', 'rotation_quaternion', 'scale'): bone.keyframe_insert(data_path=path, frame=1 + index * (duration // 100), group=bone.name)
    clip.use_fake_user = True
    return clip
