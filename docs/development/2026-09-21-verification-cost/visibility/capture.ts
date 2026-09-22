import { writeFile } from 'node:fs/promises';
import { cases, lifecycle, versions } from './corpus';
const results = versions.flatMap(version => cases.map(item => ({ version, ...item, snapshots: lifecycle(version, item.origin, item.radius) })));
await writeFile(new URL('./baseline.json', import.meta.url), JSON.stringify({ scope: '32 original visibility lifecycles: counters, explored land/road memory and serialized state; generated geography with historical update gates, not original-version campaigns.', results }, null, 2) + '\n');
console.log(`Captured ${results.length} original visibility lifecycles.`);
