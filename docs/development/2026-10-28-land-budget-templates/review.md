# Independent land commission template review

Reviewed 2026-10-28 against baseline `7c003a0`. Reviewer: delegated `land_template_review` agent, separate from implementation and browser execution. Applied the repository core, UI scale and QA/release skills. This reviewer made no implementation edits and ran no tests; its only authored file is this review.

## Verdict and remaining verification

No blocking code or visual findings in the reviewed personal template slice. The code keeps personal preferences separate from campaign state, and the supplied initial browser results support recall without orders, explicit paid application, persistence across campaigns, deletion isolation and storage recovery. This is approval of the reviewed scope, not acceptance of the full 1.0 release gates.

The initial browser run passed both journeys on their first attempt in 14.1 seconds ([log](browser-initial.log)). After that run, the parent added a native MutationObserver assertion to the main journey: a real template update must briefly disable the previously enabled Apply land commissions button and registry land-status filter, then both must re-enable. I reviewed the assertion at lines 55–72 of `tests/production/land-policy-templates.spec.ts`; its rerun is **pending** at this review revision. It does not alter production code. The initial pass and captures must not be represented as execution of this added assertion.

## Code review

- **Persistence:** the bounded, separate `theandril-land-policy-templates` database has strict record validation, explicit native database version rejection, a 24-template cap and transactional writes. Names are trimmed, bounded to 40 code units and checked for case-insensitive uniqueness. Coin amounts must be nonnegative safe integers. Unknown improvements, extra campaign fields, malformed rows, future database versions and oversized libraries fail closed without silently rewriting or deleting existing records. Returned records are detached and ordered consistently. Capacity and name checks occur inside write transactions.
- **Canonical ownership:** template CRUD and recall issue no simulation commands. Recall only fills the existing improvement, allowance and reserve form; the player must explicitly Apply land commissions. Existing command validation and payment rules remain authoritative. Templates are browser preferences across campaigns and are not included in campaign saves, exports or archives. No canonical schema, content, simulation rule or replay change is introduced.
- **Async lifecycle and recovery:** the session serializes operations, ignores stale replies after replacement and defers database closure until an in-flight operation settles. A successful write followed by a failed refresh is distinguished from a failed write, so retry refreshes without replaying the mutation. Initial storage failures are visible and retry opens a fresh connection. Unmount cleanup does not cancel an already started write.
- **Shared pending lock:** command and template work aggregate through separate pending flags, including synchronous submit protection. The template child receives command/external busy state rather than its own pending flag, avoiding a self-lock. Registry and outer-window wiring propagate pending state to shared selectors and commands. The additional real-browser observer is the outstanding execution check described above.
- **Compatibility and layout:** historical snapshots without land policies continue to omit the feature. Native selects, inputs and buttons retain labels, keyboard behavior, wrapping and minimum control height. Unit tests were read for persistence edge cases and session failure/unmount behavior; this reviewer did not independently execute them.

## Native capture review

All three PNGs below were opened individually with `view_image` at original detail. These are supplied native browser captures; this reviewer did not generate, resize, composite or otherwise transform them. No new artwork is part of this slice.

| Capture | Native size and condition | Visual assessment |
| --- | --- | --- |
| [Desktop](browser-results/production-land-policy-tem-623e6-ves-exact-saved-work-intact/land-budget-template-desktop.png) | 1440 × 1000, default text scale, restored second campaign | The expanded library shows the saved choice, 75/12 budget, editable name and all four actions clearly. Browser-only/save-exclusion copy and the recall message distinguish personal settings from explicit orders. Apply remains visible beneath the library. The form's earlier fields are above the scroll position; this is a scrolled panel capture, not evidence that every field fits simultaneously. |
| [Narrow with 130% text](browser-results/production-land-policy-tem-623e6-ves-exact-saved-work-intact/land-budget-template-narrow-130.png) | 390 × 844, 130% text scale | Actions stack vertically with readable labels. Recall has a clear focus outline and is fully inside the panel. Name, instructions and recall feedback wrap without horizontal clipping. Content above and below the viewport is accessed through the panel's vertical scrolling; the capture intentionally centers Recall. |
| [Storage recovered](browser-results/production-land-policy-tem-92d96-ers-without-campaign-orders/land-budget-storage-recovered.png) | 1440 × 1000, default text scale | The zero-budget template is selected and saved successfully after recovery. Status explicitly reports that no commission orders were issued. Zero selected hearths and disabled Apply agree with the displayed permission calculation. The native controls and text remain readable. This depicts recovery, not the earlier error state. |

The narrow evidence records Recall at x=47, y=458.03125, width=296, height=44, wholly inside the scrolling body (x=11, y=127.890625, width=368, height=705.109375), with document horizontal overflow 0. Screenshot review supports this measured result; it does not establish every possible control state or expanded native select popup.

## Actual behavioral evidence

The [main JSON](browser-results/production-land-policy-tem-623e6-ves-exact-saved-work-intact/land-budget-template-evidence.json) comes from two ordinary UI-generated campaigns: seed 20260905, tiny, short, two realms, no city-states, each followed by founding and Food worker orders. No campaign fields were authored for this journey.

