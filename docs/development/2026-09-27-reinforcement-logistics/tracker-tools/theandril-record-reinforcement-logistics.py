#!/usr/bin/env python3
"""Offline reviewed progress recorder. Preview by default; no network/build/inventory.
Only --apply with the exact preview seal writes three tracker files atomically
per file, with backups and guarded rollback. Resources are read-only inventory.
"""
import argparse
from copy import deepcopy
from datetime import date
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

REPO = Path('/home/telephoneheater/Work/Theandril')
TRACKER = Path('/home/telephoneheater/Projects/DHARMA/dharma-tracker/data')
PACKET = 'docs/development/2026-09-27-reinforcement-logistics/'
ORIGIN = 'https://erikburdett.github.io/Theandril/'
NAMES = ('actions', 'projects', 'issues')
ANSI = re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')

def require(ok, message):
    if not ok: raise SystemExit(message)

def sha(raw): return hashlib.sha256(raw).hexdigest()
def encoded(value): return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()
def git(*args): return subprocess.check_output(['git', *args], cwd=REPO).decode().rstrip('\n')
def one(rows, key):
    found = [row for row in rows if row.get('id') == key]
    require(len(found) == 1, 'Expected one record: ' + key)
    return found[0]

def inputs():
    paths = {n: TRACKER / (n + '.json') for n in NAMES}
    require(all(p.is_file() and not p.is_symlink() for p in paths.values()), 'Unsafe tracker source.')
    raw = {n: p.read_bytes() for n, p in paths.items()}
    data = {n: json.loads(v) for n, v in raw.items()}
    actions, issues = data['actions']['actions'], data['issues']['issues']
    roadmap = one(data['projects']['projects'], 'Theandril')['roadmap']
    for key, expected in [('ACT-32', 'doing'), ('ACT-33', 'doing'), ('ACT-38', 'backlog'), ('ACT-36', 'done')]:
        require(one(actions, key)['status'] == expected, 'Action status changed: ' + key)
    for key, expected in [('DH-021', 'open'), ('DH-020', 'resolved')]:
        require(one(issues, key)['status'] == expected, 'Issue status changed: ' + key)
    require(all(one(roadmap['milestones'], key)['status'] == 'in-progress' for key in ['M3', 'M4']), 'Milestone status changed.')
    resources = json.loads((TRACKER / 'resources.json').read_bytes())
    require(any(r.get('project') == 'Theandril' and r.get('service') == 'GitHub Pages' and r.get('url') == ORIGIN for r in resources['resources']), 'Pages inventory identity changed.')
    return paths, raw, data

def verified(entry, revisions, captures):
    path = Path(entry['path'])
    require(not path.is_absolute() and '..' not in path.parts and path.as_posix().startswith(PACKET), 'Evidence must be in the packet.')
    full = REPO / path
    require(full.is_file() and not full.is_symlink() and full.resolve().is_relative_to(REPO), 'Unsafe evidence path.')
    raw = full.read_bytes()
    require(sha(raw) == entry['sha256'], 'Evidence hash mismatch: ' + str(path))
    pin = entry['pin']
    require(pin in ('source', 'published', 'live'), 'Unknown evidence pin.')
    if pin != 'live':
        require(raw == subprocess.check_output(['git', 'show', revisions[pin] + ':' + str(path)], cwd=REPO), 'Evidence differs from immutable pin: ' + str(path))
    captures[str(full)] = raw
    return raw

def clean_log(raw):
    text = ANSI.sub('', raw.decode())
    bad = r'(?mi)^\s*(?:(?:Test Files|Tests)\s+[^\n]*[1-9]\d* (?:failed|skipped|todo)|[1-9]\d* (?:failed|flaky|skipped|interrupted|timed out|did not run)|FAIL\b|(?:Error|TimeoutError):)|Unhandled (?:Rejection|Exception|Error)|Retry #[0-9]|\(retry #[0-9]'
    require(not re.search(bad, text), 'Final log contains failure, partial scope or retry.')
    return text

