from pathlib import Path
import gzip
import hashlib
import json
import re

root = Path(__file__).resolve().parent
summaries = {}
manifest = []
for label in ('before', 'after'):
    prefix = root / f'contact-{label}'
    summary = json.loads(Path(str(prefix) + '-summary.json').read_text())
    commands_path = Path(str(prefix) + '-commands.jsonl')
    raw = commands_path.read_bytes() if commands_path.exists() else gzip.decompress(Path(str(commands_path) + '.gz').read_bytes())
    commands = [json.loads(line) for line in raw.splitlines()]
    assert len(commands) == summary['commands']
    assert all(row['result']['ok'] for row in commands)
    initial = json.loads(gzip.decompress(Path(str(prefix) + '-initial.json.gz').read_bytes()))
    summaries[label] = {**summary, 'retainedEnvelopeVersion': initial['version'],
        'ashenPaidStages': [{key: row[key] for key in ('sequence', 'turn', 'command', 'coinDelta', 'knowledgeDelta')}
            for row in commands if row['command']['factionId'] == 'faction.ashen_compact'
            and (row['command']['type'] in ('found', 'queueMovement', 'research') or
                 row['command']['type'] == 'queue' and row['command']['itemId'] in ('building.harbor', 'unit.ocean_warship', 'unit.transport', 'unit.colonist'))]}
    for suffix in ('commands', 'plans'):
        source = Path(str(prefix) + f'-{suffix}.jsonl')
        target = Path(str(source) + '.gz')
        if source.exists():
            data = source.read_bytes()
            target.write_bytes(gzip.compress(data, mtime=0))
            assert gzip.decompress(target.read_bytes()) == data
            source.unlink()
    for path in sorted(root.glob(f'contact-{label}-*')):
        data = path.read_bytes()
        manifest.append({'path': path.name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})

# Remove only this diagnostic's abandoned trial raw captures; retain all trial
# summaries, exact failed-test logs and the rejected boundary implementation patch.
removed = []
for label in ('progress', 'boundary', 'role', 'outlet'):
    for path in root.glob(f'contact-{label}-*'):
        if path.suffix in ('.log', '.patch') or path.name.endswith('-summary.json'):
            continue
        if path.name.endswith(('.jsonl', '.json.gz', '-contacts.json')):
            removed.append(path.name)
            path.unlink()
log = (root / 'contact-ai-final.log').read_text()
checks = [line.strip() for line in log.splitlines() if re.search(r'Test Files|Tests  |Duration|standard / 4 seats|standard / 24 seats|huge / 32 seats', line)]
result = {'beforeAfter': summaries, 'retainedArtifacts': manifest, 'finalAiChecks': checks,
          'removedTrialRawCaptures': removed,
          'scope': 'Command/cost evidence and replay were generated from actual simulation execution; planner input is ordinary detached observation only.'}
(root / 'contact-verified-evidence.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'commandsBefore': summaries['before']['commands'], 'commandsAfter': summaries['after']['commands'],
    'contactBefore': summaries['before']['firstContact'], 'contactAfter': summaries['after']['firstContact'],
    'retainedArtifacts': len(manifest), 'retainedBytes': sum(item['bytes'] for item in manifest), 'removedTrialRawCaptures': len(removed), 'checks': checks}, indent=2))
