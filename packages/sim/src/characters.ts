import { z } from 'zod';
import { CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, characterName, CHARACTER_SKILLS, COMMANDER_ABILITIES, UNITS } from '@theandril/content';
import { neighbors, SeededRandom } from '@theandril/mapgen';
import type { Army, CampaignBattle, CommandResult, DomainEvent, GameState } from './types';
import { cellsWithin, indexes } from './visibility';

const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const bounded = (max: number) => z.number().int().min(0).max(max);
const name = z.string().min(1).max(80);
export const characterMissionSchema = z.object({ id, definitionId: id, armyId: id, anchorCell: bounded(349_999), targetSettlementId: id.nullable(), remainingTurns: bounded(20).min(1), startedTurn: bounded(1_000_000).min(1) }).strict();
export type CharacterMission = z.infer<typeof characterMissionSchema>;
export const characterSchema = z.object({
  id, factionId: id, definitionId: id, name, experience: bounded(1_000_000), skillId: id.nullable(), woundedTurns: bounded(20), dead: z.boolean(),
  location: z.discriminatedUnion('kind', [z.object({ kind: z.literal('army'), armyId: id }).strict(), z.object({ kind: z.literal('settlement'), settlementId: id }).strict()]).nullable(),
  mission: characterMissionSchema.nullable(),
}).strict();
export type Character = z.infer<typeof characterSchema>;
export type CharacterRole = 'marshal' | 'surveyor' | 'engineer';
export type CharacterStatus = 'ready' | 'mission' | 'wounded' | 'dead';
export interface CharacterSummary { id: string; name: string; definitionId: string; role: CharacterRole; status: CharacterStatus; rank: number; experience: number; skillId: string | null; woundedTurns: number }
export interface CharacterMissionOption { missionId: string; name: string; description: string; duration: number; coinCost: number; risk: 'low' | 'exposed' | 'dangerous'; riskText: string; effectText: string; targetCell?: number; settlementId?: string; canStart: boolean; blocker: string | null }
export interface CharacterView extends Character, CharacterSummary {
  cell: number | null;
  assignmentOptions: { armyId: string; label: string; canAssign: boolean; blocker: string | null }[];
  unassignmentOptions: { settlementId: string; label: string; canUnassign: boolean; blocker: string | null }[];
  missions: CharacterMissionOption[];
  promotions: { skillId: string; name: string; description: string; experienceCost: number; canPromote: boolean; blocker: string | null }[];
}
export interface CharacterRecruitmentOption { settlementId: string; definitionId: string; name: string; role: CharacterRole; coinCost: number; upkeep: number; canRecruit: boolean; blocker: string | null }
export interface CommanderAbilityOption { characterId: string; armyId: string; abilityId: string; name: string; effectText: string; used: boolean; canUse: boolean; blocker: string | null }
const leadershipSchema = z.object({ attack: bounded(20), armor: bounded(20) }).strict();
export const characterBattleSnapshotSchema = z.object({ characterId: id, armyId: id, factionId: id, name, definitionId: id, skillId: id.nullable(), experience: bounded(1_000_000), woundedTurns: bounded(20), leadership: leadershipSchema, rallyRestore: bounded(100) }).strict();
export type CharacterBattleSnapshot = z.infer<typeof characterBattleSnapshotSchema>;
export const characterAftermathSchema = z.object({ characterId: id, name, outcome: z.enum(['survived', 'wounded', 'dead']), experience: bounded(1_000_000), woundedTurns: bounded(20) }).strict();
export type CharacterAftermath = z.infer<typeof characterAftermathSchema>;
export const MAX_LIVING_CHARACTERS = 64;
export const MAX_DEAD_CHARACTERS = 32;
const definitions = new Map(CHARACTER_DEFINITIONS.map(item => [item.id, item]));
const missions = new Map(CHARACTER_MISSIONS.map(item => [item.id, item]));
const skills = new Map(CHARACTER_SKILLS.map(item => [item.id, item]));
const units = new Map(UNITS.map(item => [item.id, item]));
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const serial = (value: string) => Number(value.slice(value.indexOf('.') + 1));
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const treasury = (state: GameState, factionId: string) => state.factions.find(item => item.id === factionId);
const role = (character: Character): CharacterRole => definitions.get(character.definitionId)!.role;
const status = (character: Character): CharacterStatus => character.dead ? 'dead' : character.woundedTurns ? 'wounded' : character.mission ? 'mission' : 'ready';
const summary = (character: Character): CharacterSummary => ({ id: character.id, name: character.name, definitionId: character.definitionId, role: role(character), status: status(character), rank: character.skillId ? 2 : 1, experience: character.experience, skillId: character.skillId, woundedTurns: character.woundedTurns });
interface CharacterIndex { armies: Map<string, Set<string>>; settlements: Map<string, Set<string>>; factions: Map<string, Set<string>> }
const cached = new WeakMap<GameState, CharacterIndex>();
export function rebuildCharacterIndexes(state: GameState): CharacterIndex {
  const index: CharacterIndex = { armies: new Map(), settlements: new Map(), factions: new Map() };
  for (const character of Object.values(state.characters)) {
    const faction = index.factions.get(character.factionId) ?? new Set<string>(); faction.add(character.id); index.factions.set(character.factionId, faction);
    const location = character.location;
    if (location) { const map = location.kind === 'army' ? index.armies : index.settlements; const key = location.kind === 'army' ? location.armyId : location.settlementId; const assigned = map.get(key) ?? new Set<string>(); assigned.add(character.id); map.set(key, assigned); }
  }
  cached.set(state, index); return index;
}
const characterIndex = (state: GameState) => cached.get(state) ?? rebuildCharacterIndexes(state);
const fromIds = (state: GameState, ids: Set<string> | undefined) => [...(ids ?? [])].map(id => state.characters[id]).filter((item): item is Character => Boolean(item)).sort(byId);
export const charactersForArmy = (state: GameState, armyId: string): Character[] => fromIds(state, characterIndex(state).armies.get(armyId));
const charactersForFaction = (state: GameState, factionId: string) => fromIds(state, characterIndex(state).factions.get(factionId));
export const armyHasCharacterMission = (state: GameState, armyId: string): boolean => charactersForArmy(state, armyId).some(item => item.mission !== null);
export function characterCell(state: GameState, character: Character): number | null { const location = character.location; return !location ? null : location.kind === 'army' ? state.armies[location.armyId]?.cell ?? null : state.settlements[location.settlementId]?.cell ?? null; }
function locate(state: GameState, character: Character, location: Character['location']): void {
  const index = characterIndex(state); const old = character.location;
  if (old) (old.kind === 'army' ? index.armies.get(old.armyId) : index.settlements.get(old.settlementId))?.delete(character.id);
  character.location = location;
  if (location) { const map = location.kind === 'army' ? index.armies : index.settlements; const key = location.kind === 'army' ? location.armyId : location.settlementId; const ids = map.get(key) ?? new Set<string>(); ids.add(character.id); map.set(key, ids); }
}
function notice(state: GameState, character: Character, type: string, message: string, cell = characterCell(state, character)): DomainEvent { return { turn: state.turn, factionId: character.factionId, type, message, ...(cell === null ? {} : { cell }) }; }
function pauseTravel(state: GameState, armyId: string, events: DomainEvent[]): void {
  const route = state.routes[armyId]; const army = state.armies[armyId]; const reason = 'An attached character began a stationary mission.';
  if (route && army && (route.status !== 'paused' || route.pauseReason !== reason)) { route.status = 'paused'; route.pauseReason = reason; events.push({ turn: state.turn, factionId: army.factionId, type: 'movement_paused', cell: army.cell, message: `${army.name} paused its travel: ${reason}` }); }
}
function readyObjection(state: GameState, factionId: string, character: Character | undefined): string | null {
  if (!character || character.factionId !== factionId) return 'You do not control that character.';
  if (character.dead) return 'This character has died.';
  if (character.woundedTurns) return 'This character must recover from wounds first.';
  if (character.mission) return 'Cancel or complete this character’s mission first.';
  if (state.victory) return 'This campaign has ended in victory.';
  if (state.battle || state.pendingCapture) return 'Resolve the pending battle or capture first.';
  return null;
}
function townObjection(state: GameState, factionId: string, settlementId: string): string | null {
  const town = state.settlements[settlementId];
  if (!town || town.factionId !== factionId) return 'Choose a settlement you control.';
  if (town.occupationTurns || state.sieges[town.id]) return 'Appointments require an unoccupied settlement free of blockade.';
  return null;
}
function recruitmentObjection(state: GameState, factionId: string, settlementId: string, definitionId: string): string | null {
  const definition = definitions.get(definitionId);
  if (!definition) return 'Unknown character appointment.';
  const objection = townObjection(state, factionId, settlementId); if (objection) return objection;
  if (state.victory || state.battle || state.pendingCapture) return 'Resolve the current campaign decision first.';
  if (charactersForFaction(state, factionId).filter(item => !item.dead).length >= MAX_LIVING_CHARACTERS) return 'This faction already supports sixty-four living characters.';
  if ((treasury(state, factionId)?.treasury ?? 0) < definition.coinCost) return 'Not enough coin for this appointment.';
  return null;
}
function assignmentObjection(state: GameState, factionId: string, character: Character | undefined, armyId: string): string | null {
  const objection = readyObjection(state, factionId, character); if (objection || !character) return objection;
  const army = state.armies[armyId];
  if (!army || army.factionId !== factionId) return 'Choose an army you control.';
  if (character.location?.kind === 'army' && character.location.armyId === armyId) return 'This character is already assigned to that army.';
  if (characterCell(state, character) !== army.cell) return 'The character and army must share a hex.';
  if (armyHasCharacterMission(state, armyId) || character.location?.kind === 'army' && armyHasCharacterMission(state, character.location.armyId)) return 'Cancel the army’s stationary mission before changing its attachments.';
  const attached = charactersForArmy(state, armyId);
  if (role(character) === 'marshal' ? attached.some(item => role(item) === 'marshal') : attached.filter(item => role(item) !== 'marshal').length >= 2) return 'An army supports one marshal and two companions.';
  return null;
}
function unassignmentObjection(state: GameState, factionId: string, character: Character | undefined, settlementId: string): string | null {
  const objection = readyObjection(state, factionId, character) ?? townObjection(state, factionId, settlementId); if (objection || !character) return objection;
  if (character.location?.kind !== 'army') return 'This character is not attached to an army.';
  if (characterCell(state, character) !== state.settlements[settlementId]?.cell) return 'The army must be at the receiving settlement.';
  if (armyHasCharacterMission(state, character.location.armyId)) return 'Cancel the army’s stationary mission before changing its attachments.';
  return null;
}
function promotionObjection(state: GameState, factionId: string, character: Character | undefined, skillId: string): string | null {
  const objection = readyObjection(state, factionId, character); if (objection || !character) return objection;
  const skill = skills.get(skillId);
  if (!skill || !skill.roles.includes(role(character)) || !definitions.get(character.definitionId)?.skillIds.includes(skillId)) return 'That skill is not available to this character.';
  if (character.skillId) return 'This character has already chosen a permanent specialization.';
  if (character.experience < skill.experienceCost) return 'More field experience is required for this specialization.';
  return null;
}
function missionObjection(state: GameState, factionId: string, character: Character | undefined, missionId: string, targetCell?: number, settlementId?: string): string | null {
  const objection = readyObjection(state, factionId, character); if (objection || !character) return objection;
  const definition = missions.get(missionId);
  if (!definition || !definitions.get(character.definitionId)?.missionIds.includes(missionId)) return 'This character cannot undertake that mission.';
  if (character.location?.kind !== 'army') return 'Assign the character to an army before undertaking a field mission.';
  const army = state.armies[character.location.armyId]; if (!army) return 'The assigned army no longer exists.';
  if (armyHasCharacterMission(state, army.id)) return 'An army can support only one stationary mission at a time.';
  if (targetCell !== undefined && targetCell !== army.cell) return 'Field missions begin from the army’s current hex.';
  const skill = skills.get(character.skillId ?? '');
  if (definition.kind === 'survey') {
    if (settlementId) return 'A frontier survey does not target a settlement.';
    if (!cellsWithin(state, army.cell, definition.radius + (skill?.surveyRadiusBonus ?? 0)).some(cell => !state.explored[factionId]?.has(cell))) return 'This survey area is already explored.';
  } else if (definition.kind === 'refit') {
    if (settlementId) return 'A field refit applies to the attached army.';
    if (!army.formations.some(item => item.strength < (units.get(item.unitId)?.strength ?? 0))) return 'Every formation is already at full strength.';
    if (Object.values(state.sieges).some(item => item.armyId === army.id)) return 'Lift this army’s siege before refitting its formations.';
  } else {
    const town = settlementId ? state.settlements[settlementId] : undefined;
    if (!town || !indexes(state).visible.get(factionId)?.has(town.cell)) return 'Choose a currently visible besieged settlement.';
    const siege = state.sieges[town.id];
    if (!siege || siege.factionId !== factionId || siege.armyId !== army.id || !neighbors(army.cell, state.world.width, state.world.height).includes(town.cell)) return 'The character’s army must maintain this settlement’s siege.';
    if (!siege.defenses) return 'The settlement’s defenses are already breached.';
  }
  if ((treasury(state, factionId)?.treasury ?? 0) < definition.coinCost) return 'Not enough coin to fund this mission.';
  return null;
}

