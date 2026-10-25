# Group policy intent belongs to a reviewed campaign state

Posting and charter batches now carry the eight-character canonical hash of the
observation used to assemble them. The form passes that hash explicitly; the
main thread rejects it if its current hash differs. The serialized worker checks
the strict envelope and current state hash before applying the first order.

A stale or malformed request records no commands, publishes no replacement
state and requires review rather than saved restoration. Ordinary canonical
refusals remain per actor, in stable order. Existing response correlation still
requires saved restoration when command completion cannot be established.

The controlled old-worker reproduction shows that a legacy request could
overwrite a newer policy. It does not demonstrate a race during normal serialized
UI use. This change aligns the older transport with group movement and patrol
requests; it adds no simulation rules, saved fields, autosave behavior or AI work.

Evidence: [group intent packet](../development/2026-10-25-group-intent/README.md).
