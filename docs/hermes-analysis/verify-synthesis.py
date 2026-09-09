#!/usr/bin/env python3
"""Verify audit integrity without turning documented product failures green."""
from pathlib import Path
from urllib.parse import unquote
import collections
import csv
import datetime
import gzip
import hashlib
import json
import os
import re
import statistics
import subprocess

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent.parent
errors=[]
checks=[]

def require(condition,label,details=None):
    checks.append({'check':label,'passed':bool(condition),'details':details})
    if not condition: errors.append({'check':label,'details':details})

def load(relative):
    return json.loads((BASE/relative).read_text())

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

issues=load('top-25.json')
score=load('scorecard.json')
art=load('art/art-backlog.json')
qa=load('qa/checks.json')
rows=list(csv.DictReader((BASE/'campaigns/outcomes.csv').open()))
require(len(issues)==25 and [x['rank'] for x in issues]==list(range(1,26)),'exactly 25 ranked issues')
ids={x['id'] for x in issues}
require(len(ids)==25,'unique issue IDs')
require(all(x['priority'] in ['P0','P1','P2','P3'] and x['effort'] in ['XS','S','M','L','XL','XXL'] for x in issues),'priority and effort vocabulary')
required=['rank','priority','issue','basis','evidence','files','impact','why','solution','acceptance','effort','dependencies']
require(all(all(k in x for k in required) for x in issues),'issue evidence and execution fields')
require(all(set(x['dependencies'])<=ids and x['id'] not in x['dependencies'] for x in issues),'valid issue dependency references')
visited=set();active=set();cycles=[]
byid={x['id']:x for x in issues}
def visit(i):
    if i in active: cycles.append(i);return
    if i in visited:return
    active.add(i)
    for j in byid[i]['dependencies']:visit(j)
    active.remove(i);visited.add(i)
for i in ids:visit(i)
require(not cycles,'acyclic implementation dependencies',cycles)
require(len(score['areas'])==19,'19-area scorecard')
score_value=statistics.mean(x['current'] for x in score['areas'])*10
require(len(load('system-dimensions.json')['dimensions'])==16,'16 systems with eight dimensions')
require(len(load('roadmap.json'))==8,'eight dependency roadmap phases')
art_csv=list(csv.DictReader((BASE/'art/art-backlog.csv').open()))
require(len(art['items'])==len(art_csv)==27,'27 matching JSON/CSV art-backlog rows')
require({x['id'] for x in art['items']}=={x['id'] for x in art_csv},'same art JSON/CSV IDs')

# Check actual compressed primary command traces, rather than summing claims only.
primary=[]
seals={x['name']:x for x in load('verification/parent-command-counts.json')['campaigns']}
for row in rows:
    trace=BASE/'campaigns/runs'/row['name']/'commands.jsonl.gz'
    count=0;rejected=0;first=None;last=None
    with gzip.open(trace,'rt') as f:
        for line in f:
            data=json.loads(line);count+=1
            if first is None:first=data['sequence']
            last=data['sequence']
            result=data['result']
            # The actual command/result trace records an explicit `ok` boolean.
            if not isinstance(result,dict) or not isinstance(result.get('ok'),bool):
                raise ValueError('Unknown command result schema in '+str(trace))
            if not result['ok']:rejected+=1
    require(count==int(row['commands']) and first==1 and last==count,'command trace '+row['name'],{'rows':count,'first':first,'last':last})
    require(sha(trace)==seals[row['name']]['compressedSha256'],'retained command hash '+row['name'])
    require(int(row['rejections'])==0 and rejected==0,'zero rejected ordinary commands '+row['name'])
    primary.append({'name':row['name'],'commands':count,'rejections':rejected,'finalTurn':int(row['finalTurn']),'winner':row['winner'],'hash':row['hash']})
require(len(primary)==8 and sum(x['commands'] for x in primary)==125150,'eight primary campaigns /125150 commands')
manifest=load('campaigns/verification-manifest.json')
require(len(manifest['campaigns'])==8 and all(x['exactFinalBytes'] for x in manifest['campaigns']),'eight independently retained exact full replays')
require(sum(bool(x.get('midpointFinalExact')) for x in manifest['campaigns'])==7,'seven successful midpoint continuations')
require(sum(not any(e['stage']=='final-load' for e in x['errors']) for x in manifest['campaigns'])==7,'seven loadable final saves, not eight')

# Per-command exits and raw machine reporter counts.
require(len(qa['commands'])==43,'43 QA command records')
exit_counts=collections.Counter(str(x['exitCode']) for x in qa['commands'])
require(exit_counts=={'0':31,'1':12},'QA per-command exits preserved',dict(exit_counts))
for cmd in qa['commands']:
    path=BASE/'qa'/cmd['resultFile']
    record=json.loads(path.read_text())
    require(record['exitCode']==cmd['exitCode'] and (BASE/'qa'/cmd['log']).is_file(),'QA retained result/log '+cmd['name'])
