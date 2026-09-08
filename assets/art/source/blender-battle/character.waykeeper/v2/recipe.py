"""Original adult traveler with fixed planted legs and independently keyed arms.

The model is a modest low-poly cast pilot, not a reused faction body or a full
animation set. Copper tablet and caged coal staff identify the practical role.
"""
import math
import bpy
from battle_authoring import material, beam_pose, place


def taper(ctx, name, low, high, lower, upper, color):
    verts = [(x * lower[0], y * lower[1], low) for x, y in [(-1, -1), (1, -1), (1, 1), (-1, 1)]]
    verts += [(x * upper[0], y * upper[1], high) for x, y in [(-1, -1), (1, -1), (1, 1), (-1, 1)]]
    return ctx.mesh(name, verts, [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)], color)


def build(ctx):
    for name, color in [('coat', '#a1afb1'), ('coatshadow', '#657680'), ('trouser', '#67606a'),
                        ('leather', '#806042'), ('linen', '#e1cf9f'), ('skin', '#d4a478'),
                        ('hair', '#544938'), ('copper', '#977544'), ('wood', '#8e7550'), ('coal', '#f2bc60')]:
        material(ctx, name, color, luminous=name == 'coal')
    # An adult narrow chest, long legs, short head and split traveling-coat hem.
    taper(ctx, 'fitted traveling coat torso', .92, 1.48, (.145, .10), (.21, .105), 'coat')
    taper(ctx, 'split coat skirt', .48, 1.03, (.225, .14), (.145, .10), 'coatshadow')
    # Front opening and broad repair panels, rather than all-over texture noise.
    ctx.mesh('front coat opening', [(-.035, -.146, .48), (.045, -.146, .48), (.02, -.112, 1.01), (-.02, -.112, 1.01)], [(0, 1, 2, 3)], 'trouser')
    ctx.mesh('left repaired coat panel', [(-.20, -.147, .57), (-.09, -.147, .56), (-.08, -.126, .90), (-.16, -.126, .91)], [(0, 1, 2, 3)], 'coat')
    ctx.mesh('right linen repair', [(.10, -.142, .65), (.17, -.142, .65), (.15, -.132, .77), (.09, -.132, .77)], [(0, 1, 2, 3)], 'linen')
    for side in (-1, 1):
        x = side * .105
        ctx.beam(f'planted trouser {side}', (x, 0, .20), (x, 0, .86), .071, 'trouser')
        ctx.box(f'fixed boot {side}', (x, -.065, .085), (.15, .27, .17), 'leather', .02)
    ctx.cylinder('high linen collar', (0, 0, 1.50), .115, .13, 'linen', vertices=10)
    head = ctx.sphere('adult head', (0, -.018, 1.70), (.105, .105, .155), 'skin', smooth=False)
    hair = ctx.sphere('close swept hair', (0, .015, 1.78), (.108, .098, .095), 'hair', smooth=False)
    nose = ctx.sphere('nose', (0, -.124, 1.70), (.034, .043, .035), 'skin', smooth=False)
    brow = ctx.mesh('quiet brow line', [(-.075, -.12, 1.738), (.075, -.12, 1.738), (.068, -.125, 1.722), (-.068, -.125, 1.722)], [(0, 1, 2, 3)], 'hair')
    for part in (hair, nose, brow):
        ctx.parent(part, head, keep_world=True)
    ctx.box('leather belt', (0, -.012, 1.015), (.30, .235, .06), 'leather', .005)
    ctx.box('copper square buckle', (0, -.138, 1.016), (.065, .024, .056), 'copper', .003)
    for side in (-1, 1):
        ctx.sphere(f'shoulder cap {side}', (side * .205, 0, 1.44), (.083, .105, .10), 'coat', smooth=False)
    arms = {}
    for side in ('left', 'right'):
        arms[side] = [ctx.cylinder(side + ' keyed upper sleeve', (0, 0, 0), 1, 1, 'coat', vertices=8),
                      ctx.cylinder(side + ' keyed forearm sleeve', (0, 0, 0), 1, 1, 'coatshadow', vertices=8),
                      ctx.sphere(side + ' hand', (0, 0, 0), (.055, .05, .06), 'skin', smooth=False)]
    staff = ctx.part('held staff grip')
    shaft = ctx.cylinder('coal staff shaft', (0, 0, -.13), .028, 1.62, 'wood', vertices=8)
    ctx.parent(shaft, staff, keep_world=False)
    for z in (.63, .83):
        ring = ctx.cylinder('cage copper rim', (0, 0, z), .09, .035, 'copper', vertices=8)
        ctx.parent(ring, staff, keep_world=False)
    for angle in (0, math.pi / 2, math.pi, math.pi * 1.5):
        bar = ctx.beam('caged coal retaining bar', (.075 * math.cos(angle), .075 * math.sin(angle), .63),
                       (.075 * math.cos(angle), .075 * math.sin(angle), .83), .015, 'copper', vertices=6)
        ctx.parent(bar, staff, keep_world=False)
    coal = ctx.sphere('single contained coal', (0, 0, .73), (.05, .05, .055), 'coal', smooth=False)
    ctx.parent(coal, staff, keep_world=False)
    tablet = ctx.part('held copper ward tablet')
    slab = ctx.box('ward tablet', (0, 0, 0), (.17, .055, .23), 'copper', .008)
    ctx.parent(slab, tablet, keep_world=False)
    # Two interrupted pale marks, not readable language or borrowed glyphs.
    for x, z, length in [(-.045, .02, .10), (.025, -.01, .13)]:
        mark = ctx.box('tablet binding mark', (x, -.032, z), (.018, .009, length), 'linen', .001)
        ctx.parent(mark, tablet, keep_world=False)
    progression = [0, .30, .65, 1, .85, .55, .22, .10]
    for frame, t in enumerate(progression, 1):
        left_hand = (-.28 - .17 * t, -.15 - .17 * t, 1.03 + .35 * t)
        left_elbow = (-.29 - .04 * t, -.035 - .09 * t, 1.22 + .07 * t)
        right_hand = (.31 + .025 * t, -.07 - .09 * t, 1.06 + .10 * t)
        right_elbow = (.29, -.018, 1.27 + .035 * t)
        for side, shoulder, elbow, hand in [('left', (-.21, 0, 1.44), left_elbow, left_hand),
                                          ('right', (.21, 0, 1.44), right_elbow, right_hand)]:
            upper, lower, palm = arms[side]
            beam_pose(upper, shoulder, elbow, .071, frame)
            beam_pose(lower, elbow, hand, .061, frame)
            place(palm, hand, frame)
        place(staff, right_hand, frame)
        staff.rotation_euler[1] = -.05 + .10 * t
        staff.keyframe_insert(data_path='rotation_euler', frame=frame)
        place(tablet, (left_hand[0] - .025, left_hand[1] - .03, left_hand[2] + .07), frame)
        tablet.rotation_euler = (.12 + .32 * t, -.12, -.18 * t)
        tablet.keyframe_insert(data_path='rotation_euler', frame=frame)
        head.rotation_euler[2] = -.07 * t
        head.keyframe_insert(data_path='rotation_euler', frame=frame)
        coal.scale = (1 + .35 * t,) * 3
        coal.keyframe_insert(data_path='scale', frame=frame)
    return {'title': 'Waykeeper: witnessed preparation, tablet release, grounded recovery',
            'limitations': ['Original low-poly Blender character pilot, not finished all-faction character artwork.',
                            'Planted boots/body and stable equipment identity; only arms, carried objects, head and contained coal are keyed.',
                            'A single southeast casting direction; no walk, idle or additional facings.']}
