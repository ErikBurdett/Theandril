"""Profile-driven build, validation and immutable review/publication boundaries."""
import datetime
import hashlib
import json
import os
import re
import shutil
import struct
import subprocess
from pathlib import Path
from .png import read_png, palette_rgb

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = {'polygon_3d', 'pixel_2d', 'pixel_3d', 'realistic_3d'}


def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def read(path): return json.loads(Path(path).read_text(encoding='utf-8'))
def write(path, value):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def safe_id(value):
    if not re.fullmatch(r'[a-z0-9][a-z0-9_-]{0,79}', value):
        raise ValueError(f'Unsafe profile/asset ID: {value!r}')
    return value



def member(base, relative):
    """Resolve a manifest member without permitting traversal or symlink escape."""
    relative = Path(relative)
    if relative.is_absolute() or '..' in relative.parts:
        raise ValueError('Unsafe manifest member path')
    base = Path(base).resolve()
    cursor = base
    for part in relative.parts:
        cursor = cursor / part
        if cursor.is_symlink(): raise ValueError('Manifest member symlinks are forbidden')
    target = (base / relative).resolve()
    if not target.is_relative_to(base): raise ValueError('Manifest member escapes workspace')
    return target



def formats_for(profile):
    default = ['blend', 'png'] if profile['workflow'] == 'pixel_2d' else ['blend', 'glb', 'png']
    return profile.get('export', {}).get('formats', default)


def validate_profile_controls(profile):
    """Fail on unsupported executable options; advisory production targets remain metadata."""
    render = profile.get('render', {})
    if render.get('engine', 'CYCLES') not in ('CYCLES', 'BLENDER_EEVEE_NEXT'):
        raise ValueError('render.engine supports CYCLES or BLENDER_EEVEE_NEXT only')
    if render.get('camera', {}).get('projection', 'ORTHO') not in ('ORTHO', 'PERSP'):
        raise ValueError('render.camera.projection supports ORTHO or PERSP only')
    texture = profile.get('textures', {})
    filtering = texture.get('filter', 'nearest' if profile['workflow'].startswith('pixel_') else 'linear')
    if filtering not in ('nearest', 'linear'): raise ValueError('textures.filter supports nearest or linear only')
    if profile['workflow'] == 'pixel_3d' and (filtering != 'nearest' or texture.get('mipmaps', False)):
        raise ValueError('pixel_3d requires nearest filtering without mipmap sampling')
    export = profile.get('export', {})
    fixed = {'units': 'meters', 'up': '+Y', 'forward': '-Z', 'origin': 'ground-center', 'selectedOnly': True, 'includeCameras': False, 'includeLights': False, 'embedTextures': True, 'normalConvention': 'tangent-positive-Y'}
    for key, value in fixed.items():
        if key in export and export[key] != value: raise ValueError(f'export.{key} currently supports only {value!r}')
    formats = formats_for(profile)
    if not isinstance(formats, list) or len(formats) != len(set(formats)) or not set(formats) <= {'blend', 'glb', 'png'}:
        raise ValueError('export.formats supports unique blend, glb and png entries only')
    required = {'blend', 'png'} | ({'glb'} if profile['workflow'] != 'pixel_2d' else set())
    if not required <= set(formats): raise ValueError('export.formats must retain source blend, review png and the workflow runtime format')
    runtime = 'png' if profile['workflow'] == 'pixel_2d' else 'glb'
    if export.get('runtimeFormat', runtime) != runtime: raise ValueError('export.runtimeFormat disagrees with workflow')
    if not isinstance(export.get('preserveNamedParts', True), bool): raise ValueError('preserveNamedParts must be a boolean')
    if profile.get('quality', {}).get('requireNamedParts') and not export.get('preserveNamedParts', True):
        raise ValueError('Required named parts need export.preserveNamedParts=true')
    mag, minimum = sampler_filters(profile)
    for key, expected in [('samplerMagFilter', mag), ('samplerMinFilter', minimum)]:
        if key in export and export[key] != expected: raise ValueError(f'export.{key} conflicts with textures.filter/mipmaps')


