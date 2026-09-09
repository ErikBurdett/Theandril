/** Disclosed audit policies, not changes to production AI or alternate rules. */
import { planTurnWithReasons, type AiPlan } from '@theandril/ai';
import { BUILDINGS, UNITS } from '@theandril/content';
import { hexDistance } from '@theandril/mapgen';
import { foundingCoinCost, type GameCommand, type Observation } from '@theandril/sim';
import { planConquestDecision } from '../../../packages/ai/src/conquest';

/** One bounded plan per seat per round, same as D. Priority purchases replace the
 * stock spending batch, retaining only its no-coin orders and funded founders.
 * Every policy sees a detached faction observation; no game/world object enters.
 * B deliberately ignores offers/relations when asking stock operational planning,
 * retains treaties, and explicitly rejects incoming peace. C avoids new wars.
 */
export function planStrategy(view: Observation, strategy: 'B' | 'C'): AiPlan {
  if (view.victory || view.battle || view.pendingCapture) return planTurnWithReasons(view);
  const siege = planConquestDecision(view); if (siege) return siege;
  const factionId = view.factionId, own = view.armies.filter(a => a.factionId === factionId), towns = view.settlements.filter(t => t.factionId === factionId);
  const operationalView = strategy === 'B' ? { ...view, diplomacy: { ...view.diplomacy, offers: [], relations: [] } } : view;
  const base = planTurnWithReasons(operationalView);
  if (base.commands.some(c => c.type === 'startVictoryProject')) return { ...base, reasons: [`${strategy}: fund a legally eligible victory project; do not suppress victory.`, ...base.reasons] };
  const removeNewWar = (c: GameCommand): boolean => c.type !== 'declareWar'
    && (c.type !== 'attack' || view.wars.includes(view.armies.find(a => a.id === c.targetArmyId)?.factionId ?? ''))
    && (c.type !== 'besiege' || view.wars.includes(view.settlements.find(t => t.id === c.settlementId)?.factionId ?? ''));
  const allowed = base.commands.filter(c => strategy === 'B' ? c.type !== 'proposePeace' && c.type !== 'respondPeace' : removeNewWar(c));
  const freeTypes = new Set(['move', 'moveTo', 'mergeArmies', 'splitArmy', 'transferFormations', 'embarkArmy', 'disembarkArmy', 'assignCharacter', 'promoteCharacter', 'cancelCharacterMission', 'declareWar', 'attack', 'besiege', 'liftSiege', 'assault', 'found', 'setWorkers']);
  const free = allowed.filter(c => freeTypes.has(c.type));
  const founders = free.filter(c => c.type === 'found').length;
  const foundingReserve = Array.from({ length: founders }, (_, i) => foundingCoinCost(towns.length + i)).reduce((n, x) => n + x, 0);
  // Keep a real caravan's currently quoted founding cost even while in transit.
  const transitReserve = !founders && own.some(a => a.canFound) ? view.growth?.founding.coinCost ?? 0 : 0;
  const spendable = Math.max(0, view.treasury - foundingReserve - transitReserve - 16);
  const priority = (command: GameCommand, reason: string): AiPlan => ({ commands: [command, ...free.filter(c => !(command.type === 'assignCharacter' && ('armyId' in c && c.armyId === command.armyId || c.type === 'mergeArmies' && (c.targetArmyId === command.armyId || c.sourceArmyId === command.armyId))))].slice(0, 128), reasons: [`${strategy}: ${reason}`, 'Replace stock paid orders; retain only no-coin operational orders plus quoted funded founding.', ...base.reasons] });
  const quote = (settlementId: string, itemId: string) => {
    const item = [...UNITS, ...BUILDINGS].find(item => item.id === itemId);
    const legal = view.productionOptions.find(q => q.settlementId === settlementId && q.itemId === itemId && q.canQueue);
    return item && legal && item.coinCost <= spendable ? { ...legal, coinCost: item.coinCost } : undefined;
  };
  if (strategy === 'B') {
    const incoming = view.diplomacy.offers.find(o => o.recipientId === factionId && o.expiresTurn > view.turn);
    if (incoming) return priority({ type: 'respondPeace', factionId, offerId: incoming.id, accept: false }, 'Reject peace; maintain offensive pressure.');
    const protectedIds = new Set(view.diplomacy.treaties.filter(t => t.expiresTurn > view.turn).flatMap(t => t.parties));
    const strong = own.filter(a => a.canAttack && !a.canFound && !a.carrierId && a.formations.length >= 3);
    const enemy = [...view.settlements, ...view.armies].find(e => e.factionId !== factionId && !view.wars.includes(e.factionId) && !protectedIds.has(e.factionId) && strong.some(a => hexDistance(a.cell, e.cell, view.width) <= 12));
    if (enemy) return { commands: [{ type: 'declareWar', factionId, targetFactionId: enemy.factionId }], reasons: ['B: declare on an actually visible nearby rival once a three-formation force exists; treaties remain binding.'] };
    const doctrine = view.progression.doctrineChoices.find(q => q.id === 'doctrine.shield_cohesion' && q.available && q.coinCost <= spendable);
    if (doctrine && towns.length) return priority({ type: 'adoptDoctrine', factionId, doctrineId: doctrine.id }, 'Buy Shield cohesion before optional civic/character spending.');
    const military = own.flatMap(a => a.formations).filter(f => !UNITS.find(u => u.id === f.unitId)?.canFound).length;
    if (view.turn % 3 !== 0 && military < towns.length * 6 + 2) {
      const roster = ['unit.guard', 'unit.spearman', 'unit.arbalester', 'unit.cavalry', 'unit.skirmisher'];
      const represented = own.flatMap(a => a.formations).map(f => f.unitId);
      const preferred = [...roster].sort((a, b) => represented.filter(id => id === a).length - represented.filter(id => id === b).length || roster.indexOf(a) - roster.indexOf(b));
      for (const town of towns.filter(t => !t.queue.length)) for (const itemId of preferred) {
        const unit = UNITS.find(u => u.id === itemId), q = quote(town.id, itemId);
        if (unit && q && unit.upkeep + 2 <= (view.growth?.economy.net ?? 0) - (view.growth?.economy.queuedUpkeep ?? 0)) return priority({ type: 'queue', factionId, settlementId: town.id, itemId }, `Prioritize paid ${itemId} at ${town.id}: ${q.coinCost} coin, ${unit.upkeep} upkeep; two of three rounds prefer force growth.`);
      }
    }
  } else {
    // Preserve genuine incoming diplomatic decisions; never discard an accepted truce.
    if (base.commands.some(c => c.type === 'respondPeace' || c.type === 'proposePeace')) return { ...base, commands: allowed, reasons: ['C: prefer negotiation to initiating a war.', ...base.reasons] };
    const caster = view.characters.find(c => !c.dead && c.role === 'waykeeper');
    if (caster && caster.location?.kind !== 'army') {
      const target = caster.assignmentOptions.filter(o => o.canAssign).map(o => own.find(a => a.id === o.armyId)).filter(a => a && a.domain === 'land' && a.canAttack && !a.canFound).sort((a, b) => b!.strength - a!.strength)[0];
      if (target) return priority({ type: 'assignCharacter', factionId, characterId: caster.id, armyId: target.id }, 'Attach the personally qualified paid Waykeeper to the strongest legal co-located escort.');
    }
    const magic = view.arcaneResearch.choices.find(q => q.canResearch);
    if (magic) return priority({ type: 'researchArcane', factionId, discoveryId: magic.id }, `Buy separate Arcane Theory ${magic.id} for ${magic.knowledgeCost} knowledge; this does not grant personal aptitude.`);
    if (!caster && towns.some(t => t.buildings.includes('building.archive'))) {
      const q = view.characterRecruitment.find(q => q.role === 'waykeeper' && q.canRecruit && q.coinCost <= spendable && q.upkeep + 2 <= (view.growth?.economy.net ?? 0) - (view.growth?.economy.queuedUpkeep ?? 0));
      if (q) return priority({ type: 'recruitCharacter', factionId, settlementId: q.settlementId, definitionId: q.definitionId }, `Appoint a Waykeeper for ${q.coinCost} coin and ${q.upkeep} upkeep before military expansion.`);
    }
    const researchOrder = ['technology.cinder_masonry', 'technology.stewardship', 'technology.charter_forestry', 'technology.surveyed_estates', 'technology.civic_accounts', 'technology.coastal_navigation', 'technology.ocean_navigation', 'technology.waterworks', 'technology.quarry_cranes', 'technology.deep_soundings'];
    const technology = researchOrder.map(id => view.progression.technologyChoices.find(q => q.id === id && q.available)).find(Boolean);
    if (technology) return priority({ type: 'research', factionId, technologyId: technology.id }, `Knowledge investment: ${technology.id}, ${technology.knowledgeCost} knowledge. Exhaustively purchase remaining practical branches after priority unlocks.`);
    for (const itemId of ['building.archive', 'building.market', 'building.workshop', 'building.granary']) for (const town of towns.filter(t => !t.queue.length)) {
      const q = quote(town.id, itemId); if (q) return priority({ type: 'queue', factionId, settlementId: town.id, itemId }, `Prioritize ${itemId} infrastructure at ${town.id} for ${q.coinCost} coin.`);
    }
  }
  return { commands: allowed, reasons: [`${strategy}: ordinary observed operational/economic fallback; ${strategy === 'B' ? 'no proactive peace' : 'no new offensive war'}.`, ...base.reasons] };
}
