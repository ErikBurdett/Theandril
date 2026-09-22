import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { roadmapGates, roadmapItems, roadmapSnapshot, roadmapStages } from './library';
import { filterRoadmap, readRoadmapFilters, roadmapCounts, roadmapItemUrl, roadmapUrl } from './roadmap';

describe('the source-backed roadmap contract', () => {
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
