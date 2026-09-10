// Regenerate with: pnpm changelog:build  (the Pages workflow regenerates before building, so the
// deployed feed always includes HEAD; the committed file is the local/dev fallback).
import { describe, expect, it } from 'vitest';
import feed from './changelog/feed.json';
import { initialVisibleCommits, renderMarkdown } from './changelog';
import { buildFeed } from '../../../../scripts/build-changelog';

describe('master changelog feed', () => {
  it('is deterministic and the committed feed is an exact record from its newest commit back to the root', () => {
    const generated = buildFeed();
    expect(buildFeed()).toEqual(generated);
    // A commit cannot contain its own hash, so the committed feed may lag by the commits made after it
    // was generated; everything it does record must match Git exactly (rewritten notes/history fail here).
    const newest = generated.findIndex(entry => entry.sha === feed[0]!.sha);
    expect(newest, 'committed feed head is not in first-parent history').toBeGreaterThanOrEqual(0);
    expect(generated.slice(newest)).toEqual(feed);
    expect(feed.at(-1)!.subject).toBe('Initial Theandril');
  });
});

describe('commit permalinks', () => {
  const entries = Array.from({ length: 11 }, (_, index) => ({ shortSha: `sha${index}` }));
  it('reveals enough entries for a permalinked older commit before scrolling to it', () => {
    expect(initialVisibleCommits('?commit=sha8', entries, 8)).toBe(9);
    expect(initialVisibleCommits('?commit=sha10', entries, 8)).toBe(11);
  });
  it('keeps the default fold for the first page, missing or unknown commits', () => {
    expect(initialVisibleCommits('', entries, 8)).toBe(8);
    expect(initialVisibleCommits('?commit=sha2', entries, 8)).toBe(8);
    expect(initialVisibleCommits('?commit=nope', entries, 8)).toBe(8);
  });
});

describe('basic authored markdown', () => {
  it('renders headings, paragraphs, lists, bold text and links', () => {
    const html = renderMarkdown('## Heading\n\nA **bold** [link](https://example.com).\n\n- One\n- Two');
    expect(html).toContain('<h2>Heading</h2>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<a href="https://example.com">link</a>');
    expect(html).toContain('<li>One</li>');
  });
  it('escapes raw HTML and refuses non-http links', () => {
    const html = renderMarkdown('<img src=x onerror=alert(1)> [x](javascript:alert(1))');
    expect(html).not.toContain('<img');
    expect(html).not.toMatch(/href="javascript:/);
    expect(html).not.toContain('href="javascript');
  });
});
