import { defineConfig } from '@playwright/test';
import base from '../../../playwright.production.config';
import path from 'node:path';
const root = '/home/telephoneheater/Work/Theandril';
const out = path.join(root, 'docs/hermes-analysis/qa');
export default defineConfig({ ...base,
 testDir: path.join(root, 'tests/production'), workers: 1,
 outputDir: path.join(out, 'production-artifacts'),
 reporter: [['line'], ['json', { outputFile: path.join(out, 'production-results.json') }]],
 webServer: { command: 'npm exec -- vite preview --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174', cwd: path.join(root, 'apps/web'), reuseExistingServer: false }
});
