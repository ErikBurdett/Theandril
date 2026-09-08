import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('battle_build', Path(__file__).with_name('build.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BattleSourceTests(unittest.TestCase):
    def frames(self):
        images = []
        for index in range(8):
            pixels = bytearray(64 * 64 * 4)
            at = (32 * 64 + 28 + index) * 4
            pixels[at:at + 4] = bytes((161, 175, 177, 255))
            images.append((64, 64, bytes(pixels)))
        return images

    def validate(self, frames, anchors=None):
        return module.validate_frames(frames, ['#a1afb1'], anchors or [{'x': 32, 'y': 32}] * 8)

    def test_distinct_registered_poses(self):
        self.assertTrue(self.validate(self.frames())['ok'])

    def test_repeated_static_frame_rejected(self):
        self.assertFalse(self.validate([self.frames()[0]] * 8)['ok'])

    def test_fractional_palette_padding_and_empty_rejected(self):
        for pixel in ((161, 175, 177, 128), (1, 2, 3, 255), (0, 0, 0, 0)):
            frames = self.frames()
            rgba = bytearray(64 * 64 * 4)
            rgba[:4] = bytes(pixel)
            frames[0] = (64, 64, bytes(rgba))
            self.assertFalse(self.validate(frames)['ok'])

    def test_anchor_drift_rejected(self):
        anchors = [{'x': 32, 'y': 32}] * 7 + [{'x': 32, 'y': 31.99}]
        self.assertFalse(self.validate(self.frames(), anchors)['ok'])

    def test_single_precision_camera_error_is_not_pixel_drift(self):
        anchors = [{'x': 32.0, 'y': 32.000027}] * 8
        result = self.validate(self.frames(), anchors)
        self.assertTrue(result['ok'])
        self.assertEqual(result['anchorDriftPixels'], 0)

    def test_declared_foot_anchor(self):
        anchors = [{'x': 32, 'y': 56}] * 8
        self.assertTrue(module.validate_frames(self.frames(), ['#a1afb1'], anchors, expected_anchor=(32, 56))['ok'])
        self.assertFalse(self.validate(self.frames(), anchors)['ok'])

    def test_immutable_collision(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'manifest.json'
            module.write_new(path, {'original': True})
            before = path.read_bytes()
            with self.assertRaises(FileExistsError):
                module.write_new(path, {'original': False})
            self.assertEqual(path.read_bytes(), before)

    def test_output_limits_and_symlink(self):
        with tempfile.TemporaryDirectory() as folder:
            for effect, version in [('../bad', 1), ('melee', 0), ('melee', True), ('melee', 1000)]:
                with self.assertRaises(ValueError):
                    module.output_path(folder, effect, version)
            (Path(folder) / 'assets').symlink_to(Path(folder), target_is_directory=True)
            with self.assertRaises(ValueError):
                module.output_path(folder, 'melee', 1)


if __name__ == '__main__':
    unittest.main()
