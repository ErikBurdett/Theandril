import { z } from 'zod';
import { defensePreview } from './battle-frontage';
import { armyCanAttack, armyStrength } from './army-composition';
import { rulesVersion } from './rules';
import { isPassable, neighbors } from '@theandril/mapgen';
import type { CaptureDecision, CaptureOption, CaptureOutcome, CommandResult, DomainEvent, GameState, SiegeObservation } from './types';
import { atWar, relocateArmy, startSettlementAssault } from './warfare';
import { indexes, updateSight } from './visibility';
import { recordConquest } from './diplomacy';
import { captureSettlementCharacters } from './characters';
import { armyDomain, carriedArmyBlocker } from './naval';
import { roadMovementCost } from './roads';
import { settlementFoodConsumption } from './growth-economy';

const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const bounded = (maximum: number) => z.number().int().min(0).max(maximum);
export const siegeSchema = z.object({
  settlementId: id, armyId: id, factionId: id, startedTurn: bounded(1_000_000).min(1),
  defenses: bounded(30), supplies: bounded(3), militiaStrength: bounded(60).min(1),
  militiaMorale: bounded(75).min(1), militiaFatigue: bounded(100),
}).strict();
/** Rules 20: supplies count whole turns of the town's actual stored food. */
export const SIEGE_SUPPLY_CAP = 99;
export const siegeV20Schema = siegeSchema.extend({ supplies: bounded(SIEGE_SUPPLY_CAP) }).strict();
function storedSupplies(town: { food: number; population: number }): number {
  const need = settlementFoodConsumption(town.population);
  return need > 0 ? Math.min(SIEGE_SUPPLY_CAP, Math.floor(town.food / need)) : SIEGE_SUPPLY_CAP;
}
export const captureOutcomeSchema = z.enum(['occupy', 'sack', 'raze', 'liberate']);
const captureOptionSchema = z.object({
  outcome: captureOutcomeSchema, label: z.string().min(1).max(40), description: z.string().min(1).max(400),
  coinGain: bounded(1_000_000_000), populationLoss: bounded(20), buildingsLost: bounded(1000),
  devastation: bounded(100), occupationTurns: bounded(5), recipientFactionId: id.nullable(),
}).strict();
export const captureDecisionV15Schema = z.object({
  settlementId: id, armyId: id, factionId: id, previousOwnerId: id, options: z.array(captureOptionSchema).min(3).max(4),
}).strict();
export const captureDecisionSchema = captureDecisionV15Schema.extend({
  options: z.array(captureOptionSchema.extend({ coinGain: z.number().int().nonnegative().safe(), populationLoss: z.number().int().nonnegative().safe() }).strict()).min(3).max(4),
  rulesVersion: z.literal(16).optional(),
}).strict();
export const ruinSchema = z.object({
  id, name: z.string().min(1).max(40), cell: bounded(349_999), founderFactionId: id, razedByFactionId: id, turn: bounded(1_000_000).min(1),
}).strict();
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const orderedSieges = (state: GameState) => Object.values(state.sieges).sort((a, b) => a.settlementId < b.settlementId ? -1 : a.settlementId > b.settlementId ? 1 : 0);

