"""Capture post-fix backend/storage review bytes without touching the worktree."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/development/post-fix-review'
SCOPES = {
    'backend': ['packages/sim', 'packages/chronicle', 'scripts/benchmark-roads.ts'],
    'persistence': ['packages/persistence'],
}
PATTERNS = {
    'possible_secret': r'''(?i)(api_key|secret|password|token|passwd)\s*=\s*['\"][^'\"]{6,}['\"]''',
    'shell_injection': r'os\.system\(|subprocess.*shell=True',
    'eval_exec': r'\beval\(|\bexec\(',
    'unsafe_pickle': r'pickle\.loads?\(',
    'sql_interpolation': r'''execute\(f["']|\.format\(.*(?:SELECT|INSERT)''',
}


def git(*args: str, allowed: tuple[int, ...] = (0,)) -> subprocess.CompletedProcess[bytes]:
    result = subprocess.run(['git', '-c', 'color.ui=false', *args], cwd=ROOT, capture_output=True)
    if result.returncode not in allowed:
        raise RuntimeError(result.stderr.decode('utf-8', errors='replace'))
    return result


def names(raw: bytes) -> list[str]:
    return [name.decode('utf-8') for name in raw.split(b'\0') if name]


def hashes(files: list[str]) -> dict[str, str]:
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in files}


def main() -> None:
    OUT.mkdir(exist_ok=False)
    head = git('rev-parse', 'HEAD').stdout.decode('ascii').strip()
    summary = {'head': head, 'slices': {}}
    for label, scope in SCOPES.items():
        tracked = names(git('diff', '--name-only', '-z', 'HEAD', '--', *scope).stdout)
        untracked = names(git('ls-files', '--others', '--exclude-standard', '-z', '--', *scope).stdout)
        files = sorted(set(tracked + untracked))
        assert files and all((ROOT / name).is_file() for name in files)
        before = hashes(files)
        chunks = [git('diff', '--binary', '--no-ext-diff', '--no-textconv', '--no-renames', 'HEAD', '--', *scope).stdout]
        chunks.extend(git('diff', '--no-index', '--binary', '--no-ext-diff', '--no-textconv', '--', '/dev/null', name, allowed=(1,)).stdout for name in untracked)
        assert all(not chunk or chunk.endswith(b'\n') for chunk in chunks)
        diff = b''.join(chunks)
        target = OUT / f'{label}.diff'
        target.write_bytes(diff)
        parsed = git('apply', '--numstat', str(target))
        rows = parsed.stdout.decode('utf-8').splitlines()
        assert sorted(row.split('\t', 2)[2] for row in rows) == files
        reverse = git('apply', '--reverse', '--check', str(target))
        assert hashes(files) == before
        added = [line[1:] for line in diff.decode('utf-8').splitlines() if line.startswith('+') and not line.startswith('+++')]
        matches = {category: [{'addedLine': index + 1, 'text': line} for index, line in enumerate(added) if re.search(pattern, line)] for category, pattern in PATTERNS.items()}
        manifest = {'scope': scope, 'head': head, 'files': files, 'diffBytes': len(diff), 'diffSha256': hashlib.sha256(diff).hexdigest(), 'sha256': before, 'heuristicMatches': matches, 'parseExitCode': parsed.returncode, 'reverseCheckExitCode': reverse.returncode, 'sourceChangesDuringCapture': [], 'limits': 'Read-only byte-faithful capture, not independent approval; no AI/contact execution.'}
        (OUT / f'{label}.manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
        summary['slices'][label] = {'files': len(files), 'diffBytes': len(diff), 'parseExitCode': parsed.returncode, 'reverseCheckExitCode': reverse.returncode, 'heuristicMatchCounts': {k: len(v) for k, v in matches.items()}}
    (OUT / 'manifest.json').write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
