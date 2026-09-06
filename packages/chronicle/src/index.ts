import { z } from 'zod';
import { CONTENT_HASH, PROSPERITY_PROJECT } from '@theandril/content';
import { MAP_DIMENSIONS, type MapSize } from '@theandril/mapgen';
import { applyCommand, applyCommandForVersion, battleReportForVersion, commandSchemaForVersion, createGame, deserializeGame, eventSchema, campaignBattleSchema, legacyCampaignBattleSchema, schema6CampaignBattleSchema, serializeGame, stateHash, stateHashForVersion, SAVE_VERSION, type BattleReport, type CommandResult, type DomainEvent, type GameCommand, type GameState, type PhaseObserver } from '@theandril/sim';

export { CampaignJournal, createJournal, resumeJournal } from './journal';
export type { JournalHeader, JournalCommit, JournalOptions } from './journal';

export type CampaignMode = 'player' | 'watch';
export type ArchiveCoverage = 'complete' | 'from-save';
export type ArchiveRulesVersion = 4 | 5 | 6 | 7;
export type ArchivedBattleReport = BattleReport | z.infer<typeof legacyCampaignBattleSchema> | z.infer<typeof schema6CampaignBattleSchema>;
export interface ArchiveRecord {
  sequence: number;
  turn: number;
  afterTurn: number;
  command: unknown;
  ok: boolean;
  error: string | null;
  events: DomainEvent[];
  battles: ArchivedBattleReport[];
  checkpoint: string | null;
  checkpointVersion: ArchiveRulesVersion | null;
  rulesVersion: ArchiveRulesVersion;
}
export interface CampaignArchive {
  version: 2;
  mode: CampaignMode;
  coverage: ArchiveCoverage;
  initialSave: string;
  initialHash: string;
  initialSaveVersion: ArchiveRulesVersion;
  initialTurn: number;
  records: ArchiveRecord[];
  finalHash: string | null;
  finalHashVersion: ArchiveRulesVersion | null;
}
export interface HistoryChapter { title: string; turnFrom: number; turnTo: number; paragraphs: string[] }
export interface ChronicleDocuments {
  history: { title: string; subtitle: string; coverage: string; chapters: HistoryChapter[] };
  technicalPages: { turn: number; text: string }[];
  technical: string;
  historyText: string;
}

const hash = z.string().regex(/^[a-f0-9]{8}$/);
const turn = z.number().int().min(1).max(1_000_000);
const legacyRecordSchema = z.object({
  sequence: z.number().int().positive(), turn, afterTurn: turn,
  command: z.unknown(), ok: z.boolean(), error: z.string().max(5000).nullable(),
  events: z.array(eventSchema).max(200_000), battles: z.array(legacyCampaignBattleSchema).max(1), checkpoint: hash.nullable(),
}).strict();
const legacyArchiveSchema = z.object({
  version: z.literal(1), mode: z.enum(['player', 'watch']), coverage: z.enum(['complete', 'from-save']),
  initialSave: z.string().max(64 * 1024 * 1024), initialHash: hash, initialTurn: turn,
  records: z.array(legacyRecordSchema).max(1_000_000), finalHash: hash.nullable(),
}).strict();
const hashVersion = z.union([z.literal(4), z.literal(5), z.literal(6), z.literal(7)]);
// Reports are validated in their original format. Never add modern metadata to old evidence.
const recordSchema = z.discriminatedUnion('rulesVersion', [
  legacyRecordSchema.extend({ checkpointVersion: hashVersion.nullable(), rulesVersion: z.literal(4) }).strict(),
  legacyRecordSchema.extend({ checkpointVersion: hashVersion.nullable(), rulesVersion: z.literal(5) }).strict(),
  legacyRecordSchema.extend({ battles: z.array(schema6CampaignBattleSchema).max(1), checkpointVersion: hashVersion.nullable(), rulesVersion: z.literal(6) }).strict(),
  legacyRecordSchema.extend({ battles: z.array(campaignBattleSchema).max(1), checkpointVersion: hashVersion.nullable(), rulesVersion: z.literal(7) }).strict(),
]);
const archiveSchema = legacyArchiveSchema.extend({ version: z.literal(2), initialSaveVersion: hashVersion, records: z.array(recordSchema).max(1_000_000), finalHashVersion: hashVersion.nullable() }).strict();

