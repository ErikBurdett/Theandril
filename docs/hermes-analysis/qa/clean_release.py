"""Audit a committed archive without reusing or changing the working dependencies."""
import hashlib
import json
import os
import pathlib
import subprocess
import tarfile
import tempfile
import time

ROOT = pathlib.Path('/home/telephoneheater/Work/Theandril')
OUT = ROOT / 'docs/hermes-analysis/qa'
results = []
with tempfile.TemporaryDirectory(prefix='clean-release-', dir=OUT) as directory:
    checkout = pathlib.Path(directory)
    archive = subprocess.Popen(['git', 'archive', 'b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd'], cwd=ROOT, stdout=subprocess.PIPE)
    with tarfile.open(fileobj=archive.stdout, mode='r|') as source:
        source.extractall(checkout, filter='data')
    if archive.wait():
        raise RuntimeError('git archive failed')
    env = os.environ.copy()
    env.pop('NODE_OPTIONS', None)
    env.pop('VITE_BASE_PATH', None)
    for name, command in [
        ('install', ['pnpm', 'install', '--offline', '--frozen-lockfile']),
        ('typecheck', ['pnpm', 'typecheck']),
        ('lint', ['pnpm', 'lint']),
        ('content', ['pnpm', 'content:validate']),
        ('build', ['pnpm', 'exec', 'turbo', 'run', 'build', '--force']),
    ]:
        started = time.time()
        target = OUT / 'logs' / ('clean-' + name + '.log')
        with target.open('w') as log:
            log.write('CHECKOUT: committed git archive; no node_modules, cache, or untracked files\nCOMMAND: ' + ' '.join(command) + '\n')
            log.flush()
            status = subprocess.call(command, cwd=checkout, env=env, stdout=log, stderr=subprocess.STDOUT)
        result = {'name': name, 'command': command, 'exitCode': status, 'durationSeconds': time.time() - started, 'log': str(target)}
        results.append(result)
        print(json.dumps(result), flush=True)
        if name == 'install' and status != 0:
            break
    if (checkout / 'apps/web/dist').exists():
        files = []
        for file in sorted((checkout / 'apps/web/dist').rglob('*')):
            if file.is_file():
                data = file.read_bytes()
                files.append({'path': file.relative_to(checkout / 'apps/web/dist').as_posix(), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        (OUT / 'clean-build-manifest.json').write_text(json.dumps(files, indent=2) + '\n')
(OUT / 'clean-release.json').write_text(json.dumps({'revision': 'b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd', 'node': subprocess.check_output(['node', '--version'], text=True).strip(), 'scope': 'Fresh full committed archive and fresh node_modules; offline package store reused, host Node26 not CI Node22. Temporary tree removed after execution. No unit/browser tests rerun inside clean archive.', 'checks': results}, indent=2) + '\n')
raise SystemExit(1 if any(item['exitCode'] != 0 for item in results) else 0)
