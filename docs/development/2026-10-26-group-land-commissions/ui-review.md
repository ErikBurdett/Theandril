# Group land commission UI implementation review — 2026-10-26

This is the UI author's source review, **not independent visual approval**.
Independent review and actual production browser captures belong to the parent
integration packet. No claim is made here about displayed screenshot pixels.

## Implemented boundaries

The form maps checked owned hearths to ordinary `setLandPolicy` commands. It
uses the existing amount parser, rejects invalid/unsafe whole coin amounts and
refuses selections over 128 without truncation. The selection bound is an action
batch limit, not a realm-size or simulation cap. Removal operates independently
of the unsubmitted form and only includes current owned commissions.

The allowance is explicitly per hearth. An exact BigInt display prevents rounded
aggregate permission when each valid safe-integer allowance sums beyond Number's
exact range. The form states replacement, not addition; no escrow; immediate
payment in stable hearth order; the reserve applies to the shared treasury and
is not multiplied; other orders may still spend it. Accepted means the policy
was set, not that work began. Ordinary simulation remains the only legality,
quote and payment authority.

The form and registry propagate pending locks to selection, siblings and the
roster window. The worker response determines which checked hearths are removed
from selection; refusals remain for review. Receipt pages retain all rows with
at most 25 displayed. Current registry facts use a memoized map of permitted
policy metadata and only render on the settlement tab; there are no all-hearth
detail queries or price calculations.

## Verification and retained correction

[Focused tests](ui-tests.log): **25 tests / three files pass**. This covers the
new six-case form/mapping suite, shared receipt cases and registry regressions;
it is not the full repository suite. [Typecheck](ui-typecheck.log) passes.
The scoped diff whitespace check also passes.

[Initial typecheck](ui-typecheck-initial.log) found three authored observed-policy
fixtures missing the required `blocker: null`, plus a possibly-undefined fixture
access. These test-only typing defects were corrected. The same concurrent run
also found a transport test's widened command literal; its owner corrected it.
No production schema or assertion was relaxed. The initial focused tests had
already passed because Vitest transpiles without performing TypeScript checks.

Browser keyboard, 390px/130% text, real shared-purse payment, receipt interaction
and restore/worker interruption coverage are required in parent integration;
these static tests do not substitute for those journeys.

## Source hashes

| Path | SHA-256 |
| --- | --- |
| `apps/web/src/group-land-policies.tsx` | `fa9f6c8d555b047e009077c0aa134d920f88346a17267115261d9b737ff816e2` |
| `apps/web/src/group-land-policies.css` | `804be628c5b358852df0b7608a2d480b59a41f0f763787f4782cbf1f54478da0` |
| `apps/web/src/group-land-policies.test.tsx` | `33c3c0a48a832eb3ffcc9c7c3f24549ae076deb057baee6fce7c8992ef58e9c4` |
| `apps/web/src/realm-navigation.tsx` | `cc572efc119e8bb309fd7588a268c47d54dd51ce5c5366bc1e67861d64d6ca3b` |
| `apps/web/src/realm-windows.tsx` | `00a37d303a447b8d2823c31ee4041c486356a644ead8614c6961541ee58468f2` |
| `apps/web/src/group-policy-results.tsx` | `500342b5cc2a86c25f3f1bee4e01596bae4a0480915fca0ee2e0777ef55b4cd6` |
| `apps/web/src/group-policy-results.test.tsx` | `f3ce558028ccf1574b8b5231d1170a083a8bebdce4534160f0cca504200417da` |
