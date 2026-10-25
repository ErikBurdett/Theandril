# Settlement registry browser, save and image review

**No scoped blocker found in the final production journey or its retained artifacts.** This reviewer authored the fixture and browser test. The following decoding is a fresh read-only check of the actual downloaded artifacts, with independent canonical replay and command reconstruction; it is not an independent review of the test's design. Parent and separate source-review work remain distinct.

## Executed scope

The first production invocation passes three cases in 31.5 seconds: the new settlement journey (20.6 seconds), existing group charters and existing charter templates ([log](browser.log)). A separate existing army registry journey passes in 12.0 seconds, 13.0 seconds overall ([log](army-regression.log)). The first command's plural army filename did not select that existing singular-named test; this was corrected by the separate run and is not counted as four tests in the first invocation.

Review found that the always-visible filter explanation occupied substantial space on the narrow screen. The parent moved it into a collapsed native disclosure, with the production test now opening and closing it through focused Enter keys and verifying its actual explanation. The final new journey passes in 20.3 seconds, 21.3 seconds overall ([log](browser-final.log)). These runs cover four distinct production scenarios, with the new scenario executed twice. They are local production-build tests, not live deployment results or performance benchmarks.

The final journey uses public import, registry, search, sort, paging, checkboxes, existing group charter controls, export, manual save and reload. It uses no development API. Thirty authored own hearths, 128 companies, two wars and retained event history supply the scale context. The fixture is explicitly synthetic and does not establish organic mature-empire acceptance.

## Exact artifacts and canonical replay

The [review script](export-review.ts) reopens the three final downloaded archives through the strict production persistence loader and runs canonical replay. [Final results](final-export-review.json) and [log](final-export-review.log) retain exact paths, byte sizes, hashes, source identities and checks. The initial run's [review](export-review.json) and [log](export-review.log) remain intact; final replay hashes, record counts and cohorts match them.

| Checkpoint | Hash | Records | All / empty / unchartered / waiting |
| --- | --- | --- | --- |
| Filter/search/page/selection/inspector browsing | `503329a2` | 30 | 30 / 24 / 10 / 5 |
| Explicit six-charter application | `bb648af6` | 36 | 30 / 24 / 9 / 0 |
| Manual save, page reload and restoration | `bb648af6` | 36 | 30 / 24 / 9 / 0 |

The thirty setup records revoke ten charters, raise fifteen ceilings and pay for five guard queues, after a disclosed from-save baseline. The browser adds exactly six accepted rules-35 `setCharter` commands, in stable actor order: `settlement.65` and `settlement.90` through `settlement.94`, all Muster with ceiling 24. Five were the waiting cohort; the sixth was a checked, queued, unchartered hearth outside the displayed filter. A fresh journal resumed from the browsed export and given those six commands matches the changed export's entire state **and archive**. Restored state and archive match the changed export exactly. Gzip byte identity is not claimed.

Every settlement, faction, army, route, posting and patrol is unchanged across the deliberate charter application. All six existing queues remain; treasury stays 3,940 and the turn stays 2. No queue was purchased by the charter change itself, and no automatic turn or AI action was suppressed. The displayed next candidate is an observation at the present budget, not a purchase promise under the shared treasury. Canonical cohort counts were recomputed from observation without using the new UI projection helper.

## Native image review and approval

All four final PNGs were opened with `view_image`, as were the four first-run PNGs. [Image review and provenance](image-review.json) records each exact path, dimensions, bytes and SHA-256. No transform, resize, re-encoding or generated image was used.

The desktop capture shows actual four-coin Muster blockers on checked rows and the pending six-hearth action. Its Works focus field is an unsubmitted form value, not the row's saved charter. The final 390×844 / 130% text capture shows the selected filter, accessible collapsed explanation, sort controls and **6 hearths selected · 1 outside this filter** in the scrollable window. The final result capture shows cleared checks and **Next candidate: Cinder plate cohort** under the new 24-coin Muster policy. Adjacent rows are partially visible at scroll boundaries; no claim is made that all thirty rows fit onscreen.

The approved publication candidate is the exact final native locator capture `settlement-order-selector-native.png`: **340 × 71, 7,683 bytes**, SHA-256 **`bd8cf64276d7176b3159b8e85f621370fe347c42a999f54af565cd0b79e554c0`**. Its bytes are unchanged from the first run. It is approved only as a clearly captioned control detail: closed **Settlement orders → Charters waiting (5)** at 390px / 130% text, before the explicit charter application, in an authored thirty-hearth fixture. Other option values, help, selection context and command results are outside this crop. The broader technical evidence proves those separately. Final publication layout/caption inspection remains a separate review step.

No new rules, schema, AI policy, pacing result, whole-world memory result or release-gate acceptance follows from this bounded registry workflow.
