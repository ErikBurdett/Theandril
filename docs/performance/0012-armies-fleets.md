# General-led armies and naval transport measurements

The repeatable offline entry point is `node --import tsx scripts/benchmark-armies-fleets.ts`.
Use `--smoke` for a small correctness check; `--section=kernel`, `--section=fleet`,
or `--section=scale` isolates a workload. The isolated full run below completed
after the smoke check, typecheck and scoped lint passed.

## Workloads and exclusions

The kernel comparison resolves twelve versus twelve and twenty versus twenty
formations with identical repeated original unit definitions, seed sequence and
hills terrain. Creation and validated autoresolve are timed together. Every
result is independently compared with manual rounds using the same tactical
policy; twelve-formation outputs also match explicit historical version7 rules.
There are seven excluded warmups and 200 measured battles at each size.

The fleet scenario is an explicitly authored Tiny archipelago with funded harbor
and hulls. Normal commands board an appointed marshal through the harbor, pay
for Ocean navigation, embark two actual cargo formations, queue a voyage,
restore the in-flight save and unload onto the destination island. Cargo
identities and formation values must be conserved exactly. Observation, fresh
and cached movement queries, canonical serialization and strict restore each
have seven excluded warmups and 20 samples. The short active voyage has its actual
turn count disclosed; it is not presented as a stable 20-sample turn benchmark.

Scale fixtures retain 1,500 Huge/32-faction and 4,000 Legendary/40-faction army
containers. 32 paid marshal appointments per faction lead half 16-formation and
half 20-formation columns. Veteran XP and added mixed formations are explicitly
authored setup, not earned growth; all promotions use real prerequisites and
spend exact XP. Unmodified singletons remain in the population. Initial/final
states cross strict canonical save validation. 27 idle endTurns run real economy,
upkeep, character and movement processing; the first seven are warmups. Every
turn is mirrored from a save and compared for results, events and state hashes.

Setup, independent mirrors, output comparisons and hashing are excluded from
timing. This is not an AI campaign, invasion, 100-turn soak, archive/storage,
browser/rendering or GPU measurement. Smoke uses Tiny/2 factions, four marshals
per seat and reduced sample counts, and cannot establish Huge/Legendary latency.

## Recorded results

Measured in a reserved offline window beginning **2026-09-06T04:08:13.136Z** (September 5 local time), with no browser, test suite, diagnostic or other performance run active. Hardware: 13th Gen Intel(R) Core(TM) i9-13900K; linux 7.1.9-arch1-2; Node v26.7.0. Save schema 8, final content hash `257e1e91`. Every assertion passed; no fixture was relaxed to obtain these numbers.

This final rerun includes all co-located character-assignment destinations; the previous silent 24-option truncation is absent. Larger complete read models are measured, not hidden by limiting the player's legal choices. It supersedes the earlier preliminary content-hash measurement.

| Kernel | Median / p95 (ms) | Outcome rounds | Outcome sequence seal |
| --- | ---: | ---: | --- |
| 12 versus 12 | 0.388 / 0.856 | 5–6 | `bd17446a` |
| 20 versus 20 | 0.497 / 1.024 | 4–5 | `84bbd5c3` |

The twenty-formation workload resolves in fewer rounds for this repeated roster; it is not an equal-round scaling proof. All 414 warmup/measured battles matched manual-policy rounds; all 207 twelve-formation runs also matched the explicit historical version7 kernel.

