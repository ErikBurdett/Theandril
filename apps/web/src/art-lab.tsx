import { useEffect, useMemo, useRef, useState } from 'react';
import { parseArtLabCatalog, parseRuntimeCatalog, type ArtLabCatalog } from '@theandril/art-pipeline/runtime';
import { LIVE_ART_IDS } from '@theandril/render';
import { ArtPreview, AtlasPreview, inspectPixels, useAtlasImage, type AlphaBackground, type PreviewFrame } from './art-preview';
import { publicAssetUrl } from './asset-url';
import './art-lab.css';

type LabAsset = ArtLabCatalog['assets'][number];
const assetFrames = (asset: LabAsset): PreviewFrame[] => asset.runtime ? asset.runtime.frames.map(frame => ({ id: frame.id, rect: frame.frame, native: { w: asset.nativeResolution.width, h: asset.nativeResolution.height }, trim: { x: 0, y: 0 }, pivot: { x: asset.pivot[0], y: asset.pivot[1] } })) : [{ id: asset.id, rect: { x: 0, y: 0, w: asset.nativeResolution.width, h: asset.nativeResolution.height }, native: { w: asset.nativeResolution.width, h: asset.nativeResolution.height }, trim: { x: 0, y: 0 }, pivot: { x: asset.pivot[0], y: asset.pivot[1] } }];

