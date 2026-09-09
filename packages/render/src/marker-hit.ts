export interface MarkerHitTarget {
  cell: number; entityId: string; x: number; y: number; width: number; height: number;
}

/** World-space bounds follow the rendered badge as the camera pans. Entries
 * share painter order; the last visible badge owns an overlapping pointer. */
export function hitStrategicMarker(targets: readonly MarkerHitTarget[], x: number, y: number): MarkerHitTarget | undefined {
  for (let index = targets.length - 1; index >= 0; index--) {
    const target = targets[index]!;
    if (x >= target.x && y >= target.y && x <= target.x + target.width && y <= target.y + target.height) return target;
  }
  return undefined;
}
