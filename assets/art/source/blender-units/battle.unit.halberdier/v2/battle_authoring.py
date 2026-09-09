"""Shared original mesh/keyframe conveniences, retained with each new source."""
import math
import bpy
from mathutils import Vector


def material(ctx, name, color, luminous=False, rough=.8):
    rgb = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    if luminous:
        mat.node_tree.nodes.clear()
        shader = mat.node_tree.nodes.new('ShaderNodeEmission')
        shader.inputs['Color'].default_value = (*linear, 1)
        output = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
        mat.node_tree.links.new(shader.outputs[0], output.inputs['Surface'])
    else:
        shader = mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = (*linear, 1)
        shader.inputs['Roughness'].default_value = rough
    ctx.materials[name] = mat
    return mat


def mesh(ctx, name, points, color, depth=0):
    return ctx.mesh(name, [(x / 16, depth, y / 16) for x, y in points], [tuple(range(len(points)))], color)


def key(obj, frame, x=0, y=0, scale=1, angle=0):
    obj.location = (x / 16, 0, y / 16)
    obj.scale = (scale, scale, scale)
    obj.rotation_euler[1] = angle
    for path in ('location', 'scale', 'rotation_euler'):
        obj.keyframe_insert(data_path=path, frame=frame)


def fragment(ctx, name, destination, color, born, size=1, tail=True):
    dx, dy = destination
    obj = mesh(ctx, name, [(-2.8, 0), (-.4, 1.5), (2.4, 0), (-.7, -1.5)], color, -.08)
    for frame in range(1, 9):
        travel = max(0, frame - born) / (8 - born)
        scale = 0 if frame < born else size * (1 - .30 * travel)
        if frame == 8 and not tail:
            scale = 0
        key(obj, frame, dx * travel, dy * travel - travel * travel, scale, math.atan2(-dy, dx) + frame * .07)
    return obj


def beam_pose(obj, start, end, radius, frame):
    start, end = Vector(start), Vector(end)
    delta = end - start
    obj.location = (start + end) / 2
    obj.rotation_euler = delta.to_track_quat('Z', 'Y').to_euler()
    obj.scale = (radius, radius, delta.length)
    for path in ('location', 'scale', 'rotation_euler'):
        obj.keyframe_insert(data_path=path, frame=frame)


def place(obj, location, frame):
    obj.location = location
    obj.keyframe_insert(data_path='location', frame=frame)
