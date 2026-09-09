import { battleDevelopmentEffects, snapshotBattleDevelopment } from './combat/development-snapshot';
import { selectDefendingArmies } from './battle-frontage';
import { UNITS } from '@theandril/content';
import { hexDistance, neighbors, SeededRandom } from '@theandril/mapgen';
import { autoResolveBattle, chooseBattleOrder, createBattle, resolveBattleRound, settleBattleTerminal } from './combat';
import { automaticBattleAbilities, createBattleAbilityState } from './battle-abilities';
import type { BattleFactObserver } from './combat/presentation';
import type { BattleFormation, BattleOrder } from './combat';
import type { Army, ArmyFormation, CampaignBattle, CommandResult, DomainEvent, GameState } from './types';
import { indexes, updateSight } from './visibility';
import { declareWarObjection, recordWar } from './diplomacy';
import { doctrineEffects } from './progression';

import { armyCanAttack, armySight, armyStrength } from './army-composition';
import { rulesVersion } from './rules';
import { roadMovementCost } from './roads';
import { armyCharacterLeadership, automaticallyRally, finishBattleCharacters, interruptArmyMissions, snapshotArmyCharacters } from './characters';
import { armyDomain, armyTerrainBlocker, carriedArmyBlocker, moveFleetCargo, reconcileFleetCargo, snapshotFleetCargo } from './naval';
import { awardFormationBattleExperience, formationBattleEffects } from './development';

export const MAX_BATTLE_REPORTS = 20;
const units = new Map(UNITS.map(unit => [unit.id, unit]));
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const compareId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

export function warPair(first: string, second: string): [string, string] {
  return first < second ? [first, second] : [second, first];
}

export function atWar(state: GameState, first: string, second: string): boolean {
  const pair = warPair(first, second);
  return state.wars.some(war => war[0] === pair[0] && war[1] === pair[1]);
}

export function declareCampaignWar(state: GameState, factionId: string, targetFactionId: string): CommandResult {
  const target = state.factions.find(faction => faction.id === targetFactionId);
  const faction = state.factions.find(item => item.id === factionId);
  if (!faction || !target) return fail('Unknown faction.');
  if (factionId === targetFactionId) return fail('A faction cannot declare war on itself.');
  if (atWar(state, factionId, targetFactionId)) return fail('These factions are already at war.');
  const objection = declareWarObjection(state, factionId, targetFactionId);
  if (objection) return fail(objection);
  const visible = indexes(state).visible.get(factionId);
  const hasContact = Object.values(state.armies).some(army => !state.transports[army.id] && army.factionId === targetFactionId && visible?.has(army.cell))
    || Object.values(state.settlements).some(town => town.factionId === targetFactionId && visible?.has(town.cell));
  if (!hasContact) return fail('Scout a faction before declaring war.');
  state.wars.push(warPair(factionId, targetFactionId));
  state.wars.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
  recordWar(state, factionId, targetFactionId);
  return { ok: true, events: [
    { turn: state.turn, type: 'war_declared', factionId, message: `${faction.name} declared war on ${target.name}.` },
    { turn: state.turn, type: 'war_declared', factionId: targetFactionId, message: `${faction.name} declared war on ${target.name}.` },
  ] };
}

