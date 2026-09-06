import { createArmyFormation } from './army-composition';
import { describe, expect, it } from 'vitest';
import { checksum, DOCTRINES, INSTITUTIONS, PROSPERITY_PROJECT, TECHNOLOGIES, UNITS } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import { prosperityCampaign, PROSPERITY_FIXTURE } from '../../test-fixtures/src/victory-fixture';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { applyCommand, deserializeGame, getObservation, replayGame, serializeGame, settlementYields, stateHash, validateEndTurn } from './index';
import type { GameCommand, GameState, VictoryProject, FactionProgression, Victory } from './index';
import { reconcileProjects } from './progression';
import { rebuildIndexes } from './visibility';

const player = 'faction.ashen_compact'; const rival = 'faction.reedbound_council';
const end: GameCommand = { type: 'endTurn', factionId: player };
const research: GameCommand = { type: 'research', factionId: player, technologyId: 'technology.civic_accounts' };
const institution: GameCommand = { type: 'adoptInstitution', factionId: player, institutionId: 'institution.charter_compact' };
const start: GameCommand = { type: 'startVictoryProject', factionId: player, settlementId: PROSPERITY_FIXTURE.hostId };
const issue = (state: GameState, command: GameCommand): void => { expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true }); };
function reject(state: GameState, command: unknown): void { const before = stateHash(state); expect(applyCommand(state, command).ok).toBe(false); expect(stateHash(state)).toBe(before); }
function ready(state = prosperityCampaign()): GameState { issue(state, research); issue(state, institution); return state; }
function ongoing(state = ready()): GameState { issue(state, start); return state; }

describe('separate material, civic and military progression', () => {
  it('spends knowledge exactly once and changes actual settlement yields', () => {
    const state = prosperityCampaign(); const faction = state.factions[0]!; const town = state.settlements[PROSPERITY_FIXTURE.hostId]!;
    const before = settlementYields(state, town); const knowledge = faction.knowledge;
    issue(state, research);
    expect(faction.knowledge).toBe(knowledge - TECHNOLOGIES.find(item => item.id === 'technology.civic_accounts')!.knowledgeCost);
    expect(settlementYields(state, town)).toEqual({ ...before, coin: before.coin + 1, knowledge: before.knowledge + 1 });
    issue(state, { type: 'research', factionId: player, technologyId: 'technology.cinder_masonry' });
    expect(settlementYields(state, town).industry).toBe(before.industry + 2);
    expect(state.progression[player]?.technologies).toEqual(['technology.cinder_masonry', 'technology.civic_accounts']);
    expect(state.progression[player]?.institutionId).toBeNull(); expect(state.progression[player]?.doctrineId).toBeNull();
    reject(state, research); expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it.each(INSTITUTIONS)('adopts $id exclusively, with exact coin cost and yields', definition => {
    const state = prosperityCampaign(); const town = state.settlements[PROSPERITY_FIXTURE.hostId]!; const before = settlementYields(state, town); const coin = state.factions[0]!.treasury;
    issue(state, { type: 'adoptInstitution', factionId: player, institutionId: definition.id });
    expect(state.factions[0]!.treasury).toBe(coin - definition.coinCost);
    for (const key of ['food', 'industry', 'coin', 'knowledge'] as const) expect(settlementYields(state, town)[key]).toBe(before[key] + definition.effects[key]);
    for (const candidate of INSTITUTIONS) reject(state, { type: 'adoptInstitution', factionId: player, institutionId: candidate.id });
    issue(state, research); issue(state, start); // Neither irreversible choice blocks the only implemented victory.
  });

  it('rejects malformed, unknown, unaffordable and wrong-layer choices atomically', () => {
    const state = prosperityCampaign();
    for (const input of [{ ...research, waiveCost: true }, { ...research, technologyId: 'institution.charter_compact' }, { ...institution, institutionId: 'missing' }, { type: 'adoptDoctrine', factionId: player, doctrineId: 'technology.civic_accounts' }, { ...research, factionId: 'missing' }]) reject(state, input);
    state.factions[0]!.knowledge = 0; state.factions[0]!.treasury = 0;
    reject(state, research); reject(state, institution); reject(state, { type: 'adoptDoctrine', factionId: player, doctrineId: DOCTRINES[0]!.id });
    expect(getObservation(state, player).progression.technologyChoices.every(choice => !choice.available)).toBe(true);
  });

  it('applies marching doctrine on movement refresh and recruitment without refilling spent movement', () => {
    const state = prosperityCampaign(); const army = state.armies['army.2']!; army.movement = 0;
    issue(state, { type: 'adoptDoctrine', factionId: player, doctrineId: 'doctrine.march_columns' });
    expect(army.movement).toBe(0);
    issue(state, end); expect(army.movement).toBe(UNITS.find(item => item.id === army.formations[0]?.unitId)!.movement + 1);
    issue(state, { type: 'queue', factionId: player, settlementId: PROSPERITY_FIXTURE.hostId, itemId: 'unit.guard' });
    for (let i = 0; i < 3; i++) issue(state, end);
    const recruited = Object.values(state.armies).find(item => item.factionId === player && item.formations[0]?.unitId === 'unit.guard');
    expect(recruited?.movement).toBe(4);
    reject(state, { type: 'adoptDoctrine', factionId: player, doctrineId: 'doctrine.shield_cohesion' });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('snapshots real armor doctrine effects in field combat and preserves tactical replay', () => {
    const state = borderBattleCampaign();
    for (const factionId of [player, rival]) issue(state, { type: 'adoptDoctrine', factionId, doctrineId: 'doctrine.shield_cohesion' });
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival });
    const initial = serializeGame(state);
    const commands: GameCommand[] = [{ type: 'attack', factionId: player, armyId: 'army.2', targetArmyId: 'army.4' }, { type: 'battleOrder', factionId: player, order: 'brace' }];
    for (const command of commands) issue(state, command);
    expect(state.battle?.combat.attacker[0]?.armor).toBe(7); expect(state.battle?.combat.defender[0]?.armor).toBe(7);
    expect(state.battle?.attackerDoctrineId).toBe('doctrine.shield_cohesion');
    reject(state, research);
    const resumed = deserializeGame(serializeGame(state));
    const auto: GameCommand = { type: 'autoResolveBattle', factionId: player };
    issue(state, auto); issue(resumed, auto);
    expect(stateHash(state)).toBe(stateHash(resumed)); expect(stateHash(replayGame(initial, [...commands, auto]))).toBe(stateHash(state));
  });

  it('does not retroactively apply a newly adopted doctrine to old battle reports', () => {
    const state = borderBattleCampaign();
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival });
    issue(state, { type: 'attack', factionId: player, armyId: 'army.2', targetArmyId: 'army.4' });
    issue(state, { type: 'autoResolveBattle', factionId: player });
    issue(state, { type: 'adoptDoctrine', factionId: player, doctrineId: 'doctrine.shield_cohesion' });
    expect(state.battleReports[0]?.attackerDoctrineId).toBeNull();
    expect(state.battleReports[0]?.combat.attacker[0]?.armor).toBe(5);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });
});

