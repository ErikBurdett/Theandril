/** Read-only counterfactual planner audit. Compiles variants in memory; never edits live rules/AI. */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { CAMPAIGN_PACES, CONTENT_HASH, UNITS, CHARACTER_DEFINITIONS } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, settlementYields, stateHash, type GameCommand, type Observation } from '@theandril/sim';
import { assessProjectHosts, type ProjectHostAssessment } from '../packages/ai/src/progression';

type Planner = (view: Observation) => GameCommand[];
type Variant = 'current' | 'no-naval' | 'old-merge' | 'old-merge-no-naval' | 'old-characters' | 'old-merge-no-naval-old-characters' | 'prechange-index-and-characters';
const variants: Variant[] = ['current', 'no-naval', 'old-merge', 'old-merge-no-naval', 'old-characters', 'old-merge-no-naval-old-characters', 'prechange-index-and-characters'];
const args = new Map(process.argv.slice(2).map(argument => { const match = /^--(case|seed|project-coin)=(.+)$/.exec(argument); if (!match) throw new Error('Use --case=<variant>, --seed=<uint32>, --project-coin=<positiveinteger>.'); return [match[1]!, match[2]!] as const; }));
const selectedCase = args.get('case');
if (selectedCase && !variants.includes(selectedCase as Variant)) throw new Error('Use --case=' + variants.join('|') + ', or omit to run all seven.');
const selected = selectedCase ? [selectedCase as Variant] : variants;
const seed = Number(args.get('seed') ?? 20260905), hypotheticalProjectCoin = args.has('project-coin') ? Number(args.get('project-coin')) : null;
if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffff_ffff || hypotheticalProjectCoin !== null && (!Number.isInteger(hypotheticalProjectCoin) || hypotheticalProjectCoin < 1 || hypotheticalProjectCoin > 1_000_000)) throw new RangeError('Invalid bounded diagnostic settings.');
// Explicit counterfactual only: the process-local object is shared by the current rules and AI.
// No file changes; resulting seals are not published-content compatibility evidence.
if (hypotheticalProjectCoin !== null) CAMPAIGN_PACES.epic.projectCoinCost = hypotheticalProjectCoin;
const localRequire = createRequire(process.cwd() + '/packages/ai/src/index.ts');
const currentSource = readFileSync('packages/ai/src/index.ts', 'utf8');
const legacyCommit = 'cb068f8198c97d91ead7d0600b34090ea64569b6';
const oldSource = (path: string): string => execFileSync('git', ['show', legacyCommit + ':' + path], { encoding: 'utf8', maxBuffer: 1_000_000, timeout: 5000 });
// The captured source is real pre-change Git evidence, not reconstructed from a desired result.
const oldIndex = oldSource('packages/ai/src/index.ts'), oldCharacters = oldSource('packages/ai/src/characters.ts');
const fingerprint = (text: string): string => createHash('sha256').update(text).digest('hex');
function compile(source: string, overrides?: (name: string) => unknown): { planTurn: Planner; planCharacters: unknown } {
  const module = { exports: {} };
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  // Execute trusted, inspected local repository source with normal local module resolution.
  new Function('require', 'exports', 'module', compiled)((name: string) => overrides?.(name) ?? localRequire(name), module.exports, module);
  return module.exports as { planTurn: Planner; planCharacters: unknown };
}
const legacyCharacters = compile(oldCharacters);
function planner(variant: Variant): Planner {
  const prechange = variant === 'prechange-index-and-characters';
  let source = prechange ? oldIndex : currentSource;
  if (variant.startsWith('old-merge')) {
    const start = source.indexOf('  const desiredConcentration ='), end = source.indexOf('  for (const army of ownArmies)', start);
    if (start < 0 || end < 0) throw new Error('The inspected concentration block changed; review this diagnostic.');
    source = source.slice(0, start) + '  const desiredConcentration = (army: typeof ownArmies[number]): number => Math.min(6, army.formationCapacity);\n' + source.slice(end);
    source = source.replace('(army.commander ? desiredConcentration(army) : 3)', '3').replace('Number(Boolean(b.commander)) - Number(Boolean(a.commander)) || ', '');
  }
  return compile(source, name => {
    if (name === './characters' && (variant.includes('old-characters') || prechange)) return legacyCharacters;
    if (name === './naval' && variant.includes('no-naval')) return { ...localRequire(name), planNaval: (_view: Observation, _budget: number, options: { heldArmyIds: ReadonlySet<string> }) => ({ commands: [], reasons: [], coinSpent: 0, heldArmyIds: new Set(options.heldArmyIds), queuedSettlementIds: new Set(), interrupts: false }) };
    // Original index iterates all BUILDINGS; supply the actual old4/6 prefix, avoiding a fake
    // unknown-harbor rejection. The frozen prefix is independently checked in content tests.
    if (name === '@theandril/content' && prechange) return { ...localRequire(name), BUILDINGS: localRequire(name).BUILDINGS.slice(0, 4), UNITS: localRequire(name).UNITS.slice(0, 6) };
    return undefined;
  }).planTurn;
}
const units = new Map(UNITS.map(unit => [unit.id, unit])), characters = new Map(CHARACTER_DEFINITIONS.map(character => [character.id, character]));
console.log(JSON.stringify({ scope: 'Diagnostic counterfactuals only; no hidden data enters the planner. Exact chronicle-victory order protocol: one plan per faction, drain tactical/capture decisions, then endTurn. No archive overhead or timing claims. Intermediate project values are copied, not retained mutable references. A hypothetical price changes only this process; those seals do not claim compatibility with the published content hash.', legacyCommit, publishedContentHash: CONTENT_HASH, hypotheticalProjectCoin, seed, size: 'tiny', factions: 4, pace: 'epic', sourceHashes: { index: fingerprint(currentSource), naval: fingerprint(readFileSync('packages/ai/src/naval.ts', 'utf8')), progression: fingerprint(readFileSync('packages/ai/src/progression.ts', 'utf8')), characters: fingerprint(readFileSync('packages/ai/src/characters.ts', 'utf8')), oldIndex: fingerprint(oldIndex), oldCharacters: fingerprint(oldCharacters) } }));
for (const variant of selected) {
  const plan = planner(variant), game = createGame({ seed, size: 'tiny', factionCount: 4, pace: 'epic' });
  const counts = { orders: 0, rejected: 0, battles: 0, captures: 0, navalBattles: 0, embarks: 0, landings: 0, promotions: 0, maxArmy: 0, shipsQueued: 0 };
  const projectStatuses = new Map<string, string>();
  const projectHistory: { turn: number; id: string; factionId: string; host: string; status: string; progress: number; reason: string | null }[] = [];
  const projectStarts: { turn: number; factionId: string; chosen: string; candidates: ProjectHostAssessment[] }[] = [];
  const samples: { turn: number; factions: ReturnType<typeof snapshot>; captures: number; battles: number; projects: { factionId: string; startedTurn: number; progress: number }[] }[] = [];
  const start = Date.now();
  function issue(command: GameCommand): void {
    if (command.type === 'startVictoryProject') projectStarts.push({ turn: game.turn, factionId: command.factionId, chosen: command.settlementId, candidates: assessProjectHosts(getObservation(game, command.factionId)) });
    const result = applyCommand(game, command);
    if (!result.ok) throw new Error(`${variant} turn${game.turn} ${JSON.stringify(command)}: ${result.error}`);
    counts.orders++;
    if (result.events.some(event => event.type === 'battle_finished')) { counts.battles++; if (game.battleReports.at(-1)?.domain === 'naval') counts.navalBattles++; }
    if (result.events.some(event => event.type === 'settlement_captured')) counts.captures++;
    if (command.type === 'embarkArmy') counts.embarks++;
    if (command.type === 'disembarkArmy') counts.landings++;
    if (command.type === 'promoteCharacter') counts.promotions++;
    if (command.type === 'queue' && units.get(command.itemId)?.movementDomain === 'naval') counts.shipsQueued++;
    for (const army of Object.values(game.armies)) counts.maxArmy = Math.max(counts.maxArmy, army.formations.length);
    for (const project of game.projects) if (projectStatuses.get(project.id) !== project.status) {
      projectStatuses.set(project.id, project.status);
      projectHistory.push({ turn: game.turn, id: project.id, factionId: project.factionId, host: project.settlementId, status: project.status, progress: project.progress, reason: project.statusReason });
    }
  }
  function snapshot() {
    return game.factions.map(faction => {
      const towns = Object.values(game.settlements).filter(town => town.factionId === faction.id), armies = Object.values(game.armies).filter(army => army.factionId === faction.id), living = Object.values(game.characters).filter(character => character.factionId === faction.id && !character.dead);
      return { id: faction.id, towns: towns.length, treasury: faction.treasury, formations: armies.reduce((sum, army) => sum + army.formations.length, 0),
        recurringNetCoin: towns.reduce((sum, town) => sum + settlementYields(game, town).coin, 0) - armies.reduce((sum, army) => sum + army.formations.reduce((sum, formation) => sum + units.get(formation.unitId)!.upkeep, 0), 0) - living.reduce((sum, character) => sum + characters.get(character.definitionId)!.upkeep, 0) };
    });
  }
  while (!game.victory && game.turn <= 1400) {
    for (const faction of game.factions) for (const command of plan(getObservation(game, faction.id))) {
      issue(command);
      for (let decisions = 0; game.battle || game.pendingCapture; decisions++) {
        if (decisions > 4) throw new Error('Pending decision loop exceeded the archive-test bound.');
        if (game.battle) { const battle = game.battle; issue({ type: 'autoResolveBattle', factionId: [battle.attackerFactionId, battle.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : battle.attackerFactionId }); }
        else { const command = plan(getObservation(game, game.pendingCapture!.factionId))[0]; if (command?.type !== 'resolveCapture') throw new Error('Missing capture choice.'); issue(command); }
      }
    }
    issue({ type: 'endTurn', factionId: game.turnOwnerId });
    if (game.turn % 100 === 0 || game.victory) samples.push({ turn: game.turn, factions: snapshot(), captures: counts.captures, battles: counts.battles, projects: game.projects.filter(project => project.status === 'active' || project.status === 'completed').map(project => ({ factionId: project.factionId, startedTurn: project.startedTurn, progress: project.progress })) });
    if (Date.now() - start > 45_000) throw new Error('This bounded diagnostic exceeded45seconds for one case.');
  }
  const winner = game.victory?.factionId;
  const leadingFaction = winner ?? [...game.factions].sort((a, b) => b.treasury - a.treasury || a.id.localeCompare(b.id))[0]!.id;
  if (stateHash(deserializeGame(serializeGame(game))) !== stateHash(game)) throw new Error('Final save mismatch.');
  console.log(JSON.stringify({ variant, turn: game.turn, winner: winner ?? null, leadingFaction, counts, final: snapshot(), projects: game.projects, projectHistory, projectStarts, hash: stateHash(game), samples: samples.map(sample => ({ turn: sample.turn, ...sample.factions.find(faction => faction.id === leadingFaction), captures: sample.captures, battles: sample.battles, project: sample.projects.find(project => project.factionId === leadingFaction) ?? null })) }));
  if (!winner) throw new Error('No victory within the existing1400turn bound; final state and leading-treasury samples are reported above.');
}
