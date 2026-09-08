import { z } from 'zod';
import { BUILDINGS, CHARACTER_DEFINITIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, CONTENT_HASH, DOCTRINES, FACTIONS, FACTION_ROSTERS, UNITS, campaignPaceSchema, checksum, legacyRosterVersionSchema, rosterVersionSchema } from '@theandril/content';
import { BIOME, deriveBiomes, deriveWaterDepth, isLake, isPassable, isValidBiome, neighbors, SeededRandom, validateHydrology } from '@theandril/mapgen';
import { emptyRoadState, roadStateSchema, validateRoads } from './roads';
import { applyCommand, initializeLegacyLand, MAX_EVENTS } from './simulation';
import { emptyLandState, landStateSchema, landStateV10Schema, validateLand, validateLandKnowledge } from './territory';
import { cellsWithin, rebuildIndexes } from './visibility';
import type { Army, CampaignBattle, GameCommand, GameState } from './types';
import { battleStateSchema, legacyBattleStateSchema, schema13BattleStateSchema } from './combat';
import { arcaneResearchSchema, validateArcaneResearch } from './magic';
import { battleAbilityStateSchema, validateBattleAbilities } from './battle-abilities';
import { MAX_BATTLE_REPORTS } from './warfare';
import { createDiplomacy, diplomacyStateSchema, validateDiplomacy } from './diplomacy';
import { captureDecisionSchema, ruinSchema, siegeSchema, validateSieges } from './siege';
import { createFactionProgression, doctrineEffects, factionProgressionSchema, validateProgression, victoryProjectSchema, victorySchema } from './progression';
import { movementRouteSchema, validateMovement } from './movement';

import { armyMovement, effectiveArmyMovement, armySight } from './army-composition';
import { armyDomain, armyTerrainBlocker, validateTransports } from './naval';
import { LEGACY_UNIT_IDS, type RulesVersion } from './rules';
import { characterAftermathSchema, characterBattleSnapshotSchema, schema13CharacterBattleSnapshotSchema, schema13CharacterSchema, legacyCharacterBattleSnapshotSchema, characterLeadership, characterSkillEffects, characterSchema, legacyCharacterSchema, rebuildCharacterIndexes, validateCharacters, validateCharacterTraining } from './characters';

export const SAVE_VERSION = 14;
export const PRE_BATTLE_CONTENT_HASH = '07a58d4f';
export const PRE_EXPANDED_ROSTER_CONTENT_HASH = '3c54fb02';
export const PRE_GEOGRAPHY_CONTENT_HASH = '3c54fb02';
export const PRE_CITY_RESEARCH_CONTENT_HASH = '4c2fed32';
export const PRE_ROSTER_CONTENT_HASH = '9418e598';
export const PRE_TERRITORY_CONTENT_HASH = '257e1e91';
export const PRE_NAVAL_CONTENT_HASH = '9442246b';
export const PRE_CHARACTER_CONTENT_HASH = '96918834';
export const PRE_ARMY_CONTENT_HASH = '3139d4e7';
export const PRE_TRAVEL_CONTENT_HASH = '3139d4e7';
export const PRE_PROGRESSION_CONTENT_HASH = '4dec81ae';
/** The only v1 content pack whose unchanged economic fields can migrate safely. */
export const PRE_COMBAT_CONTENT_HASH = '7baddaff';
const integer = z.number().int().min(0).max(1_000_000_000);
const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const name = z.string().min(1).max(80).refine(value => value.trim() === value && [...value].every(char => char.charCodeAt(0) >= 32 && char !== '<' && char !== '>'));
const cell = z.number().int().min(0).max(349_999);
const worldV4Schema = z.object({
  seed: z.number().int().min(0).max(0xffff_ffff), width: z.number().int().min(1).max(4096), height: z.number().int().min(1).max(4096),
  terrain: z.array(z.number().int().min(0).max(4)).max(350_000),
  fertility: z.array(z.number().int().min(0).max(100)).max(350_000),
  starts: z.array(cell).min(1).max(48),
}).strict();
const worldV7Schema = worldV4Schema.extend({ biome: z.array(z.number().int().min(0).max(9)).max(350_000), generatorVersion: z.union([z.literal(1), z.literal(2)]) }).strict();
const worldV8Schema = worldV7Schema.extend({ generatorVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]), waterDepth: z.array(z.number().int().min(0).max(2)).max(350_000) }).strict();
const worldSchema = worldV8Schema.extend({ generatorVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), biome: z.array(z.number().int().refine(isValidBiome, 'Unknown biome')).max(350_000) }).strict();
const factionSchema = z.object({ id, definitionId: id, name, color: z.number().int().min(0).max(0xffffff), treasury: integer, knowledge: integer }).strict();
const armyV1Schema = z.object({ id, factionId: id, name, unitId: id, cell, movement: integer, strength: integer.positive() }).strict();
const armyV5Schema = armyV1Schema.extend({ morale: z.number().int().min(1).max(100), fatigue: z.number().int().min(0).max(100) }).strict();
export const armyFormationSchema = z.object({ id, unitId: id, strength: integer.positive(), morale: z.number().int().min(1).max(100), fatigue: z.number().int().min(0).max(100) }).strict();
const armyV7Schema = z.object({ id, factionId: id, name, cell, movement: integer, formations: z.array(armyFormationSchema).min(1).max(12) }).strict();
const armySchema = armyV7Schema.extend({ formations: z.array(armyFormationSchema).min(1).max(20) }).strict();
const settlementV2Schema = z.object({
  id, factionId: id, name, cell, population: z.number().int().min(1).max(20), food: integer,
  buildings: z.array(id).max(1000), queue: z.array(z.object({ itemId: id, progress: integer }).strict()).max(5),
}).strict();
const settlementSchema = settlementV2Schema.extend({ founderFactionId: id, devastation: z.number().int().min(0).max(100), occupationTurns: z.number().int().min(0).max(5) }).strict();
export const eventSchema = z.object({ turn: z.number().int().min(1).max(1_000_000), type: id, message: z.string().min(1).max(400), factionId: id, cell: cell.optional() }).strict();
const stateV1Shape = {
  turn: z.number().int().min(1).max(1_000_000), nextId: integer.positive(), turnOwnerId: id,
  world: worldV4Schema,
  factions: z.array(factionSchema).min(1).max(48),
  armies: z.array(armyV1Schema).max(60_000), settlements: z.array(settlementV2Schema).max(30_000),
  explored: z.array(z.object({ factionId: id, cells: z.array(cell).max(350_000) }).strict()).min(1).max(48),
  events: z.array(eventSchema).max(MAX_EVENTS),
};
const campaignBattleV2Schema = z.object({
  id, turn: z.number().int().min(1).max(1_000_000), attackerId: id, defenderId: id,
  defenderIds: z.array(id).min(1).max(12), attackerFactionId: id, defenderFactionId: id,
  attackerCell: cell, defenderCell: cell,
  initialStrengths: z.array(z.object({ armyId: id, strength: integer.positive() }).strict()).min(2).max(13),
  aftermath: z.array(z.object({ armyId: id, strength: integer, cell: cell.nullable(), outcome: z.enum(['held', 'advanced', 'retreated', 'destroyed']) }).strict()).max(13),
  combat: legacyBattleStateSchema,
}).strict();
const campaignBattleV3Schema = campaignBattleV2Schema.extend({ settlementId: id.nullable(), militiaId: id.nullable(), fortification: z.number().int().min(0).max(3) }).strict();
export const legacyCampaignBattleSchema = campaignBattleV3Schema.extend({ attackerDoctrineId: id.nullable(), defenderDoctrineId: id.nullable() }).strict();
export const schema6CampaignBattleSchema = legacyCampaignBattleSchema.extend({
  rulesVersion: z.union([z.literal(5), z.literal(6)]),
  formationBindings: z.array(z.object({ battleFormationId: id, formationId: id, armyId: id.nullable() }).strict()).min(2).max(24),
  formationStrengths: z.array(z.object({ formationId: id, strength: integer.positive() }).strict()).min(2).max(24),
  formationAftermath: z.array(z.object({ formationId: id, strength: integer }).strict()).max(24),
}).strict();
export const schema7CampaignBattleSchema = schema6CampaignBattleSchema.extend({
  rulesVersion: z.union([z.literal(5), z.literal(6), z.literal(7)]),
  characterSnapshots: z.array(legacyCharacterBattleSnapshotSchema).max(39),
  characterAftermath: z.array(characterAftermathSchema).max(39),
  usedAbilities: z.array(z.object({ characterId: id, abilityId: id }).strict()).max(13),
}).strict();
const transportAftermathSchema = z.object({ armyId: id, name, lostFormationIds: z.array(id).min(1).max(20), outcome: z.enum(['damaged', 'lost']) }).strict();
const transportSnapshotSchema = z.object({ armyId: id, fleetId: id, factionId: id, name, formationIds: z.array(id).min(1).max(20) }).strict();
export const schema13CampaignBattleSchema = schema7CampaignBattleSchema.extend({
  rulesVersion: z.union([z.literal(5), z.literal(6), z.literal(7), z.literal(8)]),
  domain: z.enum(['land', 'naval']), transportAftermath: z.array(transportAftermathSchema).max(320),
  transportSnapshots: z.array(transportSnapshotSchema).max(320),
  defenderIds: z.array(id).min(1).max(20),
  initialStrengths: z.array(z.object({ armyId: id, strength: integer.positive() }).strict()).min(2).max(21),
  aftermath: z.array(z.object({ armyId: id, strength: integer, cell: cell.nullable(), outcome: z.enum(['held', 'advanced', 'retreated', 'destroyed']) }).strict()).max(21),
  combat: schema13BattleStateSchema,
  formationBindings: z.array(z.object({ battleFormationId: id, formationId: id, armyId: id.nullable() }).strict()).min(2).max(40),
  formationStrengths: z.array(z.object({ formationId: id, strength: integer.positive() }).strict()).min(2).max(40),
  formationAftermath: z.array(z.object({ formationId: id, strength: integer }).strict()).max(40),
  characterSnapshots: z.array(schema13CharacterBattleSnapshotSchema).max(63), characterAftermath: z.array(characterAftermathSchema).max(63),
  usedAbilities: z.array(z.object({ characterId: id, abilityId: id }).strict()).max(21),
}).strict();
export const campaignBattleSchema = schema13CampaignBattleSchema.extend({
  rulesVersion: z.union([z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9)]),
  combat: battleStateSchema, characterSnapshots: z.array(characterBattleSnapshotSchema).max(63), abilityState: battleAbilityStateSchema.optional(),
}).strict();
const stateV1Schema = z.object(stateV1Shape).strict();
const stateV2Shape = {
  ...stateV1Shape, armies: z.array(armyV5Schema).max(60_000),
  wars: z.array(z.tuple([id, id])).max(1128),
  battle: campaignBattleV2Schema.nullable(), battleReports: z.array(campaignBattleV2Schema).max(MAX_BATTLE_REPORTS),
};
const stateV2Schema = z.object(stateV2Shape).strict();
const stateV3Shape = {
  ...stateV2Shape, settlements: z.array(settlementSchema).max(30_000),
  battle: campaignBattleV3Schema.nullable(), battleReports: z.array(campaignBattleV3Schema).max(MAX_BATTLE_REPORTS),
  sieges: z.array(siegeSchema).max(30_000), pendingCapture: captureDecisionSchema.nullable(), ruins: z.array(ruinSchema).max(30_000), diplomacy: diplomacyStateSchema,
};
const stateV3Schema = z.object(stateV3Shape).strict();
const stateV4Schema = stateV3Schema.extend({
  pace: campaignPaceSchema,
  battle: legacyCampaignBattleSchema.nullable(), battleReports: z.array(legacyCampaignBattleSchema).max(MAX_BATTLE_REPORTS),
  progression: z.array(z.object({ factionId: id, ...factionProgressionSchema.shape }).strict()).min(1).max(48),
  projects: z.array(victoryProjectSchema).max(48), victory: victorySchema.nullable(),
}).strict();
const stateV5Schema = stateV4Schema.extend({ world: worldV7Schema, routes: z.array(movementRouteSchema).max(60_000) }).strict();
const stateV6Schema = stateV5Schema.extend({ armies: z.array(armyV7Schema).max(60_000), battle: schema6CampaignBattleSchema.nullable(), battleReports: z.array(schema6CampaignBattleSchema).max(MAX_BATTLE_REPORTS) }).strict();
const stateV7Schema = stateV6Schema.extend({ characters: z.array(legacyCharacterSchema).max(4608), battle: schema7CampaignBattleSchema.nullable(), battleReports: z.array(schema7CampaignBattleSchema).max(MAX_BATTLE_REPORTS) }).strict();
const stateV8Schema = stateV7Schema.extend({ world: worldV8Schema, armies: z.array(armySchema).max(60_000), characters: z.array(schema13CharacterSchema).max(4608), battle: schema13CampaignBattleSchema.nullable(), battleReports: z.array(schema13CampaignBattleSchema).max(MAX_BATTLE_REPORTS), transports: z.array(z.object({ armyId: id, fleetId: id }).strict()).max(60_000) }).strict();
const stateV9Schema = stateV8Schema.extend({ world: worldSchema, land: landStateV10Schema }).strict();
// This schema must never inherit a later roster enum through an expanded alias.
const stateV10Schema = stateV9Schema.extend({ rosterVersion: legacyRosterVersionSchema }).strict();
const stateV11Schema = stateV10Schema.extend({ land: landStateSchema }).strict();
const modernWorldSchema = worldSchema.extend({ generatorVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)]), layout: z.enum(['legacy', 'continents', 'islands', 'archipelago']), hydrology: z.array(z.number().int().min(0).max(63)).max(350_000) }).strict();
const stateV12Schema = stateV11Schema.extend({ world: modernWorldSchema, roads: roadStateSchema }).strict();
const stateV13Schema = stateV12Schema.extend({ rosterVersion: rosterVersionSchema }).strict();
const stateSchema = stateV13Schema.extend({ characters: z.array(characterSchema).max(4608), battle: campaignBattleSchema.nullable(), battleReports: z.array(campaignBattleSchema).max(MAX_BATTLE_REPORTS), arcaneResearch: arcaneResearchSchema }).strict();
const saveSchema = z.object({ version: z.literal(14), gameVersion: z.literal('0.1.0'), contentHash: z.string(), stateChecksum: z.string().regex(/^[a-f0-9]{8}$/), state: stateSchema }).strict();
const saveV13Schema = saveSchema.extend({ version: z.literal(13), state: stateV13Schema }).strict();
const saveV12Schema = saveSchema.extend({ version: z.literal(12), state: stateV12Schema }).strict();
const saveV11Schema = saveSchema.extend({ version: z.literal(11), state: stateV11Schema }).strict();
const saveV10Schema = saveSchema.extend({ version: z.literal(10), state: stateV10Schema }).strict();
const saveV9Schema = saveSchema.extend({ version: z.literal(9), state: stateV9Schema }).strict();
const saveV8Schema = saveSchema.extend({ version: z.literal(8), state: stateV8Schema }).strict();
const saveV7Schema = saveSchema.extend({ version: z.literal(7), state: stateV7Schema }).strict();
const saveV6Schema = saveSchema.extend({ version: z.literal(6), state: stateV6Schema }).strict();
const saveV5Schema = saveSchema.extend({ version: z.literal(5), state: stateV5Schema }).strict();
const saveV4Schema = saveSchema.extend({ version: z.literal(4), state: stateV4Schema }).strict();
const saveV3Schema = saveSchema.extend({ version: z.literal(3), state: stateV3Schema }).strict();
const saveV2Schema = saveSchema.extend({ version: z.literal(2), state: stateV2Schema }).strict();
const saveV1Schema = saveSchema.extend({ version: z.literal(1), state: stateV1Schema }).strict();
// v0 is the pre-release snapshot using nextEntityId. Its explicit schema rejects
// unknown fields before migration; no user state is silently dropped.
const legacyStateSchema = stateV1Schema.omit({ nextId: true }).extend({ nextEntityId: integer.positive() }).strict();
const legacySchema = z.object({ version: z.literal(0), gameVersion: z.literal('0.0.0'), contentHash: z.string(), state: legacyStateSchema }).strict();

