/** Public siege establishment quote shares canonical command legality. */
import { neighbors } from '@theandril/mapgen';
import type { Observation } from './types';

export interface SiegeArmyFacts {
  factionId: string;
  cell: number;
  movement: number;
  domain: 'land' | 'naval';
  carried: boolean;
  canAttack: boolean;
}
export interface SiegeTownFacts { factionId: string; cell: number }
export interface SiegeEstablishmentFacts {
  factionId: string;
  army: SiegeArmyFacts | undefined;
  town: SiegeTownFacts | undefined;
  townVisible: boolean;
  atWar: boolean;
  width: number;
  height: number;
  townBesieged: boolean;
  armyBesieging: boolean;
}

/** Exact existing besiegeSettlement rejection order. Global command guards
 * remain at the command boundary and in the observation adapter below. */
export function siegeEstablishmentBlocker(facts: SiegeEstablishmentFacts): string | null {
  const { army, town, factionId } = facts;
  if (!army || army.factionId !== factionId) return 'You do not control that army.';
  if (army.carried || army.domain !== 'land') return 'Disembark a land army before besieging a settlement.';
  if (!town || !facts.townVisible) return 'Choose a currently visible enemy settlement.';
  if (!facts.atWar) return 'Declare war before besieging this settlement.';
  if (!army.canAttack) return 'Hearth caravans cannot besiege settlements.';
  if (!neighbors(army.cell, facts.width, facts.height).includes(town.cell)) return 'Move adjacent to the settlement before besieging it.';
  if (army.movement < 1) return 'The army needs movement to establish a siege.';
  if (facts.townBesieged) return 'This settlement is already under siege.';
  if (facts.armyBesieging) return 'An army can maintain only one siege.';
  return null;
}
export interface BesiegePreview { armyId: string; settlementId: string; canBesiege: boolean; blocker: string | null }

interface KnownSiegeFacts {
  armies: Map<string, SiegeArmyFacts>;
  towns: Map<string, SiegeTownFacts>;
  wars: Set<string>;
  townSieges: Set<string>;
  armySieges: Set<string>;
  visible?: Set<number>;
}
const observed = new WeakMap<Observation, KnownSiegeFacts>();
function knownFacts(view: Observation): KnownSiegeFacts {
  const cached = observed.get(view);
  if (cached) return cached;
  // Detached primitive facts: cached queries never mutate the view or depend
  // on hidden state, and four bounded quotes share one observed-cell pass.
  const facts: KnownSiegeFacts = {
    armies: new Map(view.armies.map(army => [army.id, { factionId: army.factionId, cell: army.cell, movement: army.movement,
      domain: army.domain, carried: Boolean(army.carrierId), canAttack: army.canAttack }])),
    towns: new Map(view.settlements.map(town => [town.id, { factionId: town.factionId, cell: town.cell }])),
    wars: new Set(view.wars),
    townSieges: new Set([...view.visibleSiegeSettlementIds, ...view.sieges.map(siege => siege.settlementId)]),
    armySieges: new Set(view.sieges.filter(siege => siege.factionId === view.factionId).map(siege => siege.armyId)),
  };
  observed.set(view, facts); return facts;
}

export function getBesiegePreview(view: Observation, armyId: string, settlementId: string): BesiegePreview {
  // Generic strategic blocking reveals no hidden participant or location.
  // The fallback covers observations predating the explicit capability.
  let blocker = view.strategicCommandBlocker ?? (view.victory ? 'This campaign has ended in victory.'
    : view.pendingCapture ? 'Resolve the settlement capture before issuing strategic commands.'
      : view.battle ? 'Resolve the pending battle before issuing strategic commands.' : null);
  if (!blocker) {
    const known = knownFacts(view), town = known.towns.get(settlementId);
    blocker = siegeEstablishmentBlocker({ factionId: view.factionId, army: known.armies.get(armyId), town,
      get townVisible() {
        known.visible ??= new Set(view.cells.filter(cell => cell.visible).map(cell => cell.cell));
        return Boolean(town && known.visible.has(town.cell));
      }, atWar: Boolean(town && known.wars.has(town.factionId)),
      width: view.width, height: view.height, townBesieged: known.townSieges.has(settlementId), armyBesieging: known.armySieges.has(armyId) });
  }
  return { armyId, settlementId, canBesiege: blocker === null, blocker };
}
