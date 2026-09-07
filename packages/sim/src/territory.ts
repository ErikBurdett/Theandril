import { z } from 'zod';
import { BIOME_YIELDS, FACTION_ECOLOGIES, IMPROVEMENTS, NATURAL_FEATURES, TECHNOLOGIES, type LandYield } from '@theandril/content';
import { BIOME_NAMES, hexDistance, naturalFeatures, neighbors } from '@theandril/mapgen';
import type { DomainEvent, GameState, Settlement } from './types';
import { cellsWithin, indexes } from './visibility';
import { rulesVersion } from './rules';

const identifier = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const cellSchema = z.number().int().min(0).max(349_999);
const cellKey = z.string().regex(/^(0|[1-9][0-9]{0,5})$/);
const positive = z.number().int().min(1).max(1_000_000);
const yieldKeys = ['food', 'industry', 'coin', 'knowledge'] as const;
const emptyYield = (): LandYield => ({ food: 0, industry: 0, coin: 0, knowledge: 0 });
const workShape = { cell: cellSchema, coinCost: positive, turns: positive.max(100), remainingTurns: positive.max(100), startedTurn: positive };
export const landWorkSchema = z.discriminatedUnion('kind', [
  z.object({ ...workShape, kind: z.literal('improve'), improvementId: identifier }).strict(),
  z.object({ ...workShape, kind: z.literal('terraform'), biome: z.number().int().min(1).max(11) }).strict(),
]);
export type LandWork = z.infer<typeof landWorkSchema>;
export const settlementLandV10Schema = z.object({ claimed: z.array(cellSchema).min(1).max(37), worked: z.array(cellSchema).max(6), improvements: z.record(cellKey, identifier), work: landWorkSchema.nullable() }).strict();
export const settlementLandSchema = settlementLandV10Schema.extend({ borderGrowth: z.number().int().min(0).max(159) }).strict();
export type SettlementLand = z.infer<typeof settlementLandSchema>;
export const knownLandSchema = z.object({ biome: z.number().int().min(0).max(11), settlementId: identifier.nullable(), factionId: identifier.nullable(), improvementId: identifier.nullable() }).strict();
export type KnownLand = z.infer<typeof knownLandSchema>;
export const landStateSchema = z.object({ settlements: z.record(identifier, settlementLandSchema), biomes: z.record(cellKey, z.number().int().min(1).max(11)), capitals: z.record(identifier, identifier.nullable()), cultivation: z.record(identifier, z.number().int().min(0).max(1_000_000_000_000)), known: z.record(identifier, z.record(cellKey, knownLandSchema)) }).strict();
export const landStateV10Schema = landStateSchema.extend({ settlements: z.record(identifier, settlementLandV10Schema) }).strict();
export type LandState = z.infer<typeof landStateSchema>;
export const landCommandSchemas = [
  z.object({ type: z.literal('claimCell'), factionId: identifier, settlementId: identifier, cell: cellSchema }).strict(),
  z.object({ type: z.literal('setWorkedTiles'), factionId: identifier, settlementId: identifier, cells: z.array(cellSchema).max(6) }).strict(),
  z.object({ type: z.literal('improveTile'), factionId: identifier, settlementId: identifier, cell: cellSchema, improvementId: identifier }).strict(),
  z.object({ type: z.literal('terraformTile'), factionId: identifier, settlementId: identifier, cell: cellSchema, biome: z.number().int().min(1).max(11) }).strict(),
  z.object({ type: z.literal('cancelLandWork'), factionId: identifier, settlementId: identifier }).strict(),
  z.object({ type: z.literal('setCapital'), factionId: identifier, settlementId: identifier }).strict(),
] as const;
const landCommandSchema = z.discriminatedUnion('type', landCommandSchemas);
export type LandCommand = z.infer<typeof landCommandSchema>;
export type SettlementStage = 'colony' | 'settlement' | 'city';
export interface LandYieldBreakdown { biome: LandYield; features: LandYield; affinity: LandYield; improvement: LandYield; featureModifiers: LandYield; total: LandYield }
export interface LandOption { coinCost: number; turns: number; canStart: boolean; blocker: string | null; effectText: string }
export interface LandCellObservation extends KnownLand {
  cell: number; terrain: number; features: number; claimed: boolean; worked: boolean; canWork: boolean; workBlocker: string | null;
  yields: LandYieldBreakdown; claim: LandOption;
  improvementOptions: (LandOption & { improvementId: string; name: string })[];
  terraformOptions: (LandOption & { biome: number; name: string })[];
}
export interface SettlementLandObservation {
  settlementId: string; stage: SettlementStage; isCapital: boolean; claimRadius: number; claimCapacity: number; workerCapacity: number;
  claimed: number[]; worked: number[]; work: LandWork | null; workPaused: string | null; yields: LandYield; cells: LandCellObservation[];
  capitalOption: LandOption; canCancelWork: boolean; cancelBlocker: string | null;
  borderExpansion: BorderExpansionObservation;
}
export interface BorderExpansionObservation { progress: number; threshold: number; rate: number; nextCell: number | null; blocker: string | null }
export interface LandObservation { settlements: SettlementLandObservation[]; cultivation: number; capitalSettlementId: string | null }
/** Detail selection changes only cell quotes; every owned summary is retained. */
export interface LandDetailWindow { readonly offset: number; readonly limit: number }
export type LandDetails = 'all' | 'none' | readonly string[] | LandDetailWindow;
export const emptyLandObservation = (): LandObservation => ({ settlements: [], cultivation: 0, capitalSettlementId: null });
export function emptyLandState(factionIds: readonly string[]): LandState {
  return { settlements: {}, biomes: {}, capitals: Object.fromEntries(factionIds.map(id => [id, null])), cultivation: Object.fromEntries(factionIds.map(id => [id, 0])), known: Object.fromEntries(factionIds.map(id => [id, {}])) };
}
export function settlementStage(town: Settlement): SettlementStage { return town.population <= 2 ? 'colony' : town.population <= 7 ? 'settlement' : 'city'; }
export function settlementClaimRadius(town: Settlement): number { return town.population <= 2 ? 1 : town.population <= 7 ? 2 : 3; }
export function settlementWorkerCapacity(town: Settlement): number { return Math.min(town.population, 6); }
const ordered = (values: readonly number[]): number[] => [...values].sort((a, b) => a - b);
const sameKnown = (a: KnownLand, b: KnownLand): boolean => a.biome === b.biome && a.settlementId === b.settlementId && a.factionId === b.factionId && a.improvementId === b.improvementId;
const landCache = new WeakMap<LandState, Map<number, string>>();
/** Built once per land registry; claim/capture hooks maintain it incrementally. */
export function getLandIndex(state: GameState): Map<number, string> {
  let index = landCache.get(state.land);
  if (!index) {
    // Reserve every center before initialization of any ring. Migration order
    // must never give an existing town's center to an earlier town's hinterland.
    index = new Map(Object.values(state.settlements).map(town => [town.cell, town.id]));
    for (const [id, land] of Object.entries(state.land.settlements)) for (const cell of land.claimed) if (!index.has(cell)) index.set(cell, id);
    landCache.set(state.land, index);
  }
  return index;
}
const baseline = (state: GameState, cell: number): KnownLand => ({ biome: state.world.biome[cell] ?? 0, settlementId: null, factionId: null, improvementId: null });
const effectiveBiome = (state: GameState, cell: number): number => state.land.biomes[cell] ?? state.world.biome[cell] ?? 0;
function actualLandCell(state: GameState, cell: number): KnownLand {
  const settlementId = getLandIndex(state).get(cell) ?? null, town = settlementId ? state.settlements[settlementId] : undefined;
  return { biome: effectiveBiome(state, cell), settlementId, factionId: town?.factionId ?? null, improvementId: settlementId ? state.land.settlements[settlementId]?.improvements[cell] ?? null : null };
}
/** A non-remembering read never reveals the current state of a fogged cell. */
export function observeLandCell(state: GameState, factionId: string, cell: number, remember = false): KnownLand {
  const known = state.land.known[factionId];
  if (!known || !Number.isInteger(cell) || cell < 0 || cell >= state.world.terrain.length) throw new Error('Invalid land observation owner or cell.');
  if (remember) {
    const actual = actualLandCell(state, cell);
    if (sameKnown(actual, baseline(state, cell))) delete known[cell]; else known[cell] = actual;
    return { ...actual };
  }
  return { ...(known[cell] ?? baseline(state, cell)) };
}
export function refreshLandKnowledge(state: GameState, factionId: string, visible: Iterable<number> | ReadonlyMap<number, number>): void {
  for (const entry of visible) observeLandCell(state, factionId, typeof entry === 'number' ? entry : entry[0], true);
}

