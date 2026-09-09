"""Compile audit-only Markdown from validated exported data and findings.
Read production paths only to validate citation ranges. Write only this directory.
"""
from pathlib import Path
import json
import re
import hashlib
import subprocess
from datetime import datetime, timezone
from collections import Counter

owned = Path(__file__).resolve().parent
root = owned.parents[2]
content = json.loads((owned / 'content.json').read_text())
findings = json.loads((owned / 'findings.json').read_text())
probes = json.loads((owned / 'probe-results.json').read_text())


def table(headers, rows):
    def clean(v):
        return str(v).replace('|', '\\|').replace('\n', ' ')
    return '\n'.join(['| ' + ' | '.join(headers) + ' |', '| ' + ' | '.join('---' for _ in headers) + ' |'] + ['| ' + ' | '.join(clean(v) for v in row) + ' |' for row in rows])


def refs(entries):
    return '; '.join(f"`{e['path']}:{e['startLine']}-{e['endLine']}`" for e in entries if e)


def defs(key):
    return [x['definition'] for x in content[key]]


def stats(d):
    return ', '.join(f"{k} {v:+}" for k, v in d.items() if isinstance(v, (int, float)) and v) or 'none'


summary_rows = [
    ('Major culture/faction definitions', len(content['factions']), '24', '`packages/content/src/factions.ts:3-43`'),
    ('Independent ancestry/race definitions', 0, 'Distinct from cultures; no separate numeric target assumed', '`packages/content/src/index.ts:21-33`; `docs/lore/FACTION_BIBLE.md:9-28`'),
    ('Minor/independent power templates', 0, '48', '`packages/sim/src/types.ts:218-250`; exported catalog'),
    ('Unit definitions', len(content['units']), '100+ meaningful definitions/variants', '`packages/content/src/index.ts:43-60`'),
    ('Town buildings / tile improvements', f"{len(content['buildings'])} / {len(content['improvements'])}", 'Separate registries, not merged', '`packages/content/src/index.ts:36-42`; `packages/content/src/ecology.ts:71-83`'),
    ('Resource definitions', len(content['resources']), '40+', '`packages/content/src/resources.ts:10-36`'),
    ('Mundane technologies', len(content['technologies']), '80+', '`packages/content/src/progression.ts:51-69`'),
    ('Institution choices', len(content['institutions']), '70+ institutions/traditions: also see development, not double counting', '`packages/content/src/progression.ts:70-73`'),
    ('Doctrine choices', len(content['doctrines']), '50+ doctrines: also see linked development', '`packages/content/src/progression.ts:74-77`'),
    ('Development nodes', len(content['development']), '8 formation + 9 hearth + 8 faction; not extra activated spells', '`packages/content/src/development.ts:51-89`'),
    ('Character roles / missions / skills', f"{len(content['characterRoles'])} / {len(content['characterMissions'])} / {len(content['characterSkills'])}", '120+ combined abilities/traits target is not met', '`packages/content/src/characters.ts:38-68`; `packages/content/src/development.ts:95-101`'),
    ('Commander / innate unit activated abilities', f"{len(content['commanderAbilities'])} / {len(content['innateBattleAbilities'])}", 'Rally / Set shields; counted separately from spells', '`packages/content/src/characters.ts:71-74`; `packages/content/src/magic.ts:11-15`'),
    ('Arcane research disciplines / discovery purchases', f"0 / {len(content['arcaneDiscoveries'])}", '8-10 disciplines; a purchase is not a discipline', '`packages/content/src/magic.ts:16-21`'),
    ('Personal magical paths / battle spells', f"{len(content['magicPaths'])} / {len(content['battleSpells'])}", '10-14 paths; 250+ cross-system magical effects', '`packages/content/src/magic.ts:5-27`'),
    ('Rituals / summons / items or recipes / sacred / occult', '0 / 0 / 0 / 0 / 0', 'Required distinct systems; 80+ items/recipes', 'Exported catalog; `packages/sim/src/types.ts:175-250`'),
    ('Legendary sites/wonders / event templates / quests', '0 / 0 / 0', '24+ sites and 150+ event templates; no quest count invented', 'Exported catalog; `packages/sim/src/types.ts:218-250`'),
    ('Biomes / physical terrain / depth / natural features', f"{len(content['geography']['biomes'])} / {len(content['geography']['terrain'])} / {len(content['geography']['waterDepth'])} / {len(content['naturalFeatures'])}", 'Different layers, not alternate biome counts', '`packages/mapgen/src/index.ts:32-61`; `packages/content/src/ecology.ts:25-33`'),
    ('Name pools / distinct unsuffixed combinations', f"{content['summary']['namePools']} / {content['summary']['uniqueUnsuffixedNameCombinations']}", '150+ notable authored characters or robust faction-specific generation; names alone not biographies', '`packages/content/src/characters.ts:75-109`'),
    ('Biography-bearing authored character definitions', 0, 'Lore seeds not executable definitions', '`docs/lore/FACTION_BIBLE.md:18-18`; `packages/sim/src/characters.ts:226-232`'),
    ('Terminal victory paths / projects', f"{len(content['victory']['paths'])} / {len(content['victory']['projects'])}", 'Gate B ≥3 tested; master product target 5', '`packages/sim/src/progression.ts:17-18,142-156`'),
]
summary = table(['Catalog', 'Actual', 'Declared target or counting caution', 'Evidence'], summary_rows)
summary += '\n\nTarget source: `GAME_1_0_SCOPE.md:341-359`; `MASTER_PROMPT.md:1821-1837`; `DEFINITION_OF_DONE.md:16-33,147-155`. “Exported catalog” refers to `packages/content/src/index.ts:1-15,91-105`, the imported exports recorded in `content.json`, and the canonical state/command absence scope above.'

