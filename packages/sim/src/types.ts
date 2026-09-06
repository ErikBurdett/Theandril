import type { GeneratorVersion, MapSize, World } from '@theandril/mapgen';
import type { CampaignPace } from '@theandril/content';
import type { BattleOrder, BattleState } from './combat';
import type { DiplomacyObservation, DiplomacyState, PeaceTerms } from './diplomacy';
import type { FactionProgression, ProgressionObservation, Victory, VictoryProject } from './progression';
import type { MovementRoute } from './movement';
import type { Character, CharacterBattleSnapshot, CharacterAftermath, CharacterView, CharacterSummary, CharacterRecruitmentOption, CommanderAbilityOption } from './characters';

export interface ArmyFormation {
  id: string;
  unitId: string;
  strength: number;
  morale: number;
  fatigue: number;
}

export interface Army {
  id: string;
  factionId: string;
  name: string;
  cell: number;
  movement: number;
  formations: ArmyFormation[];
}

/** Detached, derived roster summary; none of these aggregate values are canonical. */
export interface ArmyView extends Army {
  commander: CharacterSummary | null;
  agents: CharacterSummary[];
  movementBlocker: string | null;
  reorganizationBlocker: string | null;
  unitId: string;
  displayUnitId: string;
  strength: number;
  maxStrength: number;
  morale: number;
  fatigue: number;
  maxMovement: number;
  sight: number;
  upkeep: number;
  canFound: boolean;
  canAttack: boolean;
}

export interface Settlement {
  id: string;
  factionId: string;
  name: string;
  cell: number;
  population: number;
  food: number;
  buildings: string[];
  queue: { itemId: string; progress: number }[];
  founderFactionId: string;
  devastation: number;
  occupationTurns: number;
}

export interface Siege {
  settlementId: string;
  armyId: string;
  factionId: string;
  startedTurn: number;
  defenses: number;
  supplies: number;
  militiaStrength: number;
  militiaMorale: number;
  militiaFatigue: number;
}

export interface SiegeObservation extends Siege {
  canAssault: boolean;
  assaultBlocker: string | null;
  defenderStrength: number;
}

export type CaptureOutcome = 'occupy' | 'sack' | 'raze' | 'liberate';
export interface CaptureOption {
  outcome: CaptureOutcome;
  label: string;
  description: string;
  coinGain: number;
  populationLoss: number;
  buildingsLost: number;
  devastation: number;
  occupationTurns: number;
  recipientFactionId: string | null;
}
export interface CaptureDecision {
  settlementId: string;
  armyId: string;
  factionId: string;
  previousOwnerId: string;
  options: CaptureOption[];
}
export interface Ruin {
  id: string;
  name: string;
  cell: number;
  founderFactionId: string;
  razedByFactionId: string;
  turn: number;
}

export interface FactionState {
  id: string;
  definitionId: string;
  name: string;
  color: number;
  treasury: number;
  knowledge: number;
}

export interface DomainEvent {
  turn: number;
  type: string;
  message: string;
  factionId: string;
  cell?: number;
}

export interface CampaignBattle {
  rulesVersion: 5 | 6 | 7;
  characterSnapshots: CharacterBattleSnapshot[];
  characterAftermath: CharacterAftermath[];
  usedAbilities: { characterId: string; abilityId: string }[];
  formationBindings: { battleFormationId: string; formationId: string; armyId: string | null }[];
  formationStrengths: { formationId: string; strength: number }[];
  formationAftermath: { formationId: string; strength: number }[];
  id: string;
  turn: number;
  attackerId: string;
  defenderId: string;
  defenderIds: string[];
  attackerFactionId: string;
  defenderFactionId: string;
  attackerCell: number;
  defenderCell: number;
  settlementId: string | null;
  militiaId: string | null;
  fortification: number;
  attackerDoctrineId: string | null;
  defenderDoctrineId: string | null;
  initialStrengths: { armyId: string; strength: number }[];
  aftermath: { armyId: string; strength: number; cell: number | null; outcome: 'held' | 'advanced' | 'retreated' | 'destroyed' }[];
  combat: BattleState;
}

/** Completed battles use the same metadata; save validation requires combat.result. */
export type BattleReport = CampaignBattle;

