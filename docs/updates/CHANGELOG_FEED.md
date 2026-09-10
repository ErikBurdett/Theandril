# Build-time changelog feed

`apps/web/src/updates/changelog/feed.json` is a committed, deterministic snapshot of the current first-parent Git history. Each entry records the commit identifier, author, ISO date, full message, numstat totals and top-level changed areas. The home page displays newest entries first.

Regenerate it with:

```sh
pnpm exec tsx scripts/build-changelog.ts
```

The drift test intentionally checks that the committed snapshot is an exact prefix-consistent subset of current history, rather than requiring the current checkout commit to already be in the snapshot. This keeps ordinary commits green while still detecting tampering. Optional detailed notes live in `docs/updates/changelog/<full-sha>.md`.
