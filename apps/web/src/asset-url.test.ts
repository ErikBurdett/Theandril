import { afterEach, describe, expect, it, vi } from 'vitest';
import { publicAssetUrl } from './asset-url';

afterEach(() => vi.unstubAllEnvs());

describe('deployment-relative public artwork URLs', () => {
  it.each(['/', '/Theandril/', '/nested/Theandril/'])('uses the %s mount without changing the asset path', base => {
    for (const path of ['/art/catalog.json', '/art/foundation.png', '/art/battle.json', '/art/battle.png', '/art/lab-catalog.json', '/art/preview-unit.guard.png', '/ui/hearth-card/wood.webp']) {
      expect(publicAssetUrl(path, base)).toBe(`${base}${path.slice(1)}`);
    }
    expect(publicAssetUrl('art/foundation.png?v=1#frame', base)).toBe(`${base}art/foundation.png?v=1#frame`);
    expect(publicAssetUrl('./art/catalog.json', base)).toBe(`${base}art/catalog.json`);
  });

  it('reads Vite BASE_URL by default and accepts a missing trailing slash', () => {
    vi.stubEnv('BASE_URL', '/Theandril/');
    expect(publicAssetUrl('/art/catalog.json')).toBe('/Theandril/art/catalog.json');
    expect(publicAssetUrl('/art/catalog.json', '/Theandril')).toBe('/Theandril/art/catalog.json');
    vi.stubEnv('BASE_URL', '/');
    expect(publicAssetUrl('/art/catalog.json')).toBe('/art/catalog.json');
  });

  it('does not rewrite explicitly resolved URLs or browser blob references', () => {
    for (const path of ['https://assets.example/art.png', 'http://localhost/art.png', '//assets.example/art.png', 'blob:https://example.test/verified', 'data:image/png;base64,AAAA', '#preview']) {
      expect(publicAssetUrl(path, '/Theandril/')).toBe(path);
    }
  });
});