def sampler_filters(profile):
    texture = profile.get('textures', {})
    nearest = texture.get('filter', 'nearest' if profile['workflow'].startswith('pixel_') else 'linear') == 'nearest'
    mipmaps = texture.get('mipmaps', False)
    return (9728 if nearest else 9729, (9984 if nearest else 9987) if mipmaps else (9728 if nearest else 9729))


def provenance_for(workspace, profile, geometry):
    declared = profile.get('provenance', {})
    return {'origin': declared.get('origin', 'Original local procedural geometry and texture pixels'), 'license': declared.get('license', 'CC0-1.0'), 'recipeSha256': sha(workspace / 'source/recipe.py'), 'profileSha256': sha(workspace / 'source/profile.json'), 'tool': 'Blender', 'toolVersion': geometry['blenderVersion']}


def check_snapshot(snapshot, manifest, record, label):
    expected = {entry['path'] for entry in manifest['files']} | {'manifest.json', 'review.json'}
    actual = set()
    for path in snapshot.rglob('*'):
        if path.is_symlink(): raise RuntimeError(label + ' contains a forbidden symlink')
        if path.is_file(): actual.add(path.relative_to(snapshot).as_posix())
    if actual != expected: raise RuntimeError(label + ' exact file set differs from approval')
    if read(snapshot / 'manifest.json') != manifest: raise RuntimeError(label + ' manifest differs from approved candidate')
    if read(snapshot / 'review.json') != record: raise RuntimeError(label + ' review differs from bound decision')
    for entry in manifest['files']:
        path = member(snapshot, entry['path'])
        if sha(path) != entry['sha256'] or path.stat().st_size != entry['bytes']:
            raise RuntimeError(label + ' is missing or changed: ' + entry['path'])


def find_blender(override=None):
    supplied = override or os.environ.get('BLENDER_BIN')
    candidates = [supplied] if supplied else [shutil.which('blender')]
    if os.name == 'nt':
        for variable in ('ProgramFiles', 'ProgramFiles(x86)'):
            parent = Path(os.environ.get(variable, 'C:/Program Files')) / 'Blender Foundation'
            candidates.extend(str(p) for p in sorted(parent.glob('Blender*/blender.exe'), reverse=True))
    elif os.sys.platform == 'darwin':
        candidates.append('/Applications/Blender.app/Contents/MacOS/Blender')
    for candidate in candidates:
        if candidate and Path(candidate).is_file(): return str(Path(candidate).resolve())
    raise RuntimeError('Blender executable not found. Add Blender to PATH, set BLENDER_BIN, or pass --blender PATH.')


def load_profile(reference):
    path = Path(reference)
    if not path.is_file(): path = PACKAGE_ROOT / 'profiles' / (str(reference).removesuffix('.json') + '.json')
    if not path.is_file(): raise RuntimeError(f'Profile not found: {reference}')
    path = path.resolve(); profile = read(path)
    safe_id(profile['id'])
    if profile.get('workflow') not in WORKFLOWS: raise ValueError('Unknown profile workflow')
    if profile.get('schemaVersion') != 1: raise ValueError('Unsupported profile schemaVersion')
    validate_profile_controls(profile)
    palette = profile.setdefault('palette', {})
    if palette.get('file') and not palette.get('colors'):
        palette_path = (path.parent / palette['file']).resolve()
        data = read(palette_path)
        palette['colors'] = data['colors'] if isinstance(data, dict) else data
        palette['sourceSha256'] = sha(palette_path)
    if profile['workflow'].startswith('pixel_') and not palette.get('colors'):
        raise ValueError('Pixel workflows require a non-empty palette')
    for color in palette.get('colors', []):
        if not re.fullmatch(r'#[0-9a-fA-F]{6}', color): raise ValueError(f'Invalid palette color: {color}')
    recipe = str(profile.get('recipe', 'shrine'))
    recipe_path = (path.parent / recipe).resolve() if recipe.endswith('.py') else PACKAGE_ROOT / 'recipes' / (recipe + '.py')
    if not recipe_path.is_file(): raise RuntimeError(f'Authored recipe not found: {recipe_path}')
    return profile, path, recipe_path


