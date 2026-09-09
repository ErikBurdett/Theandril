"""Match every retained run's exact source seals to retained harness versions."""
from pathlib import Path
import hashlib,json
BASE=Path(__file__).resolve().parent
sources={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for pattern in ('run-campaign*.ts','strategies*.ts') for p in BASE.glob(pattern)}
results=[]
for p in sorted((BASE/'runs').glob('*/summary.json')):
    data=json.loads(p.read_text())
    harness=[name for name,digest in sources.items() if name.startswith('run-campaign') and digest==data['harnessSha256']]
    strategy=[name for name,digest in sources.items() if name.startswith('strategies') and digest==data['strategySha256']]
    assert harness, f'{p.parent.name}: missing original harness bytes'
    assert data['strategySha256'] is None or strategy, f'{p.parent.name}: missing original strategy bytes'
    results.append({'name':p.parent.name,'harnessSource':harness,'strategySource':strategy,'harnessSha256':data['harnessSha256'],'strategySha256':data['strategySha256']})
(BASE/'source-provenance-check.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps({'runs':len(results),'allOriginalSourcesRetained':True}))