def checks(meta, revisions, captures):
    rows = meta['checks']; required = {'implementation', 'publication', 'affected', 'production', 'localPages', 'livePages', 'compatibility'}
    require({r['scope'] for r in rows} == required and len(rows) == len(required), 'Require seven distinct final verification scopes.')
    totals, identities = {}, {}
    for row in rows:
        pins = {'implementation': ('source',), 'compatibility': ('source',), 'publication': ('published',), 'localPages': ('published',), 'livePages': ('live',), 'affected': ('source','published'), 'production': ('source','published')}
        require(row['pin'] in pins[row['scope']], 'Verification scope has the wrong immutable pin.')
        text = clean_log(verified(row, revisions, captures)); count = row['passed']
        require(type(count) is int and count > 0, 'Final test count required.')
        if row['kind'] == 'headless':
            found = re.findall(r'^\s*Tests\s+(\d+) passed \((\d+)\)\s*$', text, re.M)
            files = re.findall(r'^\s*Test Files\s+(\d+) passed \((\d+)\)\s*$', text, re.M)
            require(found == [(str(count), str(count))] and files == [(str(row['files']), str(row['files']))], 'Headless count mismatch.')
        else:
            require(row['kind'] == 'browser', 'Unknown check kind.')
            starts = re.findall(r'^Running (\d+) tests? using \d+ workers?\s*$', text, re.M)
            ends = re.findall(r'^\s*(\d+) passed(?: \([^\n]+\))?\s*$', text, re.M)
            names = re.findall(r'^\s*[✓✔]\s+\d+\s+(tests/\S+\.spec\.ts):\d+:\d+\s+›\s+(.+?)\s+\([^()\n]+\)\s*$', text, re.M)
            identities[row['scope']] = set(names)
            require(starts == [str(count)] and ends == [str(count)] and len(names) == len(set(names)) == count, 'Browser scope is incomplete or contains duplicate cases.')
        totals[row['scope']] = count
    require(totals['localPages'] == totals['livePages'] and identities['localPages'] == identities['livePages'], 'Local/live Pages identities differ.')
    return totals

