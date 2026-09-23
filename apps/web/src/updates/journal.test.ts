import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Journal } from './Journal';
import { dispatches } from './content';
import { filterDispatches } from './journal';
import { libraryRevision } from './library';

describe('journal discovery', () => {
  it('renders the featured story checkpoint from its own revision as stories change', () => {
    const original = dispatches[0]!;
    vi.stubGlobal('window', { location: { search: '' } });
    try {
      for (const sourceRevision of ['1234567' + 'a'.repeat(33), 'abcdef0' + 'b'.repeat(33)]) {
        dispatches[0] = { ...original, sourceRevision };
        const markup = renderToStaticMarkup(createElement(Journal));
        const footnote = markup.match(/<p class="feature-footnote">(.*?)<\/p>/)?.[1];
        expect(footnote).toBe(`Source checkpoint ${sourceRevision.slice(0, 7)} · Not a 1.0 release.`);
        expect(markup).toContain(`href="https://github.com/ErikBurdett/Theandril/blob/${libraryRevision}/docs/IMPLEMENTATION_STATUS.md"`);
        expect(markup).toContain(`href="https://github.com/ErikBurdett/Theandril/blob/${libraryRevision}/docs/development/2026-09-23-fleet-provisions/README.md"`);
      }
    } finally {
      dispatches[0] = original;
      vi.unstubAllGlobals();
    }
  });
  it('finds Keeping the whole record by text that appears only in its takeaways', () => {
    expect(filterDispatches(dispatches, 'complete-or-error', 'All').map(story => story.title)).toEqual(['Keeping the whole record']);
  });
  it('combines normalized full-text search with a topic without changing editorial order', () => {
    expect(filterDispatches(dispatches, '  VESPER  ', 'World & culture').map(story => story.id)).toEqual(['twenty-four-cultures']);
    expect(filterDispatches(dispatches, 'Vesper', 'Engineering')).toEqual([]);
    expect(filterDispatches(dispatches, '', 'All')).toEqual(dispatches);
    expect(filterDispatches(dispatches, 'no-such-dispatch', 'All')).toEqual([]);
    expect(filterDispatches(dispatches, 'CAPTURE garrison', 'Engineering').map(story => story.id)).toEqual(['r17-campaign-safety']);
  });
});
