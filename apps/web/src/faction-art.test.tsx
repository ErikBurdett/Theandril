import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { RuntimeAsset, RuntimeCatalog } from '@theandril/art-pipeline/runtime';

const png = () => {
  // The decoder is a browser adapter below. Header/allocation/hash verification is real, not pixel approval.
  const bytes = new Uint8Array(33); bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const data = new DataView(bytes.buffer); data.setUint32(8, 13); bytes.set([73, 72, 68, 82], 12);
  data.setUint32(16, 256); data.setUint32(20, 64); bytes[24] = 8; bytes[25] = 6;
  return bytes;
};
const digest = async (bytes: Uint8Array<ArrayBuffer>) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
function asset(id: string, x: number): RuntimeAsset {
  const frameId = `${id}/idle/se/0`;
  return {
    id, type: 'unit', status: 'INTEGRATED', contentIds: [id], nativeResolution: { width: 64, height: 64 }, pivot: [32, 56], atlasId: 'test.atlas',
    frames: [{ id: frameId, frame: { x, y: 0, w: 64, h: 64 }, direction: 'se', state: 'idle', index: 0, durationMs: 250 }],
    clips: [{ id: 'idle.se', direction: 'se', state: 'idle', frames: [frameId], durationsMs: [250], loop: true }],
    validation: { score: 100, passed: true, reportPath: 'synthetic-test-report' },
    provenance: { provider: 'synthetic-test', promptHash: 'a'.repeat(64), sourceRefs: ['synthetic-test'], licenseNotes: ['Synthetic metadata fixture, not production art approval.'] },
    review: { reviewer: 'synthetic-test', reviewedAt: '2026-09-05T00:00:00Z', notes: 'Synthetic metadata fixture only.', evidencePaths: ['synthetic-test'], inputHash: 'b'.repeat(64) },
  };
}
async function pack(bytes = png()): Promise<RuntimeCatalog> {
  return { schemaVersion: 1, palette: { id: 'test.palette', version: 1, colors: ['#202328'] },
    atlases: [{ id: 'test.atlas', imageUrl: '/art/test.png', jsonUrl: '/art/test.json', width: 256, height: 64, sha256: await digest(bytes) }],
    assets: [asset('unit.guard', 0), asset('unit.guard.ashen_compact', 64), asset('unit.guard.reedbound_council', 128)] };
}
function responses(catalog: unknown, bytes: Uint8Array<ArrayBuffer>, base = '/') {
  const fetch = vi.fn(async (url: string) => url === `${base}art/catalog.json`
    ? new Response(JSON.stringify(catalog), { headers: { 'content-type': 'application/json' } })
    : new Response(bytes, { headers: { 'content-type': 'image/png' } }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
let decode: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  decode = vi.fn(async () => undefined);
  vi.stubGlobal('window', { innerWidth: 1440 });
  vi.stubGlobal('Image', class { src = ''; naturalWidth = 256; naturalHeight = 64; decode = decode; });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:verified-test-atlas');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('approved faction DOM artwork boundary', () => {
  it.each(['/', '/Theandril/'])('loads verified faction artwork at %s without rewriting its approved catalog', async base => {
    vi.stubEnv('BASE_URL', base);
    const bytes = png(), catalog = await pack(bytes), original = JSON.stringify(catalog);
    const fetch = responses(catalog, bytes, base);
    const { loadFactionArtFrame } = await import('./faction-art');
    const result = await loadFactionArtFrame('unit.guard', 'faction.ashen_compact');
    expect(result.asset.id).toBe('unit.guard.ashen_compact');
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([`${base}art/catalog.json`, `${base}art/test.png`]);
    expect(decode).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(catalog)).toBe(original);
  });

  it('retains hash rejection for altered subpath atlas bytes', async () => {
    vi.stubEnv('BASE_URL', '/Theandril/');
    const bytes = png(), catalog = await pack(bytes); bytes[32] = 1;
    const fetch = responses(catalog, bytes, '/Theandril/');
    const { loadFactionArtFrame } = await import('./faction-art');
    await expect(loadFactionArtFrame('unit.guard', 'faction.ashen_compact')).rejects.toThrow('hash mismatch');
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/Theandril/art/catalog.json', '/Theandril/art/test.png']);
    expect(decode).not.toHaveBeenCalled(); expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('renders approved naval roles at 96 pixels and uses a ship silhouette for absent, failed or wrongly sized hull art', async () => {
    const { FactionArtDisplay } = await import('./faction-art');
    for (const role of ['transport', 'coastal_warship', 'ocean_warship']) {
      const definition = asset(`unit.${role}.ashen_compact`, 0);
      definition.nativeResolution = { width: 96, height: 96 }; definition.pivot = [48, 80];
      definition.frames[0]!.frame = { x: 0, y: 0, w: 96, h: 96 };
      const value = { asset: definition, frame: definition.frames[0]!, image: { url: 'blob:verified-test-hull', width: 256, height: 96 }, generic: false };
      const ready = renderToStaticMarkup(createElement(FactionArtDisplay, { contentId: `unit.${role}`, definitionId: 'faction.ashen_compact', label: 'Actual hull', value }));
      expect(ready).toContain('width:96px;height:96px'); expect(ready).toContain('data-art-state="ready"');
      expect(ready).toContain(`data-art-rendered-id="unit.${role}.ashen_compact"`); expect(ready).not.toContain('<svg');
      for (const extra of [{}, { error: 'Atlas hash mismatch.' }, { loading: true }, { value: { ...value, asset: { ...definition, nativeResolution: { width: 64, height: 64 } } } }]) {
        const missing = renderToStaticMarkup(createElement(FactionArtDisplay, { contentId: `unit.${role}`, definitionId: 'faction.ashen_compact', label: 'Actual hull', ...extra }));
        expect(missing).toContain('<svg'); expect(missing).not.toContain('△'); expect(missing).not.toContain('data-art-rendered-id=');
        expect(missing).toContain('width:96px;height:96px');
      }
      const compact = renderToStaticMarkup(createElement(FactionArtDisplay, { contentId: `unit.${role}`, definitionId: 'faction.ashen_compact', label: 'Actual hull', value, compact: true }));
      expect(compact).toContain('width:48px;height:48px');
    }
  });

  it('binds exact culture definitions and shares one verified image across distinct role icons', async () => {
    const bytes = png(), fetch = responses(await pack(bytes), bytes);
    const { loadFactionArtFrame, FactionArtDisplay } = await import('./faction-art');
    const [ashen, reed] = await Promise.all([loadFactionArtFrame('unit.guard', 'faction.ashen_compact'), loadFactionArtFrame('unit.guard', 'faction.reedbound_council')]);
    expect(ashen.asset.id).toBe('unit.guard.ashen_compact'); expect(reed.asset.id).toBe('unit.guard.reedbound_council');
    expect(ashen.generic).toBe(false); expect(reed.generic).toBe(false);
    expect(decode).toHaveBeenCalledTimes(1); expect(fetch).toHaveBeenCalledTimes(2);
    const html = renderToStaticMarkup(createElement(FactionArtDisplay, { contentId: 'unit.guard', definitionId: 'faction.reedbound_council', label: 'Renamed Ashen Pretenders', value: reed }));
    expect(html).toContain('data-art-rendered-id="unit.guard.reedbound_council"');
    expect(html).toContain('data-art-state="ready"'); expect(html).toContain('width:64px;height:64px');
    await expect(loadFactionArtFrame('unit.guard', 'Reedbound Council')).rejects.toThrow('No approved visual family');
    await expect(loadFactionArtFrame('unit.guard', 'faction.generated_ashen_17')).rejects.toThrow('No approved visual family');
  });

  it('labels a missing qualified asset as generic while retaining its correctly bound generic role and fixed slot', async () => {
    const bytes = png(); responses(await pack(bytes), bytes);
    const { loadFactionArtFrame, FactionArtDisplay } = await import('./faction-art');
    const fallback = await loadFactionArtFrame('unit.guard', 'faction.glass_tide');
    expect(fallback.asset.id).toBe('unit.guard'); expect(fallback.generic).toBe(true);
    const html = renderToStaticMarkup(createElement(FactionArtDisplay, { contentId: 'unit.guard', definitionId: 'faction.glass_tide', label: 'Glass Tide guard', value: fallback }));
    expect(html).toContain('data-art-state="generic"'); expect(html).toContain('>Generic<');
    expect(html).toContain('data-art-rendered-id="unit.guard"'); expect(html).toContain('width:64px;height:64px');
    await expect(loadFactionArtFrame('character.engineer', 'faction.glass_tide')).rejects.toThrow('not published');
    const absent = renderToStaticMarkup(createElement(FactionArtDisplay, { contentId: 'character.engineer', definitionId: 'faction.glass_tide', label: 'March engineer', error: 'Approved artwork is not published.' }));
    expect(absent).toContain('data-art-state="fallback"'); expect(absent).toContain('>Generic<'); expect(absent).not.toContain('<img');
    const ornament = renderToStaticMarkup(createElement(FactionArtDisplay, { contentId: 'unit.guard', definitionId: 'faction.glass_tide', label: 'Glass Tide guard', value: fallback, decorative: true }));
    expect(ornament).toContain('aria-hidden="true"'); expect(ornament).not.toContain('aria-label=');
  });

  it('rejects altered bytes before decoding or creating a presentation URL', async () => {
    const bytes = png(), catalog = await pack(bytes); bytes[32] = 1; responses(catalog, bytes);
    const { loadFactionArtFrame } = await import('./faction-art');
    await expect(loadFactionArtFrame('unit.guard', 'faction.ashen_compact')).rejects.toThrow('hash mismatch');
    expect(decode).not.toHaveBeenCalled(); expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('rejects oversized dimensions even when replacement bytes have an updated hash', async () => {
    const bytes = png(); new DataView(bytes.buffer).setUint32(16, 8192); responses(await pack(bytes), bytes);
    const { loadFactionArtFrame } = await import('./faction-art');
    await expect(loadFactionArtFrame('unit.guard', 'faction.ashen_compact')).rejects.toThrow('4,096-pixel edge limit');
    expect(decode).not.toHaveBeenCalled(); expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('refuses candidate status before requesting an image or presenting it as approved', async () => {
    const bytes = png(), catalog = await pack(bytes);
    const fetch = responses({ ...catalog, assets: catalog.assets.map(item => ({ ...item, status: 'CANDIDATE' })) }, bytes);
    const { loadFactionArtFrame } = await import('./faction-art');
    await expect(loadFactionArtFrame('unit.guard', 'faction.ashen_compact')).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1); expect(decode).not.toHaveBeenCalled();
  });

  it('does not let a cached hash bypass a second atlas declaration’s dimension check', async () => {
    const bytes = png(), catalog = await pack(bytes);
    catalog.atlases.push({ ...catalog.atlases[0]!, id: 'test.other-atlas', height: 128 });
    catalog.assets[2]!.atlasId = 'test.other-atlas';
    responses(catalog, bytes);
    const { loadFactionArtFrame } = await import('./faction-art');
    await loadFactionArtFrame('unit.guard', 'faction.ashen_compact');
    await expect(loadFactionArtFrame('unit.guard', 'faction.reedbound_council')).rejects.toThrow('dimensions mismatch');
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it('withholds a decoded image whose natural dimensions contradict the verified header', async () => {
    const bytes = png(); responses(await pack(bytes), bytes);
    vi.stubGlobal('Image', class { src = ''; naturalWidth = 128; naturalHeight = 64; decode = decode; });
    const { loadFactionArtFrame } = await import('./faction-art');
    await expect(loadFactionArtFrame('unit.guard', 'faction.ashen_compact')).rejects.toThrow('Decoded atlas dimensions differ');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:verified-test-atlas');
  });
});
