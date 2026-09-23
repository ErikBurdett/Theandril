import { describe, expect, it } from 'vitest';
import { applyCommandForVersion, battleReportForVersion, createGame, deserializeGame, serializeGame, stateHash } from './index';
import type { Army, CampaignBattle, DomainEvent, FactionState, Settlement, Siege, CaptureDecision, Ruin, DiplomacyState, FactionProgression, VictoryProject, Victory, CampaignPace, MovementRoute, GameState } from './index';
import { createResources } from './resources';
import { deriveBiomes } from '@theandril/mapgen';
import { checksum } from '@theandril/content';
import { legacyCampaignBattleSchema, PRE_COMBAT_CONTENT_HASH, PRE_PROGRESSION_CONTENT_HASH } from './save';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';

const applyLegacy = (state: GameState, command: unknown) => applyCommandForVersion(state, command, 5);

interface SaveFixture {
  version: number; gameVersion: string; contentHash: string; stateChecksum: string;
  state: {
    resources: GameState['resources']; development: GameState['development'];
    rosterVersion: GameState['rosterVersion'];
    pace: CampaignPace;
    turn: number; nextId: number; nextEntityId?: number; turnOwnerId: string;
    world: { width: number; height: number; seed: number; terrain: number[]; fertility: number[]; starts: number[]; biome: number[]; waterDepth: number[]; generatorVersion: 1 | 2 | 3 | 4; layout: string; hydrology: number[] };
    roads: GameState['roads'];
    land: GameState['land'];
    armies: Army[]; settlements: Settlement[]; factions: FactionState[];
    explored: { factionId: string; cells: number[] }[]; events: DomainEvent[];
    wars: [string, string][]; battle: CampaignBattle | null; battleReports: CampaignBattle[];
    sieges: Siege[]; pendingCapture: CaptureDecision | null; ruins: Ruin[]; diplomacy: DiplomacyState;
    progression: (FactionProgression & { factionId: string })[]; projects: VictoryProject[]; victory: Victory | null;
    routes: MovementRoute[];
    characters: GameState['characters'][string][];
    transports: { armyId: string; fleetId: string }[];
    arcaneResearch: { factionId: string; discoveries: string[] }[];
    arcaneSurveys: { factionId: string; cells: number[] }[];
    charters: { settlementId: string; factionId: string; focus: string; ceiling: number }[];
    postings: { armyId: string; factionId: string; cell: number; mode: string }[];
    musters: { settlementId: string; factionId: string; cell: number }[];
  };
}

function previousState(save: SaveFixture) {
  const { wars: _wars, battle: _battle, battleReports: _reports, ...state } = previousV2State(save);
  return { ...state, armies: state.armies.map(army => {
    const { morale: _morale, fatigue: _fatigue, ...previous } = army;
    return previous;
  }) };
}

function previousV2State(save: SaveFixture) {
  const { sieges: _sieges, pendingCapture: _capture, ruins: _ruins, diplomacy: _diplomacy, ...state } = previousV3State(save);
  const previousBattle = (battle: ReturnType<typeof previousV3State>['battleReports'][number]) => {
    const { settlementId: _settlementId, militiaId: _militiaId, fortification: _fortification, ...previous } = battle;
    return previous;
  };
  return {
    ...state,
    settlements: state.settlements.map(town => {
      const { founderFactionId: _founder, devastation: _devastation, occupationTurns: _occupation, ...previous } = town;
      return previous;
    }),
    battle: state.battle ? previousBattle(state.battle) : null, battleReports: state.battleReports.map(previousBattle),
  };
}

