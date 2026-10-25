# Final sustained-policy browser review

The [first-round review](browser-review.md) is retained as a historical checkpoint. This review covers the extended maintained-siege candidate.


The final maintained-siege candidate passes **4/4 production cases** in [browser-final-fixed.log](browser-final-fixed.log). Its 17.0 seconds is execution metadata: outcome-only pacing overlapped this functional run, so it is not a speed measurement. [browser-final-evidence.json](browser-final-evidence.json) pins the inspected source bytes and all retained artifacts. No development hook is present; the player uses the real peace form and End turn, while Watch uses actual Step one round controls. Both Watch branches advance five full rounds from turn 27 to 32. Every intermediate export replays exactly, and the final manual save/reload preserves the complete archive and canonical hash. All 100 commands across the four retained branches were accepted.

| Branch | Recorded rounds | Records | Final state and hash |
| --- | ---: | ---: | --- |
| Player real incoming offer | 1 | 4 | paused 4/5, `0446e522` |
| Player no offer | 1 | 2 | paused 4/5, `e9ea15d5` |
| Watch recorded initial offer | 5 | 52 | completed 5/5 after actual mutual withdrawal; Ashen prosperity victory turn 32, `05df1656` |
| Watch no initial offer | 5 | 42 | actual occupation cancels project at 4/5; no victory, `634e090b` |

Both Watch archives keep the project paused at 4/5 and Reedbound's own siege through turn 31. The fresh turn-30 Ashen proposal is rejected: sequences **36→37** in the initial-offer branch and **27→28** in the no-initial-offer branch. Neither archive contains an accepted peace or Reedbound peace proposal. War remains and no treaty releases the siege.

The fifth round has meaningful, different combat outcomes. Initial-offer Watch issues assault **50**, autoresolves at **51**, and records actual mutual withdrawal and siege lift before end turn **52**. Ashen then legitimately completes its project. No-initial-offer Watch assaults at **39**, autoresolves at **40**, occupies Ledger Hearth at **41**, and advances at **42** with the project cancelled. These outcomes match the retained ordinary-command diagnostic; the test does not grant a defender win or weaken the combat result. A successful policy decision does not guarantee battlefield victory.

### Retained harness failure

[browser-final.log](browser-final.log) and `browser-final-results` preserve the first extended run: **3 passed, 1 failed**. The incoming Watch branch reached its legitimate victory, automatically opened Campaign chronicles, and the dialog intercepted the test's Export menu click. I inspected its [native failure screenshot](browser-final-results/production-project-counter-2690b-tion-with-an-incoming-offer/test-failed-1.png), which visibly shows the chronicles and its explicit partial-history notice. The correction clicks **Close campaign chronicles** after victory and after loading the victory save. Runtime code, timeouts and gameplay assertions were unchanged. The failure trace and fourth-round export remain retained.

### Final native image review

I opened the final Watch incoming desktop and both new narrow outcome images. The remaining final images hash-identically match the already inspected first-round native captures; all hashes and byte lengths are retained in the final evidence JSON.

- [Incoming Watch desktop](browser-final-fixed-results/production-project-counter-2690b-tion-with-an-incoming-offer/project-paused-desktop.png) shows the turn-28 public paused project, canonical siege explanation and contested hearth. Its original 1440×1000 bytes remain `36f967017f21e3020c729a3a4db111e1c22f05cab5e0bdd15a4d252b947ed291`.
- [Incoming Watch final narrow outcome](browser-final-fixed-results/production-project-counter-2690b-tion-with-an-incoming-offer/project-outcome-narrow.png) accurately reads **Completed · 5/5 Active Turns**, while the realms remain at war. SHA-256 `005bd0939f1e45b1a7d01504bd43b1a70243e7f5bb1a77b8b98000bdea80972e`.
- [No-initial-offer Watch final narrow outcome](browser-final-fixed-results/production-project-counter-35437-ption-with-no-initial-offer/project-outcome-narrow.png) reads **Cancelled · 4/5 Active Turns** with the canonical conquered-or-razed explanation. The archive establishes occupation specifically. SHA-256 `40f91bc0b8a13e9df9b52c77cf01f0ff319c1fcb9c795bdd094395e84afad74e`.

Both narrow views are original 390×844 at 130% text. The Ashen observer identity, project state, explanation where applicable and Locate project control remain readable without horizontal overflow. These are scrolled Realm affairs viewports, not full-page captures or independent proof of history. No image transform was applied. No blocker remains for these four tested journeys; general counterplay, campaign pacing acceptance, release gates and publication remain separate.
