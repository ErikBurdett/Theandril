"""Supplemental background animation/anchor stage; never opens a live scene."""
import importlib.util
import json
import os
from pathlib import Path
import sys
import traceback

sys.dont_write_bytecode = True


def main():
    import bpy
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view
    job_path = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
    job = json.loads(job_path.read_text())
    output = job_path.parent
    sys.path.insert(0, str(output))
    sys.path.insert(0, str(output / 'dependencies'))
    from recipes.common import Context
    from factory.core import validate_profile_controls
    profile = job['profile']
    validate_profile_controls(profile)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.context.preferences.filepaths.save_version = 0
    ctx = Context(profile, output / 'source')
    spec = importlib.util.spec_from_file_location('battle_recipe', output / 'recipe.py')
    recipe = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(recipe)
    description = recipe.build(ctx)
    # Unlike the static factory, DO NOT merge animated meshes or normalize their
    # current-frame bounds: either operation could erase motion/anchor identity.
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = profile['render']['samples']
    scene.cycles.use_denoising = False
    scene.cycles.seed = 731
    scene.render.film_transparent = True
    scene.render.filter_size = profile['render']['filterSize']
    scene.render.use_motion_blur = False
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.resolution_x, scene.render.resolution_y = profile['render']['resolution']
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = profile['render'].get('exposure', 0)
    scene.view_settings.gamma = 1
    scene.world.use_nodes = True
    scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value = 0
    bpy.ops.object.camera_add(location=profile['render']['camera']['position'])
    camera = bpy.context.object
    camera.name = 'fixed registered effect camera'
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = profile['render']['camera']['orthoScale']
    target = Vector(profile['render']['camera']['target'])
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    # Translate camera and aim together along its own up/right axes. A centered
    # effect and a feet-anchored person share the same unchanging native canvas.
    pivot_x, pivot_y = profile['sprites']['anchor']
    right = camera.rotation_euler.to_quaternion() @ Vector((1, 0, 0))
    up = camera.rotation_euler.to_quaternion() @ Vector((0, 1, 0))
    camera.location += right * ((32 - pivot_x) / 64 * camera.data.ortho_scale) + up * ((pivot_y - 32) / 64 * camera.data.ortho_scale)
    camera.data.dof.use_dof = False
    scene.camera = camera
    bpy.ops.object.light_add(type='AREA', location=(-3, -4, 5))
    light = bpy.context.object
    light.name = 'fixed screen upper left key'
    light.data.energy = profile['render'].get('keyEnergy', 150)
    light.data.size = 4
    light.rotation_euler = (-light.location).to_track_quat('-Z', 'Y').to_euler()
    durations = profile['animation']['durationsMs']
    scene.frame_start, scene.frame_end = 1, len(durations)
    if len(set(durations)) != 1 or 1000 % durations[0]:
        raise ValueError('This driver requires uniform frame timing exactly representable by Blender fps.')
    scene.render.fps = 1000 // durations[0]
    scene['presentation_durations_ms'] = durations
    scene['presentation_note'] = 'Keyed poses are frames 1–8; Blender timeline fps and retained per-frame durations agree.'
    anchors, poses = [], []
    meshes = [obj for obj in scene.objects if obj.type == 'MESH']
    triangle_count = 0
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangle_count += len(obj.data.loop_triangles)
    for index, duration in enumerate(durations):
        scene.frame_set(index + 1)
        bpy.context.view_layer.update()
        projected = world_to_camera_view(scene, camera, Vector((0, 0, 0)))
        anchors.append({'x': round(projected.x * 64, 6), 'y': round((1 - projected.y) * 64, 6)})
        poses.append({'frame': index + 1, 'durationMs': duration, 'objects': [
            {'name': obj.name, 'location': list(obj.location), 'scale': list(obj.scale), 'rotation': list(obj.rotation_euler)} for obj in meshes]})
        scene.render.filepath = str(output / 'raw' / f'frame-{index:03}.png')
        bpy.ops.render.render(write_still=True)
    scene.frame_set(3)
    bpy.ops.wm.save_as_mainfile(filepath=str(output / 'source.blend'), check_existing=False)
    metadata = {'blenderVersion': bpy.app.version_string, 'renderEngine': scene.render.engine,
                'camera': profile['render']['camera'], 'anchorProof': anchors, 'poses': poses,
                'meshObjects': len(meshes), 'triangles': triangle_count, 'materials': len(ctx.materials),
                'animatedObjects': sum(obj.animation_data is not None for obj in scene.objects), 'timelineFps': scene.render.fps,
                'keyEnergy': light.data.energy, 'exposure': scene.view_settings.exposure, 'description': description}
    (output / 'render-settings.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print('BLENDER_BATTLE_RENDER_COMPLETE', flush=True)


if __name__ == '__main__':
    try:
        main()
        sys.stdout.flush()
        os._exit(0)  # Match the factory's documented Linux audio shutdown workaround.
    except Exception:
        traceback.print_exc()
        sys.stdout.flush()
        sys.stderr.flush()
        os._exit(1)