const notice = (state: GameState, town: Settlement, type: string, message: string, cell = town.cell): DomainEvent => ({ turn: state.turn, factionId: town.factionId, type, message, cell });
export function initializeSettlementLand(state: GameState, town: Settlement, emitted: DomainEvent[] = []): void {
  if (state.land.settlements[town.id]) return;
  const index = getLandIndex(state), previous = index.get(town.cell);
  if (previous && previous !== town.id) {
    const old = state.land.settlements[previous];
    if (old) {
      old.claimed = old.claimed.filter(cell => cell !== town.cell); old.worked = old.worked.filter(cell => cell !== town.cell); delete old.improvements[town.cell];
      if (old.work?.cell === town.cell) { old.work = null; emitted.push(notice(state, town, 'land_work_cancelled', `${town.name}'s founding displaced a local land-work order; no coin was refunded.`)); }
    }
  }
  index.set(town.cell, town.id);
  const claimed = [town.cell];
  for (const cell of ordered(neighbors(town.cell, state.world.width, state.world.height))) if (!index.has(cell)) { claimed.push(cell); index.set(cell, town.id); }
  state.land.settlements[town.id] = { claimed: ordered(claimed), worked: [], improvements: {}, work: null, borderGrowth: 0 };
  if (!state.land.capitals[town.factionId]) state.land.capitals[town.factionId] = town.id;
}
function faction(state: GameState, factionId: string) { return state.factions.find(item => item.id === factionId); }
function townBlocker(state: GameState, town: Settlement | undefined, factionId: string): string | null {
  if (!town || town.factionId !== factionId || !state.land.settlements[town.id]) return 'You do not control that settlement and its territory.';
  if (state.victory) return 'This campaign has ended in victory.';
  if (state.battle || state.pendingCapture) return 'Resolve the pending battle or capture before managing land.';
  if (state.sieges[town.id]) return 'Land management is paused while the settlement is under siege.';
  if (town.occupationTurns) return 'Land management is paused during occupation.';
  return null;
}
function paused(state: GameState, town: Settlement): string | null {
  return state.sieges[town.id] ? 'The settlement is under siege.' : town.occupationTurns ? 'The settlement is occupied.' : null;
}
const borderGrowthThreshold = (land: SettlementLand): number => 12 + 4 * land.claimed.length;
/** Town sight covers its entire current claim radius. No remote ownership or
 * terrain search is needed: the disk contains at most37 hexes. */
