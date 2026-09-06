import { cpus, platform, release } from 'node:os';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTER_DEFINITIONS, CHARACTER_MISSIONS } from '@theandril/content';
import { applyCommand, armyMovement, armyStrength, createArmyFormation, createGame, deserializeGame, getCharacterObservation, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { planCharacters } from '../packages/ai/src/characters';
import { matureCampaign } from '../packages/test-fixtures/src/index';

const roles = ['character.marshal', 'character.surveyor', 'character.engineer'] as const;
const refit = CHARACTER_MISSIONS.find(mission => mission.id === 'mission.refit')!;
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('Character benchmark: ' + message);
}
function issue(state: GameState, command: GameCommand) {
  const result = applyCommand(state, command);
  requireValue(result.ok, JSON.stringify(command) + ': ' + result.error);
  return result;
}
function distribution(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return { samples: sorted.length, meanMs: sorted.length ? sorted.reduce((sum, value) => sum + value, 0) / sorted.length : null,
    medianMs: sorted[Math.floor(sorted.length / 2)] ?? null, p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? null, maxMs: sorted.at(-1) ?? null };
}

/** Small smoke uses identical character density and real rules, not the scale measurement. */
function smokeCampaign(): GameState {
  const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 2 });
  for (const faction of game.factions) {
    const caravan = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'))!;
    issue(game, { type: 'found', factionId: faction.id, armyId: caravan.id, name: faction.name + ' Hold' });
    faction.treasury = 100_000;
    for (let index = 0; index < 23; index++) {
      const id = `army.${game.nextId++}`;
      const army = { id, factionId: faction.id, name: 'Smoke guard', cell: caravan.cell, movement: 0, formations: [createArmyFormation(id, 'unit.guard')] };
      army.movement = armyMovement(army); game.armies[id] = army;
    }
  }
  return deserializeGame(serializeGame(game));
}

function readModelSamples(game: GameState) {
  const factionId = game.turnOwnerId;
  const characterTimes: number[] = [], observationTimes: number[] = [], plannerTimes: number[] = [];
  let finalCharacters = getCharacterObservation(game, factionId), finalView = getObservation(game, factionId);
  let finalPlan = planCharacters(finalView, finalView.treasury);
  const initialHash = stateHash(game);
  let expectedCharacters = '', expectedView = '', expectedPlan = '';
  for (let index = 0; index < 24; index++) {
    let start = performance.now(); finalCharacters = getCharacterObservation(game, factionId); const characterMs = performance.now() - start;
    start = performance.now(); finalView = getObservation(game, factionId); const observationMs = performance.now() - start;
    start = performance.now(); finalPlan = planCharacters(finalView, finalView.treasury); const plannerMs = performance.now() - start;
    const charactersJson = JSON.stringify(finalCharacters), viewJson = JSON.stringify(finalView);
    const planJson = JSON.stringify({ ...finalPlan, heldArmyIds: [...finalPlan.heldArmyIds] });
    if (index) requireValue(charactersJson === expectedCharacters && viewJson === expectedView && planJson === expectedPlan, 'read model or plan changed without a command');
    expectedCharacters = charactersJson; expectedView = viewJson; expectedPlan = planJson;
    if (index >= 4) { characterTimes.push(characterMs); observationTimes.push(observationMs); plannerTimes.push(plannerMs); }
  }
  requireValue(stateHash(game) === initialHash, 'read model or planner mutated the game');
  const legalityMirror = deserializeGame(serializeGame(game));
  for (const command of finalPlan.commands) issue(legalityMirror, command);
  return { factionId, ownedCharacters: finalCharacters.characters.length, ownArmies: finalView.armies.filter(army => army.factionId === factionId).length,
    assignmentOptions: finalCharacters.characters.reduce((sum, character) => sum + character.assignmentOptions.length, 0),
    characterObservationBytes: Buffer.byteLength(expectedCharacters), fullObservationBytes: Buffer.byteLength(expectedView),
    characterObservation: distribution(characterTimes), fullObservation: distribution(observationTimes), characterPlanner: distribution(plannerTimes),
    legalPlannerCommands: finalPlan.commands.length, plannerCommandTypes: finalPlan.commands.map(command => command.type),
    note: 'One seat owns 32 characters. Four warmups excluded, 20 repeated cached-world read models; returned co-located assignment options retained. Planner timing excludes observation construction. JSON/equality/hash checks and separate proposal-legality mirror are outside timings.' };
}

