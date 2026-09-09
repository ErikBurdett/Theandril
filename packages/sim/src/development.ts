import { z } from 'zod';
import { BUILDINGS, DOCTRINES, INSTITUTIONS, TECHNOLOGIES, UNITS } from '@theandril/content';
import { DEVELOPMENT_NODES, EMPTY_DEVELOPMENT_EFFECTS, developmentScopeSchema, type DevelopmentEffects, type DevelopmentNode, type DevelopmentScope } from '../../content/src/development';
import type { Army, ArmyFormation, CampaignBattle, CommandResult, DomainEvent, GameState, Observation, Settlement } from './types';
import { armyHasCharacterMission } from './characters';
import { rulesVersion } from './rules';
import { resourceCostBlocker, spendResourceCosts } from './resources';

const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const balance = z.number().int().min(0).max(1_000_000);
const learned = z.array(id).max(25);
export const developmentStateSchema = z.object({
  formations: z.record(id, z.object({ experience: balance, nodeIds: learned }).strict()),
  hearths: z.record(id, z.object({ civicPoints: balance, nodeIds: learned }).strict()),
  factions: z.record(id, z.object({ influence: balance, nodeIds: learned }).strict()),
}).strict();
export type DevelopmentState = z.infer<typeof developmentStateSchema>;
export const developmentCommandSchema = z.object({ type: z.literal('develop'), factionId: id, scope: developmentScopeSchema, entityId: id, nodeId: id }).strict();
export type DevelopmentCommand = z.infer<typeof developmentCommandSchema>;
export interface DevelopmentFocus { scope: DevelopmentScope; entityId: string }
export interface DevelopmentChoice extends DevelopmentNode { acquired: boolean; available: boolean; blocker: string | null; active: boolean }
export interface DevelopmentEntityView extends DevelopmentFocus {
  name: string; cell: number | null; armyId?: string; progress: number; currency: 'battle experience' | 'civic points' | 'influence';
  treasury: number; upkeep: number; effects: DevelopmentEffects; choices: DevelopmentChoice[];
}
export interface DevelopmentObservation {
  faction: DevelopmentEntityView; focus: DevelopmentEntityView | null;
  /** Two rotating hearths and two rotating army formations at most. Detailed
   * arbitrary targets use the worker query; no empire-wide tree expansion. */
  candidates: DevelopmentEntityView[];
}
export const createDevelopmentState = (): DevelopmentState => ({ formations: {}, hearths: {}, factions: {} });
const definitions = new Map(DEVELOPMENT_NODES.map(item => [item.id, item]));
const units = new Map(UNITS.map(item => [item.id, item]));
const names = new Map([...BUILDINGS, ...TECHNOLOGIES, ...INSTITUTIONS, ...DOCTRINES].map(item => [item.id, item.name]));
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const current = (state: GameState) => rulesVersion(state) >= 16;
const currency = (scope: DevelopmentScope): DevelopmentEntityView['currency'] => scope === 'formation' ? 'battle experience' : scope === 'hearth' ? 'civic points' : 'influence';
const nodesFor = (state: GameState, focus: DevelopmentFocus): readonly string[] => !current(state) ? [] : focus.scope === 'formation'
  ? state.development.formations[focus.entityId]?.nodeIds ?? [] : focus.scope === 'hearth'
    ? state.development.hearths[focus.entityId]?.nodeIds ?? [] : state.development.factions[focus.entityId]?.nodeIds ?? [];
const progressFor = (state: GameState, focus: DevelopmentFocus): number => !current(state) ? 0 : focus.scope === 'formation'
  ? state.development.formations[focus.entityId]?.experience ?? 0 : focus.scope === 'hearth'
    ? state.development.hearths[focus.entityId]?.civicPoints ?? 0 : state.development.factions[focus.entityId]?.influence ?? 0;

