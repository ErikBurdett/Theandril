import datetime, json, os, pathlib, resource, subprocess, sys, time
ROOT = pathlib.Path('/home/telephoneheater/Work/Theandril')
OUT = ROOT / 'docs/hermes-analysis/qa'
name, command = sys.argv[1:3]
(OUT / 'logs').mkdir(parents=True, exist_ok=True)
(OUT / 'results').mkdir(parents=True, exist_ok=True)
start = time.time()
log = OUT / 'logs' / (name + '.log')
env = os.environ.copy()
env['PLAYWRIGHT_CHROMIUM_EXECUTABLE'] = '/usr/bin/chromium'
env['NODE_OPTIONS'] = (env.get('NODE_OPTIONS', '') + ' --require=' + str(OUT / 'redirect-evidence.cjs')).strip()
with log.open('w') as stream:
    stream.write('COMMAND: ' + command + '\nSTART: ' + datetime.datetime.now(datetime.timezone.utc).isoformat() + '\n')
    stream.flush()
    code = subprocess.call(['bash', '-lc', command], cwd=ROOT, env=env, stdout=stream, stderr=subprocess.STDOUT)
result = {'name': name, 'command': command, 'cwd': str(ROOT), 'startedAt': datetime.datetime.fromtimestamp(start, datetime.timezone.utc).isoformat(), 'durationSeconds': time.time()-start, 'exitCode': code, 'log': str(log), 'browserExecutable': env['PLAYWRIGHT_CHROMIUM_EXECUTABLE'], 'maxChildrenRssKiB': resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss, 'note': 'Concurrent parent/campaign tasks may affect timings. NODE_OPTIONS redirects legacy docs/performance writes into the owned QA directory; assertions/runtime unchanged.'}
(OUT / 'results' / (name + '.json')).write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result), flush=True)
sys.exit(code)
