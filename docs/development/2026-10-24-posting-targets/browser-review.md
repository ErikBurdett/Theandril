# Posting destination browser review

The new development journey file is `tests/gameplay/posting-targets.spec.ts`, with `posting-targets-fixture.ts` as its authored setup. Collection finds three cases and scoped ESLint passes. The fixture executes successfully and crosses strict serialization/deserialization before portable import. A corresponding production journey remained a packet draft until the parent confirmed collection of the retirement publication's live 39 cases, then was promoted to `tests/production/posting-targets.spec.ts`. This later addition does not change that already-collected publication run or its exact live-byte evidence.

The fixture deliberately replaces a tiny generated world's terrain with clear land, removes its deposits, explores its cells and places the initial founder/company. Its hearth is founded through the ordinary command. Initial posting, muster and travel orders also use ordinary commands. This is authored workflow evidence, not played conquest or an organically developed campaign.

The first case keeps the posting component mounted while sibling route controls review and execute a real one-hex move. It then requires the submitted posting target to equal the displayed current position. The other cases import canonical arbitrary-hex orders at hex zero, which is absent from the current owned-hearth dropdown. They require an explicit unresolved choice, accessible explanation and disabled replacement action while retaining Clear. Clearing a posting must preserve its existing active travel; fresh choices and save/reload must retain exact archive replay.

Dynamic hearth capture while the same form remains mounted is not claimed by these browser cases. Disappearing owned choices are separately covered by component rerenders. The saved arbitrary-hex cases establish the public form's unavailable-choice behavior without injecting a fake browser observation or pretending that a target hex is canonically invalid.

Fail-before browser execution uses the exact pre-fix `postings.tsx` from `27a44f1a228ccc14792e92c70f9b556da2da008f`, SHA-256 `19797cf930fc69af357bc447273115ab38448a8b3062206d6d0d4aa307f8ed9d`. The component owner preserved the fix separately and restored that original file solely for this capture. Port 4173 was checked idle before Playwright started its own development server; no user server or production dist was changed.

## Observed failure and corrected result

[browser-before.log](browser-before.log) retains all three expected failures, with screenshots and traces under `browser-before/`. The moving-company case successfully asserts that the dropdown displays “Where it stands · hex 501,” then clicks Post and receives the canonical summary “Hold · hex 500.” I opened its actual failure screenshot: the conflicting dropdown, saved summary and feedback are simultaneously visible. This is a reproduced wrong order through real controls, not merely an inference from React fallback behavior. The other cases display fallback values 505 and 490 while their canonical saved orders still target hex zero.

The component owner restored the fixed source, SHA-256 `b2fdf89debffc05217d16d66ec0f7b2521d22797e5ae67cf1a009c17963c5a03`. The first corrected run passes all three new cases but exposes a legacy test assumption: `postings.spec.ts` selected option index zero, which is now the intentional unresolved placeholder. That run remains [browser-final.log](browser-final.log), with its timeout and trace intact. Parent authorized changing only the selector to explicit `current` intent and its explanatory comment; the behavior assertions remain unchanged. One native success screenshot was added to the first new test after fail-before capture; its assertions were not relaxed.