interface Subject { focus: DevelopmentFocus; factionId: string; name: string; cell: number | null; army?: Army; formation?: ArmyFormation; hearth?: Settlement }
function subject(state: GameState, factionId: string, focus: DevelopmentFocus): Subject | null {
  if (focus.scope === 'faction') {
    const faction = state.factions.find(item => item.id === factionId);
    return faction && focus.entityId === factionId ? { focus, factionId, name: faction.name, cell: null } : null;
  }
  if (focus.scope === 'hearth') {
    const hearth = state.settlements[focus.entityId];
    return hearth?.factionId === factionId ? { focus, factionId, name: hearth.name, cell: hearth.cell, hearth } : null;
  }
  for (const army of Object.values(state.armies)) {
    if (army.factionId !== factionId) continue;
    const formation = army.formations.find(item => item.id === focus.entityId);
    if (formation) return { focus, factionId, name: `${units.get(formation.unitId)?.name ?? formation.unitId} · ${army.name}`, cell: army.cell, army, formation };
  }
  return null;
}
function decisionBlocker(state: GameState, target: Subject): string | null {
  if (!current(state)) return 'Development is unavailable under this campaign’s historical rules.';
  if (state.victory) return 'This campaign has ended in victory.';
  if (state.battle || state.pendingCapture) return 'Resolve the pending battle or capture first.';
  if (target.hearth?.occupationTurns) return 'Occupation suspends civic development.';
  if (target.hearth && state.sieges[target.hearth.id]) return 'Lift the siege before developing this hearth.';
  if (target.army && state.transports[target.army.id]) return 'Disembark before training this formation.';
  if (target.army && armyHasCharacterMission(state, target.army.id)) return 'Finish or cancel the army’s active field mission before training.';
  if (target.formation && units.get(target.formation.unitId)?.canFound) return 'Hearth caravans found settlements; they do not take military training.';
  return null;
}

/** One prerequisite evaluator serves quotes and validated command application.
 * This graph check does not read enemy state or decide presentation layout. */
