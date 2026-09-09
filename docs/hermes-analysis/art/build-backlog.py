"""Render the auditor's planning spec; never writes briefs or production assets."""
import csv
import json
from collections import Counter
from pathlib import Path

OUT = Path(__file__).resolve().parent
inventory = json.loads((OUT / 'inventory.json').read_text())
spec = json.loads((OUT / 'backlog-spec.json').read_text())
items = spec['items']
asset_ids = {a['id'] for a in inventory['assets']}
assert len(items) == len({item['id'] for item in items}) == 27
required = {'id', 'assetFamily', 'priority', 'gapKind', 'existingQuantity', 'quantityUnit',
            'missingQuantityEstimate', 'revisionQuantityEstimate', 'desiredNativeResolution',
            'animationRequirement', 'pipelineApplicability', 'currentConsumer',
            'mechanicsDependencies', 'estimationAssumptions', 'acceptance', 'existingAssetIds'}
for item in items:
    assert required <= item.keys(), item['id']
    assert item['priority'] in {'P1', 'P2', 'P3'}
    assert set(item['existingAssetIds']) <= asset_ids, item['id']
    item['evidenceSources'] = ['inventory.json', 'art-report.md']

summary = {
    'rows': len(items),
    'byPriority': dict(sorted(Counter(item['priority'] for item in items).items())),
    'missingLiveCatalogIds': inventory['summary']['missingLiveIds'],
    'confirmedConsumerBindingGaps': ['ART-07: current Waykeeper roster/appointment displays Generic despite a published shared sprite'],
    'starterAudioPrincipalDeliverables': sum(item['missingQuantityEstimate'] for item in items if item['id'] in {'AUD-02', 'AUD-03', 'AUD-04', 'AUD-05', 'AUD-06'}),
    'audioCountingNote': 'Principal outputs combine SFX variations, ambience beds and compositions. Excludes source stems, alternative encodings and future voice; these are not equal-cost work units.',
    'noGlobalMissingTotal': 'Rows mix revisions, binding repairs, optional extensions, alternative phases and mechanics-dependent TBD quantities. Adding every row would misrepresent production scope.'
}
result = {
    'schemaVersion': 1,
    'status': 'Audit proposals only; not approved briefs or a change to game content',
    'basisCatalogSha256': inventory['catalogSha256'],
    'priorityDefinition': {
        'P1': 'Premium 1.0 priority tied to current mechanics/consumers, demonstrated quality or binding gaps, or wholly absent audio. Not synonymous with missing runtime IDs.',
        'P2': 'Polish or optional expansion for current presentation, after the P1 pilots and integration contracts.',
        'P3': 'Future mechanics, future consumer hooks or explicitly optional large expansions; not a current engine-consumed missing-asset count.'
    },
    'summary': summary,
    'items': items
}
(OUT / 'art-backlog.json').write_text(json.dumps(result, indent=2) + '\n')
columns = list(dict.fromkeys(key for item in items for key in item))
with (OUT / 'art-backlog.csv').open('w', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=columns)
    writer.writeheader()
    for item in items:
        writer.writerow({key: json.dumps(value, ensure_ascii=False) if isinstance(value, (list, dict)) else value for key, value in item.items()})
print(json.dumps(summary, indent=2))
