import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
export default tseslint.config(
  // Frozen reviewer evidence is retained byte-for-byte, not maintained runtime/tooling source.
  { ignores: ['**/dist/**', '**/node_modules/**', 'playwright-report/**', 'test-results/**', '.agents/**', 'THEANDRIL_ASTRA_HANDOFF/**', 'docs/development/post-fix-review/persistence-evidence/**'] },
  js.configs.recommended, ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } }, rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
  } }
);
