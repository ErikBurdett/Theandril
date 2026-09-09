#!/usr/bin/env python3
"""Render both requested audit documents from retained evidence and editorial data."""
from pathlib import Path
import collections
import csv
import json
import re
import statistics

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent.parent

def load(name):
    return json.loads((BASE / name).read_text())

def cell(value):
    if isinstance(value, dict):
        value = '; '.join(f'{k}: {cell(v)}' for k, v in value.items())
    elif isinstance(value, list):
        value = '; '.join(map(str, value))
    return str(value).replace('|', '\\|').replace('\n', '<br>')

def table(headers, rows):
    return '\n'.join(['| ' + ' | '.join(headers) + ' |', '| ' + ' | '.join(['---'] * len(headers)) + ' |'] + ['| ' + ' | '.join(cell(c) for c in r) + ' |' for r in rows])

issues = load('top-25.json')
scores = load('scorecard.json')
dimensions = load('system-dimensions.json')
art = load('art/art-backlog.json')['items']
qa = load('qa/checks.json')
campaigns = list(csv.DictReader((BASE / 'campaigns/outcomes.csv').open()))
priorities = collections.Counter(x['priority'] for x in issues)
score = statistics.mean(x['current'] for x in scores['areas']) * 10
assert len(issues) == 25 and [x['rank'] for x in issues] == list(range(1, 26))
assert len({x['id'] for x in issues}) == 25
assert len(scores['areas']) == 19 and len(dimensions['dimensions']) == 16
assert len(art) == 27 and len(campaigns) == 8
assert sum(int(x['commands']) for x in campaigns) == 125150

score_rows = [[x['area'], f"{x['current']:g}/10", f"{x['target']:g}/10", f"{x['target']-x['current']:g}", x['reason']] for x in scores['areas']]
score_rows += [['**Overall**', f'**{round(score)}/100**', '**90+/100**', f'{90-score:.1f} to 90', 'Editorial index; hard release gates override the average.']]
score_table = table(['Area', 'Current', '1.0 floor', 'Gap', 'Evidence-based reason'], score_rows)
dim_table = table(['System / current state', 'Complete', 'Depth', 'Usable', 'Importance', 'Breadth', 'AI', 'Polish', 'Ready'], [[x['system'] + ' — ' + x['status']] + [x[k] for k in ['completeness','depth','usability','strategicImportance','contentBreadth','aiCompetence','polish','readiness']] for x in dimensions['dimensions']])
compact_issues = table(['Rank / ID', 'Priority', 'Issue and player impact', 'Effort', 'Dependencies'], [[f"{x['rank']}. [{x['id']}](../../hermes-analysis#{x['id'].lower()})", x['priority'], x['issue'] + ' — **' + x['impact'] + '**', x['effort'], ', '.join(x['dependencies']) or 'Independent'] for x in issues])
issue_cards = []
for x in issues:
    issue_cards.append(f'''<a id="{x['id'].lower()}"></a>
### {x['rank']}. {x['id']} — {x['issue']}

**{x['priority']} · Effort {x['effort']} · Impact {x['impact']} · Basis: {x['basis']}**

- **Evidence / where / how:** {x['evidence']}
- **Player consequence:** {x['why']}
- **Desired experience and implementation:** {x['solution']}
- **Acceptance:** {x['acceptance']}
- **Dependencies:** {', '.join(x['dependencies']) or 'Independent.'}
- **Files / exact evidence:** {'; '.join('`'+p+'`' for p in x['files'])}
''' + ('\nEffort split: ' + x['effortNote'] + '\n' if x.get('effortNote') else ''))

# Use actual retained CSV fields, with an intentionally readable display width.
campaign_table = table(['Policy / seed', 'Map / seats / pace', 'Final turn', 'Winner', 'Battles / captures', 'Hash'], [[x['name'], x['size']+' / '+x['factions']+' / '+x['pace'], x['finalTurn'], x['winner'] or 'None at bound', x['battleCount']+' / '+x['captureDecisions'], '`'+x['hash']+'`'] for x in campaigns])

