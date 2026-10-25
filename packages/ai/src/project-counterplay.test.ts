import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import * as sim from '@theandril/sim';
import { applyCommand, deserializeGame, getBesiegePreview, getObservation, serializeGame, stateHash, stateHashForVersion, type GameCommand, type GameState } from '@theandril/sim';
import { createJournal, replayArchive } from '../../chronicle/src';
import { withRules } from '../../sim/src/rules';
import { planTurnWithReasons } from './index';
import { reviewProjectCounterplay } from './project-counterplay';
import { protectedFactions } from './diplomacy';

const actor = 'faction.reedbound_council', rival = 'faction.ashen_compact', armyId = 'army.4', settlementId = 'settlement.5';
const folder = new URL('../../../docs/development/2026-10-24-project-counterplay/', import.meta.url);
const initial = readFileSync(new URL('near-complete.theandril', folder), 'utf8');
const siege: GameCommand = { type: 'besiege', factionId: actor, armyId, settlementId };
const load = () => deserializeGame(initial);
function offer(game: GameState, requestCoin = 0) {
  expect(applyCommand(game, { type: 'proposePeace', factionId: rival, targetFactionId: actor, terms: { offerCoin: 0, requestCoin, truceTurns: 10 } }).ok).toBe(true);
}
function executeRound(game: GameState, commands: GameCommand[]) {
  const mirror = deserializeGame(serializeGame(game)), journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
  const before = getObservation(game, actor), quote = getBesiegePreview(before, armyId, settlementId);
  for (const command of [...commands, { type: 'endTurn', factionId: game.turnOwnerId } as GameCommand]) {
    const result = journal.record(game, command);
    expect(result.ok, result.error).toBe(true); expect(applyCommand(mirror, command)).toEqual(result);
    expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
    if (command.type === 'respondPeace' && !command.accept) {
      const after = getObservation(game, actor);
      for (const key of ['armies', 'settlements', 'wars', 'sieges', 'visibleSiegeSettlementIds', 'routes', 'postings', 'characters', 'theaters', 'patrols', 'projects', 'supply', 'treasury', 'battle', 'pendingCapture', 'victory'] as const) expect(after[key], key).toEqual(before[key]);
      expect(getBesiegePreview(after, armyId, settlementId)).toEqual(quote);
    }
  }
  expect(stateHash(mirror)).toBe(stateHash(game));
  expect(stateHash(replayArchive(journal.materialize()))).toBe(stateHash(game));
}

