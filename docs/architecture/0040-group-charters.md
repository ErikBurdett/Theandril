# Group settlement charters

Date: 2026-09-24. Extends [group postings](0039-group-postings.md) within ACT-32/M3.

## Decision

The settlement registry applies an existing charter policy to at most 128 owned
hearths per request. The player chooses the existing Works, Wealth, Learning or
Muster focus and a per-work ceiling. Selection is temporary UI state, independent
of army selection and retained across registry tabs, search and 25-row pages.
Named saved templates and durable named groups remain unfinished scope.

The form explains that assignment spends nothing immediately. Existing queues
remain intact; each charter can buy one work when its queue is empty after
upkeep, under its own ceiling and the shared 40-coin treasury reserve. Revocation
uses each existing charter's ceiling, so an invalid unsubmitted grant value
cannot prevent revocation. Registry rows expose observed policy and blockers.

## Authority and transport

`packages/sim` retains the unchanged `setCharter` command, rules/save 31 and content
`015468d1`. No new canonical state or AI behavior is introduced. The worker
shares batch envelope validation and recording with group postings, while
keeping the existing posting protocol compatible. It validates the entire
1–128 array, current seat, command kind, unique subject IDs and canonical command
schema before mutation. Valid commands execute in stable subject-ID order.

Each command is recorded normally, including canonical refusals. One final
filtered observation and cell delta is published, with separately measured
charter result bytes. Refused hearths remain selected with their actual reason;
accepted hearths leave the selection. This sequence is not atomic.

An exception after mutation stops the sequence and returns the actual partial
state with a recording error. The UI applies the observation before settling
the request and requires saved-campaign recovery. Missing or unreadable responses
also settle pending work and lock further orders. Both batch types mutually
exclude one another and ordinary commands while pending; worker replacement,
load/import and unmount reject the relevant pending promise.

## Cost and evidence

The worker publishes once instead of once per selected hearth. Existing sim
commands still perform their normal bounded charter lookup and recording; this
is not a new simulation performance claim. The registry still scans the current
permitted read model and renders at most 25 entity rows. No world cells enter
React state.

An authored 40-hearth worker comparison retains exact serial/batch archives,
replay and hash `e204a0e9`, unchanged queues/treasury/fog, and save restoration.
Measured response payloads are 193,929 versus 7,409,845 bytes, one versus 40
responses. Single-run timings illustrate that fixture only. Browser evidence
separately uses 40 owned hearths and 100 owned armies on the Legendary fixture.
See [the verification record](../development/2026-09-24-group-charters/README.md).

No pacing measurement is needed for this command transport and UI change:
canonical rules, prices and AI decisions are unchanged. Combined mature-empire
delegation, theaters and remaining production/governor policy depth still need
development and release acceptance.
