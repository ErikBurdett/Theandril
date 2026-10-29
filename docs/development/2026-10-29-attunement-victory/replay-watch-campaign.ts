import { applyCommand, createGame, getObservation, type GameState } from '../../../packages/sim/src/index';
import { withRules, type RulesVersion } from '../../../packages/sim/src/rules';
import { aiObservationOptions, planTurn, planTurnWithReasons } from '../../../packages/ai/src/index';
import { RECOMMENDED_FACTION_COUNTS } from '../../../packages/mapgen/src/index';

const factionCount = Number(process.env.FC ?? RECOMMENDED_FACTION_COUNTS.tiny);
function run(rules?: RulesVersion) {
  const state: GameState = createGame({ seed: 20260905, size: 'tiny', factionCount, pace: 'short', ...(rules ? { rulesVersion: rules } : {}) });
  const log: string[] = [];
  const reasons: string[] = [];
  const settle = () => {
    for (let guard = 0; (state.battle || state.pendingCapture) && guard < 8; guard++) {
      if (state.battle) { const b = state.battle; const controller = [b.attackerFactionId, b.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : b.attackerFactionId; applyCommand(state, { type: 'autoResolveBattle', factionId: controller }); }
      else if (state.pendingCapture) { const c = planTurn(getObservation(state, state.pendingCapture.factionId, aiObservationOptions(state.turn))).find(x => x.type === 'resolveCapture'); if (c) applyCommand(state, c); else break; }
    }
  };
  const play = () => {
    for (let round = 0; round < 400 && !state.victory; round++) {
      settle();
      for (const faction of state.factions) {
        if (state.victory) break;
        const plan = planTurnWithReasons(getObservation(state, faction.id, aiObservationOptions(state.turn)));
        for (const command of plan.commands) {
          if (state.victory) break;
          const r = applyCommand(state, command);
          log.push(`${state.turn} ${faction.id} ${JSON.stringify(command)} ${r.ok ? 'ok' : 'REFUSED ' + r.error}`);
          settle();
        }
        reasons.push(`${state.turn} ${faction.id} :: ${plan.reasons.join(' | ')}`);
      }
      if (!state.victory) applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId });
    }
    return { turn: state.turn, path: state.victory?.path, log, reasons };
  };
  return rules ? withRules(state, rules, play) : play();
}
const a = run(37), b = run();
console.log('factionCount', factionCount, 'rules37 turn', a.turn, a.path, '| rules38 turn', b.turn, b.path);
let i = 0; while (i < a.log.length && i < b.log.length && a.log[i] === b.log[i]) i++;
console.log('first divergence at command index', i, 'of', a.log.length, b.log.length);
console.log('37:', a.log.slice(i, i + 4).join('\n    '));
console.log('38:', b.log.slice(i, i + 4).join('\n    '));
const turnAt = Number((b.log[i] ?? a.log[i] ?? '0').split(' ')[0]);
console.log('--- rules 38 reasons around turn', turnAt);
for (const line of b.reasons.filter(l => Number(l.split(' ')[0]) === turnAt)) console.log(line.slice(0, 600));
console.log('--- rules 37 reasons around turn', turnAt);
for (const line of a.reasons.filter(l => Number(l.split(' ')[0]) === turnAt)) console.log(line.slice(0, 600));
