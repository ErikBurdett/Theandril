"""Dedicated background-render process; never touches a desktop Blender scene."""
import importlib.util
import json
import math
import os
from pathlib import Path
import sys
import traceback

sys.dont_write_bytecode = True


def main():
    import bpy
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view
    output = Path(sys.argv[sys.argv.index('--') + 1]).resolve().parent
    sys.path[:0] = [str(output), str(output / 'dependencies')]
    from recipes.common import Context
    profile = json.loads((output / 'profile.json').read_text())
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.context.preferences.filepaths.save_version = 0
    ctx = Context(profile, output / 'source')
    spec = importlib.util.spec_from_file_location('original_battle_unit', output / 'recipe.py')
    recipe = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(recipe)
    rig, description = recipe.build(ctx)
    clips = {state: recipe.action(rig, state, contract['frames'], contract['durationMs']) for state, contract in profile['clips'].items()}
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 16
    scene.cycles.use_denoising = False
    scene.cycles.seed = 731
    scene.render.film_transparent = True
    scene.render.filter_size = .01
    scene.render.use_motion_blur = False
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.resolution_x = scene.render.resolution_y = 256
    scene.render.resolution_percentage = 100
    scene.render.fps = 10
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.world.use_nodes = True
    scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value = 0
    bpy.ops.object.camera_add(location=profile['camera']['position'])
    camera = bpy.context.object
    camera.name = 'Fixed battle figure camera'
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = profile['camera']['orthoScale']
    camera.rotation_euler = (-camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.dof.use_dof = False
    native = profile['sprites']['size'][0]
    px, py = profile['sprites']['anchor']
    axes = camera.rotation_euler.to_quaternion()
    camera.location += axes @ Vector(((native / 2 - px) / native * camera.data.ortho_scale,
                                     (py - native / 2) / native * camera.data.ortho_scale, 0))
    scene.camera = camera
    for name, position, energy, size in [('Fixed upper-left key', (-3, -4, 6), 420, 4), ('Restrained material fill', (3, -2, 3), 80, 5)]:
        bpy.ops.object.light_add(type='AREA', location=position)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.size = size
        light.rotation_euler = (-light.location).to_track_quat('-Z', 'Y').to_euler()
    # All original meshes and the real rig rotate together. Lights and camera do
    # not rotate, so the second facing is a genuine render, not a reflected PNG.
    facing = bpy.data.objects.new('Authored facing root', None)
    bpy.context.collection.objects.link(facing)
    for obj in [rig, *[obj for obj in scene.objects if obj.type == 'MESH']]:
        world = obj.matrix_world.copy()
        obj.parent = facing
        obj.matrix_world = world
    frames = []
    for direction in profile['directions']:
        facing.rotation_euler[2] = math.radians(45 if direction == 'e' else -45)
        for state, contract in profile['clips'].items():
            rig.animation_data.action = clips[state]
            for index in range(contract['frames']):
                frame_number = 1 + index * (contract['durationMs'] // 100)
                scene.frame_set(frame_number)
                bpy.context.view_layer.update()
                projected = world_to_camera_view(scene, camera, Vector((0, 0, 0)))
                relative = f'raw/{state}-{direction}-{index:03}.png'
                scene.render.filepath = str(output / relative)
                bpy.ops.render.render(write_still=True)
                frames.append({'state': state, 'direction': direction, 'index': index, 'blenderFrame': frame_number,
                               'durationMs': contract['durationMs'], 'rawPath': relative,
                               'anchor': {'x': round(projected.x * native, 6), 'y': round((1 - projected.y) * native, 6)},
                               'bones': {bone.name: {'head': list(bone.head), 'tail': list(bone.tail)} for bone in rig.pose.bones}})
    rig.animation_data.action = clips[next(iter(clips))]
    scene.frame_set(1)
    scene.frame_start, scene.frame_end = 1, max(contract['frames'] * contract['durationMs'] // 100 for contract in profile['clips'].values())
    scene['native_animation_contract'] = json.dumps(profile['clips'])
    scene['presentation_only'] = 'These bone Actions express motion; they never calculate battle damage or casualties.'
    bpy.ops.wm.save_as_mainfile(filepath=str(output / 'source.blend'), check_existing=False)
    meshes = [obj for obj in scene.objects if obj.type == 'MESH']
    triangles = 0
    for mesh in meshes:
        mesh.data.calc_loop_triangles()
        triangles += len(mesh.data.loop_triangles)
    result = {'blenderVersion': bpy.app.version_string, 'timelineFps': scene.render.fps, 'camera': profile['camera'],
              'nativeResolution': profile['sprites']['size'], 'pivot': profile['sprites']['anchor'], 'frames': frames,
              'meshObjects': len(meshes), 'triangles': triangles, 'materials': len(ctx.materials), 'rig': description,
              'actions': [{'name': action.name, 'range': list(action.frame_range)} for action in clips.values()],
              'weightedMeshes': sum(any(mod.type == 'ARMATURE' and mod.object == rig for mod in obj.modifiers) for obj in meshes)}
    (output / 'render-settings.json').write_text(json.dumps(result, indent=2) + '\n')
    print('ARTICULATED_BATTLE_UNIT_RENDER_COMPLETE', flush=True)


if __name__ == '__main__':
    try:
        main()
        sys.stdout.flush()
        os._exit(0)
    except Exception:
        traceback.print_exc()
        sys.stdout.flush()
        sys.stderr.flush()
        os._exit(1)
