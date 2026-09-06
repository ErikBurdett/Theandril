# Theandril Art Factory — Continuation Prompt

Continue building and operating the Theandril Art Factory from the current repository state.

Read:
- `AGENTS.md`
- `docs/art/ART_IMPLEMENTATION_STATUS.md`
- `docs/art/ASSET_CATALOG.md`
- the relevant `.agents/skills/**/SKILL.md`

Then inspect the actual code, Git history, generated assets, validation results, and screenshots.

Continue the highest-priority unfinished art-production work required by `MASTER_ART_FACTORY_PROMPT.md` and `ART_DEFINITION_OF_DONE.md`.

Important:
- Aseprite is already installed via Steam on this Omarchy machine.
- Use the existing Aseprite installation through the repository adapter.
- Do not reinstall it unless the existing installation is genuinely unusable and the reason is documented.
- Keep generation, validation, Aseprite processing, atlas generation, and PixiJS integration automated.
- Reject poor AI outputs rather than accepting them because generation succeeded.
- Inspect approved art in the actual game.

After each meaningful slice:
- run the art validation suite;
- regenerate affected manifests/atlases;
- launch the Art Lab or relevant game scenario;
- capture screenshots;
- visually inspect the result;
- update `docs/art/ART_IMPLEMENTATION_STATUS.md`;
- update `docs/art/ASSET_CATALOG.md`;
- commit useful working changes if Git access permits;
- continue.
