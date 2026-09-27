# Group travel deployment and tracker preview review

27 September 2026. **Pass: the retained deployment/readback evidence is consistent,
and the concrete tracker preview has the intended narrow scope.** No blocking
finding. Tracker application is a subsequent guarded action; this note does not
claim that a preview has already been applied or that development deployment
completes M3 or a release gate.

The reviewer did not execute deployment, the live Pages suite or the tracker
helper, and did not author that tracker helper. The reviewer authored the initial
live-readback helper and the implementation worker/benchmark; those authorships
limit independence accordingly. The parent corrected and executed the readback.
This review read retained files and helper source, recomputed local hashes and
reconstructed the proposed tracker documents without writing them. No network
request, browser rerun, benchmark or tracker mutation was performed.

## Exact publication and retained verification

[Deployment metadata](deployment.json) records publication P2
`7dfe0c6a587e019eeec2501d21d212928f6e0918`, with implementation/article evidence P1
`3b0918999a166f36f6f3d51fbcb49413de549163`. Both retained workflow records are
completed/successful at exactly P2: **Verify build 36297841535** and **Publish
development demo to Pages 36297841548**. This is review of the retained workflow
records, not a new independent GitHub API query.

The final [headless publication run](publication-tests.log) passes **2,000 tests
in 250 files, 53.68 seconds**. The [local Pages run](publication-pages.log) passes
**33 journeys in 1.0 minute** and the [live Pages run](live-pages.log) passes the
same **33 in 1.4 minutes**; the live generated group-travel journey takes 6.8
seconds. The helper checks file/title identities, not merely totals. These
overlapping runs are not summed. The earlier affected runs still comprise
**23 distinct journeys: 21 + 6 − 4**, and the article correctly retains its P1
headless result of 2,000/250 in 63.19 seconds.

The final [live readback](live-readback.json) passes with empty error,
failed-request, HTTP-error and console-error arrays. It identifies P2 as the
latest build-ledger revision, confirms production setup with no development
hooks, and matches the built HTML plus the game JavaScript, actual simulation
worker JavaScript and game CSS bytes. Workflow identity and these byte/ledger
checks are complementary; the helper does not claim an independent build
attestation or a gameplay journey of its own.

Dispatch 11 has the expected title, eight evidence links and P1 source pin.
Its exact image remains **2,337 bytes, 318 × 19**, SHA-256
`5a18a317736a6e99a2cf1dd18bef8c8175a4486e0e99a56b1f4d03fd01adfb67`.
The roadmap reconciles all **23 records**, **6 completed / 13 in progress /
4 pending**, **63 delivered / 49 remaining** acceptance bullets, P1 evidence
and the 2026-09-27 snapshot. All **15 release gates remain open**. Rules/save
remain 32 and content remains `015468d1`.

The [initial readback](live-readback-initial.json) remains a failure. Its role
locator omitted evidence links inside closed roadmap disclosures. The parent's
helper-only correction adds `includeHidden: true` to that evidence-link query;
it does not change the site or claim to open every disclosure. Record text,
statuses, links and the explicitly opened empire-management item remain checked.
The final helper SHA-256 matches the successful JSON record. Actual public UI
interaction is covered separately by the Pages suite.

## Concrete tracker preview

The reviewed [preview](tracker-preview.json) is SHA-256
`8323206fbfa1b259afba80e1a4e7768b84cd64e8ee0055688bb0408b6bf69a97`.
All three current tracker input hashes match its expected inputs. Reconstructing
only the following changes from those inputs produces exactly its proposed
output hashes:

- `actions.json`: ACT-32's `updated`, `fix` and `prompt`, plus one appended
  history entry. All prior history and other actions remain unchanged.
- `projects.json`: Theandril's roadmap `done`, `total`, `updated` and `note`,
  plus M3's `detail`. Other projects and milestone values remain unchanged.
- `issues.json`: no change.

| Proposed output | SHA-256 |
| --- | --- |
| `actions.json` | `bd28728d8cdf920a33cbdbf9b31c5d02056adf4e18cb742217460d0c7eb574a3` |
| `projects.json` | `429b92bb3fd74f895f60f32d997ecff73adc8daead7eb0357c7dc89f64cfaf51` |

The reconstructed documents preserve **ACT-32 doing**, **M3 in progress**,
**ACT-36 done**, **DH-020 resolved** and **DH-021 open**. The roadmap's 63/112
counts are explicitly editable catalogue bullets, not a fixed-scope completion
percentage. Broader governors, theaters, patrol/escort, army-order templates and
combined mature-campaign acceptance remain open. No new scope, AI/pacing result,
synchronized arrival, automatic war or whole-gate completion is introduced.

All **35 captured evidence/source/build hashes** in the preview match the local
files. The reviewed tracker helper hash is
`3853b27eb7ee335eeb07995b0294a70d4bbf6370aed141b13c65d67ad4ca8f4e`.
It defaults to preview, requires all three expected input hashes for application,
checks exact published HEAD/origin and evidence again, masks authorized fields to
reject broader changes, retains backups and replaces each output atomically.
The two-file replacement is not a single filesystem transaction; its rollback
preserves a concurrent writer's different bytes. A tracker rebuild is separately
requested with `--build`; the helper does not deploy, inventory or run the weekly
writer.

The [initial tracker-preview failure](tracker-preview-initial.txt) occurred before
mutation: the content-validation log has ordinary package-manager banners before
its JSON object. Corrected parsing allows only those banner/blank lines before
one strict JSON object and still rejects trailing non-JSON output. The original
validation evidence was not modified. The successful preview and narrow output
reconstruction support applying this exact proposal with its recorded input
guards; apply/build readback remains the parent's subsequent responsibility.
