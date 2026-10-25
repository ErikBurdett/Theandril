import { describe, expect, it } from 'vitest';
import { dispatches } from './content';

describe('public dispatch contract', () => {
  it('pins explicit group policy actions, actual saved history and measured limits without closing gates', () => {
    const story = dispatches[0]!;
    expect(story).toMatchObject({ id: 'group-patrols', sequence: 18, sourceRevision: '8d880eb60cdca549d5ff1086ef95e095e81feea5', image: 'group-patrol-actions' });
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    for (const claim of ['Actions include checked armies outside the current filter', 'does not resume a paused travel route', 'Confirmed accepted armies leave the selection', 'exact 352-record final archive', 'c6f43460, acebff08, f89dea4d and a488bb10', 'eight-record manual save', 'transport fault injections', '2,339 tests across 285 files', 'Seven affected production journeys', 'overlap and are not additive', 'same-thread Node host', 'fake IndexedDB', '330.824/382.883/389.917', '668.912/634.563/673.485', 'six single samples, not medians', 'only 61 observed cells', '3,512,941 bytes', 'No new pacing run is claimed', 'DH-021 remains open', 'No new gameplay obligation was added or removed', 'all fifteen release gates remain open']) expect(text, claim).toContain(claim);
    for (const path of ['README.md', 'worker-client-review.md', 'image-review.md', 'browser-evidence.json', 'worker-benchmark-results.json']) expect(story.evidence.some(link => link.path === `docs/development/2026-10-24-group-patrols/${path}`), path).toBe(true);
  });

  it('pins observed registry filters and one explicit resume without claiming automated orders or scale acceptance', () => {
    const story = dispatches.find(entry => entry.id === 'registry-order-filters')!;
    expect(story).toMatchObject({ id: 'registry-order-filters', sequence: 17, sourceRevision: 'da12978fb596a73a7fddcfb8e914efb7924efbc2', image: 'registry-paused-selector' });
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    for (const claim of ['25-row pagination', 'These are overlapping cohorts', 'Defense theaters are not included', 'Closing and reopening returns it to All forces', 'preserves checked army IDs', 'aa8eb3f5', '099f7ee4', 'exact nine-record archive', 'No End turn', '2,318 tests across 282 files', '36 tests across six files', 'overlapping scopes are not additive', 'No new isolated timing is claimed', 'No new pacing run is claimed', '806-by-66', '3,481,838 bytes', 'No new gameplay obligation was added or removed', 'all fifteen release gates remain open']) expect(text, claim).toContain(claim);
    for (const path of ['README.md', 'image-review.md', 'browser-evidence.json']) expect(story.evidence.some(link => link.path === `docs/development/2026-10-24-army-order-filters/${path}`), path).toBe(true);
  });
  it('pins bounded counterplay, genuine battle outcomes and measured limits without closing release gates', () => {
    const story = dispatches.find(entry => entry.id === 'project-counterplay')!;
    expect(story).toMatchObject({ id: 'project-counterplay', sequence: 16, sourceRevision: 'bff98894992762e797daf2aa63b487b4a98c0f28', image: 'technical-ledger' });
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    for (const claim of ['existing own siege', 'currently visible, unoccupied host', 'four establishment queries', 'two five-round Watch cases', 'mutual withdrawal', '2,304 tests across 280 files', 'overlapping scopes are not additive', 'not a performance result', '2.839/0.039/0.240/1.813/2.416', '3.396/0.019/0.193/2.528/2.540', '30.600-millisecond sample', 'not a comparative speedup claim', 'Standard 219/194/201, Long 329/309/287 and Epic 374/332/327', 'do not establish organic activation', 'Rules/save remain 35', '21 September Short Watch regression', 'No new gameplay obligation was added or removed', 'all fifteen release gates remain open']) expect(text, claim).toContain(claim);
    for (const path of ['README.md', 'browser-final-review.md', 'counterplay-benchmark-final.json', 'pacing-maintained-comparison.json']) expect(story.evidence.some(link => link.path === `docs/development/2026-10-24-project-counterplay/${path}`), path).toBe(true);
    expect(text).not.toMatch(/PENDING|The candidate|verification pending/);
  });
  it('pins observed retirement, real reassignment and unchanged player authority without closing pacing gates', () => {
    const story = dispatches.find(entry => entry.id === 'patrol-retirement')!;
    expect(story).toMatchObject({ id: 'patrol-retirement', sequence: 15, sourceRevision: '68ef5fa7e524a3cd4e7e60fd7bbdd9037a6bc120', image: 'patrol-narrow-actions' });
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    for (const claim of ['currently visible foreign hearth', 'at most six hexes apart', 'Ordinary player-controlled turns do not clear the patrol automatically', 'identical manually configured policy', 'Existing travel is preserved', 'independent theater assignment', 'All 179 records replay exactly', '2,242 tests across 276 files', 'Three production journeys pass in 19.6 seconds', 'overlapping scopes are not additive', 'Six isolated planner cases', '196,608/307,200', '1.832/0.248/0.264', '2.794/0.446/0.455', 'Standard 219/194/201, Long 329/309/287 and Epic 374/332/327', 'no new detailed trace', 'still finish before the 350–400 target', 'DH-021 remains open', 'No new gameplay scope was added or removed', 'all fifteen release gates remain open', 'previously reviewed 390-pixel authored fixture']) expect(text, claim).toContain(claim);
    for (const path of ['docs/development/2026-10-24-patrol-retirement/README.md', 'docs/development/2026-10-24-patrol-retirement/policy-review.md', 'docs/development/2026-10-24-patrol-retirement/pacing-comparison.json', 'docs/development/2026-10-24-patrol-retirement/retirement-benchmark.json', 'tests/production/patrol-retirement.spec.ts']) expect(story.evidence.some(link => link.path === path), path).toBe(true);
  });
  it('pins posting preferences, saved patrols and explicit AI recovery without claiming pacing acceptance', () => {
    const story = dispatches.find(entry => entry.id === 'patrol-orders')!;
    expect(story).toMatchObject({ id: 'patrol-orders', sequence: 14, sourceRevision: 'dee74cf9c4e2d153f9c5f5cfdbd9221798205481', image: 'patrol-narrow-actions' });
    expect(story.sections.some(section => section.image === 'posting-templates-controls')).toBe(true);
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    for (const claim of ['outside campaign saves and exports', 'fresh owned hearth', 'not an organically grown realm', 'travel already issued continues', 'Updating the option on a paused patrol preserves its paused state', 'does not make player patrols resume themselves', 'identical manually queued leg', 'Four path queries and four resume commands', 'Rules/save advance from 34 to 35', '2,217 tests across 275 files', 'two production journeys pass in 11.2 seconds', 'overlapping scopes are not additive', 'Standard 219/193/214, Long 336/304/286 and Epic 374/278/320', 'Two Epic seeds now finish below', 'automatic patrol queue refusal', 'automaticRefusals label counts theater failures only', 'No new gameplay obligation was added or removed', 'all fifteen release gates remain open']) expect(text, claim).toContain(claim);
    for (const path of ['docs/development/2026-10-24-posting-templates/README.md', 'docs/development/2026-10-24-patrols/README.md', 'docs/development/2026-10-24-patrol-recovery/README.md', 'docs/development/2026-10-24-patrol-recovery/pacing-comparison.json', 'packages/ai/src/patrol-recovery.ts']) expect(story.evidence.some(link => link.path === path), path).toBe(true);
  });
  it('keeps paid production, personal templates and authored verification within their distinct boundaries', () => {
    const story = dispatches.find(entry => entry.id === 'production-sequences')!;
    expect(story).toMatchObject({ id: 'production-sequences', sequence: 10, sourceRevision: '420219d278ae17f42a04871c6319ecf62a4af216', image: 'production-sequence-results' });
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    for (const claim of ['one to five existing construction or recruitment items', '120 ordinary queue orders costing 1,440 coin', '318-by-39-pixel native locator PNG, 4,767 bytes', 'not an organically grown realm', 'accepted prefix remains paid and queued', 'A second Apply submits the current whole list', 'Save up to twenty-four production templates', 'not included in campaign exports', 'Applied queues and active charters remain canonical campaign state', 'exactly one production request/state and one correlated, target-free movement query', '210,762 measured payload bytes', '22,970,874 bytes', '4,842,958 bytes in 245.647 milliseconds', '1,975 headless tests across 247 files in 59.76 seconds', 'Thirty affected Chromium gameplay journeys pass in 3.9 minutes', 'One separate built-production sequence journey passes in 7.3 seconds', 'reported separately, not added together', 'Rules/save remain 32 and content remains 015468d1', 'no new pacing run is claimed', 'M3 remains in progress', 'All fifteen release gates remain open']) expect(text, claim).toContain(claim);
    expect(text).not.toMatch(/PENDING FINAL|PUBLICATION BLOCKER|reused context from dispatch 09/);
    expect(story.evidence.some(link => link.path === 'docs/development/2026-09-26-production-sequences/worker-serial-probe.log')).toBe(true);
    expect(story.evidence.some(link => link.path === 'tests/production/production-sequences.spec.ts')).toBe(true);
  });
  it('publishes saved campaign groups with explicit orders, frozen history and bounded scale evidence', () => {
    const story = dispatches.find(entry => entry.id === 'selection-groups')!;
    expect(story).toMatchObject({ id: 'selection-groups', sequence: 9, sourceRevision: '0d26fa3c34ac89164637f515e95671420400a841', image: 'selection-groups-recall' });
    const text = story.sections.flatMap(section => section.paragraphs).join(' ');
    for (const claim of ['twenty-four groups across armies and hearths', '128 members per group', 'Recall changes neither the canonical hash nor worker-transfer totals', 'Empty groups remain', 'Rules/save advance to 32; content remains 015468d1', 'frozen forty-eight-row schema', '147,456 and 196,608', 'add 36,518 and 36,590 bytes to observation JSON', 'not packed worker responses or browser frame-time measurements', '1,941 headless tests across 243 files pass in 59.19 seconds', 'Twenty affected Chromium gameplay journeys pass in 2.6 minutes', 'One separate built-production group journey passes in 7.8 seconds', 'reported separately, not added together', 'Two earlier browser failures', 'M3 remains in progress', 'All fifteen release gates remain open', 'no new pacing run is claimed']) expect(text).toContain(claim);
    expect(story.evidence.some(link => link.label === 'Saved groups verification' && link.path === 'docs/development/2026-09-25-selection-groups/README.md')).toBe(true);
  });
  it('accepts only explicitly published, revision-pinned entries in newest-work-first order', () => {
    expect(dispatches.every(story => 'publication' in story && story.publication === 'published')).toBe(true);
    expect(dispatches.map(story => story.id)).toEqual(['group-patrols', 'registry-order-filters', 'project-counterplay', 'patrol-retirement', 'patrol-orders', 'reinforcement-logistics', 'defense-theaters', 'group-travel', 'production-sequences', 'selection-groups', 'charter-templates', 'group-charters', 'group-postings', 'fleet-provisions', 'campaign-foundation-and-development-order', 'r17-campaign-safety', 'keeping-the-record', 'twenty-four-cultures']);
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
    const story = dispatches.find(entry => entry.id === 'charter-templates')!;
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
