# Acceptance boundaries

- Canonical state: unchanged rules/save 37, content 015468d1. Presets contain no
  faction, hearth, campaign, current quote or generated-state fields.
- Personal persistence: separate database/table, version-one strict records,
  unique names, atomic caps, corruption/newer-version refusal, no hidden repair.
- Spending: save/update/choose/recall/delete never issue commands. An explicit
  group Apply still submits the existing setLandPolicy command with a reviewed
  hash; exact quote selection, immediate payment and subsequent work stay in sim.
- Recovery: browser-store denial is reported and explicitly retried. A write
  that succeeded before a failed library reread is disclosed and not repeated.
  Store disposal waits for pending operations, with stale mounts ignored.
- Scale and accessibility: lazy library, bounded 24-row reads plus one overflow
  sentinel, 44px controls, native keyboard and narrow 130% layout. Library limits
  are personal preference capacity, not campaign or hearth limits.
- Verification: generated production campaigns, exact archives and paid work;
  separate storage-fault journey; shared busy-lock observation; existing group
  commission and registry regression journeys; full local suite and Pages build.
- Limits: no preset sync/import/export, no automatic cultivation or funding
  priority rule, no organic mature-realm/whole-browser-matrix acceptance. Existing
  releases and personal stores remain untouched.
