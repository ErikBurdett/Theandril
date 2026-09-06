# Theandril 1.0 — Definition of Done

Do not call the project 1.0 until all release gates pass.

## Gate A — Clean build

From a clean checkout:
- dependency install succeeds;
- typecheck succeeds;
- lint succeeds;
- unit/property tests succeed;
- production build succeeds;
- server build succeeds if multiplayer is enabled;
- no undocumented manual patch is required.

## Gate B — Complete campaign

An automated/headless campaign and a human-playable campaign can:
- generate a world;
- found and conquer settlements;
- build/recruit/research;
- trade/negotiate;
- wage war;
- use characters/agents;
- progress through campaign epochs;
- reach at least three distinct victory paths in test fixtures;
- finish without state corruption.

All intended victory paths are human-playable.

Normal campaigns support strategically engaging play over hundreds of turns, with higher-difficulty campaigns potentially approaching 1,000. Verify representative long campaigns and counterplay; a long funding wait alone does not establish engagement or completed difficulty design. Short regression fixtures are explicitly labeled and are not pacing evidence.

Victorious AI campaigns expose both a complete technical log and a factual history tome in the UI. Full records survive save/resume and include the generated start through victory; imported older campaigns disclose any missing earlier history. Verify replay from the technical record, not merely a matching final snapshot.

## Gate C — AI competency

AI factions can:
- expand;
- maintain economy;
- field armies;
- defend;
- invade;
- make peace;
- use diplomacy;
- use progression;
- use agents;
- resolve tactical battles;
- pursue victory.

At least one long deterministic soak campaign completes without deadlock or runaway error.

## Gate D — Giant scale

Huge campaign fixture:
- loads;
- pans/zooms responsively;
- progresses 100+ turns headlessly;
- preserves deterministic hashes;
- does not exhibit unbounded memory growth.

Legendary stress fixture executes its benchmark without pathological collapse.

## Gate E — Save integrity

- manual save/load works;
- autosave rotation works;
- export/import works;
- version migration test exists;
- save after battle/diplomacy/settlement capture works;
- replay reproduces state hashes;
- corrupt save fails safely without deleting last valid autosave.

## Gate F — Combat

- field battle works;
- siege works;
- retreat/pursuit works;
- commander abilities work;
- terrain matters;
- morale matters;
- tactical intervention works;
- autoresolve uses the same combat engine;
- AI can fight;
- battle results persist correctly.

## Gate F2 — Research and magic depth

- Mundane Technology/Knowledge is implemented and strategically meaningful.
- Institutions/Civic Traditions are implemented separately from technology.
- Military Doctrine is implemented separately from equipment technology.
- Arcane Theory research exists.
- Individual casters have path/tradition capability distinct from faction research.
- Battle magic works.
- Strategic rituals work.
- Summoning works for factions that use it.
- Magical sites/resources work.
- Artifice/items/relics work.
- Sacred and/or occult systems have at least multiple distinct playable implementations.
- Faction-specific progression exceptions are supported by data rather than core-engine forks.
- AI understands research requirements and caster capability.
- Research/magic survives save/load/replay.
- Counter-magic/counterplay exists for major supernatural effects.
- At least one automated scenario proves a cross-system unlock requiring mundane + magical progress.

## Gate G — Diplomacy

- treaties have real rule effects;
- AI can propose/respond;
- peace terms work;
- war relationships work;
- vassal/client relationships work;
- relationship memory works;
- negotiation UI explains acceptance/objections;
- saves preserve treaties;
- multiplayer validates diplomatic commands.

## Gate H — Settlement conquest

For supported circumstances:
- occupy/annex;
- loot/sack;
- raze;
- liberate/client rule;
- resettle

produce different persistent consequences and AI understands them.

## Gate I — UX at scale

A player with 100+ armies and many settlements can use:
- registries;
- filters;
- search;
- theaters;
- automation;
- warnings;
- map lenses

without manually cycling every object.

No critical 1.0 feature is available only through a debug console.

## Gate J — Content

Content validator reports:
- no broken IDs;
- no missing required localization;
- no impossible progression prerequisite;
- no missing critical icons/assets in release packs.

Base content meets the scope targets or a documented equivalent with demonstrably non-filler procedural composition.

## Gate K — Performance

`docs/PERFORMANCE.md` contains current measured results for:
- map frame time;
- simulation end-turn phase times;
- AI planning;
- pathfinding;
- worker transfer size;
- Huge fixture;
- Legendary fixture.

No known severe regression remains open.

## Gate L — Browser support

Test current stable releases of:
- Chromium-based browser;
- Firefox;
- Safari/WebKit where practical.

WebGL path is the release baseline.

Unsupported optional features degrade gracefully.

## Gate M — Multiplayer

For 1.0 online mode:
- host/create/join works;
- seat ownership works;
- reconnect works;
- turn planning/resolution works;
- hidden information is not leaked;
- commands are server-validated;
- save/resume works;
- AI seats work;
- two-client Playwright or integration test covers a minimal match flow.

## Gate N — Release hygiene

- no core TODO/placeholder path;
- no disabled failing core test;
- no copied copyrighted game assets/text;
- third-party asset/license inventory exists;
- version/changelog exist;
- crash/error paths show useful messages;
- debug mutation APIs are absent from production build.

## Final signoff

Before declaring 1.0, produce `docs/RELEASE_1_0_REPORT.md` containing:
- commit/version;
- passed gates;
- known minor limitations;
- performance table;
- supported browsers;
- save version;
- multiplayer protocol version;
- content counts;
- automated test counts;
- screenshots captured by Playwright;
- deterministic soak-test result.