function snapshotVersion(text: string): ArchiveRulesVersion {
  const value: unknown = JSON.parse(text);
  return z.object({ version: hashVersion }).parse(value).version;
}
function migrateArchive(raw: unknown): CampaignArchive {
  const version = z.object({ version: z.number().int() }).parse(raw).version;
  if (version === 2) return archiveSchema.parse(raw);
  if (version !== 1) throw new Error('Unsupported campaign archive version.');
  const prior = legacyArchiveSchema.parse(raw);
  if (snapshotVersion(prior.initialSave) !== 4) throw new Error('Legacy archive requires a schema-4 origin.');
  // Preserve the original snapshot and every recorded hash; only annotate their formats.
  return { ...prior, version: 2, initialSaveVersion: 4, records: prior.records.map(record => ({ ...record, checkpointVersion: record.checkpoint ? 4 : null, rulesVersion: 4 })), finalHashVersion: prior.finalHash ? 4 : null };
}

function mapSize(game: GameState): MapSize {
  const match = (Object.keys(MAP_DIMENSIONS) as MapSize[]).find(size => MAP_DIMENSIONS[size].width === game.world.width && MAP_DIMENSIONS[size].height === game.world.height);
  if (!match) throw new Error('Archive world dimensions are unsupported.');
  return match;
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key: string, entry: unknown) => entry && typeof entry === 'object' && !Array.isArray(entry)
    ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : entry);
}

/** Archive work is observational; it never participates in canonical state hashes. */
export function createArchive(game: GameState, options: { mode: CampaignMode; coverage?: ArchiveCoverage }): CampaignArchive {
  return { version: 2, mode: options.mode, coverage: options.coverage ?? 'complete', initialSave: serializeGame(game),
    initialHash: stateHash(game), initialSaveVersion: SAVE_VERSION, initialTurn: game.turn, records: [], finalHash: game.victory ? stateHash(game) : null, finalHashVersion: game.victory ? SAVE_VERSION : null };
}

/** The only worker command entry point: capture results before the bounded feeds rotate. */
export function applyRecordedCommand(game: GameState, archive: CampaignArchive, command: GameCommand, observe?: PhaseObserver): CommandResult {
  // Detach before applying: caller-owned proposals must not rewrite old records later.
  const submitted: unknown = structuredClone(command);
  const beforeTurn = game.turn;
  const result = applyCommand(game, command, observe);
  const finishedBattle = result.events.some(event => event.type === 'battle_finished') ? game.battleReports.at(-1) : undefined;
  const checkpoint = result.ok && (command.type === 'endTurn' || game.victory) ? stateHash(game) : null;
  archive.records.push({ sequence: archive.records.length + 1, turn: beforeTurn, afterTurn: game.turn, command: submitted,
    ok: result.ok, error: result.error ?? null, events: structuredClone(result.events),
    battles: finishedBattle ? [structuredClone(battleReportForVersion(finishedBattle, SAVE_VERSION))] : [], checkpoint, checkpointVersion: checkpoint ? SAVE_VERSION : null, rulesVersion: SAVE_VERSION });
  if (game.victory && !archive.finalHash) { archive.finalHash = checkpoint ?? stateHash(game); archive.finalHashVersion = SAVE_VERSION; }
  return result;
}

