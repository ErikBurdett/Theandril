import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { createJournal, replayArchive } from '../../chronicle/src';
import { aiObservationOptions, planTurnWithReasons } from './index';
import { protectedFactions } from './diplomacy';
import { reviewProjectCounterplay } from './project-counterplay';

const actor = 'faction.reedbound_council', rival = 'faction.ashen_compact';
const folder = new URL('../../../docs/development/2026-10-24-project-counterplay/', import.meta.url);
const load = (name: string) => deserializeGame(readFileSync(new URL(name, folder), 'utf8'));

/** Same complete proposal batches as Watch; no filtered economic/military work
 * and no extra strategic planning pass within a realm's round. */
function watchRounds(game: GameState, count: number) {
  const journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
  const commands: GameCommand[] = [];
  const rounds: { turn: number; projectStatus: string; progress: number; victory: GameState['victory']; siegeHeld: boolean }[] = [];
  const events: string[] = [];
  const issue = (command: GameCommand) => {
    commands.push(command);
    const result = journal.record(game, command);
    expect(result.ok, result.error).toBe(true);
    events.push(...result.events.map(event => event.type));
  };
  for (let round = 0; round < count && !game.victory; round++) {
    for (const faction of game.factions) {
      if (game.victory) break;
      const plan = planTurnWithReasons(getObservation(game, faction.id, aiObservationOptions(game.turn)));
      for (const command of plan.commands) {
        if (game.victory) break;
        issue(command);
        for (let decisions = 0; !game.victory && (game.battle || game.pendingCapture); decisions++) {
          expect(decisions).toBeLessThan(8);
          if (game.pendingCapture) {
            const capture = game.pendingCapture;
            const choice = planTurnWithReasons(getObservation(game, capture.factionId, aiObservationOptions(game.turn))).commands
              .find(item => item.type === 'resolveCapture' && item.settlementId === capture.settlementId);
            expect(choice).toBeDefined(); issue(choice!);
          } else if (game.battle) {
            const battle = game.battle;
            const involvesSeat = [battle.attackerFactionId, battle.defenderFactionId].includes(game.turnOwnerId);
            issue({ type: 'autoResolveBattle', factionId: involvesSeat ? game.turnOwnerId : battle.attackerFactionId });
          }
        }
      }
    }
    if (!game.victory) issue({ type: 'endTurn', factionId: game.turnOwnerId });
    rounds.push({ turn: game.turn, projectStatus: game.projects[0]!.status, progress: game.projects[0]!.progress, victory: game.victory, siegeHeld: game.sieges['settlement.5']?.factionId === actor });
  }
  expect(stateHash(replayArchive(journal.materialize()))).toBe(stateHash(game));
  expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
  return { commands, rounds, events };
}