/** Synthetic mature cohorts, not AI invasion, a full campaign, or a thousand-turn proof. */
export function benchmarkCharacters(options: { smoke?: boolean } = {}) {
  return (options.smoke ? ['tiny'] as const : ['huge', 'legendary'] as const).map(size => {
    let game = size === 'tiny' ? smokeCampaign() : matureCampaign(size);
    const armyCount = Object.keys(game.armies).length;
    const carriers = new Map(game.factions.map(faction => {
      const town = Object.values(game.settlements).find(town => town.factionId === faction.id)!;
      const armies = Object.values(game.armies).filter(army => army.factionId === faction.id && army.cell === town.cell && army.formations.length === 1 && army.formations[0]!.unitId === 'unit.guard').sort(byId).slice(0, 11);
      requireValue(armies.length === 11, faction.id + ' lacks eleven co-located guards');
      // Declared fixture setup only: ten missing strength on eleven guards per seat.
      for (const army of armies) { requireValue(army.formations[0]!.strength > 10, 'guard cannot sustain authored loss'); army.formations[0]!.strength -= 10; }
      return [faction.id, armies.map(army => army.id)] as const;
    }));
    game = deserializeGame(serializeGame(game));
    let appointmentCoin = 0, setupCommands = 0;
    const engineers: string[] = [];
    for (const faction of game.factions) {
      const town = Object.values(game.settlements).find(town => town.factionId === faction.id)!;
      const beforeCoin = faction.treasury;
      for (let index = 0; index < 32; index++) {
        const definitionId = roles[index % roles.length]!;
        const before = new Set(Object.keys(game.characters));
        issue(game, { type: 'recruitCharacter', factionId: faction.id, settlementId: town.id, definitionId }); setupCommands++;
        const added = Object.keys(game.characters).filter(id => !before.has(id));
        requireValue(added.length === 1, 'appointment did not create exactly one character');
        const characterId = added[0]!;
        issue(game, { type: 'assignCharacter', factionId: faction.id, characterId, armyId: carriers.get(faction.id)![Math.floor(index / 3)]! }); setupCommands++;
        if (definitionId === 'character.engineer') engineers.push(characterId);
      }
      const expected = Array.from({ length: 32 }, (_, index) => CHARACTER_DEFINITIONS.find(definition => definition.id === roles[index % roles.length])!.coinCost).reduce((sum, coin) => sum + coin, 0);
      requireValue(beforeCoin - faction.treasury === expected, 'appointments did not charge exact content costs'); appointmentCoin += expected;
    }
    game = deserializeGame(serializeGame(game));
    requireValue(Object.keys(game.characters).length === game.factions.length * 32, 'wrong paid character count');
    const idleReadModels = readModelSamples(game);
    const strength = () => engineers.reduce((sum, id) => {
      const location = game.characters[id]!.location;
      requireValue(location?.kind === 'army', 'engineer lost its escort'); return sum + armyStrength(game.armies[location.armyId]!);
    }, 0);
    const initialStrength = strength(), coinBeforeMissions = game.factions.reduce((sum, faction) => sum + faction.treasury, 0);
    for (const characterId of engineers) {
      issue(game, { type: 'startCharacterMission', factionId: game.characters[characterId]!.factionId, characterId, missionId: refit.id }); setupCommands++;
    }
    const missionCoin = coinBeforeMissions - game.factions.reduce((sum, faction) => sum + faction.treasury, 0);
    requireValue(missionCoin === engineers.length * refit.coinCost, 'refits did not charge exact mission costs');
    const activeReadModels = readModelSamples(game);
    const turnTimes: number[] = [], activeTurns: number[] = [], idleTurns: number[] = [];
    const phaseTimes: number[] = [], activePhases: number[] = [], idlePhases: number[] = [];
    const activeMissionCounts: number[] = [];
    let mirror: GameState | undefined, midpointBytes = 0, completions = 0, resumedCommands = 0;
    for (let index = 0; index < 20; index++) {
      const active = Object.values(game.characters).filter(character => character.mission).length; activeMissionCounts.push(active);
      let phaseStart = 0, phaseMs = 0;
      const command: GameCommand = { type: 'endTurn', factionId: game.turnOwnerId };
      const start = performance.now();
      const result = applyCommand(game, command, (phase, edge) => {
        if (phase === 'characters' && edge === 'start') phaseStart = performance.now();
        if (phase === 'characters' && edge === 'end') phaseMs += performance.now() - phaseStart;
      });
      const turnMs = performance.now() - start;
      requireValue(result.ok, 'endTurn rejected: ' + result.error);
      turnTimes.push(turnMs); phaseTimes.push(phaseMs); (active ? activeTurns : idleTurns).push(turnMs); (active ? activePhases : idlePhases).push(phaseMs);
      completions += result.events.filter(event => event.type === 'character_mission_completed').length;
      if (mirror) {
        requireValue(JSON.stringify(issue(mirror, command)) === JSON.stringify(result), 'mid-mission resumed result/events diverged');
        requireValue(stateHash(game) === stateHash(mirror), 'mid-mission resumed state diverged'); resumedCommands++;
      }
      if (index === 0) {
        requireValue(Object.values(game.characters).filter(character => character.mission?.remainingTurns === 1).length === engineers.length, 'missing active midpoint missions');
        const saved = serializeGame(game); midpointBytes = Buffer.byteLength(saved); mirror = deserializeGame(saved);
        requireValue(stateHash(mirror) === stateHash(game), 'mid-mission save changed canonical state');
      }
    }
    const restoredStrength = strength() - initialStrength;
    requireValue(completions === engineers.length && restoredStrength === engineers.length * refit.strengthRestore, 'real refits did not complete with exact formation healing');
    requireValue(Object.values(game.characters).every(character => character.mission === null), 'missions unexpectedly remain active');
    requireValue(engineers.every(id => game.characters[id]!.experience === refit.experience), 'refit experience differs from content');
    const saveStart = performance.now(), saved = serializeGame(game), saveMs = performance.now() - saveStart;
    const loadStart = performance.now(), restored = deserializeGame(saved), loadMs = performance.now() - loadStart;
    requireValue(stateHash(restored) === stateHash(game), 'final save roundtrip diverged');
    return { size, synthetic: true, cells: game.world.terrain.length, factions: game.factions.length, armies: armyCount,
      formations: Object.values(game.armies).reduce((sum, army) => sum + army.formations.length, 0), characters: Object.keys(game.characters).length,
      charactersPerFaction: 32, rolesPerFaction: { marshal: 11, surveyor: 11, engineer: 10 }, authoredDamagedGuards: game.factions.length * 11,
      setupCommands, appointmentCoin, missionCoin, rejectedCommands: 0, idleReadModels, activeReadModels,
      turns: 20, activeMissionCounts, fullEndTurn: distribution(turnTimes), activeEndTurn: distribution(activeTurns), idleEndTurn: distribution(idleTurns),
      characterPhase: distribution(phaseTimes), activeCharacterPhase: distribution(activePhases), idleCharacterPhase: distribution(idlePhases),
      completedRefits: completions, restoredFormationStrength: restoredStrength, experiencePerEngineer: refit.experience,
      midpointBytes, resumedCommands, saveBytes: Buffer.byteLength(saved), saveMs, loadMs, finalHash: stateHash(game),
      note: 'Synthetic mature 1500/4000 singleton armies (48 in smoke), one owned town per faction and 100000 starting coin. Eleven guards per seat lose ten strength before validation; 32 normally paid appointments join those guards, respecting one marshal/two companions. Ten engineers per seat begin paid two-turn stationary refits. Timings exclude all setup, recruitment, mission orders, JSON/hash validation and separately executed mirrors. Active and idle turn counts are distinct; no fake perpetual missions, invasion AI, full campaign or archive timing. Save continuation verifies 19 subsequent real endTurn results/events and hashes after a first-turn active-mission save.' };
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  requireValue(process.argv.slice(2).every(argument => argument === '--smoke'), 'supported argument: --smoke');
  console.log(JSON.stringify({ runtime: process.version, cpu: cpus()[0]?.model, os: platform() + ' ' + release(), measurements: benchmarkCharacters({ smoke: process.argv.includes('--smoke') }) }, null, 2));
}
