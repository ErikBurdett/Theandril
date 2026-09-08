"""A single original metal impact, authored in a fixed screen-plane volume.

Screen-space design coordinates are native pixels about the impact anchor.
The actual deliverable is rendered from Blender meshes and keyed transforms.
"""
import math
import bpy


def material(ctx, name, color):
    rgb = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emission = nodes.new('ShaderNodeEmission')
    emission.inputs['Color'].default_value = (*linear, 1)
    emission.inputs['Strength'].default_value = 1
    output = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(emission.outputs[0], output.inputs['Surface'])
    ctx.materials[name] = mat


def mesh(ctx, name, points, color, depth=0):
    # Screen right = +X; screen up = +Z. Camera looks along +Y.
    return ctx.mesh(name, [(x / 16, depth, y / 16) for x, y in points], [tuple(range(len(points)))], color)


def key(obj, frame, x=0, y=0, scale=1, angle=0):
    obj.location = (x / 16, 0, y / 16)
    obj.scale = (scale, scale, scale)
    obj.rotation_euler[1] = angle
    for path in ('location', 'scale', 'rotation_euler'):
        obj.keyframe_insert(data_path=path, frame=frame)


def build(ctx):
    for name, color in [('steel', '#657680'), ('silver', '#a1afb1'), ('hot', '#efe2b0'),
                        ('spark', '#f2bc60'), ('copper', '#d67e35'), ('spent', '#88765a')]:
        material(ctx, name, color)
    # A bent strike streak, not a whole sword or a persistent selection marker.
    sweep = mesh(ctx, 'strike preparation', [(-13, 12), (-9, 10), (8, -5), (3, -4)], 'silver', .02)
    scales = [.52, 1, .42, 0, 0, 0, 0, 0]
    for frame, scale in enumerate(scales, 1):
        key(sweep, frame, x=-2 if frame == 1 else 0, y=2 if frame == 1 else 0, scale=scale)
    # Unequal star arms keep the peak directional and avoid a circular explosion.
    star = mesh(ctx, 'warm metal impact', [(-14, 4), (-4, 4), (-3, 13), (1, 5), (13, 9),
                (5, 1), (13, -7), (3, -4), (0, -12), (-3, -4), (-11, -9), (-5, 0)], 'copper', -.01)
    core = mesh(ctx, 'pale impact core', [(-8, 2), (-2, 3), (-2, 8), (1, 3), (8, 5),
                (3, 0), (7, -4), (1, -2), (0, -7), (-2, -2), (-6, -5), (-3, 0)], 'hot', -.025)
    for frame, scale in enumerate([0, .25, 1, .67, .28, 0, 0, 0], 1):
        key(star, frame, scale=scale)
        key(core, frame, scale=scale * (1 if frame < 4 else .75))
    # Individual chips physically separate, rotate and shrink across eight poses.
    specs = [(2, 16, 11, 1.0, 'spark'), (3, -17, 7, .9, 'silver'),
             (3, 13, -15, .85, 'spark'), (3, -13, -13, .8, 'steel'),
             (4, 4, 20, .65, 'spent'), (4, -20, -1, .65, 'copper')]
    for index, (born, dx, dy, size, color) in enumerate(specs):
        chip = mesh(ctx, f'keyed metal chip {index + 1}', [(-2.8, 0), (-.4, 1.2), (2.4, 0), (-.7, -1.2)], color, -.04 - index * .003)
        for frame in range(1, 9):
            age = frame - born
            travel = max(0, age) / (8 - born)
            # Final two flecks remain nonempty; consumer clears the one-shot.
            scale = 0 if age < 0 else size * (1 - .35 * travel)
            if frame == 8 and index not in (0, 1):
                scale = 0
            key(chip, frame, dx * travel, dy * travel - 2 * travel * travel,
                scale, math.atan2(-dy, dx) + age * .12)
    return {
        'title': 'Crossing steel: brief registered melee impact',
        'stages': ['prepare', 'strike', 'impact', 'separation', 'falloff', 'fragments', 'spent chips', 'last flecks'],
        'limitations': ['Shared presentation only; no blood, damage logic or terrain alteration.',
                        'Emissive flat material groups deliberately avoid bloom and antialias haze.'],
    }