export function borderExpansionObservation(state: GameState, town: Settlement): BorderExpansionObservation {
  const land = state.land.settlements[town.id]!;
  const threshold = borderGrowthThreshold(land);
  const base = { progress: land.borderGrowth, threshold, rate: 0, nextCell: null };
  if (rulesVersion(state) < 11) return { ...base, blocker: 'Automatic border growth is unavailable under these historical rules.' };
  const blocked = townBlocker(state, town, town.factionId);
  if (blocked) return { ...base, blocker: blocked };
  if (land.claimed.length >= 37) return { ...base, blocker: 'This settlement has reached its 37-hex claim limit.' };
  const index = getLandIndex(state), visible = indexes(state).visible.get(town.factionId), radius = settlementClaimRadius(town);
  // Enumerate only the existing boundary (at most37*6 edges), not a separate
  // detailed quote disk for every summary-only town publication.
  const frontier = new Set<number>();
  for (const claimed of land.claimed) for (const cell of neighbors(claimed, state.world.width, state.world.height)) {
    if (visible?.has(cell) && state.explored[town.factionId]?.has(cell) && hexDistance(town.cell, cell, state.world.width) <= radius
      && state.world.waterDepth[cell] !== 2 && !index.has(cell)) frontier.add(cell);
  }
  const candidates = [...frontier];
  candidates.sort((a, b) => hexDistance(town.cell, a, state.world.width) - hexDistance(town.cell, b, state.world.width) || a - b);
  const nextCell = candidates[0];
  if (nextCell === undefined) return { ...base, blocker: 'No charted, connected and unclaimed non-deep-water hex is available within the current settlement reach.' };
  const discoveries = state.progression[town.factionId]?.technologies ?? [];
  const research = TECHNOLOGIES.reduce((sum, item) => sum + ((item.introducedInRules ?? 4) <= rulesVersion(state) && discoveries.includes(item.id) ? item.borderGrowthBonus ?? 0 : 0), 0);
  const rate = 1 + Math.floor(Math.min(town.population, 12) / 4) + Number(town.buildings.includes('building.market')) + Number(town.buildings.includes('building.archive')) + research;
  return { progress: land.borderGrowth, threshold, rate, nextCell, blocker: null };
}
function advanceBorderGrowth(state: GameState, town: Settlement, emitted: DomainEvent[]): void {
  const growth = borderExpansionObservation(state, town);
  if (growth.blocker || growth.nextCell === null) return;
  const land = state.land.settlements[town.id]!;
  land.borderGrowth += growth.rate;
  if (land.borderGrowth < growth.threshold) return;
  land.borderGrowth -= growth.threshold;
  land.claimed = ordered([...land.claimed, growth.nextCell]);
  getLandIndex(state).set(growth.nextCell, town.id);
  // Only viewers of this particular claim learn the new owner. A saved memory
  // elsewhere must remain historical, including a surveyor's remote knowledge.
  for (const [factionId, visible] of indexes(state).visible) if (visible.has(growth.nextCell)) observeLandCell(state, factionId, growth.nextCell, true);
  emitted.push(notice(state, town, 'territory_expanded', `${town.name} expanded its civic boundary to hex ${growth.nextCell} after accumulating ${growth.threshold} border progress. No workers or improvements were assigned.`, growth.nextCell));
}
function cellBlocker(state: GameState, town: Settlement, cell: number): string | null {
  if (cell >= state.world.terrain.length) return 'The target is outside the world.';
  if (!state.explored[town.factionId]?.has(cell)) return 'The target has not been charted.';
  return null;
}
type Improvement = (typeof IMPROVEMENTS)[number];
interface LandReadContext {
  ecology: (typeof FACTION_ECOLOGIES)[string] | undefined; preferredBiomes: ReadonlySet<number>;
  improvements: readonly Improvement[]; byId: ReadonlyMap<string, Improvement>; version: number;
  missingResearch: ReadonlySet<string>;
  treasury: number; cultivation: number; index: ReadonlyMap<number, string>;
  geography: Map<number, { biome: number; features: number; terrain: number; depth: number }>;
}
interface TownReadContext { owner: LandReadContext; blocker: string | null; radius: number }
interface CellReadContext {
  town: TownReadContext; biome: number; features: number; terrain: number; depth: number;
  distance: number; costFactor: number; preferred: boolean; claimOwner: string | undefined; blocker: string | null;
}
/** Call-local only: no revision-sensitive derived values survive an observation. */
function landReadContext(state: GameState, owner: GameState['factions'][number]): LandReadContext {
  const ecology = FACTION_ECOLOGIES[owner.definitionId], version = rulesVersion(state), technologies = new Set(state.progression[owner.id]?.technologies ?? []);
  return { ecology, preferredBiomes: new Set(ecology?.affinities.filter(item => yieldKeys.some(key => item.yields[key] > 0)).map(item => item.biomeId)),
    improvements: IMPROVEMENTS.filter(item => (item.introducedInRules ?? 9) <= version), byId: new Map(IMPROVEMENTS.map(item => [item.id, item])), version,
    missingResearch: new Set(IMPROVEMENTS.filter(item => item.requiredTechnologies?.some(id => !technologies.has(id))).map(item => item.id)),
    treasury: owner.treasury, cultivation: state.land.cultivation[owner.id] ?? 0, index: getLandIndex(state), geography: new Map() };
}
function cellReadContext(state: GameState, town: Settlement, cell: number, context: TownReadContext): CellReadContext {
  let geography = context.owner.geography.get(cell);
  if (!geography) {
    geography = { biome: effectiveBiome(state, cell), features: naturalFeatures(state.world, cell), terrain: state.world.terrain[cell] ?? 0, depth: state.world.waterDepth[cell] ?? 0 };
    context.owner.geography.set(cell, geography);
  }
  const distance = hexDistance(town.cell, cell, state.world.width);
  return { ...geography, town: context, distance, costFactor: distance * 4 + context.owner.cultivation * 3, preferred: context.owner.preferredBiomes.has(geography.biome),
    claimOwner: context.owner.index.get(cell), blocker: cellBlocker(state, town, cell) };
}
function siteMatches(state: GameState, cell: number, improvementId: string, biome?: number, context?: CellReadContext): boolean {
  const definition = context ? context.town.owner.byId.get(improvementId) : IMPROVEMENTS.find(item => item.id === improvementId);
  if (!definition || (definition.introducedInRules ?? 9) > (context?.town.owner.version ?? rulesVersion(state))) return false;
  const features = context?.features ?? naturalFeatures(state.world, cell), siteBiome = biome ?? context?.biome ?? effectiveBiome(state, cell);
  return definition.sites.some(site => site.terrainIds.includes(context?.terrain ?? state.world.terrain[cell] ?? 0)
    && (!site.biomeIds || site.biomeIds.includes(siteBiome)) && (!site.waterDepthIds || site.waterDepthIds.includes(context?.depth ?? state.world.waterDepth[cell] ?? 0))
    && (!site.requiredFeatures || (features & site.requiredFeatures) === site.requiredFeatures) && (!site.forbiddenFeatures || !(features & site.forbiddenFeatures)));
}
function quoteCost(state: GameState, town: Settlement, cell: number, base: number, targetBiome?: number, context?: CellReadContext): number {
  const distance = context?.distance ?? hexDistance(town.cell, cell, state.world.width);
  const preferred = context ? context.preferred : FACTION_ECOLOGIES[faction(state, town.factionId)?.definitionId ?? '']?.affinities.some(item => item.biomeId === effectiveBiome(state, cell) && yieldKeys.some(key => item.yields[key] > 0)) ?? false;
  // Biome IDs are labels, not an ordered climate scale. Off-affinity ground
  // incurs a fixed adaptation surcharge, with no accidental ID arithmetic.
  const climateMismatch = preferred ? 0 : targetBiome === undefined ? 4 : 12;
  return Math.min(1_000_000, Math.max(1, base + (context?.costFactor ?? distance * 4 + (state.land.cultivation[town.factionId] ?? 0) * 3) + climateMismatch));
}
function option(coinCost: number, turns: number, blocker: string | null, effectText: string): LandOption { return { coinCost, turns, canStart: !blocker, blocker, effectText }; }
function funding(state: GameState, town: Settlement, price: number, context?: TownReadContext): string | null { return (context?.owner.treasury ?? faction(state, town.factionId)?.treasury ?? 0) < price ? `Requires ${price} coin upfront.` : null; }
function claimOption(state: GameState, town: Settlement, cell: number, context?: CellReadContext): LandOption {
  const land = state.land.settlements[town.id]!, price = quoteCost(state, town, cell, 12, undefined, context);
  const blocker = (context ? context.town.blocker : townBlocker(state, town, town.factionId)) ?? (context ? context.blocker : cellBlocker(state, town, cell))
    // Legal claim reach never exceeds the owning town's sight. Refuse distant
    // probes before inspecting current ownership, which may have changed in fog.
    ?? ((context?.distance ?? hexDistance(town.cell, cell, state.world.width)) > (context?.town.radius ?? settlementClaimRadius(town)) ? 'This hex lies beyond the settlement’s current reach.' : null)
    ?? ((context ? context.claimOwner !== undefined : getLandIndex(state).has(cell)) ? 'This hex is already claimed.' : null)
    ?? (land.claimed.length >= 37 ? 'This settlement has reached its 37-hex claim limit.' : null)
    ?? (!neighbors(cell, state.world.width, state.world.height).some(next => getLandIndex(state).get(next) === town.id) ? 'Claims must connect to existing territory.' : null)
    ?? funding(state, town, price, context?.town);
  return option(price, 0, blocker, 'Claim this hex for this settlement. Borders do not prevent military passage.');
}
function improvementOption(state: GameState, town: Settlement, cell: number, improvementId: string, context?: CellReadContext): LandOption {
  const land = state.land.settlements[town.id]!;
  const candidate = context ? context.town.owner.byId.get(improvementId) : IMPROVEMENTS.find(item => item.id === improvementId);
  const definition = candidate && (candidate.introducedInRules ?? 9) <= (context?.town.owner.version ?? rulesVersion(state)) ? candidate : undefined;
  const price = quoteCost(state, town, cell, definition?.coinCost ?? 1, undefined, context);
  const blocker = (context ? context.town.blocker : townBlocker(state, town, town.factionId)) ?? (context ? context.blocker : cellBlocker(state, town, cell))
    ?? (!definition ? 'Unknown improvement.' : null) ?? ((context ? context.claimOwner : getLandIndex(state).get(cell)) !== town.id ? 'The target is not claimed by this settlement.' : null)
    ?? ((context ? context.town.owner.missingResearch.has(improvementId) : definition?.requiredTechnologies?.some(id => !state.progression[town.factionId]?.technologies.includes(id))) ? 'Research the required technologies before beginning this improvement.' : null)
    ?? (cell === town.cell ? 'The settlement center cannot hold a tile improvement.' : null)
    ?? (land.work ? 'This settlement already has a land-work order.' : null)
    ?? (land.improvements[cell] === improvementId ? 'This improvement is already present.' : null)
    ?? (!siteMatches(state, cell, improvementId, undefined, context) ? 'This improvement does not suit the hex’s physical terrain, biome or natural features.' : null)
    ?? funding(state, town, price, context?.town);
  const description = definition?.description ?? 'Unknown improvement.';
  // Current UI presents this shared construction rule once, not 370 times in a
  // 37-cell query. Keep the historical selector's exact wording unchanged.
  return option(price, definition?.turns ?? 1, blocker, rulesVersion(state) < 11 ? `${description} Replaces any existing improvement on completion; benefits require a worked tile.` : description);
}
function terraformOption(state: GameState, town: Settlement, cell: number, biome: number, context?: CellReadContext): LandOption {
  const land = state.land.settlements[town.id]!, ecology = context ? context.town.owner.ecology : FACTION_ECOLOGIES[faction(state, town.factionId)?.definitionId ?? ''];
  const price = quoteCost(state, town, cell, 40, biome, context), terrain = context?.terrain ?? state.world.terrain[cell];
  const blocker = (context ? context.town.blocker : townBlocker(state, town, town.factionId)) ?? (context ? context.blocker : cellBlocker(state, town, cell))
    ?? ((context ? context.claimOwner : getLandIndex(state).get(cell)) !== town.id ? 'The target is not claimed by this settlement.' : null)
    ?? (terrain === 0 || terrain === 4 ? 'Water and mountain biomes cannot be cultivated.' : null)
    ?? (!ecology?.terraformBiomeIds.includes(biome) ? 'This faction has not developed that cultivation tradition.' : null)
    ?? ((context?.biome ?? effectiveBiome(state, cell)) === biome ? 'This hex already has that biome.' : null)
    ?? (land.work ? 'This settlement already has a land-work order.' : null)
    ?? (land.improvements[cell] && !siteMatches(state, cell, land.improvements[cell]!, biome, context) ? 'The existing improvement cannot remain in the proposed biome. Choose another tile for this cultivation.' : null)
    ?? funding(state, town, price, context?.town);
  return option(price, 3 + Math.min(3, Math.floor((context?.town.owner.cultivation ?? state.land.cultivation[town.factionId] ?? 0) / 10)), blocker, `Cultivate ${BIOME_NAMES[biome] ?? 'the target biome'}. Physical relief, movement costs, natural features and water depth remain unchanged. The cultivated biome persists after conquest or razing.`);
}
function capitalOption(state: GameState, town: Settlement, context?: TownReadContext): LandOption {
  const price = 60;
  return option(price, 0, (context ? context.blocker : townBlocker(state, town, town.factionId)) ?? (state.land.capitals[town.factionId] === town.id ? 'This settlement is already the capital.' : null) ?? funding(state, town, price, context), 'Move the capital here. Its center gains 1 coin and 1 knowledge per turn before settlement penalties.');
}
function workedBlocker(state: GameState, town: Settlement, cell: number, context?: CellReadContext): string | null {
  return (context ? context.town.blocker : townBlocker(state, town, town.factionId)) ?? (context ? context.blocker : cellBlocker(state, town, cell)) ?? (cell === town.cell ? 'The center is worked automatically without consuming a worker.' : null) ?? ((context ? context.claimOwner : getLandIndex(state).get(cell)) !== town.id ? 'Workers must remain in this settlement’s claimed territory.' : null) ?? ((context?.depth ?? state.world.waterDepth[cell]) === 2 ? 'Settlement workers cannot exploit deep ocean.' : null);
}