function AssetInspector({ asset, catalog }: { asset: LabAsset; catalog: ArtLabCatalog }) {
  const [tab, setTab] = useState<'preview' | 'atlas' | 'manifest'>('preview');
  const [state, setState] = useState(asset.runtime?.clips[0]?.state ?? 'static');
  const [direction, setDirection] = useState(asset.runtime?.clips[0]?.direction ?? 'none');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(!document.hidden);
  const [zoom, setZoom] = useState(4);
  const [alpha, setAlpha] = useState<AlphaBackground>('checker');
  const [pivot, setPivot] = useState(true);
  const [bounds, setBounds] = useState(true);
  const [repeat, setRepeat] = useState(false);
  const [allRects, setAllRects] = useState(true);
  const frames = useMemo(() => assetFrames(asset), [asset]);
  const clips = asset.runtime?.clips ?? [];
  const clip = clips.find(item => item.state === state && item.direction === direction) ?? clips[0];
  const sequence = clip?.frames ?? frames.map(frame => frame.id);
  const frame = frames.find(item => item.id === sequence[Math.min(index, sequence.length - 1)]) ?? frames[0]!;
  const maxPreviewDimension = repeat ? 316 : Math.max(frame.native.w, frame.native.h);
  const effectiveZoom = Math.min(zoom, [1, 2, 4, 8].filter(value => value * maxPreviewDimension <= 4096).at(-1) ?? 1);
  const atlas = catalog.atlases.find(item => item.id === asset.runtime?.atlasId);
  const { image, error } = useAtlasImage(asset.runtime ? atlas?.imageUrl : asset.previewUrl ?? undefined, asset.runtime ? atlas : undefined);
  const unnormalized = Boolean(image && !asset.runtime && (image.naturalWidth !== frame.native.w || image.naturalHeight !== frame.native.h));
  const inspectionLimited = frame.native.w * frame.native.h > 1_048_576;
  const inspection = useMemo(() => image && !unnormalized && !inspectionLimited ? inspectPixels(image, frame) : undefined, [image, frame, unnormalized, inspectionLimited]);
  const unexpectedColors = inspection?.colors.filter(color => !catalog.palette.colors.some(allowed => allowed.toLowerCase() === color)) ?? [];
  const live = asset.contentIds.some(id => LIVE_ART_IDS.has(id)) || LIVE_ART_IDS.has(asset.id);
  const atlasFrames = useMemo(() => catalog.assets.filter(item => item.runtime?.atlasId === atlas?.id && item.runtime).flatMap(assetFrames), [catalog, atlas]);
  useEffect(() => { const update = () => setDocumentVisible(!document.hidden); document.addEventListener('visibilitychange', update); return () => document.removeEventListener('visibilitychange', update); }, []);
  useEffect(() => {
    if (!playing || tab !== 'preview' || !documentVisible || sequence.length < 2) return;
    const timer = setTimeout(() => {
      if (index + 1 < sequence.length) setIndex(index + 1);
      else if (clip?.loop) setIndex(0);
      else setPlaying(false);
    }, clip?.durationsMs[index] ?? 200);
    return () => clearTimeout(timer);
  }, [playing, tab, documentVisible, index, clip, sequence.length]);
  const chooseTab = (value: typeof tab) => { setTab(value); document.getElementById(`art-tab-${value}`)?.focus(); };
  const changeClip = (nextState: string, nextDirection: string) => { setState(nextState); setDirection(nextDirection); setIndex(0); setPlaying(false); };
  return <section className="art-inspector" aria-label="Selected art asset">
    <div className="art-asset-heading"><div><span className="eyebrow">{asset.type}</span><h3>{asset.id}</h3></div><span className="art-badge" data-testid="art-status">{asset.status}</span></div>
    <p className="art-consumer" data-testid="art-consumer">{live ? asset.runtime ? 'Current gameplay consumer · approved runtime atlas' : 'Current gameplay role · not available in the approved runtime atlas' : 'Future-ready art only · no current gameplay consumer. This does not add a game entity.'}</p>
    {asset.reasons.length > 0 && <ul className="art-reasons">{asset.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
    <div className="art-tabs" role="tablist" aria-label="Art inspection view" onKeyDown={event => {
      const tabs = ['preview', 'atlas', 'manifest'] as const, current = tabs.indexOf(tab);
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); chooseTab(tabs[(current + (event.key === 'ArrowRight' ? 1 : 2)) % 3]!); }
      if (event.key === 'Home') { event.preventDefault(); chooseTab('preview'); }
      if (event.key === 'End') { event.preventDefault(); chooseTab('manifest'); }
    }}>{(['preview', 'atlas', 'manifest'] as const).map(value => <button key={value} role="tab" id={`art-tab-${value}`} aria-selected={tab === value} aria-controls={`art-panel-${value}`} tabIndex={tab === value ? 0 : -1} onClick={() => setTab(value)}>{value === 'preview' ? 'Pixel preview' : value === 'atlas' ? 'Atlas rectangles' : 'Manifest & QA'}</button>)}</div>
    <section role="tabpanel" id={`art-panel-${tab}`} aria-labelledby={`art-tab-${tab}`}>
      {tab === 'preview' && <>
        <div className="art-controls"><label>Native zoom<select value={effectiveZoom} onChange={event => setZoom(Number(event.target.value))}>{[1, 2, 4, 8].map(value => <option key={value} value={value} disabled={value * maxPreviewDimension > 4096}>{value}× nearest</option>)}</select></label><label>Alpha background<select value={alpha} onChange={event => setAlpha(event.target.value as AlphaBackground)}><option value="checker">Checkerboard</option><option value="light">Light vellum</option><option value="dark">Dark peat</option><option value="magenta">Magenta matte check</option></select></label><label>Animation state<select disabled={!clips.length} value={clip?.state ?? 'static'} onChange={event => changeClip(event.target.value, clips.find(item => item.state === event.target.value)?.direction ?? 'none')}>{clips.length ? [...new Set(clips.map(item => item.state))].map(value => <option key={value}>{value}</option>) : <option>static</option>}</select></label><label>Facing direction<select disabled={!clips.length} value={clip?.direction ?? 'none'} onChange={event => changeClip(state, event.target.value)}>{clips.length ? [...new Set(clips.filter(item => item.state === state).map(item => item.direction))].map(value => <option key={value}>{value}</option>) : <option>none</option>}</select></label></div>
        <div className="art-toggles"><label><input type="checkbox" checked={pivot} onChange={event => setPivot(event.target.checked)}/>Show pivot</label><label><input type="checkbox" checked={bounds} onChange={event => setBounds(event.target.checked)}/>Show alpha bounds</label>{asset.type === 'terrain' && <label><input type="checkbox" checked={repeat} onChange={event => setRepeat(event.target.checked)}/>Tile repeat preview</label>}</div>
        <div className="art-playback"><button disabled={sequence.length < 2} onClick={() => { setPlaying(false); setIndex((index + sequence.length - 1) % sequence.length); }}>Previous frame</button><button disabled={sequence.length < 2} onClick={() => { if (!playing && index === sequence.length - 1) setIndex(0); setPlaying(!playing); }}>{playing ? 'Pause animation' : 'Play animation'}</button><button disabled={sequence.length < 2} onClick={() => { setPlaying(false); setIndex((index + 1) % sequence.length); }}>Next frame</button><span data-testid="art-frame-counter">Frame {index + 1} / {sequence.length} · {clip?.durationsMs[index] ?? 0} ms</span></div>
        {sequence.length === 1 && <p className="art-help">One static frame is supplied; no animation or unprovided facing is invented.</p>}
        {repeat && <p className="art-help">Native 56×64 pointy-hex footprint; 56 px column / 48 px row spacing. This seam preview is not a claim that roads, rivers, or transitions exist in gameplay.</p>}
        {image ? unnormalized ? <><p className="art-load-error" role="status">Unnormalized source: {image.naturalWidth}×{image.naturalHeight}, not the declared {frame.native.w}×{frame.native.h} canvas. Showing the original source without inventing frame extraction, pivots, or native-pixel validation.</p><div className="art-canvas-scroll" tabIndex={0} aria-label="Unnormalized source image"><img src={image.src} width={image.naturalWidth} height={image.naturalHeight} alt={`Unnormalized candidate source for ${asset.id}`}/></div></> : <ArtPreview image={image} frame={frame} zoom={effectiveZoom} alpha={alpha} showPivot={pivot} showBounds={bounds} inspection={inspection} repeat={repeat}/> : <p role={error ? 'alert' : 'status'} className="art-help">{error || (asset.previewUrl || atlas ? 'Loading exact source pixels…' : 'No image exists for this asset status.')}</p>}
        {(effectiveZoom !== zoom || inspectionLimited) && <p className="art-help">Large-asset safeguard: preview edges are capped at 4,096 pixels; per-frame palette inspection is limited to 1,048,576 native pixels. Full source and machine-validation metadata remain unchanged.</p>}
        <p className="art-help">Native {frame.native.w}×{frame.native.h} · pivot ({frame.pivot.x}, {frame.pivot.y}) · frame {frame.id}. Playback is presentation-only and begins paused.</p>
        {inspection && <><dl className="art-metrics" data-testid="art-pixel-metrics"><div><dt>Opaque pixels</dt><dd>{inspection.opaque}</dd></div><div><dt>Transparent pixels</dt><dd>{inspection.transparent}</dd></div><div><dt>Partial-alpha pixels</dt><dd>{inspection.partialAlpha}</dd></div><div><dt>Frame colors</dt><dd>{inspection.colorCount}</dd></div></dl><p className="art-help">Alpha bounds: {inspection.bounds ? `${inspection.bounds.x},${inspection.bounds.y} · ${inspection.bounds.w}×${inspection.bounds.h}` : 'empty'}. {unexpectedColors.length ? `${unexpectedColors.length} displayed colors are outside the catalog palette.` : 'All displayed colors belong to the catalog palette.'}</p><div className="art-palette" aria-label="Frame palette">{inspection.colors.map(color => <span key={color} title={color} aria-label={color} style={{ backgroundColor: color }}/>)}</div>{inspection.colorCount > 256 && <p className="art-help">Swatches limited to the first 256 colors; full count shown above.</p>}</>}
      </>}
      {tab === 'atlas' && <>{asset.runtime && image ? <><label className="art-checkbox"><input type="checkbox" checked={allRects} onChange={event => setAllRects(event.target.checked)}/>Show all atlas rectangles</label><p className="art-help">{atlas?.id} · {atlas?.width}×{atlas?.height} · selected rectangle {frame.rect.x},{frame.rect.y},{frame.rect.w},{frame.rect.h}. Rectangles exclude extrusion and gutters.</p><AtlasPreview image={image} frames={atlasFrames} selected={frame.id} showAll={allRects}/></> : <p className="art-help">This asset has no approved runtime atlas rectangle.</p>}</>}
      {tab === 'manifest' && <><div className="art-validation" data-testid="art-validation">{asset.validation ? <><strong>{asset.validation.passed ? 'Machine checks passed' : 'Machine checks failed'} · score {asset.validation.score}/100</strong><p>{asset.validation.reportPath}</p></> : <strong>No validation result exists.</strong>}<p>Machine checks do not replace visual approval. {asset.review ? `Reviewed by ${asset.review.reviewer}: ${asset.review.notes}` : 'No approval review is recorded.'}</p></div><pre className="art-manifest" tabIndex={0} aria-label="Asset manifest">{JSON.stringify(asset, null, 2)}</pre></>}
    </section>
  </section>;
}

