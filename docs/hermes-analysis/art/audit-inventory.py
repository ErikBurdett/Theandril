"""Read-only production inventory; generated audit artifacts stay beside this file."""
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import cast
import hashlib, json, os, re, struct, subprocess
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
EVIDENCE = OUT / 'evidence'
EVIDENCE.mkdir(exist_ok=True)
sha = lambda data: hashlib.sha256(data).hexdigest()
load = lambda path: json.loads(path.read_text())
relative = lambda path: str(path.relative_to(ROOT))
cat_path = ROOT / 'assets/art/runtime/catalog.json'
cat = load(cat_path)
validation = load(EVIDENCE / 'native-validation.json')
families = validation['factionFamilies']
live = set(validation['liveArtIds'])
approvals = {p.stem: load(p) for p in sorted((ROOT/'assets/art/approved').glob('*.json'))}
briefs = {p.stem: load(p) for p in sorted((ROOT/'assets/art/briefs').glob('*.json'))}
candidates = {p.stem: load(p) for p in sorted((ROOT/'assets/art/candidates').glob('*.json'))}
allowed = {tuple(bytes.fromhex(c[1:])) for c in cat['palette']['colors']}
atlases, pages = [], {}
issues = []
for a in cat['atlases']:
    p = ROOT / 'assets/art/runtime' / Path(a['imageUrl']).name
    public = ROOT / 'apps/web/public/art' / p.name
    image = Image.open(p).convert('RGBA'); pages[a['id']] = image
    record = {**a, 'path': relative(p), 'pngBytes': p.stat().st_size, 'decodedRgbaBytes': image.width*image.height*4, 'actualSha256': sha(p.read_bytes()), 'publicByteIdentical': p.read_bytes()==public.read_bytes(), 'metadataPublicByteIdentical': p.with_suffix('.json').read_bytes()==public.with_suffix('.json').read_bytes()}
    record['hashMatches'] = record['actualSha256']==a['sha256']
    record['dimensionsMatch'] = list(image.size)==[a['width'],a['height']]
    atlases.append(record)
rows, all_refs, reviewed_images, editables = [], set(), set(), set()
images, frame_images = {}, {}
for a in sorted(cat['assets'],key=lambda x:x['id']):
    m = approvals[a['id']]; native=(a['nativeResolution']['width'],a['nativeResolution']['height'])
    family = next((f for f in families if a['id'].endswith('.'+f)), None)
    frows, colors, alphas = [], set(), set()
    source_by_id = {f['id']: f for f in m['frames']}
    assert set(source_by_id) == {f['id'] for f in a['frames']}, 'Native and runtime frame IDs differ'
    for f in a['frames']:
        mf = source_by_id[f['id']]
        p=ROOT/mf['sourcePath']; image=Image.open(p).convert('RGBA'); pixels=cast(list[tuple[int,int,int,int]],list(image.get_flattened_data()))
        fcolors={v[:3] for v in pixels if v[3]}; colors.update(fcolors); alphas.update(v[3] for v in pixels)
        canonical=bytes(channel for v in pixels for channel in (v if v[3] else (0,0,0,0)))
        rect=f['frame']; crop=pages[a['atlasId']].crop((rect['x'],rect['y'],rect['x']+rect['w'],rect['y']+rect['h']))
        same=image.tobytes()==crop.tobytes(); size_ok=image.size==native
        if not same or not size_ok or f['id']!=mf['id']: issues.append({'asset':a['id'],'frame':f['id'],'issue':'native/runtime size, ID or pixel mismatch'})
        frame_images[f['id']]=image
        frows.append({'id':f['id'],'path':relative(p),'pngSha256':sha(p.read_bytes()),'visiblePixelsSha256':sha(canonical),'durationMs':f['durationMs'],'state':f['state'],'direction':f['direction'],'bbox':image.getbbox(),'opaquePixels':sum(v[3]>0 for v in pixels),'colorCount':len(fcolors),'pixelIdenticalToRuntime':same,'dimensionsMatch':size_ok})
    images[a['id']]=frame_images[a['frames'][0]['id']]
    folder=(ROOT/m['frames'][0]['sourcePath']).parent
    ase=folder/'editable.aseprite'; meta=folder/'aseprite/sprite.json'; sheet_path=folder/'aseprite/sprite.png'
    ap=ase.read_bytes() if ase.exists() else b''
    editable={'path':relative(ase),'exists':ase.exists(),'sheetExists':sheet_path.exists(),'metadataExists':meta.exists()}
    if len(ap)>=128:
        editable.update({'sha256':sha(ap),'headerFrames':struct.unpack_from('<H',ap,6)[0],'width':struct.unpack_from('<H',ap,8)[0],'height':struct.unpack_from('<H',ap,10)[0]})
        editables.add(relative(ase))
    refs=m['provenance']['sourceRefs']; all_refs.update(refs)
    reviewed_images.update(m['review']['evidencePaths'])
    missing=[ref for ref in refs+m['review']['evidencePaths'] if '://' not in ref and not (ROOT/ref).is_file()]
    if missing: issues.append({'asset':a['id'],'issue':'missing provenance/review files','paths':missing})
    clips=[]
    byid={f['id']:f for f in frows}
    for clip in a['clips']:
        clips.append({**clip,'frameCount':len(clip['frames']),'distinctVisibleFrames':len({byid[f]['visiblePixelsSha256'] for f in clip['frames']}),'durationTotalMs':sum(clip['durationsMs'])})
    batch_steps=[]
    for ref in refs:
        if ref.endswith('.json') and (ROOT/ref).exists() and '/approved/' in ref:
            receipt=load(ROOT/ref)
            if isinstance(receipt,dict) and isinstance(receipt.get('steps'),list): batch_steps += receipt['steps']
    tools=sorted({(s['tool'],s['version']) for s in m.get('processing',[])+batch_steps})
    rows.append({'id':a['id'],'type':a['type'],'family':family,'role':a['id'][:-(len(family)+1)] if family else a['id'],'contentIds':a['contentIds'],'liveAllowlisted':a['id'] in live or bool(live.intersection(a['contentIds'])),'atlasId':a['atlasId'],'nativeResolution':a['nativeResolution'],'pivot':a['pivot'],'frameCount':len(frows),'clipCount':len(clips),'multiframe':any(c['frameCount']>1 for c in clips),'distinctVisibleFrames':len({f['visiblePixelsSha256'] for f in frows}),'colors':sorted('#'+bytes(c).hex() for c in colors),'colorCount':len(colors),'allColorsLegal':not (colors-allowed),'alphaValues':sorted(alphas),'clips':clips,'frames':frows,'approvalManifest':'assets/art/approved/'+a['id']+'.json','approvalVersion':m['version'],'approvalInputHash':m['review']['inputHash'],'provenance':m['provenance'],'processingTools':[{'tool':k,'version':v} for k,v in tools],'editable':editable,'reviewEvidence':m['review']['evidencePaths'],'missingReferencedFiles':missing,'candidatePointerPresent':a['id'] in candidates})
