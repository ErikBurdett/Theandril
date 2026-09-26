import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, platform } from 'node:os';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH } from '@theandril/content';
import { createArmyFormation, createGame, deserializeGame, getObservation, SAVE_VERSION, serializeGame, stateHash, type DomainEvent, type GameState, type SelectionGroup } from '@theandril/sim';
import { MAX_SELECTION_GROUP_MEMBERS, MAX_SELECTION_GROUPS_PER_FACTION, observeSelectionGroups, pruneSelectionGroups, validateSelectionGroups } from '../packages/sim/src/selection-groups';
import { rebuildIndexes } from '../packages/sim/src/visibility';

const smoke = process.argv.includes('--smoke');
const outputIndex = process.argv.indexOf('--out');
const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : undefined;
if (outputIndex >= 0 && !output) throw new Error('--out requires a JSON path.');
const WARMUPS = smoke ? 1 : 3, SAMPLES = smoke ? 3 : 15;
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
function timed<T>(run: () => T) { const start = performance.now(), result = run(); return { result, ms: performance.now() - start }; }
function distribution(samplesMs: number[]) {
  const sorted = [...samplesMs].sort((a, b) => a - b);
  return { samplesMs, medianMs: sorted[Math.floor(sorted.length / 2)]!, p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))]!, maxMs: sorted.at(-1)! };
}

/** Generated geography, explicitly authored forces and saturated metadata. This
 * is bounded throughput evidence, not an organically developed mature realm. */
function fixture(size: 'huge' | 'legendary', factionCount: number): GameState {
  const game = createGame({ seed: 20260925, size, factionCount, generatorVersion: 8, pace: 'epic' });
  for (const faction of game.factions) {
    const originals = Object.values(game.armies).filter(army => army.factionId === faction.id);
    const cell = originals[0]!.cell;
    for (let index = originals.length; index < MAX_SELECTION_GROUP_MEMBERS; index++) {
      const id = `army.${game.nextId++}`;
      game.armies[id] = { id, factionId: faction.id, name: `Authored reserve ${index}`, cell, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] };
    }
  }
  rebuildIndexes(game);
  return deserializeGame(serializeGame(game));
}

function saturatedGroups(game: GameState): SelectionGroup[] {
  const groups: SelectionGroup[] = [];
  let next = 1;
  for (const faction of game.factions) {
    const memberIds = Object.values(game.armies).filter(army => army.factionId === faction.id).map(army => army.id).sort();
    assert.equal(memberIds.length, MAX_SELECTION_GROUP_MEMBERS);
    for (let index = 0; index < MAX_SELECTION_GROUPS_PER_FACTION; index++) groups.push({
      id: `selection-group.${next++}`, factionId: faction.id, kind: 'armies',
      name: `Authored group ${String(index + 1).padStart(2, '0')}`, memberIds: [...memberIds],
    });
  }
  return groups.sort((a, b) => a.id < b.id ? -1 : 1);
}

