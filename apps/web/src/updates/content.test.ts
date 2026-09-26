import { describe, expect, it } from 'vitest';
import { dispatches } from './content';

describe('public dispatch contract', () => {
  it('accepts only explicitly published, revision-pinned entries in newest-work-first order', () => {
    expect(dispatches.every(story => 'publication' in story && story.publication === 'published')).toBe(true);
    expect(dispatches.map(story => story.id)).toEqual(['charter-templates', 'group-charters', 'group-postings', 'fleet-provisions', 'campaign-foundation-and-development-order', 'r17-campaign-safety', 'keeping-the-record', 'twenty-four-cultures']);
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
    const story = dispatches.find(entry => entry.id === 'group-postings')!;
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
  it('publishes charter delegation with an honest error-state illustration and bounded proof', () => {
    const story = dispatches.find(entry => entry.id === 'group-charters')!;
    expect(story).toMatchObject({ id: 'group-charters', sequence: 7, sourceRevision: 'f78ed07d04ffbc3310d05e0124aa6d8f9d5a09e9', topic: 'Engineering', image: 'group-charters-narrow' });
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    expect(text).toContain('1,889 headless tests across 235 files with four local test workers');
    expect(text).toContain('12 affected Chromium journeys and the one new built-production charter journey');
    expect(text).toContain('empty, unsubmitted grant ceiling');
    expect(text).toContain('Revoke charters remains available');
    expect(text).toContain('193,929 bytes, including 1,981 result bytes, versus 7,409,845 bytes');
    expect(text).toContain('Rules/save remain 31 and content remains 015468d1');
    expect(text).toContain('saved reusable templates');
    expect(text).toContain('M3 remains in progress');
    expect(text).toContain('All fifteen release gates remain open');
    expect(story.evidence.some(link => link.path === 'tests/production/group-charters.spec.ts')).toBe(true);
  });
  it('publishes personal charter templates without implying automatic orders or campaign portability', () => {
    const story = dispatches[0]!;
    expect(story).toMatchObject({ id: 'charter-templates', sequence: 8, sourceRevision: '3ed4a6c456c3e4130fddf35b44dfdf51034cc269', image: 'charter-templates-controls' });
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    expect(text).toContain('up to twenty-four policies');
    expect(text).toContain('Recall template fills the form, and Apply charters remains a separate decision');
    expect(text).toContain('not included in campaign exports');
    expect(text).toContain('last committed write');
    expect(text).toContain('Retry now opens a fresh connection');
    expect(text).toContain('1,902 headless tests across 237 files in 55.46 seconds');
    expect(text).toContain('Sixteen affected Chromium gameplay journeys pass in 1.8 minutes');
    expect(text).toContain('one separate built-production template journey passes in 8.2 seconds');
    expect(text).toContain('reported separately, not added together');
    expect(text).toContain('Rules/save remain 31 and content remains 015468d1');
    expect(text).toContain('M3 remains in progress');
    expect(text).toContain('All fifteen release gates remain open');
    expect(story.evidence.some(link => link.label === 'Charter templates verification' && link.path === 'docs/development/2026-09-25-charter-templates/README.md')).toBe(true);
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
