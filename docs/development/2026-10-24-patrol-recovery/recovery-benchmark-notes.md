# Isolated patrol recovery benchmark protocol

Runner: `scripts/benchmark-patrol-recovery.ts`. The parent runs this only after
the nine-campaign pacing measurement has stopped, in a quiet CPU window:

```sh
node --import tsx scripts/benchmark-patrol-recovery.ts --out=docs/development/2026-10-24-patrol-recovery/recovery-benchmark.json
```

The output path must not exist. `--case=huge-distant-observed-hostiles` selects
one case for diagnosis; omitting it runs all four. Source hashes are recorded and
checked unchanged after measurement. Repository typecheck, scoped ESLint and
`--help` passed at handoff. The author did not run the measured workload during
the parent's pacing window; the fixture's runtime assertions await that run.

Each Huge/Legendary case starts from the existing `matureCampaign` helper,
retaining its32/40realms and roughly1,500/4,000armies. Flat land and relocated
actors/towns are explicitly authored. The selected realm receives128single-guard
companies and two owned hearths. Every company receives real `setPatrol` and
`queueMovement` commands and spends movement on its route. The fixture then uses
canonical `pauseMovement` and authors a renewed movement budget for the later
review. A strict save/reload separates setup from measurements.

An original own observer sees at least1,400/3,800foreign forces, each foreign
faction on its own distinct cell within the observer's four-hex sight. Ordinary declarations make their factions public enemies. This
exercises the planner's observed-entity indexing without placing a threat within
the patrol companies' sight. A second case moves one enemy next to their actual
route position: all128companies must refuse recovery before any route query.
These are31/39distant hostile cells, plus one nearby cell in the blocked case,
not geographically broad enemy fronts. No hidden armies or cells enter the
measured planner observation.

The first run rejected the authored setup because foreign factions shared one
cell. The retained `recovery-benchmark.log` records that failure. The fixture now
assigns separate faction cells and preserves the strict save validation; no
runtime or schema rule was weakened.

Each case performs one warmup and three fresh-observation samples. Only
`planPatrol(view)` is timed. Samples must return identical commands and diagnostic
counters, leave the observation byte-identical and retain all128held companies.
The safe case must issue exactly four ordinary resumes after four previews; the
nearby-threat case must issue none and perform no preview. Target expansions are
bounded by query count times the canonical4,096-node preview budget. Reported
target counts exclude range-expansion work; both share that preview budget.

Outside timing, two independently reloaded save copies apply the real proposals.
Each accepted resume must move its company, produce equal results on both copies,
preserve every saved patrol configuration, and leave the other124paused routes
exact. The continued state must hash identically after reload. For the blocked
case all128routes remain untouched.

The JSON report lists world/entity/observation sizes, visible enemy counts and
unique enemy cells, three timings and their median/range, query/node/command
counts, actual proposals, accepted resumes, unchanged-route counts, source
fingerprints and canonical/continued hashes. It excludes setup, observation
construction, assertions, serialization/hashing, command execution, full AI
turns, campaigns, worker transfer and rendering. It supports an absolute scoped
cost claim, not a speedup, organic-empire acceptance or worst-case path saturation.
