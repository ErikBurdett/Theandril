# Independent retained live-evidence review

Reviewed 24 October 2026 using retained local evidence only. No new network requests, browser runs, builds, deployment actions or application edits were made for this review. The reviewer authored the readback script and dispatch earlier; this closeout independently checks the parent's recorded execution, identities and final captures, rather than treating those authorship roles as independent implementation review.

**No blocking inconsistency found in this publication evidence.** The published revision is `04d17762033bd5d0978a117b592272e1b72ec62f`; the dispatch and roadmap implementation/evidence source remains `dee74cf9c4e2d153f9c5f5cfdbd9221798205481`. The captured-hearth patrol retirement work is subsequent local development and is not part of this deployment or its 38 live journeys.

## Identity and exact assets

[actions.json](actions.json) records both Verify build ([40150411660](https://github.com/ErikBurdett/Theandril/actions/runs/40150411660)) and Publish development demo to Pages ([40150411653](https://github.com/ErikBurdett/Theandril/actions/runs/40150411653)) completed successfully at the full publication SHA above. [deployment.json](deployment.json) agrees. These workflow records supply deployment identity separately from the build-generated ledger.

The [final live readback](live-readback-final/readback.json), recorded at `https://erikburdett.github.io/Theandril/` from 01:26:17–01:26:25 UTC on 25 October (24 October locally), has `passed: true` and the same newest ledger revision. All 20 retained comparisons have HTTP 200, equal local/live byte counts and equal SHA-256 values: four HTML documents, thirteen built JS/CSS assets including game and simulation worker, provenance JSON and both new native PNGs. This verifies equality with the comparison build at execution time; it is not an independent build attestation and must not be reinterpreted against the later local candidate dist.

Dispatch 14 is `patrol-orders`, “Keep the watch moving.” Its source and all eleven evidence links use the exact `dee74cf9…` implementation pin. Both published image bytes retain their reviewed hashes: patrol `38df829cf4c7b985246d87b23a50cf80d1a85c6da9cebe357b180c2063c7b56a` and posting `05c1821de0906a53b9a88a1916f71b5e42b6ff084fc3881704e8c1dfbd9c1253`. Provenance records 3,473,083 journal-image bytes within the explicitly approved 3,670,016-byte inventory budget.

## Journeys and catalogue

I independently parsed the passed journey identities from [local-pages.log](local-pages.log) and [live-pages.log](live-pages.log), retaining each filename, source location and title while removing execution duration. Both ordered lists contain exactly 38 matching identities and equal [live-pages-identities.json](live-pages-identities.json). Live completion is 38 passed in 1.9 minutes. These are the same journeys executed in two environments, not 76 distinct acceptance cases. The new retirement journey is absent, as expected.

The readback's 23 roadmap records independently sum to 86 delivered and 49 remaining acceptance points, with 6 completed, 13 in progress and 4 pending items. All 15 release gates remain open. Publication, a successful build and these scoped journeys do not close pacing, browser certification or overall 1.0 acceptance. The readback itself only reaches production game setup without development hooks; campaign acceptance comes from the separate journey log.

## Retained failure and favicon classification

The [first local readback](local-readback/readback.json) and [first live readback](live-readback/readback.json) still record `passed: false`. The initial local console report lacked a URL; [favicon-diagnostic.json](favicon-diagnostic.json) subsequently identified Chromium's automatic origin-root favicon request through console location and CDP. The initial live run records the exact URL `https://erikburdett.github.io/favicon.ico`, outside `/Theandril/`, with the empty HTTP/2 reason phrase `404 ()` instead of local `404 (Not Found)`.

I checked the current script's classification: it requires a subpath deployment, the exact same-origin `/favicon.ico` URL and one of those two complete observed error messages. It retains that diagnostic separately and leaves all other console errors, page errors, failed requests and HTTP errors subject to failure. Final live evidence retains this one scoped diagnostic; its other error arrays are empty. This is documented classification of an observed browser request, not a claim of literally zero console output or a general 404 suppression. The failures were not overwritten or relabeled. [readback-review.md](readback-review.md) preserves the chronology and script hashes; its future-tense statement about the final rerun is a historical handoff, superseded by the final result here.

## Native visual inspection

I opened the actual [1440×1000 live dispatch capture](live-readback-final/live-dispatch.png). Dispatch number, title, posting/patrol/recovery summary, chapter links and release limitations are legible. The introductory summary explicitly says player travel does not resume itself and all fifteen gates remain open. No visible horizontal clipping or overlapping text appears in this viewport.

I also opened the actual [390×844 article capture at 130% text](live-browser-results/gameplay-updates-readable-journal-at-390px-and-130-text/reader-chapter.png). The “When the danger has passed” chapter wraps within the reading surface and remains legible; its 284-elapsed-turn wording and preserved turn-58 recovery context are visible. This is a scrolled chapter viewport, not a complete article capture. The desktop PNG hash is `87ee9caa997a497217f218577965ee8a80765c0b62bbd35570d30325f3594c5e`; the narrow PNG hash is `ed269e20b47616d335f531ffccf513ceabc11750c68216f8bff9aab39776e884`. Neither was transformed for review.

## Local continuation boundary

At review time the retirement changes in `packages/ai/src/patrol-recovery.ts` and `patrols.ts`, plus `tests/production/patrol-retirement.spec.ts`, are local modifications. Their separate candidate browser evidence is in [the retirement packet](../2026-10-24-patrol-retirement/browser-review.md). Those new outcomes must not be attributed to `04d1776`, the public dispatch, the retained live byte comparisons or the 38 public journeys. No deployment or release acceptance is inferred for that continuation.