content_md = (BASE / 'systems/catalog.md').read_text()
content_table = content_md.split('## Summary\n',1)[1].split('\n## Units',1)[0].strip()
systems_md = (BASE / 'systems/report.md').read_text()
system_detail = systems_md.split('## 4. System depth and actual loop connections\n',1)[1].split('\n## 5.',1)[0].strip()
system_detail = re.sub(r'^### 4\.(\d+) ', r'### System assessment \1 — ', system_detail, flags=re.M)
system_detail += '\n\nThe source inspection above is reconciled with the fresh campaign/QA results in sections 10/14/15; statements scoped to that sub-audit are not additional independent runtime claims.'

art_compact = table(['ID / priority', 'Family / gap kind', 'Proposed quantity', 'Native size / motion'], [[x['id']+' / '+x['priority'], x['assetFamily']+' — '+x['gapKind'], {'new':x['missingQuantityEstimate'],'revision':x['revisionQuantityEstimate']}, x['desiredNativeResolution']+'; '+x['animationRequirement']] for x in art])
art_cards=[]
for x in art:
    pipe=x['pipelineApplicability']
    art_cards.append(f'''### {x['id']} — {x['assetFamily']}

**{x['priority']} · {x['gapKind']}**

- **Existing coverage:** {x['existingQuantity']} {x['quantityUnit']}; current consumer: {x['currentConsumer']}
- **Existing IDs:** {', '.join('`'+i+'`' for i in x['existingAssetIds']) or 'None in the current catalog for this proposed family.'}
- **Missing/new estimate:** {cell(x['missingQuantityEstimate'])}; **revision estimate:** {cell(x['revisionQuantityEstimate'])}.
- **Quantity assumptions:** {x['estimationAssumptions']}
- **Resolution / animation:** {x['desiredNativeResolution']}; {x['animationRequirement']}
- **Source/generation pipeline — Blender:** {pipe['Blender']}
- **Source/finishing pipeline — Pixel Factory:** {pipe['PixelFactory']}
- **Hand cleanup / review:** {pipe['handReview']}
- **Quality standard / required correction:** {x['acceptance']}
- **Mechanics / binding dependencies:** {x['mechanicsDependencies']}
''')

qa_table = table(['Fresh gate', 'Result', 'Exact evidence'], [
 ['Typecheck / lint / content', 'Pass / pass / pass', '[logs](qa/report.md#1-exact-gate-results)'],
 ['Full Vitest', '1,603/1,604 tests; 183/184 files; one contact assertion fails', '[raw JSON](qa/unit-results.json)'],
 ['Forced build / clean comparison', 'Pass; 26 matching outputs, 8,836,874 bytes', '[comparison](qa/build-comparison.json)'],
 ['Chromium gameplay', '149/149 pass, zero skipped/flaky', '[JSON](qa/gameplay-results.json)'],
 ['Production Chromium smoke', '4/4 pass; initial audit launch error superseded', '[JSON](qa/production-results.json)'],
 ['Art validation / art benchmark', 'Both pass', '[logs](qa/report.md#1-exact-gate-results)'],
 ['Scale / composed / storage', 'Complete; workload limitations apply', '[measurements](qa/report.md#4-campaign-e-performance-and-stress)'],
 ['Unmodified default chronicles', '**Fail** — strict save validation; independent large-archive repro also fails', '[log](qa/logs/benchmark-chronicles.log)']
])

