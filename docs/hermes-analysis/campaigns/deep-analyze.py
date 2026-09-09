"""Additional deterministic reductions, preserving raw audit evidence."""
from analyze import BASE, NAMES, rows
import json, gzip
from collections import Counter, defaultdict
out={}
for name in NAMES:
    root=BASE/'runs'/name
    summary=json.loads((root/'summary.json').read_text())
    history=list(rows(root/'battles.jsonl'))
    battles=[]
    for b in history:
        entering=sum(x['strength'] for x in b['initialStrengths'])
        ending=sum(x['strength'] for x in b['aftermath'])
        battles.append({'id':b['id'],'turn':b['turn'],'reason':b['combat']['result']['reason'],'winner':b['combat']['result']['winner'],'rounds':b['combat']['round'],'entering':entering,'ending':ending,'loss':entering-ending})
    # True capture transactions can revisit the same town: preserve both numbers.
    metrics={r['turn']:r for r in rows(root/'metrics.jsonl')}
    final=summary['final']
    spells=[]
    control=summary['controlledFactionId']
    for r in rows(root/'commands.jsonl'):
        c=r['command']
        if c['factionId']==control and c['type'] in ('research','researchArcane','recruitCharacter','assignCharacter','declareWar','respondPeace'):
            if r['result']['ok']: spells.append({'sequence':r['sequence'],'turn':r['turn'],'command':c})
    finalraw=json.loads(gzip.decompress((root/'final.json.gz').read_bytes()))['state']
    out[name]={
        'battleReasons':dict(Counter(b['reason'] for b in battles)),
        'casualtyBattles':sum(b['loss']>0 for b in battles),
        'totalStrengthLost':sum(b['loss'] for b in battles),
        'battleDetails':battles,
        'finalTotals':{**{k:final[k] for k in ('settlements','population','armies','formations','hulls')},'maxPopulation':max(f['maxPopulation'] for f in final['factions']),'claimed':sum(f['claimed'] for f in final['factions']),'worked':sum(f['worked'] for f in final['factions']),'knowledge':sum(f['knowledge'] for f in final['factions']),'treasury':sum(f['treasury'] for f in final['factions'])},
        'landWork':{'improvements':Counter(i for town in finalraw['land']['settlements'] for i in town['improvements'].values())} if isinstance(finalraw['land']['settlements'],list) else {},
        'firstContacts':summary['firstContacts'],
        'firstResearchSaturation':summary['firstResearchSaturation'],
        'controlProgressionCommands':spells,
        'controlMilestones':[{ 'turn':turn,**{k:f.get(k) for k in ('settlements','population','armies','formations','treasury','knowledge','technologies','arcaneResearch','economy','exploredCells')}} for turn,m in metrics.items() if turn in (30,60,100,200,300,500,800,summary['finalTurn']) for f in m['factions'] if f['id']==(control or 'faction.ashen_compact')],
    }
(BASE/'deep-analysis.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({name:{k:d[k] for k in ('battleReasons','casualtyBattles','totalStrengthLost','finalTotals','firstContacts','firstResearchSaturation')} for name,d in out.items()},indent=2))