| Idle world | Containers | Formations | Marshals | EndTurn median / p95 (ms) | Seat observation median / p95 (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Huge / 32 | 1,500 | 18,908 | 1,024 | 1.695 / 3.395 | 2.806 / 4.369 |
| Legendary / 40 | 4,000 | 25,760 | 1,280 | 3.694 / 4.940 | 5.129 / 6.506 |

| World | Canonical bytes | Serialize median / p95 (ms) | Strict load median / p95 (ms) | Seat observation bytes | Final hash |
| --- | ---: | ---: | ---: | ---: | --- |
| huge | 3,856,498 | 40.205 / 49.708 | 139.386 / 177.266 | 662,636 | `b28b2f18` |
| legendary | 5,771,582 | 61.567 / 74.771 | 202.365 / 226.512 | 1,148,794 | `486b1c0a` |

These are fog-limited single-seat observations, not whole-map renderer transfers. Both worlds preserve all formation identities and values through 27 mirrored turns. The real upkeep and movement-reset phases dominate idle turns, while full snapshot parsing/validation remains substantially more expensive. These are canonical snapshot costs, not the incremental local archive save path. Complete seat read models reach approximately 0.66 MB and 1.15 MB in these concentrated military fixtures; browser transfer and rendering costs are not included.

The loaded fleet retained exactly `formation.10` and `formation.9` through real embarkation, 2 active queued-travel turns, strict midpoint restore and island unloading. Final hash: `3f0514f7`. It uses 3 transport hulls and one attached marshal. Full observation median/p95 was 0.146 / 0.197 ms; fresh-observation route query 0.151 / 0.458 ms; cached query 0.031 / 0.061 ms, expanding 27 nodes. Canonical serialization/strict load medians were 0.258/1.341 ms for 30,152 bytes. Queue creation took 0.835 ms. The two active turn samples peaked at 0.959 ms and their travel phases at 0.223 ms; this is explicitly too few samples to claim a stable active-voyage p95.

Distributions use the script's sorted upper index `floor(n * 0.95)`; for twenty observations p95 equals the maximum sample. One host/window is not a cross-hardware performance guarantee. No invasion AI, full campaign, naval-battle aftermath, archive/storage, browser or renderer measurements are inferred from this result.

### Complete machine-readable report

The following is the complete successful stdout JSON, including every phase distribution and deterministic seal.

```json
{
  "capturedAt": "2026-09-06T04:08:13.136Z",
  "runtime": "v26.7.0",
  "cpu": "13th Gen Intel(R) Core(TM) i9-13900K",
  "os": "linux 7.1.9-arch1-2",
  "saveVersion": 8,
  "contentHash": "257e1e91",
  "smoke": false,
  "kernel": [
    {
      "formationsPerSide": 12,
      "deploymentRanks": 3,
      "samples": 200,
      "warmups": 7,
      "createAndAutoResolve": {
        "samples": 200,
        "medianMs": 0.3877239999999915,
        "p95Ms": 0.8562450000000013,
        "maxMs": 1.6138679999999965,
        "meanMs": 0.4578341899999998
      },
      "minRounds": 5,
      "maxRounds": 6,
      "outcomeSeal": "bd17446a",
      "historical12Parity": true,
      "manualParity": true,
      "note": "Same repeated original three-unit roster and hills terrain at both sizes, preserving the existing kernel workload. These are supplied tactical stats, not recruited campaign forces. Timings include validated battle creation and exact kernel autoresolve; separate manual and historical comparisons are excluded."
    },
    {
      "formationsPerSide": 20,
      "deploymentRanks": 4,
      "samples": 200,
      "warmups": 7,
      "createAndAutoResolve": {
        "samples": 200,
        "medianMs": 0.4965119999999388,
        "p95Ms": 1.0241869999999835,
        "maxMs": 3.473404000000073,
        "meanMs": 0.5525151849999972
      },
      "minRounds": 4,
      "maxRounds": 5,
      "outcomeSeal": "84bbd5c3",
      "historical12Parity": null,
      "manualParity": true,
      "note": "Same repeated original three-unit roster and hills terrain at both sizes, preserving the existing kernel workload. These are supplied tactical stats, not recruited campaign forces. Timings include validated battle creation and exact kernel autoresolve; separate manual and historical comparisons are excluded."
    }
  ],
  "loadedFleet": {
    "synthetic": true,
    "cells": 1536,
    "factions": 2,
    "hulls": 3,
    "cargoArmies": 1,
    "cargoFormations": 2,
    "cargoFormationIds": [
      "formation.10",
      "formation.9"
    ],
    "cargoConserved": true,
    "reads": {
      "samples": 20,
      "warmups": 7,
      "fullObservation": {
        "samples": 20,
        "medianMs": 0.14638300000001436,
        "p95Ms": 0.19741799999997056,
        "maxMs": 0.19741799999997056,
        "meanMs": 0.14817659999999364
      },
      "freshObservationQuery": {
        "samples": 20,
        "medianMs": 0.15135299999997187,
        "p95Ms": 0.45790999999996984,
        "maxMs": 0.45790999999996984,
        "meanMs": 0.16784715000000006
      },
      "cachedObservationQuery": {
        "samples": 20,
        "medianMs": 0.030709999999999127,
        "p95Ms": 0.06056499999999687,
        "maxMs": 0.06056499999999687,
        "meanMs": 0.032970449999993434
      },
      "serialize": {
        "samples": 20,
        "medianMs": 0.25843299999996816,
        "p95Ms": 0.604139000000032,
        "maxMs": 0.604139000000032,
        "meanMs": 0.27427464999998963
      },
      "deserialize": {
        "samples": 20,
        "medianMs": 1.3408399999999574,
        "p95Ms": 1.6866870000000063,
        "maxMs": 1.6866870000000063,
        "meanMs": 1.3864509499999997
      },
      "observationBytes": 137847,
      "saveBytes": 30152,
      "expandedNodes": 27,
      "reachableCells": 10,
      "canonicalHash": "b2ba9893",
      "note": "Read model construction and fresh/cached movement-query timing are separate. Every save/load is full strict canonical validation. JSON comparisons and state-hash checks are outside timings. World indexes are already built; fresh means a newly allocated observation, not cold world generation."
    },
    "queueMovementMs": 0.8350199999999859,
    "activeVoyageTurns": 2,
    "fullEndTurn": {
      "samples": 2,
      "medianMs": 0.9594379999999774,
      "p95Ms": 0.9594379999999774,
      "maxMs": 0.9594379999999774,
      "meanMs": 0.5305235000000152
    },
    "activeTravelPhase": {
      "samples": 2,
      "medianMs": 0.22343000000000757,
      "p95Ms": 0.22343000000000757,
      "maxMs": 0.22343000000000757,
      "meanMs": 0.13062249999995856
    },
    "midpointSaveBytes": 30689,
    "finalHash": "3f0514f7",
    "note": "Authored archipelago/funded harbor/hulls, not generated AI sailing. Marshal appointment comes from the validated fixture; Harbor boarding, Ocean navigation payment, cargo embarkation, queued voyage and unloading use real commands. The short active voyage is a functional timing sample, not a twenty-sample stable latency distribution. No combat, AI, archive or browser costs are included."
  },
  "scale": [
    {
      "size": "huge",
      "synthetic": true,
      "cells": 196608,
      "factions": 32,
      "armies": 1500,
      "formations": 18908,
      "marshalLedArmies": 1024,
      "sixteenFormationArmies": 512,
      "twentyFormationArmies": 512,
      "paidAppointments": 1024,
      "authoredVeterans": 512,
      "authoredExperienceEach": 54,
      "setupCommands": 3584,
      "reads": {
        "samples": 20,
        "warmups": 7,
        "fullObservation": {
          "samples": 20,
          "medianMs": 2.80591000000004,
          "p95Ms": 4.368753000000652,
          "maxMs": 4.368753000000652,
          "meanMs": 2.9239011000001254
        },
        "freshObservationQuery": {
          "samples": 20,
          "medianMs": 0.08845100000007733,
          "p95Ms": 0.13123300000006566,
          "maxMs": 0.13123300000006566,
          "meanMs": 0.09289599999997336
        },
        "cachedObservationQuery": {
          "samples": 20,
          "medianMs": 0.047106999999414256,
          "p95Ms": 0.08503399999972316,
          "maxMs": 0.08503399999972316,
          "meanMs": 0.05170819999989362
        },
        "serialize": {
          "samples": 20,
          "medianMs": 40.20505000000003,
          "p95Ms": 49.70753100000002,
          "maxMs": 49.70753100000002,
          "meanMs": 40.89568844999992
        },
        "deserialize": {
          "samples": 20,
          "medianMs": 139.38623800000005,
          "p95Ms": 177.2656689999999,
          "maxMs": 177.2656689999999,
          "meanMs": 140.66319154999988
        },
        "observationBytes": 662636,
        "saveBytes": 3856498,
        "expandedNodes": 19,
        "reachableCells": 18,
        "canonicalHash": "bdd16307",
        "note": "Read model construction and fresh/cached movement-query timing are separate. Every save/load is full strict canonical validation. JSON comparisons and state-hash checks are outside timings. World indexes are already built; fresh means a newly allocated observation, not cold world generation."
      },
      "idleTurnSamples": 20,
      "unmeasuredWarmupTurns": 7,
      "mirroredTurns": 27,
      "fullEndTurn": {
        "samples": 20,
        "medianMs": 1.6947700000000623,
        "p95Ms": 3.39527999999882,
        "maxMs": 3.39527999999882,
        "meanMs": 1.8425725999999485
      },
      "phases": {
        "sieges": {
          "samples": 20,
          "medianMs": 0.0049760000001697335,
          "p95Ms": 0.006482000000687549,
          "maxMs": 0.006482000000687549,
          "meanMs": 0.005067749999943772
        },
        "settlements": {
          "samples": 20,
          "medianMs": 0.03869699999995646,
          "p95Ms": 0.05396700000164856,
          "maxMs": 0.05396700000164856,
          "meanMs": 0.038848049999978686
        },
        "upkeep": {
          "samples": 20,
          "medianMs": 0.45594700000037847,
          "p95Ms": 1.7869210000008025,
          "maxMs": 1.7869210000008025,
          "meanMs": 0.562209200000234
        },
        "characters": {
          "samples": 20,
          "medianMs": 0.1341359999987617,
          "p95Ms": 0.20185099999980594,
          "maxMs": 0.20185099999980594,
          "meanMs": 0.14336284999981216
        },
        "movement": {
          "samples": 20,
          "medianMs": 0.9867770000000746,
          "p95Ms": 1.8303809999997611,
          "maxMs": 1.8303809999997611,
          "meanMs": 1.0359879499997988
        },
        "travel": {
          "samples": 20,
          "medianMs": 0.0019940000001952285,
          "p95Ms": 0.0035050000005867332,
          "maxMs": 0.0035050000005867332,
          "meanMs": 0.0019854000002851534
        },
        "diplomacy": {
          "samples": 20,
          "medianMs": 0.0029429999995045364,
          "p95Ms": 0.004087999999683234,
          "maxMs": 0.004087999999683234,
          "meanMs": 0.0029109999997672274
        },
        "progression": {
          "samples": 20,
          "medianMs": 0.004101999998965766,
          "p95Ms": 0.005852999998751329,
          "maxMs": 0.005852999998751329,
          "meanMs": 0.004216199999609671
        }
      },
      "finalHash": "b28b2f18",
      "rosterSeal": "7cb6c398",
      "note": "Synthetic mature 1500/4000 containers and one town per faction (10 containers in Tiny smoke). 32 real paid marshal appointments per faction; half receive explicitly authored veteran XP, spent through actual prerequisite commands. Added mixed formations are authored setup, not recruitment or earned military growth. Every initial/final state crosses strict save validation. Idle endTurns have real economy/upkeep/character/movement processing, no AI plans, missions, travel, battles, archive or browser. Seven initial turns excluded from latency distributions; independent mirror/hash checks are outside timings. No 100-turn campaign soak."
    },
    {
      "size": "legendary",
      "synthetic": true,
      "cells": 307200,
      "factions": 40,
      "armies": 4000,
      "formations": 25760,
      "marshalLedArmies": 1280,
      "sixteenFormationArmies": 640,
      "twentyFormationArmies": 640,
      "paidAppointments": 1280,
      "authoredVeterans": 640,
      "authoredExperienceEach": 54,
      "setupCommands": 4480,
      "reads": {
        "samples": 20,
        "warmups": 7,
        "fullObservation": {
          "samples": 20,
          "medianMs": 5.128543999999238,
          "p95Ms": 6.505587999999989,
          "maxMs": 6.505587999999989,
          "meanMs": 5.352967199999966
        },
        "freshObservationQuery": {
          "samples": 20,
          "medianMs": 0.10993500000040513,
          "p95Ms": 0.1498909999991156,
          "maxMs": 0.1498909999991156,
          "meanMs": 0.11156569999993735
        },
        "cachedObservationQuery": {
          "samples": 20,
          "medianMs": 0.05644200000097044,
          "p95Ms": 0.08682899999985239,
          "maxMs": 0.08682899999985239,
          "meanMs": 0.057732649999979915
        },
        "serialize": {
          "samples": 20,
          "medianMs": 61.5665119999976,
          "p95Ms": 74.77097500000127,
          "maxMs": 74.77097500000127,
          "meanMs": 62.7872639000002
        },
        "deserialize": {
          "samples": 20,
          "medianMs": 202.36479599999984,
          "p95Ms": 226.51192099999753,
          "maxMs": 226.51192099999753,
          "meanMs": 204.65953780000035
        },
        "observationBytes": 1148794,
        "saveBytes": 5771582,
        "expandedNodes": 19,
        "reachableCells": 18,
        "canonicalHash": "a8d2c177",
        "note": "Read model construction and fresh/cached movement-query timing are separate. Every save/load is full strict canonical validation. JSON comparisons and state-hash checks are outside timings. World indexes are already built; fresh means a newly allocated observation, not cold world generation."
      },
      "idleTurnSamples": 20,
      "unmeasuredWarmupTurns": 7,
      "mirroredTurns": 27,
      "fullEndTurn": {
        "samples": 20,
        "medianMs": 3.6944519999997283,
        "p95Ms": 4.940233000001172,
        "maxMs": 4.940233000001172,
        "meanMs": 3.805754799999886
      },
      "phases": {
        "sieges": {
          "samples": 20,
          "medianMs": 0.005016999999497784,
          "p95Ms": 0.0057450000022072345,
          "maxMs": 0.0057450000022072345,
          "meanMs": 0.00491104999982781
        },
        "settlements": {
          "samples": 20,
          "medianMs": 0.046586000000388594,
          "p95Ms": 0.050970000000233995,
          "maxMs": 0.050970000000233995,
          "meanMs": 0.04652365000019927
        },
        "upkeep": {
          "samples": 20,
          "medianMs": 1.0180920000020706,
          "p95Ms": 1.1838220000026922,
          "maxMs": 1.1838220000026922,
          "meanMs": 1.021765349999805
        },
        "characters": {
          "samples": 20,
          "medianMs": 0.17225200000029872,
          "p95Ms": 0.18389200000092387,
          "maxMs": 0.18389200000092387,
          "meanMs": 0.17265285000012226
        },
        "movement": {
          "samples": 20,
          "medianMs": 2.3555259999993723,
          "p95Ms": 3.483316999998351,
          "maxMs": 3.483316999998351,
          "meanMs": 2.5003409500001
        },
        "travel": {
          "samples": 20,
          "medianMs": 0.0019860000029439107,
          "p95Ms": 0.0026150000012421515,
          "maxMs": 0.0026150000012421515,
          "meanMs": 0.0019085500003711785
        },
        "diplomacy": {
          "samples": 20,
          "medianMs": 0.003403999999136431,
          "p95Ms": 0.00427299999864772,
          "maxMs": 0.00427299999864772,
          "meanMs": 0.0035040999999182533
        },
        "progression": {
          "samples": 20,
          "medianMs": 0.004305000002204906,
          "p95Ms": 0.012364000001980457,
          "maxMs": 0.012364000001980457,
          "meanMs": 0.004614849999779835
        }
      },
      "finalHash": "486b1c0a",
      "rosterSeal": "f65fad70",
      "note": "Synthetic mature 1500/4000 containers and one town per faction (10 containers in Tiny smoke). 32 real paid marshal appointments per faction; half receive explicitly authored veteran XP, spent through actual prerequisite commands. Added mixed formations are authored setup, not recruitment or earned military growth. Every initial/final state crosses strict save validation. Idle endTurns have real economy/upkeep/character/movement processing, no AI plans, missions, travel, battles, archive or browser. Seven initial turns excluded from latency distributions; independent mirror/hash checks are outside timings. No 100-turn campaign soak."
    }
  ],
  "scope": "Sequential offline canonical/kernel benchmark. Setup, validation comparisons and separately executed mirrors excluded from timers unless explicitly stated; no browser, archive, AI campaign, network, rendering or GPU timings."
}
```
