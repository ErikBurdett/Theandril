import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dispatchUrl, localUrl, resolveDispatch } from './journal';

describe('refresh-safe public links', () => {
  it('declares a reviewed base-safe icon instead of requesting a missing root favicon', () => {
    expect(readFileSync('apps/web/updates/index.html', 'utf8')).toContain('href="%BASE_URL%ui/hearth-card/ornament.corner-idle.webp"');
  });
  it('round-trips a permanent dispatch on both root and GitHub Pages bases', () => {
    expect(dispatchUrl('/Theandril/', 'r17-campaign-safety')).toBe('/Theandril/updates/dispatches/?dispatch=r17-campaign-safety');
    expect(dispatchUrl('/', 'twenty-four-cultures')).toBe('/updates/dispatches/?dispatch=twenty-four-cultures');
    expect(localUrl('/Theandril/', 'updates/campaign.webp')).toBe('/Theandril/updates/campaign.webp');
    expect(resolveDispatch('?dispatch=r17-campaign-safety')?.id).toBe('r17-campaign-safety');
    expect(resolveDispatch('?dispatch=missing')).toBeUndefined();
    expect(resolveDispatch('?dispatch=%3Cscript%3E')).toBeUndefined();
    expect(resolveDispatch('')).toBeUndefined();
  });
});
