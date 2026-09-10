/** Generated library contract. Regenerate with: pnpm exec tsx scripts/build-lore.ts */
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { buildLoreLibrary } from '../../../../scripts/build-lore';
import library from './lore/library.json';

describe('lore library generation', () => {
  it('reproduces the committed generated library from the canonical markdown', async () => {
    const generated = await buildLoreLibrary();
    const committed = JSON.parse(await readFile(new URL('./lore/library.json', import.meta.url), 'utf8'));
    expect(generated).toEqual(committed);
    expect(library.books.find(book => book.id === 'broken-roads')?.documents).toHaveLength(11);
  });
});
