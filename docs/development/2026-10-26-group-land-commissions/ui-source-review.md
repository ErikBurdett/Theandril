# Independent group commission UI source review

Reviewer: `group_land_transport`, who authored worker transport but did not author
these UI files. Source review only; no claim of displayed visual approval.

Verdict: **no blocking finding** in the reviewed paths.

- Orders map only checked, currently owned hearths in stable ID order. Unavailable
  old-rule capability produces no form or commands. Over-limit selections produce
  no prefix. Unknown IDs and foreign hearths are filtered from the permitted view.
- Safe integer allowance/reserve parsing gates application. Removal ignores invalid
  unsubmitted input and emits zero amounts only for selected owned commissions.
  The total permission uses BigInt multiplication to avoid rounding beyond the
  aggregate safe-integer range; it is explicitly not escrow or a payment quote.
- The form explains allowance replacement, immediate spending, a reserve shared
  rather than multiplied across hearths, other spending, canonical work selection,
  retained paid work and manual/ownership interruption. It does not invent prices
  or eligibility from paged or missing land detail.
- Busy and in-flight guards prevent duplicate dispatch; current hash accompanies
  every request. The main client owns response correlation/recovery. Submitted
  names are captured for receipts and only confirmed accepted IDs clear selection.
  Failed/uncertain requests retain selection. Unmount clears parent pending state.
- Registry integrates the new pending flag into selection, navigation and other
  group actions. Commission summaries use only own observed metadata and render
  text through React escaping. Receipt lists remain paginated at 25 rows.
- No world/tile scan, worker query or canonical mutation occurs during rendering.
  The new registry policy index is memoized per observation/registry. Form edits
  filter permitted settlement/policy arrays (linear scans, bounded selected sort);
  visible rows look up a small static improvement catalogue. There is no per-frame
  work or unbounded candidate quote calculation.
- Native labels, numeric input mode, wrapping and 44px form targets are present.
  Actual narrow-width, keyboard, overflow and screenshots remain browser-review
  responsibilities; source inspection alone cannot establish them.

No UI code was changed by this reviewer.

## Reviewed hashes

- `apps/web/src/group-land-policies.tsx`: `fa9f6c8d555b047e009077c0aa134d920f88346a17267115261d9b737ff816e2`
- `apps/web/src/group-land-policies.css`: `804be628c5b358852df0b7608a2d480b59a41f0f763787f4782cbf1f54478da0`
- `apps/web/src/group-land-policies.test.tsx`: `33c3c0a48a832eb3ffcc9c7c3f24549ae076deb057baee6fce7c8992ef58e9c4`
- `apps/web/src/realm-navigation.tsx`: `cc572efc119e8bb309fd7588a268c47d54dd51ce5c5366bc1e67861d64d6ca3b`
- `apps/web/src/realm-windows.tsx`: `00a37d303a447b8d2823c31ee4041c486356a644ead8614c6961541ee58468f2`
- `apps/web/src/group-policy-results.tsx`: `500342b5cc2a86c25f3f1bee4e01596bae4a0480915fca0ee2e0777ef55b4cd6`
