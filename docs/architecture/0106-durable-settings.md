# ADR 0106 — Durable client settings

**Status:** accepted, 2026-11-01. Web client only; no rules, save or content
change. Evidence:
[`docs/development/2026-11-01-durable-settings/`](../development/2026-11-01-durable-settings/README.md).

## Context

The empire-management roadmap asks for durable settings and the browser
gate for text scaling and reduced motion. The text scale was a session
choice lost on every reload; motion followed the system preference only;
the action shortcuts were the one setting the client kept, through a small
validated loader.

## Decision

- **One settings record**, `theandril.settings.v1` in the browser's own
  storage: the text scale (100, 115 or 130 percent) and a Reduce motion
  choice. It is read once on start through a loader that validates every
  field and falls back to the defaults, and written on every change; a
  storage that cannot be read or refuses to write is reported in Campaign &
  settings rather than failing silently.
- **Reduce motion** sets a data attribute on the application that turns off
  every animation and transition, whatever the system preference says; the
  system preference still applies on its own as before.
- **Not campaign state.** The simulation, the saves and the chronicle never
  see the settings; they belong to the browser the player reads with.

## Consequences

- No pacing, chronicle or save effect; the unit, build and the new journey
  cover the change.
- Other preferences — fog colours, non-colour cues, keyboard workflows
  beyond the shortcuts — remain session-only or unbuilt.
