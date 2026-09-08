"""Project-local immutable extension of BlenderArtFactory's pixel_2d stage.

Dry-run by default. No live Blender/MCP scene, active brief, approval or runtime
file is changed. Factory Python dependencies are retained before execution.
"""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
EFFECTS = {'melee': 'effect.battle_melee'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_new(path, value):
    with Path(path).open('x', encoding='utf-8') as handle:
        handle.write(json.dumps(value, indent=2) + '\n')


def output_path(repo, effect, version):
    if effect not in EFFECTS or isinstance(version, bool) or not isinstance(version, int) or not 1 <= version <= 999:
        raise ValueError('Choose a registered effect and integer version 1–999.')
    target = Path(repo) / 'assets/art/source/blender-battle' / EFFECTS[effect] / f'v{version}'
    for parent in [target, *target.parents]:
        if parent.is_symlink():
            raise ValueError('Symlink output paths are not allowed.')
        if parent == Path(repo):
            break
    return target


def validate_frames(images, colors, anchors, padding=3):
    errors, frames, hashes = [], [], []
    palette = {tuple(bytes.fromhex(color[1:])) for color in colors}
    for index, (width, height, pixels) in enumerate(images):
        if (width, height) != (64, 64) or len(pixels) != 64 * 64 * 4:
            errors.append(f'frame {index}: expected 64x64 RGBA')
            continue
        opaque = [(at // 4 % width, at // 4 // width) for at in range(0, len(pixels), 4) if pixels[at + 3] == 255]
        if any(pixels[at + 3] not in (0, 255) for at in range(0, len(pixels), 4)):
            errors.append(f'frame {index}: fractional alpha')
        if any(tuple(pixels[at:at + 3]) not in palette for at in range(0, len(pixels), 4) if pixels[at + 3] == 255):
            errors.append(f'frame {index}: color outside master palette')
        if not opaque:
            errors.append(f'frame {index}: empty pose')
            bounds = None
        else:
            bounds = {'x': min(x for x, _ in opaque), 'y': min(y for _, y in opaque),
                      'right': max(x for x, _ in opaque), 'bottom': max(y for _, y in opaque)}
            if min(bounds['x'], bounds['y'], 63 - bounds['right'], 63 - bounds['bottom']) < padding:
                errors.append(f'frame {index}: insufficient transparent padding')
        digest = hashlib.sha256(pixels).hexdigest()
        hashes.append(digest)
        frames.append({'index': index, 'opaquePixels': len(opaque), 'bounds': bounds, 'pixelHash': digest})
    if len(images) != 8:
        errors.append('Exactly eight keyed frames required.')
    if len(set(hashes)) != len(images):
        errors.append('Repeated static frame; all eight poses must differ.')
    # Blender's single-precision camera matrix gives a constant 0.000027px
    # offset in the measured front view. This numerical epsilon is <1/10000px,
    # not permission to move the sprite pivot by a native pixel between poses.
    anchor_error = max((abs(anchor[axis] - 32) for anchor in anchors for axis in ('x', 'y')), default=0)
    anchor_drift = max((max(anchor[axis] for anchor in anchors) - min(anchor[axis] for anchor in anchors)
                        for axis in ('x', 'y')), default=0) if anchors else 0
    if len(anchors) != len(images) or anchor_error > .0001 or anchor_drift > .0001:
        errors.append('Fixed impact anchor must project to (32,32) in every frame.')
    return {'ok': not errors, 'errors': errors, 'frames': frames, 'uniqueFrames': len(set(hashes)),
            'anchorMaxNumericalErrorPixels': anchor_error, 'anchorDriftPixels': anchor_drift,
            'visualReview': 'pending actual inspection', 'runtimeReview': 'not performed'}


def reviews(output, images, write_png):
    backgrounds = [(21, 21, 25), (225, 207, 159), (67, 71, 51)]
    width, height = 8 * 72 + 8, 3 * 72 + 8
    pixels = bytearray(width * height * 4)
    for row, background in enumerate(backgrounds):
        for y in range(row * 72, min(height, (row + 1) * 72 + 8)):
            for x in range(width):
                at = (y * width + x) * 4
                pixels[at:at + 4] = bytes((*background, 255))
        for index, (_, _, frame) in enumerate(images):
            for y in range(64):
                for x in range(64):
                    at = (y * 64 + x) * 4
                    if frame[at + 3]:
                        dest = ((row * 72 + y + 8) * width + index * 72 + x + 8) * 4
                        pixels[dest:dest + 4] = frame[at:at + 4]
    write_png(output / 'review-1x.png', width, height, pixels)


def build(factory_root, effect, version, execute=False, blender=None):
    factory_root = Path(factory_root).resolve(strict=True)
    required = ['factory/__init__.py', 'factory/core.py', 'factory/png.py', 'recipes/common.py']
    if any(not (factory_root / path).is_file() for path in required):
        raise ValueError('Expected a real BlenderArtFactory checkout.')
    sys.path.insert(0, str(factory_root))
    from factory.core import load_profile, find_blender
    from factory.png import quantize, read_png, write_png, enlarge
    profile, profile_path, recipe = load_profile(HERE / 'profiles' / f'{effect}.json')
    output = output_path(REPO, effect, version)
    if output.exists():
        raise ValueError('Immutable output already exists; retain it and choose a new version.')
    binary = find_blender(blender)
    version_result = subprocess.run([binary, '--version'], capture_output=True, text=True, timeout=15, check=True)
    plan = {'id': EFFECTS[effect], 'output': str(output), 'profile': str(profile_path),
            'recipe': str(recipe), 'blender': version_result.stdout.splitlines()[0], 'dryRun': not execute}
    if not execute:
        return plan
    output.mkdir(parents=True, exist_ok=False)
    for folder in ('raw', 'native', 'source', 'dependencies/factory', 'dependencies/recipes'):
        (output / folder).mkdir(parents=True, exist_ok=False)
    dependencies = []
    for relative in required:
        retained = output / 'dependencies' / relative
        shutil.copyfile(factory_root / relative, retained)
        dependencies.append({'path': retained.relative_to(output).as_posix(), 'sha256': sha(retained), 'role': 'actual BlenderArtFactory dependency'})
    for origin, name in [(recipe, 'recipe.py'), (HERE / 'driver.py', 'driver.py'), (HERE / 'build.py', 'build.py'), (profile_path, 'authored-profile.json'), (REPO / 'assets/palettes/theandril-master.json', 'palette.json')]:
        shutil.copyfile(origin, output / name)
        dependencies.append({'path': name, 'sha256': sha(output / name), 'role': 'project recipe/profile/driver/palette'})
    write_new(output / 'profile.json', profile)
    job = {'profile': profile, 'id': EFFECTS[effect], 'version': version}
    write_new(output / 'job.json', job)
    command = [binary, '--background', '--factory-startup', '-noaudio', '--threads', '4', '--python-exit-code', '1', '--python', str(output / 'driver.py'), '--', str(output / 'job.json')]
    with (output / 'build.log').open('x', encoding='utf-8') as log:
        result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, timeout=240)
    if result.returncode:
        raise RuntimeError(f'Blender failed ({result.returncode}); retained source/log at {output}. Use a new version after corrections.')
    settings = json.loads((output / 'render-settings.json').read_text())
    frames, images = [], []
    for index, duration in enumerate(profile['animation']['durationsMs']):
        raw = f'raw/frame-{index:03}.png'
        native = f'native/frame-{index:03}.png'
        quantize(output / raw, output / native, [64, 64], profile['palette']['colors'], .5)
        images.append(read_png(output / native))
        frames.append({'path': native, 'rawPath': raw, 'index': index, 'durationMs': duration, 'sha256': sha(output / native)})
    validation = validate_frames(images, profile['palette']['colors'], settings['anchorProof'])
    for key, count in [('triangles', settings['triangles']), ('materials', settings['materials']), ('objects', settings['meshObjects'])]:
        if count > profile['budgets'][key]:
            validation['errors'].append('Geometry budget exceeded: ' + key)
    validation['ok'] = not validation['errors']
    write_new(output / 'validation.json', validation)
    reviews(output, images, write_png)
    enlarge(output / 'review-1x.png', output / 'review-4x.png', 4)
    frame_paths = [frame['path'] for frame in frames]
    player = '<!doctype html><meta charset="utf-8"><title>Blender impact studio review</title><style>body{background:#151519;color:#e1cf9f;font:16px sans-serif}img{image-rendering:pixelated}button{margin:12px}</style><h1>Studio candidate — not approved or in-game</h1><p>Each displayed frame is an actual Blender render, palette-reduced once. One-shot; Replay starts it again.</p><img id="native" width="64" height="64"><img id="large" width="256" height="256"><button id="play">Replay</button><pre id="frame"></pre><script>const paths=' + json.dumps(frame_paths) + ',durations=' + json.dumps(profile['animation']['durationsMs']) + ';let timer;function show(i){clearTimeout(timer);for(const id of ["native","large"])document.getElementById(id).src=paths[i];document.getElementById("frame").textContent="Frame "+i+" · "+durations[i]+"ms";timer=setTimeout(()=>{if(i+1<paths.length)show(i+1);else{document.getElementById("native").style.visibility="hidden";document.getElementById("large").style.visibility="hidden"}},durations[i])}document.getElementById("play").onclick=()=>{for(const id of ["native","large"])document.getElementById(id).style.visibility="visible";show(0)};document.getElementById("play").click();</script>'
    (output / 'preview.html').write_text(player, encoding='utf-8')
    files = [{'path': path.relative_to(output).as_posix(), 'sha256': sha(path), 'bytes': path.stat().st_size}
             for path in sorted(output.rglob('*')) if path.is_file()]
    manifest = {'schemaVersion': 1, 'id': EFFECTS[effect], 'version': version,
                'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'blenderVersion': settings['blenderVersion'], 'paletteHash': sha(output / 'palette.json'),
                'nativeResolution': {'width': 64, 'height': 64}, 'pivot': {'x': 32, 'y': 32},
                'durationsMs': profile['animation']['durationsMs'], 'clip': {key: profile['animation'][key] for key in ('state', 'direction', 'loop')},
                'frames': frames, 'files': files, 'dependencies': dependencies, 'camera': settings['camera'],
                'anchorProof': settings['anchorProof'], 'status': 'candidate' if validation['ok'] else 'rejected-validation',
                'validation': 'validation.json', 'provenance': profile['provenance'],
                'pipelineStages': {'BlenderGeometryKeyframes': 'executed', 'factoryNearestPaletteAlpha': 'executed', 'PixelSnapper': 'pending root integration', 'Aseprite': 'pending root integration', 'visualApproval': 'not granted', 'runtime': 'not integrated'}}
    write_new(output / 'manifest.json', manifest)
    if not validation['ok']:
        raise RuntimeError('Candidate retained but fails validation: ' + '; '.join(validation['errors']))
    return {**plan, 'dryRun': False, 'manifest': str(output / 'manifest.json'), 'validation': validation}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--factory-root', required=True)
    parser.add_argument('--effect', choices=sorted(EFFECTS), default='melee')
    parser.add_argument('--version', type=int, default=1)
    parser.add_argument('--blender')
    parser.add_argument('--build', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(args.factory_root, args.effect, args.version, args.build, args.blender), indent=2))
