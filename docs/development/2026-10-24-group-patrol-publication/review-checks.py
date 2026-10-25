"""Read-only factual checks; writes only review-checks.json in this packet."""
from pathlib import Path
import hashlib,json,re,struct,subprocess
ROOT=Path.cwd(); PIN='8d880eb60cdca549d5ff1086ef95e095e81feea5'
PACKET=ROOT/'docs/development/2026-10-24-group-patrol-publication'
def original(path): return subprocess.check_output(['git','show',f'{PIN}:{path}'])
def sha(blob): return hashlib.sha256(blob).hexdigest()
def exists(path): return subprocess.run(['git','cat-file','-e',f'{PIN}:{path}'],capture_output=True).returncode==0
mediaPath='apps/web/src/updates/media.json'; media=json.loads(Path(mediaPath).read_text()); old=json.loads(original(mediaPath))
assert len(old['assets'])==20 and len(media['assets'])==21
assert media['assets'][:-1]==old['assets']
assert media['sharedMaterials']==old['sharedMaterials']
for item in old['assets']:
 path='apps/web/public/'+item['path']; assert Path(path).read_bytes()==original(path)
assert Path(mediaPath).read_bytes()==Path('apps/web/public/updates/provenance.json').read_bytes()
asset=media['assets'][-1]; binary=Path('apps/web/public/'+asset['path']).read_bytes()
assert asset['id']=='group-patrol-actions' and asset['sourceRevision']==PIN
assert binary==original(asset['sourcePath'])==Path(asset['sourcePath']).read_bytes()
assert len(binary)==31103 and sha(binary)=='5a1a6eb8f4cfaf0b2c66fb9832887cd16faf009d70dc36185565b8c76cd921fc'
assert struct.unpack('>II',binary[16:24])==(318,149)
assert asset['crop'] is None and asset['resize'] is None
actualBytes=sum(len(Path('apps/web/public/'+a['path']).read_bytes()) for a in media['assets'])
assert actualBytes==3512941==media['totalJournalImageBytes']
assert media['journalImageBudgetBytes']==old['journalImageBudgetBytes']==3670016
contentPath='apps/web/src/updates/content.ts'; content=Path(contentPath).read_text()
stripped='\n'.join(line for line in content.split('\n') if 'groupPatrolDispatch' not in line)
assert stripped.encode()==original(contentPath)
modules=re.findall(r"from '(\./[^']+)'",original(contentPath).decode())
for module in modules:
 path='apps/web/src/updates/'+module[2:]+'.ts'; assert Path(path).read_bytes()==original(path)
articlePath='apps/web/src/updates/group-patrol-dispatch.ts'; text=Path(articlePath).read_text()
article=json.loads(text.split('= ',1)[1].rstrip().removesuffix(';'))
assert article['sourceRevision']==PIN and article['sequence']==18 and article['id']=='group-patrols'
assert len(article['evidence'])==11
for evidence in article['evidence']: assert exists(evidence['path']),evidence['path']
libraryPath='apps/web/src/updates/library.ts'; library=Path(libraryPath).read_text()
assert f"libraryRevision = '{PIN}'" in library
paths=sorted(set(re.findall(r"path: ['\"]([^'\"]+)['\"]",library)))
for path in paths: assert exists(path),path
files=[articlePath,contentPath,libraryPath,mediaPath,'apps/web/public/updates/provenance.json','apps/web/public/'+asset['path']]
report={'sourcePin':PIN,'historicalContentAndImportedModulesUnchanged':True,'historicalImportedModules':modules,'priorImagesUnchanged':20,'priorImageMetadataUnchanged':True,'sharedMaterialsUnchanged':True,'articleEvidencePathsAtPin':len(article['evidence']),'libraryUniquePathsAtPin':len(paths),'publicManifestExact':True,'image':{'path':asset['path'],'sourcePath':asset['sourcePath'],'bytes':len(binary),'width':318,'height':149,'sha256':sha(binary),'sourceAtPinExact':True},'imageInventoryBytes':actualBytes,'budgetBytes':media['journalImageBudgetBytes'],'remainingBytes':media['journalImageBudgetBytes']-actualBytes,'sources':{path:sha(Path(path).read_bytes()) for path in files},'limitations':['No browser/build/test executed by this review helper.','Catalogue counts are recorded separately from actual typed exports.','Displayed reader captures require separate visual inspection.']}
(PACKET/'review-checks.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['sources','historicalImportedModules','limitations']},indent=2))
