import { describe, expect, it } from 'vitest';
import { CHARACTER_DEFINITIONS, checksum, UNITS } from '@theandril/content';
import { isPassable, neighbors, SeededRandom } from '@theandril/mapgen';
import { characterBattleCampaign, characterCampaign } from '../../test-fixtures/src/character-fixture';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { conquestCampaign } from '../../test-fixtures/src/conquest-fixture';
import { applyCommand, applyCommandForVersion, createArmyFormation, deserializeGame, getMovementQuery, getObservation, serializeGame, serializeGameForVersion, stateHash } from './index';
import type { Character, GameCommand, GameState } from './index';
import { cellsWithin, rebuildIndexes } from './visibility';
import { characterCell, rebuildCharacterIndexes } from './characters';
import { relocateArmy } from './warfare';

const player = 'faction.ashen_compact';
const rival = 'faction.reedbound_council';
const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result, `${command.type}: ${result.error ?? ''}`).toMatchObject({ ok: true }); return result; };
const end = (state: GameState) => issue(state, { type: 'endTurn', factionId: player });
const reject = (state: GameState, command: unknown) => { const before = stateHash(state); expect(applyCommand(state, command).ok).toBe(false); expect(stateHash(state)).toBe(before); };
const restore = (state: GameState) => { const reloaded = deserializeGame(serializeGame(state)); expect(stateHash(reloaded)).toBe(stateHash(state)); return reloaded; };
function appoint(state: GameState, definitionId: string, factionId = player, settlementId = 'settlement.5'): Character {
  const id = `character.${state.nextId}`;
  issue(state, { type: 'recruitCharacter', factionId, settlementId, definitionId });
  return state.characters[id]!;
}
function attach(state: GameState, definitionId: string, armyId = 'army.2'): Character {
  const army = state.armies[armyId]!; const original = army.cell;
  const home = Object.values(state.settlements).find(town => town.factionId === army.factionId)!;
  state.factions.find(faction => faction.id === army.factionId)!.treasury = 10_000;
  // Authored co-location only; appointment and attachment still cross their real command boundary.
  relocateArmy(state, army, home.cell);
  const character = appoint(state, definitionId, army.factionId, home.id);
  issue(state, { type: 'assignCharacter', factionId: army.factionId, characterId: character.id, armyId });
  relocateArmy(state, army, original);
  return character;
}
const mission = (state: GameState, character: Character, missionId: string, settlementId?: string) => issue(state, { type: 'startCharacterMission', factionId: character.factionId, characterId: character.id, missionId, ...(settlementId ? { settlementId } : {}) });

