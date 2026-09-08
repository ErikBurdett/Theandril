"""Read-only regression of the actual retained Blender source candidates.

No Blender render, candidate import, approval or publication is performed here.
The frozen factory PNG reader shipped with the source is the exercised decoder.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import unittest

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[3]
SOURCES = ROOT / 'assets/art/source/blender-battle'
SELECTED = [('effect.battle_melee', 3), ('effect.battle_projectile', 1),
            ('effect.battle_ember', 1), ('effect.battle_ward', 1),
            ('effect.battle_rally', 1), ('character.waykeeper', 2)]


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


spec = importlib.util.spec_from_file_location('retained_factory_png',
    SOURCES / 'effect.battle_melee/v3/dependencies/factory/png.py')
png = importlib.util.module_from_spec(spec)
spec.loader.exec_module(png)


class SourceEvidenceTests(unittest.TestCase):
    def test_complete_hash_checked_sources_and_actual_native_pixels(self):
        palette = {bytes.fromhex(value[1:]) for value in read(ROOT / 'assets/palettes/theandril-master.json')['colors']}
        for asset_id, version in SELECTED:
            with self.subTest(asset_id=asset_id):
                folder = SOURCES / asset_id / f'v{version}'
                manifest = read(folder / 'manifest.json')
                settings = read(folder / 'render-settings.json')
                self.assertEqual(manifest['status'], 'candidate')
                self.assertEqual(manifest['durationsMs'], [100] * 8)
                self.assertEqual(settings['timelineFps'], 10)
                self.assertEqual(manifest['clip']['loop'], False)
                self.assertEqual(manifest['clip']['direction'], 'se')
                self.assertGreater(settings['animatedObjects'], 0)
                self.assertEqual(manifest['paletteHash'], digest(ROOT / 'assets/palettes/theandril-master.json'))
                paths = [item['path'] for item in manifest['files']]
                self.assertEqual(len(paths), len(set(paths)))
                self.assertIn('source.blend', paths)
                self.assertIn('recipe.py', paths)
                self.assertIn('driver.py', paths)
                self.assertIn('dependencies/recipes/common.py', paths)
                for item in manifest['files']:
                    path = folder / item['path']
                    self.assertTrue(path.resolve().is_relative_to(folder.resolve()))
                    self.assertFalse(path.is_symlink())
                    self.assertEqual(path.stat().st_size, item['bytes'])
                    self.assertEqual(digest(path), item['sha256'])
                pixels_seen, raw_seen = set(), set()
                for index, frame in enumerate(manifest['frames']):
                    self.assertEqual(frame['index'], index)
                    self.assertEqual(frame['durationMs'], 100)
                    self.assertEqual(digest(folder / frame['path']), frame['sha256'])
                    width, height, pixels = png.read_png(folder / frame['path'])
                    self.assertEqual((width, height), (64, 64))
                    pixels_seen.add(hashlib.sha256(pixels).hexdigest())
                    raw_seen.add(digest(folder / frame['rawPath']))
                    occupied = 0
                    for at in range(0, len(pixels), 4):
                        self.assertIn(pixels[at + 3], (0, 255))
                        if pixels[at + 3]:
                            occupied += 1
                            self.assertIn(bytes(pixels[at:at + 3]), palette)
                            x, y = at // 4 % 64, at // 4 // 64
                            self.assertTrue(3 <= x <= 60 and 3 <= y <= 60)
                    self.assertGreater(occupied, 0)
                self.assertEqual(len(manifest['frames']), 8)
                self.assertEqual(len(pixels_seen), 8)
                self.assertEqual(len(raw_seen), 8)
                self.assertTrue(read(folder / 'validation.json')['ok'])

    def test_melee_scene_timing_revision_did_not_change_native_art(self):
        prior = read(SOURCES / 'effect.battle_melee/v2/manifest.json')
        current = read(SOURCES / 'effect.battle_melee/v3/manifest.json')
        self.assertEqual([f['sha256'] for f in prior['frames']], [f['sha256'] for f in current['frames']])
        for filename in ('review-1x.png', 'review-4x.png'):
            self.assertEqual(digest(SOURCES / 'effect.battle_melee/v2' / filename),
                             digest(SOURCES / 'effect.battle_melee/v3' / filename))

    def test_waykeeper_boots_and_ground_anchor_do_not_follow_casting_arm(self):
        folder = SOURCES / 'character.waykeeper/v2'
        settings = read(folder / 'render-settings.json')
        poses = settings['poses']
        self.assertEqual(len(poses), 8)
        for name in ('fixed boot -1', 'fixed boot 1', 'planted trouser -1', 'planted trouser 1'):
            objects = [next(obj for obj in pose['objects'] if obj['name'] == name) for pose in poses]
            self.assertTrue(all(obj == objects[0] for obj in objects))
        arm = [next(obj for obj in pose['objects'] if obj['name'] == 'left keyed forearm sleeve') for pose in poses]
        self.assertGreater(len({json.dumps(obj, sort_keys=True) for obj in arm}), 4)
        self.assertTrue(all(abs(a['x'] - 32) < .0001 and abs(a['y'] - 56) < .0001 for a in settings['anchorProof']))
        bounds = [frame['bounds'] for frame in read(folder / 'validation.json')['frames']]
        self.assertEqual({bound['bottom'] for bound in bounds}, {58})
        self.assertEqual({bound['y'] for bound in bounds}, {10})
        self.assertLess(min(bound['x'] for bound in bounds), bounds[0]['x'])

    def test_rejected_originals_are_retained_and_not_silently_relabelled(self):
        melee = SOURCES / 'effect.battle_melee/v1'
        self.assertFalse(read(melee / 'validation.json')['ok'])
        self.assertTrue((melee / 'source.blend').is_file())
        rejected = read(SOURCES / 'character.waykeeper/rejected-v1.json')
        self.assertEqual(rejected['decision'], 'rejected-for-native-contrast')
        self.assertEqual(rejected['manifestSha256'], digest(SOURCES / 'character.waykeeper/v1/manifest.json'))


if __name__ == '__main__':
    unittest.main()