function addYield(target: LandYield, source: LandYield): void { for (const key of yieldKeys) target[key] += source[key]; }
export function landCellYields(state: GameState, town: Settlement, cell: number): LandYieldBreakdown {
  return cellYields(state, town, cell);
}
function cellYields(state: GameState, town: Settlement, cell: number, context?: CellReadContext): LandYieldBreakdown {
  const biome = context?.biome ?? effectiveBiome(state, cell), flags = context?.features ?? naturalFeatures(state.world, cell);
  const land = state.land.settlements[town.id], improvement = context ? context.town.owner.byId.get(land?.improvements[cell] ?? '') : IMPROVEMENTS.find(item => item.id === land?.improvements[cell]);
  const result: LandYieldBreakdown = { biome: { ...(BIOME_YIELDS[biome] ?? emptyYield()) }, features: emptyYield(), affinity: emptyYield(), improvement: { ...(improvement?.yields ?? emptyYield()) }, featureModifiers: emptyYield(), total: emptyYield() };
  for (const feature of NATURAL_FEATURES) if (flags & feature.feature) addYield(result.features, feature.yields);
  const ecology = context ? context.town.owner.ecology : FACTION_ECOLOGIES[faction(state, town.factionId)?.definitionId ?? ''];
  for (const affinity of ecology?.affinities ?? []) if (affinity.biomeId === biome) addYield(result.affinity, affinity.yields);
  for (const modifier of improvement?.featureModifiers ?? []) if ((flags & modifier.feature) === modifier.feature) addYield(result.featureModifiers, modifier.yields);
  for (const component of [result.biome, result.features, result.affinity, result.improvement, result.featureModifiers]) addYield(result.total, component);
  for (const key of yieldKeys) result.total[key] = Math.max(0, result.total[key]);
  return result;
}
export function settlementLandYield(state: GameState, town: Settlement): LandYield {
  return townLandYield(state, town);
}
function townLandYield(state: GameState, town: Settlement, context?: TownReadContext): LandYield {
  const total = emptyYield(), land = state.land.settlements[town.id];
  if (!land) return total;
  for (const cell of [town.cell, ...land.worked]) addYield(total, cellYields(state, town, cell, context ? cellReadContext(state, town, cell, context) : undefined).total);
  if (state.land.capitals[town.factionId] === town.id) { total.coin++; total.knowledge++; }
  return total;
}

