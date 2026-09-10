import { describe, expect, it } from 'vitest';
import { FACTIONS } from '@theandril/content';
import library from './lore/library.json';
import { factionLoreUrl } from './cross-links';

describe('cross-page links', () => {
  it('maps every registered culture to the heading that actually introduces it in the faction bible', () => {
    const anchors = (library as { factionAnchors?: Record<string, string> }).factionAnchors;
    expect(anchors).toBeDefined();
    const bible = library.books.find(book => book.id === 'faction-bible')!.documents[0]!;
    const headingIds = new Set(bible.blocks.filter(block => block.type === 'heading').map(block => (block as { id: string }).id));
    for (const faction of FACTIONS) {
      expect(anchors![faction.id], faction.id).toBeDefined();
      expect(headingIds.has(anchors![faction.id]!), `${faction.id} → ${anchors![faction.id]}`).toBe(true);
    }
    expect(anchors!['faction.vesper_court']).toBe('22-vesper-court-registered');
  });
  it('builds a refresh-safe lore URL that opens the bible chapter at the culture heading', () => {
    expect(factionLoreUrl('/Theandril/', 'faction.vesper_court')).toBe('/Theandril/updates/lore/?book=faction-bible&chapter=faction-bible#22-vesper-court-registered');
    expect(factionLoreUrl('/', 'faction.ashen_compact')).toBe('/updates/lore/?book=faction-bible&chapter=faction-bible#1-ashen-compact');
  });
});
