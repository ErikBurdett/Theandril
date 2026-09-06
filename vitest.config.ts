import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['packages/**/*.test.ts', 'tests/**/*.test.ts', 'apps/**/*.test.ts', 'apps/**/*.test.tsx'], testTimeout: 20000 } });