function previousV3State(save: SaveFixture) {
  if (save.state.arcaneResearch.some(item => item.discoveries.length)) throw new Error('Synthetic historical projection cannot discard arcane discoveries.');
  // Arcane surveys exist only from rules 23; a v3 projection records none.
  if (save.state.arcaneSurveys.some(item => item.cells.length)) throw new Error('Synthetic historical projection cannot discard arcane surveys.');
  // Charters exist only from rules 25; a v3 projection holds none.
  if (save.state.charters.length) throw new Error('Synthetic historical projection cannot discard standing charters.');
  // Postings and muster points exist only from rules 26; a v3 projection holds none.
  if (save.state.postings.length || save.state.musters.length) throw new Error('Synthetic historical projection cannot discard standing postings.');
  const { progression: _progression, projects: _projects, victory: _victory, pace: _pace, routes: _routes, characters: _characters, transports: _transports, land: _land, rosterVersion: _rosterVersion, roads: _roads, arcaneResearch: _arcaneResearch, resources: _resources, development: _development, ...state } = save.state;
  const { biome: _biome, generatorVersion: _generatorVersion, waterDepth: _waterDepth, layout: _layout, hydrology: _hydrology, ...world } = state.world;
  const previousBattle = (battle: CampaignBattle) => {
    const { attackerDoctrineId: _attackerDoctrine, defenderDoctrineId: _defenderDoctrine, ...previous } = legacyCampaignBattleSchema.parse(battleReportForVersion(battle, 5));
    return previous;
  };
  // Patronage exists only from rules 22; a v3 projection carries wars, offers and treaties alone.
  const { clients: _clients, clientOffers: _clientOffers, ...diplomacy } = state.diplomacy;
  const { arcaneSurveys: _surveys, charters: _charters, postings: _postings, musters: _musters, ...beforeSeams } = state;
  return { ...beforeSeams, diplomacy, world, armies: state.armies.map(({ formations, ...army }) => { const item = formations[0]!; return { id: army.id, factionId: army.factionId, name: army.name, unitId: item.unitId, cell: army.cell, movement: army.movement, strength: item.strength, morale: item.morale, fatigue: item.fatigue }; }), battle: state.battle ? previousBattle(state.battle) : null, battleReports: state.battleReports.map(previousBattle) };
}

function legacyGeography(state: GameState): void {
  state.rosterVersion = 1;
  state.resources = createResources(state.world, state.factions.map(item => item.id), 0);
  state.land.visibilityVersion = 0;
  state.world.generatorVersion = 1;
  state.world.biome = deriveBiomes(state.world.seed, state.world.width, state.world.height, state.world.terrain, 1);
}

function fixture(): SaveFixture {
  const state = createGame({ rulesVersion: 5, seed: 42, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 1, rosterVersion: 1 });
  const army = Object.values(state.armies).find(item => item.formations[0]?.unitId === 'unit.colonist');
  if (!army) throw new Error('Missing colonist');
  applyLegacy(state, { type: 'found', factionId: army.factionId, armyId: army.id, name: 'Cinderwatch' });
  // This test fixture comes from our own serializer; imports themselves parse unknown.
  return JSON.parse(serializeGame(state));
}