export function recruitCharacter(state: GameState, factionId: string, settlementId: string, definitionId: string): CommandResult {
  const error = recruitmentObjection(state, factionId, settlementId, definitionId); if (error) return fail(error);
  const faction = treasury(state, factionId)!; const definition = definitions.get(definitionId)!; const next = state.nextId;
  const character: Character = { id: `character.${next}`, factionId, definitionId, name: characterName(faction.definitionId, next), experience: 0, skillId: null, woundedTurns: 0, dead: false, location: { kind: 'settlement', settlementId }, mission: null };
  faction.treasury -= definition.coinCost; state.nextId++; state.characters[character.id] = character; rebuildCharacterIndexes(state);
  return { ok: true, events: [notice(state, character, 'character_recruited', `${character.name} was appointed ${definition.name} for ${definition.coinCost} coin.`)] };
}
export function assignCharacter(state: GameState, factionId: string, characterId: string, armyId: string): CommandResult {
  const character = state.characters[characterId]; const error = assignmentObjection(state, factionId, character, armyId); if (error || !character) return fail(error ?? 'Unknown character.');
  locate(state, character, { kind: 'army', armyId });
  return { ok: true, events: [notice(state, character, 'character_assigned', `${character.name} joined ${state.armies[armyId]!.name}.`)] };
}
export function unassignCharacter(state: GameState, factionId: string, characterId: string, settlementId: string): CommandResult {
  const character = state.characters[characterId]; const error = unassignmentObjection(state, factionId, character, settlementId); if (error || !character) return fail(error ?? 'Unknown character.');
  locate(state, character, { kind: 'settlement', settlementId });
  return { ok: true, events: [notice(state, character, 'character_unassigned', `${character.name} returned to ${state.settlements[settlementId]!.name}.`)] };
}
export function promoteCharacter(state: GameState, factionId: string, characterId: string, skillId: string): CommandResult {
  const character = state.characters[characterId]; const error = promotionObjection(state, factionId, character, skillId); if (error || !character) return fail(error ?? 'Unknown character.');
  const skill = skills.get(skillId)!; character.experience -= skill.experienceCost; character.skillId = skillId;
  return { ok: true, events: [notice(state, character, 'character_promoted', `${character.name} specialized in ${skill.name}, spending ${skill.experienceCost} experience.`)] };
}
export function startCharacterMission(state: GameState, factionId: string, characterId: string, missionId: string, targetCell?: number, settlementId?: string): CommandResult {
  const character = state.characters[characterId]; const error = missionObjection(state, factionId, character, missionId, targetCell, settlementId); if (error || !character || character.location?.kind !== 'army') return fail(error ?? 'Unknown character.');
  const definition = missions.get(missionId)!; const army = state.armies[character.location.armyId]!;
  character.mission = { id: `mission.${state.nextId++}`, definitionId: missionId, armyId: army.id, anchorCell: army.cell, targetSettlementId: settlementId ?? null, remainingTurns: definition.duration, startedTurn: state.turn };
  treasury(state, factionId)!.treasury -= definition.coinCost; army.movement = 0;
  const events = [notice(state, character, 'character_mission_started', `${character.name} began ${definition.name} with ${army.name}; ${definition.duration} stationary turns and ${definition.coinCost} coin committed.`)];
  pauseTravel(state, army.id, events); return { ok: true, events };
}
export function cancelCharacterMission(state: GameState, factionId: string, characterId: string): CommandResult {
  const character = state.characters[characterId]; if (!character || character.factionId !== factionId) return fail('You do not control that character.');
  if (!character.mission) return fail('This character has no active mission.');
  const name = missions.get(character.mission.definitionId)!.name; character.mission = null;
  return { ok: true, events: [notice(state, character, 'character_mission_cancelled', `${character.name} cancelled ${name}. Committed coin was not refunded; spent movement remains spent.`)] };
}

