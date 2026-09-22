import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { applyCommand, createGame, deserializeGame, getObservation, getSettlementLandObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { isPassable, hexDistance } from '@theandril/mapgen';
import { withRules, type RulesVersion } from '../../../../packages/sim/src/rules';
import { grainResourceCampaign, politicalOverviewCampaign } from '../../../../packages/test-fixtures/src/resource-fixture';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../../../../packages/test-fixtures/src/authored-land';
import { roadsCampaign } from '../../../../packages/test-fixtures/src/roads-fixture';
import { navalCampaign, NAVAL_FIXTURE } from '../../../../packages/test-fixtures/src/naval-fixture';

const snapshots: { name: string; save: string; hash: string; variants: { factionId: string; version: RulesVersion; options: unknown; observation: string; direct: { settlementId: string; value: string }[] }[] }[] = [];
const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); };
const capture = (name: string, source: GameState, versions: RulesVersion[] = [17]) => {
  const save = serializeGame(source), state = deserializeGame(save), hash = stateHash(state);
  const variants = [];
  for (const faction of state.factions) for (const version of versions) {
    const ids = Object.values(state.settlements).filter(town => town.factionId === faction.id).map(town => town.id).sort();
    for (const options of [{}, { landDetails: 'none' as const }, { landDetails: [] }, { landDetails: [ids[0] ?? 'settlement.999999', 'settlement.999999'] },
      { landDetails: { offset: 7, limit: 8 } }, { landDetails: { offset: Number.MAX_SAFE_INTEGER, limit: 1 } }, { developmentCandidates: false }]) {
      const observation = withRules(state, version, () => JSON.stringify(getObservation(state, faction.id, options)));
      const direct = ids.slice(0, 1).map(settlementId => ({ settlementId, value: withRules(state, version, () => JSON.stringify(getSettlementLandObservation(state, faction.id, settlementId, { offset: 0, limit: 3 }))) }));
      variants.push({ factionId: faction.id, version, options, observation, direct });
    }
  }
  if (stateHash(state) !== hash) throw new Error('Baseline observation mutated canonical state.');
  snapshots.push({ name, save, hash, variants });
};

const resource = grainResourceCampaign();
capture('generated-grain-market', resource.state);
issue(resource.state, { type: 'improveTile', factionId: resource.state.turnOwnerId, settlementId: resource.townId, cell: resource.deposit, improvementId: 'improvement.grange' });
capture('paid-grange-in-progress', resource.state);
for (let turn = 0; turn < resource.quote.turns; turn++) issue(resource.state, { type: 'endTurn', factionId: resource.state.turnOwnerId });
capture('paid-grange-completed', resource.state);
const politics = politicalOverviewCampaign();
capture('visible-foreign-hearth', politics);
const home = Object.values(politics.settlements).find(town => town.factionId === politics.turnOwnerId)!;
for (const army of Object.values(politics.armies)) if (army.factionId === politics.turnOwnerId) army.cell = home.cell;
refreshAuthoredSight(politics);
capture('remembered-foreign-hearth', politics);
const road = roadsCampaign(); road.factions[0]!.treasury = 1000;
const project = Object.values(road.roads.projects)[0]!;
issue(road, { type: 'accelerateRoad', factionId: road.turnOwnerId, settlementId: project.settlementId });
capture('paid-road-segment', road);
const naval = navalCampaign({ enemyFleet: false });
issue(naval, { type: 'embarkArmy', factionId: naval.turnOwnerId, armyId: NAVAL_FIXTURE.cargoId, fleetId: NAVAL_FIXTURE.fleetId });
capture('embarked-passengers', naval);

// Synthetic ownership/population and knowledge for observation volume only;
// generated geography remains intact and each stored snapshot strictly imports.
const dense = createGame({ seed: 74, size: 'tiny', factionCount: 1, pace: 'epic' }), centers: number[] = [];
for (let cell = 0; cell < dense.world.terrain.length && centers.length < 17; cell++) {
  if (!isPassable(dense.world.terrain[cell]!) || centers.some(other => hexDistance(cell, other, dense.world.width) < 5)) continue;
  centers.push(cell); const id = `settlement.${dense.nextId++}`;
  dense.settlements[id] = { id, factionId: dense.turnOwnerId, founderFactionId: dense.turnOwnerId, name: `Observation Hearth ${centers.length}`,
    cell, population: 3, food: centers.length % 2 ? 40 : 8, buildings: ['building.granary'], queue: [], devastation: 0, occupationTurns: 0 };
}
if (centers.length !== 17) throw new Error('Insufficient generated land for observation fixture.');
dense.factions[0]!.treasury = 10000; dense.factions[0]!.knowledge = 1000;
rebaseAuthoredLand(dense);
capture('seventeen-authored-towns', dense, [10, 15, 17]);
const payload = JSON.stringify({ snapshots });
const folder = 'docs/development/2026-09-21-campaign-continuation/observations/';
const sourceHashes = Object.fromEntries(await Promise.all(['simulation', 'territory'].map(async name => [name, createHash('sha256').update(await readFile(`${folder}${name}-before.ts.txt`)).digest('hex')])));
await writeFile(`${folder}baseline.json`, JSON.stringify({ captured: '2026-09-21', sourceHashes, note: 'Pre-change complete observation JSON strings and strictly imported save inputs. Authored fixtures are observation workloads, not campaign-scale timing or earned-economy proof.',
  uncompressedBytes: Buffer.byteLength(payload), payloadSha256: createHash('sha256').update(payload).digest('hex'), payload: gzipSync(payload).toString('base64') }) + '\n');
console.log(JSON.stringify({ snapshots: snapshots.length, observations: snapshots.reduce((sum, snapshot) => sum + snapshot.variants.length, 0), uncompressedBytes: Buffer.byteLength(payload), sourceHashes }));