The final [browser-verified.log](browser-verified.log) passes **four journeys in 20.6 seconds**: current-position movement 6.1s, unavailable posting/route preservation 4.0s, unavailable muster/fresh choice 5.5s and the existing posting/muster flow 4.0s. Each new journey exports through the real menu, verifies canonical replay, manually saves, reloads and exports again to compare the entire archive and state hash. The tests use no command or observation mutation hook. Playwright's server stopped afterward; port 4173 is idle. This is development-server acceptance, not a built-production or live-deployment result.

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium ./node_modules/.bin/playwright test tests/gameplay/posting-targets.spec.ts tests/gameplay/postings.spec.ts --output docs/development/2026-10-24-posting-targets/browser-verified
```

## Native image review

I opened all three new corrected native captures from the first fixed run. The final four-pass run's three PNGs are byte-identical to those inspected pixels:

| Final capture | SHA-256 | Visible scope |
| --- | --- | --- |
| [Current position](browser-verified/posting-targets-where-it-s-4484e-nt-in-the-mounted-inspector/posting-current-after-movement.png) | `6c6fa18c50072e607f8c89e8591d8a8b7b8679a1eea069aeb5dc727e41b6644c` | 1440×1000 viewport; displayed current position and saved Hold summary both say 501. |
| [Unavailable posting](browser-verified/posting-targets-an-unavail-ba118--route-at-narrow-text-scale/posting-unavailable-narrow.png) | `f88432b7dec7593e7bb432fd0d038ae296cd53ee2ab0b3cfe3f40e4e934aaeb6` | 390×844 at 130% text; scrolled form shows the unresolved choice, unchanged-target explanation, disabled Update and enabled Clear. The top label is at the scroll boundary; this is not a full inspector capture. |
| [Unavailable muster](browser-verified/posting-targets-a-saved-mu-44c11-le-with-exact-saved-history/muster-unavailable-desktop.png) | `81a24b98340de3443b14f4c8bdc25b4fa0d0c718c235d7645a22fa459a0a3fe5` | 1440×1000 viewport; canonical hex-zero summary remains visible beside an unresolved replacement choice and enabled Clear. |

The explanations and action controls are legible. No transform, crop or re-encoding was used. Keyboard activation of Clear and a subsequent explicit destination are tested; images illustrate those controls without replacing replay evidence.

Final new journey source SHA-256: `6f47c5408ee61e5bad1350db43f2197348776a3b905a3050bc42ca71a801f965`. Fixture SHA-256: `896edb8193c2bec95899abb7e69d80c148f91073ce1e8bcb350ad43566039203`. The promoted production file collects three cases and passes scoped ESLint. It uses a subpath-relative import entry, explicitly asserts that development hooks are absent, and otherwise follows the same public controls and canonical export checks.

## Integrated production result

The parent-owned [production run](production.log) passes **five journeys in 25.8 seconds**: existing group postings 2.9s, current-position posting 6.3s, unavailable posting 3.6s, unavailable muster 5.6s, and personal posting templates 5.8s. These built-production journeys are distinct executions from the four development cases; their overlapping behavior must not be added into a feature count. The three new production cases prove absent development hooks, actual current-position movement/order submission, unchanged travel after Clear, fresh muster choice and exact exported replay/manual save recovery.

The parent integration also records [2,253 passing tests across 277 files in 67.65 seconds](full-tests.log), plus passing [typecheck](typecheck-integration.log), [lint](lint.log) and [build](build.log). I inspected the retained logs and captures rather than rerunning those checks. This is local candidate acceptance, not a live-deployment claim.

I opened all six native PNGs copied from that production run. The three new captures retain the same legible control states as the development evidence, with the production game lacking the development Art Lab control. The narrow target form is deliberately scrolled and the upper label crosses its scroll boundary; its explanation, unresolved choice, disabled Update and enabled Clear remain visible. The three template regression captures show the restored library, its enlarged text and explicit recall/application controls. The locator capture is a portion of that scrollable panel, not an entire page. No transform or re-encoding was performed for review.

| Production capture | SHA-256 |
| --- | --- |
| [Current position](production-results/production-posting-targets-0009b-nt-in-the-mounted-inspector/posting-current-after-movement.png) | `c7cc64cfa168acf94f9f7e6093a8b826ae5e63b3c82dac11310c7674ddafbbe9` |
| [Unavailable posting](production-results/production-posting-targets-5adc7--route-at-narrow-text-scale/posting-unavailable-narrow.png) | `1ad13ae4b8a111a2c8d531bfc560de2b12ced20de8a8ec34b8973c737605ca48` |
| [Unavailable muster](production-results/production-posting-targets-fa199-le-with-exact-saved-history/muster-unavailable-desktop.png) | `bef199e0e162c4e890caf0f945ec46a81f2bb435bdd0a8ad4fc7cde2d1e728fb` |
| [Restored templates](production-results/production-posting-templat-eb5e9-rders-and-saved-restoration/production-posting-templates-restored.png) | `f27c19d479e54502c873512ed5baf16cf35c5d7aee978885085e386fb2ef0e5b` |
| [Template text scale](production-results/production-posting-templat-eb5e9-rders-and-saved-restoration/production-posting-templates-text-scale.png) | `b91cfe82ac330bb276d7b38fd69210c25e0e22748f0da5c8efd170be05530dc3` |
| [Template actions](production-results/production-posting-templat-eb5e9-rders-and-saved-restoration/production-posting-templates-text-scale-actions.png) | `edb9842a9560e73891d47b5c957219ce19546ca52296718d619ad58055155d5a` |

No scoped production browser or visual blocker found. Dynamic capture of a chosen hearth remains component-level coverage, as stated above; the public browser tests do not claim that scenario was played.
