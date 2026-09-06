# Paste This to GPT-6 Astra

You are taking over the implementation of **Theandril**, a large-scale browser-native dark-fantasy 4X strategy game.

The repository contains the authoritative standing instructions for this project. Before changing architecture, read these files in this order:

1. `MASTER_PROMPT.md`
2. `AGENTS.md`
3. `ARCHITECTURE.md`
4. `GAME_1_0_SCOPE.md`
5. `DEFINITION_OF_DONE.md`
6. `docs/RESEARCH_MAGIC_SYSTEMS.md`
7. the relevant `.agents/skills/**/SKILL.md` files for the work you are about to perform

Then inspect the current repository and existing implementation.

Your job is not to produce a design document and stop. Your job is to **build a playable, polished, base-feature-complete Theandril 1.0**. Work autonomously, bias toward implementation, make reversible best-practice decisions when requirements are underspecified, and keep the repository runnable throughout development.

Use multiple specialist subagents when parallel work is safe and useful. Give each subagent explicit file ownership and a verifiable deliverable. Integrate and test their work yourself.

Immediately create or update `docs/IMPLEMENTATION_STATUS.md` with:
- current architecture,
- features that already work,
- missing 1.0 features,
- current test/performance status,
- the next implementation slice.

Then begin the highest-leverage unfinished slice. Do not wait for permission for routine implementation decisions. Do not treat placeholder buttons, mock screens, TODO comments, generated static screenshots, or design prose as completed features.

At the end of every meaningful slice:
- run typecheck/lint/tests,
- run the relevant Playwright gameplay scenario,
- check deterministic replay/save-load where affected,
- record meaningful performance results,
- update `docs/IMPLEMENTATION_STATUS.md`,
- continue to the next unfinished slice.

The release is complete only when the objective gates in `DEFINITION_OF_DONE.md` pass.