function formation(state: GameState, army: Army, item: ArmyFormation, index: number, count: number): BattleFormation {
  const unit = units.get(item.unitId);
  if (!unit) throw new Error('Missing unit definition');
  const leadership = rulesVersion(state) >= 7 ? armyCharacterLeadership(state, army.id) : { attack: 0, armor: 0 };
  const training = unit.canFound ? { attack: 0, armor: 0, initiative: 0, range: 0, morale: 0 } : formationBattleEffects(state, army.factionId, item.id);
  return {
    id: rulesVersion(state) < 6 ? army.id : item.id, unitId: item.unitId, strength: item.strength, maxStrength: unit.strength,
    morale: Math.min(100, item.morale + training.morale), fatigue: item.fatigue, row: Math.floor(index / 5), column: count === 1 ? 2 : index % 5,
    attack: unit.attack + doctrineEffects(state.progression[army.factionId]?.doctrineId ?? null).attack + leadership.attack + training.attack,
    armor: unit.armor + doctrineEffects(state.progression[army.factionId]?.doctrineId ?? null).armor + leadership.armor + training.armor, initiative: unit.initiative + training.initiative, range: unit.range + training.range,
  };
}
function deployment(state: GameState, armies: Army[]): BattleFormation[] {
  const roster = armies.flatMap(army => army.formations.map(item => ({ army, item })))
    .sort((a, b) => compareId(rulesVersion(state) < 6 ? a.army : a.item, rulesVersion(state) < 6 ? b.army : b.item));
  return roster.map(({ army, item }, i) => formation(state, army, item, i, roster.length));
}
const battleVersion = (state: GameState): CampaignBattle['rulesVersion'] => rulesVersion(state) < 6 ? 5 : rulesVersion(state) < 7 ? 6 : rulesVersion(state) < 8 ? 7 : rulesVersion(state) < 14 ? 8 : rulesVersion(state) < 16 ? 9 : 10;
function compositionSnapshot(state: GameState, armies: Army[], militiaId: string | null, combat: CampaignBattle['combat']) {
  const formationBindings: CampaignBattle['formationBindings'] = armies.flatMap(army => army.formations.map(item => ({ battleFormationId: rulesVersion(state) < 6 ? army.id : item.id, formationId: item.id, armyId: army.id })));
  if (militiaId) formationBindings.push({ battleFormationId: militiaId, formationId: militiaId, armyId: null });
  formationBindings.sort((a, b) => a.battleFormationId < b.battleFormationId ? -1 : 1);
  return { rulesVersion: battleVersion(state), formationBindings,
    domain: armyDomain(armies[0]!), transportAftermath: [], transportSnapshots: snapshotFleetCargo(state, armies),
    characterSnapshots: rulesVersion(state) >= 7 ? snapshotArmyCharacters(state, armies) : [], characterAftermath: [], usedAbilities: [],
    formationStrengths: formationBindings.map(binding => ({ formationId: binding.formationId, strength: [...combat.attacker, ...combat.defender].find(item => item.id === binding.battleFormationId)!.strength })),
    formationAftermath: [] };
}

