import { describe, expect, it } from 'vitest';
import { dispatches } from './content';

describe('public dispatch contract', () => {
  it('accepts only explicitly published, revision-pinned entries in newest-work-first order', () => {
    expect(dispatches.every(story => 'publication' in story && story.publication === 'published')).toBe(true);
    expect(dispatches.map(story => story.id)).toEqual(['r17-campaign-safety', 'keeping-the-record', 'twenty-four-cultures']);
    expect(dispatches.every(story => 'sourceRevision' in story && /^[0-9a-f]{40}$/.test(String(story.sourceRevision)))).toBe(true);
  });
  it('publishes the campaign-safety checkpoint without claiming a release', () => {
    const story = dispatches.find(item => item.id === 'r17-campaign-safety');
    expect(story).toMatchObject({ title: 'A campaign worth keeping', status: 'Reviewed checkpoint' });
    const text = story?.sections.map(section => section.paragraphs.join(' ')).join(' ');
    expect(text).toContain('125,150');
    expect(text).toContain('not a 1.0 signoff');
  });

  it('gives the playable cultural baseline its own sourced story, not a fictional release', () => {
    const story = dispatches.find(item => item.id === 'twenty-four-cultures');
    expect(story).toMatchObject({ topic: 'World & culture', status: 'Playable baseline' });
    expect(story?.sections.map(section => section.paragraphs.join(' ')).join(' ')).toContain('not twenty-four separate rules engines');
    expect(story?.evidence.some(link => link.path === 'docs/lore/FACTION_BIBLE.md')).toBe(true);
  });
  it('discloses the cost and historical boundary of archive evidence', () => {
    const story = dispatches.find(item => item.id === 'keeping-the-record');
    expect(story?.status).toBe('Bounded verification');
    const text = story?.sections.map(section => section.paragraphs.join(' ')).join(' ');
    expect(text).toContain('114,244');
    expect(text).toContain('not rerun');
    expect(text).toContain('O(prefix bytes)');
    expect(text).toContain('all stored');
  });
});
