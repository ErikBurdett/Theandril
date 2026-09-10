import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';

type Asset = { id: string; path: string; sourcePath: string; sourceSha256: string; sha256: string; alt: string; caption: string; width: number; height: number; crop: number[] | null; sourceWidth: number; sourceHeight: number };
it('ships only traceable local imagery under a three MiB journal budget', () => {
  const root = resolve('apps/web/public');
  const manifestPath = resolve(root, 'updates/provenance.json');
  const assets: Asset[] = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')).assets : [];
  expect(assets.map(asset => asset.id)).toEqual(['campaign', 'battle', 'cultures', 'archipelago']);
  let bytes = 0;
  for (const asset of assets) {
    expect(asset.path).toMatch(/^updates\/[a-z-]+\.webp$/);
    const data = readFileSync(resolve(root, asset.path));
    bytes += data.length;
    if (asset.crop) {
      expect(asset.crop[0]).toBeGreaterThanOrEqual(0);
      expect(asset.crop[1]).toBeGreaterThanOrEqual(0);
      expect(asset.crop[2]).toBeLessThanOrEqual(asset.sourceWidth);
      expect(asset.crop[3]).toBeLessThanOrEqual(asset.sourceHeight);
    }
    expect(createHash('sha256').update(data).digest('hex')).toBe(asset.sha256);
    expect(createHash('sha256').update(readFileSync(asset.sourcePath)).digest('hex')).toBe(asset.sourceSha256);
    expect(asset.alt.length).toBeGreaterThan(20);
    expect(asset.caption).toMatch(/illustrative|fixture|regression/i);
    expect(asset.width).toBeGreaterThan(0);
    expect(asset.height).toBeGreaterThan(0);
  }
  expect(bytes).toBeLessThanOrEqual(3 * 1024 * 1024);
});