export type GameCommand =
  | { type: 'recruitCharacter'; factionId: string; settlementId: string; definitionId: string }
  | { type: 'assignCharacter'; factionId: string; characterId: string; armyId: string }
  | { type: 'unassignCharacter'; factionId: string; characterId: string; settlementId: string }
  | { type: 'promoteCharacter'; factionId: string; characterId: string; skillId: string }
  | { type: 'startCharacterMission'; factionId: string; characterId: string; missionId: string; targetCell?: number; settlementId?: string }
  | { type: 'cancelCharacterMission'; factionId: string; characterId: string }
  | { type: 'useCommanderAbility'; factionId: string; characterId: string; abilityId: string }
  | { type: 'mergeArmies'; factionId: string; sourceArmyId: string; targetArmyId: string }
  | { type: 'transferFormations'; factionId: string; sourceArmyId: string; targetArmyId: string; formationIds: string[] }
  | { type: 'splitArmy'; factionId: string; armyId: string; formationIds: string[]; name?: string }
  | { type: 'found'; factionId: string; armyId: string; name: string }
  | { type: 'move'; factionId: string; armyId: string; target: number }
  | { type: 'moveTo'; factionId: string; armyId: string; target: number }
  | { type: 'queueMovement'; factionId: string; armyId: string; target: number; append?: boolean }
  | { type: 'cancelMovement'; factionId: string; armyId: string }
  | { type: 'resumeMovement'; factionId: string; armyId: string }
  | { type: 'queue'; factionId: string; settlementId: string; itemId: string }
  | { type: 'declareWar'; factionId: string; targetFactionId: string }
  | { type: 'attack'; factionId: string; armyId: string; targetArmyId: string }
  | { type: 'battleOrder'; factionId: string; order: BattleOrder }
  | { type: 'autoResolveBattle'; factionId: string }
  | { type: 'besiege'; factionId: string; armyId: string; settlementId: string }
  | { type: 'liftSiege'; factionId: string; settlementId: string }
  | { type: 'assault'; factionId: string; settlementId: string }
  | { type: 'resolveCapture'; factionId: string; settlementId: string; outcome: CaptureOutcome }
  | { type: 'proposePeace'; factionId: string; targetFactionId: string; terms: PeaceTerms }
  | { type: 'respondPeace'; factionId: string; offerId: string; accept: boolean }
  | { type: 'research'; factionId: string; technologyId: string }
  | { type: 'adoptInstitution'; factionId: string; institutionId: string }
  | { type: 'adoptDoctrine'; factionId: string; doctrineId: string }
  | { type: 'startVictoryProject'; factionId: string; settlementId: string }
  | { type: 'endTurn'; factionId: string };

/** Canonical state stays in the simulation owner. Clients receive Observation. */
export interface GameState {
  characters: Record<string, Character>;
  pace: CampaignPace;
  turn: number;
  nextId: number;
  turnOwnerId: string;
  world: World;
  factions: FactionState[];
  armies: Record<string, Army>;
  routes: Record<string, MovementRoute>;
  settlements: Record<string, Settlement>;
  explored: Record<string, Set<number>>;
  events: DomainEvent[];
  wars: [string, string][];
  battle: CampaignBattle | null;
  battleReports: BattleReport[];
  sieges: Record<string, Siege>;
  pendingCapture: CaptureDecision | null;
  ruins: Record<string, Ruin>;
  diplomacy: DiplomacyState;
  progression: Record<string, FactionProgression>;
  projects: VictoryProject[];
  victory: Victory | null;
}

export interface Observation {
  characters: CharacterView[];
  characterRecruitment: CharacterRecruitmentOption[];
  commanderAbilities: CommanderAbilityOption[];
  pace: CampaignPace;
  turn: number;
  factionId: string;
  factionCount: number;
  factions: { id: string; definitionId: string; name: string; color: number }[];
  treasury: number;
  knowledge: number;
  settlements: Settlement[];
  armies: ArmyView[];
  routes: MovementRoute[];
  events: DomainEvent[];
  cells: { cell: number; terrain: number; biome: number; fertility: number; visible: boolean }[];
  width: number;
  height: number;
  seed: number;
  wars: string[];
  battle: CampaignBattle | null;
  battleReports: BattleReport[];
  sieges: SiegeObservation[];
  /** Visible blockade presence only; third-party siege participants and statistics stay private. */
  visibleSiegeSettlementIds: string[];
  pendingCapture: CaptureDecision | null;
  ruins: Ruin[];
  diplomacy: DiplomacyObservation;
  progression: ProgressionObservation;
  projects: VictoryProject[];
  victory: Victory | null;
}

export interface NewGameOptions {
  seed: number;
  size: MapSize;
  factionCount?: number;
  pace?: CampaignPace;
  generatorVersion?: GeneratorVersion;
}

export interface CommandResult {
  ok: boolean;
  error?: string;
  events: DomainEvent[];
  diagnostics?: string[];
}

/** Observational instrumentation only: its measurements never enter game state. */
export type PhaseObserver = (phase: 'sieges' | 'settlements' | 'upkeep' | 'movement' | 'characters' | 'travel' | 'diplomacy' | 'progression', edge: 'start' | 'end') => void;
