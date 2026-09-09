"""Immutable real Blender battle-unit source builder. Dry-run by default."""
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
REPO = HERE.parents[3]
CLIPS = {'idle': {'frames': 4, 'durationMs': 200, 'loop': True},
         'walk': {'frames': 8, 'durationMs': 100, 'loop': True},
         'attack': {'frames': 8, 'durationMs': 100, 'loop': False},
         'hit': {'frames': 4, 'durationMs': 100, 'loop': False},
         'death': {'frames': 8, 'durationMs': 100, 'loop': False}}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_new(path, data):
    with Path(path).open('x', encoding='utf-8') as handle:
        handle.write(json.dumps(data, indent=2) + '\n')


def validate(images, frames, palette, size, pivot, clips, directions):
    errors, records = [], []
    colors = {tuple(bytes.fromhex(color[1:])) for color in palette}
    for image, frame in zip(images, frames):
        width, height, rgba = image
        name = f"{frame['state']}/{frame['direction']}/{frame['index']}"
        if width != size or height != size or len(rgba) != size * size * 4:
            errors.append(name + ': incorrect canvas'); continue
        opaque = [(i // 4 % size, i // 4 // size) for i in range(0, len(rgba), 4) if rgba[i + 3]]
        if not opaque:
            errors.append(name + ': empty pose'); continue
        if any(rgba[i + 3] not in (0, 255) or rgba[i + 3] and tuple(rgba[i:i + 3]) not in colors for i in range(0, len(rgba), 4)):
            errors.append(name + ': fractional alpha or palette contamination')
        bounds = [min(x for x, y in opaque), min(y for x, y in opaque), max(x for x, y in opaque), max(y for x, y in opaque)]
        if min(bounds[0], bounds[1], size - 1 - bounds[2], size - 1 - bounds[3]) < 2:
            errors.append(name + ': incomplete transparent margin')
        if abs(frame['anchor']['x'] - pivot[0]) > .0001 or abs(frame['anchor']['y'] - pivot[1]) > .0001:
            errors.append(name + ': origin projection drift')
        records.append({'frame': name, 'bounds': bounds, 'opaquePixels': len(opaque), 'pixelHash': hashlib.sha256(rgba).hexdigest()})
    for direction in directions:
        for state, contract in clips.items():
            group = [record for record in records if record['frame'].startswith(state + '/' + direction + '/')]
            if len(group) != contract['frames']:
                errors.append(state + '/' + direction + ': missing frames')
            if len({record['pixelHash'] for record in group}) < min(3, contract['frames']):
                errors.append(state + '/' + direction + ': insufficient visible pose changes')
    return {'ok': not errors, 'errors': errors, 'frames': records, 'note': 'Validation does not grant visual, animation or runtime acceptance.'}


def review_sheet(output, images, frames, write_png, enlarge):
    # Each clip/facing gets actual 1x and nearest4x frames on three backgrounds.
    for direction in sorted({frame['direction'] for frame in frames}):
        for state in dict.fromkeys(frame['state'] for frame in frames):
            selected = [image for image, frame in zip(images, frames) if frame['state'] == state and frame['direction'] == direction]
            if not selected: continue
            size = selected[0][0]; width, height = (size + 8) * len(selected) + 8, (size + 8) * 3 + 8
            pixels = bytearray(width * height * 4)
            for row, background in enumerate([(34, 44, 52), (225, 207, 159), (67, 71, 51)]):
                for y in range(row * (size + 8), (row + 1) * (size + 8) + 8):
                    for x in range(width):
                        at = (y * width + x) * 4
                        pixels[at:at + 4] = bytes((*background, 255))
                for column, (_, _, rgba) in enumerate(selected):
                    for y in range(size):
                        for x in range(size):
                            src = (y * size + x) * 4
                            if rgba[src + 3]:
                                dest = ((row * (size + 8) + 8 + y) * width + column * (size + 8) + 8 + x) * 4
                                pixels[dest:dest + 4] = rgba[src:src + 4]
            path = output / f'review-{state}-{direction}-1x.png'
            write_png(path, width, height, pixels)
            enlarge(path, output / f'review-{state}-{direction}-4x.png', 4)


def build(factory_root, role, version, states, directions, execute=False, blender=None):
    if role != 'guard':
        raise ValueError('Only the guard pilot is authored; review it before expanding the mechanical-role family.')
    if not 1 <= version <= 999 or len(set(states)) != len(states) or any(state not in CLIPS for state in states):
        raise ValueError('Invalid immutable version or clip list.')
    if not directions or len(set(directions)) != len(directions) or any(direction not in ('e', 'w') for direction in directions):
        raise ValueError('Choose independently rendered e/w facings.')
    factory_root = Path(factory_root).resolve(strict=True)
    required = ['factory/__init__.py', 'factory/core.py', 'factory/png.py', 'recipes/common.py']
    if any(not (factory_root / path).is_file() for path in required):
        raise ValueError('Expected the actual BlenderArtFactory checkout.')
    sys.path.insert(0, str(factory_root))
    from factory.core import find_blender
    from factory.png import quantize, read_png, write_png, enlarge
    binary = find_blender(blender)
    output = REPO / 'assets/art/source/blender-units' / ('battle.unit.' + role) / f'v{version}'
    if output.exists() or any(path.is_symlink() for path in [output, *output.parents] if path != REPO.parent):
        raise ValueError('Immutable or symlink output: retain prior evidence and choose a new version.')
    palette_path = REPO / 'assets/palettes/theandril-master.json'
    palette = json.loads(palette_path.read_text())
    profile = {'schemaVersion': 1, 'id': 'battle.unit.' + role, 'workflow': 'pixel_2d', 'palette': palette,
               'textures': {'size': 8, 'filter': 'nearest'}, 'sprites': {'size': [64, 64], 'anchor': [32, 56]},
               'camera': {'position': [0, -6, 3.5], 'orthoScale': 2.6}, 'directions': directions,
               'clips': {state: CLIPS[state] for state in states},
               'provenance': 'Original Theandril articulated Blender geometry and authored bone Actions; no downloaded meshes, generated bitmap inputs or mirrored culture images.'}
    version_result = subprocess.run([binary, '--version'], capture_output=True, text=True, timeout=15, check=True)
    plan = {'assetId': profile['id'], 'output': str(output), 'frames': sum(clip['frames'] for clip in profile['clips'].values()) * len(directions),
            'blender': version_result.stdout.splitlines()[0], 'dryRun': not execute}
    if not execute: return plan
    output.mkdir(parents=True, exist_ok=False)
    for folder in ('raw', 'native', 'source', 'dependencies/factory', 'dependencies/recipes'):
        (output / folder).mkdir(parents=True, exist_ok=False)
    for relative in required:
        shutil.copyfile(factory_root / relative, output / 'dependencies' / relative)
    for origin, name in [(HERE / 'guard.py', 'recipe.py'), (HERE / 'driver.py', 'driver.py'), (HERE / 'build.py', 'build.py'),
                         (HERE.parent / 'battle_authoring.py', 'battle_authoring.py'), (palette_path, 'palette.json')]:
        shutil.copyfile(origin, output / name)
    write_new(output / 'profile.json', profile)
    command = [binary, '--background', '--factory-startup', '-noaudio', '--threads', '6', '--python-exit-code', '1', '--python', str(output / 'driver.py'), '--', str(output / 'profile.json')]
    with (output / 'build.log').open('x') as log:
        result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, timeout=1800)
    if result.returncode:
        raise RuntimeError(f'Blender render failed ({result.returncode}); retained log: {output / "build.log"}')
    settings = json.loads((output / 'render-settings.json').read_text())
    images = []
    for frame in settings['frames']:
        name = f"native/{frame['state']}-{frame['direction']}-{frame['index']:03}.png"
        quantize(output / frame['rawPath'], output / name, [64, 64], palette['colors'], .5)
        frame['path'], frame['sha256'] = name, sha(output / name)
        images.append(read_png(output / name))
    validation = validate(images, settings['frames'], palette['colors'], 64, [32, 56], profile['clips'], directions)
    if settings['weightedMeshes'] != settings['meshObjects'] or settings['rig']['boneCount'] < 16:
        validation['errors'].append('Expected all figure meshes bound to an actual articulated skeleton.')
        validation['ok'] = False
    write_new(output / 'validation.json', validation)
    review_sheet(output, images, settings['frames'], write_png, enlarge)
    files = [{'path': path.relative_to(output).as_posix(), 'sha256': sha(path), 'bytes': path.stat().st_size} for path in sorted(output.rglob('*')) if path.is_file()]
    manifest = {'schemaVersion': 1, 'id': profile['id'], 'contentId': 'unit.' + role, 'version': version,
                'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'blenderVersion': settings['blenderVersion'],
                'nativeResolution': {'width': 64, 'height': 64}, 'pivot': [32, 56], 'paletteHash': sha(output / 'palette.json'),
                'clips': profile['clips'], 'directions': directions, 'frames': settings['frames'], 'files': files,
                'provenance': profile['provenance'], 'status': 'candidate' if validation['ok'] else 'rejected-validation',
                'pipelineStages': {'BlenderRigAndActualRenders': 'executed', 'FactoryNativePaletteAlpha': 'executed',
                                   'PixelSnapper': 'pending', 'Aseprite': 'pending', 'VisualReview': 'pending', 'Runtime': 'not integrated'}}
    write_new(output / 'manifest.json', manifest)
    if not validation['ok']:
        raise RuntimeError('Retained source fails validation: ' + '; '.join(validation['errors']))
    return {**plan, 'dryRun': False, 'manifest': str(output / 'manifest.json'), 'validation': validation}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--factory-root', required=True)
    parser.add_argument('--role', default='guard')
    parser.add_argument('--version', type=int, default=1)
    parser.add_argument('--states', default='idle,walk,attack,hit,death')
    parser.add_argument('--directions', default='e,w')
    parser.add_argument('--blender')
    parser.add_argument('--build', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(args.factory_root, args.role, args.version, args.states.split(','), args.directions.split(','), args.build, args.blender), indent=2))