export function startCampaignBattle(state: GameState, factionId: string, armyId: string, targetArmyId: string): CommandResult {
  const attacker = state.armies[armyId];
  const defender = state.armies[targetArmyId];
  if (!attacker || attacker.factionId !== factionId) return fail('You do not control that army.');
  const carried = carriedArmyBlocker(state, armyId); if (carried) return fail(carried);
  const index = indexes(state);
  // An unknown or hidden target deliberately returns the same error.
  if (!defender || state.transports[defender.id] || !index.visible.get(factionId)?.has(defender.cell)) return fail('Choose a currently visible enemy army.');
  if (defender.factionId === factionId) return fail('An army cannot attack its own faction.');
  if (!atWar(state, factionId, defender.factionId)) return fail('Declare war before attacking this faction.');
  if (!armyCanAttack(attacker)) return fail('Hearth caravans cannot initiate attacks.');
  if (armyDomain(attacker) !== armyDomain(defender)) return fail('Land armies fight on land and fleets fight on water. Disembark before a land attack.');
  const terrainBlocker = armyTerrainBlocker(state, attacker, defender.cell); if (terrainBlocker) return fail(terrainBlocker);
  if (!neighbors(attacker.cell, state.world.width, state.world.height).includes(defender.cell)) return fail('Attack an adjacent enemy army.');
  if (index.settlements.has(defender.cell)) return fail('Besiege this settlement and assault its defenses to attack its garrison.');
  const terrain = state.world.terrain[defender.cell] ?? 0;
  const cost = roadMovementCost(state, attacker.cell, defender.cell);
  if (attacker.movement < cost) return fail('Not enough movement remains to attack this terrain.');
  const stack = [...(index.armies.get(defender.cell) ?? [])].map(id => state.armies[id]).filter((army): army is Army => army !== undefined).sort(compareId);
  const defenders = rulesVersion(state) >= 17 ? selectDefendingArmies(stack, defender.id) : stack;
  if (defenders.reduce((sum, army) => sum + army.formations.length, 0) > (rulesVersion(state) < 8 ? 12 : 20)) return fail(rulesVersion(state) >= 8 ? 'This field battle supports at most twenty defending formations.' : rulesVersion(state) < 6 ? 'This field battle supports at most twelve defending armies.' : 'This field battle supports at most twelve defending formations.');
  if (!defenders.length || stack.some(army => army.factionId !== defender.factionId)) return fail('The defending stack has invalid ownership.');
  const serial = state.nextId;
  const seed = new SeededRandom((state.world.seed ^ serial) >>> 0).nextUint32();
  const combat = createBattle({ seed, terrain, attacker: deployment(state, [attacker]), defender: deployment(state, defenders) }, battleVersion(state));
  state.battle = {
    id: `battle.${serial}`, turn: state.turn, attackerId: attacker.id, defenderId: defender.id,
    defenderIds: defenders.map(army => army.id), attackerFactionId: factionId, defenderFactionId: defender.factionId,
    attackerCell: attacker.cell, defenderCell: defender.cell,
    settlementId: null, militiaId: null, fortification: 0,
    attackerDoctrineId: state.progression[factionId]?.doctrineId ?? null, defenderDoctrineId: state.progression[defender.factionId]?.doctrineId ?? null,
    initialStrengths: [attacker, ...defenders].sort(compareId).map(army => ({ armyId: army.id, strength: armyStrength(army) })), aftermath: [], combat,
    ...compositionSnapshot(state, [attacker, ...defenders], null, combat),
  };
  if (state.battle.rulesVersion >= 9) state.battle.abilityState = createBattleAbilityState(state, state.battle);
  if (state.battle.rulesVersion >= 10) state.battle.developmentSnapshots = snapshotBattleDevelopment(state, state.battle);
  state.nextId++;
  attacker.movement = 0;
  for (const army of defenders) army.movement = 0;
  const reserveFormations = stack.reduce((sum, army) => sum + army.formations.length, 0) - defenders.reduce((sum, army) => sum + army.formations.length, 0);
  const message = `${attacker.name} engaged ${defenders.length === 1 ? defender.name : `${defenders.length} defending armies`} at hex ${defender.cell}.${reserveFormations ? ` ${reserveFormations} reserve formations still hold the hex and must be defeated separately.` : ''}`;
  const interruptions: DomainEvent[] = [];
  for (const army of [attacker, ...defenders]) interruptArmyMissions(state, army.id, 'The army entered battle.', interruptions);
  return { ok: true, events: [
    ...interruptions,
    { turn: state.turn, factionId, type: 'battle_started', cell: defender.cell, message },
    { turn: state.turn, factionId: defender.factionId, type: 'battle_started', cell: defender.cell, message },
  ] };
}

