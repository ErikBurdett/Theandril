import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';

type Asset = { id: string; path: string; sourcePath: string; sourceSha256: string; sha256: string; alt: string; caption: string; width: number; height: number; crop: number[] | null; sourceWidth: number; sourceHeight: number };
it('ships only traceable local imagery under the approved 3.5 MiB journal budget', () => {
  const root = resolve('apps/web/public');
  const manifestPath = resolve(root, 'updates/provenance.json');
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { assets: [] };
  const assets: Asset[] = manifest.assets;
  expect(assets.map(asset => asset.id)).toEqual(['campaign', 'battle', 'cultures', 'archipelago', 'technical-ledger', 'transport-landing', 'fleet-provisions-saved-voyage', 'fleet-provisions-exhausted-narrow', 'fleet-provisions-refilled-narrow', 'group-postings-desktop', 'group-postings-narrow', 'group-charters-narrow', 'charter-templates-controls', 'selection-groups-recall', 'production-sequence-results', 'group-travel-results', 'defense-theater-summary', 'patrol-narrow-actions', 'posting-templates-controls', 'registry-paused-selector', 'group-patrol-actions', 'settlement-order-selector', 'group-patrol-points', 'group-policy-receipt-rows', 'worker-policy-growth']);
  let bytes = 0;
  for (const asset of assets) {
    expect(asset.path).toMatch(/^updates\/[a-z-]+\.(webp|png)$/);
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
    if (asset.id.startsWith('fleet-provisions-') || asset.id.startsWith('group-postings-') || asset.id === 'group-charters-narrow' || asset.id === 'charter-templates-controls' || asset.id === 'selection-groups-recall' || asset.id === 'production-sequence-results' || asset.id === 'group-travel-results' || asset.id === 'defense-theater-summary' || asset.id === 'patrol-narrow-actions' || asset.id === 'posting-templates-controls' || asset.id === 'registry-paused-selector' || asset.id === 'group-patrol-actions' || asset.id === 'settlement-order-selector' || asset.id === 'group-patrol-points' || asset.id === 'group-policy-receipt-rows' || asset.id === 'worker-policy-growth') {
      expect(asset.crop).toBeNull();
      expect(data.equals(readFileSync(asset.sourcePath))).toBe(true);
      expect(asset.sha256).toBe(asset.sourceSha256);
      expect([asset.width, asset.height]).toEqual([asset.sourceWidth, asset.sourceHeight]);
    }
    expect(asset.alt.length).toBeGreaterThan(20);
    expect(asset.caption).toMatch(/illustrative|fixture|regression/i);
    expect(asset.width).toBeGreaterThan(0);
    expect(asset.height).toBeGreaterThan(0);
  }
  expect(manifest.totalJournalImageBytes).toBe(bytes);
  expect(manifest.journalImageBudgetBytes).toBe(3.5 * 1024 * 1024);
  expect(bytes).toBeLessThanOrEqual(manifest.journalImageBudgetBytes);
});
