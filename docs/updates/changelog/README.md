# Commit notes

Add an optional Markdown file named `<full-commit-sha>.md` for an authored explanation of a commit. The build-time changelog generator includes it verbatim as a deliberately small safe Markdown subset (headings, paragraphs, lists, bold text and HTTPS links).

Regenerate the committed feed with `pnpm exec tsx scripts/build-changelog.ts`.
