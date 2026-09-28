"""Isolated review checks: no helper main/inputs call and no real tracker paths."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('reviewed_tracker_helper', '/tmp/theandril-record-reinforcement-logistics.py')
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


class TrackerApplyReview(unittest.TestCase):
    def setUp(self):
        self.sandbox = tempfile.TemporaryDirectory(prefix='theandril-tracker-helper-review-')
        self.root = Path(self.sandbox.name)
        self.paths = {name: self.root / (name + '.json') for name in helper.NAMES}
        self.originals = {name: json.dumps({'before': name}).encode() for name in helper.NAMES}
        self.changes = {name: json.dumps({'after': name}).encode() for name in helper.NAMES}
        for name, path in self.paths.items():
            path.write_bytes(self.originals[name])
            path.chmod(0o640)
        self.evidence = self.root / 'evidence.json'
        self.evidence.write_bytes(b'{"passed":true}')
        self.captures = {str(self.evidence): self.evidence.read_bytes()}
        self.real_replace = Path.replace
        self.real_unlink = Path.unlink
        self.real_chmod = Path.chmod
        real_mkdtemp = tempfile.mkdtemp
        self.backup_patch = patch.object(helper.tempfile, 'mkdtemp', side_effect=lambda **kwargs: real_mkdtemp(dir=self.root, **kwargs))
        self.backup_patch.start()
        self.input_patch = patch.object(helper, 'inputs', side_effect=AssertionError('Real tracker input must not be read'))
        self.input_patch.start()

    def tearDown(self):
        self.input_patch.stop()
        self.backup_patch.stop()
        self.sandbox.cleanup()

    def apply(self):
        return helper.apply(self.paths, self.originals, self.changes, self.captures)

    def assertOriginals(self):
        for name, path in self.paths.items():
            self.assertEqual(path.read_bytes(), self.originals[name])

    def is_stage(self, path):
        return '.reinforcement-' in path.name

    def test_normal_apply_has_private_exact_backups_and_no_temporary_files(self):
        backup = Path(self.apply())
        self.assertTrue(backup.is_relative_to(self.root))
        for name, path in self.paths.items():
            self.assertEqual(path.read_bytes(), self.changes[name])
            self.assertEqual(path.stat().st_mode & 0o777, 0o640)
            saved = backup / (name + '.json')
            self.assertEqual(saved.read_bytes(), self.originals[name])
            self.assertEqual(saved.stat().st_mode & 0o777, 0o600)
        self.assertFalse(list(self.root.glob('.*.reinforcement-*')))

    def test_second_write_failure_restores_first_and_preserves_original_exception(self):
        failure = OSError('injected second replacement failure')
        def replace(path, target):
            if self.is_stage(path) and target == self.paths['projects']:
                raise failure
            return self.real_replace(path, target)
        with patch.object(Path, 'replace', replace), self.assertRaises(OSError) as caught:
            self.apply()
        self.assertIs(caught.exception, failure)
        self.assertOriginals()
        self.assertIn('Private tracker backups retained:', '\n'.join(failure.__notes__))

    def test_one_rollback_failure_does_not_prevent_another_restore(self):
        failure = OSError('injected third replacement failure')
        rollback_failure = PermissionError('injected projects rollback failure')
        def replace(path, target):
            if self.is_stage(path) and target == self.paths['issues']:
                raise failure
            if not self.is_stage(path) and target == self.paths['projects']:
                raise rollback_failure
            return self.real_replace(path, target)
        with patch.object(Path, 'replace', replace), self.assertRaises(OSError) as caught:
            self.apply()
        self.assertIs(caught.exception, failure)
        self.assertEqual(self.paths['actions'].read_bytes(), self.originals['actions'])
        self.assertEqual(self.paths['projects'].read_bytes(), self.changes['projects'])
        self.assertEqual(self.paths['issues'].read_bytes(), self.originals['issues'])
        self.assertIn('Rollback failed for projects: PermissionError: injected projects rollback failure', '\n'.join(failure.__notes__))

    def test_concurrently_changed_bytes_are_preserved(self):
        concurrent = b'{"concurrent":"actions"}'
        failure = OSError('injected third replacement failure')
        def replace(path, target):
            if self.is_stage(path) and target == self.paths['issues']:
                self.paths['actions'].write_bytes(concurrent)
                raise failure
            return self.real_replace(path, target)
        with patch.object(Path, 'replace', replace), self.assertRaises(OSError) as caught:
            self.apply()
        self.assertIs(caught.exception, failure)
        self.assertEqual(self.paths['actions'].read_bytes(), concurrent)
        self.assertEqual(self.paths['projects'].read_bytes(), self.originals['projects'])
        self.assertEqual(self.paths['issues'].read_bytes(), self.originals['issues'])
        self.assertIn('Rollback skipped concurrently changed bytes: actions', failure.__notes__)

    def test_change_while_staging_rollback_is_preserved(self):
        concurrent = b'{"concurrent":"during-rollback"}'
        failure = OSError('injected second replacement failure')
        def replace(path, target):
            if self.is_stage(path) and target == self.paths['projects']:
                raise failure
            return self.real_replace(path, target)
        def chmod(path, mode, *args, **kwargs):
            if path.parent == self.root and path.name.startswith('tmp'):
                self.paths['actions'].write_bytes(concurrent)
            return self.real_chmod(path, mode, *args, **kwargs)
        with patch.object(Path, 'replace', replace), patch.object(Path, 'chmod', chmod), self.assertRaises(OSError) as caught:
            self.apply()
        self.assertIs(caught.exception, failure)
        self.assertEqual(self.paths['actions'].read_bytes(), concurrent)
        self.assertIn('Rollback skipped concurrently changed bytes: actions', failure.__notes__)

    def test_cleanup_failure_is_attached_without_masking_original_failure(self):
        failure = OSError('injected second replacement failure')
        def replace(path, target):
            if self.is_stage(path) and target == self.paths['projects']:
                raise failure
            return self.real_replace(path, target)
        def unlink(path, *args, **kwargs):
            if path.name.startswith('.projects.json.reinforcement-'):
                raise PermissionError('injected staged cleanup failure')
            return self.real_unlink(path, *args, **kwargs)
        with patch.object(Path, 'replace', replace), patch.object(Path, 'unlink', unlink), self.assertRaises(OSError) as caught:
            self.apply()
        self.assertIs(caught.exception, failure)
        self.assertOriginals()
        self.assertIn('Staged cleanup failed for projects: PermissionError: injected staged cleanup failure', '\n'.join(failure.__notes__))

    def test_evidence_change_refuses_all_writes(self):
        self.evidence.write_bytes(b'{"passed":false}')
        with self.assertRaisesRegex(SystemExit, 'Evidence changed after preview validation'):
            self.apply()
        self.assertOriginals()


class CatalogueGuardReview(unittest.TestCase):
    def test_current_counts_pass_guard_and_stale_or_regrouped_counts_fail(self):
        source, published = 'a' * 40, 'b' * 40
        baseline = {
            'source': source, 'openReleaseGates': 15, 'allRecordsReconciled': True,
            'deliveredAcceptancePoints': 78, 'remainingAcceptancePoints': 49, 'totalAcceptancePoints': 127,
            'itemCount': 23, 'counts': {'completed': 6, 'in-progress': 13, 'pending': 4},
        }
        variants = [
            ({}, 'Live production setup not verified'),
            ({'deliveredAcceptancePoints': 68, 'totalAcceptancePoints': 117}, 'Expected 78 delivered'),
            ({'counts': {'completed': 7, 'in-progress': 12, 'pending': 4}}, 'Expected 23 catalogue items'),
            ({'itemCount': 24, 'counts': {'completed': 6, 'in-progress': 14, 'pending': 4}}, 'Expected 23 catalogue items'),
        ]
        for override, expected in variants:
            with self.subTest(override=override):
                roadmap = {**baseline, **override}
                records = {
                    'deployment': {'revision': published, 'sourceRevision': source, 'date': '2026-09-28', 'rulesVersion': 34, 'contentHash': '015468d1', 'game': helper.ORIGIN,
                        'actions': [{'name': name, 'headSha': published, 'status': 'completed', 'conclusion': 'success', 'id': i + 1} for i, name in enumerate(('Verify build', 'Publish development demo to Pages'))]},
                    'readback': {'revision': published, 'sourceRevision': source, 'origin': helper.ORIGIN, 'passed': True, 'errors': [], 'failedRequests': [], 'httpErrors': [], 'consoleErrors': [],
                        'checks': {'latestLedgerRevision': published, 'roadmap': roadmap, 'dispatch': {'source': source}, 'game': {'productionSetup': False, 'noDevelopmentHooks': True}}},
                    'pacing': {}, 'supplyBenchmark': {}, 'reinforcementBenchmark': {},
                }
                meta = {'source': source, 'published': published, 'date': '2026-09-28', **{key: {'fixtureKey': key} for key in records}}
                def git(*args):
                    if args[0] == 'rev-parse': return published
                    if args[0] == 'status': return ''
                    if args[0] == 'show' and args[1].endswith('/save.ts'): return 'SAVE_VERSION = 34;'
                    if args[0] == 'show' and args[1].endswith('/rules.ts'): return '?? 34;'
                    raise AssertionError('Unexpected Git request: ' + repr(args))
                with patch.object(helper, 'git', git), patch.object(helper.subprocess, 'run'), patch.object(helper, 'checks', return_value={}), patch.object(helper, 'verified', side_effect=lambda entry, *_: json.dumps(records[entry['fixtureKey']]).encode()):
                    with self.assertRaisesRegex(SystemExit, expected):
                        helper.release(meta, {})


if __name__ == '__main__':
    unittest.main(verbosity=2)
