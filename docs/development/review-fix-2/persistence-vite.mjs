import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

// Dedicated, loopback-only server with its own dependency cache. Never uses/stops 5173.
const root = '/home/telephoneheater/Work/Theandril';
const require = createRequire(root + '/apps/web/package.json');
const { createServer } = await import(require.resolve('vite'));
const port = Number(process.env.PERSISTENCE_TEST_PORT ?? 5197);
assert.equal(port, 5197);
const server = await createServer({
  root: root + '/apps/web', configFile: root + '/apps/web/vite.config.ts',
  cacheDir: root + '/docs/development/review-fix-2/persistence-vite-cache',
  plugins: [{ name: 'read-only-review-checkpoint', enforce: 'pre', load(id) {
    if (id === root + '/packages/persistence/src/campaign-storage.ts?review-before') {
      return readFileSync(new URL('./persistence-before.ts.txt', import.meta.url), 'utf8');
    }
  } }],
  server: { host: '127.0.0.1', port, strictPort: true, hmr: false, fs: { allow: [root] } },
});
await server.listen();
console.log('PERSISTENCE_SERVER_READY http://127.0.0.1:' + port);
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await server.close(); process.exit(0); });
