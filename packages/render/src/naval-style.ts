import type { ArmyView } from '@theandril/sim';

/** Presentation only; depth and transport ownership come from the filtered observation. */
export function waterPresentation(terrain: number, waterDepth: number): 'land' | 'shallows' | 'deep' {
  return terrain !== 0 ? 'land' : waterDepth === 2 ? 'deep' : 'shallows';
}

export function mapArmyVisible(army: Pick<ArmyView, 'carrierId'>): boolean { return !army.carrierId; }

export function navalMarker(role: string): 'transport' | 'coastal-warship' | 'ocean-warship' {
  return role === 'unit.transport' ? 'transport' : role === 'unit.ocean_warship' ? 'ocean-warship' : 'coastal-warship';
}
