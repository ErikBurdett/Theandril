"""Final read-only integrity check for the audit deliverables themselves."""
import csv
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
load = lambda path: json.loads(path.read_text())
inv = load(OUT / 'inventory.json')
cat = load(ROOT / 'assets/art/runtime/catalog.json')
native = load(OUT / 'evidence/native-validation.json')
backlog = load(OUT / 'art-backlog.json')
visual = load(OUT / 'evidence/visual-observations.json')
factory = load(OUT / 'factory-audit.json')
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
assert inv['catalogSha256'] == sha(ROOT / 'assets/art/runtime/catalog.json')
assert all(doc['basisCatalogSha256'] == inv['catalogSha256'] for doc in (backlog, visual, factory))
assert native['catalogSha256'] == inv['catalogSha256']
assert len(inv['assets']) == len(cat['assets']) == native['approvals'] == 545
assert sum(len(asset['frames']) for asset in inv['assets']) == 1427
assert native['failures'] == 0 and all(r['passed'] and r['fresh'] for r in native['results'])
assert len(native['blenderImports']) == 19 and all(r['passed'] for r in native['blenderImports'])
assert inv['summary']['issues'] == [] and inv['summary']['missingLiveIds'] == []
assert inv['summary']['allNativeFramesEqualRuntime']
assert all(a['publicByteIdentical'] and a['metadataPublicByteIdentical'] and a['hashMatches'] for a in inv['atlases'])
assert inv['catalogPublicByteIdentical']
assert factory['paletteComparison']['sameOrderedColors']
assert inv['audio']['files'] == [] and inv['audio']['playbackCodeMatches'] == []
assert len(backlog['items']) == 27
assert dict(sorted(Counter(item['priority'] for item in backlog['items']).items())) == {'P1': 11, 'P2': 11, 'P3': 5}
with (OUT / 'art-backlog.csv').open(newline='') as handle:
    csv_rows = list(csv.DictReader(handle))
assert len(csv_rows) == len(backlog['items'])
assert [r['id'] for r in csv_rows] == [r['id'] for r in backlog['items']]
for csv_row, item in zip(csv_rows, backlog['items']):
    for key, value in item.items():
        expected = json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else '' if value is None else str(value)
        assert csv_row[key] == expected, (item['id'], key)
for image in visual['auditSheets'] + visual['otherImages']:
    path = Path(image['path'])
    if not path.is_absolute():
        path = ROOT / path
    assert path.is_file()
    if 'sha256' in image:
        assert sha(path) == image['sha256'], str(path)
assert len(visual['auditSheets']) == visual['summary']['auditContactSheetsActuallyOpened'] == 15
assert len({e['assetId'] for s in visual['auditSheets'] for e in s['entries']}) == 164
assert len({e['frameId'] for s in visual['auditSheets'] for e in s['entries']}) == 236
report = (OUT / 'art-report.md').read_text()
missing_links = []
for target in re.findall(r'\]\(([^)]+)\)', report):
    if target.startswith(('http:', 'https:', '#')):
        continue
    if not (OUT / target.split('#')[0]).exists():
        missing_links.append(target)
assert not missing_links, missing_links
for check in inv['pathResolution']:
    path = Path(check.get('supplied', check.get('verifiedAlternative')))
    assert path.exists() == check['exists'], str(path)
tracked = subprocess.run(['git', 'diff', '--name-only'], cwd=ROOT, capture_output=True, text=True, check=True).stdout.splitlines()
result = {
    'passed': True,
    'catalogSha256': inv['catalogSha256'],
    'approvedAssets': len(inv['assets']),
    'frames': sum(len(a['frames']) for a in inv['assets']),
    'backlogRows': len(backlog['items']),
    'priorityCounts': backlog['summary']['byPriority'],
    'visualScope': visual['summary'],
    'sourceImportPasses': len(native['blenderImports']),
    'sourceValidationWarnings': sum(len(r['warnings']) for r in native['results']),
    'audioFilesFound': len(inv['audio']['files']),
    'starterAudioPrincipalOutputs': backlog['summary']['starterAudioPrincipalDeliverables'],
    'pathResolution': inv['pathResolution'],
    'brokenReportLinks': missing_links,
    'trackedWorkingTreeDiffPathsAtVerification': tracked,
    'deliverables': [{'path': str(OUT / name), 'bytes': (OUT / name).stat().st_size, 'sha256': sha(OUT / name)} for name in ['art-report.md', 'inventory.json', 'art-backlog.json', 'art-backlog.csv', 'factory-audit.json', 'evidence/visual-observations.json']],
    'scopeNote': 'This verifies audit artifacts and the unchanged current catalog; it does not grant new visual approval, run animations, create audio, or constitute runtime/performance acceptance.'
}
(OUT / 'evidence/final-verification.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
