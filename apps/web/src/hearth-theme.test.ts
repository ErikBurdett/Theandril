import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const source = resolve(root, 'assets/art/source/hearth-card-ui');
const read = (path: string) => readFileSync(resolve(root, path));
const entries = JSON.parse(readFileSync(resolve(source, 'optimized-entries.json'), 'utf8')) as {
  files: { source: string; output: string; outputHash: string; sourceHash: string; bytes: number }[];
};
const expected = [
  { file: 'wood.webp', id: 'ui.wood', size: 512, bytes: 36532, hash: 'e23cae5a422a038a32b6990f4443db84c81e55c883451b5d30e56e7b039342bc' },
  { file: 'parchment.webp', id: 'ui.parchment', size: 512, bytes: 30180, hash: 'f43d231a4815ed557517898a09ef2c6489b9834ea0c3a7789bf391fa98923baa' },
  { file: 'ornament.corner-idle.webp', id: 'ornament.corner', size: 128, bytes: 2072, hash: '4bcccf32b83b6d5ac93f13b9430bfc1d2a9bbcfb7614e22a5d47765a1a103ac3' },
] as const;
const css = read('apps/web/src/hearth-theme.css').toString('utf8');
const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('reviewed Hearth & Card DOM materials', () => {
  it.each(expected)('retains exact reviewed $file bytes and native lossless dimensions', asset => {
    const bytes = read(`apps/web/public/ui/hearth-card/${asset.file}`);
    const entry = entries.files.find(file => file.output.endsWith(`/${asset.file}`));
    expect(entry?.outputHash).toBe(asset.hash);
    expect(entry?.bytes).toBe(asset.bytes);
    expect(bytes.byteLength).toBe(asset.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.hash);
    // These fixed reviewed files use the standard VP8L lossless bitstream header.
    // No decoder, shell executable or upstream source checkout is needed in CI.
    expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
    expect(bytes.readUInt32LE(4)).toBe(bytes.length - 8);
    expect(bytes.toString('ascii', 8, 16)).toBe('WEBPVP8L');
    expect(bytes[20]).toBe(0x2f);
    const dimensions = bytes.readUInt32LE(21);
    expect((dimensions & 0x3fff) + 1).toBe(asset.size);
    expect(((dimensions >>> 14) & 0x3fff) + 1).toBe(asset.size);
    const approval = JSON.parse(readFileSync(resolve(source, `${asset.id}.json`), 'utf8'));
    expect(approval).toMatchObject({ id: asset.id, status: 'APPROVED', version: 1,
      nativeResolution: { width: asset.size, height: asset.size },
      provenance: { provider: 'codex-imagegen', model: 'not-exposed-by-tool' } });
    expect(approval.review.inputHash).toMatch(/^[0-9a-f]{64}$/);
    expect(css).toContain(`/ui/hearth-card/${asset.file}`);
  });

  it('retains the separate artwork license and honest non-atlas/static provenance', () => {
    expect(entries.files).toHaveLength(3);
    expect(readFileSync(resolve(source, 'ASSET_LICENSE.md'), 'utf8')).toContain('Erik Burdett');
    const review = JSON.parse(read('docs/art/reviews/slice25-hearth-materials.json').toString('utf8'));
    expect(review.atlas).toMatchObject({ changesToMapAtlas: false, additionalMapAtlasPages: 0,
      additionalMapAtlasAssets: 0, downloadBytes: 68784, decodedRgbaBytesEstimate: 2162688 });
    expect(review.assets.map((asset: { framesUsed: number }) => asset.framesUsed)).toEqual([1, 1, 1]);
    const catalog = JSON.parse(read('apps/web/public/art/catalog.json').toString('utf8')) as { assets: { id: string }[] };
    for (const asset of expected) expect(catalog.assets.some(entry => entry.id === asset.id)).toBe(false);
  });

  it('keeps every selector scoped and leaves all layout and interaction properties to the HUD', () => {
    const allowed = /^(--[\w-]+|background(?:-[\w-]+)?|border(?:-[\w-]+)?|box-shadow|color|color-scheme|font-family|text-shadow|outline(?:-[\w-]+)?|accent-color|scrollbar-color|opacity|transition)$/;
    for (const [, selector] of withoutComments.matchAll(/([^{}]+)\{/g)) {
      expect(selector!.trim().startsWith('.application') || selector!.trim().startsWith('@media')).toBe(true);
    }
    for (const [, body] of withoutComments.matchAll(/\{([^{}]*)\}/g)) {
      for (const declaration of body!.split(';').map(value => value.trim()).filter(Boolean)) {
        expect(declaration.slice(0, declaration.indexOf(':')), declaration).toMatch(allowed);
      }
    }
    expect(css).not.toMatch(/@import|@font-face|animation:|backdrop-filter|filter:/);
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('outline: 2px solid #f1cd81');
    expect(css).toContain('border-style: dashed');
  });

  it('keeps body text in system fonts with legible ink, muted and danger contrast', () => {
    const luminance = (hex: string) => {
      const channels = hex.match(/[a-f\d]{2}/gi)!.map(value => parseInt(value, 16) / 255)
        .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
      return channels[0]! * .2126 + channels[1]! * .7152 + channels[2]! * .0722;
    };
    for (const [text, background] of [['#352619', '#ead8b3'], ['#f0dfb7', '#35261d'],
      ['#c5b89b', '#35261d'], ['#efba98', '#35261d'], ['#fff0cd', '#694a28']]) {
      const values = [luminance(text!), luminance(background!)].sort((a, b) => a - b);
      expect((values[1]! + .05) / (values[0]! + .05)).toBeGreaterThanOrEqual(4.5);
    }
    expect(css).toContain("font-family: Georgia, 'Times New Roman', serif");
    expect(css).toContain('font-family: system-ui');
  });
});
