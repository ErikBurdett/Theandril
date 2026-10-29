import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import type { LaunchOptions } from '@playwright/test';

// Chromium's --disable-dev-shm-usage redirects shared allocations into TMPDIR.
// Keep browser profiles/artifacts and those allocations off quota-limited /tmp.
const temporaryDirectory = resolve(process.env.PLAYWRIGHT_TMPDIR || process.env.TMPDIR ||
  resolve(homedir(), '.cache', 'theandril', 'playwright-tmp'));
if (process.platform === 'linux' &&
  Buffer.byteLength(`${temporaryDirectory}/.org.chromium.Chromium.XXXXXX/SingletonSocket`) >= 108) {
  throw new Error('Playwright temporary directory is too long for Chromium sockets. Set PLAYWRIGHT_TMPDIR to a shorter absolute path.');
}
mkdirSync(temporaryDirectory, { recursive: true, mode: 0o700 });
process.env.TMPDIR = temporaryDirectory;

export const chromiumLaunchOptions: LaunchOptions = {
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : { channel: 'chromium' }),
  args: ['--enable-unsafe-swiftshader'],
};
