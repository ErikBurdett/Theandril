import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { dispatches } from './content';
import { library, libraryRevision, scopeLedger } from './library';
import media from './media.json';
import { evidenceUrl } from './journal';
import type { Dispatch } from './types';

it('validates stable slugs and every image cross-reference in the public catalog', () => {
  const ids = dispatches.map(story => story.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(new Set(dispatches.map(story => story.sequence)).size).toBe(ids.length);
  for (const story of dispatches) {
    expect(story.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(story.publication).toBe('published');
    expect(story.sourceRevision).toMatch(/^[a-f0-9]{40}$/);
    expect(story.sections.length).toBeGreaterThanOrEqual(3);
    expect(story.sections.flatMap(section => section.paragraphs).join(' ').split(/\s+/).length).toBeGreaterThan(300);
    const anchors = story.sections.map(section => section.id);
    expect(new Set(anchors).size).toBe(anchors.length);
    for (const anchor of anchors) {
      expect(anchor).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(['main', 'source-notes']).not.toContain(anchor);
    }
    for (const image of [story.image, ...story.sections.flatMap(section => section.image ? [section.image] : [])]) {
      expect(media.assets.some(asset => asset.id === image), `${story.id}: ${image}`).toBe(true);
    }
  }
});

function validateEvidence(stories: readonly Dispatch[]) {
  const references = [
    ...stories.flatMap(story => story.evidence.map(link => ({ path: link.path, revision: story.sourceRevision }))),
    ...[...library, ...scopeLedger].map(link => ({ path: link.path, revision: libraryRevision })),
    ...media.assets.map(image => ({ path: image.sourcePath, revision: image.sourceRevision })),
  ];
  const sources = new Map(references.map(reference => [`${reference.revision}:${reference.path}`, reference]));
  for (const [object, { path, revision }] of sources) {
    expect(revision).toMatch(/^[a-f0-9]{40}$/);
    expect(path).not.toMatch(/(^\/|\.\.|\\|^https?:|[?#])/);
    expect(() => execFileSync('git', ['cat-file', '-e', object], { stdio: 'pipe' }), object).not.toThrow();
    expect(evidenceUrl(path, revision)).toBe(`https://github.com/ErikBurdett/Theandril/blob/${revision}/${path}`);
  }
}

it('links evidence that really exists at the pinned Git revision, not just on disk', () => {
  validateEvidence(dispatches);
});

it('rejects a missing object at one of two revisions sharing an evidence path', () => {
  const path = 'docs/development/post-fix-review/summary.json';
  const missingRevision = 'b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd';
  const presentRevision = '8b3b8c148b7e8ee3689001210033fee7a1b8a6ef';
  const evidence = [{ path, label: 'Shared source', note: 'Regression fixture' }];
  const missing = { ...dispatches[0]!, sourceRevision: missingRevision, evidence };
  const present = { ...dispatches[0]!, sourceRevision: presentRevision, evidence };
  expect(() => execFileSync('git', ['cat-file', '-e', `${missingRevision}:${path}`], { stdio: 'pipe' })).toThrow();
  expect(() => execFileSync('git', ['cat-file', '-e', `${presentRevision}:${path}`], { stdio: 'pipe' })).not.toThrow();
  expect(() => validateEvidence([missing, present])).toThrow(`${missingRevision}:${path}`);
  expect(() => validateEvidence([present, missing])).toThrow(`${missingRevision}:${path}`);
  expect(() => validateEvidence([present, present])).not.toThrow();
});

it('keeps frontend image metadata and the downloadable provenance byte-identical', () => {
  expect(readFileSync('apps/web/src/updates/media.json', 'utf8')).toBe(readFileSync('apps/web/public/updates/provenance.json', 'utf8'));
});

it('preserves the actual approval boundary and checkpoint numbers in the story', () => {
  const review = JSON.parse(readFileSync('docs/development/post-fix-review/summary.json', 'utf8'));
  expect(review.reviewedCheckpointsApproved).toBe(true);
  expect(review.overallIntegrationApproved).toBe(false);
  expect(review.releaseApproved).toBe(false);
  const story = dispatches.find(entry => entry.id === 'r17-campaign-safety')!;
  const text = story.sections.flatMap(section => section.paragraphs).join(' ');
  expect(text).toContain('753');
  expect(text).toContain('125,150');
  expect(text).toContain('queued second-harbor');
  expect(text).toContain('O(prefix bytes)');
  expect(text).toContain('not a 1.0 signoff');
  expect(scopeLedger.map(entry => entry.state)).toEqual(expect.arrayContaining(['Accepted scope', 'Current / partial', 'Open gate', 'Proposal / deferred', 'Not this update']));
});
