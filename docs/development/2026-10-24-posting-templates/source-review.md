# Independent posting-template review

Review date: 2026-10-24. Base revision: `d06ba4b`; implementation is local,
uncommitted work. Reviewer owns this report only and did not author the store,
panel or browser tests.

## Source verdict

No blocking correctness finding in the reviewed implementation or inspected
browser evidence. Desktop, narrow and 130% text-scale controls pass the scoped
visual review, including the complementary lower-panel capture requested during
review. Full-suite and built-production runs pass. No review request remains
open for this slice; this is not release acceptance.

Reviewed `apps/web/src/group-postings.tsx`, `posting-templates.tsx`, their focused
tests, `packages/persistence/src/posting-templates.ts` and its tests, the package
export, and the new gameplay/production journeys. Inspected the existing
registry and `main.tsx` reset boundary to confirm campaign replacement unmounts
the posting form.

- Preference payloads contain UUID, name, arrival mode and destination policy,
  with version and normalized-name metadata in stored rows.
  Strict input/row schemas reject campaign identifiers, concrete coordinates and
  unknown fields. The new database is separate from campaign, production and
  charter stores; UUID generation does not enter deterministic campaign state.
- Bounded checked reads precede all mutations. Read/write transactions serialize
  duplicate-name and capacity decisions across connections. A malformed or newer
  library is refused without rewriting it. Returned values are detached.
- Selecting a template changes the library selection. Recall changes only the
  posting form. A hearth recall clears the previous concrete target; a current
  position recall explicitly chooses each army's current hex. Apply remains an
  ordinary bounded group of canonical `setPosting` commands.
- Missing targets disable new postings and expose an accessible explanation.
  Clearing a posting selects each current army hex independently of that form,
  so a missing target cannot prevent revocation.
- Storage actions capture the current form before awaiting. A panel session
  rejects overlapping operations, lets a started transaction settle after
  unmount, and prevents late replies from installing into a new session. Retry
  creates a fresh connection after failure. Storage failure releases the posting
  form, preserving direct orders.
- Existing campaign reset closes the registry and increments its React key.
  Campaign replacement therefore discards local army selections and concrete
  destinations while keeping the deliberately separate personal library.
- No new simulation, AI, worker protocol, campaign schema, per-turn or per-frame
  path is introduced. This is a reusable posting-policy slice, not patrol,
  escort, tactical programming or completion of the broader M3 milestone.

## Review follow-ups

The first review requested a direct regression for a selected hearth becoming
unavailable. Resolved: the form now calls `groupPostingDestination`; the focused
test removes a previously selected hearth from its permitted choices and proves
the result is unresolved, not a local hold. It also retains explicit current
position and numeric cell zero. `destination-regression.log` records five passing
checks in that file. This is a presentation regression, not an organic conquest
journey or an independently retained failing-before run.

The reviewer also asked for cross-campaign reuse evidence before seeing the
finished production specification. That specification creates a second
campaign, saves/reloads it and explicitly recalls/applies the retained template.
In addition, the passing gameplay journey imports two ordinary-command starts
with different seeds and hearth coordinates. A retained hearth template clears
the second campaign's target, does not alter its hash/traffic, leaves existing
postings clearable and applies only after selecting that campaign's own hearth.

## Evidence inspected

The parent-owned `focused-tests.log` records 19 passing checks across three
files. These results were read, not independently rerun. The focused lifetime
tests cover transaction completion after unmount, overlapping actions, stale
sessions and retry. Persistence tests cover strict validation, detached values,
reopen/delete, two-connection races, capacity, invalid/future/oversized records,
transaction rollback and storage denial.

`browser.log` records ten passing journeys in 56.2 seconds, including the six new
template scenarios plus existing group-posting and recovery cases. Assertions
cover no-order/no-transfer preference actions, invalid library preservation,
fresh connection retry, canonical application to 100 owned armies, saved
restoration and exported archive replay. These are authored fixture and browser
results, not organically played empire or full-campaign pacing evidence.

Native PNGs inspected with the image viewer:

- `browser-results/posting-templates-a-recall-f7dd5-s-saved-recovery-and-replay/posting-templates-desktop.png`
- `browser-results/posting-templates-a-recall-f7dd5-s-saved-recovery-and-replay/posting-templates-narrow.png`
- `browser-results/posting-templates-a-recall-f7dd5-s-saved-recovery-and-replay/posting-templates-controls.png`
- `browser-results/posting-templates-posting--ea085-quire-a-fresh-hearth-choice/posting-template-fresh-destination.png`

The desktop library, saved row, form, explicit Apply and disabled-action states
are readable. At 390px the controls stack vertically; text wraps without
horizontal clipping or overlapping controls. Apply follows the expanded library
below the narrow viewport and remains reachable by scrolling, as exercised by
the browser journey. The fresh-destination capture shows the unresolved-target
message, disabled Post and visible keyboard focus on Recall. Captures are native
Playwright output without pixel edits.

`full-tests.log` records 2,162 passing checks across 268 files in 60.69 seconds
with four workers and unchanged test time limits. Typecheck, lint, content
validation and production build logs are green; content remains `015468d1`.
The build retains its large-chunk advisory. These are parent-run results read
by the reviewer, not duplicated independent executions.

`production.log` records two passing built-bundle journeys in 7.8 seconds.
They cover generated starts without the development debug API, cross-campaign
template reuse, reload, explicit application and manual restoration. The new
journey also sets 130% text scale at 390px and operates Recall using the keyboard.

The normal production narrow screenshot is readable. The initial 130% locator
capture, `production-results/posting-templates-producti-66f94-rders-and-saved-restoration/production-posting-templates-text-scale.png`,
is clipped by the containing scrollable modal: Delete and the status are below
its captured viewport, and a blank dark strip follows the bottom window edge.
This is an evidence limitation rather than a reproduced runtime defect. Review
requested a complementary native viewport capture after scrolling the lower
controls into view; the initial capture should remain as upper-panel evidence.
Resolved by `production-text-results/posting-templates-producti-66f94-rders-and-saved-restoration/production-posting-templates-text-scale-actions.png`:
at 390px and 130% text, all four template actions, the recalled-policy status,
explicit Post and Clear controls fit the scrolled modal without overlapping or
horizontal clipping. The test checks Delete's complete rectangle against the
modal viewport, clicks it, verifies removal from the library and verifies that
the two active postings remain clearable. `production-text.log` records this
updated journey passing in 5.8 seconds for the run. The earlier clipped capture
is retained; no runtime CSS change or image editing was needed. Non-Chromium
engines remain unverified.

The transfer-evidence-only browser rerun passes in 20.1 seconds. Its retained
`posting-template-transfer.json` records one final publication of 4,401,207 bytes
and a reported 1.9ms command duration on the authored Legendary fixture. These
are a single existing-batch sample, not a new turn/renderer or sustained-memory
performance claim. The added file write changes test evidence retention only.

Architecture decision 0047 and the work packet match the inspected boundaries
and correctly keep ACT-32/M3 and all release gates open. The dispatch is explicitly
local/draft, labels the 100-army fixture as authored, avoids an organic pacing or
frame-time claim and preserves the existing published catalogue. No gate or
publication is approved by this scoped review.
