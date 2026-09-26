# Charter templates browser evidence

The first coordinated development-browser run passes **16/16 journeys in 1.8 minutes**. [browser-final.log](browser-final.log) preserves the clean result; [browser-initial.log](browser-initial.log) is the identical original log. There were no failing browser attempts. This is four new template journeys plus twelve affected charter, posting and registry journeys, not the complete gameplay suite or a frame-time measurement.

The four new cases use real UI controls and the actual worker:

- The authored Legendary fixture has forty owned hearths, one hundred owned armies and 4,000 armies overall, generator 4 and seed 20260905. A manual production queue is paid through the canonical command before import. Save, rename/update, recall, reload and delete template actions leave the campaign hash and worker-transfer totals unchanged. The real export retains the original hash, contains no template name and has no post-import command records before explicit Apply. Its earlier authored setup is the imported origin, not invented archive history.
- After reload and manual campaign restoration, choosing a saved row leaves the form alone; keyboard Recall fills Learning/32 without applying it. Apply then assigns forty ordinary charters through one final worker packet. Treasury, manual queues and explored knowledge stay unchanged at assignment. A one-hearth override leaves the other thirty-nine policies intact, and manual load restores the exact prior hash. Deleting the template leaves all forty saved charters intact and remains deleted after another browser reload.
- Persistent preference-storage denial shows an error and disables template edits. Retry still fails honestly. Existing manual charter assignment remains available and succeeds.
- A one-time preference-database open denial recovers through Retry in the same mounted panel; the restored connection can save a real template. A separately authored malformed row fails closed on initial read and retry, remains unchanged in IndexedDB, and does not prevent ordinary charter commands. Only the preference database is faulted; campaign storage and worker commands are real.

The transient-denial case exercises the reviewed fresh-connection correction. The earlier cached-Dexie-open issue was reproduced by the independent storage reviewer before this browser run; it is not presented as a failed browser run here. No timeout or gameplay assertion was relaxed.

## Exact captures

[Screenshot provenance](screenshots/provenance.json) records tested source hashes, viewport, scenario and full command. The exact PNGs were inspected directly: controls and storage disclosure are readable, the narrow document has no horizontal overflow, and the keyboard focus ring remains visible on Recall. The full screenshots show a naturally scrolled registry; they are not staged new-game views.

| Capture | Dimensions | Bytes | SHA256 |
| --- | --- | ---: | --- |
| Desktop viewport | 1440 × 1000 | 497,781 | `8c10b548d99a54cade011f9594cdcc77b1fbf7f86335b19b225032509e76b6c2` |
| Narrow viewport | 390 × 844 | 140,582 | `84fe25141b07ba4d6cf39ea75e0241674026f77000208e6df567db4cd7b45e6d` |
| Open template controls | 318 × 724 | 81,322 | `c13d1faf13474cd790dee991d426c51e82c0a9d2ea7970470585a144529cccea` |

The small image is a direct Playwright screenshot of `[data-testid="charter-templates"]`, taken at the 390px viewport after keyboard recall and before explicit Apply. It has no post-capture cropping, resizing, re-encoding or pixel editing. The three images remain in evidence; publication selection and its image-budget check are separate.

## Production boundary

The new production journey is collected separately and awaits the parent's completed production build and reserved browser window. It starts a generated Tiny/two-realm campaign with zero city-states, founds a hearth normally, saves a browser template, starts another campaign, reloads its manual save, recalls and explicitly applies the template, then proves narrow revocation and saved restoration. It does not use development hooks. Production execution and any publication or live readback must be recorded after they run.