function measure(size: 'huge' | 'legendary', factionCount: number) {
  const game = fixture(size, factionCount), owner = game.turnOwnerId;
  const observationOptions = { landDetails: 'none' as const, developmentCandidates: false };
  const baseline = timed(() => getObservation(game, owner, observationOptions));
  const groups = saturatedGroups(game);
  game.selectionGroups = groups; game.nextSelectionGroupId = groups.length + 1;
  validateSelectionGroups(game);
  const sealed = stateHash(game);
  const populated = timed(() => getObservation(game, owner, observationOptions));
  assert.deepEqual({ ...populated.result, selectionGroups: [] }, baseline.result);
  assert.equal(populated.result.selectionGroups.length, MAX_SELECTION_GROUPS_PER_FACTION);
  const metrics: Record<string, number[]> = { ownGroupObservation: [], reconcileRetained: [], reconcileOneLossPerRealm: [] };
  const record = (name: string, ms: number, iteration: number) => { if (iteration >= WARMUPS) metrics[name]!.push(ms); };
  for (let iteration = 0; iteration < WARMUPS + SAMPLES; iteration++) {
    const read = timed(() => observeSelectionGroups(game, owner));
    record('ownGroupObservation', read.ms, iteration);
    assert.equal(read.result.length, MAX_SELECTION_GROUPS_PER_FACTION);
    const events: DomainEvent[] = [];
    const retained = timed(() => pruneSelectionGroups(game, events));
    record('reconcileRetained', retained.ms, iteration);
    assert.equal(events.length, 0);
  }
  assert.equal(stateHash(game), sealed, 'Read/retained reconciliation mutated the campaign.');
  const missing = game.factions.map(faction => Object.values(game.armies).find(army => army.factionId === faction.id)!);
  for (const army of missing) delete game.armies[army.id];
  let removedMemberships = 0, lossEvents = 0;
  for (let iteration = 0; iteration < WARMUPS + SAMPLES; iteration++) {
    // Fixture reset lies outside the measured reconciliation interval.
    game.selectionGroups = groups.map(group => ({ ...group, memberIds: [...group.memberIds] }));
    const events: DomainEvent[] = [];
    const losses = timed(() => pruneSelectionGroups(game, events));
    record('reconcileOneLossPerRealm', losses.ms, iteration);
    removedMemberships = groups.length * MAX_SELECTION_GROUP_MEMBERS - game.selectionGroups.reduce((sum, group) => sum + group.memberIds.length, 0);
    lossEvents = events.length;
    assert.equal(removedMemberships, groups.length); assert.equal(lossEvents, groups.length);
  }
  for (const army of missing) game.armies[army.id] = army;
  game.selectionGroups = groups; rebuildIndexes(game);
  assert.equal(stateHash(game), sealed);
  assert.equal(stateHash(deserializeGame(serializeGame(game))), sealed);
  // Schema-bound byte illustration only: these maximal identifiers do not
  // name campaign entities and are never fed to the canonical state.
  const illustrativeMaxIds = populated.result.selectionGroups.map(group => ({ ...group, memberIds: group.memberIds.map((_, index) => `army.${String(index).padStart(95, 'a')}`) }));
  return { size, synthetic: true, description: 'Generated map, 128 authored own land armies per realm; all realms hold 24 overlapping 128-member army groups. No organic campaign-growth or worker/browser timing claim.',
    generatorVersion: game.world.generatorVersion, layout: game.world.layout,
    cells: game.world.terrain.length, factions: game.factions.length, armies: Object.keys(game.armies).length,
    allGroups: groups.length, allMemberReferences: groups.length * MAX_SELECTION_GROUP_MEMBERS,
    observedOwnGroups: populated.result.selectionGroups.length, observedOwnMemberReferences: MAX_SELECTION_GROUPS_PER_FACTION * MAX_SELECTION_GROUP_MEMBERS,
    observedCells: populated.result.cells.length, ownObservationBytesWithoutGroups: bytes(baseline.result), ownObservationBytesWithGroups: bytes(populated.result),
    ownObservationAddedBytes: bytes(populated.result) - bytes(baseline.result), ownGroupArrayBytes: bytes(populated.result.selectionGroups),
    illustrative100CharacterMemberIdArrayBytes: bytes(illustrativeMaxIds),
    singleFullObservationSamplesMs: { withoutGroups: baseline.ms, withGroups: populated.ms },
    warmups: WARMUPS, timings: Object.fromEntries(Object.entries(metrics).map(([key, values]) => [key, distribution(values)])),
    removedEntitiesInLossSample: missing.length, removedMemberships, lossEvents, canonicalHash: sealed, strictRoundtrip: true };
}

const report = {
  version: 1, sourceRevision: process.env.BENCHMARK_REVISION ?? 'uncommitted candidate; see retained invocation', saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH,
  node: process.version, platform: platform(), cpu: cpus()[0]?.model, smoke,
  scope: 'Authored synthetic metadata saturation. Group read/prune timings are isolated core hot paths. Complete observation measurements are single samples, not statistically compared performance claims. No AI policy changes.',
  scenarios: [measure('huge', smoke ? 2 : 48), measure('legendary', smoke ? 2 : 64)],
};
if (output) { const target = resolve(output); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify(report, null, 2));