export function besiegeSettlement(state: GameState, factionId: string, armyId: string, settlementId: string): CommandResult {
  const army = state.armies[armyId];
  const town = state.settlements[settlementId];
  if (!army || army.factionId !== factionId) return fail('You do not control that army.');
  if (carriedArmyBlocker(state, army.id) || armyDomain(army) !== 'land') return fail('Disembark a land army before besieging a settlement.');
  if (!town || !indexes(state).visible.get(factionId)?.has(town.cell)) return fail('Choose a currently visible enemy settlement.');
  if (!atWar(state, factionId, town.factionId)) return fail('Declare war before besieging this settlement.');
  if (!armyCanAttack(army)) return fail('Hearth caravans cannot besiege settlements.');
  if (!neighbors(army.cell, state.world.width, state.world.height).includes(town.cell)) return fail('Move adjacent to the settlement before besieging it.');
  if (army.movement < 1) return fail('The army needs movement to establish a siege.');
  if (state.sieges[settlementId]) return fail('This settlement is already under siege.');
  if (Object.values(state.sieges).some(siege => siege.armyId === armyId)) return fail('An army can maintain only one siege.');
  state.sieges[settlementId] = { settlementId, armyId, factionId, startedTurn: state.turn, defenses: 30, supplies: rulesVersion(state) >= 20 ? storedSupplies(town) : 3, militiaStrength: Math.min(60, 10 + town.population * 10), militiaMorale: 75, militiaFatigue: 0 };
  army.movement = 0;
  const stores = rulesVersion(state) >= 20 ? ` Its stored food lasts ${state.sieges[settlementId]!.supplies} turns; then its militia starves.` : '';
  return { ok: true, events: [factionId, town.factionId].map(owner => ({ turn: state.turn, type: 'siege_started', factionId: owner, cell: town.cell, message: `${town.name} is blockaded. Its food yield is cut off and other yields are halved.${stores}` })) };
}

export function liftSettlementSiege(state: GameState, factionId: string, settlementId: string): CommandResult {
  const siege = state.sieges[settlementId];
  if (!siege || siege.factionId !== factionId) return fail('You do not control this siege.');
  const town = state.settlements[settlementId];
  delete state.sieges[settlementId];
  return { ok: true, events: [factionId, ...(town ? [town.factionId] : [])].map(owner => ({ turn: state.turn, type: 'siege_lifted', factionId: owner, ...(town ? { cell: town.cell } : {}), message: `The siege of ${town?.name ?? settlementId} was lifted.` })) };
}

export function assaultObjection(state: GameState, factionId: string, settlementId: string): string | null {
  const siege = state.sieges[settlementId];
  const town = state.settlements[settlementId];
  if (!siege || siege.factionId !== factionId || !town) return 'You do not control a siege of this settlement.';
  if (state.battle || state.pendingCapture) return 'Resolve the current battle or capture decision first.';
  const army = state.armies[siege.armyId];
  if (!army || army.factionId !== factionId || !neighbors(army.cell, state.world.width, state.world.height).includes(town.cell)) return 'The besieging army is no longer in position.';
  if (!atWar(state, factionId, town.factionId)) return 'An assault requires an active war.';
  if (army.movement < roadMovementCost(state, army.cell, town.cell)) return 'The besieging army needs movement to assault; wait for the next turn.';
  if (rulesVersion(state) < 17 && [...(indexes(state).armies.get(town.cell) ?? [])].reduce((sum, id) => sum + (state.armies[id]?.formations.length ?? 0), 0) > (rulesVersion(state) < 8 ? 12 : 20)) return rulesVersion(state) >= 8 ? 'An assault supports at most twenty defending formations.' : rulesVersion(state) < 6 ? 'An assault supports at most twelve defending armies.' : 'An assault supports at most twelve defending formations.';
  return null;
}

export function assaultSettlement(state: GameState, factionId: string, settlementId: string): CommandResult {
  const objection = assaultObjection(state, factionId, settlementId);
  if (objection) return fail(objection);
  const siege = state.sieges[settlementId];
  if (!siege) return fail('Missing siege.');
  return startSettlementAssault(state, factionId, siege.armyId, settlementId);
}

