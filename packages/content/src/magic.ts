import { z } from 'zod';

const id = z.string().regex(/^[a-z]+\.[a-z_]+$/);
const text = z.string().min(1).max(320);
export const MAGIC_PATHS = [
  { id: 'path.flame', name: 'Flame', description: 'Personal aptitude for bounded heat and ember workings.' },
  { id: 'path.rune', name: 'Rune', description: 'Personal aptitude for inscribed bindings and protective workings.' },
] as const;
export const WAYKEEPER_APTITUDES: Readonly<Record<string, number>> = { 'path.flame': 1, 'path.rune': 1 };
export const MAX_CASTER_STRAIN = 10;
export const innateBattleAbilitySchema = z.object({ id, name: text, description: text, unitId: id, fatigueCost: z.number().int().min(1).max(100), protection: z.number().int().min(1).max(8), uses: z.number().int().min(1).max(4) }).strict();
/** Ordinary shield drill is an innate paid-fatigue action, not personal magic. */
export const INNATE_BATTLE_ABILITIES = [
  { id: 'ability.set_shields', name: 'Set shields', description: 'Once per battle, an active Oath guard pays eight fatigue for six damage-absorbing protection. Shield drill does not heal casualties or restore routed morale.', unitId: 'unit.guard', fatigueCost: 8, protection: 6, uses: 1 },
] as const;
export const arcaneDiscoverySchema = z.object({ id, name: text, description: text, knowledgeCost: z.number().int().positive().max(1000), requiredBuildingId: id, spellIds: z.array(id).min(1).max(4), sinceRules: z.number().int().min(14).max(99).optional() }).strict();
export type ArcaneDiscoveryDefinition = z.infer<typeof arcaneDiscoverySchema>;
export const ARCANE_DISCOVERIES: readonly ArcaneDiscoveryDefinition[] = [
  { id: 'arcane.ember_projection', name: 'Contained ember projection', description: 'National Arcane Theory for Cinder thread. A personally Flame-gifted Waykeeper is still required; research alone cannot cast it.', knowledgeCost: 36, requiredBuildingId: 'building.archive', spellIds: ['spell.cinder_thread'] },
  { id: 'arcane.unbinding', name: 'Measured unbinding', description: 'National Arcane Theory for Unbinding. A Waykeeper must be Rune-gifted to the second degree, which only some traditions teach; research alone cannot cast it.', knowledgeCost: 56, requiredBuildingId: 'building.archive', spellIds: ['spell.unbinding'], sinceRules: 24 },
  { id: 'arcane.rune_binding', name: 'Measured rune binding', description: 'National Arcane Theory for Bound ward. A personally Rune-gifted Waykeeper is still required; wards absorb damage, not casualties already suffered.', knowledgeCost: 48, requiredBuildingId: 'building.archive', spellIds: ['spell.bound_ward'] },
];
export const battleSpellSchema = z.object({ id, name: text, description: text, discoveryId: id, pathId: id, pathLevel: z.number().int().min(1).max(5), kind: z.enum(['damage', 'ward', 'counter']), target: z.enum(['enemy', 'friendly']), strainCost: z.number().int().min(1).max(10), uses: z.number().int().min(1).max(4), range: z.number().int().min(1).max(8), power: z.number().int().min(1).max(30) }).strict();
export type BattleSpellDefinition = z.infer<typeof battleSpellSchema>;
export const BATTLE_SPELLS: readonly BattleSpellDefinition[] = [
  { id: 'spell.cinder_thread', name: 'Cinder thread', description: 'A narrow ember working strikes one active enemy formation. Armor reduces its strength damage; a ward absorbs damage first. Costs four strain, at most twice per battle.', discoveryId: 'arcane.ember_projection', pathId: 'path.flame', pathLevel: 1, kind: 'damage', target: 'enemy', strainCost: 4, uses: 2, range: 4, power: 10 },
  { id: 'spell.unbinding', name: 'Unbinding', description: 'Strip the binding from one active enemy formation and jar the Waykeeper holding it: any ward is undone and that caster loses the coming round. Requires the second degree of the Rune path. Costs five strain, once per battle.', discoveryId: 'arcane.unbinding', pathId: 'path.rune', pathLevel: 2, kind: 'counter', target: 'enemy', strainCost: 5, uses: 1, range: 4, power: 8 },
  { id: 'spell.bound_ward', name: 'Bound ward', description: 'Bind up to eight protective points around one active friendly formation. Protection is consumed by incoming damage and never restores strength or routed morale. Costs three strain, at most twice per battle.', discoveryId: 'arcane.rune_binding', pathId: 'path.rune', pathLevel: 1, kind: 'ward', target: 'friendly', strainCost: 3, uses: 2, range: 4, power: 8 },
];
/** Rules 24: a culture trains its Waykeepers in its own tradition, so who can
 * reach a working — and what its theory costs — differs between realms. */