/** Strict shape/provenance validation. Full replay is an explicit diagnostic, not a load-time world scan per order. */
export function parseArchive(raw: unknown, current: GameState): CampaignArchive {
  const archive = migrateArchive(raw);
  const initial = deserializeGame(archive.initialSave);
  if (snapshotVersion(archive.initialSave) !== archive.initialSaveVersion || stateHashForVersion(initial, archive.initialSaveVersion) !== archive.initialHash || initial.turn !== archive.initialTurn) throw new Error('Archive initial snapshot mismatch.');
  if (initial.world.seed !== current.world.seed || initial.world.width !== current.world.width || initial.world.height !== current.world.height
    || initial.turnOwnerId !== current.turnOwnerId || initial.pace !== current.pace || initial.world.generatorVersion !== current.world.generatorVersion || initial.factions.map(f => f.id).join('|') !== current.factions.map(f => f.id).join('|')) throw new Error('Archive belongs to a different campaign.');
  if (archive.coverage === 'complete') {
    const generated = createGame({ seed: initial.world.seed, size: mapSize(initial), factionCount: initial.factions.length, pace: initial.pace, generatorVersion: initial.world.generatorVersion });
    if (stateHashForVersion(generated, archive.initialSaveVersion) !== archive.initialHash) throw new Error('Complete history must begin at the generated campaign start.');
  }
  let expectedTurn = initial.turn;
  let latestRulesVersion = archive.initialSaveVersion;
  for (let i = 0; i < archive.records.length; i++) {
    const record = archive.records[i]!;
    if (record.sequence !== i + 1 || record.turn !== expectedTurn) throw new Error('Archive sequence is discontinuous.');
    const parsed = commandSchemaForVersion(record.rulesVersion).safeParse(record.command);
    if (record.ok && !parsed.success) throw new Error('Archive contains an invalid accepted command.');
    const advances = record.ok && parsed.success && parsed.data.type === 'endTurn';
    if (record.afterTurn !== expectedTurn + (advances ? 1 : 0)) throw new Error('Archive turn transition mismatch.');
    if ((!record.ok && (record.events.length || record.battles.length || record.checkpoint || !record.error)) || (record.ok && record.error)) throw new Error('Archive command result is inconsistent.');
    if (advances && !record.checkpoint) throw new Error('Archive is missing a turn checkpoint.');
    if (Boolean(record.checkpoint) !== Boolean(record.checkpointVersion)) throw new Error('Archive checkpoint format is missing or spurious.');
    if (record.checkpointVersion && record.checkpointVersion !== record.rulesVersion) throw new Error('Archive checkpoint differs from its command rules version.');
    if (record.rulesVersion < latestRulesVersion) throw new Error('Archive cannot downgrade its command rules or checkpoint format.');
    latestRulesVersion = record.rulesVersion;
    if (record.events.some(event => event.turn < record.turn || event.turn > record.afterTurn || !initial.factions.some(f => f.id === event.factionId))) throw new Error('Archive event provenance is invalid.');
    if (record.battles.length !== (record.events.some(event => event.type === 'battle_finished') ? 1 : 0)) throw new Error('Archive is missing or inventing a completed battle report.');
    if (record.battles.some(battle => !battle.combat.result)) throw new Error('Archive contains an unfinished battle report.');
    expectedTurn = record.afterTurn;
  }
  if (expectedTurn !== current.turn) throw new Error('Archive does not reach the saved turn.');
  const latestCheckpoint = archive.records.length ? archive.records.at(-1)?.checkpoint : archive.initialHash;
  const latestVersion = archive.records.length ? archive.records.at(-1)?.checkpointVersion : archive.initialSaveVersion;
  if (latestCheckpoint && latestVersion && latestCheckpoint !== stateHashForVersion(current, latestVersion)) throw new Error('Archive latest checkpoint does not match the saved campaign.');
  if (Boolean(archive.finalHash) !== Boolean(archive.finalHashVersion) || Boolean(current.victory) !== Boolean(archive.finalHash) || (archive.finalHash && archive.finalHashVersion && archive.finalHash !== stateHashForVersion(current, archive.finalHashVersion))) throw new Error('Archive victory seal mismatch.');
  return archive;
}

