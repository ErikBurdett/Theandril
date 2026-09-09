import { readFile } from 'node:fs/promises';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { RuntimeCatalog } from '@theandril/art-pipeline/runtime';
import { RuntimeArt } from '../../../packages/render/src/art';
import { RESOURCES } from '../../../packages/content/src/resources';
import { publicAssetUrl } from './asset-url';

// Exercise real published catalog/atlas validation and PNG hashes; image decode
// and GPU allocation are browser adapters, not part of this Node URL test.
vi.mock('pixi.js', () => ({
  ImageSource: class {},
  Texture: class {},
  Spritesheet: class {
    textures = {};
    async parse() {}
    destroy() {}
  },
}));

let catalog: RuntimeCatalog;
let catalogJson: string;
const files = new Map<string, Uint8Array<ArrayBuffer>>();
let lastBlob: Blob;
let decode: Mock<() => Promise<DataView>>;

beforeAll(async () => {
  const directory = new URL('../public/art/', import.meta.url);
  catalogJson = await readFile(new URL('catalog.json', directory), 'utf8');
  catalog = JSON.parse(catalogJson) as RuntimeCatalog;
  files.set('/art/catalog.json', new TextEncoder().encode(catalogJson));
  for (const atlas of catalog.atlases) for (const path of [atlas.jsonUrl, atlas.imageUrl]) {
    expect(path).toMatch(/^\/art\/[^/]+\.(json|png)$/);
    files.set(path, new Uint8Array(await readFile(new URL(path.slice('/art/'.length), directory))));
  }
});

beforeEach(() => {
  vi.stubGlobal('window', { innerWidth: 1440 });
  decode = vi.fn(async () => new DataView(await lastBlob.arrayBuffer()));
  vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => { lastBlob = blob as Blob; return 'blob:verified-runtime-test'; });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  vi.stubGlobal('Image', class {
    src = ''; naturalWidth = 0; naturalHeight = 0;
    async decode() { const data = await decode(); this.naturalWidth = data.getUint32(16); this.naturalHeight = data.getUint32(20); }
  });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function serve(base: string, alteredPath?: string) {
  const fetch = vi.fn(async (url: string) => {
    const entry = [...files].find(([path]) => `${base}${path.slice(1)}` === url);
    if (!entry) return new Response('Not found', { status: 404 });
    const [path, original] = entry;
    const bytes = new Uint8Array(original);
    if (path === alteredPath) bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 1;
    return new Response(bytes);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('approved renderer artwork deployment boundary', () => {
  it.each(['/', '/Theandril/'])('loads the unchanged published map and deferred battle atlas under %s', async base => {
    vi.stubEnv('BASE_URL', base);
    const fetch = serve(base);
    const art = await RuntimeArt.load(undefined, publicAssetUrl);
    try {
      const world = catalog.atlases.filter(atlas => !atlas.id.startsWith('battle'));
      const battle = catalog.atlases.filter(atlas => atlas.id.startsWith('battle'));
      expect(battle.map(atlas => atlas.id)).toEqual(['battle', 'battle-foot', 'battle-mounted']);
      expect(fetch.mock.calls.map(([url]) => url)).toEqual([publicAssetUrl('/art/catalog.json'), ...world.flatMap(atlas => [publicAssetUrl(atlas.jsonUrl), publicAssetUrl(atlas.imageUrl)])]);
      expect(art.status.atlasPages).toBe(world.length);
      expect(art.status.residentBytesEstimate).toBe(world.reduce((bytes, atlas) => bytes + atlas.width * atlas.height * 4, 0));
      expect(art.catalog).toEqual(catalog);
      for (const id of RESOURCES.flatMap(resource => [resource.id, resource.improvementId])) {
        expect(art.byContent.get(id)?.id, `live deposit/extraction binding: ${id}`).toBe(id);
        expect(art.byContent.get(id)?.atlasId).toBe('map-works');
      }
      expect(JSON.stringify(catalog)).toBe(JSON.stringify(JSON.parse(catalogJson)));
      const deferred = art.ensureBattle();
      expect(art.ensureBattle()).toBe(deferred);
      await deferred;
      expect(fetch.mock.calls.map(([url]) => url).slice(1 + world.length * 2)).toEqual(battle.flatMap(atlas => [publicAssetUrl(atlas.jsonUrl), publicAssetUrl(atlas.imageUrl)]));
      expect(art.status.atlasPages).toBe(catalog.atlases.length);
      expect(art.status.residentBytesEstimate).toBe(catalog.atlases.reduce((bytes, atlas) => bytes + atlas.width * atlas.height * 4, 0));
      expect(decode).toHaveBeenCalledTimes(catalog.atlases.length);
      expect(art.status.warnings).toEqual([]);
      expect(art.catalog).toEqual(catalog);
    } finally { art.destroy(); }
  });

  it('retains the standalone renderer’s root-relative default without a Vite dependency', async () => {
    const fetch = serve('/');
    const art = await RuntimeArt.load();
    expect(fetch.mock.calls[0]?.[0]).toBe('/art/catalog.json');
    expect(art.catalog).toEqual(catalog);
    art.destroy();
  });

  it('still rejects altered map pixels at a deployment subpath before decoding', async () => {
    vi.stubEnv('BASE_URL', '/Theandril/');
    serve('/Theandril/', catalog.atlases.find(atlas => atlas.id !== 'battle')!.imageUrl);
    await expect(RuntimeArt.load(undefined, publicAssetUrl)).rejects.toThrow('Atlas image hash mismatch');
    expect(decode).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('keeps deferred battle failure isolated and visible without changing approved declarations', async () => {
    vi.stubEnv('BASE_URL', '/Theandril/');
    const battle = catalog.atlases.find(atlas => atlas.id === 'battle')!;
    serve('/Theandril/', battle.imageUrl);
    const art = await RuntimeArt.load(undefined, publicAssetUrl);
    try {
      const residentPages = art.status.atlasPages;
      await art.ensureBattle();
      expect(art.status.atlasPages).toBe(residentPages);
      expect(art.status.warnings).toEqual([expect.stringContaining('Atlas image hash mismatch: battle')]);
      expect(art.catalog).toEqual(catalog);
    } finally { art.destroy(); }
  });
});