describe('public map-bound Prosperity project', () => {
  it('requires prepared infrastructure, technology, institution and upfront coin', () => {
    const state = prosperityCampaign(); reject(state, start); issue(state, research); reject(state, start); issue(state, institution);
    const support = Object.values(state.settlements).find(item => item.factionId === player && item.id !== PROSPERITY_FIXTURE.hostId)!;
    support.buildings = support.buildings.filter(id => id !== 'building.archive'); reject(state, start); support.buildings.push('building.archive');
    state.factions[0]!.treasury = 119; reject(state, start); state.factions[0]!.treasury = 120;
    reject(state, { ...start, settlementId: 'settlement.6' }); issue(state, start);
    expect(state.factions[0]!.treasury).toBe(0); expect(state.projects[0]).toMatchObject({ progress: 0, status: 'active' }); reject(state, start);
  });

  it('declares only its public host and progress without sharing hidden armies or research', () => {
    const state = ready(); const before = getObservation(state, rival); const explored = new Set(state.explored[rival]);
    issue(state, start); const after = getObservation(state, rival);
    expect(after.projects[0]?.cell).toBe(state.settlements[PROSPERITY_FIXTURE.hostId]?.cell);
    expect(after.armies).toEqual(before.armies); expect(after.cells).toEqual(before.cells); expect(state.explored[rival]).toEqual(explored);
    expect(after.progression.technologies).toEqual([]); expect(after.factions.some(faction => faction.id === player)).toBe(true);
    const hash = stateHash(state); after.projects[0]!.progress = 5; after.progression.technologies.push('forged');
    expect(stateHash(state)).toBe(hash);
  });

  it('requires five actual turns, survives save/replay and makes victory terminal', () => {
    const state = ready(); const initial = serializeGame(state); const commands: GameCommand[] = [start]; issue(state, start);
    for (let i = 0; i < 4; i++) { issue(state, end); commands.push(end); expect(state.victory).toBeNull(); expect(state.projects[0]?.progress).toBe(i + 1); }
    const resumed = deserializeGame(serializeGame(state)); issue(state, end); issue(resumed, end); commands.push(end);
    expect(state.victory).toMatchObject({ path: 'prosperity', factionId: player, settlementId: PROSPERITY_FIXTURE.hostId, turn: state.turn });
    expect(state.projects[0]).toMatchObject({ status: 'completed', progress: PROSPERITY_PROJECT.activeTurns });
    expect(stateHash(resumed)).toBe(stateHash(state)); expect(stateHash(replayGame(initial, commands))).toBe(stateHash(state));
    for (const input of [end, research, institution, start, { type: 'move', factionId: player, armyId: 'army.2', target: 0 }, { type: 'queue', factionId: rival, settlementId: 'settlement.6', itemId: 'unit.guard' }]) reject(state, input);
    expect(validateEndTurn(state, end).ok).toBe(false);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('pauses immediately under siege and resumes after a real lift without losing earned progress', () => {
    const state = invasionReady(); const hostId = PROSPERITY_FIXTURE.hostId;
    issue(state, start); issue(state, end); expect(state.projects[0]?.progress).toBe(1);
    issue(state, { type: 'declareWar', factionId: rival, targetFactionId: player });
    issue(state, { type: 'besiege', factionId: rival, armyId: 'army.4', settlementId: hostId });
    expect(state.projects[0]).toMatchObject({ status: 'paused', progress: 1, statusReason: 'The host settlement is under siege.' });
    for (let i = 0; i < 3; i++) issue(state, end);
    expect(state.projects[0]?.progress).toBe(1); expect(state.victory).toBeNull();
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    issue(state, { type: 'liftSiege', factionId: rival, settlementId: hostId });
    expect(state.projects[0]?.status).toBe('active'); issue(state, end); expect(state.projects[0]?.progress).toBe(2);
  });

  it('pauses when infrastructure is occupied and resumes as it recovers', () => {
    const state = ongoing(); const support = Object.values(state.settlements).find(town => town.factionId === player && town.id !== PROSPERITY_FIXTURE.hostId)!;
    support.occupationTurns = 3; reconcileProjects(state, []);
    expect(state.projects[0]?.status).toBe('paused');
    issue(state, end); issue(state, end); expect(state.projects[0]?.progress).toBe(0);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    issue(state, end); expect(state.projects[0]).toMatchObject({ status: 'active', progress: 1 });
  });

  it.each(['occupy', 'raze'] as const)('cancels the host project through actual assault and %s consequences', outcome => {
    const state = invasionReady(); issue(state, start);
    const commands: GameCommand[] = [{ type: 'declareWar', factionId: rival, targetFactionId: player }, { type: 'besiege', factionId: rival, armyId: 'army.4', settlementId: PROSPERITY_FIXTURE.hostId }, end, end, end, { type: 'assault', factionId: rival, settlementId: PROSPERITY_FIXTURE.hostId }, { type: 'autoResolveBattle', factionId: player }];
    const initial = serializeGame(state);
    for (const command of commands) issue(state, command);
    expect(state.pendingCapture?.factionId).toBe(rival);
    const decision: GameCommand = { type: 'resolveCapture', factionId: rival, settlementId: PROSPERITY_FIXTURE.hostId, outcome };
    const coin = state.factions[0]!.treasury; issue(state, decision); commands.push(decision);
    expect(state.projects[0]?.status).toBe('cancelled'); expect(state.factions[0]!.treasury).toBe(coin); expect(state.victory).toBeNull();
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state)); expect(stateHash(replayGame(initial, commands))).toBe(stateHash(state));
  });
});

