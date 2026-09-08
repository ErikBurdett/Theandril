# 0033 — Static deployment and public asset resolution

The production web client supports both `/` and a project subpath such as `/Theandril/` without changing simulation, save, content or approved art identities.

The web shell owns deployment configuration. `VITE_BASE_PATH` supplies Vite's base; Turbo includes it in build inputs and explicitly forwards it in strict environment mode. Vite owns generated JS, worker and stylesheet URLs. `publicAssetUrl` resolves DOM and renderer public-file requests using the same base.

The shared renderer accepts an optional URL resolver rather than importing Vite/web globals. It applies that resolver only at catalog/atlas fetch and texture-load boundaries, including lazy battlefield loading. Catalog validation still sees the exact published declarations; integrity checks still hash the original approved bytes. Absolute remote/blob/data URLs remain resolved. Headless simulation and canonical state do not know where the game is hosted.

Deployment is an independent development-demo pipeline on `master`, not a relaxed 1.0 gate. It runs source checks and actual production UI scenarios before uploading only `apps/web/dist`. The existing full verification workflow remains unchanged. Four built/live UI scenarios cover real asset/worker resolution, fog, paid construction with saved-state restoration and deterministic battle restoration without development hooks.

Operational details and the public URL are in [deployment](../DEPLOYMENT.md). No rule version or save migration is introduced by hosting.
