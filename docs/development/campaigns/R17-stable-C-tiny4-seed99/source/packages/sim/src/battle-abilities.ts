import { sceneSoldiers, reconcileIndividualLosses } from './combat/individual';
import { z } from 'zod';
import { BATTLE_SPELLS, COMMANDER_ABILITIES, FACTIONS, MAGIC_PATHS, MAX_CASTER_STRAIN, INNATE_BATTLE_ABILITIES, UNITS } from '@theandril/content';
import type { CampaignBattle, DomainEvent, GameState } from './types';
import { characterSpellIds } from './magic';
import { battleStatChange, type BattleFormation } from './combat';
import type { BattleFactObserver, BattleSceneSnapshot, BattleSide } from './combat/presentation';

const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
export const battleAbilityStateSchema = z.object({
  sources: z.array(z.object({ sourceId: id, sourceKind: z.enum(['formation', 'character']), armyId: id.nullable(), abilityId: id, automatic: z.boolean(), usesRemaining: z.number().int().min(0).max(4) }).strict()).max(168),
  casters: z.array(z.object({ characterId: id, strain: z.number().int().min(0).max(MAX_CASTER_STRAIN), lastActedRound: z.number().int().min(0).max(12) }).strict()).max(42),
  identities: z.array(z.object({ armyId: id, name: z.string().min(1).max(80), factionId: id, factionDefinitionId: id }).strict()).max(21),
}).strict();
export type BattleAbilityState = z.infer<typeof battleAbilityStateSchema>;
type Source = BattleAbilityState['sources'][number];
export interface BattleAbilityOption {
  sourceId: string; sourceKind: 'formation' | 'character'; armyId: string | null; abilityId: string;
  name: string; description: string; automatic: boolean; usesRemaining: number; strainCost: number; currentStrain: number;
  canUse: boolean; blocker: string | null;
  targets: { targetId: string; label: string; side: BattleSide; canTarget: boolean; blocker: string | null }[];
}
const units = new Map(UNITS.map(unit => [unit.id, unit]));
const shieldDrill = INNATE_BATTLE_ABILITIES[0];
const active = (item: BattleFormation) => item.strength > 0 && item.morale > 0;
const formations = (battle: CampaignBattle) => [...battle.combat.attacker, ...battle.combat.defender];
const sideOf = (battle: CampaignBattle, formationId: string): BattleSide => battle.combat.attacker.some(item => item.id === formationId) ? 'attacker' : 'defender';
const sourceFaction = (battle: CampaignBattle, source: Source): string => source.armyId === battle.attackerId ? battle.attackerFactionId : battle.defenderFactionId;
const sourceFormations = (battle: CampaignBattle, source: Source): BattleFormation[] => {
  if (source.sourceKind === 'formation') return formations(battle).filter(item => item.id === source.sourceId);
  const ids = new Set(battle.formationBindings.filter(item => item.armyId === source.armyId).map(item => item.battleFormationId));
  return formations(battle).filter(item => ids.has(item.id));
};
export function createBattleAbilityState(state: GameState, battle: CampaignBattle): BattleAbilityState {
  const sources: Source[] = [];
  for (const formation of formations(battle)) if (formation.unitId === shieldDrill.unitId) sources.push({ sourceId: formation.id, sourceKind: 'formation', armyId: battle.formationBindings.find(item => item.battleFormationId === formation.id)?.armyId ?? null, abilityId: shieldDrill.id, automatic: true, usesRemaining: shieldDrill.uses });
  for (const character of battle.characterSnapshots) {
    if (character.rallyRestore) sources.push({ sourceId: character.characterId, sourceKind: 'character', armyId: character.armyId, abilityId: 'ability.rally', automatic: true, usesRemaining: 1 });
    if (character.woundedTurns) continue;
    for (const spellId of character.spellIds ?? []) {
      const spell = BATTLE_SPELLS.find(item => item.id === spellId)!;
      sources.push({ sourceId: character.characterId, sourceKind: 'character', armyId: character.armyId, abilityId: spellId, automatic: true, usesRemaining: spell.uses });
    }
  }
  sources.sort((a, b) => a.sourceId < b.sourceId ? -1 : a.sourceId > b.sourceId ? 1 : a.abilityId < b.abilityId ? -1 : 1);
  return { sources,
    casters: battle.characterSnapshots.filter(item => item.definitionId === 'character.waykeeper').map(item => ({ characterId: item.characterId, strain: 0, lastActedRound: 0 })),
    identities: [...new Set(battle.formationBindings.flatMap(item => item.armyId ? [item.armyId] : []))].sort().map(armyId => {
      const army = state.armies[armyId], faction = state.factions.find(item => item.id === (armyId === battle.attackerId ? battle.attackerFactionId : battle.defenderFactionId))!;
      return { armyId, name: army?.name ?? battle.abilityState?.identities.find(item => item.armyId === armyId)?.name ?? armyId, factionId: faction.id, factionDefinitionId: faction.definitionId };
    }),
  };
}
function controlObjection(state: GameState, factionId: string, battleId: string): string | null {
  const battle = state.battle;
  if (!battle || battle.id !== battleId || battle.rulesVersion < 9 || !battle.abilityState) return 'Choose the current ability-enabled battle.';
  const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId;
  return controller === factionId ? null : 'Only the controlling battle participant may issue tactical orders.';
}
function sourceObjection(battle: CampaignBattle, source: Source, actionRound: number): string | null {
  if (battle.combat.result) return 'This battle has finished.';
  if (!source.usesRemaining) return 'This ability has no uses remaining this battle.';
  if (!sourceFormations(battle, source).some(active)) return 'This source has no active formation remaining.';
  if (source.sourceKind === 'character' && battle.characterSnapshots.find(item => item.characterId === source.sourceId)?.woundedTurns) return 'This character is wounded.';
  const spell = BATTLE_SPELLS.find(item => item.id === source.abilityId);
  if (spell) {
    const caster = battle.abilityState?.casters.find(item => item.characterId === source.sourceId);
    if (!caster) return 'This source is not a battle caster.';
    if (caster.lastActedRound >= actionRound) return 'This caster has already acted for the upcoming round.';
    if (caster.strain + spell.strainCost > MAX_CASTER_STRAIN) return 'This spell would exceed the caster’s battle strain limit.';
  }
  if (source.abilityId === 'ability.rally' && !sourceFormations(battle, source).some(item => active(item) && item.morale < (units.get(item.unitId)?.morale ?? 0))) return 'No active formation in this army needs a morale rally.';
  return null;
}
function targetObjection(battle: CampaignBattle, source: Source, targetId: string | undefined): string | null {
  if (source.abilityId === 'ability.rally') return targetId === undefined ? null : 'Rally targets its own army, not a selected formation.';
  const target = formations(battle).find(item => item.id === targetId);
  if (!target || !active(target)) return 'Choose an active battlefield formation.';
  if (source.abilityId === 'ability.set_shields') return target.id !== source.sourceId ? 'A formation can only set its own shields.' : (target.ward ?? 0) >= shieldDrill.protection ? 'This formation already has enough protection.' : target.fatigue > 100 - shieldDrill.fatigueCost ? 'The formation is too fatigued to set shields.' : null;
  const spell = BATTLE_SPELLS.find(item => item.id === source.abilityId);
  if (!spell) return 'Unknown battlefield ability.';
  const anchor = sourceFormations(battle, source).filter(active)[0];
  if (!anchor) return 'This caster has no active escort.';
  const friendly = sideOf(battle, anchor.id) === sideOf(battle, target.id);
  if ((spell.target === 'friendly') !== friendly) return `Choose an active ${spell.target} formation.`;
  const distance = friendly ? Math.abs(anchor.row - target.row) + Math.abs(anchor.column - target.column) : anchor.row + target.row + 1 + Math.floor(Math.abs(anchor.column - target.column) / 2);
  if (distance > spell.range) return 'This formation is outside the spell’s battlefield range.';
  if (spell.kind === 'ward' && (target.ward ?? 0) >= spell.power) return 'This formation already has an equal or stronger ward.';
  return null;
}
function execute(battle: CampaignBattle, source: Source, targetId: string | undefined, actionRound: number, events: DomainEvent[], turn: number, observe?: BattleFactObserver): void {
  const targets = source.abilityId === 'ability.rally' ? sourceFormations(battle, source).filter(active) : formations(battle).filter(item => item.id === targetId);
  const killedSoldierIds: string[] = [];
  const before = observe ? targets.map(item => ({ ...item })) : [];
  const spell = BATTLE_SPELLS.find(item => item.id === source.abilityId);
  let restored = 0;
  for (const target of targets) {
    if (source.abilityId === 'ability.rally') {
      const maximum = battle.characterSnapshots.find(item => item.characterId === source.sourceId)!.rallyRestore;
      const amount = Math.max(0, Math.min(maximum, (units.get(target.unitId)?.morale ?? target.morale) - target.morale)); target.morale += amount; restored += amount;
    } else if (source.abilityId === 'ability.set_shields') { target.ward = Math.max(target.ward ?? 0, shieldDrill.protection); target.fatigue += shieldDrill.fatigueCost; }
    else if (spell?.kind === 'ward') target.ward = Math.max(target.ward ?? 0, spell.power);
    else if (spell) {
      const damage = Math.min(target.strength, Math.max(1, spell.power - Math.floor(target.armor / 3))), absorbed = Math.min(target.ward ?? 0, damage);
      target.ward = (target.ward ?? 0) - absorbed; target.strength -= damage - absorbed;
      killedSoldierIds.push(...reconcileIndividualLosses(target));
      if (damage > absorbed) target.morale = Math.max(0, target.morale - 4 - Math.floor((damage - absorbed) * 70 / target.maxStrength));
    }
  }
  source.usesRemaining--;
  if (spell) { const caster = battle.abilityState!.casters.find(item => item.characterId === source.sourceId)!; caster.strain += spell.strainCost; caster.lastActedRound = actionRound; }
  if (source.abilityId === 'ability.rally') battle.usedAbilities.push({ characterId: source.sourceId, abilityId: source.abilityId });
  const actor = battle.characterSnapshots.find(item => item.characterId === source.sourceId)?.name ?? units.get(sourceFormations(battle, source)[0]?.unitId ?? '')?.name ?? source.sourceId;
  const abilityName = spell?.name ?? (source.abilityId === 'ability.rally' ? 'Rally' : 'Set shields');
  events.push({ turn, factionId: sourceFaction(battle, source), type: source.abilityId === 'ability.rally' ? 'commander_rallied' : 'battle_ability_used', cell: battle.defenderCell,
    message: source.abilityId === 'ability.rally' ? `${actor} rallied the army, restoring ${restored} formation morale in total.` : `${actor} used ${abilityName}${targetId ? ` on ${targetId}` : ''}.` });
  observe?.({ ...(battle.rulesVersion >= 10 ? { killedSoldierIds } : {}), round: battle.combat.round, type: 'ability', sourceId: source.sourceId, sourceKind: source.sourceKind, targetIds: targets.map(item => item.id), abilityId: source.abilityId, attackKind: spell?.kind === 'damage' ? 'fire' : spell ? 'ward' : source.abilityId === 'ability.rally' ? 'rally' : 'brace', changes: targets.map((item, i) => battleStatChange(before[i]!, item)), winner: null, reason: null });
  if (spell?.kind === 'damage') for (const target of targets) if (!active(target)) {
    const changes = [];
    for (const ally of battle.combat[sideOf(battle, target.id)]) if (active(ally)) { const morale = ally.morale; ally.morale = Math.max(0, ally.morale - 8); if (observe) changes.push({ formationId: ally.id, strengthDelta: 0, moraleDelta: ally.morale - morale, fatigueDelta: 0, wardDelta: 0 }); }
    observe?.({ round: battle.combat.round, type: target.strength ? 'rout' : 'destroyed', sourceId: source.sourceId, sourceKind: source.sourceKind, targetIds: [target.id], abilityId: spell.id, attackKind: 'fire', changes, winner: null, reason: null });
  }
}
export function automaticBattleAbilities(state: GameState, battle: CampaignBattle, events: DomainEvent[], observe?: BattleFactObserver): void {
  for (const source of battle.abilityState?.sources ?? []) {
    if (!source.automatic || !source.usesRemaining) continue;
    if (!battle.combat.attacker.some(active) || !battle.combat.defender.some(active)) break;
    if (sourceObjection(battle, source, battle.combat.round)) continue;
    if (source.abilityId === 'ability.rally') {
      if (sourceFormations(battle, source).some(item => active(item) && item.morale < COMMANDER_ABILITIES[0]!.threshold)) execute(battle, source, undefined, battle.combat.round, events, state.turn, observe);
      continue;
    }
    // Shield drill can only target its own formation; do not re-scan the whole
    // battlefield inside a legality check for every impossible foreign target.
    const candidates = source.abilityId === shieldDrill.id ? sourceFormations(battle, source) : formations(battle);
    const targets = candidates.filter(target => !targetObjection(battle, source, target.id));
    const spell = BATTLE_SPELLS.find(item => item.id === source.abilityId);
    targets.sort((a, b) => (spell?.kind === 'ward' ? a.row - b.row || b.strength - a.strength : a.strength - b.strength) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (targets[0]) execute(battle, source, targets[0].id, battle.combat.round, events, state.turn, observe);
  }
}
export function battleAbilityCommand(state: GameState, command: { factionId: string; battleId: string; sourceId: string; abilityId: string; targetId?: string; automatic?: boolean }, events: DomainEvent[], observe?: BattleFactObserver): string | null {
  const error = controlObjection(state, command.factionId, command.battleId); if (error) return error;
  const battle = state.battle!, source = battle.abilityState!.sources.find(item => item.sourceId === command.sourceId && item.abilityId === command.abilityId);
  if (!source || sourceFaction(battle, source) !== command.factionId) return 'Choose an eligible ability source on your side of the battle.';
  if (command.automatic !== undefined) {
    if (source.automatic === command.automatic) return 'This ability already has that automatic policy.';
    source.automatic = command.automatic;
    events.push({ turn: state.turn, factionId: command.factionId, type: 'battle_ability_policy', cell: battle.defenderCell, message: `${source.abilityId}: automatic use ${source.automatic ? 'enabled' : 'disabled'} for ${source.sourceId}.` });
    return null;
  }
  const objection = sourceObjection(battle, source, battle.combat.round + 1) ?? targetObjection(battle, source, command.targetId); if (objection) return objection;
  execute(battle, source, command.targetId, battle.combat.round + 1, events, state.turn, observe);
  return null;
}
export function observeBattleAbilities(state: GameState, factionId: string): BattleAbilityOption[] {
  const battle = state.battle; if (!battle?.abilityState || battle.rulesVersion < 9) return [];
  return battle.abilityState.sources.filter(source => sourceFaction(battle, source) === factionId).map(source => {
    const spell = BATTLE_SPELLS.find(item => item.id === source.abilityId);
    const targets = source.abilityId === 'ability.rally' ? [] : formations(battle).map(target => { const blocker = targetObjection(battle, source, target.id); return { targetId: target.id, label: `${units.get(target.unitId)?.name ?? target.unitId} (${target.id})`, side: sideOf(battle, target.id), canTarget: blocker === null, blocker }; });
    const blocker = controlObjection(state, factionId, battle.id) ?? sourceObjection(battle, source, battle.combat.round + 1) ?? (targets.length && !targets.some(item => item.canTarget) ? 'No legal battlefield target is available.' : null);
    return { ...source, name: spell?.name ?? (source.abilityId === 'ability.rally' ? 'Rally' : 'Set shields'), description: spell?.description ?? (source.abilityId === 'ability.rally' ? 'Restore morale to the marshal’s own active formations once per battle.' : 'Once per battle, pay eight fatigue for six damage-absorbing protection. This is shield drill, not magic.'), strainCost: spell?.strainCost ?? 0, currentStrain: battle.abilityState!.casters.find(item => item.characterId === source.sourceId)?.strain ?? 0, canUse: blocker === null, blocker, targets };
  });
}
/** Battlefield participants are public to their two sides; passenger identities are omitted. */
export function getBattleScene(state: GameState, battle: CampaignBattle): BattleSceneSnapshot {
  const identity = (armyId: string | null, side: BattleSide) => {
    const factionId = side === 'attacker' ? battle.attackerFactionId : battle.defenderFactionId;
    const saved = battle.abilityState?.identities.find(item => item.armyId === armyId);
    return { armyName: saved?.name ?? (armyId ? state.armies[armyId]?.name ?? armyId : 'Settlement militia'), factionId, factionDefinitionId: saved?.factionDefinitionId ?? state.factions.find(item => item.id === factionId)!.definitionId };
  };
  return { ...(battle.rulesVersion >= 10 ? { soldiers: sceneSoldiers(formations(battle)) } : {}), round: battle.combat.round, terrain: battle.combat.terrain, domain: battle.domain, settlementId: battle.settlementId, fortification: battle.fortification,
    formations: formations(battle).map(item => { const armyId = battle.formationBindings.find(binding => binding.battleFormationId === item.id)?.armyId ?? null, side = sideOf(battle, item.id); return { ...item, ...(item.members ? { members: [...item.members] } : {}), ...(item.position ? { position: { ...item.position } } : {}), armyId, side, ...identity(armyId, side), unitName: units.get(item.unitId)?.name ?? item.unitId, ward: item.ward ?? 0 }; }),
    characters: battle.characterSnapshots.map(item => { const side = item.armyId === battle.attackerId ? 'attacker' as const : 'defender' as const; const bindings = new Set(battle.formationBindings.filter(binding => binding.armyId === item.armyId).map(binding => binding.battleFormationId)); return { id: item.characterId, name: item.name, definitionId: item.definitionId, factionId: item.factionId, factionDefinitionId: identity(item.armyId, side).factionDefinitionId, armyId: item.armyId, side, anchorFormationId: formations(battle).find(formation => bindings.has(formation.id) && active(formation))?.id ?? null, strain: battle.abilityState?.casters.find(caster => caster.characterId === item.characterId)?.strain ?? 0, maxStrain: item.definitionId === 'character.waykeeper' ? MAX_CASTER_STRAIN : 0 }; }),
    result: battle.combat.result ? { ...battle.combat.result } : null };
}

/** Frozen source inventory and all spent resources are independently checked on load. */
export function validateBattleAbilities(state: GameState, battle: CampaignBattle, pending: boolean): void {
  const require = (condition: unknown, message: string): void => { if (!condition) throw new Error(`Invalid battle abilities: ${message}`); };
  if (battle.rulesVersion < 9) {
    require(!battle.abilityState && formations(battle).every(item => item.ward === undefined) && battle.characterSnapshots.every(item => item.aptitudes === undefined && item.spellIds === undefined && item.definitionId !== 'character.waykeeper'), 'historical battle contains modern abilities');
    return;
  }
  require(battle.abilityState, 'missing modern source state');
  const actual = battle.abilityState!;
  for (const snapshot of battle.characterSnapshots) {
    if (snapshot.definitionId !== 'character.waykeeper') { require(snapshot.aptitudes === undefined && snapshot.spellIds === undefined, 'ordinary character has caster fields'); continue; }
    require(snapshot.aptitudes && snapshot.spellIds && Object.keys(snapshot.aptitudes).every(id => MAGIC_PATHS.some(item => item.id === id)), 'invalid frozen personal aptitude');
    const available = characterSpellIds(snapshot.aptitudes, state.arcaneResearch[snapshot.factionId] ?? []), spellIds = snapshot.spellIds!;
    require(spellIds.every((id, i) => available.includes(id) && (i === 0 || id > spellIds[i - 1]!)), 'unknown, unqualified or unordered frozen spell');
    if (pending) require(JSON.stringify(snapshot.aptitudes) === JSON.stringify(state.characters[snapshot.characterId]?.aptitudes) && spellIds.join('|') === available.join('|'), 'pending caster differs from personal/national capability');
  }
  const expected = createBattleAbilityState(state, battle);
  require(actual.sources.length === expected.sources.length && actual.casters.length === expected.casters.length && actual.identities.length === expected.identities.length, 'source, caster or identity count differs from participants');
  expected.sources.forEach((source, i) => {
    const item = actual.sources[i]!;
    require(item.sourceId === source.sourceId && item.sourceKind === source.sourceKind && item.armyId === source.armyId && item.abilityId === source.abilityId && item.usesRemaining <= source.usesRemaining, 'source binding, ordering or uses differ from frozen content');
    if (source.abilityId === 'ability.rally') require(battle.usedAbilities.some(used => used.characterId === source.sourceId) === (item.usesRemaining === 0), 'Rally use evidence disagrees');
  });
  expected.casters.forEach((caster, i) => {
    const item = actual.casters[i]!;
    const spent = actual.sources.filter(source => source.sourceId === caster.characterId).reduce((sum, source) => { const spell = BATTLE_SPELLS.find(spell => spell.id === source.abilityId); return sum + (spell ? (spell.uses - source.usesRemaining) * spell.strainCost : 0); }, 0);
    require(item.characterId === caster.characterId && item.strain === spent && (spent === 0 ? item.lastActedRound === 0 : item.lastActedRound >= 1 && item.lastActedRound <= Math.min(12, battle.combat.round + 1)), 'caster strain or action round differs from paid casts');
  });
  expected.identities.forEach((identity, i) => {
    const item = actual.identities[i]!;
    require(item.armyId === identity.armyId && item.factionId === identity.factionId && item.factionDefinitionId === identity.factionDefinitionId && FACTIONS.some(faction => faction.id === item.factionDefinitionId) && (!pending || item.name === state.armies[item.armyId]?.name), 'frozen identity differs from participant');
  });
  require(formations(battle).every(item => Number.isInteger(item.ward) && item.ward! >= 0 && item.ward! <= 8), 'invalid formation protection');
  const anyWardCast = actual.sources.some(source => source.abilityId === 'spell.bound_ward' && source.usesRemaining < BATTLE_SPELLS.find(item => item.id === source.abilityId)!.uses);
  for (const formation of formations(battle)) if (formation.ward) require(anyWardCast || actual.sources.some(source => source.sourceId === formation.id && source.abilityId === 'ability.set_shields' && source.usesRemaining === 0), 'protection has no used source');
}