describe('immediate project counterplay', () => {
  it.each(['white peace', 'unaffordable demand'] as const)('rejects %s and besieges in one ordinary batch before the enemy can win', kind => {
    const game = load(); expect(stateHashForVersion(game, 35)).toBe('c705fc04');
    offer(game, kind === 'unaffordable demand' ? getObservation(game, actor).treasury + 1 : 0);
    const view = getObservation(game, actor), before = structuredClone(view), plan = planTurnWithReasons(view);
    expect(plan.commands).toEqual([{ type: 'respondPeace', factionId: actor, offerId: game.diplomacy.offers[0]!.id, accept: false }, siege]);
    expect(view).toEqual(before); expect(plan.reasons.join(' ')).toContain('1 turns remaining');
    // One realm planning pass and one real end turn: no manual second plan.
    executeRound(game, plan.commands);
    expect(game.projects[0]).toMatchObject({ status: 'paused', progress: 4 }); expect(game.victory).toBeNull();
  });

  it('executes the legal interruption instead of proposing outgoing peace', () => {
    const game = load(), plan = planTurnWithReasons(getObservation(game, actor));
    expect(plan.commands).toEqual([siege]); executeRound(game, plan.commands);
    expect(game.projects[0]).toMatchObject({ status: 'paused', progress: 4 }); expect(game.victory).toBeNull();
  });

  it('does not depend on outgoing peace eligibility or an expired refusal cooldown', () => {
    const game = load(); offer(game);
    expect(applyCommand(game, { type: 'respondPeace', factionId: actor, offerId: game.diplomacy.offers[0]!.id, accept: false }).ok).toBe(true);
    expect(planTurnWithReasons(getObservation(game, actor)).commands).toEqual([siege]);
  });

  it('retains affordable peace when its own paid project wins strictly sooner', () => {
    const game = deserializeGame(readFileSync(new URL('own-faster-near.theandril', folder), 'utf8')); offer(game);
    const view = getObservation(game, actor);
    expect(view.projects.map(project => [project.factionId, project.progress])).toEqual([[actor, 4], [rival, 3]]);
    expect(getBesiegePreview(view, armyId, settlementId).canBesiege).toBe(true);
    expect(reviewProjectCounterplay(view, protectedFactions(view)).siegeQueries).toBe(0);
    const plan = planTurnWithReasons(view);
    expect(plan.commands).toEqual([{ type: 'respondPeace', factionId: actor, offerId: game.diplomacy.offers[0]!.id, accept: true }]);
    executeRound(game, plan.commands); expect(game.victory?.factionId).toBe(actor);
  });

  it('keeps the ordinary peace decision when real movement leaves no available interruption', () => {
    const game = load();
    const evidence = JSON.parse(readFileSync(new URL('branch-evidence.json', folder), 'utf8')) as { blocked: { history: { command: GameCommand }[] } };
    const move = evidence.blocked.history[0]!.command; expect(move.type).toBe('moveTo');
    expect(applyCommand(game, move).ok).toBe(true); expect(game.armies[armyId]!.movement).toBe(0);
    expect(getBesiegePreview(getObservation(game, actor), armyId, settlementId).canBesiege).toBe(false);
    offer(game); const plan = planTurnWithReasons(getObservation(game, actor));
    expect(plan.commands).toEqual([{ type: 'respondPeace', factionId: actor, offerId: game.diplomacy.offers[0]!.id, accept: true }]);
  });

  it('retains historical incoming and outgoing decisions without the modern capability', () => {
    const game = load();
    const old = withRules(game, 34, () => getObservation(game, actor));
    expect(old).not.toHaveProperty('siegeEstablishment');
    expect(planTurnWithReasons(old).commands[0]?.type).toBe('proposePeace');
    offer(game);
    const incoming = withRules(game, 34, () => getObservation(game, actor));
    expect(planTurnWithReasons(incoming).commands).toEqual([{ type: 'respondPeace', factionId: actor, offerId: game.diplomacy.offers[0]!.id, accept: true }]);
  });

  it('keeps identical permitted facts independent of collection order and does not mutate observations', () => {
    const view = getObservation(load(), actor), before = structuredClone(view), expected = reviewProjectCounterplay(view, protectedFactions(view));
    expect(view).toEqual(before);
    const reversed = structuredClone(view);
    reversed.armies.reverse(); reversed.settlements.reverse(); reversed.cells.reverse(); reversed.projects.reverse(); reversed.wars.reverse();
    expect(reviewProjectCounterplay(reversed, protectedFactions(reversed))).toEqual(expected);
  });

  // These are observation contracts, not fabricated alternate campaign histories.
  it.each(['spent', 'morale', 'fatigue', 'agents', 'direct', 'posting', 'hidden', 'paused', 'distant-deadline', 'binding', 'mission', 'theater', 'patrol', 'naval', 'carried', 'founder', 'scout', 'command', 'global-busy'] as const)('preserves the %s boundary', kind => {
    const view = getObservation(load(), actor), army = view.armies.find(army => army.id === armyId)!;
    if (kind === 'spent') army.movement = 0;
    if (kind === 'morale') army.morale = 34;
    if (kind === 'fatigue') army.fatigue = 66;
    if (kind === 'agents') army.agents.push({ id: 'character.contract', name: 'Authored agent', definitionId: 'character.engineer', role: 'engineer', status: 'ready', rank: 1, experience: 0, skillId: null, learnedSkillIds: [], woundedTurns: 0 });
    if (kind === 'direct') view.routes.push({ armyId, origin: army.cell, waypoints: [0], path: [army.cell, 0], status: 'paused', pauseReason: 'Authored route control', knownHostileIds: [] });
    if (kind === 'posting') view.postings.push({ armyId, factionId: actor, cell: army.cell, mode: 'hold', arrived: true, blocker: null });
    if (kind === 'hidden') view.settlements = view.settlements.filter(town => town.id !== settlementId);
    if (kind === 'paused') view.projects[0]!.status = 'paused';
    if (kind === 'distant-deadline') view.projects[0]!.requiredTurns = view.projects[0]!.progress + 11;
    if (kind === 'mission') army.movementBlocker = 'Authored stationary mission';
    if (kind === 'theater') view.theaters = [{ id: 'theater.contract', factionId: actor, name: 'Authored watch', enabled: true, armyIds: [armyId], settlementIds: [], reserveCell: army.cell, guardsPerSettlement: 1, reinforcementLimit: 0, lastRunTurn: null, lastDispatches: [], hearths: [], members: [], missingGuards: 0, blocker: null }];
    if (kind === 'patrol') view.patrols = [{ armyId, factionId: actor, enabled: true, firstCell: army.cell, secondCell: 488, target: 'second', targetCell: 488, pauseOnWar: false, lastAttemptTurn: null, lastError: null, status: 'waiting', blocker: null }];
    if (kind === 'naval') army.domain = 'naval';
    if (kind === 'carried') army.carrierId = 'army.carrier';
    if (kind === 'founder') army.canFound = true;
    if (kind === 'scout') army.formations[0]!.unitId = 'unit.scout';
    if (kind === 'command') army.commandBlocker = 'Authored command limit';
    if (kind === 'global-busy') view.strategicCommandBlocker = 'Resolve the pending battle before issuing strategic commands.';
    const result = reviewProjectCounterplay(view, kind === 'binding' ? new Set([rival]) : protectedFactions(view));
    expect(result.command).toBeNull(); expect(result.siegeQueries).toBe(0);
    if (kind === 'global-busy') expect(planTurnWithReasons(view).commands).toEqual([]);
  });

  it('bounds the entire incoming diplomacy pass to four real quotes on a stale-visibility observation contract', () => {
    const game = load(); offer(game); const view = getObservation(game, actor), source = view.armies.find(army => army.id === armyId)!;
    view.armies = Array.from({ length: 128 }, (_, index) => ({ ...structuredClone(source), id: `army.contract.${String(index).padStart(3, '0')}` }));
    view.cells.find(cell => cell.cell === 488)!.visible = false;
    const spy = vi.spyOn(sim, 'getBesiegePreview');
    try {
      const plan = planTurnWithReasons(view);
      expect(spy).toHaveBeenCalledTimes(4);
      expect(plan.commands).toEqual([{ type: 'respondPeace', factionId: actor, offerId: game.diplomacy.offers[0]!.id, accept: true }]);
    } finally { spy.mockRestore(); }
  });

  it('considers at most eight of 128 authored active project records without local actors', () => {
    const view = getObservation(load(), actor), project = view.projects[0]!;
    view.projects = Array.from({ length: 128 }, (_, index) => ({ ...project, id: `project.contract.${index}` })); view.armies = [];
    const result = reviewProjectCounterplay(view, protectedFactions(view));
    expect(result.consideredProjects).toBe(8); expect(result.siegeQueries).toBe(0); expect(result.command).toBeNull();
  });
});
