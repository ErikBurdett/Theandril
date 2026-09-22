import { configDefaults, defineConfig } from 'vitest/config';

// `pnpm test` runs every project. The split lets a developer run the fast
// rules/UI suite alone (`pnpm test:unit`) and lets CI schedule the long
// generated AI campaigns and repository-integrity checks separately.
const campaigns = [
  'tests/headless/chronicle-victory.test.ts', 'tests/headless/conquest-soak.test.ts',
  'packages/ai/src/pacing.test.ts', 'packages/ai/src/pacing-epic.test.ts', 'packages/ai/src/contact.test.ts',
  'packages/ai/src/recruitment.test.ts', 'packages/ai/src/progression.test.ts', 'packages/ai/src/resource-economy.test.ts',
  'packages/ai/src/overseas-generated.test.ts', 'packages/test-fixtures/src/empire-land-fixture.test.ts',
];
const repository = [
  'tests/art-factory.test.ts', 'packages/art-pipeline/src/**/*.test.ts', 'apps/web/src/updates/changelog.test.ts',
];
const include = ['packages/**/*.test.ts', 'tests/**/*.test.ts', 'apps/**/*.test.ts', 'apps/**/*.test.tsx'];

export default defineConfig({
  test: {
    testTimeout: 20000,
    projects: [
      { extends: true, test: { name: 'unit', include, exclude: [...configDefaults.exclude, ...campaigns, ...repository] } },
      { extends: true, test: { name: 'campaigns', include: campaigns } },
      { extends: true, test: { name: 'repository', include: repository } },
    ],
  },
});
