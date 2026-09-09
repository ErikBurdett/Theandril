import { defineConfig } from '@playwright/test';
import base from './gameplay.config';
const out = '/home/telephoneheater/Work/Theandril/docs/hermes-analysis/qa';
export default defineConfig({ ...base, workers: 1,
 outputDir: `${out}/perf-rerun-artifacts`,
 reporter: [['line'], ['json', { outputFile: `${out}/perf-rerun-results.json` }]],
});