/** Siege assaults use the identical formation engine, with persistent local militia. */
export function startSettlementAssault(state: GameState, factionId: string, armyId: string, settlementId: string): CommandResult {
  const attacker = state.armies[armyId]; const town = state.settlements[settlementId]; const siege = state.sieges[settlementId];
  if (!attacker || !town || !siege) return fail('Missing assault participants.');
  const stack = [...(indexes(state).armies.get(town.cell) ?? [])].map(id => state.armies[id]).filter((army): army is Army => army !== undefined).sort(compareId);
  const defenders = rulesVersion(state) >= 17 ? selectDefendingArmies(stack) : stack;
  if (defenders.reduce((sum, army) => sum + army.formations.length, 0) > (rulesVersion(state) < 8 ? 12 : 20) || stack.some(army => army.factionId !== town.factionId)) return fail('Invalid defending garrison.');
  const militiaId = defenders.length ? null : `militia.${town.id}`;
  const fortification = Math.floor(siege.defenses / 10);
  const guard = units.get('unit.guard');
  if (!guard) return fail('Missing militia unit definition.');
  const defenderEffects = doctrineEffects(state.progression[town.factionId]?.doctrineId ?? null);
  const defensiveFormations: BattleFormation[] = defenders.length ? deployment(state, defenders).map(unit => ({ ...unit, armor: unit.armor + fortification })) : [{
    id: militiaId ?? '', unitId: guard.id, strength: siege.militiaStrength, maxStrength: Math.min(60, 10 + town.population * 10),
    morale: siege.militiaMorale, fatigue: siege.militiaFatigue, row: 0, column: 2,
    attack: guard.attack + defenderEffects.attack, armor: guard.armor + fortification + defenderEffects.armor, initiative: guard.initiative, range: guard.range,
  }];
  const serial = state.nextId;
  const seed = new SeededRandom((state.world.seed ^ serial) >>> 0).nextUint32();
  const combat = createBattle({ seed, terrain: state.world.terrain[town.cell] ?? 0, attacker: deployment(state, [attacker]), defender: defensiveFormations }, battleVersion(state));
  state.battle = {
    id: `battle.${serial}`, turn: state.turn, attackerId: attacker.id, defenderId: defenders[0]?.id ?? militiaId ?? '',
    defenderIds: defenders.length ? defenders.map(army => army.id) : [militiaId ?? ''], attackerFactionId: factionId, defenderFactionId: town.factionId,
    attackerCell: attacker.cell, defenderCell: town.cell, settlementId, militiaId, fortification,
    attackerDoctrineId: state.progression[factionId]?.doctrineId ?? null, defenderDoctrineId: state.progression[town.factionId]?.doctrineId ?? null,
    initialStrengths: [...[attacker, ...defenders].map(army => ({ armyId: army.id, strength: armyStrength(army) })), ...(militiaId ? [{ armyId: militiaId, strength: siege.militiaStrength }] : [])].sort((a, b) => a.armyId < b.armyId ? -1 : 1), aftermath: [], combat,
    ...compositionSnapshot(state, [attacker, ...defenders], militiaId, combat),
  };
  if (state.battle.rulesVersion >= 9) state.battle.abilityState = createBattleAbilityState(state, state.battle);
  if (state.battle.rulesVersion >= 10) state.battle.developmentSnapshots = snapshotBattleDevelopment(state, state.battle);
  state.nextId++; attacker.movement = 0;
  for (const defender of defenders) defender.movement = 0;
  const interruptions: DomainEvent[] = [];
  for (const army of [attacker, ...defenders]) interruptArmyMissions(state, army.id, 'The army entered an assault.', interruptions);
  return { ok: true, events: [...interruptions, ...[factionId, town.factionId].map(owner => ({ turn: state.turn, type: 'battle_started', factionId: owner, cell: town.cell, message: `${attacker.name} assaulted ${town.name}. Fortification armor: ${fortification}.` }))] };
}

function removeArmy(state: GameState, army: Army, previousSight = armySight(army)): void {
  const index = indexes(state);
  updateSight(state, army.factionId, army.cell, previousSight, -1);
  const occupants = index.armies.get(army.cell);
  occupants?.delete(army.id);
  if (!occupants?.size) index.armies.delete(army.cell);
  delete state.armies[army.id];
}

export function relocateArmy(state: GameState, army: Army, target: number): void {
  const index = indexes(state);
  const sight = armySight(army);
  updateSight(state, army.factionId, army.cell, sight, -1);
  const occupants = index.armies.get(army.cell);
  occupants?.delete(army.id);
  if (!occupants?.size) index.armies.delete(army.cell);
  army.cell = target;
  moveFleetCargo(state, army.id);
  const destination = index.armies.get(target) ?? new Set<string>();
  destination.add(army.id); index.armies.set(target, destination);
  updateSight(state, army.factionId, target, sight, 1);
}

function canOccupy(state: GameState, army: Army, cell: number): boolean {
  if (armyTerrainBlocker(state, army, cell)) return false;
  const index = indexes(state);
  if ([...(index.armies.get(cell) ?? [])].some(id => state.armies[id]?.factionId !== army.factionId)) return false;
  const town = index.settlements.get(cell);
  return !town || state.settlements[town]?.factionId === army.factionId;
}

