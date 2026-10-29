# Subject rule: the client capture outcome — 2026-10-29

Rules/save **39**. Local checkpoint; nothing in this packet is published.
Design: [ADR 0058](../../architecture/0058-subject-rule.md).

## What was built

- `packages/sim/src/siege.ts`: the `subject` outcome quoted only by rules-39
  decisions (`rulesVersion: 39`) when the fallen hearth is the realm's capital,
  the realm holds another hearth and the rules-22 patronage chain allows it;
  `subjectUnavailable` names the first failing reason; resolution returns the
  hearth with liberation's consequences, then imposes peace and swears the bond.
  `captureOutcomeV38Schema` freezes the four older outcomes for every schema up
  to 38; `captureDecisionV39Schema` admits five quoted outcomes.
- `packages/sim/src/diplomacy.ts`: `imposePeace` (war lifted, offers lapsed,
  thirty-turn binding peace, no coin); conquest memory for the outcome.
- `packages/sim/src/clients.ts`: `subjectObjection`, `subjectTerms` (no subsidy,
  three coin tribute per hearth, thirty turns) and `imposeClient`, which creates
  an ordinary rules-22 bond.
- `packages/sim/src/simulation.ts`: rules-39 command schema with the five-outcome
  `resolveCapture`, historical refusal of a pending rules-39 decision, siege
  reconciliation after a subject resolution, and the capturer-only `unavailable`
  explanation on the observed decision. Save version 39 with an unchanged state
  shape and content seal; v38 migrates as-is.
- `packages/ai/src/conquest.ts`: subject scores 55, or 100 when the capturer is at
  war with another realm, against 100 for holding the capital.
- `apps/web/src/siege.tsx`: the "Make subject realm" control and the
  not-on-offer explanation.
- `packages/test-fixtures/src/conquest-fixture.ts`: `subjectCampaign()` founds a
  second rival hearth from an authored caravan by ordinary command, so Reedwatch
  is a capital with a realm behind it.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log) after removing an unused import from the retained replay script) |
| `pnpm test:unit` | 2,281 tests / 278 files pass ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline headline-standard headline-long` | **219 / 329 / 374**, all Prosperity, 0 refused; command and event counts identical to the rules 38 runs in the Attunement packet ([log](pacing-after.log), [json](pacing-after.json)) |
| `tests/gameplay/subject-rule.spec.ts`, `conquest.spec.ts`, `diplomacy.spec.ts` | 9 passed ([log](browser.log); screenshots under [browser-results](browser-results/)) |
| `pnpm build` | pass ([log](build.log)) |

New tests: `packages/sim/src/subject-rule.test.ts` (offer conditions and the
explained absence; returned capital, imposed peace, sworn bond, tribute, pledged
hearths, exact save/replay, early renunciation; historical refusal and frozen
older quotes), the AI case in `packages/ai/src/conquest.test.ts`, and
`apps/web/src/capture-panel.test.tsx`.

## Limits and caveats

- No AI realm chose subject rule in the measured headline campaigns, so the
  outcome is proven by its fixture and real controls, not by organic AI play.
- The capturer's land policies and worker policies on the returned hearth are
  removed with the ordinary capture wording ("lost"), as for any capture.
- Transfers of hearths between patron and client, subject rule over a realm that
  itself holds clients, and AI strategy that targets capitals for the oath are
  open. A realm reduced to its capital cannot be made a subject.