/** Only active siege records are visited, independently of map size. */
export function reconcileSieges(state: GameState, events: DomainEvent[]): void {
  const report = events.some(event => event.type === 'battle_finished') ? state.battleReports.at(-1) : undefined;
  for (const siege of orderedSieges(state)) {
    const army = state.armies[siege.armyId];
    const town = state.settlements[siege.settlementId];
    const aftermath = report?.aftermath.find(ending => ending.armyId === siege.armyId);
    const broken = !army || !town || !atWar(state, siege.factionId, town.factionId)
      || !neighbors(army.cell, state.world.width, state.world.height).includes(town.cell)
      || aftermath?.outcome === 'retreated' || aftermath?.outcome === 'destroyed';
    if (broken) {
      events.push(...liftSettlementSiege(state, siege.factionId, siege.settlementId).events);
      continue;
    }
    if (report?.settlementId === town.id) {
      if (report.militiaId) {
        const militia = report.combat.defender.find(unit => unit.id === report.militiaId);
        if (militia) {
          siege.militiaStrength = Math.max(1, militia.strength);
          siege.militiaMorale = Math.max(1, militia.morale);
          siege.militiaFatigue = militia.fatigue;
        }
      }
      if (report.combat.result?.winner === 'attacker') {
        if (rulesVersion(state) >= 17 && (indexes(state).armies.get(town.cell)?.size ?? 0) > 0) {
          for (const factionId of [siege.factionId, town.factionId]) events.push({ turn: state.turn, factionId, type: 'siege_contested', cell: town.cell, message: `Reserve formations still defend ${town.name}. The siege continues until they are defeated.` });
          continue;
        }
        state.pendingCapture = { settlementId: town.id, armyId: army.id, factionId: siege.factionId, previousOwnerId: town.factionId, options: [], ...(rulesVersion(state) >= 16 ? { rulesVersion: 16 as const } : {}) };
        state.pendingCapture.options = captureOptions(state, state.pendingCapture);
        events.push({ turn: state.turn, factionId: siege.factionId, type: 'capture_pending', cell: town.cell, message: `${town.name} has fallen. Choose its fate.` });
      }
    }
  }
}

export function advanceSieges(state: GameState, events: DomainEvent[]): void {
  reconcileSieges(state, events);
  for (const siege of orderedSieges(state)) {
    siege.defenses = Math.max(0, siege.defenses - 10);
    const town = state.settlements[siege.settlementId];
    // Rules 20: a blockaded town eats its store (its food yield is cut off);
    // supplies report the whole turns left. Earlier rules count down from 3.
    siege.supplies = rulesVersion(state) >= 20 && town ? storedSupplies(town) : Math.max(0, siege.supplies - 1);
    if (siege.supplies === 0) siege.militiaMorale = Math.max(1, siege.militiaMorale - 10);
    if (town) for (const factionId of [siege.factionId, town.factionId]) events.push({ turn: state.turn, type: 'siege_progress', factionId, cell: town.cell, message: `${town.name}: defenses ${siege.defenses}, supplies ${siege.supplies}.` });
  }
}

export function captureOptions(state: GameState, decision: Omit<CaptureDecision, 'options'>): CaptureOption[] {
  const town = state.settlements[decision.settlementId];
  if (!town) return [];
  const victim = state.factions.find(faction => faction.id === decision.previousOwnerId);
  const capturer = state.factions.find(faction => faction.id === decision.factionId);
  // Preserve old pending quotes even when their choice is resumed today.
  const coinLimit = decision.rulesVersion === 16 ? Number.MAX_SAFE_INTEGER : 1_000_000_000;
  const loot = Math.max(0, Math.min(victim?.treasury ?? 0, 20 + town.population * 10, coinLimit - (capturer?.treasury ?? 0)));
  const populationLoss = Math.min(town.population - 1, Math.ceil(town.population / 3));
  const buildingsLost = Math.ceil(town.buildings.length / 2);
  const options: CaptureOption[] = [
    { outcome: 'occupy', label: 'Occupy', description: 'Keep the settlement and its buildings. Add 20 devastation and impose 3 turns of occupation. Existing production orders are cancelled.', coinGain: 0, populationLoss: 0, buildingsLost: 0, devastation: Math.min(100, town.devastation + 20), occupationTurns: 3, recipientFactionId: decision.factionId },
    { outcome: 'sack', label: 'Sack', description: `Take ${loot} coin, lose ${populationLoss} population and ${buildingsLost} buildings, and keep the settlement. Add 60 devastation and impose 5 turns of occupation. Food and production orders are lost.`, coinGain: loot, populationLoss, buildingsLost, devastation: Math.min(100, town.devastation + 60), occupationTurns: 5, recipientFactionId: decision.factionId },
    { outcome: 'raze', label: 'Raze', description: 'Destroy the settlement, all population, buildings and production orders. Leave a ruin that a hearth caravan can resettle.', coinGain: 0, populationLoss: town.population, buildingsLost: town.buildings.length, devastation: 100, occupationTurns: 0, recipientFactionId: null },
  ];
  if (town.founderFactionId !== decision.factionId && town.founderFactionId !== decision.previousOwnerId) {
    const founder = state.factions.find(faction => faction.id === town.founderFactionId);
    if (founder) options.push({ outcome: 'liberate', label: 'Liberate', description: `Return the settlement to ${founder.name}. Keep its population and buildings, add 10 devastation and 1 turn of recovery. Existing production orders are cancelled.`, coinGain: 0, populationLoss: 0, buildingsLost: 0, devastation: Math.min(100, town.devastation + 10), occupationTurns: 1, recipientFactionId: founder.id });
  }
  return options;
}

