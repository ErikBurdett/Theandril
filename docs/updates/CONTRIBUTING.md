# Contributing a Theandril dispatch

The public [developer journal](https://erikburdett.github.io/Theandril/updates/) is our illustrated review surface for substantial chunks of work: what a player can now do, what a developer changed, what actually passed, and what still stands between this build and 1.0.

It complements—not replaces—[implementation status](../IMPLEMENTATION_STATUS.md), [the agreed 1.0 scope](../../GAME_1_0_SCOPE.md), [objective release gates](../../DEFINITION_OF_DONE.md), and [architecture decisions](../architecture/). Source and review evidence remain in Git. This is not a second roadmap with looser completion rules.

## Authoring workflow

1. Start a work packet in the same branch as the implementation. Use [the template](TEMPLATE.md). Keep unreviewed work in draft; do not describe a proposal or a draft as delivered.
2. Maintain the journal's structured content under `apps/web/src/updates/`, following the existing entry's types and validation. Reuse components; a new update should be a content addition, not a bespoke page rewrite.
3. State the exact source revision and rule/save/content versions relevant to the work. Link specific repository evidence, not an unrelated latest-green badge. Preserve published historical entries rather than silently changing their claims to match later work.
4. Give each major change a player-facing example, a developer explanation, evidence, and remaining limitations. Separate real organic campaigns, authored regression fixtures, browser journeys, and visual/art reviews.
5. Add owned, reviewed imagery to `apps/web/public/updates/` only when needed. Prefer existing published art and real screenshots. Retain the original source path, hash, capture settings or generation metadata, and any crop/encoding transform in the imagery provenance record. Inspect the final displayed pixels. A screenshot is illustration, not proof of an entire release gate.
6. Update the scope ledger and links to the canonical scope/status documents. The [public roadmap](https://erikburdett.github.io/Theandril/updates/roadmap/) is the current structured view of that same ledger, maintained as `roadmapItems`, `roadmapStages`, `roadmapGates` and `roadmapSnapshot` in `apps/web/src/updates/library.ts`. Keep stable item IDs; update status, delivered behavior, remaining acceptance and immutable source evidence together. Mark only bounded, verified checkpoints **Completed**; use **In progress** for partial systems or open review, and **Pending** for a missing system or final proof. Gate status remains separate from checkpoint completion. Reconcile the snapshot with implementation status, the accepted scope and all named release gates whenever it changes. Explicitly identify additions, cuts, deferrals, and unresolved defects. A declined idea is not a new 1.0 obligation.
7. Run the checks below and obtain independent review of both code and factual claims. Verify keyboard operation, narrow screens, text scaling, image captions, deep links, back navigation, empty search, and the real deployment subpath.
8. Publish only with explicit authorization. `master` automatically deploys the game and journal together through the existing Pages workflow. After publication verify the exact GitHub commit, Actions results, the public journal, and the public game. Deployment success is not 1.0 acceptance.

## Required editorial contract

- **Why it matters:** explain the player's problem before implementation details.
- **Delivered changes:** concrete behavior, not effort or an inventory of files.
- **Examples and images:** genuine evidence or clearly labelled authored illustrations; never fake gameplay screenshots.
- **Developer notes:** canonical authority, affected packages, compatibility, performance tradeoffs, and reproducible commands.
- **Verification:** source-linked results, exact scope, date/revision, and failures. Do not add overlapping test counts together.
- **Scope delta:** what changed relative to the agreed scope, with the decision and rationale. Explicitly say when no new gameplay scope was added.
- **Road to 1.0:** which named gates this advances and what is still unverified. No invented percentage, launch date, or claim that a green smoke test clears a whole gate.
- **Contributor handoff:** actionable next work and source locations, without exposing credentials, private conversations, or machine-specific secrets.

Keep headlines and introductions readable for players. Put deeper technical notes in the article—not in an unreadable hero or an endless wall of badges. Use Hearth & Card's restrained wood, parchment, brass, and serif vocabulary; do not turn this into a generic SaaS dashboard.

## Verification commands

```sh
pnpm typecheck
pnpm lint
pnpm content:validate
pnpm test
pnpm art:validate
VITE_BASE_PATH=/Theandril/ pnpm build
pnpm exec playwright test --config playwright.pages.config.ts
```

The Pages suite covers the actual multi-page production build; the usual gameplay suite remains an independent gate. On this Arch workstation the installed Chromium can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. CI installs its locked Playwright browser. Do not disguise a missing browser as a product failure.

To review the built journal locally, run `VITE_BASE_PATH=/Theandril/ pnpm --filter @theandril/web exec vite preview --host 127.0.0.1 --port 4175 --strictPort` and open `/Theandril/updates/`. Stop that preview before running the Pages suite, which owns its own server. Keep the user's existing development server untouched.

## Public release checklist

- [ ] Content matches the reviewed source revision and live scope documents.
- [ ] Historical, current, authored, and organic evidence are distinguished.
- [ ] Known failures and costs are visible alongside successful checks.
- [ ] No invented features, counts, approvals, launch dates, or completion percentages.
- [ ] Drafts are not presented as published work.
- [ ] All images have accurate captions, provenance, and inspected final pixels.
- [ ] Internal routes work under `/Theandril/` and `/`; repository links resolve.
- [ ] Reader interactions, keyboard, narrow layout and text scaling pass.
- [ ] Independent review and normal code/art/deployment checks are recorded.
- [ ] Authorized publication is read back from GitHub and the public URLs.