roadmap = [
 {'phase':'A — Critical Foundations','prerequisites':'Current retained failing cases; no prior phase','work':'R01 canonical battle-save safety, then R02 archive policy and R03 bounded contestable stacks. Reproduce red contact gate; local R23 key fix and R18 binding can run in parallel. Preserve old save slots and version boundaries.','exit':'Both independent save causes resolved, every legal stack contestable, retained reproducers green under unchanged meaningful validation. Archive restore/replay and fault protection measured.','ids':['R01','R02','R03','R18','R23']},
 {'phase':'B — Core Strategic Depth','prerequisites':'A safe state/warfare contracts','work':'Choose and implement released victory/defeat set with counterplay; meaningful deficits/material tradeoffs; role-aware deployment; production correction and bounded diplomatic obligations. R09 starts as one paid/counterable strategic magical loop.','exit':'Ordinary player and AI commands demonstrate different winning plans and counters; no UI-only rule duplicates or resource dead ends.','ids':['R05','R09','R10','R11','R12','R13','R25']},
 {'phase':'C — Content & Faction Identity','prerequisites':'B interfaces; explicit written-scope decisions','work':'Prove two contrasting cultures, distinct access/constraints, transformative practical/magical progression and one consequential independent discovery/event loop. Expand accepted content, not shallow templates.','exit':'Choosing another released culture changes opening, army/resource priorities and late plan; content has AI, UI, save/replay and original visual/audio consumers.','ids':['R08','R09','R14','R15','R25']},
 {'phase':'D — AI & Campaign Quality','prerequisites':'Co-develop with B/C, consolidate when their contracts stabilize','work':'R06 saved objectives, route/progress/loop checks, economic sustainability and executed project-threat plans. Tune R04 pace against contact/decision/quiet-turn distributions, not price alone.','exit':'Original contact gate passes; multiple generated land/naval campaigns demonstrate useful late operations and contestable endings; no hidden-information cheats.','ids':['R04','R06','R11']},
 {'phase':'E — UI / Player Experience','prerequisites':'Prototype on existing quotes now; finalize with B/C semantics','work':'R07 attention/forecasts; R10 corrective queues; R20 economic/military/history comparison; R16 optional state-aware teaching; battle preview/aftermath.','exit':'External new players complete a first loop;2/10/40-town tasks have measured bounded navigation; narrow/keyboard/focus and accessible information are exercised.','ids':['R07','R10','R16','R20','R24']},
 {'phase':'F — Art / Animation / Audio','prerequisites':'Binding/contracts now; new content IDs from B/C; budgets with A/H','work':'R18 binding and four strategic specialists, R19 rig/biome/interface pilots, R17 audio runtime and original small audition set. Iterate native/context/playback review, then scale accepted families.','exit':'No failed current-role bindings; deliberate native art/animation and fog-safe sound actually work in game, with bounded residency/voices and preserved provenance.','ids':['R17','R18','R19']},
 {'phase':'G — Balance / Long Campaign Testing','prerequisites':'Integrated B–F slices, with continuous earlier regression','work':'Multiseed/multifaction ordinary campaigns, human trials, material/tech/victory distributions, AI trajectories, recovery and complete archives at supported long-scale settings.','exit':'Every released victory can be won/lost/countered; no systematic unwinnable matchup or extended empty endgame; failures retained and fixed instead of thresholds hidden.','ids':['R04','R06','R08','R21','R22']},
 {'phase':'H — Release Candidate','prerequisites':'A/G gates, current presentation and support matrix','work':'Freeze supported settings/version policy; full unchanged checks, real-GPU/min-spec/mobile/browser tests, Node22 clean online/deployed smoke, migrations/quota/crash recovery, licenses, release notes and final polish.','exit':'Zero P0s, completed adopted P1 scope, no unexplained gate failures, full advertised-scale save/replay and reproducible release evidence. Editorial score never substitutes for gates.','ids':['R21','R22']}
]
roadmap_table=table(['Phase','Dependencies','Implementation work','Exit evidence'],[[r['phase'],r['prerequisites'],r['work'],r['exit']] for r in roadmap])
(BASE/'roadmap.json').write_text(json.dumps(roadmap,indent=2)+'\n')

