import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { applyCommand, advancePatrols, deserializeGame, getMovementPreview, getObservation, observePatrols, serializeGame, stateHash, type DomainEvent } from '@theandril/sim';
import { neighbors } from '@theandril/mapgen';
import { matureCampaign } from '../packages/test-fixtures/src/index';

const results = [];
for (const size of ['huge', 'legendary'] as const) {
  const game = matureCampaign(size);
  let assigned = 0;
  for (const faction of game.factions) {
    const view = getObservation(game, faction.id), armies = view.armies.filter(army => army.factionId === faction.id && army.canAttack && !army.canFound && army.domain === 'land');
    if (!armies.length) continue;
    const source = armies[0]!;
    const target = neighbors(source.cell, view.width, view.height).find(cell => {
      const preview = getMovementPreview(view, source.id, cell);
      return preview.canQueue && preview.action === 'move';
    });
    if (target === undefined) throw new Error('Fixture has no ordinary local patrol leg.');
    for (const army of armies.slice(0, 128)) {
      const result = applyCommand(game, { type: 'setPatrol', factionId: faction.id, armyId: army.id, firstCell: army.cell, secondCell: target, enabled: true });
      if (!result.ok) throw new Error(result.error);
      assigned++;
    }
  }
  const save = serializeGame(game), samples = [];
  let expected = '';
  for (let i = 0; i < 4; i++) {
    const copy = deserializeGame(save), events: DomainEvent[] = [];
    const start = performance.now(); advancePatrols(copy, events); const advanceMs = performance.now() - start;
    const observeStart = performance.now();
    const reports = copy.factions.flatMap(faction => observePatrols(copy, faction.id));
    const observeAllMs = performance.now() - observeStart;
    const hash = stateHash(copy);
    if (expected && expected !== hash) throw new Error('Benchmark patrol continuation is nondeterministic.');
    expected = hash;
    const attempts = copy.patrols.filter(patrol => patrol.lastAttemptTurn === copy.turn);
    for (const faction of copy.factions) if (attempts.filter(patrol => patrol.factionId === faction.id).length > 8) throw new Error('Exceeded per-realm route budget.');
    if (reports.length !== assigned) throw new Error('Observation omitted configured patrols.');
    if (i) samples.push({ advanceMs, observeAllMs, attempts: attempts.length, refused: attempts.filter(patrol => patrol.lastError).length, events: events.length, hash });
  }
  results.push({ size, authored: true, cells: game.world.terrain.length, realms: game.factions.length, armies: Object.keys(game.armies).length, patrols: assigned, warmups: 1, samples });
}
const output = { scope: 'Authored generator4 mature realms; isolated patrol allocation and all-realm patrol reports. Eight route attempts/realm; one warmup, three identical-save samples. Excludes setup, deserialize, hashing, other turn phases, worker transfer and rendering.', results };
writeFileSync('docs/development/2026-10-24-patrols/benchmark.json', JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output, null, 2));