def release(meta, captures):
    rev = {k: meta[k] for k in ('source', 'published')}
    require(all(isinstance(s,str) and re.fullmatch('[0-9a-f]{40}', s) for s in rev.values()), 'Full source/published commit IDs required.')
    require(git('rev-parse', 'HEAD') == git('rev-parse', 'origin/master') == rev['published'], 'HEAD and fetched origin/master must equal publication.')
    subprocess.run(['git', 'merge-base', '--is-ancestor', rev['source'], rev['published']], cwd=REPO, check=True)
    for line in git('status', '--porcelain').splitlines():
        path = line[3:] if len(line) >= 3 else ''
        require(path.startswith(PACKET) or path == 'docs/IMPLEMENTATION_STATUS.md', 'Unexpected working-tree change: ' + path)
    require('SAVE_VERSION = 34;' in git('show', rev['source'] + ':packages/sim/src/save.ts'), 'Implementation save version is not34.')
    require('?? 34;' in git('show', rev['source'] + ':packages/sim/src/rules.ts'), 'Implementation rules are not34.')
    totals = checks(meta, rev, captures)
    records = {key: json.loads(verified(meta[key], rev, captures)) for key in ('deployment', 'readback', 'pacing', 'supplyBenchmark', 'reinforcementBenchmark')}
    dep, live = records['deployment'], records['readback']
    require(dep['revision'] == live['revision'] == rev['published'] and dep['sourceRevision'] == live['sourceRevision'] == rev['source'], 'Deployment/readback pins differ.')
    require(dep['date'] == meta['date'], 'Deployment date differs.')
    require(dep['rulesVersion'] == 34 and dep['contentHash'] == '015468d1' and dep['game'] == live['origin'] == ORIGIN, 'Deployment rules/content/origin differ.')
    for name in ('Verify build', 'Publish development demo to Pages'):
        runs = [r for r in dep['actions'] if r['name'] == name]
        require(len(runs) == 1 and runs[0]['headSha'] == rev['published'] and runs[0]['status'] == 'completed' and runs[0]['conclusion'] == 'success' and type(runs[0]['id']) is int and runs[0]['id'] > 0, 'Exact successful workflow identity required.')
    require(live['passed'] is True and all(live[k] == [] for k in ('errors', 'failedRequests', 'httpErrors', 'consoleErrors')), 'Live readback failed.')
    observed = live['checks']; roadmap = observed['roadmap']
    require(observed['latestLedgerRevision'] == rev['published'] and roadmap['source'] == observed['dispatch']['source'] == rev['source'], 'Live source pin mismatch.')
    require(roadmap['openReleaseGates'] == 15 and roadmap['allRecordsReconciled'] is True and roadmap['totalAcceptancePoints'] == roadmap['deliveredAcceptancePoints'] + roadmap['remainingAcceptancePoints'], 'Roadmap reconciliation/gates differ.')
    require(sum(roadmap['counts'].values()) == roadmap['itemCount'], 'Catalogue counts differ.')
    require((roadmap['deliveredAcceptancePoints'], roadmap['remainingAcceptancePoints'], roadmap['totalAcceptancePoints']) == (78, 49, 127), 'Expected 78 delivered and 49 remaining editorial statements, 127 total.')
    require(roadmap['itemCount'] == 23 and roadmap['counts'] == {'completed': 6, 'in-progress': 13, 'pending': 4}, 'Expected 23 catalogue items with unchanged 6/13/4 statuses.')
    require(observed['game']['productionSetup'] is True and observed['game']['noDevelopmentHooks'] is True, 'Live production setup not verified.')
    assets = observed['game']['exactBuiltAssets']; require(any('simulation.worker-' in a['path'] for a in assets), 'Missing exact live worker evidence.')
    require(sha((REPO / 'apps/web/dist/index.html').read_bytes()) == observed['game']['htmlSha256'], 'Live HTML differs from reviewed build.')
    for asset in assets + [observed['dispatch']['image']]:
        path = Path(asset['path']); require(not path.is_absolute() and '..' not in path.parts, 'Unsafe asset path.')
        raw = (REPO / 'apps/web/dist' / path).read_bytes()
        require(len(raw) == asset['bytes'] and sha(raw) == asset['sha256'], 'Live asset differs from reviewed build.')
    for key in ('supplyBenchmark', 'reinforcementBenchmark', 'pacing'):
        require(meta[key]['pin'] == 'source' and not any(word in Path(meta[key]['path']).name for word in ('initial','smoke','defect','concurrent')), 'Require final performance evidence at implementation source.')
    sb, rb = records['supplyBenchmark'], records['reinforcementBenchmark']
    require(sb['rulesVersion'] == rb['saveVersion'] == 34 and sb['contentHash'] == rb['contentHash'] == '015468d1', 'Benchmark version mismatch.')
    require(sb['smoke'] is False and sb['aiOnly'] is False and sb['warmups'] == 1 and sb['measuredSamples'] == 3 and len(sb['workloads']) == 2, 'Supply timings are incomplete or smoke.')
    require(len(rb['scenarios']) == 4 and all(r['reinforcement'] is True and r['warmups'] == 1 and r['measuredSamples'] == 3 for r in rb['scenarios']), 'Reinforcement timings incomplete.')
    require({r['size'] for r in sb['workloads']} == {'huge','legendary'} and all(r['measuredBuyers'] == 1 and r['activeImports'] == 8 for r in sb['workloads']), 'Supply workload scope differs.')
    require({(r['size'],r['workload']) for r in rb['scenarios']} == {(s,w) for s in ('huge','legendary') for w in ('representative','ceiling')}, 'Reinforcement workload scope differs.')
    for path, digest in sb['sourceFingerprints'].items():
        require(sha(subprocess.check_output(['git','show',rev['source']+':'+path],cwd=REPO)) == digest, 'Measured supply source differs from implementation: '+path)
    pacing = records['pacing']['results']
    identities = {(r['rulesVersion'],r['seed'],r['pace']) for r in pacing}
    require(len(pacing) == len(identities) == 18 and all(r['rulesVersion'] in (33,34) and r['size'] == 'standard' and r['seats'] == 12 and r['path'] in ('prosperity','unification') for r in pacing), 'Require eighteen complete distinct matched33/34 headline-map pacing rows.')
    seeds = {r['seed'] for r in pacing}
    require(len(seeds) == 3 and 20260905 in seeds and identities == {(v,s,p) for v in (33,34) for s in seeds for p in ('standard','long','epic')}, 'Require three seeds and three paces paired across33/34.')
    headline = [r for r in pacing if r['seed'] == 20260905 and r['rulesVersion'] == 34]
    baseline = [r for r in pacing if r['seed'] == 20260905 and r['rulesVersion'] == 33]
    return rev, totals, roadmap, headline, baseline

