import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { getMovementQuery } from '../../../../packages/sim/src/index';
import { previewCorpus } from './corpus';
const cases = previewCorpus();
const entries = cases.map(item => ({ name: item.name, preview: getMovementQuery(item.view, item.armyId, item.target, { append: item.append }).preview }));
const sourceSha256 = createHash('sha256').update(await readFile('packages/sim/src/movement.ts')).digest('hex');
await writeFile('docs/development/2026-09-21-campaign-continuation/movement-preview/baseline.json', JSON.stringify({ sourceSha256,
  note: 'Complete target previews from the original public full query, before the preview-only API; includes the range-depleted shared node budget.', entries }, null, 2) + '\n');
console.log(JSON.stringify({ cases: entries.length, sourceSha256 }));
