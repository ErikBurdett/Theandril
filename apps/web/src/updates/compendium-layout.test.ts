import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('compendium layout', () => {
  const css = readFileSync('apps/web/src/updates/compendium.css', 'utf8');
  it('sizes unit-card sprites with layout width rather than a transform that leaves a 128px box behind', () => {
    const rule = css.match(/\.unit-card \.sprite\{[^}]*\}/)?.[0] ?? '';
    expect(rule).not.toMatch(/transform:/);
    expect(rule).toMatch(/width:\s*\d+px/);
  });
  it('lets unit and catalog cards shrink below their preferred column width on narrow screens', () => {
    expect(css).toMatch(/\.unit-grid\{[^}]*minmax\(min\(290px, ?100%\), ?1fr\)/);
    expect(css).toMatch(/\.catalog-grid\{[^}]*minmax\(min\(180px, ?100%\), ?1fr\)/);
    expect(css).toMatch(/\.culture-grid\{[^}]*minmax\(min\(220px, ?100%\), ?1fr\)/);
    // The text column beside a sprite is a flex item; without min-width:0 it keeps its content width and overflows the card.
    expect(css).toMatch(/\.unit-card>div\{[^}]*min-width:0/);
  });
});