core_detail='''### Where the core loop breaks, and which interactions to deepen

| Link | Fresh or implementation evidence | Desired consequential interaction |
|---|---|---|
| Explore → decide | Campaign A finds land/resources but no encountered independent decision; generated geography/cultivation restrictions are real. | A discovered site or independent actor changes a capability, claim or obligation, not merely yields a collectible. |
| Decide → invest | Costs, queues, workers and paid improvements work; three unused households go unnoticed. | Forecast and compare outputs/opportunity costs, then make the chosen policy observable in the empire overview. |
| Invest → expand | Growth, escalating founding and civic upkeep, land claims and ships operate; observed towns exceed historical caps. | Distinct tall/wide economies constrained by meaningful sustainable costs, with recovery rather than silent invulnerability or punitive traps. |
| Encounter → adapt | Pikes/missiles/cavalry, real losses and earned training exist; 21 defenders refuse combat. | Contestable force participation, purposeful deployments, finite supply and visible counters; preserve deterministic soldier facts. |
| Adapt → specialize |25 development nodes and two exclusive institution/doctrine choices exist. | Research/material/faction commitments unlock different actions and risks, not mostly the same stat ladder. |
| Conflict → consequence | Capture choices, persistent casualties, XP and history are real. | A player can inspect consequences, remember people/places, and save immediately after every accepted outcome. |
| Consequence → payoff | One real Prosperity path; Epic's long quiet accumulation dominates its second half. | Competing public goals with counterplay, late pressure and a factual, satisfying ending that remains exportable. |

A useful depth test for a proposed addition is: **Does it change another system's available decisions, impose an intelligible opportunity cost, and give an opponent a response?** A new resource, spell or faction that fails that test should not inflate the completion count. No global optimum is established from the limited strategy/seed sample.
'''

factory_md=(BASE/'art/art-report.md').read_text()
factory_detail=factory_md.split('### Standalone BlenderArtFactory\n',1)[1].split('\n## Explicit backlog',1)[0]
factory_detail='### Inspected production capabilities and exact boundaries\n\n'+factory_detail
# Source document links are rebased to this report before the root transformation.
def rebase(md, source):
    def sub(m):
        label,target=m.group(1),m.group(2)
        if re.match(r'\w+://|mailto:|#', target): return m.group(0)
        path,sep,frag=target.partition('#')
        resolved=(source/path).resolve()
        import os
        rel=os.path.relpath(resolved,BASE)
        return f'[{label}]({rel}{sep}{frag})'
    return re.sub(r'\[([^\]]+)\]\(([^\s)]+)\)',sub,md)
factory_detail=rebase(factory_detail,BASE/'art')
comparison=rebase((BASE/'references/comparison.md').read_text(),BASE/'references')
comparison=re.sub(r'^# ', '### ', comparison,flags=re.M)
comparison=re.sub(r'^## ', '#### ', comparison,flags=re.M)

index=table(['Evidence family','Entry point / exact handles','Scope'],[
 ['Systems/content','[report](systems/report.md), [catalog](systems/catalog.md), [full exports](systems/content.json), [probes](systems/probe-results.json)','Code ranges, actual definitions, five asserted probe groups; no invented lore consumers'],
 ['Natural/manual UI','[findings](ui/findings.md), [actions](ui/actions.jsonl), [turn30 state](ui/30-natural-turn30.json)','Numbered PNG/TXT/JSON evidence and exported saves; fixtures explicitly separate'],
 ['B/C/D campaigns','[reproduction](campaigns/README.md), [outcomes](campaigns/outcomes.csv), [verification](campaigns/verification-manifest.json), [full traces](campaigns/runs/README.md)','Eight primary current-schema scenarios; compressed exact commands/snapshots and retained failures'],
 ['QA and stress','[report](qa/report.md), [43 command records](qa/checks.json), [archive446](qa/large-archive.json)','Unit/gameplay/production/clean builds, performance, save/DOM repros and environment'],
 ['Art and factories','[report](art/art-report.md), [inventory](art/inventory.json), [factory matrix](art/factory-audit.json), [backlog JSON](art/art-backlog.json), [CSV](art/art-backlog.csv)','Native/runtime/source evidence, actual representative pixels, bounded audio scan; no fresh publication'],
 ['Parent checks','[repro exits](verification/parent-checks.json), [command counts](verification/parent-command-counts.json), [pixel cross-check](verification/parent-visual-findings.md)','Independent defect/positive replay checks, trace counts and actual overlapping pixel review'],
 ['Scores/priorities','[scorecard](scorecard.json), [system dimensions](system-dimensions.json), [25 issues](top-25.json), [roadmap](roadmap.json)','Editorial diagnosis and proposed work, not implementation'],
 ['Final audit verification','[machine-readable verification](verification/final-audit.json)','Counts, links, code-range targets, evidence hashes and unchanged production tracked state'],
 ['Comparison / skill','[retrieved-source comparison](references/comparison.md), [procedural recommendation](skill-recommendation.md)','Design lessons with sourced claims, not competitor playtests or an auto-running task']
])