/** Lazy-loaded development tooling. No campaign state, mutation, or production entrypoint. */
export default function ArtLab({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [catalog, setCatalog] = useState<ArtLabCatalog>();
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  useEffect(() => { const previous = document.activeElement; dialog.current?.showModal(); return () => { dialog.current?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); }; }, []);
  useEffect(() => {
    let cancelled = false; setError(''); setCatalog(undefined);
    void (async () => {
      try {
        const response = await fetch(publicAssetUrl('/art/lab-catalog.json'), { cache: 'no-store' });
        if (!response.ok) throw new Error(`Art Lab catalog unavailable (${response.status}). Generate and integrate the approved art pack first.`);
        const next = parseArtLabCatalog(await response.json());
        parseRuntimeCatalog({ schemaVersion: next.schemaVersion, palette: next.palette, atlases: next.atlases, assets: next.assets.flatMap(asset => asset.runtime ? [asset.runtime] : []) });
        if (!cancelled) { setCatalog(next); setSelected(current => next.assets.some(asset => asset.id === current) ? current : next.assets[0]?.id ?? ''); }
      } catch (failure) { if (!cancelled) setError(failure instanceof Error ? failure.message : String(failure)); }
    })();
    return () => { cancelled = true; };
  }, [revision]);
  const assets = catalog?.assets.filter(asset => `${asset.id} ${asset.type} ${asset.status} ${asset.contentIds.join(' ')}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  const asset = catalog?.assets.find(item => item.id === selected);
  return <dialog className="art-lab" ref={dialog} aria-labelledby="art-lab-title" onCancel={event => { event.preventDefault(); close(); }}>
    <header className="art-lab-header"><div><span className="eyebrow">Development workshop</span><h2 id="art-lab-title">Art Lab</h2></div><button aria-label="Close Art Lab" onClick={close}>Close ×</button></header>
    <p className="art-lab-disclosure">Inspect actual catalog assets at native pixel scale. Candidate artwork never enters gameplay automatically. This inspector cannot issue game commands or approve assets.</p>
    <div className="art-lab-toolbar"><span data-testid="art-catalog-validation">{catalog ? `Manifest validated · ${catalog.assets.length} catalog assets · palette ${catalog.palette.id} v${catalog.palette.version}` : 'Catalog not loaded'}</span><button onClick={() => setRevision(value => value + 1)}>Reload art catalog</button></div>
    {error && <p className="art-load-error" role="alert">{error}</p>}
    {!catalog && !error && <p className="art-help" role="status">Loading the art catalog…</p>}
    {catalog && <div className="art-lab-layout"><aside className="art-catalog"><label>Search art assets<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Asset, role, or status"/></label><p className="art-help">{assets.length} matching assets</p><div className="art-asset-list">{assets.map(item => <button key={item.id} aria-pressed={item.id === selected} aria-label={`Inspect ${item.id}`} onClick={() => setSelected(item.id)}><strong>{item.id}</strong><small>{item.type} · {item.status}</small></button>)}{!assets.length && <p className="art-help">No assets match this search.</p>}</div></aside>{asset ? <AssetInspector key={`${revision}:${asset.id}`} asset={asset} catalog={catalog}/> : <p className="art-help">Select an asset from the catalog.</p>}</div>}
  </dialog>;
}
