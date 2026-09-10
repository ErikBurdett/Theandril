import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import config from '../../apps/web/vite.config';

test('builds the game and journal as independent HTML entrypoints', () => {
  const input = (config as { build?: { rollupOptions?: { input?: Record<string, string> } } }).build?.rollupOptions?.input;
  expect(input).toEqual({
    game: resolve('apps/web/index.html'),
    updates: resolve('apps/web/updates/index.html'),
  });
});

test('Pages checks the journal contract before uploading the public artifact', () => {
  const workflow = readFileSync('.github/workflows/pages.yml', 'utf8');
  const testPaths = workflow.match(/run: pnpm exec vitest run ([^\n]+)/)?.[1]?.split(/\s+/);
  expect(testPaths).toContain('apps/web/src/updates');
  expect(workflow.indexOf('apps/web/src/updates')).toBeLessThan(workflow.indexOf('actions/upload-pages-artifact@'));
});
