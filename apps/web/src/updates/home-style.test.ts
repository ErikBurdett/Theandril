import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('home page styling', () => {
  const css = readFileSync('apps/web/src/updates/journal.css', 'utf8');
  it('lets full commit hashes and long paths wrap inside the change ledger', () => {
    const rule = css.match(/\.commit-entry[^{]*\{[^}]*\}/g)?.join('\n') ?? '';
    expect(rule).toMatch(/overflow-wrap:\s*anywhere/);
  });
  it('styles the hero actions, doorways and ledger with existing materials only', () => {
    for (const selector of ['.home-hero', '.hero-actions', '.home-doorways', '.commit-ledger', '.commit-entry', '.commit-areas', '.commit-notes']) expect(css, selector).toContain(selector);
    expect(css).not.toMatch(/linear-gradient|@import|@font-face/);
  });
});