export function interruptArmyMissions(state: GameState, armyId: string, reason: string, events: DomainEvent[]): void {
  for (const character of charactersForArmy(state, armyId)) if (character.mission) { character.mission = null; events.push(notice(state, character, 'character_mission_interrupted', `${character.name} abandoned the field mission: ${reason}. Committed coin was not refunded.`)); }
}
/** Only siege-affecting commands need this bounded registry pass. */
export function reconcileCharacterMissions(state: GameState, events: DomainEvent[]): void {
  for (const character of Object.values(state.characters).sort(byId)) {
    const mission = character.mission;
    if (mission?.targetSettlementId && state.sieges[mission.targetSettlementId]?.armyId !== mission.armyId) interruptArmyMissions(state, mission.armyId, 'The supporting siege ended.', events);
  }
}
export function characterCompositionObjection(state: GameState, sourceArmyId: string, targetArmyId?: string, sourceWillEmpty = false): string | null {
  if (armyHasCharacterMission(state, sourceArmyId) || targetArmyId && armyHasCharacterMission(state, targetArmyId)) return 'Cancel the army’s stationary mission before reorganizing formations.';
  if (targetArmyId && sourceWillEmpty) {
    const combined = [...charactersForArmy(state, sourceArmyId), ...charactersForArmy(state, targetArmyId)];
    if (combined.filter(item => role(item) === 'marshal').length > 1 || combined.filter(item => role(item) !== 'marshal').length > 2) return 'The combined army would exceed one marshal or two companions. Reassign characters first.';
  }
  return null;
}
export function transferArmyCharacters(state: GameState, sourceArmyId: string, targetArmyId: string, events: DomainEvent[]): void {
  for (const character of charactersForArmy(state, sourceArmyId)) { locate(state, character, { kind: 'army', armyId: targetArmyId }); events.push(notice(state, character, 'character_assigned', `${character.name} joined ${state.armies[targetArmyId]!.name} when the armies combined.`)); }
}
function pruneDead(state: GameState, factionId: string): void {
  const dead = charactersForFaction(state, factionId).filter(item => item.dead).sort((a, b) => serial(b.id) - serial(a.id));
  for (const character of dead.slice(MAX_DEAD_CHARACTERS)) { characterIndex(state).factions.get(factionId)?.delete(character.id); delete state.characters[character.id]; }
}
function killCharacter(state: GameState, character: Character, reason: string, events: DomainEvent[], cell = characterCell(state, character)): void {
  character.dead = true; character.woundedTurns = 0; character.mission = null; locate(state, character, null);
  events.push(notice(state, character, 'character_died', `${character.name} died ${reason}.`, cell));
}
export function removeArmyCharacters(state: GameState, armyId: string, events: DomainEvent[], settlementId?: string): void {
  for (const character of charactersForArmy(state, armyId)) {
    if (settlementId) { character.mission = null; locate(state, character, { kind: 'settlement', settlementId }); events.push(notice(state, character, 'character_unassigned', `${character.name} remained at the newly founded settlement.`)); }
    else killCharacter(state, character, 'with the destroyed army', events);
  }
}
export function captureSettlementCharacters(state: GameState, settlementId: string, events: DomainEvent[]): void {
  const affected = fromIds(state, characterIndex(state).settlements.get(settlementId));
  for (const character of affected) killCharacter(state, character, 'when the settlement was conquered', events);
  for (const factionId of new Set(affected.map(item => item.factionId))) pruneDead(state, factionId);
}

