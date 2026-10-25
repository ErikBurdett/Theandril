# Patrol native screenshot review

Date: 2026-10-24. Reviewed the native browser captures below by opening the actual
PNG files. The reviewer authored the UI, so this visual inspection is not an
independent implementation review or a release-gate approval.

## Evidence and findings

- [Desktop, 1440 × 1000](browser-results/patrols-the-last-of-one-hu-18a76-at-desktop-and-narrow-sizes/patrol-desktop.png):
  the selected army is Travel company 100; the enabled 7704 ↔ 7706 patrol shows
  its actual next target. Endpoint fields, shortcut selects, checked war policy,
  all three action buttons and cancellation guidance fit within the orders
  window. No text overlaps a control or extends beyond the window.
- [Narrow endpoint controls, 390 × 844](browser-results/patrols-the-last-of-one-hu-18a76-at-desktop-and-narrow-sizes/patrol-narrow-points.png):
  both numeric inputs and selects remain inside the content column. Status and
  help text wrap, the checked policy remains visible, and the close control stays
  within the window. The longer policy explanation continues below the viewport,
  using the window's existing vertical scrolling.
- [Narrow actions after scrolling, 390 × 844](browser-results/patrols-the-last-of-one-hu-18a76-at-desktop-and-narrow-sizes/patrol-narrow-actions.png):
  the complete war-policy explanation, Update patrol, Pause patrol, Remove patrol
  and route-cancellation guidance are visible with no horizontal clipping. The
  following depot and army-composition sections remain separated and readable.

No blocking visual defect was found in these captures. The ordinary form is long
on a narrow screen and requires vertical scrolling; the paired narrow captures
show the endpoint and action portions, rather than claiming the entire form fits
at once. These are an authored mature-state company selection, not proof of an
organically developed campaign or all viewport/text-scale combinations. Static
captures do not prove keyboard behavior, command acceptance, recovery or replay;
those remain the gameplay and production test assertions and execution logs.

The first gameplay lifecycle now additionally edits the war checkbox on an
already paused patrol and observes both the saved true option and preserved false
enabled state before its existing turn/resume/recovery sequence. The retained
[browser policy log](browser-policy.log) records the revised case passing in
13.3 seconds (14.0-second run). That result is separate from this screenshot
inspection and does not establish broader release acceptance.

## Frozen source consistency

The final default-false candidate source was rechecked without runtime changes.
The form issues public commands, initializes the war option from the observation
or false, and keeps paused state when updating. Status and endpoint ownership
come from the observation; historical observations without patrols show no form.
Registry and attention maps filter to owned patrols. Healthy enabled patrols
suppress generic idle attention while observed failures remain actionable;
paused patrols release that suppression. Existing hunger, paused-route, posting,
mission and siege priorities remain in the surrounding attention flow. No
blocking source integration finding was identified. This is still a check of
self-authored UI, not independent implementation approval.

The three native captures above were already opened and inspected in the earlier
pass and were not redundantly reopened. SHA-256 identities recorded in the final
pass:

| Source or capture | SHA-256 |
| --- | --- |
| `apps/web/src/patrols.tsx` | `1ca0e76b5dd50e97223d24cb02dbdf6f33c62e83cf81149971a7f450696de123` |
| `apps/web/src/next-action.ts` | `a488e8764739866e7fd457f9bb033fbdf78b5576353d37459af2cf650025bfae` |
| `apps/web/src/realm-navigation.tsx` | `3c4cae8d259c136b6a32c79415b582d4b7ba88ef65f6edc63290a532949bd089` |
| `apps/web/src/map-management.tsx` | `56015e8a03d2f888f93e898cd044b95739e7ce3645176df78cb0dbd158f874e7` |
| `tests/gameplay/patrols.spec.ts` | `e8ca3b57e03a1ca1ac29e861f6bb6dbf6b22481d14aec7e1fb6700165be84481` |
| `patrol-desktop.png` | `5ac3eb387aba7b81b97d4e3451faec23a8c5e4dfd60561f49ffda6d8fc7643ae` |
| `patrol-narrow-points.png` | `22c08979811986b10d17c7287ae0292c9e1f25f7029bb0bd892d27157ac4bb39` |
| `patrol-narrow-actions.png` | `38df829cf4c7b985246d87b23a50cf80d1a85c6da9cebe357b180c2063c7b56a` |

The parent owns final pacing and production verification. Neither the source
hashes nor these captures establish those results.