export function resolveSettlementCapture(state: GameState, factionId: string, settlementId: string, outcome: CaptureOutcome): CommandResult {
  const decision = state.pendingCapture;
  if (!decision || decision.factionId !== factionId || decision.settlementId !== settlementId) return fail('You do not control this capture decision.');
  const town = state.settlements[settlementId];
  const army = state.armies[decision.armyId];
  const option = captureOptions(state, decision).find(option => option.outcome === outcome);
  if (!town || !army || !option) return fail('This capture outcome is not available.');
  const capturer = state.factions.find(faction => faction.id === factionId);
  const victim = state.factions.find(faction => faction.id === decision.previousOwnerId);
  if (!capturer || !victim) return fail('The capture factions are invalid.');
  const characterEvents: DomainEvent[] = [];
  captureSettlementCharacters(state, town.id, characterEvents);
  updateSight(state, town.factionId, town.cell, 3, -1);
  const oldName = town.name;
  if (outcome === 'raze') {
    state.ruins[town.id] = { id: town.id, name: town.name, cell: town.cell, founderFactionId: town.founderFactionId, razedByFactionId: factionId, turn: state.turn };
    indexes(state).settlements.delete(town.cell);
    delete state.settlements[town.id];
    relocateArmy(state, army, town.cell);
  } else {
    if (!option.recipientFactionId) throw new Error('Capture has no recipient');
    town.factionId = option.recipientFactionId;
    town.population -= option.populationLoss;
    town.buildings = town.buildings.slice().sort().slice(option.buildingsLost);
    town.queue = [];
    if (outcome === 'sack') town.food = 0;
    town.devastation = option.devastation; town.occupationTurns = option.occupationTurns;
    const usedNames = new Set(Object.values(state.settlements).filter(other => other.id !== town.id && other.factionId === town.factionId).map(other => other.name));
    let suffix = 0;
    while (usedNames.has(town.name)) {
      const ending = ` #${town.id.slice(11)}.${++suffix}`;
      town.name = oldName.slice(0, 40 - ending.length) + ending;
    }
    updateSight(state, town.factionId, town.cell, 3, 1);
    if (town.factionId === factionId) relocateArmy(state, army, town.cell);
  }
  victim.treasury -= option.coinGain;
  capturer.treasury = Math.min(decision.rulesVersion === 16 ? Number.MAX_SAFE_INTEGER : 1_000_000_000, capturer.treasury + option.coinGain);
  recordConquest(state, factionId, decision.previousOwnerId, outcome);
  delete state.sieges[settlementId];
  state.pendingCapture = null;
  const recipients = new Set([factionId, victim.id, ...(option.recipientFactionId ? [option.recipientFactionId] : [])]);
  return { ok: true, events: [...characterEvents, ...[...recipients].map(owner => ({ turn: state.turn, factionId: owner, type: 'settlement_captured', cell: town.cell, message: `${oldName}: ${option.label.toLowerCase()}. ${option.description}` }))] };
}

