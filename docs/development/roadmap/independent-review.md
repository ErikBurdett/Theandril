# Independent development-site review — 2026-09-12

**Verdict: APPROVED for the reviewed roadmap and development-helper scope.** No open findings remain in that scope. Both games retain their pre-1.0 status; publication, live deployment verification and broader release acceptance remain the integrating maintainer's responsibility.

The independent reviewer inspected both implementations, their navigation and build integration, source/evidence contracts, canonical status/scope documents, regression coverage and retained browser images. Theandril gameplay claims were reconciled against `fcae402da6c290b93a9a6933510c74538477ad04`; Hearth & Card claims were reconciled against `841cd943c49ea136479fa8bc9f45411322c54c62`. The reviewer made no repository changes and did not run a duplicate full test suite.

- **Factual/editorial review:** completed labels describe bounded implemented behavior. Theandril's 23 checkpoints keep all 15 canonical release gates open and preserve the second-harbor AI findings, archive costs, missing systems and final proof obligations. Hearth & Card accurately states 640 cards, 18 prepared recipes and 20 visitors using 14 reviewed visual families; duel simplifications, simple AI, provisional balance, device coverage and scope decisions remain visible. Later ideas are identified as proposals. Neither roadmap introduces new gameplay scope or a completion percentage.
- **Code and delivery review:** separate static HTML entries and deployment-base URLs support the existing GitHub Pages project paths. The helper modules do not import the simulation or game-save services. Status labels and symbols supplement color; native search, buttons/selects and disclosures retain keyboard access. Source and commit messages render as escaped React text. Hearth & Card generates the GitHub checklist from the site's catalogue and its change ledger from full first-parent history, with shallow-history rejection and full-history workflow checkout.
- **Finding closed — Theandril P2:** same-document Back/Forward originally restored the URL without restoring React filters. `Roadmap.tsx` now registers and removes a `popstate` listener that restores filters and the linked item. Restored item evidence opens, while explicit stage/gate fragments retain their destination. The owner reproduced the failure before the correction; the new browser regression covers Back/Forward counts and a removed/restored item.
- **Maintenance finding closed — Hearth & Card:** evidence validation now uses `item.sourceRef ?? baseline`, matching the actual source-link resolver and validating future item-specific revisions.
- **Visual review:** inspected Theandril's 1440px desktop and 390px/130% text roadmap top and expanded-item captures. The final narrow top capture is byte-identical to the inspected earlier capture. Inspected Hearth & Card's retained desktop overview and narrow roadmap screenshots; materials, illustration caption, heading wrapping, status wording and reading order are clear, with no visible clipping or overlapping content. The illustration is accurately captioned as the current tavern artwork.
- **Verification attribution:** Theandril's implementation owner reports the corrected, rebuilt production Pages suite passing **27/27 in 43.4 seconds**, including all seven roadmap journeys and actual-game production checks. The Hearth & Card integrating maintainer reports the production Pages suite passing **4/4**, including the 360px/200% heading-wrap correction. These are owner-run results; this review independently inspected code and retained pixels. They do not establish physical-device or cross-browser release certification.

Retained visual evidence is under Theandril `docs/development/roadmap/screens/` and Hearth & Card `docs/screenshots/development-overview-desktop.png` / `development-roadmap-mobile.png`. The Theandril roadmap work packet may record this scoped independent code, factual and visual approval; its final publication record remains separate.

Selected reviewed source postimages (SHA-256):

| Project / path | SHA-256 |
| --- | --- |
| Theandril `apps/web/src/updates/Roadmap.tsx` | `624a7d7281c569607cd222447de498b4aa0b5e867da9f31a7f86cafdbe7f64a3` |
| Theandril `apps/web/src/updates/library.ts` | `793f457789915f8f2bc5514558efac6a987dd0a54c2f46af7c9bf9b4eb82e6cf` |
| Theandril `tests/gameplay/roadmap.spec.ts` | `60b33b080576f58f043201e71eae29a341a46e42b25b599706091fef65bf5d4c` |
| Hearth & Card `src/development/DevelopmentApp.tsx` | `20150b9120d67b9d46a13fe82e0a48351214a1b4717f13ad728f322b3f676e8e` |
| Hearth & Card `src/development/roadmap.ts` | `632837e03cabb6598e51ede4e5e764f6fb313aec826b9a7d2d47b1abf4866b65` |
| Hearth & Card `src/development/roadmap.test.ts` | `fc7099c3648923d82830061ee4718f7cd816ee120d7688496e1f16494765d01f` |
| Hearth & Card `scripts/development-data.ts` | `45f3642bd1cfde517bffbe3e12ed4352be6c90717d53b742ec3b6afff18692ef` |