function finishCampaignBattle(state: GameState, battle: CampaignBattle, events: DomainEvent[]): void {
  const result = battle.combat.result;
  if (!result) throw new Error('Cannot finish an unresolved battle');
  const all = [...battle.combat.attacker, ...battle.combat.defender].sort(compareId);
  const outcomes = new Map<string, CampaignBattle['aftermath'][number]['outcome']>();
  const bindings = new Map(battle.formationBindings.map(binding => [binding.battleFormationId, binding]));
  const participants = [...new Set(battle.formationBindings.flatMap(binding => binding.armyId ? [binding.armyId] : []))].sort();
  for (const id of participants) {
    const army = state.armies[id];
    if (!army) throw new Error('Battle references a missing army');
    outcomes.set(id, 'held');
    const previousSight = armySight(army);
    for (const item of army.formations) {
      const binding = battle.formationBindings.find(binding => binding.formationId === item.id && binding.armyId === id);
      const result = all.find(unit => unit.id === binding?.battleFormationId);
      if (!result) throw new Error('Battle omitted an army formation');
      item.strength = result.strength;
      // Deployment training is temporary: carry losses, not its bonus, back to the campaign.
      // Use the battle's frozen snapshot rather than a subsequently changed company branch.
      const training = rulesVersion(state) >= 17
        ? battleDevelopmentEffects(battle.developmentSnapshots?.find(snapshot => snapshot.formationId === binding?.battleFormationId)).morale : 0;
      item.morale = rulesVersion(state) >= 17
        ? Math.max(1, Math.min(units.get(item.unitId)!.morale, result.morale - training))
        : Math.max(1, result.morale);
      item.fatigue = result.fatigue;
      if (item.strength === 0 && battle.rulesVersion >= 6) events.push({ turn: state.turn, factionId: army.factionId, type: 'formation_destroyed', cell: army.cell, message: `${army.name} lost its ${units.get(item.unitId)?.name ?? item.unitId} formation (${item.id}).` });
    }
    army.formations = army.formations.filter(item => item.strength > 0);
    army.movement = 0;
    if (!army.formations.length) {
      outcomes.set(id, 'destroyed'); removeArmy(state, army, previousSight);
      events.push({ turn: state.turn, type: 'army_destroyed', factionId: army.factionId, cell: army.cell, message: `${army.name} was destroyed in battle.` });
    } else if (previousSight !== armySight(army)) {
      updateSight(state, army.factionId, army.cell, previousSight, -1);
      updateSight(state, army.factionId, army.cell, armySight(army), 1);
    }
  }
  for (const id of participants) {
    const army = state.armies[id];
    if (!army) continue;
    const attacking = id === battle.attackerId;
    const lost = result.winner !== 'draw' && (attacking ? result.winner === 'defender' : result.winner === 'attacker');
    const active = all.some(item => bindings.get(item.id)?.armyId === id && item.strength > 0 && item.morale > 0);
    if (!lost && active && result.reason !== 'mutual withdrawal') continue;
    const opponentCell = attacking ? battle.defenderCell : battle.attackerCell;
    const distance = hexDistance(army.cell, opponentCell, state.world.width);
    const destinations = neighbors(army.cell, state.world.width, state.world.height)
      .filter(cell => canOccupy(state, army, cell) && hexDistance(cell, opponentCell, state.world.width) >= distance)
      .sort((a, b) => hexDistance(b, opponentCell, state.world.width) - hexDistance(a, opponentCell, state.world.width) || a - b);
    const retreat = destinations[0];
    if (retreat === undefined) {
      outcomes.set(army.id, 'destroyed'); removeArmy(state, army);
      events.push({ turn: state.turn, type: 'army_destroyed', factionId: army.factionId, cell: army.cell, message: `${army.name} had no retreat route and was destroyed.` });
    } else {
      outcomes.set(army.id, 'retreated'); relocateArmy(state, army, retreat);
      events.push({ turn: state.turn, type: 'army_retreated', factionId: army.factionId, cell: retreat, message: `${army.name} retreated to hex ${retreat} with ${armyStrength(army)} strength.` });
    }
  }
  const attacker = state.armies[battle.attackerId];
  if (result.winner === 'attacker' && attacker && canOccupy(state, attacker, battle.defenderCell)) {
    relocateArmy(state, attacker, battle.defenderCell); outcomes.set(attacker.id, 'advanced');
  }
  battle.aftermath = [...participants, ...(battle.militiaId ? [battle.militiaId] : [])].sort().map(id => {
    if (id === battle.militiaId) {
      const militia = all.find(item => item.id === id);
      const held = result.winner !== 'attacker' && militia && militia.strength > 0 && militia.morale > 0;
      return { armyId: id, strength: held ? militia.strength : 0, cell: held ? battle.defenderCell : null, outcome: held ? 'held' : 'destroyed' };
    }
    const army = state.armies[id];
    return { armyId: id, strength: army ? armyStrength(army) : 0, cell: army?.cell ?? null, outcome: outcomes.get(id) ?? 'held' };
  });
  battle.formationAftermath = battle.formationBindings.map(binding => ({
    formationId: binding.formationId, strength: binding.armyId
      ? state.armies[binding.armyId]?.formations.find(item => item.id === binding.formationId)?.strength ?? 0
      : battle.aftermath.find(ending => ending.armyId === binding.battleFormationId)?.strength ?? 0,
  }));
  finishBattleCharacters(state, battle, events);
  if (battle.rulesVersion >= 8) for (const id of participants) battle.transportAftermath.push(...reconcileFleetCargo(state, id, events));
  awardFormationBattleExperience(state, battle, events);
  const winner = result.winner === 'draw' ? 'Neither side' : state.factions.find(faction => faction.id === (result.winner === 'attacker' ? battle.attackerFactionId : battle.defenderFactionId))?.name ?? result.winner;
  const message = `${winner} prevailed at hex ${battle.defenderCell}: ${result.reason}.`;
  for (const factionId of [battle.attackerFactionId, battle.defenderFactionId]) events.push({ turn: state.turn, type: 'battle_finished', factionId, cell: battle.defenderCell, message });
  state.battleReports.push(battle);
  if (state.battleReports.length > MAX_BATTLE_REPORTS) state.battleReports.splice(0, state.battleReports.length - MAX_BATTLE_REPORTS);
  state.battle = null;
}

