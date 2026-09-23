# Group postings publication: factual review

**Verdict: no material factual correction required at the reviewed candidate.**
Reviewed on 2026-09-23 against implementation revision
`3ae1581089411a76ecfd08a8f5f811258c4f77f6`. This reviewer did not author edition 06,
the roadmap changes, image selection or media records. The reviewer did author
the worker transport and its tests; this is independent review of the public
presentation against retained evidence, not an independent code review of that
worker. Only this report was written during the review.

## Source and verification boundaries

The new article and current library pin the committed implementation. All **26
distinct evidence paths** used by the new article and current library exist at
that revision. The five preceding dispatches remain byte-for-byte unchanged,
including their historical source pins. The nine preceding media records also
remain unchanged.

The retained README, headless log, browser log, Pages log, screenshot provenance
and source manifest match the pinned Git bytes. All **25 source hashes** in the
implementation manifest match their files at the implementation pin. This checks
the implementation checkpoint; later publication checks are separate evidence.

The exact retained results support the article:

- **1,876 passing tests in 234 files**, with the retained run lasting 29.46s.
- **Seven affected Chromium journeys**, 42.5s: the 100-army group workflow,
  actual partial refusal, two damaged-response recovery journeys, existing
  individual postings, keyboard registry navigation and narrow realm controls.
- **27 production Pages journeys**, 30.1s, completed before edition 06 was added.
  The article explicitly distinguishes this checkpoint from the sixth article's
  subsequent publication verification. It does not claim the later production
  group-postings test or a future 28-test Pages run at this source pin.
- Typecheck, lint, content/art validation and the Pages-subpath build have retained
  passing evidence. The existing large-bundle warning and initial corrected test
  assumptions remain disclosed. These overlapping execution scopes are not added
  together or called complete browser certification.

## Behavior, authority and compatibility

The presentation accurately describes the source and exercised workflows: select
up to 128 owned land armies ashore across search and 25-row pages; choose each
army's current hex or an owned hearth; issue Hold/Join or clear existing postings.
Clearing skips armies without postings. Accepted armies leave the selection;
canonical refusals retain it. Individual orders override one member. Selection
is temporary; the normal postings survive a manual save and restore.

The request limit is a client transport bound, not a new canonical army or posting
limit. The whole envelope is checked before mutation; ordinary commands are
journaled in stable army-ID order. Individual refusals are compatible with later
accepted commands. Interrupted recording is explicitly distinguished from an
ordinary refusal: processing stops, actual partial state is returned, uncertain
application is disclosed and restore is required. The article does not promise
rollback or an atomic transaction.

The implementation diff from the preceding fleet checkpoint contains no changes
under `packages/sim`, `packages/ai`, `packages/content` or `packages/persistence`.
Rules/save remain **31** and the validated content seal remains **`015468d1`**.
No campaign prices or AI policy changed. The preceding fleet pacing remains
**234 / 342 / 379** for Standard/Long/Epic, explicitly not a new group-posting pace
measurement. No claim is made that importing an old save freezes subsequent play
under its historical rules.

## Distinct authored workloads and transfer evidence

The article correctly separates the two authored setups:

- The real browser journey imports a **Legendary** fixture with 100 owned armies,
  forty owned hearths and 4,000 total armies. Ordinary controls exercise selection,
  one hundred postings, one individual override, clearing and exact saved-state
  restoration. Its fixture is not presented as an organically developed empire.
- The actual-worker comparison uses a separate **tiny-map, 100-company** authored
  fixture and structured-clone transport shim. It compares one reversed batch,
  applied in stable order, against 100 serial requests. It checks equal archives,
  replay, unchanged observed cells, save/resume and final hash **`e43b0ca7`**.

I independently reran the single comparison with:

```sh
./node_modules/.bin/vitest run apps/web/src/worker-queries.test.ts -t 'journals 100 ordinary postings' --silent=false --reporter=verbose
```

The selected regression passed; the other 11 tests were excluded by the explicit
name filter, not disabled. The output reproduced **531,302** batch bytes,
**3,725** result bytes, **51,416,921** serial bytes, **one versus 100 state
responses**, exact archive agreement, unchanged fog, saved continuation and hash
`e43b0ca7`. This is approximately 96.8 times less transfer in that workload.

The independent sample took 11.61ms / 622.38ms, while architecture 0039 retains the
earlier 10.97ms / 686.40ms sample. The article correctly labels its earlier timings
as one synthetic worker-harness sample including cloning, not a browser frame-time
distribution or whole-campaign speedup. The exact byte counts are reproducible;
wall-clock samples naturally differ. Existing army summaries are still published
once, and the public text does not claim those summaries became individually
smaller.

The browser's empty delta is correctly described: the existing codec's empty
header costs 39 bytes, with no changed cell rows. The actual-worker test separately
checks an empty decoded delta, unchanged observed cells and no map reset. No
runtime codec change or weakened zero-row invariant was needed.

## Exact images and captions

Both public PNGs are byte-identical to the corresponding images at the pinned
implementation revision, with no crop, resize or re-encoding. Dimensions, byte
counts, source hashes and public hashes match:

| Image | Dimensions | Bytes | SHA256 |
| --- | --- | ---: | --- |
| Group result |1440×1000|616,230|`d0e3a66ceee2c4d0767b9b9e12711215bd447a5fa05aaaeb9bd942843e2de8f5`|
| Narrow group controls |390×844|140,060|`4f5410a3143b8c6fbfb099a79210db4cfe807247ed2f2fd790be8bf52f78087d`|

I inspected both images. The desktop capture visibly reports 100 orders accepted,
zero refused and zero selected, while retaining the registry's 100-army/40-hearth
counts. The narrow capture visibly shows 100 selected, the destination/arrival
fields and both posting/clearing actions after the individual override and before
clearing. The alt text and captions match those stages and disclose the authored
setup. The narrow panel's vertical scroll is visible; the browser journey tests
the controls and absence of horizontal document overflow separately.

The source `media.json` and public `updates/provenance.json` are byte-identical.
Total journal image bytes are **2,912,749**, below the existing 3MiB budget; no
budget increase is claimed. These screenshot checks do not establish browser
frame-time or release acceptance.

## Gates and remaining acceptance

All **15 canonical release gates**, including F2, remain represented and none is
marked completed. The empire-management item stays **in progress**, as do ACT-32
and M3 in the source status. Theater strategy, patrol/escort roles, durable named
groups, broader templates, settlement batches and combined mature-campaign
acceptance remain open. Army multi-selection is not described as completed empire
automation or a scope cut. Fleet logistics/pacing, multiplayer, magic, sustained
memory and cross-browser certification retain their existing limitations.

## Reviewed publication hashes

| Candidate file | SHA256 |
| --- | --- |
| `apps/web/src/updates/content.ts` | `93eb7b371648caf43169ec4f3f3a0d3bd9ba2f6649e2793fdfd26e37f6b55721` |
| `apps/web/src/updates/library.ts` | `2dd8874296bbe5a3c31cae80e77fd20684efa611590d0ccd3a01b9cc1785f0d6` |
| `apps/web/src/updates/media.json` | `1fd28d82d249468fddf9189f8a6809fef800d92cda17fb617ffab860abe23364` |
| `apps/web/public/updates/provenance.json` | `1fd28d82d249468fddf9189f8a6809fef800d92cda17fb617ffab860abe23364` |

This review does not rerun the full suite, publication layout or public deployment.
The parent owns final production-subpath and live readback checks. The source pin
describes the implementation; deployment success will not close a release gate.