/** Verify every accepted/rejected order, event and turn checkpoint using the real rules. */
export function replayArchive(archive: CampaignArchive): GameState {
  const game = deserializeGame(archive.initialSave);
  if (stateHashForVersion(game, archive.initialSaveVersion) !== archive.initialHash) throw new Error('Archive initial hash mismatch.');
  for (const record of archive.records) {
    if (game.turn !== record.turn) throw new Error(`Replay turn mismatch at order ${record.sequence}.`);
    const result = applyCommandForVersion(game, record.command, record.rulesVersion);
    if (result.ok !== record.ok || (result.error ?? null) !== record.error || stableJson(result.events) !== stableJson(record.events) || game.turn !== record.afterTurn) throw new Error(`Replay result mismatch at order ${record.sequence}.`);
    const finishedBattle = result.events.some(event => event.type === 'battle_finished') ? game.battleReports.at(-1) : undefined;
    const battles = finishedBattle ? [battleReportForVersion(finishedBattle, record.rulesVersion)] : [];
    if (stableJson(battles) !== stableJson(record.battles)) throw new Error(`Replay battle mismatch at order ${record.sequence}.`);
    if (record.checkpoint && record.checkpointVersion && stateHashForVersion(game, record.checkpointVersion) !== record.checkpoint) throw new Error(`Replay checkpoint mismatch at order ${record.sequence}.`);
  }
  if (archive.finalHash && archive.finalHashVersion && stateHashForVersion(game, archive.finalHashVersion) !== archive.finalHash) throw new Error('Replay victory seal mismatch.');
  parseArchive(archive, game);
  return game;
}