export function developmentPrerequisiteBlocker(node: DevelopmentNode, acquired: ReadonlySet<string>): string | null {
  const missingAll = node.requiresAll.filter(required => !acquired.has(required));
  if (missingAll.length) return 'Requires ' + missingAll.map(required => definitions.get(required)?.name ?? required).join(', ') + '.';
  if (node.requiresAny.length && !node.requiresAny.some(required => acquired.has(required))) return 'Requires one of: ' + node.requiresAny.map(required => definitions.get(required)?.name ?? required).join(', ') + '.';
  if (node.exclusiveGroup) {
    const chosen = [...acquired].map(id => definitions.get(id)).find(item => item?.exclusiveGroup === node.exclusiveGroup && item.id !== node.id);
    if (chosen) return `${chosen.name} permanently excludes this specialization.`;
  }
  return null;
}
function quote(state: GameState, target: Subject, node: DevelopmentNode, strategic: string | null): DevelopmentChoice {
  const acquired = new Set(nodesFor(state, target.focus));
  const known = acquired.has(node.id), faction = state.factions.find(item => item.id === target.factionId)!;
  const policies = state.progression[target.factionId];
  let blocker = strategic ?? (known ? 'Already acquired.' : developmentPrerequisiteBlocker(node, acquired));
  if (!blocker && node.requiredInstitution && policies?.institutionId !== node.requiredInstitution) blocker = `Requires ${names.get(node.requiredInstitution)}.`;
  if (!blocker && node.requiredDoctrine && policies?.doctrineId !== node.requiredDoctrine) blocker = `Requires ${names.get(node.requiredDoctrine)}.`;
  if (!blocker && node.requiredTechnologies.some(id => !policies?.technologies.includes(id))) blocker = 'Research ' + node.requiredTechnologies.filter(id => !policies?.technologies.includes(id)).map(id => names.get(id)).join(', ') + '.';
  if (!blocker && target.hearth && node.minimumPopulation > target.hearth.population) blocker = `Requires hearth population ${node.minimumPopulation}.`;
  if (!blocker && target.hearth && node.requiredBuildings.some(id => !target.hearth!.buildings.includes(id))) blocker = 'Build ' + node.requiredBuildings.filter(id => !target.hearth!.buildings.includes(id)).map(id => names.get(id)).join(', ') + '.';
  if (!blocker && target.formation && node.minimumRange > (units.get(target.formation.unitId)?.range ?? 0)) blocker = 'This training requires a formation with an existing ranged weapon.';
  if (!blocker && progressFor(state, target.focus) < node.progressCost) blocker = `Requires ${node.progressCost} ${currency(target.focus.scope)}.`;
  if (!blocker && faction.treasury < node.coinCost) blocker = `Requires ${node.coinCost} coin.`;
  if (!blocker && node.resourceCosts) blocker = resourceCostBlocker(state, target.factionId, node.resourceCosts);
  return { ...node, requiresAll: [...node.requiresAll], requiresAny: [...node.requiresAny], requiredBuildings: [...node.requiredBuildings], requiredTechnologies: [...node.requiredTechnologies],
    ...(node.resourceCosts ? { resourceCosts: { ...node.resourceCosts } } : {}), effects: { ...node.effects }, acquired: known, available: blocker === null, blocker,
    active: known && (!target.hearth || node.requiredBuildings.every(id => target.hearth!.buildings.includes(id))) };
}
function effectsFor(state: GameState, focus: DevelopmentFocus, presentBuildings?: readonly string[]): DevelopmentEffects {
  const effects = { ...EMPTY_DEVELOPMENT_EFFECTS };
  for (const id of nodesFor(state, focus)) {
    const node = definitions.get(id);
    if (!node || presentBuildings && node.requiredBuildings.some(id => !presentBuildings.includes(id))) continue;
    for (const key of Object.keys(effects) as (keyof DevelopmentEffects)[]) effects[key] += node.effects[key];
  }
  return effects;
}
const upkeepFor = (state: GameState, focus: DevelopmentFocus): number => nodesFor(state, focus).reduce((sum, id) => sum + (definitions.get(id)?.upkeep ?? 0), 0);
function observeSubject(state: GameState, target: Subject): DevelopmentEntityView {
  const blocker = decisionBlocker(state, target);
  return { ...target.focus, name: target.name, cell: target.cell, ...(target.army ? { armyId: target.army.id } : {}),
    progress: progressFor(state, target.focus), currency: currency(target.focus.scope), treasury: state.factions.find(item => item.id === target.factionId)!.treasury,
    upkeep: upkeepFor(state, target.focus), effects: effectsFor(state, target.focus, target.hearth?.buildings),
    choices: DEVELOPMENT_NODES.filter(node => node.scope === target.focus.scope).map(node => quote(state, target, node, blocker)) };
}
export function getDevelopmentEntity(state: GameState, factionId: string, focus: DevelopmentFocus): DevelopmentEntityView | null {
  if (!current(state)) return null;
  const target = subject(state, factionId, focus);
  return target ? observeSubject(state, target) : null;
}
function rotating<T>(items: readonly T[], turn: number, maximum = 2): T[] {
  return Array.from({ length: Math.min(maximum, items.length) }, (_, offset) => items[(turn * maximum + offset) % items.length]!);
}
export function getDevelopmentObservation(state: GameState, factionId: string, focus?: DevelopmentFocus, includeCandidates = true): DevelopmentObservation | undefined {
  if (!current(state)) return;
  const realm = subject(state, factionId, { scope: 'faction', entityId: factionId });
  if (!realm) return;
  const candidates: DevelopmentEntityView[] = [];
  // The human UI queries one selected company/hearth. Only planning clients
  // need rotating candidates; avoid building and transferring unused trees.
  if (includeCandidates) {
    const hearths = Object.values(state.settlements).filter(town => town.factionId === factionId).sort(byId);
    for (const hearth of rotating(hearths, state.turn)) candidates.push(observeSubject(state, { focus: { scope: 'hearth', entityId: hearth.id }, factionId, name: hearth.name, cell: hearth.cell, hearth }));
    const armies = Object.values(state.armies).filter(army => army.factionId === factionId && !state.transports[army.id]).sort(byId);
    for (const army of rotating(armies, state.turn)) {
      const formations = army.formations.filter(formation => !units.get(formation.unitId)?.canFound);
      const formation = formations[Math.floor(state.turn / Math.max(1, Math.ceil(armies.length / 2))) % formations.length];
      if (!formation) continue;
      candidates.push(observeSubject(state, { focus: { scope: 'formation', entityId: formation.id }, factionId, name: `${units.get(formation.unitId)?.name ?? formation.unitId} · ${army.name}`, cell: army.cell, army, formation }));
    }
  }
  return { faction: observeSubject(state, realm), focus: focus ? getDevelopmentEntity(state, factionId, focus) : null, candidates };
}

