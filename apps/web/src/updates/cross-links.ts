import library from './lore/library.json';
import { localUrl } from './journal';

/** Culture pages link into the faction bible at the heading that introduces that culture. */
export function factionLoreUrl(base: string, factionId: string): string {
  const anchor = (library as { factionAnchors: Record<string, string> }).factionAnchors[factionId];
  const chapter = `${localUrl(base, 'updates/lore/')}?book=faction-bible&chapter=faction-bible`;
  return anchor ? `${chapter}#${anchor}` : chapter;
}