def parse_glb(path):
    data = Path(path).read_bytes()
    if len(data) < 20: raise ValueError('Truncated GLB')
    magic, version, length = struct.unpack_from('<4sII', data)
    if (magic, version, length) != (b'glTF', 2, len(data)): raise ValueError('Invalid GLB header')
    offset, document, binary = 12, None, b''
    while offset < len(data):
        if offset + 8 > len(data): raise ValueError('Truncated GLB chunk')
        size, kind = struct.unpack_from('<II', data, offset)
        chunk = data[offset + 8:offset + 8 + size]
        if len(chunk) != size: raise ValueError('GLB chunk length mismatch')
        if kind == 0x4e4f534a: document = json.loads(chunk)
        elif kind == 0x004e4942: binary = chunk
        offset += size + 8
    if document is None: raise ValueError('GLB JSON missing')
    return document, binary


class Factory:
    def __init__(self, root, profile_reference, asset=None):
        self.root = Path(root).resolve()
        self.profile, self.profile_path, self.recipe_path = load_profile(profile_reference)
        self.asset = safe_id(asset or ('crate' if self.profile['recipe'] == 'modern_crate' else 'shrine'))
        self.workspace = self.root / 'work' / self.profile['id'] / self.asset
        self.manifest_path = self.workspace / 'manifest.json'

    def build(self, blender=None, *, timeout=600):
        binary = find_blender(blender)
        compile(self.recipe_path.read_text(encoding='utf-8'), str(self.recipe_path), 'exec')
        for name in ('source', 'candidate', 'previews', 'reviews', 'reviewed', 'rejected'):
            (self.workspace / name).mkdir(parents=True, exist_ok=True)
        # Remove only the previous generated candidate files; immutable reviewed
        # and published releases remain untouched. Reject unknown stray files.
        if self.manifest_path.exists():
            previous = read(self.manifest_path)
            for entry in previous.get('files', []):
                path = member(self.workspace, entry['path'])
                if path.is_file() and entry['path'].split('/')[0] in ('candidate', 'previews', 'source'):
                    path.unlink()
        profile = self.profile
        write(self.workspace / 'source/profile.json', profile)
        shutil.copy2(self.recipe_path, self.workspace / 'source/recipe.py')
        for origin, name in [(PACKAGE_ROOT / 'recipes/common.py', 'common.py'), (PACKAGE_ROOT / 'factory/blender_driver.py', 'blender_driver.py'), (PACKAGE_ROOT / 'factory/png.py', 'png.py')]:
            shutil.copy2(origin, self.workspace / 'source' / name)
        job = {'workspace': str(self.workspace), 'asset': self.asset, 'profile': profile, 'recipe': str(self.recipe_path), 'packageRoot': str(PACKAGE_ROOT)}
        write(self.workspace / 'job.json', job)
        command = [binary, '--background', '--factory-startup', '-noaudio', '--threads', '6', '--python-exit-code', '1', '--python', str(PACKAGE_ROOT / 'factory/blender_driver.py'), '--', str(self.workspace / 'job.json')]
        with (self.workspace / 'build.log').open('w', encoding='utf-8') as log:
            result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, timeout=timeout)
        if result.returncode: raise RuntimeError(f'Blender build failed ({result.returncode}); inspect {self.workspace / "build.log"}')
        files = []
        for folder in ('source', 'candidate', 'previews'):
            for path in sorted((self.workspace / folder).rglob('*')):
                if path.is_file(): files.append({'path': path.relative_to(self.workspace).as_posix(), 'sha256': sha(path), 'bytes': path.stat().st_size, 'role': folder})
        fingerprint = hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
        manifest = {'schemaVersion': 1, 'profileId': profile['id'], 'workflow': profile['workflow'], 'assetId': self.asset, 'createdAt': now(), 'fingerprint': fingerprint, 'files': files, 'profile': profile, 'geometry': read(self.workspace / 'candidate/geometry.json'), 'provenance': provenance_for(self.workspace, profile, read(self.workspace / 'candidate/geometry.json')), 'status': 'candidate'}
        write(self.manifest_path, manifest)
        return self.validate()

    def validate(self):
        if not self.manifest_path.is_file(): raise RuntimeError('No candidate exists; run build first')
        manifest = read(self.manifest_path)
        errors = []
        for entry in manifest['files']:
            path = member(self.workspace, entry['path'])
            if not path.is_file() or sha(path) != entry['sha256'] or path.stat().st_size != entry['bytes']: errors.append('Missing or changed file: ' + entry['path'])
        expected = hashlib.sha256(json.dumps(manifest['files'], sort_keys=True).encode()).hexdigest()
        if expected != manifest['fingerprint']: errors.append('Manifest fingerprint mismatch')
        profile = manifest['profile']; budgets = profile.get('budgets', {})
        if read(self.workspace / 'source/profile.json') != profile: errors.append('Manifest profile differs from retained source profile')
        if read(self.workspace / 'candidate/geometry.json') != manifest['geometry']: errors.append('Manifest geometry differs from retained geometry evidence')
        if manifest.get('provenance') != provenance_for(self.workspace, profile, manifest['geometry']): errors.append('Claimed provenance differs from retained inputs and declared license')
        declared = {entry['path'] for entry in manifest['files']}
        actual = {path.relative_to(self.workspace).as_posix() for folder in ('source', 'candidate', 'previews') for path in (self.workspace / folder).rglob('*') if path.is_file()}
        if declared != actual: errors.append('Manifest does not cover exact generated file set')
        glb = self.workspace / 'candidate' / (self.asset + '.glb')
        if glb.is_file():
            doc, binary = parse_glb(glb)
            primitives = [p for mesh in doc.get('meshes', []) for p in mesh['primitives']]
            triangles = sum(doc['accessors'][p['indices']]['count'] // 3 for p in primitives)
            if triangles > budgets.get('triangles', 30000): errors.append('Triangle budget exceeded')
            if len(primitives) > budgets.get('primitives', 24): errors.append('Draw primitive budget exceeded')
            if len(doc.get('materials', [])) > budgets.get('materials', 12): errors.append('Material budget exceeded')
            if glb.stat().st_size > budgets.get('maxBytes', 8_000_000): errors.append('GLB byte budget exceeded')
            if any('uri' in entry for entry in doc.get('buffers', []) + doc.get('images', [])): errors.append('External GLB resources are forbidden')
            if profile.get('quality', {}).get('requireEmbeddedTextures') and not doc.get('images'): errors.append('Required embedded textures are missing')
            required_nodes = profile.get('quality', {}).get('requireNamedParts', [])
            node_names = {node.get('name') for node in doc.get('nodes', [])}
            if any(name not in node_names for name in required_nodes): errors.append('Required named attachment/articulation part is missing')
            if triangles != manifest['geometry']['triangles']: errors.append('Source/export triangle counts differ')
            if any('TEXCOORD_0' not in p['attributes'] for p in primitives): errors.append('Mesh UVs missing')
            if profile['workflow'] == 'pixel_3d':
                for sampler in doc.get('samplers', []):
                    if sampler.get('magFilter') != 9728 or sampler.get('minFilter') != 9728: errors.append('Pixel texture sampler must use nearest filtering')
                allowed = set(palette_rgb(profile['palette']['colors']))
                for mat in doc.get('materials', []):
                    texture = mat.get('pbrMetallicRoughness', {}).get('baseColorTexture')
                    if texture is None: continue
                    source = doc['textures'][texture['index']]['source']; image = doc['images'][source]
                    view = doc['bufferViews'][image['bufferView']]; start = view.get('byteOffset', 0)
                    _, _, pixels = read_png(binary[start:start + view['byteLength']])
                    if any(tuple(pixels[i:i + 3]) not in allowed for i in range(0, len(pixels), 4)): errors.append('Pixel albedo escapes master palette')
        elif profile['workflow'] != 'pixel_2d': errors.append('Runtime GLB missing')
        if profile['workflow'] == 'pixel_2d':
            settings = profile.get('sprites', {}); allowed = set(palette_rgb(profile['palette']['colors']))
            frames = sorted((self.workspace / 'candidate').glob('facing-*.png'))
            if {frame.name for frame in frames} != {f'facing-{index:03}.png' for index in range(settings.get('facings', 8))}: errors.append('Facing frame set mismatch')
            for frame in frames:
                width, height, pixels = read_png(frame)
                if [width, height] != settings.get('size', [96, 96]): errors.append('Native sprite dimensions differ')
                if not any(pixels[index + 3] for index in range(0, len(pixels), 4)): errors.append('Sprite is fully transparent')
                for i in range(0, len(pixels), 4):
                    if pixels[i + 3] not in (0, 255): errors.append('Sprite alpha is not binary'); break
                    if pixels[i + 3] and tuple(pixels[i:i + 3]) not in allowed: errors.append('Sprite escapes master palette'); break
                border = list(range(width)) + list(range((height - 1) * width, height * width)) + [y * width for y in range(height)] + [y * width + width - 1 for y in range(height)]
                if any(pixels[p * 4 + 3] for p in border): errors.append('Sprite touches frame edge; transparent padding required')
        report = {'passed': not errors, 'at': now(), 'errors': sorted(set(errors)), 'fingerprint': manifest['fingerprint']}
        write(self.workspace / 'validation.json', report)
        if errors: raise RuntimeError('; '.join(report['errors']))
        return report

    def review(self, decision, reviewer, notes, engine_check='not-performed'):
        if not reviewer.strip(): raise ValueError('A named reviewer is required')
        if len(notes.strip()) < 25: raise ValueError('Record at least 25 characters of actual visual findings')
        if decision not in ('approve', 'reject'): raise ValueError('Decision must be approve or reject')
        self.validate(); manifest = read(self.manifest_path)
        record = {'schemaVersion': 1, 'decision': decision, 'reviewer': reviewer, 'notes': notes, 'scope': 'studio renders; engine acceptance recorded separately', 'engineCheck': engine_check, 'reviewedAt': now(), 'fingerprint': manifest['fingerprint']}
        archive = self.workspace / ('reviewed' if decision == 'approve' else 'rejected') / manifest['fingerprint']
        archive.mkdir(parents=True, exist_ok=True)
        for entry in manifest['files']:
            target = member(archive, entry['path']); target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists() and sha(target) != entry['sha256']: raise RuntimeError('Immutable review archive differs from candidate')
            if not target.exists(): shutil.copy2(member(self.workspace, entry['path']), target)
        write(archive / 'manifest.json', manifest)
        write(archive / 'review.json', record)
        write(self.workspace / 'reviews' / (manifest['fingerprint'] + '.json'), record)
        return record

    def publish(self):
        self.validate(); manifest = read(self.manifest_path)
        record_path = self.workspace / 'reviews' / (manifest['fingerprint'] + '.json')
        if not record_path.is_file(): raise RuntimeError('Exact candidate requires a visual review before publication')
        record = read(record_path)
        if record['decision'] != 'approve' or record['fingerprint'] != manifest['fingerprint']: raise RuntimeError('Candidate lacks matching visual approval')
        archive = self.workspace / 'reviewed' / manifest['fingerprint']
        check_snapshot(archive, manifest, record, 'Reviewed source/evidence snapshot')
        root = self.root / 'published' / self.profile['id'] / self.asset
        release = root / manifest['fingerprint']
        if release.exists():
            check_snapshot(release, manifest, record, 'Published immutable release changed')
        else: shutil.copytree(archive, release)
        current = {'schemaVersion': 1, 'profileId': self.profile['id'], 'assetId': self.asset, 'fingerprint': manifest['fingerprint'], 'release': manifest['fingerprint'], 'runtime': [manifest['fingerprint'] + '/' + f['path'] for f in manifest['files'] if f['role'] == 'candidate' and f['path'].endswith('.png' if manifest['workflow'] == 'pixel_2d' else '.glb')], 'publishedAt': now(), 'review': record}
        write(root / 'current.json', current)
        return current
