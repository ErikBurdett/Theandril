# One posting for a hundred armies

## Identity and publication boundary

- Stable proposed slug: `group-postings`; planned public edition **06**.
- Publication state: **draft; awaiting the implementation commit and final evidence**. The user has authorized publication, but this draft is not a shipped catalog entry.
- Implementation revision: **not yet pinned**. The parent will commit the reviewed implementation before this article or its images enter the public journal.
- Campaign rules/save remain **31** and content remains **`015468d1`**. This work does not change simulation or AI rules, canonical state, historical formats or pace prices.
- Existing scope: **ACT-32**, within empire management and coordinated-order work. This is a bounded way to issue existing postings, not completion of theaters or empire automation.

## Candidate article

A hundred armies should not require a hundred trips through selected orders to receive the same standing instruction. The army registry now lets the player check land armies ashore, choose a destination and apply a posting to the selected group. It keeps the existing 25-row pages. Selections survive paging and search changes, and the panel states how many selected armies are outside the current filter. A player can select matching armies across those pages, up to a disclosed limit of 128 per request. That limit does not cap the realm's armies or canonical postings.

The destination can be where each army already stands or an owned hearth. On arrival, each army can hold its hex or attempt to join the force there. These remain individual standing postings under the ordinary movement and joining rules. Existing direct travel orders take precedence, stalled postings keep their normal explanation, and the player can override a single army afterward. Clearing the selected postings removes those instructions while leaving selected armies without a posting alone. The group selection itself is a temporary interface choice; the resulting standing orders are saved campaign state.

The results are explicit. Accepted armies leave the selection, while refused armies remain selected with the simulation's reason so the player can inspect or correct them. One refusal does not cancel orders already accepted or prevent later valid armies from receiving their postings. The interface does not predict its own version of army legality. It presents available choices and submits the existing commands to the simulation.

The implementation also avoids asking the worker to publish a full campaign summary after every checked army. One bounded request contains ordinary `setPosting` commands. The worker validates the entire transport envelope before applying the first command, orders the commands by stable army ID and records every accepted or canonically refused order in the ordinary journal. It publishes one final state with an outcome for each completed order. This is a sequence of recorded commands, not an atomic transaction. If recording itself is interrupted after a mutation, processing stops, the actual partial state is returned and the player must restore a saved campaign before continuing. The interrupted command is not mislabeled as a normal refusal.

A retained worker-harness example compares 100 grouped postings with the same commands issued separately. It transfers 531,302 bytes, including 3,725 result bytes, instead of 51,416,921 bytes, and publishes one state response instead of 100. Both paths produce the same archive and hash `e43b0ca7`. The observed durations in that one local sample are 10.97 and 686.40 milliseconds. These are synthetic harness timings including structured cloning, not browser frame-time distributions or a claim that whole campaigns run that much faster. The final summary still contains the existing army read models; the gain comes from avoiding repeated publication.

The authored browser journey uses a large realm fixture with 100 owned armies, forty owned hearths and 4,000 armies in the world. It checks selection across pages and searches, submits one hundred hold postings, overrides one army to join, clears the group and restores the original posted state through the normal save controls. It also checks that selecting armies leaves canonical state and worker-transfer totals unchanged, and that submitting the group produces one final transfer without changing explored knowledge. A separate boundary fixture exercises a partly refused group at the existing posting limit. Final passing results and the actual desktop and narrow captures must be attached before publishing this paragraph as verified delivery.

This advances the accepted UX and order-management work without adding a new release obligation or cutting scope. Broad theater planning, patrol behavior, reusable order templates, coordinated attacks and reinforcement still need implementation and proof. The change provides a practical tool for issuing existing orders together; it does not establish the full strategy or giant-realm usability gate. All fifteen release gates remain open.

## Source and evidence handoff

The relevant implementation is `apps/web/src/group-postings.tsx`, `realm-navigation.tsx`, `group-posting-requests.ts`, `protocol.ts`, `simulation.worker.ts` and their integration in `main.tsx` and `realm-windows.tsx`. [Architecture decision 0039](../architecture/0039-group-postings.md) records the command boundary, partial outcomes, interrupted recording, transfer accounting and the synthetic worker sample.

The earlier focused handoff reports **12 worker transport checks**, followed separately by **two request-ledger checks**, plus a **nine-check UI/registry run**. Keep those execution scopes distinct; do not add them to a later full-suite count or describe overlapping executions as additional coverage. The parent is retaining final typecheck, lint, headless and browser results. This draft does not claim those pending checks have passed.

The browser source is [group-postings.spec.ts](../../tests/gameplay/group-postings.spec.ts), with adjacent registry and standing-posting journeys for regressions. Early failing attempts remain diagnostic evidence while the final run is pending; do not use a screenshot from a failed attempt as proof of the completed journey.

## Planned imagery and final publication work

Use the real `group-postings-desktop.png` and `group-postings-narrow.png` outputs only after the parent retains and inspects the passing browser run. Preserve exact source pixels with no cropping, resizing or re-encoding. Their provenance must record the implementation revision, source path and SHA256, viewport, fixture seed, the authored realm/army counts, capture command and the interaction stage shown. Captions must say that the large realm is an authored regression fixture, not an organically developed empire. No public image or source revision is invented by this packet.

Before adding edition 06 to the shipped catalog: resolve the implementation commit; reconcile the article's claims, exact final test results and worker metric sample with committed evidence; add reviewed image copies and provenance within the existing journal image budget; run focused catalog checks and the production-subpath reader journeys; obtain independent factual review; then have the parent perform the authorized publication and public readback. Preserve edition 05 and all earlier dispatches at their original source pins. Only bounded current roadmap delivery should change; theater, patrol, template and integrated release acceptance remain open.