export function settleCampaignAbility(state: GameState, events: DomainEvent[], observe?: BattleFactObserver): void {
  const battle = state.battle;
  if (!battle || battle.rulesVersion < 9) return;
  battle.combat = settleBattleTerminal(battle.combat, observe);
  if (battle.combat.result) finishCampaignBattle(state, battle, events);
}

export function resolveCampaignBattle(state: GameState, factionId: string, order?: BattleOrder, observe?: BattleFactObserver): CommandResult {
  const battle = state.battle;
  if (!battle) return fail('There is no pending battle.');
  const hasHuman = battle.attackerFactionId === state.turnOwnerId || battle.defenderFactionId === state.turnOwnerId;
  const controller = hasHuman ? state.turnOwnerId : battle.attackerFactionId;
  if (factionId !== controller) return fail('Only the controlling battle participant may issue tactical orders.');
  const side = factionId === battle.attackerFactionId ? 'attacker' : 'defender';
  const events: DomainEvent[] = [];
  if (battle.rulesVersion >= 7 && battle.rulesVersion < 9 && order !== undefined) automaticallyRally(state, battle, [side === 'attacker' ? battle.defenderFactionId : battle.attackerFactionId], events);
  let combat = battle.combat;
  if (battle.rulesVersion >= 9) {
    do {
      combat = resolveBattleRound(battle.combat, {
        attacker: side === 'attacker' && order !== undefined ? order : chooseBattleOrder(battle.combat, 'attacker'),
        defender: side === 'defender' && order !== undefined ? order : chooseBattleOrder(battle.combat, 'defender'),
      }, battle.rulesVersion, { observe, beforeRound: current => { battle.combat = current; automaticBattleAbilities(state, battle, events, observe); } });
      battle.combat = combat;
    } while (order === undefined && !combat.result);
  } else if (order === undefined && battle.rulesVersion >= 7 && battle.characterSnapshots.length) {
    while (!battle.combat.result) {
      automaticallyRally(state, battle, [battle.attackerFactionId, battle.defenderFactionId], events);
      battle.combat = resolveBattleRound(battle.combat, { attacker: chooseBattleOrder(battle.combat, 'attacker'), defender: chooseBattleOrder(battle.combat, 'defender') }, battle.rulesVersion);
    }
    combat = battle.combat;
  } else combat = order === undefined ? autoResolveBattle(battle.combat, battle.rulesVersion) : resolveBattleRound(battle.combat, {
    attacker: side === 'attacker' ? order : chooseBattleOrder(battle.combat, 'attacker'),
    defender: side === 'defender' ? order : chooseBattleOrder(battle.combat, 'defender'),
  }, battle.rulesVersion);
  battle.combat = combat;
  if (combat.result) finishCampaignBattle(state, battle, events);
  else for (const participant of [battle.attackerFactionId, battle.defenderFactionId]) events.push({ turn: state.turn, factionId: participant, type: 'battle_round', cell: battle.defenderCell, message: `Battle round ${combat.round} resolved.` });
  return { ok: true, events };
}