/** All validation and quoting precede coin, territory, work or worker mutation. */
export function applyLandCommand(state: GameState, input: unknown, emitted: DomainEvent[] = []): string | null {
  const parsed = landCommandSchema.safeParse(input);
  if (!parsed.success) return 'Malformed land command.';
  const command = parsed.data, town = state.settlements[command.settlementId], blocker = townBlocker(state, town, command.factionId);
  if (blocker || !town) return blocker ?? 'Unknown settlement.';
  const owner = faction(state, command.factionId), land = state.land.settlements[town.id]!;
  if (!owner) return 'Unknown faction.';
  if ('cell' in command && command.cell >= state.world.terrain.length) return 'The target is outside the world.';
  if (command.type === 'setWorkedTiles') {
    if (new Set(command.cells).size !== command.cells.length) return 'Select each worked tile only once.';
    if (command.cells.length > settlementWorkerCapacity(town)) return `This settlement can work at most ${settlementWorkerCapacity(town)} additional tiles.`;
    for (const cell of command.cells) { const obstruction = workedBlocker(state, town, cell); if (obstruction) return obstruction; }
    land.worked = ordered(command.cells);
    emitted.push(notice(state, town, 'worked_tiles_changed', `${town.name} assigned workers to ${land.worked.length} claimed hexes; its center remains worked.`));
    return null;
  }
  if (command.type === 'cancelLandWork') {
    if (!land.work) return 'This settlement has no land-work order.';
    const cell = land.work.cell; land.work = null;
    emitted.push(notice(state, town, 'land_work_cancelled', `${town.name} cancelled its land work at hex ${cell}; no coin was refunded.`, cell));
    return null;
  }
  if (command.type === 'setCapital') {
    const quote = capitalOption(state, town); if (quote.blocker) return quote.blocker;
    owner.treasury -= quote.coinCost; state.land.capitals[owner.id] = town.id;
    emitted.push(notice(state, town, 'capital_changed', `${town.name} became ${owner.name}'s capital for ${quote.coinCost} coin.`));
    return null;
  }
  const quote = command.type === 'claimCell' ? claimOption(state, town, command.cell) : command.type === 'improveTile' ? improvementOption(state, town, command.cell, command.improvementId) : terraformOption(state, town, command.cell, command.biome);
  if (quote.blocker) return quote.blocker;
  owner.treasury -= quote.coinCost;
  if (command.type === 'claimCell') {
    land.claimed = ordered([...land.claimed, command.cell]); getLandIndex(state).set(command.cell, town.id);
    emitted.push(notice(state, town, 'territory_claimed', `${town.name} claimed hex ${command.cell} for ${quote.coinCost} coin.`, command.cell));
  } else {
    const common = { cell: command.cell, coinCost: quote.coinCost, turns: quote.turns, remainingTurns: quote.turns, startedTurn: state.turn };
    land.work = command.type === 'improveTile' ? { ...common, kind: 'improve', improvementId: command.improvementId } : { ...common, kind: 'terraform', biome: command.biome };
    const name = command.type === 'improveTile' ? IMPROVEMENTS.find(item => item.id === command.improvementId)!.name : `cultivation of ${BIOME_NAMES[command.biome]}`;
    emitted.push(notice(state, town, 'land_work_started', `${town.name} paid ${quote.coinCost} coin for ${name} at hex ${command.cell}; ${quote.turns} active turns of work are required.`, command.cell));
  }
  return null;
}