catalog = ['# Executable content catalog', '', f"Baseline `{content['baseline']}`; content hash `{content['validation']['hash']}`.", '', 'Generated from actual TypeScript exports by `inventory.ts`; all rows describe current definitions, not lore-only proposals. Legacy duplicate entries and repeated faction seats are excluded. Full fields, requirements and evidence remain in `content.json`.', '', '## Summary', summary, '', '## Units', 'All cultures share these definitions and prices. Strength is soldiers for land and durability for one naval hull in current battles. Requirements must be earned/paid; art variants are not independent gameplay units. Coin is upfront recruitment cost; industry is queued production cost.', '']
rows=[]
for x in content['units']:
    d=x['definition']
    requirements=d.get('requiredTechnologies',[])+d.get('requiredBuildings',[])
    rows.append((d['id'],d['name'],d.get('movementDomain','land'),d['strength'],f"{d['attack']}/{d['armor']}/{d['initiative']}/{d['range']}",f"{d['movement']}/{d['sight']}",f"{d['coinCost']}/{d['cost']}/{d['upkeep']}",', '.join(requirements) or 'none',refs(x['evidence'])))
catalog += [table(['ID','Name','Domain','Strength','Attack/armor/init/range','Move/sight','Coin/industry/upkeep','Required technologies/buildings','Evidence'],rows),'','## Factions and ecological asymmetry','Culture definitions are political identities, not an ancestry registry. Modifiers apply to worked tiles and are combined/clamped with other tile yield components. Every culture may recruit all shared units. AI preference changes are not player access restrictions. “Ocean” affinities do not authorize workers in deep water.','']
rows=[]
for x in content['factions']:
    d=x['definition']; affinities=x['ecology']['affinities']
    pos=[];neg=[]
    for a in affinities:
        positive={k:v for k,v in a['yields'].items() if v>0};negative={k:v for k,v in a['yields'].items() if v<0}
        if positive: pos.append(f"{a['name']}: {stats(positive)}")
        if negative: neg.append(f"{a['name']}: {stats(negative)}")
    w=x['aiRecruitmentWeights']; maximum=max(w.values())
    favored=', '.join(k.removeprefix('unit.') for k,v in w.items() if v==maximum)
    rows.append((d['id'],d['name'],'; '.join(pos),'; '.join(neg),', '.join(a['name'] for a in x['ecology']['cultivation']),f"{favored} (weight {maximum})"))
