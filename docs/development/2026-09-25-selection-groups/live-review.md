# Saved selection groups: live publication and 64-seat review

Reviewed **26 September 2026**. **Verdict: no blocker found in the retained live
evidence.** Publication revision:
`676d56471cb806fb007fc0207ea16b0b638c467c`; implementation pin:
`0d26fa3c34ac89164637f515e95671420400a841`.

The parent ran the live browser checks. This reviewer inspected their existing
images, logs, result JSON and verifier source, and independently decompressed
the three downloaded campaigns. No additional browser or replay run was made.
The reviewer did not author the standalone 64-seat verifier or schema repair;
the earlier selection-group browser journeys were authored by this reviewer.

## Live publication

[Live readback](live-readback.json) identifies the deployed publication revision
at `https://erikburdett.github.io/Theandril/`, retains the implementation source
pin, and reports no readback errors. The fetched compact illustration is the
reviewed **15,348-byte** file, SHA256
`28236174d7b432ccf6ed1188b9529fe9a5f41d8b45ca61a7c59358a58f42e2ec`.

The reviewer opened [live-groups-journal.png](live-groups-journal.png),
**1440 × 1000**. Edition09, its title, **26 September 2026**, rules32 and the
explicit open-gate limitation display correctly. Navigation, paper, heading,
subtitle and introductory text show no clipping or overlap. This agrees with
the earlier four-setting production layout review.

The completed [live Pages log](live-pages.log) records **31 passing journeys in
1.2 minutes**, including the reader/roadmap checks and the ordinary-control
saved-group journey. This is a separate live result, not an addition to the
article's implementation test count. The parent's deployment workflow checks
establish workflow success; this review binds the inspected evidence to the
revision observed in the live ledger.

## Actual 64-seat campaign

The [standalone log](live-64-seat.log) and [result](live-64-seat/result.json)
record success in **13.535 seconds**, with three verified downloads. This is
one verification duration, not a performance benchmark. The script hash matches
the inspected `scripts/verify-sixty-four-seat-save.ts`.

This campaign was generated on the live site through ordinary controls:
**40 major realms + 24 city-states**, seed **20260926**, generator8,
**352 × 220** hexes, Standard pace, continents and player mode. The internal
`legendary` size is labelled **Huge** in the player-facing selector. It does not
claim a browser run with 64 major realms. A real caravan founds
**Sixty Four Hearth** before manual Save, page reload and Load; a subsequent
page reload imports the actual downloaded campaign. No development hooks,
authored campaign fixture or direct storage access were used.

The reviewer opened these original captures:

- [Setup](live-64-seat/sixty-four-seat-setup.png), **1440 × 2692**, shows the
  requested seed, Huge/77,440 hexes, 40 major realms and 24 city-states. Portraits
  still show their loading placeholders at this capture instant; this image
  verifies setup controls, not completed portrait loading.
- [Manual restoration](live-64-seat/sixty-four-seat-restored.png),
  **1440 × 1000**, shows 64 realms, one hearth, turn1, the restored map and
  “Campaign restored.”
- [Portable restoration](live-64-seat/sixty-four-seat-portable-restored.png),
  **1440 × 1000**, retains the same campaign with the settings controls and
  successful portable-restore feedback. Controls and text remain readable.

Independent file inspection confirmed all three compressed sizes/hashes match
the result; their exact canonical snapshot strings and parsed archives agree.
Each snapshot has **911,896 canonical bytes**, SHA256
`62d994fc20d975effd06e152b23c1be78c422e11e7769af3f1fe17a1e76e433d`.
The state contains 64 matching faction/research IDs, the 40/24 composition,
rules32, content `015468d1`, turn1 and the founded hearth. Its complete archive
starts at rules32 and contains one accepted command. The parent-run public
chronicle checks replay every export to exact canonical serialization and hash
**`838191d9`**; restored state and archive comparisons remain strict. Compressed
envelope bytes differ between the first and restored exports, as disclosed;
canonical state and parsed history do not.

The result retains one explicitly correlated browser-owned root `/favicon.ico`
404 warning. Console location and CDP network/log request identity agree; that
URL is not the declared application icon. Browser exceptions, application
console/HTTP errors and unclassified network/log errors are empty. The retained
warning is not presented as zero raw browser diagnostics.

This supplies the requested live **DH-020** first-turn save/reload/export/import
proof. It does not establish mature-campaign durability, AI-turn performance,
pacing, sustained memory, additional browsers or release acceptance. M3 and all
fifteen 1.0 gates remain open.
