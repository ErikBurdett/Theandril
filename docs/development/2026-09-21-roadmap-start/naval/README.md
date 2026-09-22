# Naval outlet stabilization — 2026-09-21

The current roadmap-start request authorizes these local fixes. The failed
[integrated AI verdict](../../integrated-review/ai.verdict.json) remains historical
evidence; it has not been rewritten or relabeled as passing.

## Findings and implementation

- **P2, paid third harbor:** The selected-port policy now counts an owned town's
  completed harbor or queued harbor as one funded commitment. Occupation/siege
  still exclude a port from current use but do not erase money already committed.
  Once the isolated sparse realm has two commitments, another town cannot receive
  a third harbor merely by being more central. Existing basin and ranking choices
  remain in force among eligible funded ports.
- **P2, repeated founder geography:** One naval planning pass selects its eligible
  sparse-outlet caravan and indexes saved routes before assessing sites. It shares
  its existing observed-cell index and bounded sea knowledge, caches assessed
  results and rejects unselected founders before geography. A saved route retains
  its final waypoint. Dense realms retain their existing fallback, without creating
  the sparse assessment. This removes the repeated O(founders × observed cells)
  chart construction; it is not a claim that every part of naval planning is linear.

No simulation rule, save schema, navigation search cap, faction-contact target or
test timeout changes are part of these naval fixes. Proposals still consume only
observations and apply through the ordinary command API.

## Retained evidence

- Baseline revision: `f07024fe23ad3386874656d48fbbc33a5380d979`.
- [Baseline source](naval-before.ts.txt), retained as text and never imported by
  runtime code. Its SHA-256 is
  `b2ac26e4a45a27e9354d318d1354ff36b9823453b65c77228c19be1bf228845c`.
- [Failing regressions](failing-before.txt): the paid-harbor fixture proposed a
  third harbor; aggregate chart reads increased **398 → 825 → 2,289** for
  **1 → 8 → 32** waiting founders on the same 61-cell chart.
- [Final focused tests](focused-final.txt): seven files cover new outlet
  regressions plus naval campaigns, funding, sea knowledge, enclosed seas and
  overseas behavior. Root integration owns the complete suite and contact gates.
- [Scoped ESLint](lint.txt), [whole-workspace typecheck checkpoint](typecheck.txt).
- [Paired benchmark](benchmark.ts): use
  `node --import tsx docs/development/2026-09-21-roadmap-start/naval/benchmark.ts`
  in an exclusive CPU window and retain stdout as `benchmark.json`. It imports
  the archival baseline from a temporary module with resolved absolute imports;
  it does not replace working source. It compares 1/8/32/128 idle founders across
  61/469/3,169 charted cells and 4/24 public faction seats. Aggregate numeric cell
  reads are measured independently of uninstrumented whole-plan median timings.

## What the new tests establish

1. A generated Standard/four-faction geography fixture uses authored founders and
   an authored first harbor. Three settlements and the second harbor are paid
   through commands. The legally available third harbor receives no proposal;
   the queued second port is retained, proposals apply and save mirrors agree.
2. Detached observations with 1/8/32/128 idle founders and two chart sizes assert
   aggregate chart work remains bounded, observations unchanged, and zero orders.
3. A separately authored Standard chart has distinct home/outlet basins. The first
   basin's existing ocean scout does not consume the second basin's 48-coin
   reserve. The second scout's real quoted command pays 48 coin and clears the
   reserve. Another saved branch fills the outlet queue with five paid orders;
   the actual blocked scout quote also clears that reserve.
4. An outlet caravan queues a real land route past a nearby transport, retains
   that route across AI proposals and save/load, arrives through ordinary turns,
   then founds with real payment and matching state hashes. The test intentionally
   leaves unrelated economic proposals unapplied to isolate route lifecycle.

The authored chart and detached work probes are not earned-economy, contact,
mature-empire or renderer benchmarks. Broad war planning, victory counterplay,
long-campaign performance and 1.0 acceptance remain outside this focused slice.

## Parent benchmark readback

The isolated paired benchmark completed on Node 22.23.2; [raw results](benchmark.json)
record the original and corrected source hashes. On the 61-cell sparse chart,
aggregate numeric cell reads are now **337** at each of 1, 8, 32 and 128 founders;
the original reads rise from **398** to **8,145**. The larger 3,169-cell/128-founder
case falls from **426,232** to **20,600** reads, with whole-plan median time
**59.257 ms → 1.353 ms** across the seven measured paired samples. No commands
are proposed and observations remain unchanged in these deliberately idle fixtures.
These measurements establish bounded chart work for this workload, not a promise
of the same speedup in active campaigns or rendering.