const routine = new Set(['army_moved', 'production_queued', 'turn_started', 'campaign_started', 'battle_round', 'siege_progress', 'victory_project_progress']);
function uniqueEvents(events: DomainEvent[]): DomainEvent[] {
  const seen = new Set<string>();
  return events.filter(event => {
    // Participant notifications duplicate the same public happening, not separate battles.
    const key = JSON.stringify([event.turn, event.type, event.message, event.cell]);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

/** No generated motives, speeches or invented casualties: narrative is a rendering of evidence. */
export function generateChronicles(game: GameState, archive: CampaignArchive): ChronicleDocuments {
  if (!game.victory || !archive.finalHash) throw new Error('The campaign chronicles are sealed until victory.');
  if (!archive.finalHashVersion || stateHashForVersion(game, archive.finalHashVersion) !== archive.finalHash) throw new Error('The campaign no longer matches its chronicle seal.');
  const initial = deserializeGame(archive.initialSave);
  const names = new Map(initial.factions.map(faction => [faction.id, faction.name]));
  const coverage = archive.coverage === 'complete'
    ? `Complete record: generated start on turn ${archive.initialTurn} through victory on turn ${game.turn}.`
    : `Partial record: this campaign was imported on turn ${archive.initialTurn}. A complete earlier record is unavailable; no earlier history has been invented.`;
  const chapters: HistoryChapter[] = [{ title: 'Prologue — The scattered hearths', turnFrom: initial.turn, turnTo: initial.turn, paragraphs: [
    'The Witness Roads had failed, and distant bargains no longer bound the hearthlands. In this campaign, new communities set their claims upon the land.',
    `The record opens with ${initial.factions.map(f => f.name).join(', ')}. Its world bears the seed ${initial.world.seed}.`, coverage,
  ] }];
  const byTurn = new Map<number, { events: DomainEvent[]; records: ArchiveRecord[] }>();
  for (const record of archive.records) {
    const entry = byTurn.get(record.turn) ?? { events: [], records: [] };
    entry.records.push(record); byTurn.set(record.turn, entry);
    for (const event of uniqueEvents(record.events)) {
      const target = byTurn.get(event.turn) ?? { events: [], records: [] };
      target.events.push(event); byTurn.set(event.turn, target);
    }
  }
  for (const [number, entry] of [...byTurn].sort(([a], [b]) => a - b)) {
    const events = entry.events;
    const paragraphs: string[] = [];
    for (const event of events) {
      if (routine.has(event.type)) continue;
      paragraphs.push(`${names.get(event.factionId) ?? event.factionId}: ${event.message}`);
    }
    const movements = events.filter(event => event.type === 'army_moved').length;
    const queues = events.filter(event => event.type === 'production_queued').length;
    const rejected = entry.records.filter(record => !record.ok).length;
    if (movements || queues) paragraphs.push(`The lesser entries record ${movements} march${movements === 1 ? '' : 'es'} and ${queues} new production order${queues === 1 ? '' : 's'}. Their exact destinations and commissions survive in the technical ledger.`);
    if (rejected) paragraphs.push(`${rejected} order${rejected === 1 ? ' was' : 's were'} refused by the campaign rules and changed no realm. The technical ledger preserves the reasons.`);
    if (!paragraphs.length) paragraphs.push('No new public achievement or calamity was recorded in this turn; the ledgers of the realms continued.');
    const title = events.some(e => e.type === 'campaign_victory') ? `Turn ${number} — The closing of the book`
      : events.some(e => e.type === 'settlement_captured') ? `Turn ${number} — Hearths under new banners`
        : events.some(e => e.type === 'battle_finished') ? `Turn ${number} — The reckoning of arms`
          : events.some(e => e.type === 'war_declared') ? `Turn ${number} — The broken peace`
            : events.some(e => e.type === 'settlement_founded') ? `Turn ${number} — New hearths`
              : `Turn ${number} — The annals of the realms`;
    chapters.push({ title, turnFrom: number, turnTo: number, paragraphs });
  }
  chapters.push({ title: 'Epilogue — The seal of the witnesses', turnFrom: game.turn, turnTo: game.turn, paragraphs: [
    `On turn ${game.turn}, ${names.get(game.victory.factionId) ?? game.victory.factionId} achieved Prosperity through the completion of the ${PROSPERITY_PROJECT.name}. The rival realms' contest ended, and this book was sealed.`,
    `The witnesses preserved ${archive.records.length} submitted orders. The final canonical seal is ${archive.finalHash}. This tome follows the recorded events; it does not claim knowledge of unrecorded motives.`,
  ] });
  const history = { title: 'The Book of Rekindled Hearths', subtitle: `A chronicle of world ${initial.world.seed}`, coverage, chapters };
  const technicalRecord = { format: 'theandril-technical-log', version: 2, gameVersion: '0.1.0', saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH,
    coverage, mode: archive.mode, seed: initial.world.seed, size: mapSize(initial), pace: initial.pace, factions: initial.factions.map(({ id, name }) => ({ id, name })),
    initialSnapshot: JSON.parse(archive.initialSave) as unknown, initialHash: archive.initialHash, initialSaveVersion: archive.initialSaveVersion, generatorVersion: initial.world.generatorVersion, records: archive.records,
    victory: game.victory, finalHash: archive.finalHash, finalHashVersion: archive.finalHashVersion,
    replay: 'Deserialize initialSnapshot with the recorded rules/content version. Apply records.command in sequence, including rejected orders; compare results, events and end-turn checkpoints. Checksums detect accidental corruption, not malicious forgery.',
  };
  const technical = JSON.stringify(JSON.parse(stableJson(technicalRecord)) as unknown, null, 2);
  const technicalPages = [...byTurn].sort(([a], [b]) => a - b).map(([number, entry]) => ({ turn: number, text: [
    `World ${initial.world.seed} · ${initial.pace} pace · ${archive.mode} mode`,
    `Orders issued on turn ${number}. End-turn orders also record the transition into the following turn.`,
    `Initial seal ${archive.initialHash} · Final seal ${archive.finalHash}`,
    ...entry.records.map(record => `Order ${record.sequence} · turn ${record.turn} → ${record.afterTurn} · ${record.ok ? 'ACCEPTED' : 'REFUSED'}\n${JSON.stringify(JSON.parse(stableJson(record)) as unknown, null, 2)}`),
    ...(entry.records.length ? [] : ['No orders were issued on this turn. Its events were produced by the preceding end-turn order.', ...entry.events.map(event => event.message)]),
  ].join('\n\n') }));
  if (!technicalPages.length) technicalPages.push({ turn: archive.initialTurn, text: `${coverage}\n\nNo orders have been recorded since this completed campaign was imported. The full JSON contains the imported initial snapshot and final result.` });
  const historyText = [history.title, history.subtitle, coverage, ...chapters.flatMap(chapter => [chapter.title, ...chapter.paragraphs])].join('\n\n');
  return { history, technicalPages, technical, historyText };
}
