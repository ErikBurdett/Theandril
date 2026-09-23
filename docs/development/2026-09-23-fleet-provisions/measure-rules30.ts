/** Historical comparison: current planner consuming the frozen rules30 public contract. */
import { withRules } from '../../../packages/sim/src/rules';
import { applyCommandForVersion, createGame, getObservation, type GameCommand, type GameState } from '../../../packages/sim/src/index';
import { planTurn } from '../../../packages/ai/src/index';
import type { CampaignPace } from '../../../packages/content/src/index';

/** Local pacing measurement. Runs AI campaigns to their victory and reports the
 * turn each one ended on, so a rules or AI change can be judged against the
 * campaign length the design actually targets instead of against a test bound.
 *
 * This is a local tool. It plays whole campaigns and takes minutes; it is never
 * run in CI, which only verifies that the project builds.
 *
 * The headline case is the one that matters. `docs/1.0-DEVELOPMENT.md` targets
 * about 200 turns for Standard, 300 for Long and 350–400 for Epic on a full map
 * with twelve realms. The `proxy` cases are the four-realm tiny campaigns the
 * pacing tests play for speed: they are noisy, they end sooner, and their bounds
 * are derived from this tool rather than defended on their own.
 *
 *   pnpm measure:pacing              # the headline Epic campaign
 *   pnpm measure:pacing headline standard long
 *   pnpm measure:pacing all
 */
interface Case { name: string; pace: CampaignPace; seed: number; size: 'tiny' | 'standard'; seats: number; target: string }

const CASES: readonly Case[] = [
  { name: 'headline', pace: 'epic', seed: 20260905, size: 'standard', seats: 12, target: '350–400 turns' },
  { name: 'headline-long', pace: 'long', seed: 20260905, size: 'standard', seats: 12, target: 'about 300 turns' },
  { name: 'headline-standard', pace: 'standard', seed: 20260905, size: 'standard', seats: 12, target: 'about 200 turns' },
  { name: 'proxy-epic', pace: 'epic', seed: 74, size: 'tiny', seats: 4, target: 'pacing-epic.test.ts bound' },
  { name: 'proxy-epic-chronicle', pace: 'epic', seed: 20260905, size: 'tiny', seats: 4, target: 'chronicle-victory.test.ts bound' },
  { name: 'proxy-long', pace: 'long', seed: 99, size: 'tiny', seats: 4, target: 'pacing.test.ts bound' },
  { name: 'proxy-standard', pace: 'standard', seed: 74, size: 'tiny', seats: 4, target: 'pacing.test.ts bound' },
];

const MAX_ROUNDS = 900;

function play(entry: Case): { turn: number; path: string; refused: number; depots: number } {
  const state: GameState = createGame({ rulesVersion: 30, seed: entry.seed, pace: entry.pace, size: entry.size, factionCount: entry.seats });
  let refused = 0;
  const issue = (command: GameCommand): void => {
    const result = applyCommandForVersion(state, command, 30);
    if (!result.ok) { refused++; process.stderr.write(`  refused at turn ${state.turn}: ${JSON.stringify(command)}: ${result.error}\n`); }
  };
  for (let round = 0; round < MAX_ROUNDS && !state.victory; round++) {
    for (const faction of state.factions) {
      for (const command of planTurn(withRules(state, 30, () => getObservation(state, faction.id)))) {
        issue(command);
        for (let decisions = 0; state.battle || state.pendingCapture; decisions++) {
          if (decisions >= 4) throw new Error('Pending tactical or capture decisions exceeded their bound.');
          if (state.battle) {
            const battle = state.battle;
            const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId;
            issue({ type: 'autoResolveBattle', factionId: controller });
          } else if (state.pendingCapture) {
            const choice = planTurn(withRules(state, 30, () => getObservation(state, state.pendingCapture!.factionId)))[0];
            if (!choice || choice.type !== 'resolveCapture') throw new Error('Missing capture choice.');
            issue(choice);
          }
        }
      }
    }
    issue({ type: 'endTurn', factionId: state.turnOwnerId });
  }
  return { turn: state.turn, path: state.victory?.path ?? 'none', refused, depots: state.depots.length };
}

const requested = process.argv.slice(2);
const selected = requested.length === 0 ? CASES.filter(entry => entry.name === 'headline')
  : requested.includes('all') ? CASES
    : CASES.filter(entry => requested.includes(entry.name) || requested.includes(entry.name.replace('headline-', '')));
if (!selected.length) {
  process.stderr.write(`Unknown case. Available: ${CASES.map(entry => entry.name).join(', ')}, all\n`);
  process.exit(1);
}
for (const entry of selected) {
  process.stdout.write(`${entry.name} (${entry.pace}, ${entry.size}, ${entry.seats} realms, seed ${entry.seed}) — target ${entry.target}\n`);
  const started = Date.now();
  const result = play(entry);
  process.stdout.write(`  turn ${result.turn} · ${result.path} · ${result.depots} depots · ${result.refused} refused orders · ${Math.round((Date.now() - started) / 1000)}s\n`);
  if (result.path === 'none') process.stdout.write('  NO VICTORY within the round cap: the campaign did not resolve.\n');
  if (result.refused) process.stdout.write('  REFUSED ORDERS: the planner asked for something the rules do not allow.\n');
}
