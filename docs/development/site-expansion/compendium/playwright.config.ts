import { defineConfig } from '@playwright/test';
const base = process.env.VITE_BASE_PATH ?? '/Theandril/';
export default defineConfig({ testDir: '../../../../tests', testMatch: ['**/gameplay/compendium.spec.ts'], workers: 1, timeout: 45_000, use: { baseURL: `http://127.0.0.1:4180${base}`, launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--enable-unsafe-swiftshader'] } } });
