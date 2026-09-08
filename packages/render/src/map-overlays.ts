/** Presentation-only label placement. Inputs are already viewport/fog filtered. */
export interface MapLabelCandidate {
  id: string; cell: number; name: string; x: number; y: number;
  settlement: boolean; ruin?: boolean; own: boolean; hostile: boolean;
  stackArmyCount?: number; domain?: 'land' | 'naval';
}
export interface MapLabel extends MapLabelCandidate {
  text: string; priority: number; width: number; height: number;
}
export const MAX_MAP_LABELS = 32;

/** Code-point truncation avoids splitting surrogate pairs. Full names stay in the DOM inspector. */
export function compactMapName(name: string, limit: number): string {
  const characters = Array.from(name.replace(/\s+/gu, ' ').trim());
  return characters.length <= limit ? characters.join('') : `${characters.slice(0, limit - 1).join('').trimEnd()}…`;
}

export function layoutMapLabels(
  candidates: readonly MapLabelCandidate[],
  context: { width: number; height: number; zoom: number; selected?: number; selectedEntityId?: string; hovered?: number },
  measure: (text: string) => { width: number; height: number },
): MapLabel[] {
  const groups: MapLabelCandidate[][] = [[], [], []];
  for (const candidate of candidates) {
    const selected = context.selectedEntityId ? candidate.id === context.selectedEntityId : candidate.cell === context.selected;
    const priority = selected ? 0 : candidate.cell === context.hovered ? 1 : 2;
    if (priority === 2 && (context.zoom < .65 || !candidate.settlement)) continue;
    groups[priority]!.push(candidate);
  }
  const labels: MapLabel[] = [];
  for (const [priority, group] of groups.entries()) for (const candidate of group) {
    if (labels.length === MAX_MAP_LABELS) return labels;
    const prefix = candidate.ruin ? 'Ruins · ' : `${candidate.own ? '◆' : candidate.hostile ? '⚔' : '◇'} `;
    const stack = (candidate.stackArmyCount ?? 0) > 1 ? ` · ${candidate.stackArmyCount} ${candidate.domain === 'naval' ? 'fleets' : 'armies'}` : '';
    const text = prefix + compactMapName(candidate.name, priority < 2 ? 28 : 22) + stack;
    const measured = measure(text), width = measured.width + 8, height = measured.height + 6;
    if (width > context.width - 12 || height > context.height - 12) continue;
    // Clamp labels inside the canvas, never shrink the text or change the map camera.
    const x = Math.max(width / 2 + 6, Math.min(context.width - width / 2 - 6, candidate.x));
    const y = Math.max(6, Math.min(context.height - height - 6, candidate.y));
    if (labels.some(other => Math.abs(other.x - x) < (other.width + width) / 2 + 6 && y < other.y + other.height + 4 && y + height + 4 > other.y)) continue;
    labels.push({ ...candidate, text, priority, x, y, width, height });
  }
  return labels;
}
