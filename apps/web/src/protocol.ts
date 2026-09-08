import type { MapLayout, MapSize } from '@theandril/mapgen';
import type { CampaignPace, GameCommand, MapObservation, MovementQuery, Observation, PeaceAssessment, PeaceTerms, SettlementLandObservation } from '@theandril/sim';
import type { CampaignMode, ChronicleDocuments } from '@theandril/chronicle';
import type { PackedCells } from './cell-transfer';
import type { BattleTransfer } from './battle-transfer';

export interface CampaignInfo { mode: CampaignMode; coverage: 'complete' | 'from-save' }

export type Request =
  | { id: number; type: 'new'; seed: number; size: MapSize; mode: CampaignMode; pace: CampaignPace; factionCount?: number; factionDefinitionId?: string; layout?: Exclude<MapLayout, 'legacy'> }
  | { id: number; type: 'command'; command: GameCommand }
  | { id: number; type: 'previewPeace'; targetFactionId: string; terms: PeaceTerms }
  | { id: number; type: 'movementQuery'; armyId: string; target?: number; append?: boolean }
  | { id: number; type: 'landQuery'; settlementId: string }
  | { id: number; type: 'watchFog'; enabled: boolean }
  | { id: number; type: 'watchRound' | 'chronicles' }
  | { id: number; type: 'save' | 'load' | 'export' | 'loadAuto' }
  | { id: number; type: 'import'; bytes: Uint8Array };

export interface WorkerMetrics {
  generationMs: number;
  commandMs: number;
  aiMs: number;
  transferBytes: number;
  totalTransferBytes: number;
  cellTransferBytes: number;
  landQueryCount: number;
  landQueryBytes: number;
  totalLandQueryBytes: number;
}

export type Response =
  | { id: number; type: 'movementQuery'; query: MovementQuery; hash: string }
  | { id: number; type: 'landQuery'; settlementId: string; town: SettlementLandObservation | null; hash: string; metrics: WorkerMetrics }
  | { id: number; type: 'chronicles'; documents: ChronicleDocuments }
  | { id: number; type: 'peacePreview'; assessment: PeaceAssessment }
  | { id: number; type: 'progress'; message: string }
  | { id: number; type: 'error'; message: string }
  | { id: number; type: 'export'; bytes: Uint8Array }
  | { id: number; type: 'message'; message: string }
  | { id: number; type: 'state'; observation: Omit<Observation, 'cells'>; cells: PackedCells; map?: Omit<MapObservation, 'cells'>; battlePresentation?: BattleTransfer; fogEnabled: boolean; mapRevision: number; mapReset: boolean; campaign: CampaignInfo; reset: boolean; hash: string; metrics: WorkerMetrics; message: string };
