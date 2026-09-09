import { defineConfig } from '@playwright/test';
import base from '../../../playwright.config';
import path from 'node:path';
const root = '/home/telephoneheater/Work/Theandril';
const out = path.join(root, 'docs/hermes-analysis/qa');
export default defineConfig({ ...base,
 testDir: path.join(root, 'tests/gameplay'), workers: 1,
 outputDir: path.join(out, 'gameplay-artifacts'),
 reporter: [['line'], ['json', { outputFile: path.join(out, 'gameplay-results.json') }]],
 webServer: { command: 'npm exec -- vite --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', cwd: path.join(root, 'apps/web'), reuseExistingServer: true }
});
