"""Small cited excerpts from full retained traces, without invented outcomes."""
from pathlib import Path
from collections import Counter
import json, gzip
BASE=Path(__file__).resolve().parent

def rows(name,file):
    p=BASE/'runs'/name/file
    if p.exists(): stream=p.open()
    else: stream=gzip.open(str(p)+'.gz','rt')
    with stream:
        yield from map(json.loads,stream)

morale=[]
for b in rows('D-standard24-seed74-300','battles.jsonl'):
    if b['turn'] in (95,96,97):
        for f in b['combat']['attacker']+b['combat']['defender']:
            if f['id']=='formation.543':
                morale.append({'sequence':b['sequence'],'turn':b['turn'],'battleId':b['id'],'formationId':f['id'],'morale':f['morale'],'strength':f['strength'],'usedAbilities':b['usedAbilities'],'result':b['combat']['result']})
magic=[b for b in rows('C-tiny4-seed99','battles.jsonl') if b['id']=='battle.80']
magic_commands=[r for r in rows('C-tiny4-seed99','commands.jsonl') if r['command']['factionId']=='faction.ashen_compact' and (r['command']['type'] in ('researchArcane','recruitCharacter','assignCharacter') and r['turn']<=37 or r['sequence']==506)]
aggregate=json.loads((BASE/'aggregate.json').read_text())
resources={}
for r in aggregate:
    positive={fid:[s for s in (resource or {}).get('stockpiles',[]) if s['amount'] or s['perTurn']] for fid,resource in r['finalStocks'].items()}
    resources[r['name']]={'positiveStocks':positive,'producingFactions':sum(any(s['perTurn'] for s in stocks) for stocks in positive.values())}
summary={'primaryCampaignCount':len(aggregate),'commands':sum(r['commands'] for r in aggregate),'rejections':sum(r['rejections'] for r in aggregate),'fullReplays':sum(r['verification'].get('replayExact',False) for r in aggregate),'completeVictories':sum(r['winner'] is not None for r in aggregate),'exactFinalLoads':sum(r['verification'].get('finalSaveExact',False) for r in aggregate),'exactMidpointFinals':sum(r['verification'].get('midpointFinalExact',False) for r in aggregate)}
(BASE/'key-evidence.json').write_text(json.dumps({'summary':summary,'moraleCarryover':morale,'magicBattle':magic,'magicCommands':magic_commands,'resources':resources},indent=2)+'\n')
print(json.dumps({'summary':summary,'morale':morale,'producingFactions':{n:r['producingFactions'] for n,r in resources.items()},'magicEvidence':[(b['id'],b['turn']) for b in magic]},indent=2))
