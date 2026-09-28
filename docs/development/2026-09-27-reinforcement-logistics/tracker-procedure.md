# Prepared DHARMA progress update

Prepared 2026-09-27; **applied and read back 2026-09-28**. The preparation procedure below is retained as history; actual pins, reviewed proposal and output seals are in `tracker-release.json`, `tracker-preview.json`, `tracker-applied.json` and `tracker-readback.json`. Helper: `/tmp/theandril-record-reinforcement-logistics.py`. It is an offline preview tool until explicitly invoked with `--apply` and the exact reviewed preview seal. The final source/publication IDs, verification counts, workflow IDs, pacing results and catalogue totals are intentionally not filled in yet.

The current tracker was inspected using `tracker-context dharma --project Theandril` and its actual actions, projects, issues and resources JSON. Only `data/actions.json`, `data/projects.json` and `data/issues.json` are proposed write targets. `resources.json` is inventory output and stays untouched.

## Required final inputs

Start with `python3 /tmp/theandril-record-reinforcement-logistics.py --template`. This prints the three current tracker input hashes and a blank metadata structure. A prepared copy is at `/tmp/theandril-reinforcement-tracker-template.json`.

Fill the metadata only after the implementation and publication are committed, the exact publication is deployed, and final evidence is reviewed:

- Full `source` and `published` commit IDs and the actual deployment date.
- Seven distinct verification scopes: implementation, publication, affected gameplay, built production, local Pages, live Pages and compatibility. Each needs its repository-relative log path under this packet, SHA-256, actual passing count and either `headless` or `browser` kind. Headless rows also need the exact file count. Use one complete final run per scope; overlapping scopes are not summed. Local/live Pages must have identical file/title identities.
- Deployment and live-readback JSON paths and hashes. They must identify the exact source/publication, rules/save34, content `015468d1`, successful build and Pages workflow records, live production assets, the featured dispatch, reconciled catalogue counts and all 15 open gates. The helper uses the existing nested `checks.game`, `checks.dispatch` and `checks.roadmap` readback contract.
- Final pacing, supply benchmark and reinforcement benchmark JSON paths/hashes, retained at the implementation commit. Pacing must contain eighteen matched runs: three seeds and three paces, each under frozen33 and current34 on the standard map with twelve realms. Seed20260905 must be included; the helper derives current and frozen headline turns separately. Counts are copied literally; no target-band acceptance is inferred. Benchmarks must be full Huge/Legendary runs with one warmup and three measured samples, not smoke or AI-only results. Supply source fingerprints are checked against the implementation commit.

Every record uses `pin: "source"`, `"published"` or `"live"`. Implementation/compatibility and performance reports must use the source pin; publication/local Pages use the publication pin; live Pages uses the live pin. Affected and built-production checks may use either immutable commit. Deployment/readback records can use the live pin because they are captured after publication. All evidence paths must stay under this packet. Keep initial/failed reports separately; they cannot substitute for final evidence.

## Preview, review and apply

With a completed metadata file in this packet:

```sh
python3 /tmp/theandril-record-reinforcement-logistics.py --metadata docs/development/2026-09-27-reinforcement-logistics/tracker-release.json > docs/development/2026-09-27-reinforcement-logistics/tracker-preview.json
```

Review the complete proposal and its `previewSha256`. Only then may the parent invoke the same command with `--apply --expected-preview ACTUAL_REVIEWED_SHA256`, retaining its JSON output separately. This agent has not invoked apply. The filesystem tool may require the normal external-write permission for the tracker directory.

The helper requires HEAD and fetched `origin/master` to equal the publication, source ancestry, and no working-tree changes outside this packet or `docs/IMPLEMENTATION_STATUS.md`. Tracker inputs and evidence are hash-guarded. Apply stages all three replacements, makes private durable backups in `/tmp`, checks for concurrent edits before each replacement, and rolls back only unchanged bytes it wrote if a later step fails. Each replacement is atomic; three files are not one filesystem transaction.

The proposal keeps ACT-32 and ACT-33 `doing`, M3 and M4 `in-progress`, ACT-38 `backlog`, DH-021 `open`, ACT-36 `done`, DH-020 `resolved`, and all unrelated records/fields. It refreshes the two delivered-slice summaries, open work, literal pacing history and measured catalogue bullets. It does not claim a fixed completion percentage, organic maturity, all-realm saturation or a closed release gate.

The helper never fetches, deploys, builds, runs inventory or writes a weekly edition. After a successful reviewed apply, the parent can separately run the standard tracker build:

```sh
TRACKER_HOME=/home/telephoneheater/Projects/DHARMA/dharma-tracker /home/telephoneheater/Projects/PIA/pia-tracker/scripts/run.sh build
```

Preparation validation: Python syntax parsing and the read-only template invocation passed. A small read-only guard check accepted the retained 54-pass worker log, rejected the retained initial two-failure log, checked the template's current input seals and confirmed unchanged tracker bytes. Final release validation is deliberately pending actual supplied metadata. The helper and procedure are a reviewed-update mechanism, not an independent replacement for source, browser, performance or publication reviews.

Independent helper review caught and corrected two preparation issues before use: the final pacing matrix contains paired rules33/34 rows rather than current-only rows, and the combined built-production scope includes an authored imported supply scenario alongside a generated theater campaign. Neither issue reached tracker data.

Final application used reviewed preview `0a9c911c4ce829a48420b37c64f98fd9ba70456621cfcb1806b156fe7931daa8`. The corrected helper source is retained under `tracker-tools/`; review and eight isolated guard/rollback checks precede application. Tracker build completed successfully, and the generated Theandril page contains the published evidence. Final input/output checks pass; no inventory or weekly writer ran.