catalog += [table(['ID','Culture','Positive worked-biome modifiers','Negative worked-biome modifiers','Paid cultivation targets','Highest AI weights'],rows), '', 'Evidence for complete matrix: `packages/content/src/factions.ts:3-84`; `packages/content/src/ecology.ts:39-64`; actual rule aggregation: `packages/sim/src/territory.ts:351-361`. Names and full recruitment weights are preserved per culture in `content.json`.', '', '## Buildings and tile improvements','']
rows=[]
for key in ['buildings','improvements']:
    for x in content[key]:
        d=x['definition']; yields=d.get('yields',{k:d.get(k,0) for k in ['food','industry','coin','knowledge']})
        rows.append((d['id'],d['name'],key,d['coinCost'],f"{d['cost']} industry" if key=='buildings' else f"{d['turns']} active turns",stats(yields),refs(x['evidence'])))
catalog += [table(['ID','Name','Registry','Base coin','Completion work','Base yield effects','Evidence'],rows),'','Improvement quotes add distance/cultivation/mismatch costs to the catalog base; requirements, signed feature modifiers and deposit conditions are retained in `content.json` (`packages/sim/src/territory.ts:286-337`).','', '## Resources', '']
rows=[]
for x in content['resources']:
    d=x['definition']; uses=[n['definition']['id'] for n in content['development'] if d['id'] in n['definition'].get('resourceCosts',{})]
    rows.append((d['id'],d['name'],d['category'],d['extraction'],d['salePrice'],d['improvementId'],', '.join(uses),refs(x['evidence'])))
catalog += [table(['ID','Name','Category','Stock per worked source/turn','Sale coin/unit','Matching extraction improvement','Current material consumers','Evidence'],rows), '', 'The listed consumers are development nodes; unit and spell costs do not consume these stocks. Terrain-suitable deposits are seed-generated; output needs matching completed improvements and worker assignment (`packages/sim/src/resources.ts:20-49,69-103`).', '', '## National progression', 'Technology costs below are base content values. Civic accounts actually quotes 40/400/800/1600 knowledge for Short/Standard/Long/Epic. Other costs are not multiplied by pace (`packages/content/src/progression.ts:25-49`; `packages/sim/src/progression.ts:72-89`).', '']
rows=[]
for key in ['technologies','institutions','doctrines','arcaneDiscoveries']:
    for x in content[key]:
        d=x['definition']
        currency='knowledge' if 'knowledgeCost' in d else 'coin'
        cost=d.get('knowledgeCost',d.get('coinCost'))
        rows.append((d['id'],d['name'],key,f"{cost} {currency}",d['description'],refs(x['evidence'])))
catalog += [table(['ID','Name','Registry','Base cost','Actual defined role/effect','Evidence'],rows),'','## Development: formation, hearth and faction','']
rows=[]
for x in content['development']:
    d=x['definition']; req=[]
    if d['requiresAll']:req.append('ALL '+', '.join(d['requiresAll']))
    if d['requiresAny']:req.append('ANY '+', '.join(d['requiresAny']))
    for key in ['requiredInstitution','requiredDoctrine']:
        if d[key]:req.append(d[key])
    req+=d['requiredBuildings']+d['requiredTechnologies']
    if d['minimumPopulation']: req.append(f"population {d['minimumPopulation']}")
    if d['minimumRange']: req.append(f"range {d['minimumRange']}")
    material=', '.join(f"{k} ×{v}" for k,v in d.get('resourceCosts',{}).items()) or 'none'
    rows.append((d['id'],d['name'],d['scope'],d['branch'],f"{d['coinCost']}/{d['progressCost']}/{d['upkeep']}",'; '.join(req) or 'none',d['exclusiveGroup'] or 'none',stats(d['effects']),material))
catalog += [table(['ID','Name','Scope','Branch','Coin/progress/upkeep','Prerequisites','Exclusive group','Effects','Materials'],rows),'','Evidence: `packages/content/src/development.ts:33-89`; costs and effect application: `packages/sim/src/development.ts:64-121,152-211,224-233`. Formation progress is battle XP, hearth progress civic points, faction progress influence. These are not paid from personal character XP.','', '## Characters, missions and skills','']
for key in ['characterRoles','characterMissions','characterSkills','commanderAbilities']:
    catalog += [f'### {key}', table(['ID','Name','Current description','Evidence'],[(x['definition']['id'],x['definition']['name'],x['definition']['description'],refs(x['evidence'])) for x in content[key]]),'']
