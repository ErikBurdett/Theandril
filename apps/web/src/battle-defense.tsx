import type { ArmyView } from '@theandril/sim';

/** A canonical quote, not a client-side selection or combat-cap calculation. */
export function BattleDefensePreview({ defense }: { defense: ArmyView['battleDefense'] }) {
  if (!defense) return null;
  return <div className="field-help" data-testid="battle-defense-preview">
    <p>Committed defense: {defense.engagedFormations} formation{defense.engagedFormations === 1 ? '' : 's'} · {defense.engagedStrength} strength</p>
    <p>Reserves: {defense.reserveFormations} formation{defense.reserveFormations === 1 ? '' : 's'} · {defense.reserveStrength} strength</p>
    <p>Whole armies fight together. Reserves defend in later engagements and must be defeated before advancing or capturing this location.</p>
  </div>;
}
