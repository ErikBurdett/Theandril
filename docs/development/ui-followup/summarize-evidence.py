"""Retain real Playwright attachments, PNG statistics and source hashes."""
from pathlib import Path
from collections import Counter
import base64
import hashlib
import json
import re
from PIL import Image

root = Path(__file__).resolve().parents[3]
out = Path(__file__).resolve().parent

def write_json(path, data):
    path.write_text(json.dumps(data, indent=2) + '\n')

def specs(suites):
    for suite in suites:
        yield from suite.get('specs', [])
        yield from specs(suite.get('suites', []))

runs = ['capture-red', 'capture-green', 'r23-pixel-repro', 'pixels-verified',
        'narrow-text-options', 'narrow-text-options-green', 'regression-final', 'handoff-final', 'capture-hit-evidence']
summary = {'runs': {}, 'attachments': [], 'pixelSamples': []}
for run in runs:
    report = json.loads((out / run / 'results.json').read_text())
    cases = [case for spec in specs(report['suites']) for case in spec['tests']]
    summary['runs'][run] = {'stats': report['stats'], 'collected': len(cases),
                           'statuses': dict(Counter(case['status'] for case in cases))}
    assert len(cases) == sum(report['stats'].get(key, 0) for key in ['expected', 'unexpected', 'flaky', 'skipped'])
    if run not in ['capture-red', 'handoff-final', 'capture-hit-evidence']:
        continue
    folder = out / run / 'observations'
    folder.mkdir(exist_ok=True)
    index = []
    for spec in specs(report['suites']):
        for case in spec['tests']:
            for result in case['results']:
                for attachment in result['attachments']:
                    if 'body' not in attachment:
                        continue
                    kind = attachment['contentType']
                    if kind not in ['application/json', 'image/png']:
                        continue
                    name = re.sub(r'[^a-zA-Z0-9_.-]+', '-', attachment['name'])
                    path = folder / f"{len(index):02d}-{name}{'.json' if kind == 'application/json' else '.png'}"
                    path.write_bytes(base64.b64decode(attachment['body']))
                    record = {'test': spec['title'], 'name': attachment['name'], 'path': str(path.relative_to(root)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
                    index.append(record)
                    if kind == 'application/json' and attachment['name'].endswith('-pixels'):
                        summary['pixelSamples'].append({**record, 'measurement': json.loads(path.read_text())})
    write_json(folder / 'index.json', index)
    summary['attachments'].extend(index)

roots = ['apps/web/src', 'packages/render/src', 'packages/sim/src', 'packages/ai/src',
         'packages/chronicle/src', 'packages/persistence/src', 'tests/gameplay']
files = [f for directory in roots for f in (root / directory).rglob('*') if f.is_file()]
files += [out / 'playwright.config.ts', out / 'prepare-map-input.ts']
after = {str(f.relative_to(root)): hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(files)}
write_json(out / 'source-hashes-after.json', after)
before = json.loads((out / 'source-hashes-before.json').read_text())
summary['sourceChangesSinceStart'] = [name for name in before if before[name] != after.get(name)]
summary['newSourceFiles'] = [name for name in after if name not in before]
summary['frozenPackagesUnchanged'] = all(before[name] == after.get(name) for name in before if name.startswith('packages/'))
assert summary['frozenPackagesUnchanged']

comparisons = []
for path in sorted((root / 'docs/development/hermes-ui').rglob('lifecycle-after-battle.png')):
    image = Image.open(path).convert('RGB')
    crop = image.crop((660, 360, 780, 480))
    comparisons.append({'path': str(path.relative_to(root)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                        'clip': [660, 360, 120, 120], 'colors': len(Counter(crop.get_flattened_data()))})
write_json(out / 'historical-pixel-comparison.json', comparisons)
summary['historicalDesktopPixelSamples'] = comparisons
write_json(out / 'evidence-summary.json', summary)
print(json.dumps({key: value for key, value in summary.items() if key != 'attachments'}, indent=2))