const compareId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
function canonicalLand(state: GameState) {
  // The old JSON round trip removed prototypes before validation. Do not let
  // Zod's ordinary property reads start accepting inherited canonical fields.
  const plain = (value: unknown): void => {
    if (!value || typeof value !== 'object') throw new Error('Canonical land requires plain data records.');
    const prototype: unknown = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error('Canonical land requires plain data records.');
  };
  const source = state.land;
  plain(source); plain(source.settlements); plain(source.biomes); plain(source.capitals); plain(source.cultivation); plain(source.known);
  for (const town of Object.values(source.settlements)) {
    plain(town); plain(town.improvements);
    if (town.work !== null) plain(town.work);
  }
  for (const cells of Object.values(source.known)) {
    plain(cells);
    for (const known of Object.values(cells)) plain(known);
  }
  // Parse the *whole* original object: unknown keys and invalid values must be
  // rejected, not silently omitted by a hand-written projection. This also
  // detaches all nested data and emits fixed fields in the exact schema order.
  const land = landStateSchema.parse(source);
  const sorted = <T>(record: Record<string, T>): Record<string, T> => Object.fromEntries(Object.entries(record).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  // Only ID dictionaries need sorting. Validated cell keys are canonical array
  // indexes (0..999999), so JavaScript already enumerates them numerically.
  land.settlements = sorted(land.settlements);
  land.capitals = sorted(land.capitals);
  land.cultivation = sorted(land.cultivation);
  land.known = sorted(land.known);
  return land;
}

/** Restored explored sets already arrive in canonical order. Keep the original
 * sort for every other input, including malformed values and coercion errors. */
function sortedExploredCells(cells: Iterable<number>): number[] {
  const copied = [...cells];
  for (let index = 1; index < copied.length; index++) {
    const previous = copied[index - 1], next = copied[index];
    if (typeof previous !== 'number' || typeof next !== 'number' || !(previous <= next)) return copied.sort((a, b) => a - b);
  }
  return copied;
}

function canonicalRoads(state: GameState) {
  const plain = (value: object) => { const prototype: unknown = Object.getPrototypeOf(value); if (prototype !== Object.prototype && prototype !== null) throw new Error('Canonical roads require plain data records.'); };
  plain(state.roads); plain(state.roads.edges); plain(state.roads.projects); plain(state.roads.known);
  for (const project of Object.values(state.roads.projects)) plain(project);
  for (const known of Object.values(state.roads.known)) plain(known);
  const roads = roadStateSchema.parse(state.roads);
  roads.projects = Object.fromEntries(Object.entries(roads.projects).sort(([a], [b]) => a < b ? -1 : 1));
  roads.known = Object.fromEntries(Object.entries(roads.known).sort(([a], [b]) => a < b ? -1 : 1));
  return roads;
}

function canonicalPayload(state: GameState) {
  const payload = {
      turn: state.turn, nextId: state.nextId, turnOwnerId: state.turnOwnerId,
      world: { seed: state.world.seed, width: state.world.width, height: state.world.height, terrain: [...state.world.terrain], fertility: [...state.world.fertility], starts: [...state.world.starts], biome: [...state.world.biome], generatorVersion: state.world.generatorVersion, waterDepth: [...state.world.waterDepth], layout: state.world.layout, hydrology: [...state.world.hydrology] },
      factions: state.factions.map(faction => ({ id: faction.id, definitionId: faction.definitionId, name: faction.name, color: faction.color, treasury: faction.treasury, knowledge: faction.knowledge })),
      armies: Object.values(state.armies).sort(compareId).map(army => ({ id: army.id, factionId: army.factionId, name: army.name, cell: army.cell, movement: army.movement, formations: army.formations.map(item => armyFormationSchema.parse(item)) })),
      settlements: Object.values(state.settlements).sort(compareId).map(settlement => ({ id: settlement.id, factionId: settlement.factionId, name: settlement.name, cell: settlement.cell, population: settlement.population, food: settlement.food, buildings: [...settlement.buildings].sort(), queue: settlement.queue.map(queued => ({ itemId: queued.itemId, progress: queued.progress })), founderFactionId: settlement.founderFactionId, devastation: settlement.devastation, occupationTurns: settlement.occupationTurns })),
      explored: state.factions.map(faction => ({ factionId: faction.id, cells: sortedExploredCells(state.explored[faction.id] ?? []) })),
      events: state.events.map(event => ({ turn: event.turn, type: event.type, message: event.message, factionId: event.factionId, ...(event.cell === undefined ? {} : { cell: event.cell }) })),
      wars: state.wars.map(pair => [...pair]),
      battle: state.battle ? campaignBattleSchema.parse(state.battle) : null,
      battleReports: state.battleReports.map(battle => campaignBattleSchema.parse(battle)),
      sieges: Object.values(state.sieges).sort((a, b) => a.settlementId < b.settlementId ? -1 : a.settlementId > b.settlementId ? 1 : 0).map(siege => siegeSchema.parse(siege)),
      pendingCapture: state.pendingCapture ? captureDecisionSchema.parse(state.pendingCapture) : null,
      ruins: Object.values(state.ruins).sort(compareId).map(ruin => ruinSchema.parse(ruin)), diplomacy: diplomacyStateSchema.parse(state.diplomacy),
      pace: state.pace,
      progression: Object.entries(state.progression).sort(([a], [b]) => a < b ? -1 : 1).map(([factionId, progress]) => ({ factionId, ...factionProgressionSchema.parse(progress) })),
      projects: state.projects.map(project => victoryProjectSchema.parse(project)), victory: state.victory ? victorySchema.parse(state.victory) : null,
      routes: Object.values(state.routes).sort((a, b) => a.armyId < b.armyId ? -1 : 1).map(route => movementRouteSchema.parse(route)),
      characters: Object.values(state.characters).sort(compareId).map(character => characterSchema.parse(character)),
      transports: Object.entries(state.transports).sort(([a], [b]) => a < b ? -1 : 1).map(([armyId, fleetId]) => ({ armyId, fleetId })),
      land: canonicalLand(state),
      rosterVersion: state.rosterVersion,
      roads: canonicalRoads(state),
      arcaneResearch: arcaneResearchSchema.parse(Object.entries(state.arcaneResearch).sort(([a], [b]) => a < b ? -1 : 1).map(([factionId, discoveries]) => ({ factionId, discoveries: [...discoveries] }))),
  };
  return payload;
}

/** Old reports retain their original battlefield IDs and factual logs. */
export function battleReportForVersion(battle: CampaignBattle, version: RulesVersion) {
  if (version >= 14) return campaignBattleSchema.parse(battle);
  if (battle.rulesVersion >= 9 || battle.abilityState || battle.characterSnapshots.some(item => item.aptitudes || item.spellIds)) throw new Error('This battle cannot be represented by pre-ability rules.');
  if (version >= 8) return schema13CampaignBattleSchema.parse(battle);
  if (battle.rulesVersion >= 8 || battle.domain !== 'land' || battle.transportAftermath.length || battle.transportSnapshots.length || battle.characterSnapshots.some(item => item.learnedSkillIds.length)) throw new Error('This battle cannot be represented by pre-naval rules.');
  const { domain: _domain, transportAftermath: _transport, transportSnapshots: _cargo, ...beforeNaval } = battle;
  const schema7 = { ...beforeNaval, characterSnapshots: beforeNaval.characterSnapshots.map(({ learnedSkillIds: _learned, ...snapshot }) => snapshot) };
  if (version === 7) return schema7CampaignBattleSchema.parse(schema7);
  if (battle.rulesVersion === 7 || battle.characterSnapshots.length || battle.characterAftermath.length || battle.usedAbilities.length) throw new Error('This battle cannot be represented by pre-character rules.');
  const { characterSnapshots: _characters, characterAftermath: _charactersAftermath, usedAbilities: _abilities, ...schema6 } = schema7;
  if (version === 6) return schema6CampaignBattleSchema.parse(schema6);
  if (battle.rulesVersion !== 5) throw new Error('This battle cannot be represented by legacy rules.');
  const { rulesVersion: _version, formationBindings: _bindings, formationStrengths: _strengths, formationAftermath: _aftermath, ...legacy } = schema6;
  return legacyCampaignBattleSchema.parse(legacy);
}

/** Only JSON.stringify-produced bytes enter the envelope; caller JSON is never accepted. */
function envelopeParts(version: RulesVersion, contentHash: string, payload: object): readonly [string, string, string] {
  const stateText = JSON.stringify(payload);
  // Preserve the historical header order and JSON escaping. Reusing these exact
  // bytes avoids a second traversal of the payload by an enclosing stringify.
  const header = JSON.stringify({ version, gameVersion: '0.1.0', contentHash, stateChecksum: checksum(stateText) });
  return [header.slice(0, -1) + ',"state":', stateText, '}'];
}

/** Serialize the validated projection once, preserving every historical byte. */
function serializeEnvelope(version: RulesVersion, contentHash: string, payload: object): string {
  const [header, stateText, end] = envelopeParts(version, contentHash, payload);
  return header + stateText + end;
}

/** Same FNV-1a UTF-16 fold as checksum(), without joining/flattening a full envelope.
 * The payload checksum is still computed first and included in the outer hash. */
function hashEnvelope(version: RulesVersion, contentHash: string, payload: object): string {
  let hash = 2166136261;
  for (const part of envelopeParts(version, contentHash, payload)) {
    for (let index = 0; index < part.length; index++) hash = Math.imul(hash ^ part.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Exact old envelope projection, never a silently rewritten archive seal. */
export function serializeGameForVersion(state: GameState, version: RulesVersion): string {
  const canonical = canonicalPayload(state);
  if (version === 14) return serializeEnvelope(SAVE_VERSION, CONTENT_HASH, canonical);
  if (canonical.arcaneResearch.some(item => item.discoveries.length) || canonical.characters.some(item => item.aptitudes || !v9Characters.has(item.definitionId))) throw new Error('This campaign has magic unavailable in the frozen pre-ability pack.');
  const { arcaneResearch: _arcane, ...beforeAbilities } = canonical;
  const modernPayload = { ...beforeAbilities, battle: beforeAbilities.battle ? schema13CampaignBattleSchema.parse(beforeAbilities.battle) : null, battleReports: beforeAbilities.battleReports.map(battle => schema13CampaignBattleSchema.parse(battle)) };
  if (version === 13) return serializeEnvelope(13, PRE_BATTLE_CONTENT_HASH, modernPayload);
  assertLegacyRoster(modernPayload);
  if (version === 12) return serializeEnvelope(12, PRE_EXPANDED_ROSTER_CONTENT_HASH, modernPayload);
  if (state.world.generatorVersion > 4 || state.world.layout !== 'legacy' || state.world.hydrology.some(value => value !== 0) || Object.keys(state.roads.edges).length || Object.keys(state.roads.projects).length || Object.values(state.roads.known).some(cells => Object.keys(cells).length)) throw new Error('This campaign has geography or roads unavailable in historical rules.');
  const { roads: _roads, ...priorPayload } = modernPayload;
  const { layout: _layout, hydrology: _hydrology, ...priorWorld } = priorPayload.world;
  const currentPayload = { ...priorPayload, world: worldSchema.parse(priorWorld) };
  if (version === 11) return serializeEnvelope(11, PRE_GEOGRAPHY_CONTENT_HASH, currentPayload);
  if (Object.values(currentPayload.land.settlements).some(land => land.borderGrowth !== 0)) throw new Error('This campaign has border progress unavailable in pre-city-growth rules.');
  const previousLand = { ...currentPayload.land, settlements: Object.fromEntries(Object.entries(currentPayload.land.settlements).map(([id, { borderGrowth: _growth, ...land }]) => [id, land])) };
  const beforeCityGrowth = { ...currentPayload, land: landStateV10Schema.parse(previousLand) };
  assertV9Content(beforeCityGrowth, 10);
  if (version === 10) return serializeEnvelope(10, PRE_CITY_RESEARCH_CONTENT_HASH, beforeCityGrowth);
  const { rosterVersion: _rosterVersion, ...beforeRoster } = beforeCityGrowth;
  assertV9Content(beforeRoster);
  if (version === 9) return serializeEnvelope(9, PRE_ROSTER_CONTENT_HASH, beforeRoster);
  if (state.world.generatorVersion > 3 || state.factions.some(faction => !FACTIONS.slice(0, 4).some(definition => definition.id === faction.definitionId)) || Object.keys(state.land.biomes).length || Object.values(state.land.settlements).some(land => land.work || Object.keys(land.improvements).length) || Object.values(state.land.cultivation).some(count => count > 0)) throw new Error('This campaign cannot be represented by pre-territory rules.');
  const { land: _land, ...modern } = beforeRoster;
  if (version === 8) return serializeEnvelope(8, PRE_TERRITORY_CONTENT_HASH, modern);
  if (modern.transports.length || modern.characters.some(character => character.learnedSkillIds.length) || modern.armies.some(army => army.formations.length > 12 || armyDomain(army) === 'naval') || modern.settlements.some(town => town.buildings.includes('building.harbor') || town.queue.some(item => item.itemId === 'building.harbor' || UNITS.find(unit => unit.id === item.itemId)?.movementDomain === 'naval')) || modern.progression.some(progress => progress.technologies.some(id => id === 'technology.coastal_navigation' || id === 'technology.ocean_navigation'))) throw new Error('This campaign cannot be represented by pre-naval rules.');
  if (modern.world.generatorVersion > 2) throw new Error('This world cannot be represented by pre-naval generator rules.');
  const { transports: _transports, ...withoutTransport } = modern;
  const { waterDepth: _depth, ...oldWorld } = modern.world;
  const schema7 = { ...withoutTransport, world: oldWorld, characters: modern.characters.map(({ learnedSkillIds: _learned, ...character }) => character), battle: state.battle ? battleReportForVersion(state.battle, version) : null, battleReports: state.battleReports.map(report => battleReportForVersion(report, version)) };
  if (version === 7) return serializeEnvelope(7, PRE_NAVAL_CONTENT_HASH, schema7);
  if (modern.characters.length) throw new Error('This campaign contains characters and cannot be represented by pre-character rules.');
  const { characters: _characters, ...beforeCharacters } = schema7;
  const current = { ...beforeCharacters, battle: state.battle ? battleReportForVersion(state.battle, version) : null, battleReports: state.battleReports.map(report => battleReportForVersion(report, version)) };
  if (version < 6) {
    const unavailable = Object.values(state.armies).some(army => army.formations.some(item => !LEGACY_UNIT_IDS.has(item.unitId)))
      || Object.values(state.settlements).some(town => town.queue.some(item => UNITS.some(unit => unit.id === item.itemId) && !LEGACY_UNIT_IDS.has(item.itemId)));
    if (unavailable) throw new Error('This content cannot be represented by the legacy content pack.');
    const armies = state.armies;
    const previous = {
      ...current,
      armies: current.armies.map(army => {
        const item = army.formations[0];
        if (army.formations.length !== 1 || !item || item.id !== `formation.${army.id.slice(5)}`) throw new Error('This army cannot be represented by legacy singleton rules.');
        return { id: army.id, factionId: army.factionId, name: army.name, unitId: item.unitId, cell: army.cell, movement: armies[army.id]!.movement, strength: item.strength, morale: item.morale, fatigue: item.fatigue };
      }),
      battle: state.battle ? battleReportForVersion(state.battle, version) : null,
      battleReports: state.battleReports.map(report => battleReportForVersion(report, version)),
    };
    if (version === 4) {
      if (state.world.generatorVersion !== 1 || Object.keys(state.routes).length) throw new Error('This campaign cannot be represented by the legacy schema-4 rules.');
      const { routes: _routes, ...rest } = previous;
      const { biome: _biome, generatorVersion: _generatorVersion, ...world } = previous.world;
      const payload = { ...rest, world };
      return serializeEnvelope(4, PRE_TRAVEL_CONTENT_HASH, payload);
    }
    return serializeEnvelope(5, PRE_ARMY_CONTENT_HASH, previous);
  }
  return serializeEnvelope(6, PRE_CHARACTER_CONTENT_HASH, current);
}

export function serializeGame(state: GameState): string {
  return serializeGameForVersion(state, SAVE_VERSION);
}
export function stateHashForVersion(state: GameState, version: RulesVersion): string {
  if (version === SAVE_VERSION) return hashEnvelope(SAVE_VERSION, CONTENT_HASH, canonicalPayload(state));
  return checksum(serializeGameForVersion(state, version));
}

export function stateHash(state: GameState): string {
  return stateHashForVersion(state, SAVE_VERSION);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('Invalid save: ' + message);
}

function assertLegacyRoster(state: { rosterVersion: number; factions: readonly { definitionId: string }[] }): void {
  assert(state.rosterVersion <= 3 && state.factions.every(faction => (FACTION_ROSTERS[3] as readonly string[]).includes(faction.definitionId)), 'culture or roster unavailable in the frozen pre-expansion pack');
}

/** IDs, not the current pack's length: later additions cannot masquerade as old content. */
const v9Units = new Set(['unit.colonist', 'unit.scout', 'unit.guard', 'unit.spearman', 'unit.heavy_infantry', 'unit.cavalry', 'unit.transport', 'unit.coastal_warship', 'unit.ocean_warship']);
const v9Buildings = new Set(['building.granary', 'building.workshop', 'building.market', 'building.archive', 'building.harbor']);
const v9Technologies = new Set(['technology.cinder_masonry', 'technology.civic_accounts', 'technology.coastal_navigation', 'technology.ocean_navigation']);
const v9Institutions = new Set(['institution.charter_compact', 'institution.common_stewardship']);
const v9Doctrines = new Set(['doctrine.shield_cohesion', 'doctrine.march_columns']);
const v9Characters = new Set(['character.marshal', 'character.surveyor', 'character.engineer']);
const v9Missions = new Set(['mission.survey', 'mission.refit', 'mission.sabotage']);
const v9Skills = new Set(['skill.steadfast', 'skill.decisive', 'skill.fieldcraft', 'skill.siegecraft', 'skill.muster_rolls', 'skill.field_orders', 'skill.measured_advance', 'skill.unbroken_line', 'skill.horizon_studies', 'skill.column_workshops', 'skill.sapper_watch']);
const v9Improvements = new Set(['improvement.terraced_fields', 'improvement.managed_woodlot', 'improvement.quarry', 'improvement.reedworks', 'improvement.shore_fishery']);
function assertV9Content(state: Pick<z.infer<typeof stateV9Schema>, 'world' | 'factions' | 'armies' | 'settlements' | 'progression' | 'characters' | 'battle' | 'battleReports' | 'land'>, version: 9 | 10 = 9): void {
  const roster: readonly string[] = FACTION_ROSTERS[version === 10 ? 3 : state.world.generatorVersion < 4 ? 1 : 2];
  const battles = [...(state.battle ? [state.battle] : []), ...state.battleReports];
  const oldCharacter = (character: { definitionId: string; skillId: string | null; learnedSkillIds: string[] }) => v9Characters.has(character.definitionId)
    && (character.skillId === null || v9Skills.has(character.skillId)) && character.learnedSkillIds.every(id => v9Skills.has(id));
  assert(state.factions.every(faction => roster.includes(faction.definitionId))
    && state.armies.every(army => army.formations.every(item => v9Units.has(item.unitId)))
    && state.settlements.every(town => town.buildings.every(id => v9Buildings.has(id)) && town.queue.every(item => v9Buildings.has(item.itemId) || v9Units.has(item.itemId)))
    && state.progression.every(progress => progress.technologies.every(id => v9Technologies.has(id)) && (progress.institutionId === null || v9Institutions.has(progress.institutionId)) && (progress.doctrineId === null || v9Doctrines.has(progress.doctrineId)))
    && state.characters.every(character => oldCharacter(character) && (!character.mission || v9Missions.has(character.mission.definitionId)))
    && battles.every(battle => [...battle.combat.attacker, ...battle.combat.defender].every(item => v9Units.has(item.unitId)) && battle.characterSnapshots.every(oldCharacter) && battle.usedAbilities.every(item => item.abilityId === 'ability.rally')
      && (battle.attackerDoctrineId === null || v9Doctrines.has(battle.attackerDoctrineId)) && (battle.defenderDoctrineId === null || v9Doctrines.has(battle.defenderDoctrineId)))
    && Object.values(state.land.settlements).every(land => Object.values(land.improvements).every(id => v9Improvements.has(id)) && (!land.work || land.work.kind === 'terraform' || v9Improvements.has(land.work.improvementId)))
    && Object.values(state.land.known).every(cells => Object.values(cells).every(cell => cell.improvementId === null || v9Improvements.has(cell.improvementId))), `v${version} references content absent from its frozen pack or roster`);
}

function parseSave(raw: unknown): z.infer<typeof saveSchema> {
  const version = z.object({ version: z.number().int() }).parse(raw).version;
  const migrateV13 = (prior: z.infer<typeof saveV13Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_BATTLE_CONTENT_HASH, 'v13 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v13 snapshot checksum does not match its contents');
    assert([...prior.state.characters, ...[...(prior.state.battle ? [prior.state.battle] : []), ...prior.state.battleReports].flatMap(battle => battle.characterSnapshots)].every(character => v9Characters.has(character.definitionId)), 'v13 references a character absent from its frozen pack');
    const state = stateSchema.parse({ ...prior.state, arcaneResearch: prior.state.factions.map(faction => ({ factionId: faction.id, discoveries: [] })).sort((a, b) => a.factionId < b.factionId ? -1 : 1) });
    return { ...prior, version: 14, contentHash: CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state };
  };
  const migrateV12 = (prior: z.infer<typeof saveV12Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_EXPANDED_ROSTER_CONTENT_HASH, 'v12 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v12 snapshot checksum does not match its contents');
    assertLegacyRoster(prior.state);
    return migrateV13({ ...prior, version: 13, contentHash: PRE_BATTLE_CONTENT_HASH });
  };
  const migrateV11 = (prior: z.infer<typeof saveV11Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_GEOGRAPHY_CONTENT_HASH, 'v11 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v11 snapshot checksum does not match its contents');
    assertLegacyRoster(prior.state);
    const state = stateV12Schema.parse({ ...prior.state, world: { ...prior.state.world, layout: 'legacy', hydrology: Array<number>(prior.state.world.terrain.length).fill(0) }, roads: emptyRoadState(prior.state.factions.map(faction => faction.id)) });
    return migrateV12({ version: 12, gameVersion: '0.1.0', contentHash: PRE_EXPANDED_ROSTER_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  };
  const migrateV10 = (prior: z.infer<typeof saveV10Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_CITY_RESEARCH_CONTENT_HASH, 'v10 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v10 snapshot checksum does not match its contents');
    assertV9Content(prior.state, 10);
    const state = stateV11Schema.parse({ ...prior.state, land: { ...prior.state.land, settlements: Object.fromEntries(Object.entries(prior.state.land.settlements).map(([id, land]) => [id, { ...land, borderGrowth: 0 }])) } });
    return migrateV11({ version: 11, gameVersion: '0.1.0', contentHash: PRE_GEOGRAPHY_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  };
  const migrateV9 = (prior: z.infer<typeof saveV9Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_ROSTER_CONTENT_HASH, 'v9 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v9 snapshot checksum does not match its contents');
    assertV9Content(prior.state);
    const historicalRoster: readonly string[] = FACTION_ROSTERS[prior.state.world.generatorVersion < 4 ? 1 : 2];
    assert(prior.state.factions.every(faction => historicalRoster.includes(faction.definitionId)), 'v9 references a faction absent from its frozen roster');
    const state = stateV10Schema.parse({ ...prior.state, rosterVersion: prior.state.world.generatorVersion < 4 ? 1 : 2 });
    return migrateV10({ version: 10, gameVersion: '0.1.0', contentHash: PRE_CITY_RESEARCH_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  };
  const migrateV8 = (prior: z.infer<typeof saveV8Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_TERRITORY_CONTENT_HASH, 'v8 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v8 snapshot checksum does not match its contents');
    assert(prior.state.factions.every(faction => FACTIONS.slice(0, 4).some(definition => definition.id === faction.definitionId)), 'v8 references a faction absent from its frozen pack');
    const state = stateV9Schema.parse({ ...prior.state, land: emptyLandState(prior.state.factions.map(faction => faction.id)) });
    return migrateV9({ version: 9, gameVersion: '0.1.0', contentHash: PRE_ROSTER_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  };
  const migrateV7 = (prior: z.infer<typeof saveV7Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_NAVAL_CONTENT_HASH, 'v7 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v7 snapshot checksum does not match its contents');
    const oldUnits = new Set(['unit.colonist', 'unit.scout', 'unit.guard', 'unit.spearman', 'unit.heavy_infantry', 'unit.cavalry']);
    const oldBuildings = new Set(['building.granary', 'building.workshop', 'building.market', 'building.archive']);
    const oldTechnologies = new Set(['technology.cinder_masonry', 'technology.civic_accounts']);
    const oldSkills = new Set(['skill.steadfast', 'skill.decisive', 'skill.fieldcraft', 'skill.siegecraft']);
    const battles = [...(prior.state.battle ? [prior.state.battle] : []), ...prior.state.battleReports];
    assert(prior.state.armies.every(army => army.formations.every(item => oldUnits.has(item.unitId)))
      && prior.state.settlements.every(town => town.buildings.every(id => oldBuildings.has(id)) && town.queue.every(item => oldBuildings.has(item.itemId) || oldUnits.has(item.itemId)))
      && prior.state.progression.every(progress => progress.technologies.every(id => oldTechnologies.has(id)))
      && prior.state.characters.every(character => character.skillId === null || oldSkills.has(character.skillId))
      && battles.every(battle => [...battle.combat.attacker, ...battle.combat.defender].every(item => oldUnits.has(item.unitId)) && battle.characterSnapshots.every(character => character.skillId === null || oldSkills.has(character.skillId))), 'v7 references content absent from its frozen pack');
    const world = prior.state.world;
    const migrateBattle = (battle: z.infer<typeof schema7CampaignBattleSchema>) => ({ ...battle, domain: 'land', transportAftermath: [], transportSnapshots: [], characterSnapshots: battle.characterSnapshots.map(snapshot => ({ ...snapshot, learnedSkillIds: [] })) });
    const state = stateV8Schema.parse({ ...prior.state, world: { ...world, waterDepth: [...deriveWaterDepth(world.width, world.height, Uint8Array.from(world.terrain))] }, transports: [], characters: prior.state.characters.map(character => ({ ...character, learnedSkillIds: [] })), battle: prior.state.battle ? migrateBattle(prior.state.battle) : null, battleReports: prior.state.battleReports.map(migrateBattle) });
    return migrateV8({ version: 8, gameVersion: '0.1.0', contentHash: PRE_TERRITORY_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  };
  const migrateV6 = (prior: z.infer<typeof saveV6Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_CHARACTER_CONTENT_HASH, 'v6 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v6 snapshot checksum does not match its contents');
    const migrateBattle = (battle: z.infer<typeof schema6CampaignBattleSchema>) => ({ ...battle, characterSnapshots: [], characterAftermath: [], usedAbilities: [] });
    const state = stateV7Schema.parse({ ...prior.state, characters: [], battle: prior.state.battle ? migrateBattle(prior.state.battle) : null, battleReports: prior.state.battleReports.map(migrateBattle) });
    return migrateV7({ version: 7, gameVersion: '0.1.0', contentHash: PRE_NAVAL_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  };
  const migrateV5 = (prior: z.infer<typeof saveV5Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_ARMY_CONTENT_HASH, 'v5 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v5 snapshot checksum does not match its contents');
    const migrateBattle = (battle: z.infer<typeof legacyCampaignBattleSchema>): z.infer<typeof schema6CampaignBattleSchema> => {
      const formationBindings = [...battle.combat.attacker, ...battle.combat.defender].sort(compareId).map(item => ({
        battleFormationId: item.id, formationId: item.id === battle.militiaId ? item.id : `formation.${item.id.slice(5)}`, armyId: item.id === battle.militiaId ? null : item.id,
      }));
      return { ...battle, rulesVersion: 5, formationBindings,
        formationStrengths: formationBindings.map(binding => ({ formationId: binding.formationId, strength: battle.initialStrengths.find(item => item.armyId === binding.battleFormationId)?.strength ?? 0 })),
        formationAftermath: battle.aftermath.length ? formationBindings.map(binding => ({ formationId: binding.formationId, strength: battle.aftermath.find(item => item.armyId === binding.battleFormationId)?.strength ?? 0 })) : [],
      };
    };
    const state = stateV6Schema.parse({ ...prior.state,
      armies: prior.state.armies.map(({ unitId, strength, morale, fatigue, ...army }) => ({ ...army, formations: [{ id: `formation.${army.id.slice(5)}`, unitId, strength, morale, fatigue }] })),
      battle: prior.state.battle ? migrateBattle(prior.state.battle) : null, battleReports: prior.state.battleReports.map(migrateBattle),
    });
    return migrateV6({ version: 6, gameVersion: '0.1.0', contentHash: PRE_CHARACTER_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  };
  const migrateV4 = (prior: z.infer<typeof saveV4Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_TRAVEL_CONTENT_HASH, 'v4 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v4 snapshot checksum does not match its contents');
    const world = prior.state.world;
    const state = stateV5Schema.parse({ ...prior.state, world: { ...world, biome: [...deriveBiomes(world.seed, world.width, world.height, Uint8Array.from(world.terrain), 1)], generatorVersion: 1 }, routes: [] });
    return migrateV5({ version: 5, gameVersion: '0.1.0', contentHash: PRE_ARMY_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  };
  const migrateV3 = (prior: z.infer<typeof saveV3Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_PROGRESSION_CONTENT_HASH, 'v3 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v3 snapshot checksum does not match its contents');
    const migrateBattle = (battle: z.infer<typeof campaignBattleV3Schema>) => ({ ...battle, attackerDoctrineId: null, defenderDoctrineId: null });
    const state = stateV4Schema.parse({ ...prior.state, pace: 'short',
      battle: prior.state.battle ? migrateBattle(prior.state.battle) : null, battleReports: prior.state.battleReports.map(migrateBattle),
      progression: prior.state.factions.map(faction => ({ factionId: faction.id, ...createFactionProgression() })).sort((a, b) => a.factionId < b.factionId ? -1 : 1), projects: [], victory: null,
    });
    return migrateV4({ version: 4, gameVersion: '0.1.0', contentHash: PRE_TRAVEL_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  };
  const migrateV2 = (prior: z.infer<typeof saveV2Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_PROGRESSION_CONTENT_HASH, 'v2 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v2 snapshot checksum does not match its contents');
    const diplomacy = createDiplomacy();
    diplomacy.relations = prior.state.wars.map(parties => ({ parties, trust: 0, respect: 0, grievances: 0, warStartedTurn: prior.state.turn, lastOfferTurn: 0 }));
    const migrateBattle = (battle: z.infer<typeof campaignBattleV2Schema>) => ({ ...battle, settlementId: null, militiaId: null, fortification: 0 });
    const state = stateV3Schema.parse({
      ...prior.state,
      settlements: prior.state.settlements.map(town => ({ ...town, founderFactionId: town.factionId, devastation: 0, occupationTurns: 0 })),
      battle: prior.state.battle ? migrateBattle(prior.state.battle) : null, battleReports: prior.state.battleReports.map(migrateBattle),
      sieges: [], pendingCapture: null, ruins: [], diplomacy,
    });
    return migrateV3({ version: 3, gameVersion: '0.1.0', contentHash: PRE_PROGRESSION_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  };
  const migrate = (prior: z.infer<typeof saveV1Schema>): z.infer<typeof saveSchema> => {
    assert(prior.contentHash === PRE_COMBAT_CONTENT_HASH, 'v1 content hash is not a recognized compatible pack');
    assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v1 snapshot checksum does not match its contents');
    const state = stateV2Schema.parse({
      ...prior.state,
      armies: prior.state.armies.map(army => {
        const unit = UNITS.find(item => item.id === army.unitId);
        assert(unit, 'unknown v1 army definition');
        return { ...army, morale: unit.morale, fatigue: 0 };
      }),
      wars: [], battle: null, battleReports: [],
    });
    return migrateV2({ version: 2, gameVersion: '0.1.0', contentHash: PRE_PROGRESSION_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  };
  if (version === 0) {
    const legacy = legacySchema.parse(raw);
    const { nextEntityId, ...rest } = legacy.state;
    const migrated = stateV1Schema.parse({ ...rest, nextId: nextEntityId });
    return migrate({ version: 1, gameVersion: '0.1.0', contentHash: legacy.contentHash, stateChecksum: checksum(JSON.stringify(migrated)), state: migrated });
  }
  if (version === 1) return migrate(saveV1Schema.parse(raw));
  if (version === 2) return migrateV2(saveV2Schema.parse(raw));
  if (version === 3) return migrateV3(saveV3Schema.parse(raw));
  if (version === 4) return migrateV4(saveV4Schema.parse(raw));
  if (version === 5) return migrateV5(saveV5Schema.parse(raw));
  if (version === 6) return migrateV6(saveV6Schema.parse(raw));
  if (version === 7) return migrateV7(saveV7Schema.parse(raw));
  if (version === 8) return migrateV8(saveV8Schema.parse(raw));
  if (version === 9) return migrateV9(saveV9Schema.parse(raw));
  if (version === 10) return migrateV10(saveV10Schema.parse(raw));
  if (version === 11) return migrateV11(saveV11Schema.parse(raw));
  if (version === 12) return migrateV12(saveV12Schema.parse(raw));
  if (version === 13) return migrateV13(saveV13Schema.parse(raw));
  if (version !== SAVE_VERSION) throw new Error(`Unsupported save version ${version}.`);
  return saveSchema.parse(raw);
}

export function deserializeGame(text: string): GameState {
  if (text.length > 128 * 1024 * 1024) throw new Error('Save exceeds the supported 128 MiB import size.');
  let envelope: z.infer<typeof saveSchema>;
  let originalVersion: number;
  try { const raw: unknown = JSON.parse(text); originalVersion = z.object({ version: z.number() }).parse(raw).version; envelope = parseSave(raw); }
  catch (error) { throw new Error('Cannot read save: ' + (error instanceof Error ? error.message : 'invalid JSON')); }
  assert(envelope.contentHash === CONTENT_HASH, 'content hash does not match this game build');
  const data = envelope.state;
  assert(envelope.stateChecksum === checksum(JSON.stringify(data)), 'snapshot checksum does not match its contents');
  const totalCells = data.world.width * data.world.height;
  assert(totalCells <= 350_000, 'world exceeds the supported cell limit');
  assert(data.world.terrain.length === totalCells && data.world.fertility.length === totalCells && data.world.biome.length === totalCells && data.world.waterDepth.length === totalCells, 'world array dimensions disagree');
  assert(data.world.waterDepth.every((depth, cell) => data.world.terrain[cell] === 0 ? depth === 1 || depth === 2 : depth === 0), 'water depth disagrees with physical terrain');
  assert(data.world.hydrology.length === totalCells, 'hydrology dimensions disagree');
  assert(data.world.hydrology.every((value, cell) => !isLake(value) || data.world.waterDepth[cell] === 1), 'freshwater lakes must use shallow water depth');
  assert(data.world.generatorVersion < 5 ? data.world.layout === 'legacy' && data.world.hydrology.every(value => value === 0) : data.world.layout !== 'legacy', 'geography does not match generator version');
  validateHydrology({ width: data.world.width, height: data.world.height, terrain: Uint8Array.from(data.world.terrain), hydrology: Uint8Array.from(data.world.hydrology) });
  assert(data.world.biome.every((biome, cell) => {
    const terrain = data.world.terrain[cell];
    if (data.world.generatorVersion < 4 && biome > 9) return false;
    if (terrain === 0) return biome === BIOME.ocean;
    if (terrain === 4) return biome === BIOME.alpine;
    if (biome === BIOME.ocean || biome === BIOME.alpine) return false;
    return data.world.generatorVersion !== 1 || biome === (terrain === 2 ? BIOME.temperateForest : BIOME.grassland);
  }), 'biomes disagree with physical terrain or legacy generator semantics');
  const validCell = (value: number): boolean => value < totalCells;
  const landCell = (value: number): boolean => validCell(value) && isPassable(data.world.terrain[value] ?? 0);
  const waterCell = (value: number): boolean => validCell(value) && data.world.terrain[value] === 0;
  assert(data.world.starts.length === data.factions.length, 'starting positions do not match factions');
  assert(new Set(data.world.starts).size === data.world.starts.length && data.world.starts.every(landCell), 'starting positions must be distinct, passable cells');
  const factionIds = new Set(data.factions.map(faction => faction.id));
  assert(factionIds.size === data.factions.length, 'duplicate faction IDs');
  assert(factionIds.has(data.turnOwnerId), 'unknown turn owner');
  const definitions = new Map<string, (typeof FACTIONS)[number]>(FACTIONS.map(faction => [faction.id, faction]));
  const rosterIds: readonly string[] = FACTION_ROSTERS[data.rosterVersion];
  for (const faction of data.factions) {
    const definition = definitions.get(faction.definitionId);
    assert(definition, 'unknown faction definition');
    assert(rosterIds.includes(faction.definitionId), 'faction definition is absent from the saved roster');
    assert(faction.color === definition.color, 'faction color differs from content');
  }
  const unitById = new Map(UNITS.map(unit => [unit.id, unit]));
  const progression = Object.fromEntries(data.progression.map(({ factionId, ...progress }) => [factionId, progress]));
  assert(Object.keys(progression).length === data.progression.length && data.progression.every((entry, i) => factionIds.has(entry.factionId) && (i === 0 || entry.factionId > (data.progression[i - 1]?.factionId ?? ''))), 'duplicate, unknown or unordered progression faction');
  const buildingById = new Map(BUILDINGS.map(building => [building.id, building]));
  const entityIds = new Set<string>();
  const checkEntity = (entityId: string, kind: 'army' | 'formation' | 'settlement' | 'battle'): void => {
    assert(new RegExp(`^${kind}\\.[1-9][0-9]*$`).test(entityId), 'invalid runtime entity ID');
    const serial = Number(entityId.slice(kind.length + 1));
    assert(Number.isSafeInteger(serial) && serial < data.nextId, 'next entity ID would collide');
    assert(!entityIds.has(entityId), 'duplicate entity ID'); entityIds.add(entityId);
  };
  const occupied = new Map<number, string>();
  const transported = new Set(data.transports.map(item => item.armyId));
  for (const army of data.armies) {
    checkEntity(army.id, 'army');
    assert(factionIds.has(army.factionId), 'unknown army owner');
    const domain = armyDomain(army);
    assert(domain === 'naval' || transported.has(army.id) ? waterCell(army.cell) : landCell(army.cell), 'army must occupy a cell permitted by its movement domain or carrier');
    for (const [i, item] of army.formations.entries()) {
      checkEntity(item.id, 'formation');
      const unit = unitById.get(item.unitId);
      assert(unit && item.strength <= unit.strength && item.morale <= unit.morale, 'invalid formation definition, morale or strength');
      assert((unit.movementDomain === 'naval' ? 'naval' : 'land') === domain, 'land and naval formations cannot share an army');
      assert(i === 0 || item.id > (army.formations[i - 1]?.id ?? ''), 'army formations must be canonically ordered');
    }
    assert(army.movement <= armyMovement(army, progression[army.factionId]?.doctrineId ?? null), 'invalid army movement');
    assert(!occupied.has(army.cell) || occupied.get(army.cell) === army.factionId, 'hostile armies cannot share a cell');
    occupied.set(army.cell, army.factionId);
  }
  const settled = new Set<number>();
  const names = new Set<string>();
  for (const settlement of data.settlements) {
    checkEntity(settlement.id, 'settlement');
    assert(factionIds.has(settlement.factionId), 'unknown settlement owner');
    assert(factionIds.has(settlement.founderFactionId), 'unknown settlement founder');
    assert(landCell(settlement.cell) && !settled.has(settlement.cell), 'invalid or duplicated settlement position');
    assert(!occupied.has(settlement.cell) || occupied.get(settlement.cell) === settlement.factionId, 'hostile army occupies settlement');
    settled.add(settlement.cell);
    const nameKey = `${settlement.factionId}:${settlement.name}`;
    assert(!names.has(nameKey), 'duplicate settlement name'); names.add(nameKey);
    assert(settlement.name.length <= 40, 'settlement name exceeds command limit');
    const built = new Set(settlement.buildings);
    assert(built.size === settlement.buildings.length, 'duplicate building');
    assert(settlement.buildings.every(building => buildingById.has(building)), 'unknown building');
    assert(settlement.buildings.every(building => !buildingById.get(building)?.coastalOnly || neighbors(settlement.cell, data.world.width, data.world.height).some(waterCell)), 'a coastal building requires an adjacent water hex');
    for (const queued of settlement.queue) {
      const definition = buildingById.get(queued.itemId) ?? unitById.get(queued.itemId);
      assert(definition && queued.progress < definition.cost, 'invalid production item or progress');
      if (buildingById.has(queued.itemId)) {
        assert(!built.has(queued.itemId), 'duplicate queued or built building'); built.add(queued.itemId);
      }
    }
    assert(settlement.queue.slice(1).every(queued => queued.progress === 0), 'only the first production item may have progress');
  }
  assert(data.explored.length === data.factions.length, 'visibility must cover each faction');
  const explored: Record<string, Set<number>> = {};
  for (const knowledge of data.explored) {
    assert(factionIds.has(knowledge.factionId) && !Object.hasOwn(explored, knowledge.factionId), 'invalid visibility owner');
    assert(knowledge.cells.every(validCell), 'explored cell outside the world');
    assert(new Set(knowledge.cells).size === knowledge.cells.length, 'duplicated explored cells');
    explored[knowledge.factionId] = new Set(knowledge.cells);
  }
  for (const event of data.events) assert(event.turn <= data.turn && factionIds.has(event.factionId) && (event.cell === undefined || validCell(event.cell)), 'invalid event references');
  const warKeys = new Set<string>();
  let lastWar: [string, string] | undefined;
  for (const pair of data.wars) {
    assert(factionIds.has(pair[0]) && factionIds.has(pair[1]) && pair[0] < pair[1], 'war pairs require two distinct canonical faction IDs');
    const key = pair.join(':');
    assert(!warKeys.has(key) && (!lastWar || pair[0] > lastWar[0] || (pair[0] === lastWar[0] && pair[1] > lastWar[1])), 'wars must be unique and canonically ordered');
    warKeys.add(key); lastWar = pair;
  }
  const armyById = new Map(data.armies.map(army => [army.id, army]));
  const validateBattle = (battle: z.infer<typeof campaignBattleSchema>, pending: boolean): void => {
    checkEntity(battle.id, 'battle');
    assert(battle.turn <= data.turn && (!pending || battle.turn === data.turn), 'invalid battle turn');
    assert(factionIds.has(battle.attackerFactionId) && factionIds.has(battle.defenderFactionId) && battle.attackerFactionId !== battle.defenderFactionId, 'invalid battle faction references');
    for (const [factionId, doctrineId] of [[battle.attackerFactionId, battle.attackerDoctrineId], [battle.defenderFactionId, battle.defenderDoctrineId]] as const) {
      assert(doctrineId === null || DOCTRINES.some(item => item.id === doctrineId) && doctrineId === progression[factionId]?.doctrineId, 'battle doctrine differs from faction doctrine');
      if (pending) assert(doctrineId === progression[factionId]?.doctrineId, 'pending battle doctrine snapshot disagrees');
    }
    const battleCell = battle.domain === 'naval' ? waterCell : landCell;
    assert(battleCell(battle.attackerCell) && battleCell(battle.defenderCell) && neighbors(battle.attackerCell, data.world.width, data.world.height).includes(battle.defenderCell), 'battle positions must be adjacent cells permitted by the battle domain');
    if (battle.rulesVersion < 8) { legacyBattleStateSchema.parse(battle.combat); assert(battle.domain === 'land' && !battle.transportAftermath.length && !battle.transportSnapshots.length && battle.characterSnapshots.every(item => !item.learnedSkillIds.length), 'historical battle cannot include modern naval or skill-tree metadata'); }
    assert(battle.domain !== 'naval' || !battle.settlementId && !battle.militiaId && !battle.fortification, 'naval combat cannot bypass a settlement assault');
    assert(battle.combat.terrain === data.world.terrain[battle.defenderCell], 'battle terrain differs from its strategic cell');
    const besieged = battle.settlementId ? data.settlements.find(town => town.id === battle.settlementId) : undefined;
    const siege = battle.settlementId ? data.sieges.find(siege => siege.settlementId === battle.settlementId) : undefined;
    if (battle.settlementId) {
      assert(/^settlement\.[1-9][0-9]*$/.test(battle.settlementId) && Number(battle.settlementId.slice(11)) < data.nextId, 'invalid assault settlement reference');
      if (pending) assert(besieged && siege && siege.armyId === battle.attackerId && besieged.cell === battle.defenderCell && besieged.factionId === battle.defenderFactionId && Math.floor(siege.defenses / 10) === battle.fortification, 'pending assault differs from its siege');
      if (battle.militiaId) assert(battle.militiaId === `militia.${battle.settlementId}` && battle.defenderIds.length === 1 && battle.defenderId === battle.militiaId, 'invalid settlement militia identity');
    } else assert(battle.militiaId === null && battle.fortification === 0, 'field battle cannot include settlement defenses');
    const serial = Number(battle.id.slice('battle.'.length));
    const expectedSeed = new SeededRandom((data.world.seed ^ serial) >>> 0).nextUint32();
    assert(battle.combat.seed === expectedSeed, 'battle random stream has the wrong seed');
    const terminalCast = battle.rulesVersion === 9 && battle.abilityState?.sources.some(source => source.abilityId === 'spell.cinder_thread' && source.usesRemaining < 2)
      && (battle.combat.result?.reason === 'formations destroyed' || battle.combat.result?.reason === 'morale rout');
    assert(pending ? !battle.combat.result : battle.combat.result && (battle.combat.round > 0 || terminalCast), 'pending battle/report completion state disagrees');
    const formations = [...battle.combat.attacker, ...battle.combat.defender];
    const bindings = new Map(battle.formationBindings.map(binding => [binding.battleFormationId, binding]));
    const formationIds = new Set(battle.formationBindings.map(binding => binding.formationId));
    assert(bindings.size === formations.length && battle.formationBindings.length === formations.length && formationIds.size === formations.length && formations.every(item => bindings.has(item.id)), 'battle bindings must cover every distinct formation');
    const defenderIds = battle.defenderIds;
    assert(new Set(defenderIds).size === defenderIds.length && defenderIds.includes(battle.defenderId) && defenderIds.every((id, i) => i === 0 || id > (defenderIds[i - 1] ?? '')), 'defending army references disagree');
    const participantIds = new Set([battle.attackerId, ...defenderIds]);
    assert(participantIds.size === 1 + defenderIds.length, 'battle sides cannot share an army');
    const snapshots = new Map(battle.characterSnapshots.map(item => [item.characterId, item]));
    assert(snapshots.size === battle.characterSnapshots.length, 'duplicate battle character snapshots');
    if (battle.rulesVersion < 7) assert(!snapshots.size && !battle.characterAftermath.length && !battle.usedAbilities.length && (!pending || !data.characters.length), 'historical battle cannot include character rules');
    const leaders = new Map<string, { attack: number; armor: number; marshals: number; companions: number }>();
    for (const [i, snapshot] of battle.characterSnapshots.entries()) {
      assert(/^character\.[1-9][0-9]*$/.test(snapshot.characterId) && Number(snapshot.characterId.slice(10)) < data.nextId && (i === 0 || snapshot.characterId > (battle.characterSnapshots[i - 1]?.characterId ?? '')), 'invalid or unordered battle character identity');
      assert(participantIds.has(snapshot.armyId) && snapshot.armyId !== battle.militiaId && snapshot.factionId === (snapshot.armyId === battle.attackerId ? battle.attackerFactionId : battle.defenderFactionId), 'battle character belongs to the wrong army or side');
      const definition = CHARACTER_DEFINITIONS.find(item => item.id === snapshot.definitionId);
      const skill = CHARACTER_SKILLS.find(item => item.id === snapshot.skillId);
      assert(definition && (snapshot.skillId === null || skill && definition.skillIds.includes(skill.id) && skill.roles.includes(definition.role)) && name.safeParse(snapshot.name).success, 'invalid battle character definition, skill or name');
      validateCharacterTraining(snapshot);
      const leadership = characterLeadership({ ...snapshot, dead: false }, battle.rulesVersion);
      const rallyRestore = definition.role === 'marshal' && !snapshot.woundedTurns ? (COMMANDER_ABILITIES.find(item => item.id === 'ability.rally')?.moraleRestore ?? 0) + characterSkillEffects(snapshot, battle.rulesVersion).rallyBonus : 0;
      assert(leadership.attack === snapshot.leadership.attack && leadership.armor === snapshot.leadership.armor && snapshot.rallyRestore === rallyRestore, 'battle character effects differ from frozen content');
      const leader = leaders.get(snapshot.armyId) ?? { attack: 0, armor: 0, marshals: 0, companions: 0 };
      leader.attack += leadership.attack; leader.armor += leadership.armor; leader.marshals += Number(definition.role === 'marshal'); leader.companions += Number(definition.role !== 'marshal'); leaders.set(snapshot.armyId, leader);
      assert(leader.marshals <= 1 && leader.companions <= 2, 'battle character capacity exceeded');
      if (pending) {
        const character = data.characters.find(item => item.id === snapshot.characterId);
        assert(character && !character.dead && !character.mission && character.location?.kind === 'army' && character.location.armyId === snapshot.armyId && character.factionId === snapshot.factionId && character.name === snapshot.name && character.definitionId === snapshot.definitionId && character.skillId === snapshot.skillId && character.experience === snapshot.experience && character.woundedTurns === snapshot.woundedTurns, 'pending character snapshot disagrees with its strategic participant');
        assert(character.learnedSkillIds.join('|') === snapshot.learnedSkillIds.join('|'), 'pending character tree differs from its battle snapshot');
      }
    }
    const abilityCharacters = new Set<string>();
    for (const used of battle.usedAbilities) {
      assert(used.abilityId === 'ability.rally' && (snapshots.get(used.characterId)?.rallyRestore ?? 0) > 0 && !abilityCharacters.has(used.characterId), 'invalid or duplicated battle ability use');
      abilityCharacters.add(used.characterId);
    }
    if (pending && battle.rulesVersion >= 7) assert(data.characters.filter(character => !character.dead && character.location?.kind === 'army' && participantIds.has(character.location.armyId)).every(character => snapshots.has(character.id)), 'pending battle omitted an attached character');
    const initial = new Map(battle.initialStrengths.map(item => [item.armyId, item.strength]));
    const entering = new Map(battle.formationStrengths.map(item => [item.formationId, item.strength]));
    assert(initial.size === participantIds.size && battle.initialStrengths.length === participantIds.size && [...initial.keys()].every(id => participantIds.has(id)), 'invalid initial battle strengths');
    assert(entering.size === formations.length && battle.formationStrengths.length === formations.length && [...entering.keys()].every(id => formationIds.has(id)), 'invalid entering formation strengths');
    const aggregate = new Map<string, number>();
    const liveFormations = new Map<string, { army: Army; item: Army['formations'][number] }>();
    for (const armyId of participantIds) {
      const army = armyById.get(armyId);
      if (army) for (const item of army.formations) liveFormations.set(item.id, { army, item });
    }
    for (const formation of formations) {
      const binding = bindings.get(formation.id);
      assert(binding, 'missing formation binding');
      const militia = formation.id === battle.militiaId;
      const defending = battle.combat.defender.some(item => item.id === formation.id);
      const strategicId = binding.armyId ?? binding.battleFormationId;
      assert(defending ? defenderIds.includes(strategicId) : binding.armyId === battle.attackerId, 'formation assigned to the wrong strategic side');
      if (militia) assert(binding.armyId === null && binding.formationId === battle.militiaId, 'invalid militia binding');
      else {
        assert(binding.armyId && /^army\.[1-9][0-9]*$/.test(binding.armyId) && Number(binding.armyId.slice(5)) < data.nextId, 'invalid historical army ID');
        assert(/^formation\.[1-9][0-9]*$/.test(binding.formationId) && Number(binding.formationId.slice(10)) < data.nextId, 'invalid historical formation ID');
        assert(battle.rulesVersion === 5 ? binding.battleFormationId === binding.armyId && binding.formationId === `formation.${binding.armyId.slice(5)}` : binding.battleFormationId === binding.formationId, 'battle identity disagrees with its rules version');
      }
      const unit = unitById.get(formation.unitId);
      assert(unit && (unit.movementDomain === 'naval' ? 'naval' : 'land') === battle.domain, 'battle formation differs from its combat domain');
      const effects = doctrineEffects(defending ? battle.defenderDoctrineId : battle.attackerDoctrineId);
      const leadership = leaders.get(binding.armyId ?? '') ?? { attack: 0, armor: 0 };
      assert(unit && (militia ? formation.unitId === 'unit.guard' && formation.maxStrength >= 20 && formation.maxStrength <= 60 && formation.maxStrength % 10 === 0 : formation.maxStrength === unit.strength)
        && formation.attack === unit.attack + effects.attack + leadership.attack && formation.armor === unit.armor + effects.armor + leadership.armor + (defending ? battle.fortification : 0) && formation.initiative === unit.initiative && formation.range === unit.range && formation.morale <= unit.morale, 'battle formation differs from unit content');
      const enteringStrength = entering.get(binding.formationId);
      assert(enteringStrength !== undefined && enteringStrength <= unit.strength && enteringStrength >= formation.strength, 'invalid entering battle strength');
      aggregate.set(strategicId, (aggregate.get(strategicId) ?? 0) + enteringStrength);
      if (pending) {
        if (militia) {
          assert(siege && besieged && formation.maxStrength === Math.min(60, 10 + besieged.population * 10) && enteringStrength === siege.militiaStrength, 'pending militia differs from the besieged settlement');
        } else {
          const live = liveFormations.get(binding.formationId);
          assert(live && live.army.id === binding.armyId && live.item.unitId === formation.unitId && live.item.strength === enteringStrength && live.army.cell === (defending ? battle.defenderCell : battle.attackerCell) && live.army.factionId === (defending ? battle.defenderFactionId : battle.attackerFactionId) && live.army.movement === 0, 'pending battle disagrees with its strategic participants');
        }
      }
    }
    assert([...initial].every(([id, strength]) => aggregate.get(id) === strength), 'army and formation entering strengths disagree');
    if (battle.rulesVersion === 5) assert(formations.length === participantIds.size && battle.combat.attacker.length === 1, 'legacy battle must contain singleton armies');
    if (pending) {
      assert(battle.aftermath.length === 0 && battle.formationAftermath.length === 0 && battle.characterAftermath.length === 0 && battle.transportAftermath.length === 0, 'pending battle cannot have strategic aftermath');
      const pair = [battle.attackerFactionId, battle.defenderFactionId].sort().join(':');
      assert(warKeys.has(pair), 'pending battle requires a declared war');
      const stack = data.armies.filter(army => !transported.has(army.id) && army.cell === battle.defenderCell).map(army => army.id).sort();
      assert(battle.militiaId ? stack.length === 0 : stack.length === defenderIds.length && stack.every((id, i) => id === defenderIds[i]), 'battle omitted a defending army');
      assert([...liveFormations.keys()].every(id => formationIds.has(id)), 'battle omitted a participant formation');
    } else {
      const aftermath = new Map(battle.aftermath.map(item => [item.armyId, item]));
      const endings = new Map(battle.formationAftermath.map(item => [item.formationId, item.strength]));
      assert(aftermath.size === participantIds.size && battle.aftermath.length === participantIds.size && [...aftermath.keys()].every(id => participantIds.has(id)), 'report aftermath must cover every army');
      assert(endings.size === formations.length && battle.formationAftermath.length === formations.length && [...endings.keys()].every(id => formationIds.has(id)), 'report aftermath must cover every formation');
      const surviving = new Map<string, number>();
      for (const formation of formations) {
        const binding = bindings.get(formation.id)!;
        const id = binding.armyId ?? binding.battleFormationId;
        const strength = endings.get(binding.formationId);
        const ending = aftermath.get(id);
        assert(strength !== undefined && strength <= formation.strength && ending, 'aftermath creates combat strength');
        assert(ending.outcome === 'destroyed' ? strength === 0 : strength === formation.strength, 'formation outcome differs from its army');
        surviving.set(id, (surviving.get(id) ?? 0) + strength);
      }
      for (const ending of battle.aftermath) {
        assert(ending.strength === surviving.get(ending.armyId), 'army aftermath differs from its surviving formations');
        if (ending.outcome === 'destroyed') assert(ending.strength === 0 && ending.cell === null, 'destroyed army cannot have survivors or a position');
        else {
          assert(ending.strength > 0 && ending.cell !== null && battleCell(ending.cell), 'invalid surviving army aftermath');
          const attacking = ending.armyId === battle.attackerId;
          const origin = attacking ? battle.attackerCell : battle.defenderCell;
          if (ending.outcome === 'held') assert(ending.cell === origin, 'holding army changed its position');
          if (ending.outcome === 'advanced') assert(attacking && battle.combat.result?.winner === 'attacker' && ending.cell === battle.defenderCell, 'invalid advance after battle');
          if (ending.outcome === 'retreated') assert(neighbors(origin, data.world.width, data.world.height).includes(ending.cell), 'retreat must reach an adjacent cell');
        }
      }
      const characterEndings = new Map(battle.characterAftermath.map(item => [item.characterId, item]));
      assert(characterEndings.size === snapshots.size && battle.characterAftermath.length === snapshots.size && [...characterEndings.keys()].every(id => snapshots.has(id)), 'character aftermath must cover every snapshot');
      for (const snapshot of battle.characterSnapshots) {
        const ending = characterEndings.get(snapshot.characterId)!;
        const armyEnding = aftermath.get(snapshot.armyId)!;
        const dead = armyEnding.outcome === 'destroyed';
        const wounds = dead ? 0 : armyEnding.outcome === 'retreated' ? Math.max(2, snapshot.woundedTurns) : snapshot.woundedTurns;
        const won = battle.combat.result?.winner === (snapshot.factionId === battle.attackerFactionId ? 'attacker' : 'defender');
        const experience = dead ? snapshot.experience : Math.min(1_000_000, snapshot.experience + (won ? 3 : 1));
        assert(ending.name === snapshot.name && ending.experience === experience && ending.woundedTurns === wounds && ending.outcome === (dead ? 'dead' : wounds ? 'wounded' : 'survived'), 'character aftermath differs from its army outcome');
      }
    }
    const cargoIds = new Set<string>(), cargoFormations = new Set<string>();
    for (const [i, snapshot] of battle.transportSnapshots.entries()) {
      assert(battle.domain === 'naval' && !cargoIds.has(snapshot.armyId) && !participantIds.has(snapshot.armyId) && /^army\.[1-9][0-9]*$/.test(snapshot.armyId) && Number(snapshot.armyId.slice(5)) < data.nextId
        && (i === 0 || snapshot.armyId > battle.transportSnapshots[i - 1]!.armyId), 'invalid or unordered cargo snapshot identity');
      assert(participantIds.has(snapshot.fleetId) && snapshot.factionId === (snapshot.fleetId === battle.attackerId ? battle.attackerFactionId : battle.defenderFactionId), 'invalid cargo snapshot carrier or owner');
      cargoIds.add(snapshot.armyId);
      for (const [j, formationId] of snapshot.formationIds.entries()) {
        assert(/^formation\.[1-9][0-9]*$/.test(formationId) && Number(formationId.slice(10)) < data.nextId && !cargoFormations.has(formationId) && !formationIds.has(formationId)
          && (j === 0 || formationId > snapshot.formationIds[j - 1]!), 'invalid or unordered cargo snapshot formation');
        cargoFormations.add(formationId);
      }
      if (pending) {
        const army = armyById.get(snapshot.armyId);
        assert(army && data.transports.some(binding => binding.armyId === army.id && binding.fleetId === snapshot.fleetId) && army.name === snapshot.name
          && army.formations.map(item => item.id).join('|') === snapshot.formationIds.join('|'), 'pending cargo snapshot disagrees with its carried army');
      }
    }
    if (pending) assert(data.transports.filter(binding => participantIds.has(binding.fleetId)).every(binding => cargoIds.has(binding.armyId)), 'battle omitted carried army evidence');
    const expectedCargoAftermath: CampaignBattle['transportAftermath'] = [];
    for (const fleetId of [...participantIds].sort()) {
      const passengers = battle.transportSnapshots.filter(item => item.fleetId === fleetId);
      const hulls = formations.filter(item => bindings.get(item.id)?.armyId === fleetId);
      const capacity = (surviving: boolean) => hulls.reduce((sum, hull) => sum + ((!surviving || battle.formationAftermath.some(ending => ending.formationId === bindings.get(hull.id)!.formationId && ending.strength > 0)) ? unitById.get(hull.unitId)?.naval?.transportCapacity ?? 0 : 0), 0);
      const carried = passengers.reduce((sum, item) => sum + item.formationIds.length, 0);
      assert(carried <= capacity(false), 'battle cargo exceeds entering hull capacity');
      let excess = Math.max(0, carried - capacity(true));
      if (!pending) for (const snapshot of [...passengers].reverse()) {
        const lostFormationIds = [...snapshot.formationIds].reverse().slice(0, excess); excess -= lostFormationIds.length;
        if (lostFormationIds.length) expectedCargoAftermath.push({ armyId: snapshot.armyId, name: snapshot.name, lostFormationIds, outcome: lostFormationIds.length === snapshot.formationIds.length ? 'lost' : 'damaged' });
      }
    }
    assert(JSON.stringify(battle.transportAftermath) === JSON.stringify(expectedCargoAftermath), 'cargo aftermath differs from actual surviving transport capacity');
  };
  if (data.battle) validateBattle(data.battle, true);
  for (const report of data.battleReports) validateBattle(report, false);
  const state: GameState = {
    arcaneResearch: Object.fromEntries(data.arcaneResearch.map(item => [item.factionId, item.discoveries])),
    roads: data.roads,
    rosterVersion: data.rosterVersion,
    land: data.land,
    turn: data.turn, nextId: data.nextId, turnOwnerId: data.turnOwnerId, pace: data.pace,
    world: { ...data.world, terrain: Uint8Array.from(data.world.terrain), fertility: Uint8Array.from(data.world.fertility), biome: Uint8Array.from(data.world.biome), waterDepth: Uint8Array.from(data.world.waterDepth), hydrology: Uint8Array.from(data.world.hydrology) },
    factions: data.factions, armies: Object.fromEntries(data.armies.map(army => [army.id, army])),
    settlements: Object.fromEntries(data.settlements.map(settlement => [settlement.id, settlement])),
    explored, events: data.events, wars: data.wars, battle: data.battle, battleReports: data.battleReports,
    sieges: Object.fromEntries(data.sieges.map(siege => [siege.settlementId, siege])), pendingCapture: data.pendingCapture,
    ruins: Object.fromEntries(data.ruins.map(ruin => [ruin.id, ruin])), diplomacy: data.diplomacy,
    progression, projects: data.projects, victory: data.victory,
    routes: Object.fromEntries(data.routes.map(route => [route.armyId, route])),
    characters: Object.fromEntries(data.characters.map(character => [character.id, character])),
    transports: Object.fromEntries(data.transports.map(item => [item.armyId, item.fleetId])),
  };
  assert(Object.keys(state.sieges).length === data.sieges.length && Object.keys(state.ruins).length === data.ruins.length, 'duplicate siege or ruin records');
  validateSieges(state);
  validateDiplomacy(state);
  validateProgression(state);
  assert(Object.keys(state.characters).length === data.characters.length && data.characters.every((character, i) => i === 0 || character.id > (data.characters[i - 1]?.id ?? '')), 'duplicate or unordered character records');
  validateCharacters(state);
  assert(data.arcaneResearch.length === state.factions.length && data.arcaneResearch.every((item, i) => i === 0 || item.factionId > data.arcaneResearch[i - 1]!.factionId), 'duplicate or unordered arcane research');
  validateArcaneResearch(state);
  if (state.battle) validateBattleAbilities(state, state.battle, true);
  for (const report of state.battleReports) validateBattleAbilities(state, report, false);
  rebuildCharacterIndexes(state);
  assert(Object.keys(state.transports).length === data.transports.length && data.transports.every((item, index) => index === 0 || item.armyId > (data.transports[index - 1]?.armyId ?? '')), 'duplicate or unordered transport bindings');
  validateTransports(state);
  for (const army of Object.values(state.armies)) {
    assert(army.movement <= effectiveArmyMovement(state, army), 'army movement exceeds effective command capacity');
    if (!state.transports[army.id]) assert(!armyTerrainBlocker(state, army, army.cell), 'army cannot occupy this movement domain or ocean depth');
  }
  assert(Object.keys(state.routes).length === data.routes.length && data.routes.every((route, i) => i === 0 || route.armyId > (data.routes[i - 1]?.armyId ?? '')), 'duplicate or unordered travel records');
  validateMovement(state);
  // Validate local visibility and settlement spacing before rebuilding caches.
  // Loading must never "repair" fog data and silently change its canonical hash.
  const requiredSight = new Map(state.factions.map(faction => [faction.id, new Set<number>()]));
  for (const army of data.armies) {
    if (transported.has(army.id)) continue;
    const sight = armySight(army);
    const seen = cellsWithin(state, army.cell, sight);
    assert(seen.every(value => explored[army.factionId]?.has(value)), 'army vision missing from exploration');
    for (const cell of seen) requiredSight.get(army.factionId)!.add(cell);
  }
  const checkedSettlements = new Set<number>();
  for (const settlement of data.settlements) {
    const seen = cellsWithin(state, settlement.cell, 3);
    assert(seen.every(value => explored[settlement.factionId]?.has(value)), 'settlement vision missing from exploration');
    for (const cell of seen) requiredSight.get(settlement.factionId)!.add(cell);
    assert(!cellsWithin(state, settlement.cell, 2).some(value => checkedSettlements.has(value)), 'settlements are too close together');
    checkedSettlements.add(settlement.cell);
  }
  if (originalVersion < 9) initializeLegacyLand(state);
  validateLand(state);
  validateRoads(state, requiredSight);
  for (const faction of state.factions) validateLandKnowledge(state, faction.id, requiredSight.get(faction.id)!);
  rebuildIndexes(state);
  return state;
}

export function replayGame(initialSave: string, commands: GameCommand[]): GameState {
  const state = deserializeGame(initialSave);
  commands.forEach((command, index) => {
    const result = applyCommand(state, command);
    if (!result.ok) throw new Error(`Replay command ${index + 1} rejected: ${result.error}`);
  });
  return state;
}
