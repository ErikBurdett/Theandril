import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';
import { buildCompendiumData } from '../../../../../scripts/build-compendium';

/** Regenerate with: pnpm tsx scripts/build-compendium.ts */
test('generated compendium data is an exact projection of the content package and art catalog', async () => {
  const committed = JSON.parse(await readFile(new URL('./data.json', import.meta.url), 'utf8'));
  expect(committed).toEqual(await buildCompendiumData());
});