unit=load('qa/unit-results.json')
require(unit['numTotalTests']==1604 and unit['numPassedTests']==1603 and unit['numFailedTests']==1,'full unit test counts from raw JSON')
require(len(unit['testResults'])==184,'184 unit test files from raw JSON')
for file,count in [('qa/gameplay-results.json',149),('qa/production-results.json',4)]:
    stats=load(file)['stats']
    require(stats['expected']==count and not stats['unexpected'] and not stats['skipped'] and not stats['flaky'],file+' raw gate counts')

# Verify selected delegated artifacts by exact sealed handles.
artseal=load('art/evidence/final-verification.json')
for record in artseal['deliverables']:
    p=Path(record['path'])
    require(p.is_file() and p.stat().st_size==record['bytes'] and sha(p)==record['sha256'],'sealed delegated artifact '+p.name)
archive=load('qa/large-archive.json');p=BASE/'qa'/archive['source']
require(p.stat().st_size==archive['compressedCaptureBytes'] and sha(p)==archive['compressedSha256'],'exact over-limit captured campaign')
require(archive['envelopeBytes']>archive['limitBytes'] and archive['snapshotError'] is None,'valid-snapshot / oversized-archive distinction retained')
content=load('systems/content.json')
counts={k:len(content[k]) for k in ['factions','units','buildings','improvements','resources','technologies','development','battleSpells','characterRoles','characterSkills']}
require(counts=={'factions':24,'units':13,'buildings':5,'improvements':18,'resources':8,'technologies':10,'development':25,'battleSpells':2,'characterRoles':4,'characterSkills':17},'actual executable content counts',counts)
inv=load('art/inventory.json')
require(len(inv['assets'])==545,'545 actual inventoried approvals')

# Rendered document completeness and working links (including other core reports).
main_docs=[ROOT/'hermes-analysis',BASE/'README.md']
docs=main_docs+[BASE/f for f in ['ui/findings.md','campaigns/README.md','campaigns/runs/README.md','campaigns/findings.md','systems/report.md','art/art-report.md','qa/report.md','references/comparison.md','skill-recommendation.md']]
missing=[];links=0;range_errors=[];ranges=set()
for doc in docs:
    text=doc.read_text()
    if doc in main_docs:
        nums=[int(x) for x in re.findall(r'^## (\d+)\. ',text,re.M)]
        require(nums==list(range(1,21)),doc.name+' includes all20 requested sections',nums)
        require('{{' not in text and 'audit in progress' not in text.lower() and '**NO' in text,doc.name+' finalized with no placeholders')
        require(f'{round(score_value)}/100' in text and 'R01 — Make every accepted battle transition save/load safe' in text,doc.name+' same score and single next task')
    for m in re.finditer(r'\[[^\]]+\]\(([^\s)]+)\)',text):
        target=m.group(1)
        if re.match(r'\w+://|mailto:|#',target):continue
        rel=unquote(target.split('#',1)[0])
        path=(doc.parent/rel).resolve();links+=1
        # This verifier's report is written only after its own checks complete.
        if path==BASE/'verification/final-audit.json':continue
        if not path.is_file():missing.append({'document':str(doc.relative_to(ROOT)),'target':target,'resolved':str(path)})
    # Validate unambiguous repository source path/line ranges, not shorthand basenames.
    for m in re.finditer(r'((?:packages|apps|tests|scripts|tools|docs)/[A-Za-z0-9_.\-/]+\.(?:ts|tsx|py|md|mjs)):(\d+)(?:[-–](\d+))?',text):
        path,start,end=m.group(1),int(m.group(2)),int(m.group(3) or m.group(2))
        ranges.add((path,start,end))
for path,start,end in sorted(ranges):
    p=ROOT/path
    if not p.is_file() or not 1<=start<=end<=len(p.read_text().splitlines()):range_errors.append([path,start,end])
require(not missing,'relative evidence files resolve',missing)
require(not range_errors,'cited repository line ranges exist',range_errors)
require(set(re.findall(r'<a id="(r\d+)"',main_docs[0].read_text()))=={x.lower() for x in ids},'all25 detailed issue anchors')

tracked=subprocess.check_output(['git','diff','--name-only'],cwd=ROOT,text=True).splitlines()
staged=subprocess.check_output(['git','diff','--cached','--name-only'],cwd=ROOT,text=True).splitlines()
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
status=subprocess.check_output(['git','status','--short'],cwd=ROOT,text=True).splitlines()
require(not tracked and not staged and head=='b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd','unchanged tracked production/index/baseline',{'tracked':tracked,'staged':staged,'head':head})
artifacts=[{'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p)} for p in main_docs]
report={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'auditIntegrityPassed':not errors,'releaseReady':False,'scope':'This verifies the audit and preserves known game failures; it does not certify remediation or release.','checksPassed':sum(x['passed'] for x in checks),'checksTotal':len(checks),'errors':errors,'score':round(score_value,1),'roundedScore':round(score_value),'issueCounts':dict(collections.Counter(x['priority'] for x in issues)),'artRows':len(art['items']),'primaryCampaigns':primary,'commandCount':sum(x['commands'] for x in primary),'qaCommandExits':dict(exit_counts),'relativeLinksChecked':links,'codeRangesChecked':len(ranges),'gitStatus':status,'artifacts':artifacts,'checks':checks}
(BASE/'verification/final-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['checks','primaryCampaigns']},indent=2))
raise SystemExit(0 if not errors else 1)