describe('save validation and migration', () => {
  it('has a canonical exact round trip', () => {
    const state = createGame({ seed: 0xffff_ffff, size: 'tiny', factionCount: 4 });
    const saved = serializeGame(state);
    expect(serializeGame(deserializeGame(saved))).toBe(saved);
    expect(stateHash(createGame({ seed: 0xffff_ffff, size: 'tiny', factionCount: 4 }))).toBe(stateHash(state));
  });

  it('migrates explicit v0 nextEntityId snapshots without changing campaign state', () => {
    const current = fixture();
    const expected = stateHash(deserializeGame(JSON.stringify(current)));
    const { nextId, ...rest } = previousState(current);
    const legacy = { contentHash: PRE_COMBAT_CONTENT_HASH, version: 0, gameVersion: '0.0.0', state: { ...rest, nextEntityId: nextId } };
    expect(stateHash(deserializeGame(JSON.stringify(legacy)))).toBe(expected);
    expect(() => deserializeGame(JSON.stringify({ ...legacy, unexpected: true }))).toThrow();
  });

  it('verifies v1 checksums and the known content pack before adding warfare defaults', () => {
    const current = fixture();
    const state = previousState(current);
    const legacy = { version: 1, gameVersion: '0.1.0', contentHash: PRE_COMBAT_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state };
    const migrated = deserializeGame(JSON.stringify(legacy));
    expect(stateHash(migrated)).toBe(stateHash(deserializeGame(JSON.stringify(current))));
    expect(migrated.wars).toEqual([]);
    expect(migrated.battle).toBeNull();
    expect(migrated.battleReports).toEqual([]);
    expect(() => deserializeGame(JSON.stringify({ ...legacy, contentHash: 'unknown' }))).toThrow(/v1 content hash/);
    const damaged = { ...legacy, state: { ...state, turn: state.turn + 1 } };
    expect(() => deserializeGame(JSON.stringify(damaged))).toThrow(/v1 snapshot checksum/);
    const modernField = { ...state, arcaneResearch: current.state.arcaneResearch };
    expect(() => deserializeGame(JSON.stringify({ ...legacy, state: modernField, stateChecksum: checksum(JSON.stringify(modernField)) }))).toThrow(/arcaneResearch/);
    current.state.arcaneResearch[0]!.discoveries.push('arcane.ember_projection');
    expect(() => previousState(current)).toThrow(/cannot discard/);
  });

  it('migrates checked v2 state into settlement provenance and diplomacy defaults', () => {
    const current = fixture();
    const state = previousV2State(current);
    const prior = { version: 2, gameVersion: '0.1.0', contentHash: PRE_PROGRESSION_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state };
    const migrated = deserializeGame(JSON.stringify(prior));
    expect(stateHash(migrated)).toBe(stateHash(deserializeGame(JSON.stringify(current))));
    expect(Object.values(migrated.settlements).every(town => town.founderFactionId === town.factionId && town.devastation === 0 && town.occupationTurns === 0)).toBe(true);
    expect(migrated.sieges).toEqual({}); expect(migrated.ruins).toEqual({}); expect(migrated.pendingCapture).toBeNull();
    expect(() => deserializeGame(JSON.stringify({ ...prior, stateChecksum: '00000000' }))).toThrow(/v2 snapshot checksum/);
    expect(() => deserializeGame(JSON.stringify({ ...prior, contentHash: 'unexpected' }))).toThrow(/v2 content hash/);
  });

  it('continues a synthetic v2 field-battle shape with an initialized war memory', () => {
    const campaign = borderBattleCampaign();
    campaign.pace = 'short';
    legacyGeography(campaign);
    const factionId = campaign.turnOwnerId;
    expect(applyLegacy(campaign, { type: 'declareWar', factionId, targetFactionId: 'faction.reedbound_council' }).ok).toBe(true);
    expect(applyLegacy(campaign, { type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.4' }).ok).toBe(true);
    expect(applyLegacy(campaign, { type: 'battleOrder', factionId, order: 'advance' }).ok).toBe(true);
    const current: SaveFixture = JSON.parse(serializeGame(campaign));
    const state = previousV2State(current);
    const prior = { version: 2, gameVersion: '0.1.0', contentHash: PRE_PROGRESSION_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state };
    const migrated = deserializeGame(JSON.stringify(prior));
    expect(migrated.battle?.combat).toEqual(campaign.battle?.combat);
    expect(migrated.battle).toMatchObject({ settlementId: null, militiaId: null, fortification: 0 });
    expect(migrated.diplomacy.relations[0]).toMatchObject({ warStartedTurn: campaign.turn, trust: 0, respect: 0, grievances: 0 });
    const resumed = deserializeGame(serializeGame(migrated));
    for (const game of [migrated, resumed]) expect(applyLegacy(game, { type: 'autoResolveBattle', factionId }).ok).toBe(true);
    expect(stateHash(migrated)).toBe(stateHash(resumed));
    expect(() => deserializeGame(JSON.stringify({ ...prior, state: { ...state, sieges: [] } }))).toThrow();
  });

  it('migrates the recognized v3 content pack and verifies its checksum before defaults', () => {
    const current = fixture(); const state = previousV3State(current);
    const prior = { version: 3, gameVersion: '0.1.0', contentHash: PRE_PROGRESSION_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state };
    const migrated = deserializeGame(JSON.stringify(prior));
    expect(stateHash(migrated)).toBe(stateHash(deserializeGame(JSON.stringify(current))));
    expect(migrated.victory).toBeNull(); expect(migrated.projects).toEqual([]);
    expect(Object.values(migrated.progression).every(item => item.technologies.length === 0 && item.institutionId === null && item.doctrineId === null)).toBe(true);
    expect(() => deserializeGame(JSON.stringify({ ...prior, stateChecksum: '00000000' }))).toThrow(/v3 snapshot checksum/);
    expect(() => deserializeGame(JSON.stringify({ ...prior, contentHash: current.contentHash }))).toThrow(/v3 content hash/);
    expect(() => deserializeGame(JSON.stringify({ ...prior, state: { ...state, projects: [] } }))).toThrow();
  });

  it('preserves a synthetic v3 siege-battle shape and its pending conquest decision', () => {
    const campaign = conquestCampaign(); const factionId = campaign.turnOwnerId;
    campaign.pace = 'short';
    legacyGeography(campaign);
    for (const command of [
      { type: 'declareWar', factionId, targetFactionId: CONQUEST_FIXTURE.enemyFactionId },
      { type: 'besiege', factionId, armyId: CONQUEST_FIXTURE.playerArmyId, settlementId: CONQUEST_FIXTURE.settlementId },
      ...Array.from({ length: 3 }, () => ({ type: 'endTurn', factionId })),
      { type: 'assault', factionId, settlementId: CONQUEST_FIXTURE.settlementId },
    ]) expect(applyLegacy(campaign, command).ok).toBe(true);
    const migrateCurrent = () => {
      const current: SaveFixture = JSON.parse(serializeGame(campaign)); const state = previousV3State(current);
      const previous = { version: 3, gameVersion: '0.1.0', contentHash: PRE_PROGRESSION_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state };
      const migrated = deserializeGame(JSON.stringify(previous));
      expect(stateHash(migrated)).toBe(stateHash(campaign));
      return migrated;
    };
    const resumed = migrateCurrent(); expect(resumed.battle?.militiaId).not.toBeNull();
    for (const state of [campaign, resumed]) expect(applyLegacy(state, { type: 'autoResolveBattle', factionId }).ok).toBe(true);
    expect(stateHash(resumed)).toBe(stateHash(campaign)); expect(campaign.pendingCapture).not.toBeNull();
    expect(migrateCurrent().pendingCapture).toEqual(campaign.pendingCapture);
  });

  const cases: [string, (save: SaveFixture) => void][] = [
    ['unknown version', save => { save.version = 27; }],
    ['mismatched content', save => { save.contentHash = 'other-pack'; }],
    ['wrong map dimensions', save => { save.state.world.width++; }],
    ['invalid terrain', save => { save.state.world.terrain[0] = 99; }],
    ['negative treasury', save => { if (save.state.factions[0]) save.state.factions[0].treasury = -1; }],
    ['unknown turn owner', save => { save.state.turnOwnerId = 'faction.missing'; }],
    ['unknown unit', save => { if (save.state.armies[0]) save.state.armies[0].formations[0]!.unitId = 'unit.missing'; }],
    ['unknown army owner', save => { if (save.state.armies[0]) save.state.armies[0].factionId = 'faction.missing'; }],
    ['duplicate army ID', save => { if (save.state.armies[0]) save.state.armies.push({ ...save.state.armies[0] }); }],
    ['excess movement', save => { if (save.state.armies[0]) save.state.armies[0].movement = 999; }],
    ['out of bounds army', save => { if (save.state.armies[0]) save.state.armies[0].cell = 200_000; }],
    ['counter collision', save => { save.state.nextId = 1; }],
    ['out of bounds exploration', save => { save.state.explored[0]?.cells.push(200_000); }],
    ['missing current vision', save => { if (save.state.explored[0]) save.state.explored[0].cells = []; }],
    ['duplicated visibility owner', save => { if (save.state.explored[0]) save.state.explored.push(save.state.explored[0]); }],
    ['unknown building', save => { save.state.settlements[0]?.buildings.push('building.missing'); }],
    ['duplicate building', save => { save.state.settlements[0]?.buildings.push('building.granary', 'building.granary'); }],
    ['invalid queue progress', save => { save.state.settlements[0]?.queue.push({ itemId: 'unit.guard', progress: 999 }); }],
    ['invalid queued item', save => { save.state.settlements[0]?.queue.push({ itemId: 'unit.missing', progress: 0 }); }],
    ['non-head queue progress', save => { save.state.settlements[0]?.queue.push({ itemId: 'unit.guard', progress: 2 }, { itemId: 'unit.scout', progress: 1 }); }],
    ['future event', save => { if (save.state.events[0]) save.state.events[0].turn = 100; }],
  ];
  it.each(cases)('rejects %s', (_name, mutate) => {
    const save = fixture();
    mutate(save);
    save.stateChecksum = checksum(JSON.stringify(save.state));
    expect(() => deserializeGame(JSON.stringify(save))).toThrow();
  });

  it('rejects syntactically valid numeric corruption through the snapshot checksum', () => {
    const save = fixture();
    if (save.state.factions[0]) save.state.factions[0].treasury++;
    expect(() => deserializeGame(JSON.stringify(save))).toThrow(/snapshot checksum/);
  });

  it('rejects malformed JSON and unknown state fields, preserving the caller state', () => {
    const state = createGame({ seed: 1, size: 'tiny', factionCount: 1 });
    const hash = stateHash(state);
    expect(() => deserializeGame('{not-json')).toThrow(/Cannot read save/);
    const save = fixture();
    expect(() => deserializeGame(JSON.stringify({ ...save, state: { ...save.state, cheats: true } }))).toThrow();
    expect(stateHash(state)).toBe(hash);
  });
});