def preview(meta, raw, before, captures):
    require(meta['inputHashes'] == {n: sha(v) for n, v in raw.items()}, 'Tracker input changed: refresh template and review.')
    day = date.fromisoformat(meta['date']).isoformat(); rev, totals, road, headline, baseline = release(meta, captures)
    evidence = f"Source {rev['source']}; publication {rev['published']}. Evidence: ~/Work/Theandril/{PACKET}"
    verification = f"Separate verification scopes: implementation {totals['implementation']}, publication {totals['publication']}, affected browser {totals['affected']}, built production {totals['production']}, local/live Pages {totals['localPages']}/{totals['livePages']}, compatibility {totals['compatibility']}. These overlapping counts are not additive."
    policy = 'Rules/save 34 adds opt-in visible-threat reinforcement with bounded quiet-turn holds, preserving physical minimum guards and direct-order priority. Joined authored mature-realm controls, partial refusals and exact AI-inclusive saved continuation are verified. Patrol/escort roles, reusable army-order templates, broader governors and organic-scale acceptance remain.'
    access = 'Rules/save 34 adds paid source-specific foreign supply access through ordinary proposals and acceptance. Fees pay once on acceptance; imported land/harbor supply retains ordinary blockade, ownership, war and expiry constraints. Participant-only disclosures, AI fee reserves, save/replay and uncertain-payment recovery are verified. This grants no movement rights. Trade routes/interception, taxation, material supply costs and broader coordinated operations remain.'
    pace = '; '.join(f"{r['pace'].capitalize()} {r['turn']} turns, {r['refused']} submitted refusals, {r['automaticRefusals']} automatic blocked routes" for r in sorted(headline, key=lambda r: ['standard','long','epic'].index(r['pace'])))
    frozen = '; '.join(f"{r['pace'].capitalize()} {r['turn']} turns" for r in sorted(baseline,key=lambda r:['standard','long','epic'].index(r['pace'])))
    pacing = f"Final rules 34 headline standard-map/12-realm/seed20260905 measurements: {pace}. Matched frozen rules 33 headline results: {frozen}. The report contains eighteen runs: nine configurations, each under 33 and 34. Counters and seeds remain distinct. No target-band acceptance or price change is inferred. ACT-38 and DH-021 stay open."
    after = deepcopy(before)
    def update(row, note, **fields):
        require(not any(rev['published'] in h.get('note', '') for h in row.get('history', [])), 'Publication already recorded; refuse duplicate apply.')
        row.update(fields, updated=day); row.setdefault('history', []).append({'date': day, 'status': row['status'], 'note': note})
    for key, text in [('ACT-32', policy), ('ACT-33', access)]:
        update(one(after['actions']['actions'], key), f'{text} {verification} {evidence} All 15 release gates remain open.', why=text, fix=text, prompt=f'Repository: ~/Work/Theandril. Read {PACKET}README.md and docs/1.0-DEVELOPMENT.md. {text} Preserve deterministic canonical commands, fog, direct overrides and frozen histories. Keep M3/M4 in progress and all 15 gates open. {evidence}')
    update(one(after['actions']['actions'], 'ACT-38'), pacing + ' ' + evidence, why=pacing, prompt=f'Repository: ~/Work/Theandril. Read {PACKET}README.md and {meta["pacing"]["path"]}. {pacing} Preserve frozen packs; evaluate headline and multi-seed evidence before a deliberately authorized repricing or target revision.')
    update(one(after['issues']['issues'], 'DH-021'), pacing + ' ' + evidence, summary=pacing, issue=pacing + ' ' + evidence, consequence='Headline and multi-seed campaign behavior still require reconciliation with stated pace targets.', fix='Assess the retained final headline and multi-seed measurements before deliberately repricing a new sealed pack or revising target descriptions; preserve historical packs and keep this issue open.', prompt=f'Repository: ~/Work/Theandril. Read {PACKET}README.md and {meta["pacing"]["path"]}. {pacing} Keep this issue open until advertised targets and measured behavior agree. Do not tune tiny proxies or silently change frozen content.')
    roadmap = one(after['projects']['projects'], 'Theandril')['roadmap']
    roadmap.update(done=road['deliveredAcceptancePoints'], total=road['totalAcceptancePoints'], updated=day, note=f"{road['counts']['completed']} of {road['itemCount']} catalogue items complete; all 15 gates open. Counts are editorial catalogue bullets, not a fixed-scope completion percentage or release acceptance. ACT-32/M3 and ACT-33/M4 remain in progress.")
    for key, text in [('M3', policy), ('M4', access)]: one(roadmap['milestones'], key)['detail'] = text + ' ' + verification + ' ' + evidence + (' ' + pacing if key == 'M4' else '')
    changes = {n: encoded(after[n]) for n in NAMES}
    proposal = {'date': day, **rev, 'helperSha256': sha(Path(__file__).read_bytes()), 'metadataSha256': sha(encoded(meta)), 'inputHashes': {n: sha(v) for n,v in raw.items()}, 'outputHashes': {n:sha(v) for n,v in changes.items()}, 'evidenceHashes': {str(Path(p).relative_to(REPO)):sha(v) for p,v in captures.items()}, 'changedRecords': {k:one(after['actions']['actions'],k) for k in ('ACT-32','ACT-33','ACT-38')}, 'issue':one(after['issues']['issues'],'DH-021'), 'roadmap':roadmap, 'preserved':['ACT-36 done','DH-020 resolved','all other records and unmodified fields','resources.json untouched']}
    return proposal, changes

