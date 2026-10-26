import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GroupPolicyResults, groupPolicyResultPage, type GroupPolicyResult } from './group-policy-results';

const rows: GroupPolicyResult[] = Array.from({ length: 128 }, (_, index) => ({
  id: `actor.${String(index).padStart(3, '0')}`, name: `Company ${index + 1}`, accepted: index % 4 !== 0,
  ...(index % 4 === 0 ? { message: `Canonical refusal ${index + 1}` } : {}),
}));

describe('bounded posting and charter receipts', () => {
  it('keeps every result reachable in stable command order without mutating the receipt', () => {
    const original = structuredClone(rows), reached: GroupPolicyResult[] = [];
    for (let page = 0; page < 6; page++) {
      const result = groupPolicyResultPage(rows, 'all', page);
      expect(result).toMatchObject({ total: 128, accepted: 96, refused: 32, matching: 128, pages: 6, current: page });
      expect(result.rows.length).toBeLessThanOrEqual(25);
      reached.push(...result.rows);
    }
    expect(reached).toEqual(rows);
    expect(new Set(reached.map(row => row.id)).size).toBe(128);
    expect(rows).toEqual(original);
  });

  it('filters successes and refusals independently, clamps a stale page, and represents an empty filter', () => {
    expect(groupPolicyResultPage(rows, 'refused', 0).rows).toEqual(rows.filter(row => !row.accepted).slice(0, 25));
    expect(groupPolicyResultPage(rows, 'refused', 5)).toMatchObject({ current: 1, pages: 2, matching: 32 });
    expect(groupPolicyResultPage(rows, 'accepted', 3).rows).toEqual(rows.filter(row => row.accepted).slice(75));
    expect(groupPolicyResultPage(rows, 'all', -1).current).toBe(0);
    expect(groupPolicyResultPage(rows.filter(row => row.accepted), 'refused', 4)).toMatchObject({ current: 0, pages: 1, matching: 0, rows: [] });
  });

  for (const kind of ['posting', 'charter', 'worker-policy', 'land-policy'] as const) {
    const label = kind === 'worker-policy' ? 'worker policy' : kind === 'land-policy' ? 'land commission' : kind;
    it(`opens ${kind} refusals first and bounds the rendered list to 25 rows`, () => {
      const html = renderToStaticMarkup(<GroupPolicyResults kind={kind} rows={rows}/>);
      expect(html).toContain(`data-testid="group-${kind}-results"`);
      expect(html).toContain('96 orders accepted · 32 refused.');
      expect(html).toContain(`<details open=""><summary>Review ${label} results</summary>`);
      expect(html).toContain('<option value="refused" selected="">Refused (32)</option>');
      expect(html.match(/<li>/g)).toHaveLength(25);
      expect(html).toContain('Canonical refusal 97');
      expect(html).not.toContain('Canonical refusal 101');
      expect(html).not.toContain('<strong>Company 2</strong>');
      expect(html).toContain('does not change your selection or retry any order');
    });

    it(`keeps an all-success ${kind} receipt collapsed while exposing success names on demand`, () => {
      const html = renderToStaticMarkup(<GroupPolicyResults kind={kind} rows={rows.filter(row => row.accepted)}/>);
      expect(html).toContain(`<details><summary>Review ${label} results</summary>`);
      expect(html).toContain('96 orders accepted · 0 refused.');
      expect(html).toContain('<option value="all" selected="">All results (96)</option>');
      expect(html).toContain('<strong>Company 2</strong> · Accepted');
      expect(html.match(/<li>/g)).toHaveLength(25);
      expect(html).not.toContain('remain selected for review');
    });
  }

  it('locks both pagination buttons and the filter while a sibling action is busy', () => {
    const html = renderToStaticMarkup(<GroupPolicyResults kind="posting" rows={rows} busy/>);
    expect(html).toContain('<select disabled="">');
    expect(html).toContain('<button disabled="" aria-label="Previous posting results page">');
    expect(html).toContain('<button disabled="" aria-label="Next posting results page">');
  });

  it('uses text nodes for names and messages, preserving a refusal without executing markup', () => {
    const html = renderToStaticMarkup(<GroupPolicyResults kind="charter" rows={[{ id: 'a', name: '<script>name</script>', accepted: false, message: '<img src=x>' }]}/>);
    expect(html).toContain('&lt;script&gt;name&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x&gt;');
    expect(html).not.toContain('<script>');
  });
});