describe('maintaining imminent-project counterplay', () => {
  it.each([false, true])('keeps the ordinary interruption through later full Watch rounds (initial offer %s)', initialOffer => {
    const game = load('near-complete.theandril');
    if (initialOffer) expect(applyCommand(game, { type: 'proposePeace', factionId: rival, targetFactionId: actor, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } }).ok).toBe(true);
    const { commands, rounds, events } = watchRounds(game, 5);
    expect(commands.some(command => command.type === 'besiege' && command.factionId === actor)).toBe(true);
    expect(commands.filter(command => command.type === 'proposePeace' && command.factionId === rival).length).toBeGreaterThanOrEqual(initialOffer ? 1 : 2);
    expect(commands.some(command => command.type === 'research')).toBe(true);
    expect(commands.some(command => command.type === 'respondPeace' && command.factionId === actor && command.accept)).toBe(false);
    expect(commands.filter(command => command.type === 'respondPeace' && command.factionId === actor && !command.accept)).toHaveLength(2);
    expect(rounds[3]).toEqual({ turn: 31, projectStatus: 'paused', progress: 4, victory: null, siegeHeld: true });
    expect(commands.some(command => command.type === 'assault')).toBe(true);
    expect(commands.some(command => command.type === 'autoResolveBattle')).toBe(true);
    // Maintaining a siege is not a promise of winning its eventual battle.
    // Keep the actual fifth-round outcome, including legitimate enemy victory.
    if (initialOffer) {
      expect(events).toContain('siege_lifted');
      expect(game.victory).toMatchObject({ factionId: rival, turn: 32 });
      expect(game.projects[0]!.status).toBe('completed');
    } else {
      expect(events).toContain('settlement_captured');
      expect(game.settlements['settlement.5']!.factionId).toBe(actor);
      expect(game.projects[0]!.status).toBe('cancelled');
      expect(game.victory).toBeNull();
    }
  });

  it('skips an outgoing treaty that would lift its siege and continues ordinary conquest planning', () => {
    const game = load('following-player-no-offer-after-first.theandril');
    const plan = planTurnWithReasons(getObservation(game, actor, aiObservationOptions(game.turn)));
    expect(plan.commands.some(command => command.type === 'proposePeace')).toBe(false);
    expect(plan.commands).toEqual([{ type: 'assault', factionId: actor, settlementId: 'settlement.5' }]);
    expect(applyCommand(game, plan.commands[0]!).ok).toBe(true);
    expect(game.battle).not.toBeNull();
  });

  it('preserves an actual own siege without quotes, mutation, or an extra besiege command', () => {
    const game = load('following-player-no-offer-after-first.theandril');
    const view = getObservation(game, actor), before = structuredClone(view);
    const review = reviewProjectCounterplay(view, protectedFactions(view));
    expect(review).toMatchObject({ command: null, peaceBlockedFactionIds: [rival], consideredProjects: 1, siegeQueries: 0 });
    expect(view).toEqual(before);
  });

  // Explicit permitted-observation contracts distinguish pause causes and visibility.
  it.each(['no-siege', 'foreign-siege', 'other-host', 'occupied', 'unseen', 'missing-host', 'foreign-owner', 'protected', 'historical'] as const)('does not preserve an unrelated %s pause', kind => {
    const game = load('following-player-no-offer-after-first.theandril'), view = getObservation(game, actor);
    if (kind === 'no-siege') view.sieges = [];
    if (kind === 'foreign-siege') view.sieges[0]!.factionId = 'faction.third-party';
    if (kind === 'other-host') view.sieges[0]!.settlementId = 'settlement.unrelated';
    if (kind === 'occupied') view.settlements.find(town => town.id === 'settlement.5')!.occupationTurns = 1;
    if (kind === 'unseen') view.cells.find(cell => cell.cell === 488)!.visible = false;
    if (kind === 'missing-host') view.settlements = view.settlements.filter(town => town.id !== 'settlement.5');
    if (kind === 'foreign-owner') view.settlements.find(town => town.id === 'settlement.5')!.factionId = 'faction.third-party';
    if (kind === 'historical') delete view.siegeEstablishment;
    const review = reviewProjectCounterplay(view, kind === 'protected' ? new Set([rival]) : protectedFactions(view));
    expect(review.command).toBeNull(); expect(review.peaceBlockedFactionIds).toEqual([]); expect(review.siegeQueries).toBe(0);
  });

  it('retains ordinary affordable peace and actual faster own victory even with an existing project siege', () => {
    const game = load('own-faster-near.theandril');
    expect(applyCommand(game, { type: 'besiege', factionId: actor, armyId: 'army.4', settlementId: 'settlement.5' }).ok).toBe(true);
    expect(applyCommand(game, { type: 'proposePeace', factionId: rival, targetFactionId: actor, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } }).ok).toBe(true);
    const view = getObservation(game, actor), review = reviewProjectCounterplay(view, protectedFactions(view));
    expect(view.projects.find(project => project.factionId === rival)!.status).toBe('paused');
    expect(review.peaceBlockedFactionIds).toEqual([]); expect(review.siegeQueries).toBe(0);
    const plan = planTurnWithReasons(view);
    expect(plan.commands).toEqual([{ type: 'respondPeace', factionId: actor, offerId: game.diplomacy.offers[0]!.id, accept: true }]);
    const journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
    for (const command of [...plan.commands, { type: 'endTurn', factionId: game.turnOwnerId } as GameCommand]) expect(journal.record(game, command).ok).toBe(true);
    expect(game.victory?.factionId).toBe(actor);
    expect(stateHash(replayArchive(journal.materialize()))).toBe(stateHash(game));
  });

  it('still reviews maintenance after four refused quotes within the shared eight-project bound', () => {
    const game = load('following-player-no-offer-after-first.theandril'), view = getObservation(game, actor);
    // Authored observation contract: seven active hosts share a hidden cell,
    // while the eighth record is the real visible host already under our siege.
    const paused = { ...view.projects[0]!, id: 'project.z-maintained' };
    view.projects = [...Array.from({ length: 7 }, (_, index) => ({ ...paused, id: `project.a${index}`, settlementId: 'settlement.hidden-contract', cell: 490, status: 'active' as const, statusReason: null })), paused];
    const host = view.settlements.find(town => town.id === 'settlement.5')!;
    view.settlements.push({ ...host, id: 'settlement.hidden-contract', cell: 490 });
    view.cells.find(cell => cell.cell === 490)!.visible = false;
    const source = view.armies.find(army => army.id === 'army.4')!;
    view.armies.push(...Array.from({ length: 128 }, (_, index) => ({ ...structuredClone(source), id: `army.contract.${String(index).padStart(3, '0')}`, movement: 3, morale: 75, fatigue: 0 })));
    const before = structuredClone(view), review = reviewProjectCounterplay(view, protectedFactions(view));
    expect(review).toMatchObject({ command: null, peaceBlockedFactionIds: [rival], consideredProjects: 8, siegeQueries: 4 });
    expect(view).toEqual(before);
    view.projects = Array.from({ length: 128 }, (_, index) => ({ ...paused, id: `project.${index}` }));
    expect(reviewProjectCounterplay(view, protectedFactions(view))).toMatchObject({ command: null, peaceBlockedFactionIds: [rival], consideredProjects: 8, siegeQueries: 0 });
  });

});
