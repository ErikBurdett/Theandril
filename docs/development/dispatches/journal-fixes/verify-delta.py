"""Verify the bounded journal fixes against the untouched reviewed postimages."""
from pathlib import Path
import difflib
import hashlib
import json
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
BASELINE = Path('/tmp/journal-fixes-baseline-97wilyga')
REVIEW = Path('/tmp/theandril-dispatches-journal-review-WMUDLt')
ALLOWED = {
    'apps/web/src/updates/Journal.tsx',
    'apps/web/src/updates/journal.ts',
    'apps/web/src/updates/journal.test.ts',
    'apps/web/src/updates/validation.test.ts',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


review_hashes = json.loads((BASELINE / 'snapshot-hashes.json').read_text())
for name, expected in review_hashes.items():
    assert sha((REVIEW / name).read_bytes()) == expected, name
entries = [line.split('  ', 1) for line in (REVIEW / 'postimages.sha256').read_text().splitlines()]
changed = []
delta = []
postimages = []
for expected, name in entries:
    before = (BASELINE / name).read_bytes()
    after = (ROOT / name).read_bytes()
    assert sha(before) == expected, name
    postimages.append(f'{sha(after)}  {name}\n')
    if before != after:
        assert name in ALLOWED, name
        changed.append(name)
        delta.extend(difflib.unified_diff(before.decode().splitlines(True), after.decode().splitlines(True), fromfile=f'a/{name}', tofile=f'b/{name}'))
assert set(changed) == ALLOWED, changed
patch = ''.join(delta).encode()
with tempfile.TemporaryDirectory(prefix='journal-fixes-apply-') as directory:
    target = Path(directory)
    for name in changed:
        (target / name).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(BASELINE / name, target / name)
    subprocess.run(['git', 'apply', '--check', '-'], input=patch, cwd=target, check=True)
    subprocess.run(['git', 'apply', '-'], input=patch, cwd=target, check=True)
    for name in changed:
        assert (target / name).read_bytes() == (ROOT / name).read_bytes(), name

baseline = json.loads((BASELINE / 'baseline.json').read_text())
current = {name: sha((ROOT / name).read_bytes()) if (ROOT / name).is_file() else None for name in baseline}
all_changed = sorted(name for name in baseline if baseline[name] != current[name])
assert set(all_changed) == ALLOWED, all_changed
production = {name: digest for name, digest in baseline.items() if name.startswith(('apps/', 'packages/')) and name not in ALLOWED}
production_now = {name: current[name] for name in production}
assert production == production_now
old_evidence = {name: digest for name, digest in baseline.items() if name.startswith('docs/development/dispatches/')}
assert all(current[name] == digest for name, digest in old_evidence.items())
report = {
    'review_snapshot_intact': review_hashes,
    'reviewed_postimages_checked': len(entries),
    'changed_paths': changed,
    'all_baseline_files_checked': len(baseline),
    'all_baseline_changed_paths': all_changed,
    'other_apps_packages_files_unchanged': len(production),
    'other_apps_packages_baseline_manifest_sha256': sha(json.dumps(production, sort_keys=True).encode()),
    'other_apps_packages_current_manifest_sha256': sha(json.dumps(production_now, sort_keys=True).encode()),
    'original_dispatches_evidence_files_unchanged': len(old_evidence),
    'delta_applies_to_verified_original_postimages': True,
    'applied_delta_matches_current_bytes': True,
    'delta_sha256': sha(patch),
}
(OUT / 'journal-fixes.diff').write_bytes(patch)
(OUT / 'original-postimages.sha256').write_bytes((REVIEW / 'postimages.sha256').read_bytes())
(OUT / 'postimages.sha256').write_text(''.join(postimages))
(OUT / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
