# Draft dispatch — Remember a posting policy

Publication state: **draft, local only**. Proposed stable slug:
`posting-templates`. Base revision `d06ba4b`, with the uncommitted source files
listed in this packet. Rules/save 34 and content `015468d1` are unchanged.

## A familiar order, a fresh destination

A realm's standing orders often repeat: hold where each force stands, or gather
and join at a hearth. The registry now keeps named posting policies beside its
existing group controls. Save the policy once, recall it for another checked
group, and choose Post selected armies when the destination is ready.

The personal library survives browser reloads and campaign changes. It keeps
the hold/join choice and whether the destination is each army's own position or
an owned hearth. A hearth template asks for a fresh hearth each time it is
recalled, so a useful order cannot accidentally inherit a target from another
map. Choosing a template in the list does not recall or apply it.

The same safety now applies when a selected hearth becomes unavailable: the
form asks for a new choice instead of silently posting every army where it
stands. Clearing an existing posting remains available without a new target.

## One hundred armies, ordinary orders

The authored Legendary example contains forty owned hearths, one hundred owned
armies and four thousand armies overall. It recalls “Hold every position,”
then applies one hundred ordinary posting commands. The campaign hash and worker
traffic stay unchanged until that explicit application. Manual restoration and
an exported archive reproduce the applied state, with all one hundred orders
in the replay. This fixture demonstrates the controls at scale; it is not an
organically grown empire or proof of frame-time performance.

Illustration: [desktop registry](browser-results/posting-templates-a-recall-f7dd5-s-saved-recovery-and-replay/posting-templates-desktop.png).
Caption: “The recalled policy awaits an explicit order for one hundred checked
armies.” Alt text: “Posting template library in the realm registry, with Hold
every position recalled and a Post selected armies (100) button.”
These are native Playwright pixels, with no crop, resampling or generated art.
The [image manifest](images.json) records capture paths, dimensions and hashes.

## The library and the campaign

Templates are personal browser preferences, outside campaign saves and exports.
The twenty-four-entry limit and strict versioned records bound storage work.
Transactional writes protect duplicate names and the capacity limit across
tabs. Denied, corrupt or newer storage produces an error while preserving stored
rows and leaving ordinary posting controls usable. Retry creates a fresh
connection.

Active postings remain canonical simulation state. Their ordinary travel
priority, individual overrides, refusals and history behavior remain unchanged.
No AI policy, campaign price or save schema changes in this slice.

## Evidence and remaining work

The [local work packet](README.md) records exact command results and
[independent source and image review](source-review.md). This draft must be
reconciled with the final source manifest and integration results before public
publication. Its screenshots illustrate the new controls, not a release gate.

This advances the existing `empire-management` catalogue item and ACT-32/M3;
it adds no gameplay scope and removes none. Posting policies are the first
reusable army-order template type. Multi-step army programs, patrol and escort
roles, broader governors and organic mature-realm acceptance remain unfinished.
All fifteen release gates remain open; DH-021's campaign pacing issue remains
open. Gates I and E gain scoped workflow/recovery evidence, not whole-gate
acceptance.

Next contributor task: complete a bounded patrol or escort order with visible
interruption reasons, ordinary human/AI command use and saved continuation.
Preserve direct-order priority and measure any effect on headline campaigns.

## Publication handoff

The shipped journal type accepts only `publication: 'published'` and explicitly
keeps drafts under docs/work branches. This draft therefore leaves the current
published catalogue pinned to its September evidence. Upon authorized
publication, add the reviewed dispatch to that existing journal, update the
same `empire-management` delivered/remaining fields, pin source and imagery,
and run the Pages-subpath and live checks. Do not create a parallel roadmap or
claim that this local checkpoint is deployed.
