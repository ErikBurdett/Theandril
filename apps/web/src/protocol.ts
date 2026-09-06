import type { MapSize } from '@theandril/mapgen';
import type { CampaignPace, GameCommand, MovementQuery, Observation, PeaceAssessment, PeaceTerms } from '@theandril/sim';
import type { CampaignMode, ChronicleDocuments } from '@theandril/chronicle';

export interface CampaignInfo { mode: CampaignMode; coverage: 'complete' | 'from-save' }

export type Request =
  | { id: number; type: 'new'; seed: number; size: MapSize; mode: CampaignMode; pace: CampaignPace; factionCount?: number }
  | { id: number; type: 'command'; command: GameCommand }
  | { id: number; type: 'previewPeace'; targetFactionId: string; terms: PeaceTerms }
  | { id: number; type: 'movementQuery'; armyId: string; target?: number; append?: boolean }
  | { id: number; type: 'watchRound' | 'chronicles' }
  | { id: number; type: 'save' | 'load' | 'export' | 'loadAuto' }
  | { id: number; type: 'import'; bytes: Uint8Array };

export interface WorkerMetrics {
  generationMs: number;
  commandMs: number;
  aiMs: number;
  transferBytes: number;
  totalTransferBytes: number;
}

export type Response =
  | { id: number; type: 'movementQuery'; query: MovementQuery; hash: string }
  | { id: number; type: 'chronicles'; documents: ChronicleDocuments }
  | { id: number; type: 'peacePreview'; assessment: PeaceAssessment }
  | { id: number; type: 'progress'; message: string }
  | { id: number; type: 'error'; message: string }
  | { id: number; type: 'export'; bytes: Uint8Array }
  | { id: number; type: 'message'; message: string }
  | { id: number; type: 'state'; observation: Observation; campaign: CampaignInfo; reset: boolean; hash: string; metrics: WorkerMetrics; message: string };
