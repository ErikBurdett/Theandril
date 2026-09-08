import { useEffect, useState, type CSSProperties } from 'react';
import { FACTIONS, UNITS } from '@theandril/content';
import { factionArtId, parseRuntimeCatalog, type RuntimeAsset, type RuntimeCatalog } from '@theandril/art-pipeline/runtime';
import { loadArtImageBytes } from './art-image';
import { publicAssetUrl } from './asset-url';
import './faction-art.css';

interface AtlasImage { url: string; width: number; height: number }
export interface ApprovedFrame { asset: RuntimeAsset; frame: RuntimeAsset['frames'][number]; image: AtlasImage; generic: boolean }
const controller = new AbortController();
let catalogPromise: Promise<RuntimeCatalog> | undefined;
const atlasImages = new Map<string, Promise<AtlasImage>>();
const frames = new Map<string, Promise<ApprovedFrame>>();
const blobUrls = new Set<string>();
let decodedBytes = 0;
let disposed = false;

/** One bounded approved catalog for the DOM, never the development/candidate catalog. */
function catalog(): Promise<RuntimeCatalog> {
  return catalogPromise ??= (async () => {
    const response = await fetch(publicAssetUrl('/art/catalog.json'), { signal: controller.signal });
    if (!response.ok) throw new Error(`Approved catalog unavailable (${response.status}).`);
    const limit = 8 * 1024 * 1024;
    if (Number(response.headers.get('content-length')) > limit) throw new Error('Approved catalog exceeds its download limit.');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Approved catalog response is unreadable.');
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) {
        const next = await reader.read(); if (next.done) break;
        length += next.value.byteLength;
        if (length > limit) { await reader.cancel(); throw new Error('Approved catalog exceeds its download limit.'); }
        chunks.push(next.value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return parseRuntimeCatalog(JSON.parse(new TextDecoder().decode(bytes)));
  })();
}

function atlasImage(atlas: RuntimeCatalog['atlases'][number]): Promise<AtlasImage> {
  const key = `${atlas.sha256}/${atlas.width}x${atlas.height}`;
  let promise = atlasImages.get(key);
  if (!promise) {
    promise = (async () => {
      const allocation = atlas.width * atlas.height * 4;
      const budget = (window.innerWidth < 750 ? 64 : 128) * 1024 * 1024;
      if (decodedBytes + allocation > budget) throw new Error('Approved DOM atlas pages exceed this display profile’s image budget.');
      decodedBytes += allocation;
      let url: string | undefined;
      try {
        const { bytes, width, height } = await loadArtImageBytes(atlas.imageUrl, controller.signal, atlas);
        url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
        const image = new Image(); image.src = url;
        await image.decode();
        if (disposed) throw new Error('The art presentation was released.');
        if (image.naturalWidth !== width || image.naturalHeight !== height) throw new Error('Decoded atlas dimensions differ from approved metadata.');
        blobUrls.add(url);
        return { url, width, height };
      } catch (error) { if (url) URL.revokeObjectURL(url); decodedBytes -= allocation; throw error; }
    })();
    atlasImages.set(key, promise);
  }
  return promise;
}

export function loadFactionArtFrame(contentId: string, definitionId: string): Promise<ApprovedFrame> {
  const qualified = factionArtId(contentId, definitionId);
  if (!qualified) return Promise.reject(new Error('No approved visual family is bound to this faction definition.'));
  let promise = frames.get(qualified);
  if (!promise) {
    promise = (async () => {
      const pack = await catalog();
      const find = (id: string) => pack.assets.find(asset => asset.id === id || asset.contentIds.includes(id));
      const asset = find(qualified) ?? find(contentId);
      if (!asset) throw new Error(`Approved artwork is not published for ${qualified}.`);
      const atlas = pack.atlases.find(item => item.id === asset.atlasId);
      const frame = asset.frames.find(item => item.state === 'idle' && item.index === 0) ?? asset.frames[0];
      if (!atlas || !frame) throw new Error(`Approved atlas frame is missing for ${asset.id}.`);
      return { asset, frame, image: await atlasImage(atlas), generic: asset.id !== qualified && !asset.contentIds.includes(qualified) };
    })();
    frames.set(qualified, promise);
  }
  return promise;
}

// These shared DOM pages live with the application, not with individual icons. HMR releases old pages.
if (import.meta.hot) import.meta.hot.dispose(() => { disposed = true; controller.abort(); for (const url of blobUrls) URL.revokeObjectURL(url); blobUrls.clear(); });

interface FactionArtProps {
  contentId: string; definitionId?: string; label: string; compact?: boolean; decorative?: boolean;
}

/** Approved native frame with a fixed slot. Compact thumbnails are exact half-size, never tinted. */
export function FactionArt(props: FactionArtProps) {
  const { contentId, definitionId } = props;
  const requested = factionArtId(contentId, definitionId ?? '') ?? `${contentId}.unbound`;
  const [result, setResult] = useState<{ requested: string; value?: ApprovedFrame; error?: string }>();
  useEffect(() => {
    let active = true;
    void loadFactionArtFrame(contentId, definitionId ?? '').then(value => { if (active) setResult({ requested, value }); }, error => {
      if (active) setResult({ requested, error: error instanceof Error ? error.message : String(error) });
    });
    return () => { active = false; };
  }, [contentId, definitionId, requested]);
  const current = result?.requested === requested ? result : undefined;
  return <FactionArtDisplay {...props} value={current?.value} error={current?.error} loading={!current}/>;
}

/** Pure presentation boundary, also exercised without a running browser or art publication. */
export function FactionArtDisplay({ contentId, definitionId, label, compact = false, decorative = false, value: art, error, loading = false }: FactionArtProps & { value?: ApprovedFrame; error?: string; loading?: boolean }) {
  const requested = factionArtId(contentId, definitionId ?? '') ?? `${contentId}.unbound`;
  const naval = UNITS.some(unit => unit.id === contentId && unit.movementDomain === 'naval');
  const native = contentId === 'ui.badge' ? 32 : naval || contentId === 'unit.cavalry' || contentId === 'settlement.village' || contentId === 'settlement.town' ? 96 : contentId === 'settlement.city' ? 128 : 64;
  const scale = compact ? 0.5 : 1;
  const validSize = !art || art.asset.nativeResolution.width === native && art.asset.nativeResolution.height === native;
  const ready = Boolean(art && validSize);
  const state = loading ? 'loading' : ready ? art?.generic ? 'generic' : 'ready' : 'fallback';
  const message = state === 'ready' ? `${label} · approved faction artwork` : state === 'loading' ? `${label} · loading approved artwork` : `${label} · ${naval && !ready ? 'procedural ship marker, approved naval artwork unavailable' : 'generic presentation'}. ${error ?? (!validSize ? 'Approved frame dimensions differ from this native slot.' : 'Faction-specific artwork is not published; using the available role fallback.')}`;
  const style: CSSProperties = { width: native * scale, height: native * scale,
    ...(ready && art ? { backgroundImage: `url("${art.image.url}")`, backgroundSize: `${art.image.width * scale}px ${art.image.height * scale}px`, backgroundPosition: `${-art.frame.frame.x * scale}px ${-art.frame.frame.y * scale}px` } : {}) };
  return <span className={`faction-art faction-art--${state}`} style={style} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : message} aria-hidden={decorative || undefined} title={message} data-art-id={requested} data-art-rendered-id={ready ? art?.asset.id : undefined} data-art-definition={definitionId} data-art-state={state}>
    {!ready && (naval ? <svg className="faction-art-ship" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 43h44l-9 10H21ZM32 9v33M29 13 15 36h14M36 17l13 19H36M8 57l8-2 9 2 8-2 9 2 10-2 6 2" fill="none" stroke="currentColor" strokeWidth="2"/></svg> : <span className="faction-art-symbol" aria-hidden="true">{contentId.startsWith('character.') ? '♟' : contentId.startsWith('unit.') ? '△' : '◇'}</span>)}
    {state !== 'ready' && <span className="faction-art-note" aria-hidden="true">{state === 'loading' ? 'Loading' : naval && !ready ? 'Ship marker' : 'Generic'}</span>}
  </span>;
}

/** Public content information, not discovered campaign seats or an unimplemented selection control. */
export function PublicCultures() {
  return <section className="public-cultures" aria-labelledby="public-cultures-heading" data-testid="public-cultures">
    <h3 id="public-cultures-heading">Introductory cultures</h3>
    <p>Public culture reference, not a player-seat selector. Generated realms reuse these traditions; their locations and forces must still be discovered.</p>
    <div className="public-culture-grid">{FACTIONS.map(faction => <article key={faction.id}><FactionArt contentId="ui.crest" definitionId={faction.id} label={`${faction.name} crest`}/><div><h4>{faction.name}</h4><p>{faction.motto}</p></div></article>)}</div>
  </section>;
}
