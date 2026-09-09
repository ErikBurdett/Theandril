"""Read retained ordinary campaign evidence; no simulation or policy changes."""
from pathlib import Path
from collections import Counter, defaultdict
import csv, gzip, json
BASE = Path(__file__).resolve().parent
NAMES = ['B-tiny4-seed74-v2','B-tiny4-seed99-v2','C-tiny4-seed74','C-tiny4-seed99','D-tiny4-seed74-standard','D-tiny4-seed99-epic','D-sparse4-seed748291','D-standard24-seed74-300']
def rows(path):
    if not path.exists():
        path = Path(str(path)+'.gz')
    if not path.exists(): return
    op = gzip.open if path.suffix == '.gz' else open
    with op(path,'rt') as f:
        for line in f:
            if line.strip(): yield json.loads(line)
outputs=[]
for name in NAMES:
    root=BASE/'runs'/name
    s=json.loads((root/'summary.json').read_text())
    metrics={r['turn']:r for r in rows(root/'metrics.jsonl')}
    commands=Counter(); control=Counter(); queues=Counter(); research=[]; arcs=[]; spell_events=[]; wars=[]; peace=[]; founding=[]; project_events=[]
    controlled=s['controlledFactionId'] or 'faction.ashen_compact'
    per_faction=defaultdict(Counter)
    for r in rows(root/'commands.jsonl'):
        c=r['command']; ok=r['result']['ok']; fid=c['factionId']
        if not ok: continue
        commands[c['type']]+=1; per_faction[fid][c['type']]+=1
        if fid==controlled:
            control[c['type']]+=1
            if c['type']=='queue': queues[c['itemId']]+=1
        if c['type']=='research': research.append({'turn':r['turn'],'factionId':fid,'technologyId':c['technologyId']})
        if c['type']=='researchArcane': arcs.append({'turn':r['turn'],'factionId':fid,'discoveryId':c['discoveryId']})
        if c['type']=='declareWar': wars.append({'turn':r['turn'],'factionId':fid,'enemy':c['targetFactionId']})
        if c['type']=='respondPeace': peace.append({'turn':r['turn'],'factionId':fid,'accept':c['accept']})
        if c['type']=='found': founding.append({'turn':r['turn'],'factionId':fid})
        for e in r['result']['events']:
            if e['type']=='battle_ability_used' and ('Cinder thread' in e['message'] or 'Bound ward' in e['message']):
                spell_events.append({'sequence':r['sequence'],**e})
            if e['type'].startswith('victory_project_') and e['type']!='victory_project_progress':
                entry={'turn':e['turn'],'type':e['type'],'message':e['message']}
                if entry not in project_events: project_events.append(entry)
    bs=json.loads((root/'battle-summary.json').read_text()); cs=json.loads((root/'capture-summary.json').read_text())
    assert len(bs)==s['uniqueBattleCount'] and len({b['id'] for b in bs})==len(bs)
    assert len(cs)==s['captureDecisionCount']
    battle_counter=Counter('naval' if b['domain']=='naval' else 'siege' if b['settlementId'] else 'field' for b in bs)
    own_battles=[b for b in bs if controlled in (b['attackerFactionId'],b['defenderFactionId'])]
    last_actions={'battle':max((b['turn'] for b in bs),default=None),'capture':max((c['turn'] for c in cs),default=None),'founding':max((f['turn'] for f in founding),default=None),'research':max((r['turn'] for r in research),default=None),'arcane':max((r['turn'] for r in arcs),default=None),'warDeclaration':max((r['turn'] for r in wars),default=None)}
    per_turn_positions={r['turn']:r['armies'] for r in rows(root/'positions.jsonl')}
    trails=defaultdict(list)
    for turn,armies in per_turn_positions.items():
        for a in armies: trails[a['id']].append((turn,a['cell'],a['factionId']))
    loops=[]
    for aid,trail in trails.items():
        if len(trail)<30: continue
        late=[x for x in trail if x[0]>=300]
        aba=sum(trail[i][1]==trail[i-2][1] and trail[i][1]!=trail[i-1][1] for i in range(2,len(trail)))
        stationary=sum(trail[i][1]==trail[i-1][1] for i in range(1,len(trail)))
        loops.append({'armyId':aid,'factionId':trail[0][2],'firstTurn':trail[0][0],'lastTurn':trail[-1][0],'turnsSeen':len(trail),'uniqueCells':len({x[1] for x in trail}),'abaReturns':aba,'stationaryPairs':stationary,'lateSamples':len(late),'lateUniqueCells':len({x[1] for x in late}),'last12':trail[-12:]})
    loops.sort(key=lambda x:(-x['abaReturns'],-x['stationaryPairs'],x['armyId']))
    milestones=[]
    for turn,m in metrics.items():
        if turn not in (1,30,60,100,200,300,500,800,1000,s['finalTurn']): continue
        cf=next(f for f in m['factions'] if f['id']==controlled)
        milestones.append({'turn':turn,'towns':m['settlements'],'population':m['population'],'armies':m['armies'],'formations':m['formations'],'hulls':m['hulls'],'wars':len(m['wars']),'battles':m['uniqueBattles'],'captures':m['captures'],'contact':m['factionsWithContact'],'treasury':sum(f['treasury'] for f in m['factions']),'knowledge':sum(f['knowledge'] for f in m['factions']),'technologyCounts':{f['id']:len(f['technologies']) for f in m['factions']},'controlled':{k:cf.get(k) for k in ('id','settlements','population','armies','formations','treasury','knowledge','technologies','arcaneResearch','claimed','worked','economy','exploredCells')}})
    final=s['final']; control_final=next(f for f in final['factions'] if f['id']==controlled)
    output={'name':name,'strategy':s['strategy'],'seed':s['settings']['seed'],'size':s['settings']['size'],'factions':s['settings']['factionCount'],'pace':s['settings']['pace'],'finalTurn':s['finalTurn'],'hash':s['finalHash'],'winner':(s['victory'] or {}).get('factionId'),'commands':s['commandCount'],'rejections':s['refusalCount'],'verification':s['verification'],'battleCount':len(bs),'battleTypes':dict(battle_counter),'rawBattleFinishedEvents':s['rawEventCounts'].get('battle_finished',0),'captureDecisions':len(cs),'distinctCapturedSettlements':len({c['command']['settlementId'] for c in cs}),'warDeclarations':wars,'peaceResponses':peace,'firstContacts':s['firstContacts'],'firstResearchSaturation':s['firstResearchSaturation'],'controlledFactionId':controlled,'controlledFinal':control_final,'controlledCommands':dict(control),'controlledQueues':dict(queues),'controlledBattles':len(own_battles),'controlledCaptures':sum(c['command']['factionId']==controlled for c in cs),'controlledAttacks':sum(b['attackerFactionId']==controlled for b in bs),'technologyEvents':research,'arcaneEvents':arcs,'spellEvents':spell_events,'spellEventCount':len(spell_events),'controlledSpellEvents':sum(e['factionId']==controlled for e in spell_events),'projectEvents':project_events,'lastActionTurns':last_actions,'milestones':milestones,'movementLoopsTop12':loops[:12],'commandsByFaction':{k:dict(v) for k,v in per_faction.items()},'finalStocks':{f['id']:f.get('resources') for f in final['factions']}}
    outputs.append(output)
assert len(outputs)==8
(BASE/'aggregate.json').write_text(json.dumps(outputs,indent=2)+'\n')
with (BASE/'outcomes.csv').open('w') as f:
    fields=['name','seed','size','factions','pace','finalTurn','winner','hash','commands','rejections','battleCount','captureDecisions','distinctCapturedSettlements','controlledBattles','controlledCaptures','controlledSpellEvents']
    writer=csv.DictWriter(f,fieldnames=fields); writer.writeheader(); writer.writerows({k:o[k] for k in fields} for o in outputs)
print(json.dumps([{'name':o['name'],'turn':o['finalTurn'],'winner':o['winner'],'battleCount':o['battleCount'],'captures':o['captureDecisions'],'selfTowns':o['controlledFinal']['settlements'],'selfTechs':len(o['controlledFinal']['technologies']),'selfArcane':o['controlledFinal']['arcaneResearch'],'selfSpells':o['controlledSpellEvents'],'selfQueues':o['controlledQueues'],'last':o['lastActionTurns']} for o in outputs],indent=2))