catalog += ['## Magic paths and battle effects','National purchases above unlock the same two battle spells below, not two additional usable magical effects. Waykeepers share Flame 1/Rune 1 at recruitment; max caster strain is 10.','']
for key in ['magicPaths','battleSpells','innateBattleAbilities']:
    catalog += [f'### {key}',table(['ID','Name','Description','Evidence'],[(x['definition']['id'],x['definition']['name'],x['definition']['description'],refs(x['evidence'])) for x in content[key]]),'']
catalog += ['## Geography', table(['Biome ID','Name','Base worked-tile yield'],[(x['id'],x['name'],stats(x['yields'])) for x in content['geography']['biomes']]),'',table(['Size','Width','Height','Cells','Suggested faction seats'],[(x['size'],x['width'],x['height'],x['cells'],x['recommendedFactions']) for x in content['geography']['sizes']]),'','Evidence: `packages/mapgen/src/index.ts:13-61`; `packages/content/src/ecology.ts:17-21`. Suggested seats above 24 reuse definitions. These dimensions are not performance measurements.','',table(['Natural feature ID','Name','Description','Evidence'],[(x['definition']['id'],x['definition']['name'],x['definition']['description'],refs(x['evidence'])) for x in content['naturalFeatures']]),'', '## Public command inventory',f"{len(content['absence']['commandTypes'])} current command discriminants, imported from `commandSchema`; complete canonical interface at `packages/sim/src/types.ts:175-216`.",'',', '.join(f'`{x}`' for x in content['absence']['commandTypes']), '', '## Victory and diplomacy', 'Only `prosperity` is a terminal victory; one Hearth Exchange project. Peace is one-way coin transfer plus a 5–30 turn binding truce. Capture outcomes are `occupy`, `sack`, `raze`, `liberate`; context determines whether liberation is legal. Full schemas/actual pace values are preserved in `content.json` (`packages/sim/src/progression.ts:17-18,112-156`; `packages/sim/src/diplomacy.ts:9-40`; `packages/sim/src/siege.ts:128-147`).', '']
(owned/'catalog.md').write_text('\n'.join(catalog))

items=findings['findings']; counts=Counter(x['priority'] for x in items)
findings_table=table(['Priority','ID','Finding','Effort'],[(x['priority'],x['id'],x['title'],x['effort']) for x in items])
findings_table+='\n\n'+', '.join(f"{p}: {counts[p]}" for p in ['P0','P1','P2','P3'])+f"; {len(items)} entries. P0 means demonstrated catastrophic integrity/security failure or general unplayability; none established here. P1 blocks premium 1.0 or requires an explicit scope decision. XS/S/M/L/XL/XXL are increasing relative scope, from contained text to a multi-system program."
details=[]
for f in items:
    details += [f"### {f['id']} — {f['priority']} / {f['effort']} — {f['title']}",f"**Status:** {f['classification']}.",f"**Impact:** {f['impact']}",f"**Current code:** {f['current']}",f"**Evidence:** {'; '.join('`'+e+'`' for e in f['evidence'])}.",f"**Fresh verification / limit:** {f['verification']}",f"**Recommended bounded action:** {f['recommendation']}",f"**Dependencies:** {'; '.join(f['dependencies'])}. **Related gates:** {', '.join(f['gates']) or 'premium presentation criterion, no explicit audio gate assumed'}.",'']
