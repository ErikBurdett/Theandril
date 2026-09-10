import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

describe('lint boundaries for frozen review evidence', () => {
  const eslint = new ESLint();

  it('does not reinterpret the byte-preserved reviewer snapshot as live source', async () => {
    expect(await eslint.isPathIgnored('docs/development/post-fix-review/persistence-evidence/probes.mts')).toBe(true);
  });

  it('still enforces explicit typing in production source and maintained tests', async () => {
    for (const filePath of ['packages/persistence/src/campaign-storage.ts', 'apps/web/src/main.tsx', 'tests/tooling/lint-boundaries.test.ts']) {
      expect(await eslint.isPathIgnored(filePath)).toBe(false);
      const results = await eslint.lintText('export const invalid: any = 1;\n', { filePath });
      expect(results.flatMap(result => result.messages).some(message => message.ruleId === '@typescript-eslint/no-explicit-any' && message.severity === 2)).toBe(true);
    }
  });
});
