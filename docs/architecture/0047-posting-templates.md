# 0047 — Reusable posting templates

Date: 2026-10-24. Local implementation; [work packet and verification](../development/2026-10-24-posting-templates/README.md).

The registry already posts up to 128 owned land armies ashore through ordinary
`setPosting` commands. Add a personal named library for the two arrival orders
(hold/join) and two destination policies (each army's current position/an owned
hearth). This is a narrow reusable-order feature within ACT-32/M3.

Keep personal preferences separate from canonical campaign state, following
[charter templates](0041-charter-templates.md). The browser/origin library stores
at most 24 templates with unique, trimmed names of at most 40 characters. It
uses a separate versioned IndexedDB database, strict record validation and
transactional capacity/name checks. Malformed or newer records are preserved
and refused; retry opens a fresh connection. It never enters campaign saves,
portable exports, command history or deterministic identifiers.

Templates contain no campaign IDs, army IDs, settlement IDs or map coordinates.
Recalling a hearth template empties the target and requires a current owned
hearth to be chosen. Choosing a library row alone does not recall it. Neither
operation changes army checks or issues orders. Explicit Post selected armies
uses the existing canonical batch, refusal handling and save/replay path.

An unavailable selected hearth must also leave the destination unresolved.
Silently replacing it with each army's current position changes the player's
intent. Clearing postings remains possible with an unresolved destination,
because cancellation does not require a new target. Ordinary travel retains
priority over postings.

No sim, AI, worker protocol, content or campaign schema changes. Rules/save 34
and content `015468d1` remain. Library work is bounded by 25 inspected rows,
including the overflow sentinel, and runs only on explicit user activity. No
new per-turn or per-frame scan is introduced. Multi-step army programs,
patrol/escort behavior and wider governor decisions remain unfinished.