export function advanceCharacters(state: GameState, events: DomainEvent[]): void {
  for (const character of Object.values(state.characters).sort(byId)) {
    if (character.dead) continue;
    if (character.woundedTurns) { character.woundedTurns--; if (!character.woundedTurns) events.push(notice(state, character, 'character_recovered', `${character.name} recovered from wounds.`)); }
    const mission = character.mission; if (!mission) continue;
    const army = state.armies[mission.armyId]; const definition = missions.get(mission.definitionId)!;
    if (!army || army.cell !== mission.anchorCell || character.location?.kind !== 'army' || character.location.armyId !== army.id) { character.mission = null; events.push(notice(state, character, 'character_mission_interrupted', `${character.name} could not remain at the mission’s original position.`)); continue; }
    if (definition.kind === 'sabotage' && (!mission.targetSettlementId || state.sieges[mission.targetSettlementId]?.armyId !== army.id)) { character.mission = null; events.push(notice(state, character, 'character_mission_interrupted', `${character.name} abandoned sabotage after the siege ended.`)); continue; }
    mission.remainingTurns--;
    if (mission.remainingTurns > 0) { events.push(notice(state, character, 'character_mission_progress', `${character.name}: ${definition.name} has ${mission.remainingTurns} stationary turns remaining.`)); continue; }
    const skill = skills.get(character.skillId ?? '');
    const roll = new SeededRandom((state.world.seed ^ serial(mission.id)) >>> 0).nextInt(100);
    const failed = roll < Math.max(0, definition.failureChance - (definition.kind === 'sabotage' ? skill?.sabotageRiskReduction ?? 0 : 0));
    character.mission = null;
    if (failed) { character.woundedTurns = definition.woundTurns; events.push(notice(state, character, 'character_mission_failed', `${character.name} failed ${definition.name} and was wounded for ${definition.woundTurns} turns.`)); continue; }
    let changed = 0; let detail = '';
    if (definition.kind === 'survey') {
      const explored = state.explored[character.factionId]!;
      for (const cell of cellsWithin(state, mission.anchorCell, definition.radius + (skill?.surveyRadiusBonus ?? 0))) if (!explored.has(cell)) { explored.add(cell); changed++; }
      detail = `${changed} previously unknown terrain hexes charted; hidden armies were not revealed`;
    } else if (definition.kind === 'refit') {
      for (const item of army.formations) { const added = Math.min(definition.strengthRestore + (skill?.refitBonus ?? 0), (units.get(item.unitId)?.strength ?? item.strength) - item.strength); item.strength += added; changed += added; }
      detail = `${changed} formation strength restored`;
    } else {
      const siege = state.sieges[mission.targetSettlementId!]!;
      changed = Math.min(siege.defenses, definition.defenseDamage); siege.defenses -= changed;
      detail = `${changed} settlement defense removed`;
    }
    const experience = changed ? definition.experience : 0; character.experience = Math.min(1_000_000, character.experience + experience);
    events.push(notice(state, character, 'character_mission_completed', `${character.name} completed ${definition.name}: ${detail}; ${experience} experience earned.`));
  }
}

