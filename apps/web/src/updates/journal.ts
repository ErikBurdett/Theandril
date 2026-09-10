import { dispatches, repository, sourceRevision } from './content';
import type { Dispatch } from './types';
import { pageUrl } from './site';

/** All local URLs are relative to Vite's supplied deployment base. */
export function localUrl(base: string, path: string): string {
  return `${base}${path}`;
}

export function dispatchUrl(base: string, id: string): string {
  return `${pageUrl(base, 'dispatches')}?${new URLSearchParams({ dispatch: id })}`;
}

export function resolveDispatch(search: string): Dispatch | undefined {
  const id = new URLSearchParams(search).get('dispatch');
  return dispatches.find(entry => entry.id === id);
}

export function evidenceUrl(path: string, revision = sourceRevision): string {
  return `${repository}/blob/${revision}/${path}`;
}

export function filterDispatches(entries: readonly Dispatch[], query: string, topic: string): Dispatch[] {
  const words = query.trim().toLocaleLowerCase('en').split(/\s+/).filter(Boolean);
  return entries.filter(entry => {
    if (topic !== 'All' && entry.topic !== topic) return false;
    const text = [entry.title, entry.subtitle, entry.summary, entry.checkpoint, entry.topic, ...entry.tags, ...entry.takeaways,
      ...entry.sections.flatMap(section => [section.title, ...section.paragraphs, ...(section.bullets ?? [])])].join(' ').toLocaleLowerCase('en');
    return words.every(word => text.includes(word));
  });
}
