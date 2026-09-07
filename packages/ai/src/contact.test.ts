import { describe, expect, it } from 'vitest';
import { RECOMMENDED_FACTION_COUNTS, type MapSize } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import type { GameCommand, GameState, Observation } from '@theandril/sim';
import { planTurn } from './index';
import { createNavigation, MAX_FRONTIER_NODES } from './navigation';

/** One real watch plan per faction per turn. No changed proposals or canonical input to AI. */
function contactCampaign(size: MapSize, factionCount: number, limit: number) {
  const game = createGame({ seed: 748291, size, factionCount, pace: 'long' });
  const firstContact = new Map(game.factions.map(faction => [faction.id, null as number | null]));
  const types = new Set<GameCommand['type']>();
  let mirror: GameState | undefined;
  let mirroredCommands = 0;
  const observe = (view: Observation): void => {
    if ([...view.armies, ...view.settlements].some(entity => entity.factionId !== view.factionId) && firstContact.get(view.factionId) === null) firstContact.set(view.factionId, view.turn);
  };
  const issue = (command: GameCommand): void => {
    const result = applyCommand(game, command);
    if (!result.ok) throw new Error(`Turn ${game.turn}: ${JSON.stringify(command)} refused: ${result.error}`);
    types.add(command.type);
    if (mirror) {
      const repeated = applyCommand(mirror, command); mirroredCommands++;
      if (JSON.stringify(repeated) !== JSON.stringify(result)) throw new Error('Resumed command result differs');
    }
  };
  const resolveDecisions = (): void => {
    for (let attempts = 0; game.battle || game.pendingCapture; attempts++) {
      if (attempts >= 4) throw new Error('Battle/capture did not terminate within the shared decision budget');
      if (game.battle) {
        const { attackerFactionId, defenderFactionId } = game.battle;
        issue({ type: 'autoResolveBattle', factionId: [attackerFactionId, defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : attackerFactionId });
      } else if (game.pendingCapture) {
        const proposals = planTurn(getObservation(game, game.pendingCapture.factionId));
        expect(proposals).toHaveLength(1);
        const command = proposals[0];
        if (command?.type !== 'resolveCapture') throw new Error('AI did not resolve the real capture decision');
        issue(command);
      }
    }
  };
  for (let round = 0; round < limit && !game.victory; round++) {
    for (const faction of game.factions) {
      if (game.victory) break;
      const view = getObservation(game, faction.id); observe(view);
      const proposals = planTurn(view);
      expect(proposals.length).toBeLessThanOrEqual(128);
      if (round % 25 === 0 && faction.id === game.turnOwnerId) {
        const before = stateHash(game);
        expect(planTurn(structuredClone(view))).toEqual(proposals);
        expect(stateHash(game)).toBe(before);
      }
      for (const command of proposals) { if (game.victory) break; issue(command); resolveDecisions(); }
      observe(getObservation(game, faction.id));
    }
    if (!game.victory) issue({ type: 'endTurn', factionId: game.turnOwnerId });
    for (const faction of game.factions) observe(getObservation(game, faction.id));
    if (game.turn === 26) mirror = deserializeGame(serializeGame(game));
    // Preserve at least60 real rounds and exercise the all-seat assertion below.
    // Player contact can precede the last faction's next legal scouting order.
    if (game.turn > 60 && [...firstContact.values()].every(turn => turn !== null)) break;
  }
  const hash = stateHash(game);
  expect(stateHash(deserializeGame(serializeGame(game)))).toBe(hash);
  expect(mirror).toBeDefined();
  expect(stateHash(mirror!)).toBe(hash);
  expect(mirroredCommands).toBeGreaterThan(0);
  return { firstContact, types, playerId: game.turnOwnerId, game };
}

describe('generated large-map faction contact', () => {
  it.each([
    ['standard', 4, 100],
    ['standard', RECOMMENDED_FACTION_COUNTS.standard, 60],
    ['huge', RECOMMENDED_FACTION_COUNTS.huge, 60],
  ] as const)('%s / %i seats makes player contact through legal bounded plans with save replay', (size, count, limit) => {
    const result = contactCampaign(size, count, limit);
    expect(result.firstContact.get(result.playerId)).not.toBeNull();
    expect(result.firstContact.get(result.playerId)!).toBeLessThanOrEqual(limit);
    expect(result.types.has('moveTo')).toBe(true);
    expect(result.types.has('mergeArmies')).toBe(true);
    expect([...result.firstContact.values()].filter(turn => turn !== null).length).toBe(count);
  });

  it('has explicit frontier work bounds and deterministic destinations from detached observed cells', () => {
    const game = createGame({ seed: 748291, size: 'huge', factionCount: 32, pace: 'long' });
    const view = getObservation(game, game.turnOwnerId);
    expect(view.cells.length).toBeLessThan(game.world.terrain.length / 100);
    const before = stateHash(game);
    // A valid synthetic remembered-land patch has no frontier within the per-army search
    // budget. Only the original local sight is visible; this never alters canonical fog.
    const visible = new Set(view.cells.filter(cell => cell.visible).map(cell => cell.cell));
    const origin = view.armies.find(army => army.factionId === view.factionId)!.cell;
    const row = Math.floor(origin / view.width), column = origin % view.width;
    const template = view.cells[0]!;
    view.cells = [];
    for (let y = Math.max(0, row - 64); y <= Math.min(view.height - 1, row + 64); y++) {
      for (let x = Math.max(0, column - 64); x <= Math.min(view.width - 1, column + 64); x++) {
        const cell = y * view.width + x;
        view.cells.push({ ...template, cell, terrain: 1, visible: visible.has(cell) });
      }
    }
    const navigation = createNavigation(view);
    const cloned = createNavigation(structuredClone(view));
    const claimed = new Set<number>();
    for (let round = 0; round < 150; round++) for (const army of view.armies.filter(army => army.factionId === view.factionId)) {
      expect(navigation.destination(army, army.sight, claimed)).toBe(cloned.destination(army, army.sight, claimed));
      expect(navigation.expandedNodes).toBeLessThanOrEqual(MAX_FRONTIER_NODES);
    }
    expect(navigation.expandedNodes).toBe(MAX_FRONTIER_NODES);
    expect(stateHash(game)).toBe(before);
  });
});
