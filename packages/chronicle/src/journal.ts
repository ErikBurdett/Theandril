import { stateHashForVersion, type CommandResult, type GameCommand, type GameState, type PhaseObserver } from '@theandril/sim';
import { applyRecordedCommand, createArchive, parseArchive, type ArchiveCoverage, type ArchiveRecord, type ArchiveRulesVersion, type CampaignArchive, type CampaignMode } from './index';

export type JournalHeader = Omit<CampaignArchive, 'records'>;
export interface JournalCommit { header: JournalHeader; records: ArchiveRecord[]; from: number; to: number }
export interface JournalOptions { mode: CampaignMode; coverage?: ArchiveCoverage }

const MAX_RECORDS = 1_000_000; // Existing flat archive format limit, not a new retention policy.
function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('Campaign journal: ' + message);
}
function campaignIdentity(game: GameState): string {
  return JSON.stringify([game.world.seed, game.world.width, game.world.height, game.world.generatorVersion, game.rosterVersion,
    game.turnOwnerId, game.pace, game.factions.map(faction => faction.id)]);
}

/** Owns append-only evidence. No caller can edit its historical prefix or durable cursor. */
export class CampaignJournal {
  readonly #game: GameState;
  readonly #archive: CampaignArchive;
  readonly #identity: string;
  #expectedTurn: number;
  #latestRulesVersion: ArchiveRulesVersion;
  #interrupted = false;

  private constructor(game: GameState, owned: CampaignArchive) {
    this.#game = game; this.#archive = owned; this.#identity = campaignIdentity(game);
    this.#expectedTurn = owned.records.at(-1)?.afterTurn ?? owned.initialTurn;
    this.#latestRulesVersion = owned.records.at(-1)?.rulesVersion ?? owned.initialSaveVersion;
  }

  static create(game: GameState, options: JournalOptions): CampaignJournal {
    // Origin/provenance validation is paid once, never repeated on incremental commits.
    return new CampaignJournal(game, parseArchive(createArchive(game, options), game));
  }

  static resume(game: GameState, archive: unknown): CampaignJournal {
    // z.unknown() commands can retain input aliases; detach before parsing that boundary.
    return new CampaignJournal(game, parseArchive(structuredClone(archive), game));
  }

  get mode(): CampaignMode { return this.#archive.mode; }
  get coverage(): ArchiveCoverage { return this.#archive.coverage; }
  get recordCount(): number { return this.#archive.records.length; }

  #assertPosition(game: GameState): void {
    requireValue(game === this.#game, 'this journal belongs to a different game object.');
    requireValue(!this.#interrupted, 'recording was interrupted; restore a saved campaign.');
    requireValue(campaignIdentity(game) === this.#identity, 'campaign identity changed.');
    const last = this.#archive.records.at(-1);
    requireValue(game.turn === this.#expectedTurn && (last?.afterTurn ?? this.#archive.initialTurn) === game.turn, 'an unrecorded turn changed the campaign.');
    requireValue(!last || last.sequence === this.recordCount && last.rulesVersion === this.#latestRulesVersion, 'record sequence or rules continuity changed.');
  }

  #assertSeals(game: GameState): void {
    const last = this.#archive.records.at(-1);
    const checkpoint = last ? last.checkpoint : this.#archive.initialHash;
    const checkpointVersion = last ? last.checkpointVersion : this.#archive.initialSaveVersion;
    const hashes = new Map<ArchiveRulesVersion, string>();
    const currentHash = (version: ArchiveRulesVersion): string => {
      let hash = hashes.get(version);
      if (!hash) { hash = stateHashForVersion(game, version); hashes.set(version, hash); }
      return hash;
    };
    requireValue(Boolean(checkpoint) === Boolean(checkpointVersion), 'checkpoint format is inconsistent.');
    if (checkpoint && checkpointVersion) requireValue(currentHash(checkpointVersion) === checkpoint, 'latest checkpoint does not match the game.');
    const { finalHash, finalHashVersion } = this.#archive;
    requireValue(Boolean(finalHash) === Boolean(finalHashVersion) && Boolean(game.victory) === Boolean(finalHash), 'victory seal is missing or spurious.');
    if (finalHash && finalHashVersion) requireValue(currentHash(finalHashVersion) === finalHash, 'victory seal does not match the game.');
  }

  record(game: GameState, command: GameCommand, observe?: PhaseObserver): CommandResult {
    this.#assertPosition(game);
    requireValue(this.recordCount < MAX_RECORDS, 'the archive record limit has been reached.');
    const beforeTurn = this.#expectedTurn, beforeCount = this.recordCount;
    try {
      const result = applyRecordedCommand(game, this.#archive, command, observe);
      const record = this.#archive.records.at(-1)!;
      requireValue(this.recordCount === beforeCount + 1 && record.sequence === beforeCount + 1 && record.turn === beforeTurn,
        'the recorder did not append exactly one continuous order.');
      requireValue(record.afterTurn === game.turn && record.rulesVersion >= this.#latestRulesVersion, 'the recorder changed turn or rules continuity.');
      this.#expectedTurn = record.afterTurn; this.#latestRulesVersion = record.rulesVersion;
      // Result events may also belong to the live simulation feed. Keep both owners private.
      return structuredClone(result);
    } catch (error) {
      // A recorder/transfer exception may occur after the canonical command mutated state.
      this.#interrupted = true;
      throw error;
    }
  }

  /** Full detachment is reserved for explicit exports, diagnostics and final chronicles. */
  materialize(): CampaignArchive {
    this.#assertPosition(this.#game); this.#assertSeals(this.#game);
    return structuredClone(this.#archive);
  }

  /** Does not acknowledge storage. Retrying an uncommitted cursor returns the same suffix. */
  prepareCommit(game: GameState, from: number): JournalCommit {
    requireValue(Number.isSafeInteger(from) && from >= 0 && from <= this.recordCount, 'commit cursor is out of bounds.');
    this.#assertPosition(game); this.#assertSeals(game);
    const { records, ...header } = this.#archive;
    return { header, records: structuredClone(records.slice(from)), from, to: records.length };
  }
}

export function createJournal(game: GameState, options: JournalOptions): CampaignJournal { return CampaignJournal.create(game, options); }
export function resumeJournal(game: GameState, archive: unknown): CampaignJournal { return CampaignJournal.resume(game, archive); }