export function characterLeadership(character: Pick<Character, 'definitionId' | 'skillId' | 'woundedTurns' | 'dead'>): { attack: number; armor: number } {
  if (character.dead || character.woundedTurns) return { attack: 0, armor: 0 };
  const definition = definitions.get(character.definitionId); const skill = skills.get(character.skillId ?? '');
  return { attack: (definition?.leadership.attack ?? 0) + (skill?.leadership.attack ?? 0), armor: (definition?.leadership.armor ?? 0) + (skill?.leadership.armor ?? 0) };
}
export function armyCharacterLeadership(state: GameState, armyId: string): { attack: number; armor: number } {
  return charactersForArmy(state, armyId).reduce((sum, character) => { const effect = characterLeadership(character); return { attack: sum.attack + effect.attack, armor: sum.armor + effect.armor }; }, { attack: 0, armor: 0 });
}
export function snapshotArmyCharacters(state: GameState, armies: Army[]): CharacterBattleSnapshot[] {
  return armies.flatMap(army => charactersForArmy(state, army.id).map(character => ({ characterId: character.id, armyId: army.id, factionId: character.factionId, name: character.name, definitionId: character.definitionId, skillId: character.skillId, experience: character.experience, woundedTurns: character.woundedTurns, leadership: characterLeadership(character), rallyRestore: role(character) === 'marshal' && !character.woundedTurns ? (COMMANDER_ABILITIES.find(item => item.id === 'ability.rally')?.moraleRestore ?? 0) + (skills.get(character.skillId ?? '')?.rallyBonus ?? 0) : 0 }))).sort((a, b) => a.characterId < b.characterId ? -1 : 1);
}
export function finishBattleCharacters(state: GameState, battle: CampaignBattle, events: DomainEvent[]): void {
  if (battle.rulesVersion < 7) return;
  for (const snapshot of battle.characterSnapshots) {
    const character = state.characters[snapshot.characterId]; if (!character) throw new Error('Battle character is missing');
    const ending = battle.aftermath.find(item => item.armyId === snapshot.armyId);
    if (!ending) throw new Error('Battle character has no army outcome');
    if (ending.outcome === 'destroyed') killCharacter(state, character, 'with the destroyed army', events, snapshot.armyId === battle.attackerId ? battle.attackerCell : battle.defenderCell);
    else {
      const won = battle.combat.result?.winner === (snapshot.factionId === battle.attackerFactionId ? 'attacker' : 'defender');
      const experience = won ? 3 : 1; character.experience = Math.min(1_000_000, character.experience + experience);
      if (ending.outcome === 'retreated') character.woundedTurns = Math.max(character.woundedTurns, 2);
      events.push(notice(state, character, 'character_battle_experience', `${character.name} earned ${experience} battle experience${ending.outcome === 'retreated' ? ` and suffered wounds requiring ${character.woundedTurns} turns of recovery` : ''}.`));
    }
    battle.characterAftermath.push({ characterId: character.id, name: character.name, outcome: character.dead ? 'dead' : character.woundedTurns ? 'wounded' : 'survived', experience: character.experience, woundedTurns: character.woundedTurns });
  }
  for (const factionId of new Set(battle.characterSnapshots.map(item => item.factionId))) pruneDead(state, factionId);
}
function abilityObjection(state: GameState, factionId: string, characterId: string, abilityId: string): string | null {
  const battle = state.battle;
  if (!battle || battle.rulesVersion < 7) return 'There is no character-enabled pending battle.';
  if (abilityId !== 'ability.rally') return 'Unknown commander ability.';
  const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId;
  if (factionId !== controller) return 'Only the controlling battle participant may issue tactical orders.';
  const snapshot = battle.characterSnapshots.find(item => item.characterId === characterId);
  if (!snapshot || snapshot.factionId !== factionId || !snapshot.rallyRestore) return 'Choose an eligible commander on your side of the battle.';
  if (battle.usedAbilities.some(item => item.characterId === characterId && item.abilityId === abilityId)) return 'This commander has already rallied in this battle.';
  const ids = new Set(battle.formationBindings.filter(item => item.armyId === snapshot.armyId).map(item => item.battleFormationId));
  if (![...battle.combat.attacker, ...battle.combat.defender].some(item => ids.has(item.id) && item.strength > 0 && item.morale > 0 && item.morale < (units.get(item.unitId)?.morale ?? 0))) return 'No active formation in this army needs a morale rally.';
  return null;
}
function rally(state: GameState, battle: CampaignBattle, snapshot: CharacterBattleSnapshot, events: DomainEvent[]): void {
  const ids = new Set(battle.formationBindings.filter(item => item.armyId === snapshot.armyId).map(item => item.battleFormationId)); let restored = 0;
  for (const item of [...battle.combat.attacker, ...battle.combat.defender]) if (ids.has(item.id) && item.strength > 0 && item.morale > 0) { const amount = Math.max(0, Math.min(snapshot.rallyRestore, (units.get(item.unitId)?.morale ?? item.morale) - item.morale)); item.morale += amount; restored += amount; }
  battle.usedAbilities.push({ characterId: snapshot.characterId, abilityId: 'ability.rally' });
  events.push({ turn: state.turn, factionId: snapshot.factionId, type: 'commander_rallied', cell: battle.defenderCell, message: `${snapshot.name} rallied the army, restoring ${restored} formation morale in total.` });
}
export function useCommanderAbility(state: GameState, factionId: string, characterId: string, abilityId: string): CommandResult {
  const error = abilityObjection(state, factionId, characterId, abilityId); if (error || !state.battle) return fail(error ?? 'Missing battle.');
  const events: DomainEvent[] = []; rally(state, state.battle, state.battle.characterSnapshots.find(item => item.characterId === characterId)!, events); return { ok: true, events };
}
export function automaticallyRally(state: GameState, battle: CampaignBattle, factionIds: string[], events: DomainEvent[]): void {
  if (battle.rulesVersion < 7) return;
  const threshold = COMMANDER_ABILITIES.find(item => item.id === 'ability.rally')?.threshold ?? 0;
  for (const snapshot of battle.characterSnapshots) {
    if (!factionIds.includes(snapshot.factionId) || !snapshot.rallyRestore || battle.usedAbilities.some(item => item.characterId === snapshot.characterId)) continue;
    const ids = new Set(battle.formationBindings.filter(item => item.armyId === snapshot.armyId).map(item => item.battleFormationId));
    if ([...battle.combat.attacker, ...battle.combat.defender].some(item => ids.has(item.id) && item.strength > 0 && item.morale > 0 && item.morale < threshold)) rally(state, battle, snapshot, events);
  }
}