source_files=[]
for p in sorted((ROOT/'assets/art/source').rglob('*')):
    if p.is_file(): source_files.append({'path':relative(p),'extension':p.suffix.lower(),'bytes':p.stat().st_size})
source_totals=Counter(f['extension'] for f in source_files)
generation_indices=[]
for p in sorted((ROOT/'assets/art/source').rglob('generation.json')):
    data=load(p); entries=data if isinstance(data,list) else data.get('sources',[])
    selected=[]
    for d in entries:
        sp=d.get('sourcePath'); actual=sha((ROOT/sp).read_bytes()) if sp and (ROOT/sp).is_file() else None
        selected.append({'id':d.get('id'),'sourcePath':sp,'declaredSha256':d.get('sourceHash'),'actualSha256':actual,'declaredHashMatches':actual==d['sourceHash'] if d.get('sourceHash') else None})
    generation_indices.append({'path':relative(p),'sha256':sha(p.read_bytes()),'selectedRecordCount':len(entries),'selected':selected})
reference_pngs=[]
for ref in sorted(all_refs):
    p=ROOT/ref
    if p.suffix.lower()=='.png' and p.is_file(): reference_pngs.append({'path':ref,'sha256':sha(p.read_bytes()),'size':list(Image.open(p).size)})
audio_extensions={'.mp3','.ogg','.wav','.flac','.opus','.m4a','.aac','.mid','.midi','.aif','.aiff','.webm'}
audio_files=[]; playback_matches=[]; scanned_code=0
pattern=re.compile(r'AudioContext|webkitAudioContext|HTMLAudio|new\s+Audio\b|howler|Howler|Tone\.|playSound|useAudio|<audio\b|\.mp3\b|\.ogg\b|\.wav\b')
for current,dirs,files in os.walk(ROOT):
    dirs[:]=[d for d in dirs if d not in {'.git','node_modules','.turbo','dist','.cache','.local','hermes-analysis','test-results','playwright-report','THEANDRIL_ASTRA_HANDOFF','THEANDRIL_ASTRA_ART_FACTORY_PACK'}]
    for name in files:
        p=Path(current)/name
        if p.suffix.lower() in audio_extensions: audio_files.append({'path':relative(p),'bytes':p.stat().st_size})
        if p.suffix.lower() in {'.ts','.tsx','.js','.jsx','.html','.json','.css'} and not any(part in p.parts for part in ('assets','public')):
            scanned_code+=1
            for i,line in enumerate(p.read_text(errors='replace').splitlines(),1):
                if pattern.search(line): playback_matches.append({'path':relative(p),'line':i,'text':line[:240]})
