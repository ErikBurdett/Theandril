import { pageUrl } from './site';
import type { RoadmapItem, RoadmapStatus } from './types';

export const roadmapStatusLabels: Record<RoadmapStatus, string> = {
  completed: 'Completed', 'in-progress': 'In progress', pending: 'Pending',
};
export const roadmapStatusSymbols: Record<RoadmapStatus, string> = {
  completed: '✓', 'in-progress': '◐', pending: '○',
};
export type RoadmapFilter = 'all' | RoadmapStatus;
export const roadmapFilters: RoadmapFilter[] = ['all', 'completed', 'in-progress', 'pending'];

export function readRoadmapFilters(search: string): { query: string; status: RoadmapFilter } {
  const params = new URLSearchParams(search);
  const status = params.get('status');
  // A shared item always opens the full record, even if a caller appended filters.
  if (params.has('item')) return { query: '', status: 'all' };
  return { query: params.get('q') ?? '', status: roadmapFilters.includes(status as RoadmapFilter) ? status as RoadmapFilter : 'all' };
}

export function roadmapUrl(base: string, query = '', status: RoadmapFilter = 'all'): string {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (status !== 'all') params.set('status', status);
  return `${pageUrl(base, 'roadmap')}${params.size ? `?${params}` : ''}`;
}

export function roadmapItemUrl(base: string, id: string): string {
  return `${pageUrl(base, 'roadmap')}?${new URLSearchParams({ item: id })}#roadmap-${encodeURIComponent(id)}`;
}

export function filterRoadmap(items: readonly RoadmapItem[], query: string, status: RoadmapFilter): RoadmapItem[] {
  const gatePattern = /\bgate\s+(f2|[a-n])\b/gi;
  const gates = [...query.matchAll(gatePattern)].map(match => match[1]!.toUpperCase());
  const words = query.replace(gatePattern, ' ').trim().toLocaleLowerCase('en').split(/\s+/).filter(Boolean);
  return items.filter(item => {
    if (status !== 'all' && item.status !== status) return false;
    if (!gates.every(gate => item.gates.some(id => id === gate))) return false;
    const text = [item.title, item.summary, roadmapStatusLabels[item.status], ...item.delivered, ...item.remaining, ...item.gates.map(gate => `Gate ${gate}`)]
      .join(' ').toLocaleLowerCase('en');
    return words.every(word => text.includes(word));
  });
}

export function roadmapCounts(items: readonly RoadmapItem[]): Record<RoadmapStatus, number> {
  return items.reduce((counts, item) => { counts[item.status] += 1; return counts; }, { completed: 0, 'in-progress': 0, pending: 0 });
}
