import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CampaignWindow, HudIcon } from './campaign-window';

it('keeps real orders inside a named native window with an independent close control', () => {
  const html = renderToStaticMarkup(<CampaignWindow title="Selected orders" close={() => { throw new Error('No command on render'); }}><button disabled>Actual paid order</button></CampaignWindow>);
  expect(html).toContain('<dialog'); expect(html).toContain('aria-labelledby=');
  expect(html).toContain('Close Selected orders'); expect(html).toContain('disabled=""');
  expect(html).not.toContain('aria-modal="false"');
});
it('uses decorative original line icons and leaves button names to live text', () => {
  const html = renderToStaticMarkup(<HudIcon symbol="settlements"/>);
  expect(html).toContain('aria-hidden="true"'); expect(html).not.toContain('<text');
});