export function observeArmyCharacters(state: GameState, armyId: string): { commander: CharacterSummary | null; agents: CharacterSummary[] } { const attached = charactersForArmy(state, armyId); return { commander: attached.find(item => role(item) === 'marshal') ? summary(attached.find(item => role(item) === 'marshal')!) : null, agents: attached.filter(item => role(item) !== 'marshal').map(summary) }; }
export function observeCommanderAbilities(state: GameState, factionId: string): CommanderAbilityOption[] {
  return (state.battle?.characterSnapshots ?? []).filter(item => item.factionId === factionId && item.rallyRestore > 0).map(item => { const blocker = abilityObjection(state, factionId, item.characterId, 'ability.rally'); return { characterId: item.characterId, armyId: item.armyId, abilityId: 'ability.rally', name: 'Rally', effectText: `Restore up to ${item.rallyRestore} morale to each active formation in this army, once this battle. Routed formations cannot rally.`, used: state.battle!.usedAbilities.some(ability => ability.characterId === item.characterId), canUse: blocker === null, blocker }; });
}
export function getCharacterObservation(state: GameState, factionId: string): { characters: CharacterView[]; characterRecruitment: CharacterRecruitmentOption[] } {
  const characters = charactersForFaction(state, factionId).map(character => {
    const cell = characterCell(state, character); const definition = definitions.get(character.definitionId)!;
    const coLocated = cell === null ? [] : [...(indexes(state).armies.get(cell) ?? [])].map(id => state.armies[id]!).filter(army => army.factionId === factionId).sort(byId);
    const town = cell === null ? undefined : state.settlements[indexes(state).settlements.get(cell) ?? ''];
    const missionOptions = definition.missionIds.flatMap(missionId => {
      const mission = missions.get(missionId)!; const skill = skills.get(character.skillId ?? '');
      const targets = mission.kind === 'sabotage' ? (cell === null ? [] : neighbors(cell, state.world.width, state.world.height).flatMap(target => { const id = indexes(state).settlements.get(target); return id && indexes(state).visible.get(factionId)?.has(target) ? [id] : []; })) : [undefined];
      return targets.map(settlementId => {
        const blocker = missionObjection(state, factionId, character, missionId, cell ?? undefined, settlementId);
        const effectText = mission.kind === 'survey' ? `Chart terrain within ${mission.radius + (skill?.surveyRadiusBonus ?? 0)} hexes without revealing hidden armies.` : mission.kind === 'refit' ? `Restore up to ${mission.strengthRestore + (skill?.refitBonus ?? 0)} missing strength per formation.` : `Remove up to ${mission.defenseDamage} remaining siege defenses; failure risk ${Math.max(0, mission.failureChance - (skill?.sabotageRiskReduction ?? 0))}%.`;
        return { missionId, name: mission.name, description: mission.description, duration: mission.duration, coinCost: mission.coinCost, risk: mission.failureChance ? 'dangerous' as const : 'exposed' as const, riskText: mission.failureChance ? `The operation may fail and wound its agent for ${mission.woundTurns} turns. Combat or displacement interrupts it without refund.` : 'The army must remain in position; combat or displacement interrupts the mission without refund.', effectText, ...(cell === null ? {} : { targetCell: cell }), ...(settlementId ? { settlementId } : {}), canStart: blocker === null, blocker };
      });
    });
    return { ...character, location: character.location ? { ...character.location } : null, mission: character.mission ? { ...character.mission } : null, ...summary(character), cell,
      assignmentOptions: coLocated.map(army => { const blocker = assignmentObjection(state, factionId, character, army.id); return { armyId: army.id, label: army.name, canAssign: blocker === null, blocker }; }),
      unassignmentOptions: town?.factionId === factionId ? [{ settlementId: town.id, label: town.name, canUnassign: unassignmentObjection(state, factionId, character, town.id) === null, blocker: unassignmentObjection(state, factionId, character, town.id) }] : [],
      missions: missionOptions,
      promotions: definition.skillIds.map(skillId => { const skill = skills.get(skillId)!; const blocker = promotionObjection(state, factionId, character, skillId); return { skillId, name: skill.name, description: skill.description, experienceCost: skill.experienceCost, canPromote: blocker === null, blocker }; }),
    };
  });
  const characterRecruitment = Object.values(state.settlements).filter(town => town.factionId === factionId).sort(byId).flatMap(town => CHARACTER_DEFINITIONS.map(definition => { const blocker = recruitmentObjection(state, factionId, town.id, definition.id); return { settlementId: town.id, definitionId: definition.id, name: definition.name, role: definition.role, coinCost: definition.coinCost, upkeep: definition.upkeep, canRecruit: blocker === null, blocker }; }));
  return { characters, characterRecruitment };
}
export const characterUpkeep = (state: GameState, factionId: string): number => charactersForFaction(state, factionId).reduce((sum, item) => sum + (item.dead ? 0 : definitions.get(item.definitionId)?.upkeep ?? 0), 0);

