import type { BattleFormation, BattleState } from './index';

export type BattleSide = 'attacker' | 'defender';
export type BattleAttackKind = 'melee' | 'reach' | 'projectile' | 'fire' | 'ward' | 'counter' | 'rally' | 'brace';
export interface BattleSceneFormation extends BattleFormation {
  armyId: string | null; side: BattleSide; factionId: string; factionDefinitionId: string;
  unitName: string; armyName: string; ward: number;
}
export interface BattleSceneCharacter {
  id: string; name: string; definitionId: string; factionId: string; factionDefinitionId: string;
  armyId: string; side: BattleSide; anchorFormationId: string | null; strain: number; maxStrain: number;
}
export interface BattleSceneSoldier { id: string; formationId: string; slot: number; x: number; y: number; alive: boolean }
export interface BattleSceneSnapshot {
  soldiers?: BattleSceneSoldier[];
  round: number; terrain: number; domain: 'land' | 'naval'; settlementId: string | null; fortification: number;
  formations: BattleSceneFormation[]; characters: BattleSceneCharacter[]; result: BattleState['result'] | null;
}
export interface BattleStatChange { cohesionDelta?: number; formationId: string; strengthDelta: number; moraleDelta: number; fatigueDelta: number; wardDelta: number }
/** Facts from the authoritative operation, not renderer-derived target selection. */
export interface BattlePresentationEvent {
  sequence: number; round: number; type: 'round' | 'attack' | 'ability' | 'rest' | 'rout' | 'destroyed' | 'pursuit' | 'result' | 'move';
  sourceSoldierIds?: string[]; targetSoldierIds?: string[]; killedSoldierIds?: string[];
  movement?: { formationId: string; before: { forward: number; lateral: number }; after: { forward: number; lateral: number } };
  sourceId: string | null; sourceKind: 'formation' | 'character' | null; targetIds: string[];
  abilityId: string | null; attackKind: BattleAttackKind | null; changes: BattleStatChange[];
  winner: 'attacker' | 'defender' | 'draw' | null; reason: string | null;
}
export type BattleFact = Omit<BattlePresentationEvent, 'sequence'>;
export type BattleFactObserver = (event: BattleFact) => void;
export interface BattlePresentation { battleId: string; before: BattleSceneSnapshot; after: BattleSceneSnapshot; events: BattlePresentationEvent[] }
/** Optional, detached, presentation-only output. Never saved or included in hashes. */
export type BattlePresentationObserver = (presentation: BattlePresentation) => void;