/** Called once per town per resolved turn; never traverses the global tile map. */
export function resolveLandTurn(state: GameState, town: Settlement, emitted: DomainEvent[] = []): void {
  const land = state.land.settlements[town.id]; if (!land) return;
  land.worked = ordered(land.worked.filter(cell => cell !== town.cell && getLandIndex(state).get(cell) === town.id)).slice(0, settlementWorkerCapacity(town));
  if (rulesVersion(state) >= 11) advanceBorderGrowth(state, town, emitted);
  const work = land.work; if (!work || paused(state, town)) return;
  work.remainingTurns--;
  if (work.remainingTurns) { emitted.push(notice(state, town, 'land_work_progress', `${town.name}'s work at hex ${work.cell} has ${work.remainingTurns} active turns remaining.`, work.cell)); return; }
  let name: string;
  if (work.kind === 'improve') { land.improvements[work.cell] = work.improvementId; name = IMPROVEMENTS.find(item => item.id === work.improvementId)!.name; }
  else {
    if (work.biome === state.world.biome[work.cell]) delete state.land.biomes[work.cell]; else state.land.biomes[work.cell] = work.biome;
    name = `cultivation of ${BIOME_NAMES[work.biome]}`;
  }
  state.land.cultivation[town.factionId] = (state.land.cultivation[town.factionId] ?? 0) + 1;
  land.work = null;
  emitted.push(notice(state, town, 'land_work_completed', `${town.name} completed ${name} at hex ${work.cell}.`, work.cell));
}

export function handleLandCapture(state: GameState, settlementId: string, previousOwnerId: string, emitted: DomainEvent[] = []): void {
  const land = state.land.settlements[settlementId], town = state.settlements[settlementId], index = getLandIndex(state);
  if (land) land.borderGrowth = 0;
  if (land?.work) {
    const work = land.work;
    emitted.push({ turn: state.turn, factionId: previousOwnerId, type: 'land_work_cancelled', cell: work.cell, message: `The capture of ${settlementId} cancelled land work at hex ${work.cell}; no coin was refunded.` }); land.work = null;
  }
  if (!town && land) { for (const cell of land.claimed) index.delete(cell); delete state.land.settlements[settlementId]; }
  else if (town && land) land.worked = ordered(land.worked).slice(0, settlementWorkerCapacity(town));
  for (const ownerId of new Set([previousOwnerId, ...(town ? [town.factionId] : [])])) {
    const capital = state.land.capitals[ownerId];
    if (!capital || state.settlements[capital]?.factionId !== ownerId) {
      const replacement = Object.values(state.settlements).filter(item => item.factionId === ownerId).sort((a, b) => a.id < b.id ? -1 : 1)[0];
      state.land.capitals[ownerId] = replacement?.id ?? null;
      if (replacement) emitted.push(notice(state, replacement, 'capital_changed', `${replacement.name} became the capital after settlement ownership changed.`));
    }
  }
}