/** Strict cross-reference validation before indexes are trusted or anything is repaired. */
export function validateCharacters(state: GameState): void {
  const require = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: ' + message); };
  const missionIds = new Set<string>(); const assigned = new Map<string, Character[]>(); const living = new Map<string, number>(); const dead = new Map<string, number>();
  for (const [id, character] of Object.entries(state.characters)) {
    require(id === character.id && /^character\.[1-9][0-9]*$/.test(id) && serial(id) < state.nextId, 'invalid character identity');
    const definition = definitions.get(character.definitionId); require(definition && state.factions.some(item => item.id === character.factionId), 'invalid character definition or owner');
    require(character.skillId === null || definition?.skillIds.includes(character.skillId) && skills.get(character.skillId)?.roles.includes(definition.role), 'invalid character specialization');
    require(character.name.trim() === character.name && [...character.name].every(char => char.charCodeAt(0) >= 32 && char !== '<' && char !== '>'), 'invalid character name');
    const count = character.dead ? dead : living; count.set(character.factionId, (count.get(character.factionId) ?? 0) + 1);
    if (character.dead) { require(character.location === null && character.mission === null && character.woundedTurns === 0, 'dead character cannot remain assigned or active'); continue; }
    const location = character.location; require(location, 'living character has no location'); if (!location) continue;
    if (location.kind === 'army') { require(state.armies[location.armyId]?.factionId === character.factionId, 'character army ownership differs'); const roster = assigned.get(location.armyId) ?? []; roster.push(character); assigned.set(location.armyId, roster); }
    else require(state.settlements[location.settlementId]?.factionId === character.factionId, 'character settlement ownership differs');
    const mission = character.mission;
    if (mission) {
      const content = missions.get(mission.definitionId); const army = state.armies[mission.armyId];
      require(content && definition?.missionIds.includes(mission.definitionId) && !character.woundedTurns, 'invalid active character mission');
      require(/^mission\.[1-9][0-9]*$/.test(mission.id) && serial(mission.id) < state.nextId && !missionIds.has(mission.id), 'invalid mission identity'); missionIds.add(mission.id);
      require(location.kind === 'army' && location.armyId === mission.armyId && army && army.cell === mission.anchorCell && army.movement === 0 && mission.startedTurn <= state.turn && mission.remainingTurns === (content?.duration ?? 0) - (state.turn - mission.startedTurn), 'mission position, timing or carrier differs');
      require(content?.kind === 'sabotage' ? mission.targetSettlementId && state.sieges[mission.targetSettlementId]?.armyId === mission.armyId : mission.targetSettlementId === null, 'mission target differs');
      require(!state.routes[mission.armyId] || state.routes[mission.armyId]?.status === 'paused', 'mission cannot retain active travel');
    }
  }
  for (const roster of assigned.values()) require(roster.filter(item => role(item) === 'marshal').length <= 1 && roster.filter(item => role(item) !== 'marshal').length <= 2 && roster.filter(item => item.mission).length <= 1, 'army character capacity exceeded');
  for (const count of living.values()) require(count <= MAX_LIVING_CHARACTERS, 'living character limit exceeded');
  for (const count of dead.values()) require(count <= MAX_DEAD_CHARACTERS, 'dead character history exceeded');
}
