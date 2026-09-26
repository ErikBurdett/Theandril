# Initial exact-readback helper correction

The full live production suite had already passed **30/30**. A subsequent
standalone readback helper passed the exact commit ledger, article/source link,
public PNG byte equality and historical article checks, then failed its roadmap
assertion: `body.innerText` did not contain the literal `24` while the evidence
details were collapsed. The visible roadmap renders that material behind its
normal disclosure; the helper had not opened it.

The helper now follows the existing `?item=empire-management` permalink, checks
that its evidence disclosure opens, and asserts the full delivered-template
sentence inside that item. No application code, timeout or release assertion
changed. The corrected helper's result is retained in `live-readback.json`.
