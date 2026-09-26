# 0041 — Reusable charter templates

Date: 2026-09-25. Status: implemented; [verification](../development/2026-09-25-charter-templates/README.md).

Players can already apply an existing charter policy to up to 128 hearths. Repeating a preferred focus and spending ceiling should not require re-entering them each session.

Keep a bounded personal library of named charter templates in a separate IndexedDB preferences database. A template contains only its name, focus and per-work ceiling. It contains no faction, settlement, selection, target, budget allocation or standing order. It is shared by campaigns in this browser and origin; it is not part of a campaign export. Active charters remain canonical saved state in `packages/sim`.

Recalling a template only fills the group form. Applying that form still requires the existing explicit Apply charters action and its ordinary validated commands, partial refusal handling, journal recording and recovery boundaries. Editing or deleting a template never changes an active charter. No rules, content, worker protocol, AI policy or campaign save version changes.

The library holds at most 24 templates with names of at most 40 characters. Creation, replacement and deletion use transactions, validate stored records, and preserve existing data on failure. Names are unique ignoring case and surrounding whitespace. Reading malformed or unsupported data fails visibly; it must not silently reset the library or overwrite unreadable records. Library errors must leave direct charter controls usable.

Storage work is bounded by 24 records and happens only on explicit preference actions or opening the template controls. It adds no turn or frame scan, campaign query or worker transfer. Verify retained data across database reopen and browser reload, transactional failures and competing writes, plus real keyboard/narrow group application and unchanged campaign hash/worker counters until Apply.

This is one reusable policy type within ACT-32/M3. Named campaign groups, army order templates, production sequences, broader governor decisions, theaters, patrol and escort roles and mature-campaign acceptance remain open.
