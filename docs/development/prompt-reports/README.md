# Prompt reports

One report per completed user prompt, written after all of that prompt's tasks finish. Purpose: a fast local record of what was done on the user's behalf, readable without opening evidence directories.

- Path: `docs/development/prompt-reports/<YYYY-MM-DD>-<slug>.md`, newest listed first in `INDEX.md`.
- Written from actual outcomes (commits, test results, deployments, review verdicts) — never from intent. Every count links to its log or verdict file.
- Sections: **Prompt** (verbatim or close paraphrase), **Delivered** (what a user/player can now see or do), **Changed** (paths grouped by area), **Verified** (commands, counts, independent reviews, live checks), **Not done / blocked / caveats**, **Follow-ups**.
- Distinguish: development deployment vs 1.0 acceptance; scoped test passes vs whole-suite; local vs public verification.
- Also sync the user's primary checkout (`/home/telephoneheater/Work/Theandril`) to the published commit when the prompt included publication, and note the resulting local branch state here.

These reports are local development records. They are committed with the work so contributors can see the history, but they are not the public devblog: substantial chunks of work still get a reviewed dispatch.
