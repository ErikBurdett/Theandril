# Hosted development demo

The public game is served at [erikburdett.github.io/Theandril](https://erikburdett.github.io/Theandril/). GitHub Pages is configured with **GitHub Actions** as its source and HTTPS enabled. It hosts the static single-player/AI-watch client and its simulation worker; there is no multiplayer server or cloud save service.

Every push to `master` runs [Publish development demo to Pages](../.github/workflows/pages.yml). The workflow installs the locked dependencies with Node 22 and the repository's pinned pnpm, checks types/lint/content and asset-integrity tests, builds the actual Pages base path, and runs the four production browser scenarios against that bundle. Only the verified `apps/web/dist` artifact is published. No secrets, source art, review gallery or development Art Lab is deployed. Actions are pinned to reviewed full commit SHAs; only the deployment job receives Pages-write and OIDC permissions. A failed build/smoke leaves the previous successful site intact.

This is explicitly a development demo. The independent full [verification workflow](../.github/workflows/verify.yml) remains enabled and unchanged. Its existing contact and long-campaign performance failures are not waived or hidden by the deployment gate; consult [implementation status](IMPLEMENTATION_STATUS.md) before describing the game as release-ready.

## Build and verify locally

```sh
VITE_BASE_PATH=/Theandril/ pnpm build
VITE_BASE_PATH=/Theandril/ pnpm exec playwright test --config playwright.pages.config.ts
```

Install Playwright Chromium first with `pnpm exec playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium` to use a local executable. The isolated preview uses port 4175; it does not stop the development server on 5173.

The same tests can verify the actual published site without a local server:

```sh
PAGES_SMOKE_URL=https://erikburdett.github.io/Theandril/ pnpm exec playwright test --config playwright.pages.config.ts
```

These checks use ordinary player UI, isolated browser storage and real downloaded resources. They verify worker-driven campaign creation, approved art bytes and materials, spectator fog, paid construction/save restoration, and a saved tactical battle with the same deterministic outcome. They neither require development hooks nor write to a remote game database.

An unset `VITE_BASE_PATH` retains `/` for localhost/root hosting. Turbo includes the variable in the build environment and cache key so a cached root build cannot be published accidentally. Vite prefixes generated scripts, styles, worker chunks and CSS public materials. Runtime catalog/atlas requests resolve at the fetch boundary: approved catalog URLs and SHA-256 identities remain unchanged, including the lazy battlefield atlas.

## Developer journal

The game links to the [developer journal](https://erikburdett.github.io/Theandril/updates/) at `updates/`. It is a separate HTML entrypoint in the same Vite build and Pages artifact: readers do not need to start a campaign or load the simulation to review updates. Internal links and image URLs use the configured Pages base; both the journal and the game must pass the production smoke before the artifact is uploaded. See [the dispatch authoring/review contract](updates/CONTRIBUTING.md).

## Update, inspect or recover

Commit and push ordinary changes to `master`; no separate publishing branch or manual asset upload is needed. Monitor the Pages workflow in the repository's Actions tab. Refresh the game after deployment to use the new bundle. An already-open game keeps its current JavaScript until reload; export important campaigns before updating. Save compatibility remains governed by the versioned loaders, not deployment.

For a transient deployment failure, rerun the workflow in Actions, or use its **Run workflow** action on `master`. For a bad change, make a reviewed revert commit on `master`; the same verification and automatic deployment apply. Do not force-push history, delete saves or bypass the smoke gate to recover the site.

Browser storage is origin-specific: localhost and github.io do not share IndexedDB. Use **Campaign & settings → Export campaign** on the old site and import that file on the new site. Clearing browser data can remove local saves; portable exports are the backup.

Implementation follows [Vite's static deployment guidance](https://vite.dev/guide/static-deploy.html) and [GitHub's custom Pages workflow requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
