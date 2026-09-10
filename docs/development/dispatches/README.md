# Theandril Dispatches delivery record

This tranche adds a public developer journal at `/updates/`, built and deployed with the game. It is a development-demo publication, not 1.0 acceptance.

## Delivered surface

Three illustrated, source-linked dispatches cover R17 campaign safety, R02 archive durability, and the twenty-four-culture baseline. The journal includes a searchable/filterable archive, stable story query links, chapter navigation, image enlargement, documentation library, explicit scope/deferred-work ledger and contributor guidance. It reuses owned Hearth & Card materials and four cropped game screenshots with source provenance. No new game artwork or gameplay rules were introduced by the journal.

Authoring instructions: [contributor contract](../../updates/CONTRIBUTING.md), [work packet](../../updates/TEMPLATE.md), [content structure](../../updates/STRUCTURE.md). Substantial future work should include an evidence-backed dispatch; scope expansion must remain an explicit decision rather than an inferred 1.0 requirement.

## Verification records

- `frontend-evidence/REPORT.md`: original implementation, root/subpath browser coverage and visual evidence.
- `parent-evidence/`: combined build, full suite, Pages production game/journal journeys and parent pixel review. Preserve the initial parallel failure separately from the later complete serial pass.
- `review/integration-final.verdict.json`: twelve-file integration approved independently, with exact retained patch and postimage hashes.
- `review/journal-original.verdict.json`: original failed journal review, preserved.
- `journal-fixes/`: bounded RED/GREEN fixes for featured revision, revision/path validation and takeaway search. Final independent delta verdict is separate.

The existing epic chronicle test timed out in the first parallel suite and subsequently passed standalone and in the complete serial suite without increasing its timeout. This is a timing-margin caveat, not performance certification. Existing AI findings and overall 1.0 release gaps remain open and visible.

Validation regenerates `assets/art/reports/` from existing specifications. Those generated report changes are outside this journal publication and must not be swept into its commit. The original user checkout, its preserved oversized trace and user port 5173 remain outside the release worktree's modification scope.

## Publication boundary

Publish the reviewed release-worktree commit to remote `master` using normal fast-forward ancestry, preserving the historical checkpoint objects used by evidence links. Both CI workflows fetch history for those object checks. The Pages suite explicitly collects the journal journeys along with existing production game checks. A successful local build or push is not successful deployment: verify the exact remote commit, Pages workflow/deployment, actual hosted bundle and live game/journal before announcing publication. Record remote verification separately from this pre-publication record.
