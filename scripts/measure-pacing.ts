import { writeFileSync } from 'node:fs';
import { applyCommand, createGame, getObservation, stateHashForVersion, type GameCommand, type GameState } from '../packages/sim/src/index';
import { rulesVersion, withRules, type RulesVersion } from '../packages/sim/src/rules';
import { planTurn } from '../packages/ai/src/index';
import type { CampaignPace } from '../packages/content/src/index';

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

function play(entry: Case, rules?: RulesVersion) {
  const state: GameState = createGame({ seed: entry.seed, pace: entry.pace, size: entry.size, factionCount: entry.seats, ...(rules ? { rulesVersion: rules } : {}) });
  // Generation selects an origin; historical execution is explicitly scoped.
  // Keep observations, AI capabilities, commands and the final seal together.
  return withRules(state, rules ?? rulesVersion(state), () => playCampaign(state));
}

function playCampaign(state: GameState) {
  let refused = 0, automaticRefusals = 0, theaterDispatches = 0, reinforcementPhases = 0, dispatchesToThreatenedHearths = 0;
  const commands: Record<string, number> = {}, events: Record<string, number> = {};
  const issue = (command: GameCommand): void => {
    const result = applyCommand(state, command);
    commands[command.type] = (commands[command.type] ?? 0) + 1;
    for (const event of result.events) {
      events[event.type] = (events[event.type] ?? 0) + 1;
      if (event.type === 'theater_dispatch_blocked') automaticRefusals++;
    }
    if (result.ok && command.type === 'endTurn') for (const theater of state.theaters) {
      if (!theater.enabled || theater.lastRunTurn !== state.turn) continue;
      const holds = theater.reinforcementHolds ?? [], heldCells = new Set(holds.map(hold => state.settlements[hold.settlementId]?.cell));
      if (holds.length) reinforcementPhases++;
      for (const dispatch of theater.lastDispatches) if (dispatch.accepted) {
        theaterDispatches++;
        if (heldCells.has(dispatch.targetCell)) dispatchesToThreatenedHearths++;
      }
    }
    if (!result.ok) { refused++; process.stderr.write(`  refused at turn ${state.turn}: ${JSON.stringify(command)}: ${result.error}\n`); }
  };
  for (let round = 0; round < MAX_ROUNDS && !state.victory; round++) {
    for (const faction of state.factions) {
      for (const command of planTurn(getObservation(state, faction.id))) {
        issue(command);
        for (let decisions = 0; state.battle || state.pendingCapture; decisions++) {
          if (decisions >= 4) throw new Error('Pending tactical or capture decisions exceeded their bound.');
          if (state.battle) {
            const battle = state.battle;
            const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId;
            issue({ type: 'autoResolveBattle', factionId: controller });
          } else if (state.pendingCapture) {
            const choice = planTurn(getObservation(state, state.pendingCapture.factionId))[0];
            if (!choice || choice.type !== 'resolveCapture') throw new Error('Missing capture choice.');
            issue(choice);
          }
        }
      }
    }
    issue({ type: 'endTurn', factionId: state.turnOwnerId });
  }
  return { rulesVersion: rulesVersion(state), turn: state.turn, path: state.victory?.path ?? 'none', winner: state.victory?.factionId ?? null,
    refused, automaticRefusals, theaterDispatches, reinforcementPhases, dispatchesToThreatenedHearths, depots: state.depots.length, stateHash: stateHashForVersion(state, rulesVersion(state)), commands, events };
}

const args = process.argv.slice(2);
const option = (name: string) => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const requested = args.filter(arg => !arg.startsWith('--'));
const seeds = option('seeds')?.split(',').map(Number);
const versions = option('rules')?.split(',').map(Number) as RulesVersion[] | undefined;
if (args.some(arg => arg.startsWith('--') && !/^--(seeds|rules|json)=/.test(arg))
  || seeds?.some(seed => !Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff)
  || versions?.some(version => version !== 33 && version !== 34)) throw new Error('Use --seeds=uint32,... --rules=33,34 (one or both versions) --json=path.');
const selected = requested.length === 0 ? CASES.filter(entry => entry.name === 'headline')
  : requested.includes('all') ? CASES
    : CASES.filter(entry => requested.includes(entry.name) || requested.includes(entry.name.replace('headline-', '')));
if (!selected.length) {
  process.stderr.write(`Unknown case. Available: ${CASES.map(entry => entry.name).join(', ')}, all\n`);
  process.exit(1);
}
const results = [];
for (const original of selected) for (const seed of seeds ?? [original.seed]) for (const rules of versions ?? [undefined]) {
  const entry = { ...original, seed };
  process.stdout.write(`${entry.name} (${entry.pace}, ${entry.size}, ${entry.seats} realms, seed ${entry.seed}, rules ${rules ?? 'current'}) — target ${entry.target}\n`);
  const started = Date.now();
  const result = play(entry, rules);
  results.push({ ...entry, ...result, elapsedMs: Date.now() - started });
  if (option('json')) writeFileSync(option('json')!, JSON.stringify({ maxRounds: MAX_ROUNDS, results }, null, 2) + '\n');
  process.stdout.write(`  turn ${result.turn} · ${result.path} · ${result.depots} depots · ${result.refused} refused orders · ${result.automaticRefusals} automatic refusals · ${Math.round((Date.now() - started) / 1000)}s\n`);
  if (result.path === 'none') process.stdout.write('  NO VICTORY within the round cap: the campaign did not resolve.\n');
  if (result.refused) process.stdout.write('  REFUSED ORDERS: the planner asked for something the rules do not allow.\n');
}