export function chooseDevelopment(state: GameState, command: DevelopmentCommand): CommandResult {
  const target = subject(state, command.factionId, command), node = definitions.get(command.nodeId);
  if (!target) return fail('You do not control that development subject.');
  if (!node || node.scope !== command.scope) return fail('Unknown development choice for this subject.');
  const choice = quote(state, target, node, decisionBlocker(state, target));
  if (choice.blocker) return fail(choice.blocker);
  // All payments follow validation. Rejected, duplicate or foreign requests
  // leave coins, material stocks and earned progress exactly unchanged.
  if (node.resourceCosts) spendResourceCosts(state, command.factionId, node.resourceCosts);
  state.factions.find(item => item.id === command.factionId)!.treasury -= node.coinCost;
  if (command.scope === 'formation') {
    const record = state.development.formations[command.entityId] ??= { experience: 0, nodeIds: [] };
    record.experience -= node.progressCost; record.nodeIds.push(node.id); record.nodeIds.sort();
  } else if (command.scope === 'hearth') {
    const record = state.development.hearths[command.entityId] ??= { civicPoints: 0, nodeIds: [] };
    record.civicPoints -= node.progressCost; record.nodeIds.push(node.id); record.nodeIds.sort();
  } else {
    const record = state.development.factions[command.entityId] ??= { influence: 0, nodeIds: [] };
    record.influence -= node.progressCost; record.nodeIds.push(node.id); record.nodeIds.sort();
  }
  return { ok: true, events: [{ turn: state.turn, factionId: command.factionId, type: 'development_acquired', ...(target.cell === null ? {} : { cell: target.cell }),
    message: `${target.name} acquired ${node.name} for ${node.coinCost} coin and ${node.progressCost} ${currency(command.scope)}${node.resourceCosts ? ', committing the required materials' : ''}. Recurring upkeep rises by ${node.upkeep} coin.` }] };
}

/** Called once per completed round alongside economic progression. Sparse town
 * iteration earns local civic work; functioning markets/archives earn influence. */
export function advanceDevelopment(state: GameState): void {
  if (!current(state) || state.victory) return;
  const influence = new Map<string, number>();
  for (const hearth of Object.values(state.settlements)) {
    if (hearth.occupationTurns || state.sieges[hearth.id] || hearth.population < 2 || !hearth.buildings.length) continue;
    const record = state.development.hearths[hearth.id] ??= { civicPoints: 0, nodeIds: [] };
    record.civicPoints = Math.min(1_000_000, record.civicPoints + 1);
    if (hearth.population >= 3 && hearth.buildings.some(id => id === 'building.market' || id === 'building.archive')) influence.set(hearth.factionId, Math.min(6, (influence.get(hearth.factionId) ?? 0) + 1));
  }
  for (const [factionId, earned] of influence) {
    const record = state.development.factions[factionId] ??= { influence: 0, nodeIds: [] };
    record.influence = Math.min(1_000_000, record.influence + earned);
  }
}
/** Call only after actual tactical casualties, retreat and transport losses are
 * reconciled. Militia, passengers and destroyed formations earn no training XP. */
export function awardFormationBattleExperience(state: GameState, battle: CampaignBattle, events: DomainEvent[]): void {
  if (!current(state) || !battle.combat.result) return;
  const earnedByArmy = new Map<string, number>();
  for (const binding of battle.formationBindings) {
    if (!binding.armyId) continue;
    const army = state.armies[binding.armyId], formation = army?.formations.find(item => item.id === binding.formationId);
    if (!army || !formation || !formation.strength || units.get(formation.unitId)?.canFound) continue;
    const ownSide = binding.armyId === battle.attackerId ? 'attacker' : 'defender';
    const earned = battle.combat.result.winner === ownSide ? 3 : 1;
    const record = state.development.formations[formation.id] ??= { experience: 0, nodeIds: [] };
    record.experience = Math.min(1_000_000, record.experience + earned);
    earnedByArmy.set(army.id, (earnedByArmy.get(army.id) ?? 0) + earned);
  }
  for (const [armyId, experience] of earnedByArmy) {
    const army = state.armies[armyId]!;
    events.push({ turn: state.turn, factionId: army.factionId, type: 'formation_experience', cell: army.cell,
      message: `${army.name} earned ${experience} battle experience across its surviving fighting formations.` });
  }
}

/** Call after formation destruction, razing or founding consumption, or once
 * at round completion; never once per node/army in a hot iteration. */