def apply(paths, originals, changes, captures):
    require(all(Path(p).read_bytes() == v for p,v in captures.items()), 'Evidence changed after preview validation.')
    backup = Path(tempfile.mkdtemp(prefix='theandril-reinforcement-tracker-')); staged, written = {}, []
    original_error = None
    try:
        for n,p in paths.items():
            with (backup / (n+'.json')).open('xb') as out: out.write(originals[n]); out.flush(); os.fsync(out.fileno())
            (backup / (n+'.json')).chmod(0o600)
            with tempfile.NamedTemporaryFile(dir=p.parent, prefix='.'+p.name+'.reinforcement-', delete=False) as out:
                staged[n] = Path(out.name)
                out.write(changes[n]); out.flush(); os.fsync(out.fileno()); os.chmod(out.name,p.stat().st_mode & 0o777)
        for n,p in paths.items():
            require(all(paths[k].read_bytes() == (changes[k] if k in written else originals[k]) for k in NAMES), 'Concurrent tracker change.')
            staged[n].replace(p); written.append(n)
        require(all(paths[n].read_bytes()==changes[n] for n in NAMES), 'Post-write verification failed.')
    except BaseException as error:
        original_error = error
        error.add_note('Private tracker backups retained: ' + str(backup))
        for n in reversed(written):
            restore = None
            try:
                if paths[n].read_bytes() != changes[n]:
                    error.add_note('Rollback skipped concurrently changed bytes: ' + n)
                    continue
                with tempfile.NamedTemporaryFile(dir=paths[n].parent, delete=False) as out:
                    restore = Path(out.name)
                    out.write(originals[n]); out.flush(); os.fsync(out.fileno())
                restore.chmod(paths[n].stat().st_mode & 0o777)
                if paths[n].read_bytes() == changes[n]:
                    restore.replace(paths[n])
                else:
                    error.add_note('Rollback skipped concurrently changed bytes: ' + n)
            except BaseException as rollback_error:
                error.add_note(f'Rollback failed for {n}: {type(rollback_error).__name__}: {rollback_error}')
            finally:
                if restore is not None:
                    try: restore.unlink(missing_ok=True)
                    except BaseException as cleanup_error:
                        error.add_note(f'Rollback cleanup failed for {n}: {type(cleanup_error).__name__}: {cleanup_error}')
        raise
    finally:
        cleanup_errors = []
        for n, p in staged.items():
            try: p.unlink(missing_ok=True)
            except BaseException as cleanup_error:
                cleanup_errors.append(f'Staged cleanup failed for {n}: {type(cleanup_error).__name__}: {cleanup_error}')
        if cleanup_errors:
            if original_error is not None:
                for note in cleanup_errors: original_error.add_note(note)
            else:
                cleanup_error = RuntimeError('Tracker files were updated, but temporary file cleanup failed.')
                cleanup_error.add_note('Private tracker backups retained: ' + str(backup))
                for note in cleanup_errors: cleanup_error.add_note(note)
                raise cleanup_error
    return str(backup)

def main():
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument('--metadata',type=Path); parser.add_argument('--template',action='store_true'); parser.add_argument('--apply',action='store_true'); parser.add_argument('--expected-preview')
    args=parser.parse_args(); paths,raw,before=inputs()
    if args.template:
        require(not args.apply, 'Template cannot apply.'); row={'path':None,'sha256':None,'pin':None}
        print(json.dumps({'date':None,'source':None,'published':None,'inputHashes':{n:sha(v) for n,v in raw.items()},'checks':[dict(row,scope=s,kind='headless' if s in ('implementation','publication','compatibility') else 'browser',passed=None,files=None) for s in ('implementation','publication','affected','production','localPages','livePages','compatibility')],**{k:dict(row) for k in ('deployment','readback','pacing','supplyBenchmark','reinforcementBenchmark')}},indent=2)); return
    require(args.metadata and args.metadata.is_file(), 'Supply reviewed final --metadata or use --template.')
    meta=json.loads(args.metadata.read_bytes()); captures={}; proposal,changes=preview(meta,raw,before,captures); seal=sha(encoded(proposal))
    result={'previewSha256':seal,'proposal':proposal,'applied':False}
    if args.apply:
        require(args.expected_preview==seal, 'Apply requires exact reviewed --expected-preview seal.')
        require(git('rev-parse','HEAD') == git('rev-parse','origin/master') == meta['published'], 'Publication changed before apply.')
        result.update(applied=True,backupDirectory=apply(paths,raw,changes,captures))
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__': main()
