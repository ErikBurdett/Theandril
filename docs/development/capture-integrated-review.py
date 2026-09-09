"""Capture current uncommitted integration slices without staging or changing code."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/development/integrated-review'
OUT.mkdir(exist_ok=True)
SCOPES = {
    'backend': ['packages/sim', 'packages/chronicle', 'scripts/benchmark-roads.ts'],
    'ai': ['packages/ai'],
    'ui': ['apps/web/src', 'tests/gameplay/battle-defense.spec.ts', 'tests/gameplay/hermes-ui-slices.spec.ts', 'tests/gameplay/household-attention.spec.ts', 'tests/gameplay/household-fixture.ts'],
    'persistence': ['packages/persistence'],
}
PATTERNS = {
    'possible_secret': r'''(?i)(api_key|secret|password|token|passwd)\s*=\s*['\"][^'\"]{6,}['\"]''',
    'shell_injection': r'os\.system\(|subprocess.*shell=True',
    'eval_exec': r'\beval\(|\bexec\(',
    'unsafe_pickle': r'pickle\.loads?\(',
}

def git(*args: str, diff_exit: bool = False) -> str:
    result = subprocess.run(['git', *args], cwd=ROOT, text=True, capture_output=True)
    if result.returncode not in ((0, 1) if diff_exit else (0,)):
        raise RuntimeError(result.stderr)
    return result.stdout

manifest = {'head': git('rev-parse', 'HEAD').strip(), 'slices': {}}
for name, scope in SCOPES.items():
    tracked = git('diff', '--name-only', 'HEAD', '--', *scope).splitlines()
    untracked = git('ls-files', '--others', '--exclude-standard', '--', *scope).splitlines()
    files = sorted(set(tracked + untracked))
    diff = git('diff', 'HEAD', '--', *scope)
    for path in untracked:
        diff += git('diff', '--no-index', '--', '/dev/null', path, diff_exit=True)
    (OUT / f'{name}.diff').write_text(diff)
    added = '\n'.join(line[1:] for line in diff.splitlines() if line.startswith('+') and not line.startswith('+++'))
    matches = {category: [{'line': index + 1, 'text': line} for index, line in enumerate(added.splitlines()) if re.search(pattern, line)] for category, pattern in PATTERNS.items()}
    record = {'scope': scope, 'files': files, 'diffBytes': len(diff.encode()), 'sha256': {path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in files}, 'heuristicMatches': matches}
    manifest['slices'][name] = record
    (OUT / f'{name}.manifest.json').write_text(json.dumps(record, indent=2) + '\n')
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'head': manifest['head'], 'slices': {name: {'files': len(record['files']), 'diffBytes': record['diffBytes'], 'scanMatches': {k: len(v) for k, v in record['heuristicMatches'].items()}} for name, record in manifest['slices'].items()}}, indent=2))