values={'SCORE_ROUNDED':str(round(score)),'SCORE_EXACT':f'{score:.1f}','AREA_COUNT':str(len(scores['areas'])),'P0_COUNT':str(priorities['P0']),'P1_COUNT':str(priorities['P1']),'P2_COUNT':str(priorities['P2']),'ISSUE_COUNT':str(len(issues)), 'TOP_25':compact_issues,'SCORE_TABLE':score_table,'SYSTEM_DIMENSIONS':'See the [eight-dimension matrix](system-dimensions.json), included in full in the detailed audit.','SYSTEM_DETAIL':'','CORE_LOOP_DETAIL':'','CAMPAIGN_TABLE':campaign_table,'ART_BACKLOG':art_compact,'FACTORY_DETAIL':'','COMPARISON_DETAIL':'','ROADMAP':roadmap_table,'EVIDENCE_INDEX':index,'CONTENT_TABLE':content_table,'QA_GATE_TABLE':qa_table}
template=(BASE/'synthesis-template.md').read_text()
def render(replacements):
    result=template
    for key,value in replacements.items(): result=result.replace('{{'+key+'}}',value)
    assert not re.search(r'\{\{[A-Z_]+\}\}',result)
    return result
executive=render(values)
executive=executive.replace('\n\n\n','\n\n')
executive=executive.replace('**Final audit disposition:', '[Detailed living audit: `hermes-analysis`](../../hermes-analysis)\n\n**Final audit disposition:',1)
(BASE/'README.md').write_text(executive)
full=dict(values)
full.update(TOP_25='\n'.join(issue_cards), SYSTEM_DIMENSIONS=dim_table,SYSTEM_DETAIL=system_detail,CORE_LOOP_DETAIL=core_detail,ART_BACKLOG='\n'.join(art_cards),FACTORY_DETAIL=factory_detail,COMPARISON_DETAIL=comparison)
detailed=render(full)
detailed=detailed.replace('# Theandril — premium 1.0 readiness audit','# hermes-analysis\n\n## Theandril — detailed premium 1.0 readiness audit',1)
detailed=detailed.replace('**Final audit disposition:', 'This structured Markdown document is the Canvas-equivalent living audit. [Executive/actionable README](README.md) and the retained evidence form its traceable companion set.\n\n**Final audit disposition:',1)
# Root report uses repo-relative links; descriptions of raw source paths remain verbatim.
def root_links(m):
    label,target=m.group(1),m.group(2)
    if re.match(r'\w+://|mailto:|#',target): return m.group(0)
    path,sep,frag=target.partition('#')
    import os
    rel=os.path.relpath((BASE/path).resolve(),ROOT)
    return f'[{label}]({rel}{sep}{frag})'
detailed=re.sub(r'\[([^\]]+)\]\(([^\s)]+)\)',root_links,detailed)
detailed=detailed.replace('\n\n\n','\n\n')
(ROOT/'hermes-analysis').write_text(detailed)
aggregate=load('verification/aggregate-checks.json')
aggregate.update(score=round(score,1),roundedScore=round(score),areas=len(scores['areas']),issueCount=len(issues),priorities=dict(priorities),primaryCampaignCount=len(campaigns),commands=sum(int(x['commands']) for x in campaigns),artBacklogRows=len(art))
(BASE/'verification/aggregate-checks.json').write_text(json.dumps(aggregate,indent=2)+'\n')
print(json.dumps({'detailedBytes':len(detailed.encode()),'readmeBytes':len(executive.encode()),'score':round(score,1),'issues':len(issues),'artRows':len(art),'roadmapPhases':len(roadmap)},indent=2))
