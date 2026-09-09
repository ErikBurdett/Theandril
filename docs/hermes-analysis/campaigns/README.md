# Campaign audit artifacts

Read [findings.md](findings.md) first. The audit owns only this repository directory and does not change production gameplay, benchmarks, tests or release gates.

## Reproduce from the pinned repository

Working directory: `/home/telephoneheater/Work/Theandril`.
Baseline: `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`.
Runtimes and actual content/source hashes are recorded in each `runs/*/summary.json`. The recorded environment used Node26.7.0 / pnpm10.32.1.

Use **new scenario names** when generating fresh runs; do not write over retained evidence. The recorded scenarios used the following commands (their original names already exist):

```sh
pnpm exec tsx docs/hermes-analysis/campaigns/run-campaign.ts --name=repro-B74 --strategy=B --size=tiny --factions=4 --seed=74 --pace=standard --rounds=500 --midpoint=50 --max-ms=300000
pnpm exec tsx docs/hermes-analysis/campaigns/run-campaign.ts --name=repro-B99 --strategy=B --size=tiny --factions=4 --seed=99 --pace=standard --rounds=500 --midpoint=50 --max-ms=300000
pnpm exec tsx docs/hermes-analysis/campaigns/run-campaign.ts --name=repro-C74 --strategy=C --size=tiny --factions=4 --seed=74 --pace=standard --rounds=500 --midpoint=50 --max-ms=300000
pnpm exec tsx docs/hermes-analysis/campaigns/run-campaign.ts --name=repro-C99 --strategy=C --size=tiny --factions=4 --seed=99 --pace=standard --rounds=500 --midpoint=50 --max-ms=300000
pnpm exec tsx docs/hermes-analysis/campaigns/run-campaign.ts --name=repro-D74 --strategy=D --size=tiny --factions=4 --seed=74 --pace=standard --rounds=600 --midpoint=50 --max-ms=300000
pnpm exec tsx docs/hermes-analysis/campaigns/run-campaign.ts --name=repro-D99-epic --strategy=D --size=tiny --factions=4 --seed=99 --pace=epic --rounds=1400 --midpoint=500 --max-ms=600000
pnpm exec tsx docs/hermes-analysis/campaigns/run-campaign.ts --name=repro-D-sparse --strategy=D --size=standard --factions=4 --seed=748291 --pace=long --rounds=300 --midpoint=50 --max-ms=300000
pnpm exec tsx docs/hermes-analysis/campaigns/run-campaign.ts --name=repro-D24 --strategy=D --size=standard --factions=24 --seed=74 --pace=standard --rounds=300 --midpoint=100 --max-ms=600000
```

Run serially, or at most two campaigns at a time. A current baseline run that hits the documented save failures exits1 but still retains its real outcome and independently checks full replay. A wall-time bound is an audit bound, never a gameplay rule.

`run-campaign-v1.ts` preserves the first audit runner, whose midpoint load exception aborted the initial24 run. `strategies-v1.ts` preserves the excluded B pilot's mistaken optional quote access. All primary B/C runs use the corrected `strategies.ts`. The initial sparse run used runner v1; its command stream is unchanged by the later diagnostic/error-reporting improvements. The original source SHA is retained.

## Verify existing compressed evidence (read-only campaigns)

```sh
# Full replay, final loading and midpoint continuation independently.
pnpm exec tsx docs/hermes-analysis/campaigns/replay.ts docs/hermes-analysis/campaigns/runs/C-tiny4-seed99
pnpm exec tsx docs/hermes-analysis/campaigns/replay.ts docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic

# Reproduce the real bad final save while also proving its exact replay.
# Expected baseline exit1, NOT a passing save gate.
pnpm exec tsx docs/hermes-analysis/campaigns/replay.ts docs/hermes-analysis/campaigns/runs/B-tiny4-seed74-v2

# Fast exact-symptom reproducer and diagnostic stat comparison.
# This script asserts that the known failure reproduces; its exit0 means
# "defect reproduced", not "save valid".
pnpm exec tsx docs/hermes-analysis/campaigns/audit-save.ts
pnpm exec tsx docs/hermes-analysis/campaigns/audit-save.ts docs/hermes-analysis/campaigns/runs/B-tiny4-seed74-v2/final.json.gz

# Scoped artifact checks; do not substitute them for the parent QA suite.
pnpm exec tsc --noEmit -p docs/hermes-analysis/campaigns/tsconfig.json
pnpm exec eslint docs/hermes-analysis/campaigns

# Verify compressed checksums, typecheck, and replay all eight primary traces.
# Writes fresh verification records here; baseline exits1 for the two known
# save-failure scenarios and reports their errors without hiding them.
python docs/hermes-analysis/campaigns/verify-retained.py
```

## Recompute reductions

```sh
PYTHONDONTWRITEBYTECODE=1 python docs/hermes-analysis/campaigns/analyze.py
PYTHONDONTWRITEBYTECODE=1 python docs/hermes-analysis/campaigns/deep-analyze.py
PYTHONDONTWRITEBYTECODE=1 python docs/hermes-analysis/campaigns/excerpts.py
```

The analysis readers support plain or compressed JSONL. They deduplicate turn-boundary metrics, canonical battle IDs and capture transactions programmatically. `deep-analyze.py` also regenerates the basic aggregate. `excerpts.py`'s initial summary reflects flags from the original run summaries; **`verification-manifest.json` is the final independent read-back authority**, including the extra proven B74 midpoint continuation that the original combined final-load check did not reach.

`compress-evidence.py` was used once to replace newly produced plaintext JSONL with byte-verified gzip equivalents. `compression-manifest.json` records79 compressed traces, their original/uncompressed SHA-256 values and stored gzip hashes. Do not rerun the compressor over an already compressed-only evidence set: it intentionally processes newly generated plaintext, not existing archived files.

## Files

- `findings.md`: outcomes, distinction between policies, long-horizon progression/stagnation, contact failure, save defect and source citations.
- `outcomes.csv`, `aggregate.json`, `deep-analysis.json`: machine-readable outcomes and milestone reductions.
- `key-evidence.json`: exact ordinary magic commands/battle, morale carryover trace excerpts and positive final material stocks.
- `verification-manifest.json`, `verified-*.json`: all-eight independent full replays, midpoint continuations, actual subprocess exit codes and loader errors.
- `save-failure-analysis.json`, `save-failure-B74.json`: the real loader failures and exact disagreeing formation stats.
- `compression-manifest.json`: byte seals for all archived JSONL.
- `*.log`: original campaign stdout/errors and scoped checks.
- `runs/<name>/summary.json`: exact settings, hashes, versions, command types, paid queues, refusal list/count, milestones, source SHA, environment and instrumented timing.
- `runs/<name>/{initial,midpoint,final,turn-N}.json.gz`: actual canonical serialized snapshots. Some snapshots are deliberately retained **unloadable** evidence; do not rewrite or discard their battle histories.
- `runs/<name>/{commands,plans,events,contacts,battles,captures,metrics,positions}.jsonl.gz`: complete retained ordinary evidence where that stream has entries. Missing battle/capture/contact streams in a scenario mean no corresponding entry was produced; counts remain explicit in its summary.

All tactical battles in these strategies use the canonical automatic resolver. No UI, human-play, multiplayer, full chronicle exporter, browser storage adapter or broader supernatural-system completion is implied.
