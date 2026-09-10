import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('verification workflows retain immutable evidence revisions beyond a shallow checkout', () => {
  for (const path of ['.github/workflows/pages.yml', '.github/workflows/verify.yml']) {
    const workflow = readFileSync(path, 'utf8');
    const checkoutOptions = workflow.match(/uses: actions\/checkout@[^\n]*\n((?:(?!\s*-\s)[^\n]*\n)*)/)?.[1] ?? '';
    expect(checkoutOptions, path).toMatch(/^\s+fetch-depth: 0\s*$/m);
  }
});

test('the actual Pages suite collects journal journeys alongside game and navigation smoke', () => {
  const listing = execFileSync('pnpm', ['exec', 'playwright', 'test', '--config', 'playwright.pages.config.ts', '--list'], { encoding: 'utf8' });
  expect(listing).toContain('updates.spec.ts');
  expect(listing).toContain('developer-navigation.spec.ts');
  expect(listing).toContain('deployment-assets.spec.ts');
});
