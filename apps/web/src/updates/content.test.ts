import { describe, expect, it } from 'vitest';
import { dispatches } from './content';

describe('public dispatch contract', () => {
  it('accepts only explicitly published, revision-pinned entries in newest-work-first order', () => {
    expect(dispatches.every(story => 'publication' in story && story.publication === 'published')).toBe(true);
    expect(dispatches.map(story => story.id)).toEqual(['group-postings', 'fleet-provisions', 'campaign-foundation-and-development-order', 'r17-campaign-safety', 'keeping-the-record', 'twenty-four-cultures']);
    expect(dispatches.every(story => 'sourceRevision' in story && /^[0-9a-f]{40}$/.test(String(story.sourceRevision)))).toBe(true);
  });
  it('publishes the reviewed campaign foundation with its unresolved acceptance and historical pins intact', () => {
    const story = dispatches.find(entry => entry.id === 'campaign-foundation-and-development-order')!;
    expect(story.sourceRevision).toBe('1e41ec24965e46e8035c57b4f54632a690b8b712');
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    expect(text).toContain('1,857 of 1,858');
    expect(text).toContain('64.779 seconds against its 60-second limit');
    expect(text).toContain('Client contracts, tribute and unification are not implemented');
    expect(text).toContain('all fifteen whole release gates remain open');
    expect(dispatches.filter(entry => entry.sequence <= 3).every(entry => entry.sourceRevision === '8b3b8c148b7e8ee3689001210033fee7a1b8a6ef')).toBe(true);
  });
  it('publishes fleet provisions with exact current evidence and the remaining pace and release limits', () => {
    const story = dispatches.find(entry => entry.id === 'fleet-provisions')!;
    expect(story).toMatchObject({ id: 'fleet-provisions', sequence: 5, sourceRevision: 'b623c2c91d4d852cba710f2d996c28a6b1b5d624', checkpoint: 'Fleet provisions · rules 31' });
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    expect(text).toContain('1,861 headless tests across 232 files');
    expect(text).toContain('Standard ends at turn 234, Long at 342 and Epic at 379');
    expect(text).toContain('Standard and Long remain above');
    expect(text).toContain('all fifteen release gates remain open');
    expect(text).toContain('authored browser regression');
    expect(text).toContain('One fleet and one passenger army each suffered one attrition turn');
    expect(story.evidence.some(link => link.path.endsWith('/persistence-review.md'))).toBe(true);
  });
  it('publishes bounded group postings without changing rules or closing M3', () => {
    const story = dispatches[0]!;
    expect(story).toMatchObject({ id: 'group-postings', sequence: 6, sourceRevision: '3ae1581089411a76ecfd08a8f5f811258c4f77f6', topic: 'Engineering' });
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    expect(text).toContain('1,876 headless tests across 234 files and seven affected Chromium journeys');
    expect(text).toContain('before this sixth article was added');
    expect(text).toContain('531,302 bytes');
    expect(text).toContain('not browser frame-time distributions');
    expect(text).toContain('Rules/save remain 31 and content remains 015468d1');
    expect(text).toContain('M3 remains in progress');
    expect(text).toContain('all fifteen release gates remain open');
    expect([story.image, ...story.sections.map(section => section.image)]).toEqual(expect.arrayContaining(['group-postings-desktop', 'group-postings-narrow']));
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