export function cloneCampaignBattle(battle: CampaignBattle, viewerFactionId?: string): CampaignBattle {
  const cargo = battle.transportSnapshots.filter(item => !viewerFactionId || item.factionId === viewerFactionId);
  const cargoIds = new Set(cargo.map(item => item.armyId));
  return {
    ...battle, ...(battle.developmentSnapshots ? { developmentSnapshots: battle.developmentSnapshots.map(item => ({ ...item, trainingIds: [...item.trainingIds], traditionIds: [...item.traditionIds] })) } : {}), transportSnapshots: cargo.map(item => ({ ...item, formationIds: [...item.formationIds] })), transportAftermath: battle.transportAftermath.filter(item => !viewerFactionId || cargoIds.has(item.armyId)).map(item => ({ ...item, lostFormationIds: [...item.lostFormationIds] })), characterSnapshots: battle.characterSnapshots.map(item => ({ ...item, ...(item.aptitudes ? { aptitudes: { ...item.aptitudes } } : {}), ...(item.spellIds ? { spellIds: [...item.spellIds] } : {}), learnedSkillIds: [...item.learnedSkillIds], leadership: { ...item.leadership } })), characterAftermath: battle.characterAftermath.map(item => ({ ...item })), usedAbilities: battle.usedAbilities.map(item => ({ ...item })), formationBindings: battle.formationBindings.map(item => ({ ...item })), formationStrengths: battle.formationStrengths.map(item => ({ ...item })), formationAftermath: battle.formationAftermath.map(item => ({ ...item })), defenderIds: [...battle.defenderIds], initialStrengths: battle.initialStrengths.map(army => ({ ...army })), aftermath: battle.aftermath.map(army => ({ ...army })),
    ...(battle.abilityState ? { abilityState: { sources: battle.abilityState.sources.map(item => ({ ...item })), casters: battle.abilityState.casters.map(item => ({ ...item })), identities: battle.abilityState.identities.map(item => ({ ...item })) } } : {}),
    combat: {
      ...battle.combat, attacker: battle.combat.attacker.map(unit => ({ ...unit, ...(unit.members ? { members: [...unit.members] } : {}), ...(unit.position ? { position: { ...unit.position } } : {}) })), defender: battle.combat.defender.map(unit => ({ ...unit, ...(unit.members ? { members: [...unit.members] } : {}), ...(unit.position ? { position: { ...unit.position } } : {}) })),
      log: [...battle.combat.log], ...(battle.combat.result ? { result: { ...battle.combat.result } } : {}),
    },
  };
}
