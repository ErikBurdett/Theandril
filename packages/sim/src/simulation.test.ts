import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { isPassable, neighbors } from '@theandril/mapgen';
import { BUILDINGS, UNITS } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, getObservation, replayGame, serializeGame, stateHash, validateEndTurn } from './index';
import type { GameCommand, GameState } from './index';

const player = 'faction.ashen_compact';
const rival = 'faction.reedbound_council';
const endTurn: GameCommand = { type: 'endTurn', factionId: player };
function found(state: GameState, factionId = player): string {
  const colonist = Object.values(state.armies).find(army => army.factionId === factionId && army.formations[0]?.unitId === 'unit.colonist');
  if (!colonist) throw new Error('No colonist in test');
  expect(applyCommand(state, { type: 'found', factionId, armyId: colonist.id, name: 'Hearth ' + factionId }).ok).toBe(true);
  const settlement = Object.values(state.settlements).find(town => town.factionId === factionId);
  if (!settlement) throw new Error('No settlement in test');
  return settlement.id;
}

describe('canonical campaign commands', () => {
  it('preflights end-turn requests before AI with exactly the resolution rules and no mutation', () => {
    const state = createGame({ seed: 42, size: 'tiny', factionCount: 2 });
    const before = stateHash(state);
    expect(validateEndTurn(state, endTurn)).toEqual({ ok: true, events: [] });
    for (const command of [
      { ...endTurn, treasury: 1_000_000 },
      { type: 'endTurn', factionId: rival },
      { type: 'endTurn', factionId: 'faction.missing' },
      null,
    ]) {
      expect(validateEndTurn(state, command)).toEqual(applyCommand(state, command));
      expect(validateEndTurn(state, command).ok).toBe(false);
      expect(stateHash(state)).toBe(before);
    }
    expect(validateEndTurn(state, { type: 'move', factionId: player, armyId: 'army.1', target: 0 }).error).toMatch(/Expected an end-turn/);
    state.turn = 1_000_000;
    const limited = stateHash(state);
    expect(validateEndTurn(state, endTurn)).toEqual(applyCommand(state, endTurn));
    expect(validateEndTurn(state, endTurn).error).toMatch(/turn limit/);
    expect(stateHash(state)).toBe(limited);
  });

  it('founds a settlement, consumes exactly its colonist, builds, grows and recruits', () => {
    const state = createGame({ seed: 42, size: 'tiny', factionCount: 2 });
    const settlementId = found(state);
    expect(Object.values(state.armies).filter(army => army.factionId === player)).toHaveLength(1);
    const moneyBefore = state.factions[0]?.treasury ?? 0;
    expect(applyCommand(state, { type: 'queue', factionId: player, settlementId, itemId: 'building.granary' }).ok).toBe(true);
    expect(state.factions[0]?.treasury).toBe(moneyBefore - (BUILDINGS.find(item => item.id === 'building.granary')?.coinCost ?? 0));
    expect(applyCommand(state, { type: 'queue', factionId: player, settlementId, itemId: 'unit.guard' }).ok).toBe(true);
    for (let turn = 0; turn < 10; turn++) expect(applyCommand(state, endTurn).ok).toBe(true);
    expect(state.settlements[settlementId]?.buildings).toContain('building.granary');
    expect(state.settlements[settlementId]?.population).toBeGreaterThan(1);
    expect(Object.values(state.armies).some(army => army.factionId === player && army.formations[0]?.unitId === 'unit.guard')).toBe(true);
    // Ten turns: 1 core knowledge + 1 worked-center knowledge + 1 capital knowledge.
    expect(state.factions[0]?.knowledge).toBe(30);
    expect(state.events.some(event => event.type === 'unit_recruited')).toBe(true);
  });

  it('rejects forged ownership, unknown fields and invalid references atomically', () => {
    const state = createGame({ seed: 42, size: 'tiny', factionCount: 2 });
    const town = found(state);
    const foreignArmy = Object.values(state.armies).find(army => army.factionId === rival);
    const scout = Object.values(state.armies).find(army => army.factionId === player);
    const invalid: unknown[] = [
      null, [], { type: 'grantCoins', factionId: player, amount: 100 },
      { ...endTurn, treasury: 999 }, { type: 'endTurn', factionId: rival },
      { type: 'found', factionId: player, armyId: scout?.id, name: 'Impossible' },
      { type: 'found', factionId: player, armyId: foreignArmy?.id, name: 'Stolen' },
      { type: 'move', factionId: player, armyId: foreignArmy?.id, target: 0 },
      { type: 'move', factionId: player, armyId: scout?.id, target: -1 },
      { type: 'move', factionId: player, armyId: scout?.id, target: 349_999 },
      { type: 'queue', factionId: rival, settlementId: town, itemId: 'unit.guard' },
      { type: 'queue', factionId: player, settlementId: town, itemId: 'unit.missing' },
    ];
    for (const command of invalid) {
      const before = stateHash(state);
      expect(applyCommand(state, command).ok).toBe(false);
      expect(stateHash(state)).toBe(before);
    }
  });

  it('enforces queue capacity, coin costs, and unique buildings', () => {
    const state = createGame({ seed: 123, size: 'tiny', factionCount: 1 });
    const settlementId = found(state);
    const queue = (itemId: string) => applyCommand(state, { type: 'queue', factionId: player, settlementId, itemId });
    expect(queue('building.granary').ok).toBe(true);
    expect(queue('building.granary').ok).toBe(false);
    for (let index = 0; index < 4; index++) expect(queue('unit.scout').ok).toBe(true);
    expect(queue('unit.scout').error).toMatch(/full/);
    for (let turn = 0; turn < 15; turn++) applyCommand(state, endTurn);
    expect(queue('building.granary').ok).toBe(false);
    const poor = createGame({ seed: 123, size: 'tiny', factionCount: 1 });
    const poorTown = found(poor);
    for (let index = 0; index < 3; index++) expect(applyCommand(poor, { type: 'queue', factionId: player, settlementId: poorTown, itemId: 'unit.colonist' }).ok).toBe(true);
    expect(applyCommand(poor, { type: 'queue', factionId: player, settlementId: poorTown, itemId: 'unit.colonist' }).error).toMatch(/coin/);
  });

  it('spends terrain movement and distinguishes explored terrain from current vision', () => {
    const state = createGame({ seed: 42, size: 'tiny', factionCount: 2 });
    const scout = Object.values(state.armies).find(army => army.factionId === player && army.formations[0]?.unitId === 'unit.scout');
    if (!scout) throw new Error('Missing scout');
    const start = scout.cell;
    const prior = new Map<number, number>();
    const frontier = [start];
    prior.set(start, start);
    let destination = start;
    for (let index = 0; index < frontier.length && index < 500; index++) {
      const cell = frontier[index];
      if (cell === undefined) break;
      destination = cell;
      for (const next of neighbors(cell, state.world.width, state.world.height)) {
        if (!prior.has(next) && isPassable(state.world.terrain[next] ?? 0)) { prior.set(next, cell); frontier.push(next); }
      }
    }
    const path = [destination];
    while (destination !== start) {
      destination = prior.get(destination) ?? start;
      path.push(destination);
    }
    for (const target of path.reverse().slice(1, 14)) {
      const cost = state.world.terrain[target] === 1 ? 1 : 2;
      if (scout.movement < cost) applyCommand(state, endTurn);
      const before = scout.movement;
      expect(applyCommand(state, { type: 'move', factionId: player, armyId: scout.id, target }).ok).toBe(true);
      expect(scout.movement).toBe(before - cost);
    }
    const observation = getObservation(state, player);
    expect(observation.cells.some(cell => !cell.visible)).toBe(true);
    expect(observation.cells.length).toBeLessThan(state.world.terrain.length);
    expect(observation.events.every(event => event.factionId === player)).toBe(true);
    for (const army of observation.armies.filter(army => army.factionId !== player)) expect(observation.cells.find(cell => cell.cell === army.cell)?.visible).toBe(true);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('returns detached observations and event results', () => {
    const state = createGame({ seed: 5, size: 'tiny', factionCount: 2 });
    found(state);
    const result = applyCommand(state, endTurn);
    const before = stateHash(state);
    const observation = getObservation(state, player);
    observation.armies.splice(0);
    observation.cells.splice(0);
    observation.settlements[0]?.buildings.push('building.fake');
    if (observation.events[0]) observation.events[0].message = 'changed';
    if (result.events[0]) result.events[0].message = 'changed';
    expect(stateHash(state)).toBe(before);
  });

  it('reports phase boundaries without allowing broken telemetry to interrupt rules', () => {
    const measured = createGame({ seed: 5, size: 'tiny', factionCount: 2 });
    const plain = createGame({ seed: 5, size: 'tiny', factionCount: 2 });
    const phases: string[] = [];
    const result = applyCommand(measured, endTurn, (phase, edge) => {
      phases.push(`${phase}:${edge}`);
      if (phase === 'upkeep') throw new Error('Measurement unavailable');
    });
    expect(result.ok).toBe(true);
    expect(phases).toEqual(['sieges:start', 'sieges:end', 'settlements:start', 'settlements:end', 'upkeep:start', 'upkeep:end', 'characters:start', 'characters:end', 'movement:start', 'movement:end', 'travel:start', 'travel:end', 'diplomacy:start', 'diplomacy:end', 'progression:start', 'progression:end']);
    expect(result.diagnostics).toHaveLength(2);
    applyCommand(plain, endTurn);
    expect(stateHash(measured)).toBe(stateHash(plain));
  });

  it('replays simultaneous recruitment with double digit entity IDs across save boundaries', () => {
    const state = createGame({ seed: 981, size: 'tiny', factionCount: 8 });
    for (const faction of state.factions) {
      const settlementId = found(state, faction.id);
      expect(applyCommand(state, { type: 'queue', factionId: faction.id, settlementId, itemId: 'unit.guard' }).ok).toBe(true);
    }
    const initial = serializeGame(state);
    const loaded = deserializeGame(initial);
    for (const faction of state.factions) expect(getObservation(loaded, faction.id)).toEqual(getObservation(state, faction.id));
    for (let turn = 0; turn < 10; turn++) {
      expect(applyCommand(state, endTurn).ok).toBe(true);
      expect(applyCommand(loaded, endTurn).ok).toBe(true);
      expect(stateHash(loaded)).toBe(stateHash(state));
    }
    expect(stateHash(replayGame(initial, Array.from({ length: 10 }, () => endTurn)))).toBe(stateHash(state));
    expect(() => replayGame(initial, [{ type: 'endTurn', factionId: rival }])).toThrow(/Replay command 1 rejected/);
  });

  it('keeps resources integral, event memory bounded and seeds reproducible through long turns', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), seed => {
      const state = createGame({ seed, size: 'tiny', factionCount: 2 });
      found(state);
      for (let turn = 0; turn < 110; turn++) applyCommand(state, endTurn);
      expect(state.events.length).toBeLessThanOrEqual(200);
      for (const faction of state.factions) {
        expect(Number.isSafeInteger(faction.treasury)).toBe(true);
        expect(faction.treasury).toBeGreaterThanOrEqual(0);
      }
      expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
      const rivalScout = Object.values(state.armies).find(army => army.factionId === rival && army.formations[0]?.unitId === 'unit.scout');
      expect(rivalScout?.movement).toBe((UNITS.find(unit => unit.id === 'unit.scout')?.movement ?? 0) - 1);
    }), { numRuns: 12, seed: 909 });
  });

  it('rejects arbitrary malformed payloads without changing state', () => {
    const state = createGame({ seed: 51, size: 'tiny', factionCount: 1 });
    const before = stateHash(state);
    fc.assert(fc.property(fc.jsonValue(), command => {
      const result = applyCommand(state, command);
      expect(result.ok).toBe(false);
      expect(stateHash(state)).toBe(before);
    }), { numRuns: 100, seed: 119 });
  });
});
