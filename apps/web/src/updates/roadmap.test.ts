import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { roadmapGates, roadmapItems, roadmapSnapshot, roadmapStages } from './library';
import { filterRoadmap, readRoadmapFilters, roadmapCounts, roadmapItemUrl, roadmapUrl } from './roadmap';

describe('the source-backed roadmap contract', () => {
  it('records saved groups and the supported save repair without completing their wider gates', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(empire.status).toBe('in-progress');
    expect(empire.delivered.some(item => item.startsWith('Up to 24 named campaign groups'))).toBe(true);
    expect(empire.delivered.join(' ')).toContain('empty groups remain');
    expect(empire.remaining.join(' ')).not.toContain('durable named groups');
    expect(empire.remaining.join(' ')).toContain('saved reusable army order templates');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-09-25-selection-groups/README.md')).toBe(true);
    expect(roadmapItems.find(item => item.id === 'durable-archives')!.delivered.join(' ')).toContain('frozen historical schemas retain forty-eight-row limits');
    expect(roadmapItems.find(item => item.id === 'giant-scale')!.delivered.join(' ')).toContain('147,456/196,608');
    expect(roadmapGates).toHaveLength(15);
    expect(roadmapGates.every(gate => ['in-progress', 'pending'].includes(gate.status))).toBe(true);
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
    expect(roadmapSnapshot).toMatchObject({ date: '2026-09-26', revision: '0d26fa3c34ac89164637f515e95671420400a841', rules: 32 });
    const supply = roadmapItems.find(item => item.id === 'supply-and-trade')!;
    expect(supply).toMatchObject({ stage: 'current-work', status: 'in-progress' });
    expect(supply.delivered.join(' ')).toContain('eight turns of provisions');
    expect(supply.remaining.join(' ')).toContain('taxation');
    expect(supply.remaining.join(' ')).toContain('treaty access');
    const pacing = roadmapItems.find(item => item.id === 'victory-and-pacing')!;
    expect(pacing.delivered.join(' ')).toContain('234 at Standard, 342 at Long and 379 at Epic');
    expect(pacing.remaining.join(' ')).toContain('not general pacing acceptance');
    expect(roadmapGates).toHaveLength(15);
    expect(roadmapGates.every(gate => gate.status === 'in-progress' || gate.status === 'pending')).toBe(true);
  });
  it('records group orders as partial empire management with broader delegation still open', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(empire.status).toBe('in-progress');
    expect(empire.delivered.join(' ')).toContain('Up to 128 land armies ashore');
    expect(empire.delivered.join(' ')).toContain('One final worker response');
    expect(empire.delivered.join(' ')).toContain('refused armies retained for review');
    expect(empire.remaining.join(' ')).toContain('bounded theaters');
    expect(empire.remaining.join(' ')).toContain('patrol/escort');
    expect(empire.remaining.join(' ')).toContain('representative mature campaigns');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-09-23-deploy-and-group-postings/README.md')).toBe(true);
  });
  it('recognizes delivered group charters while retaining wider governor and template work', () => {
    const empire = roadmapItems.find(item => item.id === 'empire-management')!;
    expect(empire.status).toBe('in-progress');
    expect(empire.delivered.join(' ')).toContain('Up to 128 owned hearths');
    expect(empire.delivered.join(' ')).toContain('Assignment and revocation preserve queues and treasury');
    expect(empire.remaining.join(' ')).not.toContain('Complete settlement batch policies');
    expect(empire.remaining.join(' ')).toContain('saved reusable army order templates');
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
    expect(empire.remaining.join(' ')).toContain('production sequences');
    expect(empire.remaining.join(' ')).toContain('bounded theaters');
    expect(empire.evidence.some(link => link.path === 'docs/development/2026-09-25-charter-templates/README.md')).toBe(true);
    expect(roadmapCounts(roadmapItems)).toEqual({ completed: 6, 'in-progress': 13, pending: 4 });
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