/** Authored local threat only; siege, battle and conquest use the real command boundary. */
function invasionReady(): GameState {
  const state = ready(); const host = state.settlements[PROSPERITY_FIXTURE.hostId]!; host.population = 1;
  const army = state.armies['army.4']!; const guard = UNITS.find(unit => unit.id === 'unit.guard')!;
  const cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && !Object.values(state.armies).some(army => army.cell === cell) && !Object.values(state.settlements).some(town => town.cell === cell));
  if (cell === undefined) throw new Error('Fixture has no invasion position');
  for (const own of Object.values(state.armies)) if (own.cell === host.cell) delete state.armies[own.id];
  Object.assign(army, { formations: [createArmyFormation(army.id, guard.id)], name: guard.name, cell, movement: guard.movement });
  rebuildIndexes(state); return deserializeGame(serializeGame(state));
}

describe('strict progression save invariants', () => {
  interface Save { state: { progression: (FactionProgression & { factionId: string })[]; projects: VictoryProject[]; victory: Victory | null }; stateChecksum: string }
  it.each([
    ['unknown technology', (save: Save) => { save.state.progression[0]!.technologies.push('technology.missing'); }],
    ['duplicate technology', (save: Save) => { save.state.progression[0]!.technologies.push('technology.civic_accounts'); }],
    ['unknown doctrine', (save: Save) => { save.state.progression[0]!.doctrineId = 'doctrine.missing'; }],
    ['missing faction progression', (save: Save) => { save.state.progression.pop(); }],
    ['fabricated progress', (save: Save) => { save.state.projects[0]!.progress = 5; }],
    ['wrong project host', (save: Save) => { save.state.projects[0]!.settlementId = 'settlement.6'; }],
    ['wrong pause reason', (save: Save) => { save.state.projects[0]!.status = 'paused'; save.state.projects[0]!.statusReason = 'Invented'; }],
    ['fabricated victory', (save: Save) => { const project = save.state.projects[0]!; save.state.victory = { path: 'prosperity', factionId: player, projectId: project.id, settlementId: project.settlementId, turn: project.startedTurn }; }],
  ] as const)('rejects %s even with a recomputed snapshot checksum', (_name, mutate) => {
    const save: Save = JSON.parse(serializeGame(ongoing())); mutate(save); save.stateChecksum = checksum(JSON.stringify(save.state));
    expect(() => deserializeGame(JSON.stringify(save))).toThrow();
  });
});
