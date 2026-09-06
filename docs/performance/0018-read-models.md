# Scoped land inspection — matched large-empire read models

Measured 2026-09-06 in a reserved sequential window on Node 26.7.0, Intel
i9-13900K, Linux. Schema 9, generator 4, content `9418e598` are unchanged.
Reproduce with `node --import tsx scripts/benchmark-read-models.ts`.
[Raw measurements](0018-read-models.json); [packed world-cell measurements](0017-cell-transfer.md).

The fixture authors all existing towns to one owner, population 8 and food 1,000,
relocates former foreign garrisons to legal adjacent hexes, explicitly rebuilds
territory/sight and crosses the strict save boundary. It retains 1,500/4,000
armies and all 32/40 factions. All additional claims and worker assignments then
use ordinary paid commands. This is not earned conquest, fully explored geography
or a running AI campaign. Only 1,208/1,504 permitted cells are observed.

Full and summary reads are measured on exactly the same state. Twelve samples
follow three warmups; each reported p95 is the maximum of this small sample.
Setup, JSON encoding, equality assertions, AI comparisons, hashes and resumed
turns are excluded from selector timers. Node structured-clone timings do not
establish actual browser worker latency.

| Same-state read | Huge, 32 own towns | Legendary, 40 own towns |
|---|---:|---:|
| Claims / candidate tile options | 1,184 / 1,184 | 1,480 / 1,480 |
| Full land JSON | 3,929,445 B | 4,926,419 B |
| All-town summaries | 25,248 B | 31,974 B |
| One selected town's full detail | 123,693 B | 122,835 B |
| Full observation mean | 31.442 ms | 77.453 ms |
| Summary observation mean | 23.218 ms | 69.016 ms |
| Direct selected-town mean | 0.136 ms | 0.133 ms |
| Old complete object payload | 5,640,253 B | 8,987,345 B |
| New summary plus packed cell payload | 1,592,047 B | 3,912,254 B |
| Old structured clone mean | 14.433 ms | 25.928 ms |
| Packed summary structured clone mean | 4.793 ms | 11.634 ms |
| Pack plus transfer-clone mean | 5.198 ms | 11.947 ms |

Normal land metadata shrinks by more than 99%; complete town details remain
available on selection, not truncated. Total observation reduction is smaller:
army, officer, naval and other existing read models remain substantial. The
69 ms Legendary summary read is real remaining debt, not a 0.13 ms whole-empire
query. Packed-cell logical bytes include binary lengths and UTF-8 dictionary
metadata, excluding undocumented structured-clone framing. The last clone
timer includes fresh packing; the previous two do not. Decoding is separate.

All direct details equal the corresponding full observation, all summary fields
equal the originals, AI proposals from default full observations remain identical,
and every query preserves exact save bytes and state hashes. Starting seals are
`1f6c8980`/`02d3b393`. An actual 36/30-coin improvement is then bought; its
same-turn detail refresh and eight resumed end turns match uninterrupted play
through completion at `5b4dcb6f`/`daeb1f2d`. No read becomes a command or changes
the historical archive format. Heap samples 126.6/248.4 MiB include old/new clones,
snapshots and mirrors without forced GC; they are not retained-memory evidence.

The first integrated checkpoint passes 709 tests across 74 files and all 57
Chromium gameplay scenarios, including the real worker boundary, saved land
controls and a 32-town inspector. Typecheck, lint, content validation and build
pass. Follow-on next-action navigation is verified separately in the
[current implementation status](../IMPLEMENTATION_STATUS.md).

An isolated complete Epic campaign is retained in [raw continuation evidence](0018-epic-continuation.json).
Reproduce with `node --import tsx scripts/benchmark-chronicle.ts --seed=20260905 --size=tiny --pace=epic --factions=4 --limit=1400`.
Victory remains turn 863, with 18,935 orders, 54,448 events, 888 battles and zero
rejections. The 16,991,736-byte envelope compresses to 1,475,486 bytes; restore,
gzip import and complete replay agree at the unchanged `177160fb` seal. Mean
recorded round is 22.596 ms; complete replay takes 7,336.023 ms. The full test
suite additionally checks turn-500 continuation and identical final chronicles.
This four-faction Tiny duration case is not a thousand-turn giant-map proof.

These measurements do not finish the giant-scale release gate, registry
virtualization, export streaming or retained-memory investigation.
