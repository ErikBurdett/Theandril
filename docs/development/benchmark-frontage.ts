/** Authored co-located stacks: diagnostic read-model/query costs, not gameplay or renderer FPS. */
import assert from 'node:assert/strict';
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { applyCommand, createArmyFormation, deserializeGame, getMovementQuery, getObservation, serializeGame, stateHash } from '../../packages/sim/src/index';
import { withRules } from '../../packages/sim/src/rules';
import { selectDefendingArmies } from '../../packages/sim/src/battle-frontage';

const out = 'docs/development/frontage-costs-stable';
mkdirSync(out, { recursive: true });
writeFileSync(`${out}/samples.jsonl`, '', { flag: 'wx' });
function measure(run: () => unknown, count: number) {
  const coldStart = performance.now(); run(); const coldMs = performance.now() - coldStart;
  for (let index = 0; index < 2; index++) run();
  const samples: number[] = [];
  for (let index = 0; index < count; index++) {
    const start = performance.now(); run(); samples.push(performance.now() - start);
  }
  const ordered = [...samples].sort((a, b) => a - b);
  return { coldMs, samples, medianMs: ordered[Math.floor(ordered.length / 2)]!, p95Ms: ordered[Math.ceil(ordered.length * 0.95) - 1]! };
}
const rows = [];
for (const count of [20, 21, 200, 1000]) {
  let state = borderBattleCampaign();
  const target = state.armies['army.4']!;
  target.formations = [{ ...createArmyFormation(target.id, 'unit.scout'), strength: 1, morale: 1 }];
  for (let index = 1; index < count; index++) {
    const id = `army.${state.nextId++}`;
    state.armies[id] = { ...target, id, formations: [{ ...createArmyFormation(id, 'unit.scout'), strength: 1, morale: 1 }] };
  }
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  assert.equal(applyCommand(state, { type: 'declareWar', factionId: state.turnOwnerId, targetFactionId: target.factionId }).ok, true);
  const before = stateHash(state), samples = count === 1000 ? 10 : 20;
  const defenders = Object.values(state.armies).filter(army => army.cell === target.cell && army.factionId === target.factionId);
  assert.equal(defenders.length, count);
  const selector = measure(() => selectDefendingArmies(defenders, target.id), samples);
  for (const rules of [16, 17] as const) {
    const observation = measure(() => withRules(state, rules, () => getObservation(state, target.factionId)), samples);
    const view = withRules(state, rules, () => getObservation(state, state.turnOwnerId));
    const movement = measure(() => getMovementQuery(view, 'army.2', target.cell), samples);
    const query = getMovementQuery(view, 'army.2', target.cell);
    assert.equal(query.preview?.canMoveNow, rules === 17 || count <= 20);
    assert.equal(stateHash(state), before);
    const row = { count, rules, observer: 'defender owner (full army views)', observedArmies: withRules(state, rules, () => getObservation(state, target.factionId)).armies.length, selector, observation, movement, queryAction: query.preview?.action, unchangedCanonicalHash: before };
    rows.push(row); appendFileSync(`${out}/samples.jsonl`, JSON.stringify(row) + '\n');
    console.log(JSON.stringify({ count, rules, observationP95Ms: observation.p95Ms, movementP95Ms: movement.p95Ms, selectorP95Ms: selector.p95Ms }));
  }
}
assert.equal(rows.length, 8);
writeFileSync(`${out}/summary.json`, JSON.stringify({ scope: 'Synthetic 20/21/200/1000 singleton defenders on one border tile, valid saves and real declaration. Compare explicit16/current17 same-state read models; no old-code baseline, natural gameplay, renderer or exclusive benchmark claim. Shared workstation with concurrent tests/campaigns; small sample p95 is diagnostic, not certification.', rows }, null, 2) + '\n');
