# Shared patrol points through ordinary commands

The existing bounded group patrol request now also accepts `setPatrol`. Every
assignment shares two endpoints and the war-pause option. Each army retains its
own existing enabled state; a new policy starts enabled. Pause/resume requests
still require a common enabled choice. Assignment never silently truncates a
selection above 128 actors.

The worker validates the whole envelope and reviewed hash before the first
command. Canonical simulation decides ownership, explored endpoints, army
composition and the 128-policy realm cap for each actor in stable ID order.
Accepted actors leave the checks; refusals remain. Existing response correlation,
one final publication, autosave and recovery behavior apply unchanged.

The form explicitly describes replacement: canonical `setPatrol` resets the next
target and attempt metadata. Existing travel and postings are preserved and keep
priority. The common war option replaces each assigned policy's setting; it is
not inferred from a mixed selection. No new rules, saved fields or AI decisions
are added. The existing eight-route-attempt turn budget remains authoritative.

See [implementation evidence](../development/2026-10-25-group-patrol-assignment/README.md).