- First campaign hash before/after template editing and recall: `4ec9a777` → `4ec9a777`.
- Second campaign hash before/after recall: `703dc2ff` → `703dc2ff`.
- Explicit application paid 22 coin from the 75-coin allowance with reserve 12 and added exactly one campaign command. Paid and restored hashes both equal `2ab90c95`.
- Template UUID `207d172c-4de2-4975-9956-0c0b2924a8ec` is excluded from the campaign. The journey also compares complete serialized state and archive contents, reconstructs the expected ordinary command and replays the archive; the short state hashes alone are not the equality proof.
- Deleting the personal template preserves the paid campaign state/archive, and save/reload preserves the work while leaving the template deleted. The [restored export](browser-results/production-land-policy-tem-623e6-ves-exact-saved-work-intact/land-budget-template-restored.theandril) is retained.

The [storage JSON](browser-results/production-land-policy-tem-92d96-ers-without-campaign-orders/land-budget-storage-evidence.json) covers a deliberately injected `SecurityError` only for personal-template `indexedDB.open`; campaign IndexedDB remains native. The journey restores access and explicitly retries, then saves a zero-budget template. Before/after campaign hashes are both `c4e42f4b`, with zero added campaign orders. This is a scoped fault-injection recovery test, not evidence of an organically failing browser database.

Limits: Chromium production journeys only; generated early one-hearth campaigns rather than a mature empire; no cross-browser/native popup assessment, long campaign pacing measurement or full release acceptance. Existing simulation rules are consumed, not newly verified by this UI review. Screenshot inspection establishes the shown layouts, while the browser assertions provide the campaign/replay evidence.

## Exact reviewed file digests

SHA-256 values at review time. The production test digest includes the added observer whose execution is pending; initial capture digests refer to the earlier successful run.

```text
fb3345e53ee17ee0de424ea2224eec8ecd4e07627dbed0023df06f8ff630316b  packages/persistence/src/land-policy-templates.ts
8258c0e9b6cecc927c013baa5cffd55c7f11f59b7833ffd855ab1e87d400f105  packages/persistence/src/land-policy-templates.test.ts
4569c83977101b341bc145813b8a877d21913f6c264b99ae0706225395238ffd  packages/persistence/src/index.ts
7bd97ea1d11d2d9cc0384302791347e3b5246ada3850f14e622e507c15c74289  apps/web/src/land-policy-templates.tsx
a95af28bba5a560b0d8ff935c4a0e1b432f0dd19d8445048de03025edec60231  apps/web/src/land-policy-templates.test.tsx
4fc2cff69ae4f470d18d33949650037106b9d52f04f7321d79e6a7ff32f3cc60  apps/web/src/land-policy-templates.css
65e95d09edc9be7f02062864ce65839a41f9ff343367deb940a5f99813e55401  apps/web/src/group-land-policies.tsx
3b0e57f890003391556399e70dce5fd7157565d3a5be4052082207180b99c9be  apps/web/src/realm-navigation.tsx
00a37d303a447b8d2823c31ee4041c486356a644ead8614c6961541ee58468f2  apps/web/src/realm-windows.tsx
dc2847d2c8cbbfd622b8b9f87d1d68687745dd31e265da11042ee4f8bc9a9398  tests/production/land-policy-templates.spec.ts
```

Artifact basenames below uniquely identify files linked above:

```text
4268c4d405ab25cc55d3b53ec93cc75458f010f73e49197183d64d08c68f3638  land-budget-template-desktop.png
178e0fa0bc7f73adcdbdb10380234a5c990d06a8fba14c7a15835cdb1fce82a5  land-budget-template-narrow-130.png
86b62c3f965ff0995b098bebc1663186059dea767d15fa514810794c1eead87d  land-budget-storage-recovered.png
9d3ccf095d42b2efae24bb9c3a1308219abc48869bf231c6bf11b4c0b1d9d6aa  land-budget-template-evidence.json
f78257d3efe66db2263f0797755cc8bc97aa346abf9e05a213a96a3ae30c7f37  land-budget-storage-evidence.json
3c121cad1c63af20c17064e50f54b64cde692ce0c263298105c6596677ca7914  land-budget-template-restored.theandril
```

## Addendum: shared-lock execution confirmed

The parent supplied the completed [shared-lock browser run](browser-locked.log), and this reviewer read the log: both production journeys passed on their first attempt in 13.2 seconds. The main journey now executes the reviewed native MutationObserver assertions around a real Update template operation: previously enabled Apply land commissions and registry land-status controls both become disabled, then both re-enable. This resolves the pending browser verification noted above; no runtime code change was required.

Fresh SHA-256 of the executed production test is `dc2847d2c8cbbfd622b8b9f87d1d68687745dd31e265da11042ee4f8bc9a9398`. This matches the assertion-bearing source already recorded in this review, whose execution was pending at that time. The storage implementation/tests, template UI and group land-policy source hashes were also rechecked and remain unchanged from the review table. The three original native captures remain the reviewed visual evidence; their layout is unchanged by the added assertions.

The broader final suite was still in progress when this confirmation was written. This addendum claims only the two completed template journeys and does not attest to unrelated fixes or an unfinished full-suite result. This reviewer ran no tests and changed only this review file.
