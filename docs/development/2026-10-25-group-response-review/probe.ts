import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { GroupOrderRequests, GroupPostingRequests } from '../../../apps/web/src/group-posting-requests';
import type { GroupCharterResult, GroupPostingResult } from '../../../apps/web/src/protocol';

// Executes the exact currently checked-in predicates and actual request classes.
// It does not instantiate React, a worker, or a browser. UI/finally consequences
// are separately identified as source review, not a production reproduction.
const main = readFileSync('apps/web/src/main.tsx', 'utf8');
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');
const evidence: unknown[] = [];

async function probe(kind: 'Posting' | 'Charter') {
  const field = `group${kind}Results`;
  const suffix = `) group${kind}Requests.current.finish(response.id, response.${field});`;
  const line = main.split('\n').find(value => value.includes(`else if (Array.isArray(response.${field})`));
  assert(line && line.endsWith(suffix), `Current ${kind} acceptance line moved; review the probe.`);
  const predicate = line.slice(line.indexOf('else if (') + 'else if ('.length, -suffix.length);
  const accepts = new Function('response', `return (${predicate});`) as (response: unknown) => boolean;
  const key = kind === 'Posting' ? 'armyId' : 'settlementId';
  const ids = kind === 'Posting' ? ['army.1', 'army.2'] : ['settlement.1', 'settlement.2'];
  const good = ids.map(id => ({ [key]: id, accepted: true }));
  const cases = [
    { name: 'complete-correct-control', rows: good, accepted: true },
    { name: 'empty-array', rows: [], accepted: true },
    { name: 'missing-one-typed-row', rows: good.slice(0, 1), accepted: true },
    { name: 'duplicate-typed-row', rows: [good[0], good[0]], accepted: true },
    { name: 'wrong-typed-actor', rows: [good[0], { [key]: 'not-submitted', accepted: true }], accepted: true },
    { name: 'extra-typed-actor', rows: [...good, { [key]: 'not-submitted', accepted: true }], accepted: true },
    { name: 'missing-field-control', rows: undefined, accepted: false },
    { name: 'malformed-row-control', rows: [{ [key]: ids[0], accepted: 'yes' }], accepted: false },
  ];
  for (const sample of cases) {
    const requests = kind === 'Posting' ? new GroupPostingRequests() : new GroupOrderRequests<GroupCharterResult>();
    const pending = requests.enqueue(17);
    const resolution = pending.then(rows => ({ kind: 'resolved', rows }), error => ({ kind: 'rejected', message: String(error) }));
    const passes = accepts({ [field]: sample.rows });
    assert.equal(passes, sample.accepted);
    if (passes) requests.finish(17, sample.rows as (GroupPostingResult & GroupCharterResult)[]);
    const pendingAtFinally = requests.has(17);
    if (pendingAtFinally) requests.reset('Probe cleanup: the real main finally recovery guard would still see this request.');
    const result = await resolution;
    assert.equal(result.kind, sample.accepted ? 'resolved' : 'rejected');
    evidence.push({ kind, case: sample.name, submittedActorIds: ids, responseRows: sample.rows ?? null,
      exactSourcePredicateAccepts: passes, pendingAtFinally,
      result, displayedAcceptedCountByCurrentComponentFormula: sample.accepted ? sample.rows!.filter(row => row.accepted === true).length : null });
  }
  return predicate;
}

async function mainProbe() {
  const predicates = { posting: await probe('Posting'), charter: await probe('Charter') };
  console.log(JSON.stringify({
    scope: 'Exact source predicate + actual ledger probe; no production browser run and no claim that the normal worker emits malformed results.',
    sourceHashes: {
      'apps/web/src/main.tsx': sha256(main),
      'apps/web/src/group-posting-requests.ts': sha256(readFileSync('apps/web/src/group-posting-requests.ts', 'utf8')),
      'apps/web/src/group-postings.tsx': sha256(readFileSync('apps/web/src/group-postings.tsx', 'utf8')),
      'apps/web/src/group-charters.tsx': sha256(readFileSync('apps/web/src/group-charters.tsx', 'utf8')),
    }, predicates, evidence,
  }, null, 2));
}
void mainProbe();
