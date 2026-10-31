import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { roadmapGates, roadmapItems, roadmapSnapshot, roadmapStages } from './library';
import { filterRoadmap, readRoadmapFilters, roadmapCounts, roadmapItemUrl, roadmapUrl } from './roadmap';

describe('the source-backed roadmap contract', () => {
  it('records group commissions within the existing governor item without changing catalogue or gate statuses', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(empire.status).toBe('in-progress');
    for (const claim of ['exact per-hearth permission totals', 'one shared treasury reserve', '26 commissions waiting', '61-record archive', 'require restoration']) expect(empire.delivered.join(' '), claim).toContain(claim);
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-10-26-group-land-commissions/README.md')).toBe(true);
    expect(empire.remaining.join(' ')).toContain('broader governor decisions');
    expect(roadmapCounts(roadmapItems)).toEqual({ completed: 6, 'in-progress': 14, pending: 3 });
    expect(roadmapGates).toHaveLength(15);
    expect(roadmapGates.every(gate => ['in-progress', 'pending'].includes(gate.status))).toBe(true);
  });

  it('records paid land commissions in existing empire scope and keeps strategic governor acceptance open', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(empire.status).toBe('in-progress');
    for (const claim of ['remaining total allowance', 'after upkeep and charters', 'matching extraction sites', 'removal retains paid work', '22+25 coin', 'Group commission assignment']) expect(empire.delivered.join(' '), claim).toContain(claim);
    expect(empire.remaining.join(' ')).toContain('broader governor decisions');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-10-25-land-commissions/README.md')).toBe(true);
    expect(roadmapItems.find(item => item.id === 'victory-and-pacing')!.delivered.join(' ')).toContain('18/22/29 commission commands');
    expect(roadmapItems.find(item => item.id === 'durable-archives')!.delivered.join(' ')).toContain('genuine thirteen-record rules 36 campaign');
    expect(roadmapGates.every(gate => ['in-progress', 'pending'].includes(gate.status))).toBe(true);
  });

  it('records free worker stewardship while retaining wider governors, adverse pacing seeds and all open gates', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!, pacing = roadmapItems.find(item => item.id === 'victory-and-pacing')!;
    expect(empire.status).toBe('in-progress');
    for (const claim of ['for the following harvest', 'direct worker orders revoke', 'without an implicit autosave', 'extraction deposits unworked']) expect(empire.delivered.join(' '), claim).toContain(claim);
    expect(empire.remaining.join(' ')).toContain('broader governor decisions');
    expect(empire.remaining.join(' ')).toContain('representative organically developed mature campaigns');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-10-25-worker-stewardship/README.md')).toBe(true);
    expect(pacing.delivered.join(' ')).toContain('Standard 219, Long 329 and Epic 374');
    expect(pacing.delivered.join(' ')).toContain('233/346/385');
    expect(pacing.delivered.join(' ')).toContain('other seeds have not been rerun under rules 36');
    expect(roadmapGates).toHaveLength(15);
    expect(roadmapGates.every(gate => ['in-progress', 'pending'].includes(gate.status))).toBe(true);
  });

  it('records settlement cohorts without promising purchases or completing governors', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(empire.status).toBe('in-progress');
    expect(empire.delivered.join(' ')).toContain('exact 36-record archive');
    expect(empire.delivered.join(' ')).toContain('next candidates are not promised purchases');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-10-25-settlement-order-filters/README.md')).toBe(true);
    expect(empire.remaining.join(' ')).toContain('organically developed mature campaigns');
    expect(roadmapGates.every(gate => ['in-progress', 'pending'].includes(gate.status))).toBe(true);
  });
  it('records saved groups and the supported save repair without completing their wider gates', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(empire.status).toBe('in-progress');
    expect(empire.delivered.join(' ')).toContain('currently visible foreign hearth');
    expect(empire.delivered.join(' ')).toContain('ordinary player turns do not perform cleanup');
    expect(empire.delivered.some(item => item.startsWith('Up to 24 named campaign groups'))).toBe(true);
    expect(empire.delivered.join(' ')).toContain('empty groups remain');
    expect(empire.remaining.join(' ')).not.toContain('durable named groups');
    expect(empire.remaining.join(' ')).toContain('reusable army order templates');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-09-25-selection-groups/README.md')).toBe(true);
    expect(roadmapItems.find(item => item.id === 'durable-archives')!.delivered.join(' ')).toContain('frozen historical schemas retain forty-eight-row limits');
    expect(roadmapItems.find(item => item.id === 'giant-scale')!.delivered.join(' ')).toContain('147,456/196,608');
    expect(roadmapGates).toHaveLength(15);
    expect(roadmapGates.every(gate => ['in-progress', 'pending'].includes(gate.status))).toBe(true);
  });
  it('records one bounded counterplay checkpoint and corrects posting targets without inflating feature counts', () => {
    const pacing = roadmapItems.find(item => item.id === 'victory-and-pacing')!;
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(pacing.delivered.join(' ')).toContain('at most eight projects and four establishment quotes');
    expect(pacing.delivered.join(' ')).toContain('including a loss');
    expect(pacing.remaining.join(' ')).toContain('broader specific counterplay');
    expect(empire.delivered.join(' ')).toContain('Where it stands resolves the latest army position');
    expect(empire.delivered.join(' ')).toContain('preserving the order and its Clear control');
    expect(pacing.status).toBe('in-progress');
    expect(roadmapItems.reduce((count, item) => count + item.delivered.length, 0)).toBe(115);
    expect(roadmapItems.reduce((count, item) => count + item.remaining.length, 0)).toBe(49);
  });
  it('records the bounded registry workflow without closing mature-realm acceptance', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(empire.delivered.join(' ')).toContain('exact nine-record archive');
    expect(empire.delivered.join(' ')).toContain('The local filter resets on reopening');
    expect(empire.remaining.join(' ')).toContain('organically developed mature campaigns');
    expect(empire.status).toBe('in-progress');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-10-24-army-order-filters/README.md')).toBe(true);
  });
  it('records bounded group patrol policy controls without treating travel as resumed', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(empire.status).toBe('in-progress');
    expect(empire.delivered.join(' ')).toContain('Issued travel stays unchanged');
    expect(empire.delivered.join(' ')).toContain('exact 352-record archive');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-10-24-group-patrols/README.md')).toBe(true);
    expect(empire.remaining.join(' ')).toContain('organically developed mature campaigns');
  });
  it('keeps stable unique item IDs and complete acceptance/evidence records', () => {
    expect(new Set(roadmapItems.map(item => item.id)).size).toBe(roadmapItems.length);
    expect(new Set(roadmapStages.map(stage => stage.id)).size).toBe(roadmapStages.length);
    for (const item of roadmapItems) {
      expect(item.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(roadmapStages.some(stage => stage.id === item.stage)).toBe(true);
      expect(item.evidence.length).toBeGreaterThan(0);
      expect(item.gates.length).toBeGreaterThan(0);
      expect(new Set(item.gates).size).toBe(item.gates.length);
      for (const gate of item.gates) expect(roadmapGates.some(entry => entry.id === gate)).toBe(true);
      if (item.status === 'completed') {
        expect(item.delivered.length, item.id).toBeGreaterThan(0);
        expect(item.remaining, item.id).toEqual([]);
      } else {
        expect(item.remaining.length, item.id).toBeGreaterThan(0);
      }
    }
    const counts = roadmapCounts(roadmapItems);
    expect(counts.completed + counts['in-progress'] + counts.pending).toBe(roadmapItems.length);
    expect(Object.values(counts).every(count => count > 0)).toBe(true);
  });

  it('covers every canonical release gate without inflating a checkpoint into signoff', () => {
    const gates = [...readFileSync('DEFINITION_OF_DONE.md', 'utf8').matchAll(/^## Gate ([A-N](?:2)?) — (.+)$/gm)];
    expect(roadmapGates.map(gate => [gate.id, gate.title])).toEqual(gates.map(match => [match[1], match[2]]));
    for (const gate of roadmapGates) {
      expect(['in-progress', 'pending']).toContain(gate.status);
      expect(gate.remaining.trim().length).toBeGreaterThan(20);
      expect(roadmapItems.some(item => item.status !== 'completed' && item.gates.includes(gate.id))).toBe(true);
    }
    expect(roadmapItems.find(item => item.id === 'online-campaigns')?.status).toBe('pending');
    expect(roadmapItems.find(item => item.id === 'research-and-magic')?.status).toBe('in-progress');
    const campaign = roadmapItems.find(item => item.id === 'campaign-safety-review')!;
    expect(campaign.delivered.join(' ')).toContain('second-harbor');
    expect(campaign.remaining.join(' ')).toContain('the rules that ship');
    expect(campaign.status).toBe('in-progress');
  });

  it('resolves every evidence file at the declared immutable source snapshot', () => {
    expect(roadmapSnapshot.revision).toMatch(/^[a-f0-9]{40}$/);
    expect(roadmapSnapshot.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const paths = new Set(roadmapItems.flatMap(item => item.evidence.map(link => link.path)));
    for (const path of paths) {
      expect(path).not.toMatch(/(^\/|\.\.|\\|^https?:|[?#])/);
      expect(() => execFileSync('git', ['cat-file', '-e', `${roadmapSnapshot.revision}:${path}`], { stdio: 'pipe' }), path).not.toThrow();
    }
  });
  it('records current supply and pacing without completing a wider system or gate', () => {
    expect(roadmapSnapshot).toMatchObject({ date: '2026-10-26', revision: 'cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5', rules: 37 });
    const supply = roadmapItems.find(item => item.id === 'supply-and-trade')!;
    expect(supply).toMatchObject({ stage: 'current-work', status: 'in-progress' });
    expect(supply.delivered.join(' ')).toContain('eight turns of provisions');
    expect(supply.delivered.join(' ')).toContain('paid bilateral access to one observed foreign hearth or harbor');
    expect(supply.remaining.join(' ')).toContain('taxation');
    expect(supply.remaining.join(' ')).toContain('wider negotiated supply or passage obligations beyond one-source service');
    const pacing = roadmapItems.find(item => item.id === 'victory-and-pacing')!;
    expect(pacing.delivered.join(' ')).toContain('234 at Standard, 342 at Long and 379 at Epic');
    expect(pacing.delivered.join(' ')).toContain('Standard 233/211/225, Long 311/312/309 and Epic 349/367/373');
    expect(pacing.delivered.join(' ')).toContain('Current campaigns make no supply requests');
    expect(pacing.remaining.join(' ')).toContain('DH-021 remains open');
    expect(pacing.delivered.join(' ')).toContain('Standard 219/194/201, Long 329/309/287 and Epic 374/332/327');
    expect(roadmapGates).toHaveLength(15);
    expect(roadmapGates.every(gate => gate.status === 'in-progress' || gate.status === 'pending')).toBe(true);
  });
  it('records group orders as partial empire management with broader delegation still open', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(empire.status).toBe('in-progress');
    expect(empire.delivered.join(' ')).toContain('Up to 128 land armies ashore');
    expect(empire.delivered.join(' ')).toContain('One final worker response');
    expect(empire.delivered.join(' ')).toContain('refused armies retained for review');
    expect(empire.remaining.join(' ')).toContain('broader theater strategy');
    expect(empire.remaining.join(' ')).toContain('mobile escorts');
    expect(empire.remaining.join(' ')).toContain('representative organically developed mature campaigns');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-09-23-deploy-and-group-postings/README.md')).toBe(true);
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-09-26-group-travel/README.md')).toBe(true);
  });
  it('recognizes delivered group charters while retaining wider governor and template work', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(empire.status).toBe('in-progress');
    expect(empire.delivered.join(' ')).toContain('Up to 128 owned hearths');
    expect(empire.delivered.join(' ')).toContain('Assignment and revocation preserve queues and treasury');
    expect(empire.remaining.join(' ')).not.toContain('Complete settlement batch policies');
    expect(empire.remaining.join(' ')).toContain('reusable army order templates');
    expect(empire.remaining.join(' ')).toContain('broader governor decisions');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-09-24-group-charters/README.md')).toBe(true);
  });
  it('records browser-local charter templates while preserving the remaining M3 and release boundaries', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    const text = empire.delivered.join(' ');
    expect(empire.status).toBe('in-progress');
    expect(text).toContain('Up to 24 named charter focus/ceiling templates');
    expect(text).toContain('Apply charters remains explicit');
    expect(text).toContain('campaign exports exclude the library');
    expect(empire.remaining.join(' ')).toContain('reusable army order templates');
    expect(empire.remaining.join(' ')).toContain('broader theater strategy');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-09-25-charter-templates/README.md')).toBe(true);
    expect(roadmapCounts(roadmapItems)).toEqual({ completed: 6, 'in-progress': 14, pending: 3 });
    expect(roadmapGates.every(gate => ['in-progress', 'pending'].includes(gate.status))).toBe(true);
  });
  it('records production lists as a bounded checkpoint while preserving manual correction and broader delegation acceptance', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    const delivered = empire.delivered.join(' '), remaining = empire.remaining.join(' ');
    expect(empire.status).toBe('in-progress');
    for (const claim of ['one to five existing construction/recruitment items', 'up to 128 owned hearths', 'preserves its paid prefix and leaves it selected for correction', 'at most 640 attempts', 'Up to 24 named production templates', 'Apply remains the paid action', 'never enter campaign saves or exports', 'failed preference storage leaves direct editing and production usable']) expect(delivered, claim).toContain(claim);
    for (const claim of ['broader governor decisions', 'broader theater strategy', 'mobile escorts', 'reusable army order templates', 'representative organically developed mature campaigns']) expect(remaining, claim).toContain(claim);
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-09-26-production-sequences/README.md')).toBe(true);
    expect(roadmapItems.reduce((count, item) => count + item.delivered.length, 0)).toBe(115);
    expect(roadmapItems.reduce((count, item) => count + item.remaining.length, 0)).toBe(49);
    expect(roadmapCounts(roadmapItems)).toEqual({ completed: 6, 'in-progress': 14, pending: 3 });
    expect(roadmapGates).toHaveLength(15);
    expect(roadmapGates.every(gate => ['in-progress', 'pending'].includes(gate.status))).toBe(true);
  });
});

describe('roadmap browsing and permanent URLs', () => {
  it('combines status with words from delivered behavior and remaining acceptance', () => {
    const completed = filterRoadmap(roadmapItems, 'sea transport', 'completed');
    expect(completed.map(item => item.id)).toEqual(['armies-and-fleets']);
    const pending = filterRoadmap(roadmapItems, ' GATE M ', 'pending');
    expect(pending.map(item => item.id)).toEqual(['online-campaigns', 'release-signoff']);
    expect(filterRoadmap(roadmapItems, 'Gate F', 'all').some(item => item.id === 'research-and-magic')).toBe(false);
    expect(filterRoadmap(roadmapItems, 'second-harbor', 'in-progress').map(item => item.id)).toEqual(['campaign-safety-review']);
    expect(filterRoadmap(roadmapItems, 'no-such-feature', 'all')).toEqual([]);
    expect(filterRoadmap(roadmapItems, '', 'all')).toEqual(roadmapItems);
  });

  it('round-trips shareable filters at root and Pages bases without accepting arbitrary statuses', () => {
    expect(roadmapUrl('/Theandril/', 'magic & rituals', 'in-progress')).toBe('/Theandril/updates/roadmap/?q=magic+%26+rituals&status=in-progress');
    expect(readRoadmapFilters('?q=magic+%26+rituals&status=in-progress')).toEqual({ query: 'magic & rituals', status: 'in-progress' });
    expect(roadmapUrl('/')).toBe('/updates/roadmap/');
    expect(readRoadmapFilters('?status=shipped')).toEqual({ query: '', status: 'all' });
    expect(readRoadmapFilters('?q=<script>&item=online-campaigns&status=completed')).toEqual({ query: '', status: 'all' });
    expect(roadmapItemUrl('/Theandril/', 'online-campaigns')).toBe('/Theandril/updates/roadmap/?item=online-campaigns#roadmap-online-campaigns');
    expect(roadmapItemUrl('/', 'world-and-exploration')).toBe('/updates/roadmap/?item=world-and-exploration#roadmap-world-and-exploration');
  });
});