export function pruneDevelopment(state: GameState): void {
  if (!current(state)) return;
  const formations = new Set(Object.values(state.armies).flatMap(army => army.formations.map(formation => formation.id)));
  const factions = new Set(state.factions.map(faction => faction.id));
  for (const id of Object.keys(state.development.formations)) if (!formations.has(id)) delete state.development.formations[id];
  for (const id of Object.keys(state.development.hearths)) if (!state.settlements[id]) delete state.development.hearths[id];
  for (const id of Object.keys(state.development.factions)) if (!factions.has(id)) delete state.development.factions[id];
}
export const hearthDevelopmentEffects = (state: GameState, settlement: Settlement): DevelopmentEffects => effectsFor(state, { scope: 'hearth', entityId: settlement.id }, settlement.buildings);
export const factionDevelopmentEffects = (state: GameState, factionId: string): DevelopmentEffects => effectsFor(state, { scope: 'faction', entityId: factionId });
export function formationBattleEffects(state: GameState, factionId: string, formationId: string): DevelopmentEffects {
  const effects = effectsFor(state, { scope: 'formation', entityId: formationId }), faction = factionDevelopmentEffects(state, factionId);
  for (const key of ['attack', 'armor', 'initiative', 'range', 'morale'] as const) effects[key] += faction[key];
  return effects;
}
export const formationDevelopmentUpkeep = (state: GameState, formationId: string): number => upkeepFor(state, { scope: 'formation', entityId: formationId });
export const hearthDevelopmentUpkeep = (state: GameState, settlementId: string): number => upkeepFor(state, { scope: 'hearth', entityId: settlementId });
export const factionDevelopmentUpkeep = (state: GameState, factionId: string): number => upkeepFor(state, { scope: 'faction', entityId: factionId });

export function validateDevelopment(state: GameState): void {
  developmentStateSchema.parse(state.development);
  const assert = (value: unknown, message: string) => { if (!value) throw new Error('Invalid save: ' + message); };
  if (!current(state)) { assert(Object.values(state.development).every(records => !Object.keys(records).length), 'historical campaign contains future development'); return; }
  const formations = new Map(Object.values(state.armies).flatMap(army => army.formations.map(formation => [formation.id, formation] as const)));
  const factions = new Set(state.factions.map(faction => faction.id));
  for (const scope of ['formation', 'hearth', 'faction'] as const) {
    const records: Record<string, { nodeIds: string[] }> = scope === 'formation' ? state.development.formations : scope === 'hearth' ? state.development.hearths : state.development.factions;
    for (const [entityId, record] of Object.entries(records)) {
      assert(scope === 'formation' ? formations.has(entityId) : scope === 'hearth' ? Boolean(state.settlements[entityId]) : factions.has(entityId), 'development references a missing subject');
      assert(record.nodeIds.every((id, index) => !index || record.nodeIds[index - 1]! < id), 'development nodes must be unique and canonically ordered');
      const acquired = new Set(record.nodeIds);
      for (const id of record.nodeIds) {
        const node = definitions.get(id);
        assert(node?.scope === scope && !developmentPrerequisiteBlocker(node, acquired), 'development has invalid prerequisites, scope or exclusivity');
        if (!node) continue;
        if (scope === 'formation') { const unit = units.get(formations.get(entityId)!.unitId); assert(unit && !unit.canFound && unit.range >= node.minimumRange, 'formation cannot have this training'); }
        if (scope === 'faction') { const policies = state.progression[entityId]; assert((!node.requiredInstitution || policies?.institutionId === node.requiredInstitution) && (!node.requiredDoctrine || policies?.doctrineId === node.requiredDoctrine), 'development lacks its permanent institutional choice'); }
      }
    }
  }
}

/** Observation-only, one paid proposal per planning pass. Choosing one avoids
 * independently valid quotes overspending shared material stocks. Recurring
 * budget comes from the canonical forecast minus already planned obligations;
 * do not spend speculative income before a new civic effect is observed. */
export function planDevelopment(view: Pick<Observation, 'development' | 'treasury' | 'factionId'>, reserve = 0, availableUpkeep = Infinity): { commands: DevelopmentCommand[]; coinSpent: number } {
  if (!view.development) return { commands: [], coinSpent: 0 };
  const options = [view.development.faction, ...view.development.candidates].flatMap(entity => entity.choices
    .filter(choice => choice.available && choice.coinCost <= Math.max(0, view.treasury - reserve) && choice.upkeep <= Math.max(0, availableUpkeep))
    .map(choice => ({ entity, choice, score: (entity.scope === 'formation' ? 12 : 0) + choice.effects.food + choice.effects.industry * 2 + choice.effects.coin * 2 + choice.effects.knowledge + choice.effects.attack + choice.effects.armor * 2 - choice.upkeep * 2 })));
  options.sort((a, b) => b.score - a.score || a.choice.coinCost - b.choice.coinCost || byId(a.choice, b.choice) || (a.entity.entityId < b.entity.entityId ? -1 : 1));
  const chosen = options[0];
  return chosen ? { commands: [{ type: 'develop', factionId: view.factionId, scope: chosen.entity.scope, entityId: chosen.entity.entityId, nodeId: chosen.choice.id }], coinSpent: chosen.choice.coinCost } : { commands: [], coinSpent: 0 };
}
