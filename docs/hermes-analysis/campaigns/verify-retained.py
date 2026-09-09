"""Read-back verification: byte manifests, scoped TypeScript, all eight traces."""
from pathlib import Path
import gzip, hashlib, json, subprocess
BASE=Path(__file__).resolve().parent
REPO=BASE.parents[2]
manifest=json.loads((BASE/'compression-manifest.json').read_text())
for entry in manifest:
    data=(BASE/entry['path']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==entry['compressedSha256']
    assert hashlib.sha256(gzip.decompress(data)).hexdigest()==entry['uncompressedSha256']
names=[r['name'] for r in json.loads((BASE/'aggregate.json').read_text())]
assert len(names)==8 and len(set(names))==8
check=subprocess.run(['pnpm','exec','tsc','--noEmit','-p',str(BASE/'tsconfig.json')],cwd=REPO,text=True,capture_output=True)
(BASE/'typecheck.log').write_text(check.stdout+check.stderr)
result={'compressionFilesVerified':len(manifest),'typecheckExitCode':check.returncode,'campaigns':[]}
for name in names:
    command=['pnpm','exec','tsx',str(BASE/'replay.ts'),str(BASE/'runs'/name)]
    p=subprocess.run(command,cwd=REPO,text=True,capture_output=True)
    (BASE/f'verified-{name}.json').write_text(p.stdout)
    if p.stderr: (BASE/f'verified-{name}.stderr.log').write_text(p.stderr)
    data=json.loads(p.stdout)
    result['campaigns'].append({'name':name,'command':command,'exitCode':p.returncode,**data})
result['totals']={'campaigns':len(result['campaigns']),'exactReplays':sum(r.get('exactFinalBytes',False) for r in result['campaigns']),'exactMidpointContinuations':sum(r.get('midpointFinalExact',False) for r in result['campaigns']),'saveLoadFailures':sum(bool(r['errors']) for r in result['campaigns']),'commandsReplayed':sum(r['replayedCommands'] for r in result['campaigns'])}
(BASE/'verification-manifest.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'typecheckExitCode':check.returncode,'compressionFilesVerified':len(manifest),'totals':result['totals']},indent=2))
# Deliberately nonzero: do not relabel reproducible save failures as passing gates.
raise SystemExit(1 if check.returncode or result['totals']['saveLoadFailures'] else 0)