public_extra=[]
for p in sorted((ROOT/'apps/web/public').rglob('*')):
    if p.is_file() and p.suffix.lower() in {'.png','.webp','.svg','.jpg','.jpeg','.woff','.woff2','.ttf'} and 'art' not in p.relative_to(ROOT/'apps/web/public').parts:
        record={'path':relative(p),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}
        if p.suffix.lower() in {'.png','.webp','.jpg','.jpeg'}: record['size']=list(Image.open(p).size)
        public_extra.append(record)
statics=[r for r in rows if not r['multiframe']]
qualified=[r for r in rows if r['family']]
source_counts={'totalFiles':len(source_files),'totalBytes':sum(f['bytes'] for f in source_files),'byExtension':dict(sorted(source_totals.items())),'selectedGenerationRecordsInExactGenerationJsonFiles':sum(g['selectedRecordCount'] for g in generation_indices),'selectedGenerationUniqueSourcePaths':len({s['sourcePath'] for g in generation_indices for s in g['selected']}),'note':'Physical source counts include revisions, raw renders, native frames, review PNGs and retained dependencies. Selected generation.json counts exclude early sheet originals, animation pilot indexes and Blender recipes; not an all-history generation-call total.'}
summary={'approvedAssets':len(approvals),'briefs':len(briefs),'candidatePointers':len(candidates),'publishedAssets':len(rows),'publishedFrames':sum(r['frameCount'] for r in rows),'publishedClips':sum(r['clipCount'] for r in rows),'singleFrameStaticAssets':len(statics),'multiframeAssets':len(rows)-len(statics),'qualifiedFactionAssets':len(qualified),'qualifiedFactionStaticAssets':sum(not r['multiframe'] for r in qualified),'qualifiedFactionMultiframeAssets':sum(r['multiframe'] for r in qualified),'factionFamilies':len(families),'byType':dict(Counter(r['type'] for r in rows)),'byNativeSize':dict(Counter(f"{r['nativeResolution']['width']}x{r['nativeResolution']['height']}" for r in rows)),'byProvider':dict(Counter(r['provenance']['provider'] for r in rows)),'liveAllowlistedAssets':sum(r['liveAllowlisted'] for r in rows),'futureOnlyPublishedIds':[r['id'] for r in rows if not r['liveAllowlisted']],'missingLiveIds':sorted(live-{r['id'] for r in rows}-{x for r in rows for x in r['contentIds']}),'allNativeFramesEqualRuntime':all(f['pixelIdenticalToRuntime'] for r in rows for f in r['frames']),'illegalPaletteAssets':sum(not r['allColorsLegal'] for r in rows),'nonbinaryAlphaAssets':sum(bool(set(r['alphaValues'])-{0,255}) for r in rows),'retainedEditableFiles':len(editables),'uniqueReviewEvidencePaths':len(reviewed_images),'pngDownloadBytes':sum(a['pngBytes'] for a in atlases),'decodedAtlasBytes':sum(a['decodedRgbaBytes'] for a in atlases),'sourceCounts':source_counts,'issues':issues}
# Audit sheets: original approved pixels, no content generation or altered sources.
sheets=[]
def sheet(name,ids,cols,scale=1,cell=128,frame_ids=None):
    width=(cell*scale+24)*cols; h=cell*scale+36
    result=Image.new('RGB',(width,((len(ids)+cols-1)//cols)*h),(37,39,42)); draw=ImageDraw.Draw(result); entries=[]
    for n,id in enumerate(ids):
        fid=frame_ids[n] if frame_ids else approvals[id]['frames'][0]['id']; im=frame_images[fid]
        x=(n%cols)*(cell*scale+24); y=(n//cols)*h
        draw.text((x+6,y+4),id.replace('settlement.','').replace('unit.','').replace('terrain.','')[:40],fill=(220,210,185))
        if frame_ids: draw.text((x+6,y+16),'/'.join(fid.split('/')[-3:]),fill=(190,183,168))
        enlarged=im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST)
        px=x+12+(cell*scale-enlarged.width)//2; py=y+32+(cell*scale-enlarged.height)//2
        result.paste(enlarged,(px,py),enlarged)
        entries.append({'assetId':id,'frameId':fid,'scale':scale,'position':[px,py],'sourcePng':next(f['sourcePath'] for f in approvals[id]['frames'] if f['id']==fid)})
    path=EVIDENCE/(name+'.png'); result.save(path)
    sheets.append({'path':relative(path),'sha256':sha(path.read_bytes()),'size':list(result.size),'entries':entries,'inspectionStatus':'not encoded by producer; consult report for images actually opened'})
guards=['unit.guard.'+f for f in families]
sheet('guards-all-1x',guards,8,1,64)
sheet('guards-first12-4x',guards[:12],4,4,64)
sheet('guards-last12-4x',guards[12:],4,4,64)
sheet('cities-all-1x',['settlement.city.'+f for f in families],6,1,128)
sample_families=['ashen_compact','mire_courts','morrow_spore','cistern_assembly','vesper_court','brine_choir']
ids=[role+'.'+family for family in sample_families for role in ['unit.scout','unit.spearman','unit.cavalry','settlement.village','ui.crest','unit.transport']]
sheet('culture-crossroles-1x',ids,6,1,96)
terrain=sorted(r['id'] for r in rows if r['type']=='terrain' and r['liveAllowlisted'])
sheet('biomes-all-1x',terrain,6,1,64)
sheet('biomes-desert-grassland-alpine-4x',[f'terrain.{b}{v}' for b in ['desert','grassland','alpine'] for v in ['', '.variant_1','.variant_2']],3,4,64)
works=[r['id'] for r in rows if r['id'].startswith(('resource.','improvement.','building.'))]
sheet('works-all-1x',works,8,1,64)
sheet('works-sample-4x',['resource.iron','improvement.iron_mine','resource.grain','improvement.grange','building.archive','improvement.tide_observatory'],3,4,64)
battle=[r['id'] for r in rows if r['id'].startswith('battle.unit.')]
sheet('battle-roles-1x',battle,7,1,96)
sheet('battle-roles-4x',battle,5,4,96)
for role in ['guard','cavalry','transport']:
    id='battle.unit.'+role
    fs=[f for f in approvals[id]['frames'] if f['direction']=='e' and f['state'] in {'walk','attack','death','sail','fire','sink'}]
    sheet('battle-'+role+'-actions-1x',[id]*len(fs),8,1,96,frame_ids=[f['id'] for f in fs])
    action='sail' if role=='transport' else 'walk'
    fs=[f for f in approvals[id]['frames'] if f['direction']=='e' and f['state']==action]
    sheet('battle-'+role+'-'+action+'-4x',[id]*len(fs),4,4,96,frame_ids=[f['id'] for f in fs])
inventory={'schemaVersion':1,'auditedAtUtc':datetime.now(timezone.utc).isoformat(),'repository':str(ROOT),'gitHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'scope':'Read-only source/catalog/native pixel audit; no blanket visual approval or fresh gameplay execution','pathResolution':[{'supplied':p,'exists':Path(p).exists()} for p in ['/projects/BlenderArtFactory','/pixel-art-factory']]+[{'verifiedAlternative':p,'exists':Path(p).is_dir()} for p in ['/home/telephoneheater/Projects/BlenderArtFactory','/home/telephoneheater/Projects/pixel-art-factory']],'catalogSha256':sha(cat_path.read_bytes()),'catalogPublicByteIdentical':cat_path.read_bytes()==(ROOT/'apps/web/public/art/catalog.json').read_bytes(),'summary':summary,'atlases':atlases,'assets':rows,'generationIndexes':generation_indices,'referencedPngSources':reference_pngs,'sourceFiles':source_files,'otherPublicVisualFiles':public_extra,'audio':{'files':audio_files,'scannedCodeFiles':scanned_code,'playbackCodeMatches':playback_matches,'scope':'Project implementation/source/public assets excluding dependencies/build/cache/handoff copies and audit output; keyword scan, not a listening test'},'contactSheets':sheets}
(OUT/'inventory.json').write_text(json.dumps(inventory,indent=2)+'\n')
(EVIDENCE/'contact-sheets.json').write_text(json.dumps(sheets,indent=2)+'\n')
print(json.dumps({'summary':summary,'audio':inventory['audio'],'otherPublicVisualFiles':public_extra,'sheets':[s['path'] for s in sheets]},indent=2))
assert len(rows)==len(approvals)==len(briefs)==len({r['id'] for r in rows}), 'Registry counts disagree'
assert not issues and all(a['hashMatches'] and a['dimensionsMatch'] and a['publicByteIdentical'] and a['metadataPublicByteIdentical'] for a in atlases), 'Artifact mismatch'