verification=table(['Executed verification','Actual result'],[
    ('Current content import and validateContent()',f"Passed; `{content['validation']['hash']}`; counts shown above"),
    ('Field attack capacity boundary',f"{probes['fieldStackLimit']['blockedFormations']} rejected; {probes['fieldStackLimit']['battleDefenders']} accepted; rejection hash unchanged"),
    ('Paid stack reachability',f"{probes['paidStackReachability']['queuedPaidScouts']} paid scouts plus initial scout; {probes['paidStackReachability']['stackFormations']} co-located formations on turn {probes['paidStackReachability']['turn']}; no injected state; save roundtrip exact"),
    ('Authored garrison isolation',f"{len(probes['garrisonStackLimit']['rounds'])} turns: {probes['garrisonStackLimit']['rounds'][-1]['defenderFormations']} formations / {probes['garrisonStackLimit']['rounds'][-1]['defenderStrength']} strength remain; assault refused at zero defenses/supplies; hash/save checks pass"),
    ('Authored food/upkeep deficit',f"{len(probes['famineAndInsolvency']['rounds'])} turns of shortfalls; population {probes['famineAndInsolvency']['rounds'][-1]['population']}, food and treasury zero; heavy strength retained and morale/fatigue recover; save roundtrip exact"),
    ('Detached relationship valuation','Identical peace assessment with trust/respect at opposite extremes'),
    ('Audio scan',f"{len(content['audio']['sourcePaths'])} production TS/TSX files; {len(content['audio']['hits'])} source hits; {len(content['audio']['trackedAudioFiles'])} tracked audio filenames")
])
report=(owned/'report-template.md').read_text().replace('<!-- INVENTORY_SUMMARY -->',summary).replace('<!-- FINDINGS_TABLE -->',findings_table).replace('<!-- FINDINGS_DETAILS -->','\n'.join(details)).replace('<!-- VERIFICATION_SUMMARY -->',verification)
assert '<!-- ' not in report
(owned/'report.md').write_text(report)

# Check every structured inventory evidence range and finding range. This is not
# a semantic review of each claim, only a guard against missing/bad citations.
evidence=[]
def collect(obj):
    if isinstance(obj,dict):
        if {'path','startLine','endLine'} <= obj.keys(): evidence.append(obj)
        for value in obj.values():collect(value)
    elif isinstance(obj,list):
        for value in obj:collect(value)
collect(content)
for f in items:
    for ref in f['evidence']:
        m=re.fullmatch(r'(.+):(\d+)-(\d+)',ref);assert m,ref
        evidence.append({'path':m[1],'startLine':int(m[2]),'endLine':int(m[3])})
for e in evidence:
    path=root/e['path'];assert path.is_file(),path
    size=len(path.read_text().splitlines())
    assert 1<=e['startLine']<=e['endLine']<=size,(e,size)
expected={'units':'units','buildings':'buildings','resources':'resources','improvements':'improvements','technologies':'technologies','institutions':'institutions','doctrines':'doctrines','development':'developmentNodes','arcaneDiscoveries':'arcaneDiscoveries','magicPaths':'magicPaths','battleSpells':'battleSpells','innateBattleAbilities':'innateBattleAbilities','commanderAbilities':'commanderAbilities','characterRoles':'characterRoles','characterMissions':'characterMissions','characterSkills':'characterSkills','naturalFeatures':'naturalFeatures'}
for key,total in expected.items():
    ids=[x['definition']['id'] for x in content[key]]
    assert len(ids)==len(set(ids))==content['validation'][total],key
assert len(content['factions'])==content['validation']['factions']
assert len(set(x['id'] for x in items))==len(items)
assert all(x['priority'] in findings['priorityDefinitions'] and x['effort'] in findings['effortDefinitions'] for x in items)
result={'catalogRows':{k:len(content[k]) for k in expected},'findingCount':len(items),'priorities':{p:counts[p] for p in ['P0','P1','P2','P3']},'validatedCitationRanges':len(evidence),'probeGroups':len(probes)-1,'commands':len(content['absence']['commandTypes']),'outputs':['report.md','catalog.md']}
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
assert head==content['baseline']==findings['baseline']
production_diff=subprocess.check_output(['git','diff','HEAD','--name-only','--','packages','apps'],cwd=root,text=True).splitlines()
assert not production_diff,production_diff
artifacts=['content.json','audio-search.json','findings.json','report.md','catalog.md','probe-results.json','inventory.ts','probes.ts','build_report.py','report-template.md']
verification={'verifiedAtUtc':datetime.now(timezone.utc).isoformat(),'baseline':head,'contentValidation':content['validation'],'checks':result,'productionPathsDifferingFromHead':production_diff,'limits':['no broad test suite','no benchmark','no browser or audio listening','no full campaign completion'],'artifacts':[{'path':str(owned/f),'bytes':(owned/f).stat().st_size,'sha256':hashlib.sha256((owned/f).read_bytes()).hexdigest()} for f in artifacts]}
(owned/'verification.json').write_text(json.dumps(verification,indent=2)+'\n')
print(json.dumps({**result,'baseline':head,'productionPathsDifferingFromHead':production_diff,'verification':str(owned/'verification.json')},indent=2))