function settlementLandObservation(state: GameState, factionId: string, town: Settlement, visible: { has(cell: number): boolean }, includeCells: boolean, owner: LandReadContext): SettlementLandObservation {
    const land = state.land.settlements[town.id]!;
    const context: TownReadContext = { owner, blocker: townBlocker(state, town, factionId), radius: settlementClaimRadius(town) };
    // Omitted detail never walks candidate tiles or constructs rule quotes.
    const candidates = includeCells ? ordered([...new Set([...land.claimed, ...cellsWithin(state, town.cell, settlementClaimRadius(town))])]) : [];
    const cells: LandCellObservation[] = candidates.filter(cell => visible.has(cell)).map(cell => {
      const derived = cellReadContext(state, town, cell, context), actual = actualLandCell(state, cell), claimed = actual.settlementId === town.id, workBlocker = workedBlocker(state, town, cell, derived);
      return { ...actual, cell, terrain: derived.terrain, features: derived.features, claimed, worked: land.worked.includes(cell) || cell === town.cell, canWork: !workBlocker, workBlocker,
        yields: cellYields(state, town, cell, derived), claim: claimOption(state, town, cell, derived),
        improvementOptions: owner.improvements.map(item => ({ improvementId: item.id, name: item.name, ...improvementOption(state, town, cell, item.id, derived) })),
        terraformOptions: (owner.ecology?.terraformBiomeIds ?? []).map(biome => ({ biome, name: BIOME_NAMES[biome] ?? String(biome), ...terraformOption(state, town, cell, biome, derived) })),
      };
    });
    const obstruction = context.blocker ?? (!land.work ? 'This settlement has no land-work order.' : null);
    return { settlementId: town.id, stage: settlementStage(town), isCapital: state.land.capitals[factionId] === town.id, claimRadius: settlementClaimRadius(town), claimCapacity: 1 + 3 * settlementClaimRadius(town) * (settlementClaimRadius(town) + 1), workerCapacity: settlementWorkerCapacity(town), claimed: [...land.claimed], worked: [...land.worked], work: land.work ? { ...land.work } : null, workPaused: paused(state, town), yields: townLandYield(state, town, context), cells, capitalOption: capitalOption(state, town, context), canCancelWork: !obstruction, cancelBlocker: obstruction, borderExpansion: borderExpansionObservation(state, town) };
}

export function getLandObservation(state: GameState, factionId: string, visible: { has(cell: number): boolean }, details: LandDetails = 'all'): LandObservation {
  const factionOwner = faction(state, factionId);
  if (!factionOwner) throw new Error('Unknown land observation faction.');
  const towns = Object.values(state.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1);
  let requested: Set<string> | null = null;
  if (typeof details !== 'string') {
    if (Array.isArray(details)) requested = new Set(details);
    else {
      const window = details as LandDetailWindow;
      if (!window || !Number.isSafeInteger(window.offset) || window.offset < 0 || !Number.isSafeInteger(window.limit) || window.limit < 0) {
        throw new Error('Land detail window offset and limit must be nonnegative safe integers.');
      }
      requested = new Set();
      // Normalize before addition to keep even MAX_SAFE_INTEGER offsets exact.
      // The owned registry bounds work and allocation, never the requested limit.
      const offset = towns.length ? window.offset % towns.length : 0;
      for (let index = 0; index < Math.min(window.limit, towns.length); index++) requested.add(towns[(offset + index) % towns.length]!.id);
    }
  }
  const context = landReadContext(state, factionOwner);
  const settlements = towns.map(town => settlementLandObservation(state, factionId, town, visible, details === 'all' || requested?.has(town.id) === true, context));
  return { settlements, cultivation: state.land.cultivation[factionId] ?? 0, capitalSettlementId: state.land.capitals[factionId] ?? null };
}

/** Direct owned-town lookup; unrelated towns' candidate tiles are never visited. */
export function getSettlementLandObservation(state: GameState, factionId: string, settlementId: string): SettlementLandObservation | null {
  const town = state.settlements[settlementId];
  if (!town || town.factionId !== factionId) return null;
  const owner = faction(state, factionId); if (!owner) return null;
  const visible = indexes(state).visible.get(factionId) ?? new Map<number, number>();
  return settlementLandObservation(state, factionId, town, visible, true, landReadContext(state, owner));
}