export const FACTION_APTITUDES: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'faction.cinder_march': { 'path.flame': 2, 'path.rune': 1 },
  'faction.emberwake_convocation': { 'path.flame': 2, 'path.rune': 1 },
  'faction.sepulchral_synod': { 'path.flame': 1, 'path.rune': 2 },
  'faction.margin_observance': { 'path.flame': 1, 'path.rune': 2 },
};
/** A discovery inside a realm's own tradition is studied at three quarters of its price. */
export const FACTION_ARCANE_TRADITIONS: Readonly<Record<string, readonly string[]>> = {
  'faction.cinder_march': ['arcane.ember_projection'],
  'faction.emberwake_convocation': ['arcane.ember_projection'],
  'faction.sepulchral_synod': ['arcane.rune_binding', 'arcane.unbinding'],
  'faction.margin_observance': ['arcane.rune_binding', 'arcane.unbinding'],
};
export const factionAptitudes = (definitionId: string): Readonly<Record<string, number>> => FACTION_APTITUDES[definitionId] ?? WAYKEEPER_APTITUDES;
export const arcaneKnowledgeCost = (definitionId: string, discoveryId: string, cost: number): number =>
  (FACTION_ARCANE_TRADITIONS[definitionId] ?? []).includes(discoveryId) ? Math.ceil(cost * 3 / 4) : cost;
export function validateMagicContent(characterIds: ReadonlySet<string>, buildingIds: ReadonlySet<string>, discoveries = ARCANE_DISCOVERIES, spells = BATTLE_SPELLS): void {
  INNATE_BATTLE_ABILITIES.forEach(item => innateBattleAbilitySchema.parse(item));
  discoveries.forEach(item => arcaneDiscoverySchema.parse(item)); spells.forEach(item => battleSpellSchema.parse(item));
  if (!characterIds.has('character.waykeeper')) throw new Error('Arcane battle magic requires its actual paid Waykeeper role.');
  const ids = [...discoveries, ...spells, ...MAGIC_PATHS].map(item => item.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate magic content ID');
  for (const discovery of discoveries) {
    if (!buildingIds.has(discovery.requiredBuildingId) || new Set(discovery.spellIds).size !== discovery.spellIds.length) throw new Error('Invalid arcane research infrastructure or spell references');
    for (const spellId of discovery.spellIds) if (!spells.some(spell => spell.id === spellId && spell.discoveryId === discovery.id)) throw new Error('Unknown or mismatched arcane spell');
  }
  for (const spell of spells) if (!discoveries.some(item => item.id === spell.discoveryId && item.spellIds.includes(spell.id)) || !MAGIC_PATHS.some(path => path.id === spell.pathId) || (spell.kind === 'damage' || spell.kind === 'counter') && spell.target !== 'enemy' || spell.kind === 'ward' && spell.target !== 'friendly') throw new Error('Invalid spell discovery, personal path or target');
}

/** Every authored tradition must name a real culture, path and discovery. */
export function validateArcaneTraditions(factionIds: ReadonlySet<string>, discoveries = ARCANE_DISCOVERIES): void {
  for (const [factionId, aptitudes] of Object.entries(FACTION_APTITUDES)) {
    if (!factionIds.has(factionId)) throw new Error('Unknown arcane tradition culture: ' + factionId);
    for (const [pathId, level] of Object.entries(aptitudes)) {
      if (!MAGIC_PATHS.some(path => path.id === pathId)) throw new Error('Unknown arcane tradition path: ' + pathId);
      if (!Number.isInteger(level) || level < 0 || level > 3) throw new Error('Invalid arcane tradition level: ' + pathId);
    }
  }
  for (const [factionId, discoveryIds] of Object.entries(FACTION_ARCANE_TRADITIONS)) {
    if (!factionIds.has(factionId)) throw new Error('Unknown arcane tradition culture: ' + factionId);
    for (const id of discoveryIds) if (!discoveries.some(item => item.id === id)) throw new Error('Unknown arcane tradition discovery: ' + id);
  }
}
