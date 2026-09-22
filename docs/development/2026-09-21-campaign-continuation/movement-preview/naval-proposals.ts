import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { planNaval, coastalFoundingSite } from '../../../../packages/ai/src/naval';
import type { Observation } from '../../../../packages/sim/src/index';

const folder = 'docs/development/2026-09-21-campaign-continuation/movement-preview/';
const prior = JSON.parse(await readFile('docs/development/2026-09-21-campaign-continuation/observations/baseline.json', 'utf8'));
const corpus = JSON.parse(gunzipSync(Buffer.from(prior.payload, 'base64')).toString('utf8'));
const proposals = [];
for (const snapshot of corpus.snapshots) for (let index = 0; index < snapshot.variants.length; index++) {
  const view = JSON.parse(snapshot.variants[index].observation) as Observation;
  const before = JSON.stringify(view), plan = planNaval(view, view.treasury);
  const sites = view.armies.filter(army => army.factionId === view.factionId && army.canFound)
    .map(army => ({ armyId: army.id, cell: coastalFoundingSite(view, army) }));
  proposals.push({ snapshot: snapshot.name, index, plan: { ...plan, heldArmyIds: [...plan.heldArmyIds], queuedSettlementIds: [...plan.queuedSettlementIds] }, sites });
  assert.equal(JSON.stringify(view), before);
}
if (process.argv.includes('--capture')) {
  await writeFile(`${folder}naval-proposals-before.json`, JSON.stringify({ sourceSha256: createHash('sha256').update(await readFile('packages/ai/src/naval.ts')).digest('hex'),
    note: 'Complete naval proposals and founder sites over the 91 previously captured canonical observation publications before the target-only call substitutions. Authored fixture coverage, not a campaign benchmark.', proposals }, null, 2) + '\n');
} else {
  const baseline = JSON.parse(await readFile(`${folder}naval-proposals-before.json`, 'utf8'));
  assert.deepEqual(proposals, baseline.proposals);
}
console.log(JSON.stringify({ mode: process.argv.includes('--capture') ? 'capture' : 'verify', observations: proposals.length,
  commands: proposals.reduce((sum, item) => sum + item.plan.commands.length, 0), founders: proposals.reduce((sum, item) => sum + item.sites.length, 0),
  sha256: createHash('sha256').update(JSON.stringify(proposals)).digest('hex') }));
