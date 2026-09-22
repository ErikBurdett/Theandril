import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const filename = process.argv[2] ?? 'docs/development/2026-09-21-campaign-continuation/performance/epic-before-hash.cpuprofile';
const output = process.argv[3] ?? 'docs/development/2026-09-21-epic-baseline/ai/retained-profile.json';
const raw = await readFile(filename), profile = JSON.parse(raw);
const nodes = new Map(profile.nodes.map(node => [node.id, node])), parents = new Map();
for (const node of profile.nodes) for (const child of node.children ?? []) parents.set(child, node.id);
const keys = new Map(), totals = new Map();
for (const node of profile.nodes) {
  const frame = node.callFrame, key = `${frame.url}:${frame.lineNumber + 1}:${frame.columnNumber + 1} ${frame.functionName || '(anonymous)'}`;
  keys.set(node.id, key);
  if (!totals.has(key)) totals.set(key, { location: key, selfMs: 0, inclusiveMs: 0, selfBelowNavalMs: 0 });
}
for (let sample = 0; sample < profile.samples.length; sample++) {
  const duration = profile.timeDeltas[sample] / 1000, id = profile.samples[sample], seen = new Set();
  let cursor = id, inNaval = false;
  while (cursor !== undefined) {
    const key = keys.get(cursor), row = totals.get(key);
    if (!seen.has(key)) { row.inclusiveMs += duration; seen.add(key); }
    if (nodes.get(cursor)?.callFrame.functionName === 'planNaval') inNaval = true;
    cursor = parents.get(cursor);
  }
  const row = totals.get(keys.get(id)); row.selfMs += duration;
  if (inNaval) row.selfBelowNavalMs += duration;
}
const rows = [...totals.values()];
const report = { profile: filename, sha256: createHash('sha256').update(raw).digest('hex'),
  scope: 'Sampled CPU attribution from the referenced Epic run; inclusive rows overlap. Source chronology is recorded in the accompanying investigation notes.',
  ai: rows.filter(row => row.location.includes('/packages/ai/')).sort((a, b) => b.inclusiveMs - a.inclusiveMs).slice(0, 80),
  navalDescendantsBySelf: rows.filter(row => row.selfBelowNavalMs).sort((a, b) => b.selfBelowNavalMs - a.selfBelowNavalMs).slice(0, 50) };
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