export function observeSieges(state: GameState, factionId: string): SiegeObservation[] {
  return orderedSieges(state).filter(siege => siege.factionId === factionId || state.settlements[siege.settlementId]?.factionId === factionId).map(siege => {
    const town = state.settlements[siege.settlementId];
    const defenders = town ? [...(indexes(state).armies.get(town.cell) ?? [])].map(id => state.armies[id]) : [];
    const assaultBlocker = assaultObjection(state, factionId, siege.settlementId);
    const battleDefense = rulesVersion(state) >= 17 ? defensePreview(defenders.filter(army => army !== undefined)) : undefined;
    return { ...siege, ...(battleDefense ? { battleDefense } : {}), canAssault: assaultBlocker === null, assaultBlocker, defenderStrength: defenders.length ? defenders.reduce((total, army) => total + (army ? armyStrength(army) : 0), 0) : siege.militiaStrength };
  });
}

/** Called on parsed state before rebuilding caches; validation must never repair it. */
export function validateSieges(state: GameState): void {
  const require = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: ' + message); };
  const assigned = new Set<string>();
  for (const [key, siege] of Object.entries(state.sieges)) {
    const army = state.armies[siege.armyId]; const town = state.settlements[siege.settlementId];
    require(key === siege.settlementId && town && army && army.factionId === siege.factionId && armyCanAttack(army), 'invalid siege references');
    if (!army || !town) continue;
    require(armyDomain(army) === 'land' && !state.transports[army.id], 'a siege requires an independent land army');
    require(!assigned.has(army.id) && siege.startedTurn <= state.turn && atWar(state, siege.factionId, town.factionId) && neighbors(army.cell, state.world.width, state.world.height).includes(town.cell), 'invalid siege position, timing or ownership');
    require(siege.militiaStrength <= Math.min(60, 10 + town.population * 10), 'siege militia exceeds local population');
    assigned.add(army.id);
  }
  const seenRuins = new Set<number>();
  const townCells = new Set(Object.values(state.settlements).map(town => town.cell));
  for (const [key, ruin] of Object.entries(state.ruins)) {
    require(key === ruin.id && /^settlement\.[1-9][0-9]*$/.test(ruin.id) && Number(ruin.id.slice(11)) < state.nextId && !state.settlements[ruin.id], 'invalid ruin ID');
    require(ruin.cell < state.world.terrain.length && isPassable(state.world.terrain[ruin.cell] ?? 0) && !townCells.has(ruin.cell) && !seenRuins.has(ruin.cell) && ruin.turn <= state.turn, 'invalid ruin position or turn');
    require(state.factions.some(faction => faction.id === ruin.founderFactionId) && state.factions.some(faction => faction.id === ruin.razedByFactionId), 'invalid ruin faction');
    seenRuins.add(ruin.cell);
  }
  const decision = state.pendingCapture;
  if (decision) {
    const town = state.settlements[decision.settlementId]; const army = state.armies[decision.armyId]; const siege = state.sieges[decision.settlementId];
    require(!state.battle && town && army && siege && siege.armyId === army.id && army.factionId === decision.factionId && town.factionId === decision.previousOwnerId, 'invalid pending capture references');
    require(JSON.stringify(decision.options) === JSON.stringify(captureOptions(state, decision)), 'capture choices differ from canonical consequences');
    const report = state.battleReports.at(-1);
    require(!report || report.rulesVersion < 10 || decision.rulesVersion === 16, 'modern capture omitted its quoted rules');
    require(report?.settlementId === decision.settlementId && report.turn === state.turn && report.attackerId === decision.armyId && report.combat.result?.winner === 'attacker' && report.attackerFactionId === decision.factionId && report.defenderFactionId === decision.previousOwnerId, 'capture requires a victorious assault');
    if (town && army && report) {
      require(report.defenderCell === town.cell && report.attackerCell === army.cell && army.movement === 0 && !Object.values(state.armies).some(other => other.cell === town.cell), 'captured town must be cleared and capturer must remain in assault position');
    }
  }
}
