/** Bounded diagnostic, outside test discovery. Executes complete AI proposal
 * batches once per realm per round, matching worker observation/capture policy.
 * Player scenarios leave the human seat idle after any initial ordinary offer.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { aiObservationOptions, planTurnWithReasons } from '../../../packages/ai/src';
import { deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '../../../packages/sim/src';
import { createJournal, replayArchive } from '../../../packages/chronicle/src';

const folder = new URL('./', import.meta.url);
const input = readFileSync(new URL('near-complete.theandril', folder), 'utf8');
const actor = 'faction.reedbound_council', rival = 'faction.ashen_compact';
const cases = [];
for (const mode of ['player', 'watch'] as const) for (const initialOffer of [false, true]) {
  const game = deserializeGame(input), journal = createJournal(game, { mode, coverage: 'from-save' });
  const history: unknown[] = [], plans: unknown[] = [], rounds: unknown[] = [];
  const snapshot = () => ({ turn: game.turn, hash: stateHash(game), projects: structuredClone(game.projects), sieges: structuredClone(game.sieges), victory: structuredClone(game.victory), wars: structuredClone(game.wars), offers: structuredClone(game.diplomacy.offers), treaties: structuredClone(game.diplomacy.treaties) });
  const issue = (command: GameCommand) => {
    const turn = game.turn, result = journal.record(game, command);
    history.push({ turn, command, result, hash: stateHash(game) });
    return result;
  };
  const settle = () => {
    for (let attempts = 0; !game.victory && (game.battle || game.pendingCapture); attempts++) {
      assert(attempts < 8, 'Unexpected tactical loop');
      if (game.pendingCapture) {
        if (mode === 'player' && game.pendingCapture.factionId === game.turnOwnerId) return 'player capture';
        const plan = planTurnWithReasons(getObservation(game, game.pendingCapture.factionId, aiObservationOptions(game.turn)));
        const choice = plan.commands.find(command => command.type === 'resolveCapture' && command.settlementId === game.pendingCapture!.settlementId);
        assert(choice, 'Missing ordinary capture proposal'); assert(issue(choice).ok);
      } else if (game.battle) {
        const battle = game.battle, involvesSeat = [battle.attackerFactionId, battle.defenderFactionId].includes(game.turnOwnerId);
        if (mode === 'player' && involvesSeat) return 'player battle';
        assert(issue({ type: 'autoResolveBattle', factionId: involvesSeat ? game.turnOwnerId : battle.attackerFactionId }).ok);
      }
    }
    return null;
  };
  if (initialOffer) assert(issue({ type: 'proposePeace', factionId: rival, targetFactionId: actor, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } }).ok);
  let stopped: string | null = null;
  for (let round = 1; round <= 5 && !game.victory && !stopped; round++) {
    const before = snapshot();
    for (const faction of game.factions) {
      if (mode === 'player' && faction.id === game.turnOwnerId) continue;
      if (game.victory) break;
      const view = getObservation(game, faction.id, aiObservationOptions(game.turn));
      const plan = planTurnWithReasons(view);
      plans.push({ round, turn: game.turn, factionId: faction.id, visibleProjects: view.projects, ownSieges: view.sieges, commands: plan.commands, reasons: plan.reasons });
      for (const command of plan.commands) {
        issue(command);
        stopped = settle();
        if (stopped || game.victory) break;
      }
      if (stopped) break;
    }
    if (!stopped && !game.victory) assert(issue({ type: 'endTurn', factionId: game.turnOwnerId }).ok);
    rounds.push({ round, before, after: snapshot() });
    if (round === 1) writeFileSync(new URL(`maintained-${mode}-${initialOffer ? 'incoming' : 'no-offer'}-after-first.theandril`, folder), serializeGame(game));
  }
  const archive = journal.materialize();
  writeFileSync(new URL(`maintained-${mode}-${initialOffer ? 'incoming' : 'no-offer'}-archive.json`, folder), JSON.stringify(archive, null, 2) + '\n');
  assert.equal(stateHash(replayArchive(archive)), stateHash(game));
  assert.equal(stateHash(deserializeGame(serializeGame(game))), stateHash(game));
  cases.push({ mode, initialOffer, initialHash: stateHash(deserializeGame(input)), rounds, plans, history, stopped, final: snapshot(), exactReplay: true, records: archive.records.length });
}
const evidence = { scope: 'At most five complete one-plan-per-realm rounds from the retained authored tiny fixture; no proposals suppressed. Player seat remains idle after the optional ordinary initial offer. All state snapshots are diagnostic global facts; AI uses getObservation with worker aiObservationOptions.', inputSha256: createHash('sha256').update(input).digest('hex'), cases };
writeFileSync(new URL('maintained-rounds-evidence.json', folder), JSON.stringify(evidence, null, 2) + '\n');
for (const item of cases) console.log(JSON.stringify({ mode: item.mode, initialOffer: item.initialOffer, finalTurn: item.final.turn, victory: item.final.victory, stopped: item.stopped, rounds: item.rounds.length, records: item.records, exactReplay: item.exactReplay, plans: item.plans }));
