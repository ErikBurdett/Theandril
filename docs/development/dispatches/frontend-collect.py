"""Collect only this journal's owned sources and local QA artifacts.
Not a repository-wide or historical all-artifact freshness sweep.
"""
from pathlib import Path
from hashlib import sha256
import json
import re
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
EVIDENCE = ROOT / 'docs/development/dispatches/frontend-evidence'
paths = []
for directory in ['apps/web/src/updates', 'apps/web/public/updates']:
    paths.extend(p for p in (ROOT / directory).iterdir() if p.is_file())
paths.extend(ROOT / path for path in [
    'apps/web/updates/index.html', 'tests/gameplay/updates.spec.ts',
    'docs/updates/STRUCTURE.md', 'docs/updates/prepare-images.py',
    'docs/development/dispatches/frontend-playwright.config.ts',
    'docs/development/dispatches/frontend-production.config.ts',
    'docs/development/dispatches/frontend-collect.py',
])

def record(path):
    data = path.read_bytes()
    return {'path': str(path.relative_to(ROOT)), 'bytes': len(data), 'sha256': sha256(data).hexdigest()}

sources = [record(path) for path in sorted(set(paths))]
screenshots = []
for path in sorted((EVIDENCE / 'production-browser').rglob('*.png')):
    item = record(path)
    with Image.open(path) as image:
        item['width'], item['height'] = image.size
    screenshots.append(item)
assert len(screenshots) == 24, 'Expected six actual captures for each of four viewport/text settings'
layouts = []
for path in sorted((EVIDENCE / 'production-browser').rglob('layout-evidence.json')):
    item = json.loads(path.read_text())
    assert item['errors'] == [] and item['workers'] == []
    assert all(image['width'] > 0 and image['complete'] for image in item['imageFacts'])
    layouts.append({'path': str(path.relative_to(ROOT)), **item})
contrast_path = next((EVIDENCE / 'production-browser').rglob('contrast-evidence.json'))
contrast = json.loads(contrast_path.read_text())
media = json.loads((ROOT / 'apps/web/public/updates/provenance.json').read_text())
def count_log(name, pattern):
    text = (EVIDENCE / name).read_text()
    assert not re.search(r'\b[1-9][0-9]* failed\b', text), name
    matches = re.findall(pattern, text)
    assert matches, f'Missing result summary: {name}'
    return int(matches[-1])

manifest = {
    'scope': 'Only owned journal sources and retained frontend QA; not a full repository/artifact freshness sweep.',
    'sourceFiles': sources, 'sourceFileCount': len(sources),
    'productionScreenshots': screenshots, 'productionScreenshotCount': len(screenshots),
    'productionLayouts': layouts,
    'minimumConservativeTextContrast': min(item['conservativeRatio'] for item in contrast),
    'journalImageBytes': media['totalJournalImageBytes'],
    'publications': ['r17-campaign-safety', 'keeping-the-record', 'twenty-four-cultures'],
    'tests': {'vitest': {'passed': count_log('final-vitest.log', r'Tests\s+(\d+) passed'), 'files': count_log('final-vitest.log', r'Test Files\s+(\d+) passed'), 'log': 'final-vitest.log'},
              'productionBrowser': {'passed': count_log('34-production-browser.log', r'\b(\d+) passed'), 'log': '34-production-browser.log'},
              'rootBrowser': {'passed': count_log('35-root-browser.log', r'\b(\d+) passed'), 'sameScenariosAsProduction': True, 'log': '35-root-browser.log'}},
    'note': 'Execution results are retained logs, not a fresh run by this collector. Build files under frontend-build/dist are ignored and not source deliverables.',
}
(EVIDENCE / 'artifact-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'sourceFileCount': len(sources), 'sourcePaths': [item['path'] for item in sources], 'productionScreenshotCount': len(screenshots), 'journalImageBytes': media['totalJournalImageBytes']}, indent=2))