describe('named campaign characters', () => {
  it('appoints named paid characters, charges real upkeep, rejects unsafe/foreign/malformed appointments atomically', () => {
    const state = characterCampaign(); const before = state.factions[0]!.treasury;
    const marshal = appoint(state, 'character.marshal');
    expect(marshal.name).toMatch(/^[A-Za-z]+ [A-Za-z]+(?: \d+)?$/);
    expect(state.factions[0]!.treasury).toBe(before - 32);
    reject(state, { type: 'recruitCharacter', factionId: player, settlementId: 'settlement.6', definitionId: 'character.marshal' });
    reject(state, { type: 'recruitCharacter', factionId: player, settlementId: 'settlement.5', definitionId: 'character.marshal', name: 'Injected' });
    state.settlements['settlement.5']!.occupationTurns = 1;
    reject(state, { type: 'recruitCharacter', factionId: player, settlementId: 'settlement.5', definitionId: 'character.engineer' });
    state.settlements['settlement.5']!.occupationTurns = 0;
    const without = restore(state); delete without.characters[marshal.id]; rebuildCharacterIndexes(without);
    end(state); end(without);
    expect(without.factions[0]!.treasury - state.factions[0]!.treasury).toBe(2);
    restore(state);
  });

  it('requires co-location and enforces one marshal/two companions without teleporting', () => {
    const state = characterCampaign(); const army = state.armies['army.2']!;
    const marshal = appoint(state, 'character.marshal');
    const reserve = Object.values(state.armies).find(item => item.id !== army.id)!;
    const away = neighbors(army.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!))!;
    relocateArmy(state, reserve, away);
    reject(state, { type: 'assignCharacter', factionId: player, characterId: marshal.id, armyId: reserve.id });
    issue(state, { type: 'assignCharacter', factionId: player, characterId: marshal.id, armyId: army.id });
    const second = appoint(state, 'character.marshal');
    reject(state, { type: 'assignCharacter', factionId: player, characterId: second.id, armyId: army.id });
    attach(state, 'character.surveyor'); attach(state, 'character.engineer');
    const third = appoint(state, 'character.engineer');
    reject(state, { type: 'assignCharacter', factionId: player, characterId: third.id, armyId: army.id });
    expect(getObservation(state, player).armies.find(item => item.id === army.id)?.agents).toHaveLength(2);
    issue(state, { type: 'unassignCharacter', factionId: player, characterId: marshal.id, settlementId: 'settlement.5' });
    expect(characterCell(state, marshal)).toBe(army.cell);
    restore(state);
  });

  it('keeps attachments with a split source and moves them on a full merge, rejecting commander slot conflicts', () => {
    const state = characterCampaign(); const marshal = attach(state, 'character.marshal');
    const source = state.armies['army.2']!; const reserve = Object.values(state.armies).find(item => item.id !== source.id)!;
    issue(state, { type: 'splitArmy', factionId: player, armyId: source.id, formationIds: [source.formations[1]!.id] });
    expect(marshal.location).toEqual({ kind: 'army', armyId: source.id });
    const other = attach(state, 'character.marshal', reserve.id);
    reject(state, { type: 'mergeArmies', factionId: player, sourceArmyId: source.id, targetArmyId: reserve.id });
    issue(state, { type: 'unassignCharacter', factionId: player, characterId: other.id, settlementId: 'settlement.5' });
    issue(state, { type: 'mergeArmies', factionId: player, sourceArmyId: source.id, targetArmyId: reserve.id });
    expect(marshal.location).toEqual({ kind: 'army', armyId: reserve.id });
    expect(state.armies[source.id]).toBeUndefined(); restore(state);
  });

  it('relocates attached characters to a settlement when their last caravan founds it', () => {
    const state = characterCampaign(); const engineer = attach(state, 'character.engineer'); const army = state.armies['army.2']!;
    army.formations = [createArmyFormation(army.id, 'unit.colonist')]; army.movement = 3;
    const target = cellsWithin(state, army.cell, 8).find(cell => isPassable(state.world.terrain[cell]!) && !cellsWithin(state, cell, 2).some(near => Object.values(state.settlements).some(town => town.cell === near)))!;
    relocateArmy(state, army, target); rebuildIndexes(state);
    issue(state, { type: 'found', factionId: player, armyId: army.id, name: 'New witness hearth' });
    expect(engineer.location?.kind).toBe('settlement'); expect(engineer.dead).toBe(false); restore(state);
  });

  it('surveys only terrain knowledge, locks actions for one waiting turn, and restores the normal completion-turn budget', () => {
    const state = characterCampaign(); const character = attach(state, 'character.surveyor'); const army = state.armies['army.2']!;
    const before = getObservation(state, player); const known = new Set(before.cells.map(cell => cell.cell));
    const unseen = cellsWithin(state, army.cell, 6).find(cell => !known.has(cell) && isPassable(state.world.terrain[cell]!) && !Object.values(state.settlements).some(town => town.cell === cell))!;
    const id = `army.${state.nextId++}`; state.armies[id] = { id, factionId: rival, name: 'Unseen escort', cell: unseen, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] }; rebuildIndexes(state);
    mission(state, character, 'mission.survey');
    const view = getObservation(state, player); expect(view.armies[0]?.movementBlocker).toMatch(/mission/);
    expect(getMovementQuery(view, army.id, army.cell + 1).preview?.blocker).toMatch(/mission/);
    reject(state, { type: 'splitArmy', factionId: player, armyId: army.id, formationIds: [army.formations[0]!.id] });
    end(state); expect(character.mission?.remainingTurns).toBe(1); expect(army.movement).toBe(0);
    const mirror = restore(state); end(state); end(mirror);
    expect(stateHash(mirror)).toBe(stateHash(state)); expect(character.mission).toBeNull(); expect(army.movement).toBe(3);
    const surveyed = getObservation(state, player); expect(surveyed.cells.find(cell => cell.cell === unseen)).toMatchObject({ visible: false });
    expect(surveyed.armies.some(army => army.id === id)).toBe(false); expect(character.experience).toBe(4);
    reject(state, { type: 'startCharacterMission', factionId: player, characterId: character.id, missionId: 'mission.survey' });
  });

  it('refits actual per-formation casualties, caps healing and refuses a full-strength no-op', () => {
    const state = characterCampaign(); const engineer = attach(state, 'character.engineer'); const army = state.armies['army.2']!;
    const strengths = army.formations.map(item => item.strength);
    mission(state, engineer, 'mission.refit'); end(state); expect(army.formations.map(item => item.strength)).toEqual(strengths); end(state);
    expect(army.formations.map(item => item.strength)).toEqual(strengths.map(value => value + 5)); expect(engineer.experience).toBe(4);
    for (const item of army.formations) item.strength = UNITS.find(unit => unit.id === item.unitId)!.strength;
    reject(state, { type: 'startCharacterMission', factionId: player, characterId: engineer.id, missionId: 'mission.refit' }); restore(state);
  });

  it('pauses saved travel, cancellation does not refund coin or refill spent movement', () => {
    const state = characterCampaign(); const surveyor = attach(state, 'character.surveyor'); const army = state.armies['army.2']!;
    const query = getMovementQuery(getObservation(state, player), army.id); const destination = query.reachable.find(item => item.cell !== army.cell)!.cell;
    army.movement = 0; issue(state, { type: 'queueMovement', factionId: player, armyId: army.id, target: destination });
    const before = state.factions[0]!.treasury; mission(state, surveyor, 'mission.survey');
    expect(state.routes[army.id]?.status).toBe('paused');
    issue(state, { type: 'cancelCharacterMission', factionId: player, characterId: surveyor.id });
    expect(state.factions[0]!.treasury).toBe(before - 4); expect(army.movement).toBe(0); restore(state);
  });

  it('makes two-turn sabotage open defenses one turn early, with deterministic risk and specialization', () => {
    for (const specialized of [false, true]) {
      const state = conquestCampaign(); const engineer = attach(state, 'character.engineer');
      if (specialized) { engineer.experience = 12; issue(state, { type: 'promoteCharacter', factionId: player, characterId: engineer.id, skillId: 'skill.siegecraft' }); }
      issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival });
      issue(state, { type: 'besiege', factionId: player, armyId: 'army.2', settlementId: 'settlement.6' });
      const serial = state.nextId; const roll = new SeededRandom((state.world.seed ^ serial) >>> 0).nextInt(100);
      mission(state, engineer, 'mission.sabotage', 'settlement.6');
      const mirror = restore(state); end(state); end(mirror); end(state); end(mirror);
      expect(stateHash(mirror)).toBe(stateHash(state)); expect(state.armies['army.2']!.movement).toBe(3);
      const failed = roll < (specialized ? 10 : 25);
      expect(state.sieges['settlement.6']!.defenses).toBe(failed ? 10 : 0);
      expect(engineer.woundedTurns).toBe(failed ? 3 : 0); expect(engineer.experience).toBe(failed ? 0 : 6);
      issue(state, { type: 'assault', factionId: player, settlementId: 'settlement.6' });
      expect(state.battle?.fortification).toBe(failed ? 1 : 0); restore(state);
    }
  });

  it('interrupts sabotage immediately when the supporting siege is lifted', () => {
    const state = conquestCampaign(); const engineer = attach(state, 'character.engineer');
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'besiege', factionId: player, armyId: 'army.2', settlementId: 'settlement.6' });
    mission(state, engineer, 'mission.sabotage', 'settlement.6'); const result = issue(state, { type: 'liftSiege', factionId: player, settlementId: 'settlement.6' });
    expect(engineer.mission).toBeNull(); expect(result.events.some(event => event.type === 'character_mission_interrupted')).toBe(true); restore(state);
  });

  it('saves deterministic sabotage wounds, blocks actions during recovery, and gives siegecraft a real risk reduction', () => {
    for (const specialized of [false, true]) {
      const state = conquestCampaign(); const engineer = attach(state, 'character.engineer');
      appoint(state, 'character.surveyor'); // Mission serial9 has a fixed roll12: base failure, specialist success.
      if (specialized) { engineer.experience = 12; issue(state, { type: 'promoteCharacter', factionId: player, characterId: engineer.id, skillId: 'skill.siegecraft' }); }
      issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'besiege', factionId: player, armyId: 'army.2', settlementId: 'settlement.6' });
      expect(state.nextId).toBe(9); mission(state, engineer, 'mission.sabotage', 'settlement.6'); end(state); end(state);
      expect(engineer.woundedTurns).toBe(specialized ? 0 : 3); expect(state.sieges['settlement.6']!.defenses).toBe(specialized ? 0 : 10);
      const mirror = restore(state);
      if (!specialized) reject(state, { type: 'startCharacterMission', factionId: player, characterId: engineer.id, missionId: 'mission.sabotage', settlementId: 'settlement.6' });
      for (let turn = 0; turn < 3; turn++) { end(state); end(mirror); }
      expect(engineer.woundedTurns).toBe(0); expect(stateHash(state)).toBe(stateHash(mirror));
      expect(state.events.some(event => event.type === 'character_recovered')).toBe(!specialized);
    }
  });

  it('interrupts an attacked agent before freezing a saveable human-defender battle', () => {
    const state = borderBattleCampaign(); const surveyor = attach(state, 'character.surveyor');
    mission(state, surveyor, 'mission.survey'); issue(state, { type: 'declareWar', factionId: rival, targetFactionId: player });
    const result = issue(state, { type: 'attack', factionId: rival, armyId: 'army.4', targetArmyId: 'army.2' });
    expect(surveyor.mission).toBeNull(); expect(result.events.some(event => event.type === 'character_mission_interrupted')).toBe(true); restore(state);
    reject(state, { type: 'autoResolveBattle', factionId: rival }); issue(state, { type: 'battleOrder', factionId: player, order: 'brace' }); restore(state);
  });

  it('freezes leadership and names, applies Rally once without changing RNG, and saves/replays actual aftermath', () => {
    const state = characterBattleCampaign(); const marshal = Object.values(state.characters)[0]!;
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'attack', factionId: player, armyId: 'army.2', targetArmyId: 'army.4' });
    expect(state.battle?.combat.attacker[0]?.attack).toBe(UNITS.find(unit => unit.id === state.battle?.combat.attacker[0]?.unitId)!.attack + 1);
    const random = state.battle!.combat.rngState; const morale = state.battle!.combat.attacker[0]!.morale;
    const rally: GameCommand = { type: 'useCommanderAbility', factionId: player, characterId: marshal.id, abilityId: 'ability.rally' };
    issue(state, rally); expect(state.battle!.combat.attacker[0]!.morale).toBe(morale + 12); expect(state.battle!.combat.rngState).toBe(random); reject(state, rally);
    const mirror = restore(state); issue(state, { type: 'autoResolveBattle', factionId: player }); issue(mirror, { type: 'autoResolveBattle', factionId: player });
    expect(stateHash(state)).toBe(stateHash(mirror)); expect(state.battleReports.at(-1)?.characterAftermath).toHaveLength(1); restore(state);
    expect(state.battleReports.at(-1)?.characterSnapshots[0]?.name).toBe(marshal.name);
  });

  it('offers one permanent earned specialization and applies its real leadership bonus', () => {
    const state = characterBattleCampaign(); const marshal = Object.values(state.characters)[0]!;
    reject(state, { type: 'promoteCharacter', factionId: player, characterId: marshal.id, skillId: 'skill.steadfast' });
    marshal.experience = 12; issue(state, { type: 'promoteCharacter', factionId: player, characterId: marshal.id, skillId: 'skill.decisive' });
    expect(marshal.experience).toBe(0); reject(state, { type: 'promoteCharacter', factionId: player, characterId: marshal.id, skillId: 'skill.steadfast' });
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'attack', factionId: player, armyId: 'army.2', targetArmyId: 'army.4' });
    expect(state.battle?.characterSnapshots[0]?.leadership.attack).toBe(3); restore(state);
  });

  it('never drains above-base morale when Rally restores another formation in the same army', () => {
    const state = characterBattleCampaign(); const marshal = Object.values(state.characters)[0]!;
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'attack', factionId: player, armyId: 'army.2', targetArmyId: 'army.4' });
    const [healthy, shaken] = state.battle!.combat.attacker;
    if (!healthy || !shaken) throw new Error('Mixed-morale regression requires two formations');
    // Exercise the kernel's wider morale domain defensively; ordinary campaign entry is base-capped.
    healthy.morale = UNITS.find(unit => unit.id === healthy.unitId)!.morale + 5;
    shaken.morale = UNITS.find(unit => unit.id === shaken.unitId)!.morale - 6;
    const healthyBefore = healthy.morale; const shakenBefore = shaken.morale;
    const result = issue(state, { type: 'useCommanderAbility', factionId: player, characterId: marshal.id, abilityId: 'ability.rally' });
    expect(healthy.morale).toBe(healthyBefore); expect(shaken.morale).toBe(shakenBefore + 6);
    expect(result.events.find(event => event.type === 'commander_rallied')?.message).toContain('restoring 6 formation morale');
  });

  it('reports the actual remaining wound duration when an already-wounded character retreats', () => {
    const state = borderBattleCampaign(); const character = attach(state, 'character.marshal', 'army.4');
    character.woundedTurns = 3; state.armies['army.4']!.formations[0]!.strength = 1;
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'attack', factionId: player, armyId: 'army.2', targetArmyId: 'army.4' });
    const result = issue(state, { type: 'autoResolveBattle', factionId: player });
    expect(state.battleReports.at(-1)?.aftermath.find(army => army.armyId === 'army.4')?.outcome).toBe('retreated');
    expect(character.woundedTurns).toBe(3);
    expect(result.events.find(event => event.type === 'character_battle_experience' && event.factionId === rival)?.message).toContain('3 turns of recovery'); restore(state);
  });

  it('keeps foreign roster/skills/private missions out of ordinary observations', () => {
    const state = borderBattleCampaign(); const character = attach(state, 'character.marshal', 'army.4'); character.experience = 12;
    issue(state, { type: 'promoteCharacter', factionId: rival, characterId: character.id, skillId: 'skill.decisive' });
    const view = getObservation(state, player); expect(view.characters).toEqual([]);
    const enemy = view.armies.find(army => army.id === 'army.4')!; expect(enemy.commander).toBeNull(); expect(enemy.agents).toEqual([]);
    expect(view.characterRecruitment.every(option => state.settlements[option.settlementId]?.factionId === player)).toBe(true);
    const own = getObservation(state, rival); own.characters[0]!.name = 'Changed'; expect(state.characters[character.id]?.name).not.toBe('Changed');
    const distant = appoint(state, 'character.surveyor', rival, 'settlement.6');
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'attack', factionId: player, armyId: 'army.2', targetArmyId: 'army.4' });
    const witnessed = getObservation(state, player); expect(witnessed.battle?.characterSnapshots.map(snapshot => snapshot.characterId)).toEqual([character.id]);
    expect(JSON.stringify(witnessed)).not.toContain(distant.name); expect(witnessed.characters).toEqual([]);
  });

  it('records attached character death with real army destruction and keeps historical snapshots independently saveable', () => {
    const state = borderBattleCampaign(); const doomed = attach(state, 'character.marshal', 'army.4');
    const attacker = state.armies['army.2']!; const defender = state.armies['army.4']!;
    defender.formations[0]!.strength = 1; defender.formations[0]!.morale = 75;
    // Authored trapped approach: withdrawal cannot reach a legal unoccupied land hex.
    const protectedCells = new Set([attacker.cell, ...Object.values(state.settlements).map(town => town.cell), ...state.world.starts]);
    for (const cell of neighbors(defender.cell, state.world.width, state.world.height)) if (!protectedCells.has(cell)) { state.world.terrain[cell] = 0; state.world.biome[cell] = 0; state.world.fertility[cell] = 0; }
    attacker.formations = [createArmyFormation(attacker.id, 'unit.heavy_infantry')]; attacker.movement = 2; rebuildIndexes(state);
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'attack', factionId: player, armyId: attacker.id, targetArmyId: defender.id }); issue(state, { type: 'autoResolveBattle', factionId: player });
    expect(doomed.dead).toBe(true); expect(doomed.location).toBeNull();
    expect(state.battleReports.at(-1)?.characterAftermath).toContainEqual({ characterId: doomed.id, name: doomed.name, outcome: 'dead', experience: 0, woundedTurns: 0 });
    delete state.characters[doomed.id]; rebuildCharacterIndexes(state); // A later bounded-history prune may remove this strategic record.
    restore(state); expect(state.battleReports.at(-1)?.characterSnapshots[0]?.name).toBe(doomed.name);
  });

  it('rejects checksum-valid mission timing, carrier movement and location tampering', () => {
    const state = characterCampaign(); const engineer = attach(state, 'character.engineer'); mission(state, engineer, 'mission.refit'); end(state);
    const corrupt = (change: (data: { characters: Character[]; armies: GameState['armies'][string][] }) => void) => {
      const save = JSON.parse(serializeGame(state)) as { stateChecksum: string; state: { characters: Character[]; armies: GameState['armies'][string][] } };
      change(save.state); save.stateChecksum = checksum(JSON.stringify(save.state)); expect(() => deserializeGame(JSON.stringify(save))).toThrow();
    };
    corrupt(data => { data.characters[0]!.mission!.remainingTurns = 2; });
    corrupt(data => { data.armies.find(army => army.id === 'army.2')!.movement = 1; });
    corrupt(data => { data.characters[0]!.mission!.anchorCell++; });
    corrupt(data => { data.characters[0]!.mission!.targetSettlementId = 'settlement.6'; });
    corrupt(data => { data.characters[0]!.mission!.id = `mission.${state.nextId}`; });
    restore(state);
  });

  it('caps living appointments and retains only the newest32 dead records after real conquest', () => {
    const state = conquestCampaign(); state.factions[1]!.treasury = 100_000;
    for (let i = 0; i < 64; i++) appoint(state, 'character.surveyor', rival, 'settlement.6');
    reject(state, { type: 'recruitCharacter', factionId: rival, settlementId: 'settlement.6', definitionId: 'character.surveyor' });
    const newest = Object.keys(state.characters).sort((a, b) => Number(b.slice(10)) - Number(a.slice(10))).slice(0, 32).sort();
    const army = state.armies['army.2']!;
    for (let i = 0; i < 3; i++) army.formations.push(createArmyFormation(`army.${state.nextId++}`, 'unit.heavy_infantry'));
    army.formations.sort((a, b) => a.id < b.id ? -1 : 1); army.movement = 2; rebuildIndexes(state);
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'besiege', factionId: player, armyId: army.id, settlementId: 'settlement.6' });
    end(state); end(state); end(state); issue(state, { type: 'assault', factionId: player, settlementId: 'settlement.6' }); issue(state, { type: 'autoResolveBattle', factionId: player });
    expect(state.pendingCapture).not.toBeNull(); issue(state, { type: 'resolveCapture', factionId: player, settlementId: 'settlement.6', outcome: 'raze' });
    expect(Object.keys(state.characters).sort()).toEqual(newest); expect(Object.values(state.characters).every(character => character.dead && character.location === null)).toBe(true); restore(state);
  });

  it('rejects checksum-valid character/timing/battle corruption and refuses old-rule character execution', () => {
    const state = characterBattleCampaign(); const marshal = Object.values(state.characters)[0]!;
    const corrupt = (mutate: (state: { characters: Character[]; battle: GameState['battle'] }) => void) => {
      const save = JSON.parse(serializeGame(state)) as { stateChecksum: string; state: { characters: Character[]; battle: GameState['battle'] } }; mutate(save.state); save.stateChecksum = checksum(JSON.stringify(save.state)); expect(() => deserializeGame(JSON.stringify(save))).toThrow();
    };
    corrupt(data => { data.characters[0]!.location = { kind: 'army', armyId: 'army.missing' }; });
    corrupt(data => { data.characters[0]!.dead = true; });
    corrupt(data => { data.characters[0]!.skillId = 'skill.siegecraft'; });
    expect(() => serializeGameForVersion(state, 6)).toThrow(/characters/); expect(() => applyCommandForVersion(state, { type: 'endTurn', factionId: player }, 6)).toThrow(/characters/);
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'attack', factionId: player, armyId: 'army.2', targetArmyId: 'army.4' });
    corrupt(data => { data.battle!.characterSnapshots[0]!.leadership.attack++; });
    corrupt(data => { data.battle!.characterSnapshots = []; });
    corrupt(data => { data.battle!.usedAbilities = [{ characterId: marshal.id, abilityId: 'ability.teleport' }]; });
    issue(state, { type: 'useCommanderAbility', factionId: player, characterId: marshal.id, abilityId: 'ability.rally' });
    corrupt(data => { data.battle!.usedAbilities.push({ ...data.battle!.usedAbilities[0]! }); });
    expect(CHARACTER_DEFINITIONS).toHaveLength(3);
  });
});