const requireLand = (condition: unknown, message: string): void => { if (!condition) throw new Error(`Invalid land: ${message}`); };
const canonicalCells = (cells: number[]): boolean => cells.every((cell, index) => index === 0 || cell > cells[index - 1]!);
/** Strict current-state references; remembered foreign ownership may be historical. */
export function validateLand(state: GameState): void {
  landStateSchema.parse(state.land);
  const owners = new Set(state.factions.map(item => item.id)), towns = Object.keys(state.settlements).sort(), landIds = Object.keys(state.land.settlements).sort();
  requireLand(JSON.stringify(towns) === JSON.stringify(landIds), 'every living settlement needs exactly one land registry');
  for (const registry of [state.land.capitals, state.land.cultivation, state.land.known]) requireLand(Object.keys(registry).length === owners.size && Object.keys(registry).every(id => owners.has(id)), 'faction registry differs from campaign owners');
  const validCell = (cell: number): boolean => Number.isInteger(cell) && cell >= 0 && cell < state.world.terrain.length;
  const knownTownId = (id: string): boolean => /^settlement\.[1-9][0-9]*$/.test(id) && Number(id.slice(11)) < state.nextId;
  const claims = new Map<number, string>();
  for (const [id, land] of Object.entries(state.land.settlements)) {
    const town = state.settlements[id]!;
    requireLand(land.borderGrowth < borderGrowthThreshold(land), 'border progress must remain below its current expansion threshold');
    requireLand(canonicalCells(land.claimed) && land.claimed.includes(town.cell), 'claims must be ordered, unique and contain the center');
    for (const cell of land.claimed) {
      requireLand(validCell(cell) && hexDistance(town.cell, cell, state.world.width) <= 3 && !claims.has(cell), 'invalid, duplicate or distant claim'); claims.set(cell, id);
    }
    const connected = new Set([town.cell]), frontier = [town.cell], claimed = new Set(land.claimed);
    for (let cursor = 0; cursor < frontier.length; cursor++) for (const cell of neighbors(frontier[cursor]!, state.world.width, state.world.height)) if (claimed.has(cell) && !connected.has(cell)) { connected.add(cell); frontier.push(cell); }
    requireLand(connected.size === land.claimed.length, 'claimed territory is disconnected');
    requireLand(canonicalCells(land.worked) && land.worked.length <= settlementWorkerCapacity(town) && land.worked.every(cell => cell !== town.cell && claimed.has(cell) && state.world.waterDepth[cell] !== 2), 'invalid or excess worked tiles');
    for (const [key, improvementId] of Object.entries(land.improvements)) {
      const cell = Number(key);
      requireLand(cell !== town.cell && claimed.has(cell) && siteMatches(state, cell, improvementId), 'invalid improvement site or definition');
    }
    if (land.work) {
      const work = land.work;
      requireLand(claimed.has(work.cell) && work.startedTurn <= state.turn && work.remainingTurns <= work.turns && work.turns - work.remainingTurns <= state.turn - work.startedTurn, 'invalid land-work position or timing');
      if (work.kind === 'improve') {
        const definition = IMPROVEMENTS.find(item => item.id === work.improvementId);
        requireLand(definition && (definition.requiredTechnologies ?? []).every(id => state.progression[town.factionId]?.technologies.includes(id)) && work.cell !== town.cell && definition.turns === work.turns && work.coinCost >= definition.coinCost && land.improvements[work.cell] !== work.improvementId && siteMatches(state, work.cell, work.improvementId), 'invalid improvement work');
      } else {
        const ecology = FACTION_ECOLOGIES[faction(state, town.factionId)?.definitionId ?? ''];
        requireLand(ecology?.terraformBiomeIds.includes(work.biome) && state.world.terrain[work.cell] !== 0 && state.world.terrain[work.cell] !== 4 && work.biome !== effectiveBiome(state, work.cell) && work.turns >= 3 && work.turns <= 6 && work.coinCost >= 40 && (!land.improvements[work.cell] || siteMatches(state, work.cell, land.improvements[work.cell]!, work.biome)), 'invalid cultivation work');
      }
    }
  }
  for (const town of Object.values(state.settlements)) requireLand(claims.get(town.cell) === town.id, 'a settlement center belongs to another territory');
  for (const [key, biome] of Object.entries(state.land.biomes)) {
    const cell = Number(key);
    requireLand(validCell(cell) && state.world.terrain[cell] !== 0 && state.world.terrain[cell] !== 4 && biome !== state.world.biome[cell] && Object.values(FACTION_ECOLOGIES).some(item => item.terraformBiomeIds.includes(biome)), 'invalid or redundant cultivated biome');
  }
  for (const [ownerId, capitalId] of Object.entries(state.land.capitals)) {
    const hasTowns = Object.values(state.settlements).some(town => town.factionId === ownerId);
    requireLand(capitalId ? state.settlements[capitalId]?.factionId === ownerId : !hasTowns, 'capital must be an owned living settlement, or null only without settlements');
  }
  for (const [ownerId, memory] of Object.entries(state.land.known)) for (const [key, remembered] of Object.entries(memory)) {
    const cell = Number(key);
    requireLand(validCell(cell) && state.explored[ownerId]?.has(cell) && !sameKnown(remembered, baseline(state, cell)), 'unexplored, invalid or redundant land memory');
    requireLand(remembered.settlementId === null ? remembered.factionId === null && remembered.improvementId === null : knownTownId(remembered.settlementId) && remembered.factionId !== null && owners.has(remembered.factionId), 'invalid remembered territory identity');
    requireLand(remembered.improvementId === null || IMPROVEMENTS.some(item => item.id === remembered.improvementId), 'unknown remembered improvement');
    requireLand(state.world.terrain[cell] === 0 ? remembered.biome === 0 : state.world.terrain[cell] === 4 ? remembered.biome === 9 : remembered.biome !== 0 && remembered.biome !== 9, 'remembered biome disagrees with immutable physical geography');
  }
}
/** Call on the loader's already-computed visible cells, before rebuilding sight. */
export function validateLandKnowledge(state: GameState, factionId: string, visible: Iterable<number> | ReadonlyMap<number, number>): void {
  for (const entry of visible) {
    const cell = typeof entry === 'number' ? entry : entry[0];
    requireLand(sameKnown(observeLandCell(state, factionId, cell), actualLandCell(state, cell)), 'visible land memory differs from the current landscape');
  }
}
