import type { RulesVersion } from '../../sim/src/rules';
import { BUILDINGS } from '@theandril/content';
import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import { ARCANE_DISCOVERIES, MAGIC_PATHS } from '@theandril/content';
import { applyCommand, applyCommandForVersion, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { holdSurveyedSeam, refreshAuthoredSight } from './authored-land';

export const PROSPERITY_FIXTURE = { hostName: 'Ledger Hearth', hostId: 'settlement.5', seed: 20260905 } as const;
/** A tiny world whose first hearth lies within a few hexes of a seam of each path. */
export const ATTUNEMENT_FIXTURE = { hostName: 'Glasswatch', hostId: 'settlement.5', seed: 20260906 } as const;

/** Shortest known land route to a legally separated new hearth; used only during scenario setup. */
function expansionRoute(state: GameState, origin: number): number[] {
  const parents = new Map<number, number | null>([[origin, null]]);
  const queue = [origin];
  for (let index = 0; index < queue.length; index++) {
    const cell = queue[index]!;
    if (Object.values(state.settlements).every(town => hexDistance(cell, town.cell, state.world.width) >= 4)) {
      const path: number[] = [];
      let next: number | null = cell;
      while (next !== null && next !== origin) { path.unshift(next); next = parents.get(next) ?? null; }
      return path;
    }
    for (const next of neighbors(cell, state.world.width, state.world.height)) {
      if (!parents.has(next) && isPassable(state.world.terrain[next]!) && hexDistance(next, origin, state.world.width) <= 12) {
        parents.set(next, cell); queue.push(next);
      }
    }
  }
  throw new Error('Prosperity fixture has no connected expansion route.');
}

/** Prepared infrastructure, not a fabricated victory: every later choice/project uses normal rules. */
export function prosperityCampaign(version: RulesVersion = 16): GameState {
  const state = createGame({ rulesVersion: version, seed: PROSPERITY_FIXTURE.seed, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 4, rosterVersion: 3 });
  const issue = (command: GameCommand): void => {
    // Freeze authored setup before roads; subsequent gameplay uses current rules.
    const result = applyCommandForVersion(state, command, 11);
    if (!result.ok) throw new Error('Prosperity fixture command failed: ' + result.error);
  };
  const advance = (): void => issue({ type: 'endTurn', factionId: state.turnOwnerId });
  for (const faction of state.factions) {
    const army = Object.values(state.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'));
    if (!army) throw new Error('Prosperity fixture needs its founding caravans.');
    issue({ type: 'found', factionId: faction.id, armyId: army.id, name: faction.id === state.turnOwnerId ? PROSPERITY_FIXTURE.hostName : 'Reedbound Hold' });
  }
  foundHearths(state, ['Kiln Ward', 'Commons Reach'], issue, advance);
  for (const town of Object.values(state.settlements)) if (town.factionId === state.turnOwnerId) town.buildings = BUILDINGS.filter(building => !building.coastalOnly).map(building => building.id);
  const player = state.factions.find(faction => faction.id === state.turnOwnerId)!;
  player.treasury = 300; player.knowledge = 64;
  // Only readiness is authored. Technology, institutions, doctrines, projects and victory stay untouched.
  return deserializeGame(serializeGame(state));
}

/** Rules 19: six of seven hearths belong to the player; no bid exists until a round ends. */
export function unificationCampaign(): GameState {
  const state = createGame({ rulesVersion: 19, seed: PROSPERITY_FIXTURE.seed, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 4, rosterVersion: 3 });
  const issue = (command: GameCommand): void => {
    const result = applyCommandForVersion(state, command, 11);
    if (!result.ok) throw new Error('Unification fixture command failed: ' + result.error);
  };
  const advance = (): void => issue({ type: 'endTurn', factionId: state.turnOwnerId });
  for (const faction of state.factions) {
    const army = Object.values(state.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'))!;
    issue({ type: 'found', factionId: faction.id, armyId: army.id, name: faction.id === state.turnOwnerId ? PROSPERITY_FIXTURE.hostName : 'Reedbound Hold' });
  }
  foundHearths(state, ['Kiln Ward', 'Commons Reach', 'Ash Ford', 'Lantern Rise', 'Weir Hollow', 'Saltmere', 'Cinder Gate'], issue, advance);
  return deserializeGame(serializeGame(state));
}

function foundHearths(state: GameState, names: string[], issue: (command: GameCommand) => void, advance: () => void): void {
  const host = state.settlements[PROSPERITY_FIXTURE.hostId];
  if (!host) throw new Error('Victory fixture is missing its host.');
  for (const name of names) {
    issue({ type: 'queue', factionId: state.turnOwnerId, settlementId: host.id, itemId: 'unit.colonist' });
    let caravan = Object.values(state.armies).find(army => army.factionId === state.turnOwnerId && army.formations.some(item => item.unitId === 'unit.colonist'));
    for (let wait = 0; !caravan && wait < 8; wait++) {
      advance(); caravan = Object.values(state.armies).find(army => army.factionId === state.turnOwnerId && army.formations.some(item => item.unitId === 'unit.colonist'));
    }
    if (!caravan) throw new Error('Prosperity fixture could not recruit a caravan.');
    for (const target of expansionRoute(state, caravan.cell)) {
      const cost = state.world.terrain[target] === 2 || state.world.terrain[target] === 3 ? 2 : 1;
      if (caravan.movement < cost) advance();
      issue({ type: 'move', factionId: state.turnOwnerId, armyId: caravan.id, target });
    }
    if (caravan.movement < 1) advance();
    issue({ type: 'found', factionId: state.turnOwnerId, armyId: caravan.id, name });
  }
}

/** Rules 38: a realm at the brink of a sealed working. Only readiness is
 * authored — an archive, knowledge and seams held the way play reaches them;
 * the research, the appointment and the caster's deepening are ordinary paid
 * commands, and no working exists until one is started. */
export function attunementCampaign(): GameState {
  const state = createGame({ seed: ATTUNEMENT_FIXTURE.seed, size: 'tiny', factionCount: 2, pace: 'short' });
  const issue = (command: GameCommand): void => {
    const result = applyCommand(state, command);
    if (!result.ok) throw new Error('Attunement fixture command failed: ' + result.error);
  };
  for (const faction of state.factions) {
    const army = Object.values(state.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'));
    if (!army) throw new Error('Attunement fixture needs its founding caravans.');
    issue({ type: 'found', factionId: faction.id, armyId: army.id, name: faction.id === state.turnOwnerId ? ATTUNEMENT_FIXTURE.hostName : 'Reedbound Hold' });
  }
  const player = state.factions.find(faction => faction.id === state.turnOwnerId)!;
  const host = Object.values(state.settlements).find(town => town.factionId === player.id)!;
  if (!host.buildings.includes('building.archive')) host.buildings.push('building.archive');
  player.treasury = 300; player.knowledge = 400;
  for (const path of MAGIC_PATHS) holdSurveyedSeam(state, player.id, path.id);
  for (const discovery of ARCANE_DISCOVERIES) issue({ type: 'researchArcane', factionId: player.id, discoveryId: discovery.id });
  issue({ type: 'recruitCharacter', factionId: player.id, settlementId: host.id, definitionId: 'character.waykeeper' });
  const caster = Object.values(state.characters).find(character => character.factionId === player.id && character.definitionId === 'character.waykeeper')!;
  caster.experience = 24;
  issue({ type: 'promoteCharacter', factionId: player.id, characterId: caster.id, skillId: 'skill.flame_deepening' });
  return deserializeGame(serializeGame(state));
}

/** Rules 22/39: the unification world with the player as patron of its rival.
 * Two player hearths are authored to the rival so it has a realm to rule; the
 * oath itself is sworn by ordinary offer and acceptance. */
export function patronageCampaign(): GameState {
  const state = unificationCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  for (const town of Object.values(state.settlements).filter(town => town.factionId === player && town.id !== state.land.capitals[player]).slice(0, 2)) town.factionId = rival;
  refreshAuthoredSight(state);
  state.factions[0]!.treasury = 200; state.factions[1]!.treasury = 60;
  const offer = applyCommand(state, { type: 'proposeClient', factionId: player, targetFactionId: rival, terms: { giftCoin: 40, tributeCoin: 2, termTurns: 20 } });
  if (!offer.ok) throw new Error('Patronage fixture could not offer: ' + offer.error);
  const answer = applyCommand(state, { type: 'respondClient', factionId: rival, offerId: state.diplomacy.clientOffers[0]!.id, accept: true });
  if (!answer.ok) throw new Error('Patronage fixture could not accept: ' + answer.error);
  return deserializeGame(serializeGame(state));
}
