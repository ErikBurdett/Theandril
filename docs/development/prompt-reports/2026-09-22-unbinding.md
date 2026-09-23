# Unbinding: the counter that closes M2's loop — 2026-09-22

## Prompt

“okay continue”, continuing the road to 1.0 at M2 — *discover a magical site, qualify a caster, cast and counter a researched effect*. Rules 23 delivered the discovery half; this closes the loop with the counter and the faction asymmetry the milestone asks for.

## Delivered — rules/save 24

- **Unbinding.** A new working strips the binding from one active enemy formation: any ward is undone, and every Waykeeper escorting that formation loses the coming round. It costs five strain and may be used once a battle, so a counter is a decision, not a reflex.
- **A counter needs something to counter.** Unbinding refuses a formation that carries neither a ward nor a caster, and says so: *“Nothing binds this formation: choose a warded formation or one escorting a caster.”*
- **Interruption is saved state, not a flag.** A jarred caster's next legal round moves forward in the same record that governs every other cast, so the interruption survives a save, a replay and the chronicle.
- **Cultures train their own tradition.** A Waykeeper now takes the aptitudes of the culture that appoints them. The Cinder March and the Emberwake Convocation reach the second degree of Flame; the Sepulchral Synod and the Margin Observance reach the second degree of Rune — and only the second degree of Rune can unbind. Every other culture keeps the common training and cannot counter at all.
- **And its own theory is cheaper.** A discovery inside a realm's tradition is studied at three quarters of its price, so access and cost both differ by who you are.
- **The AI counters what it sees.** Automatic casting sends a counter at the strongest binding on the field, a ward to the front rank and a damaging working at the enemy most nearly broken.

## Content versioning

Magic content is now versioned in the content seal the way the pace table already was: a pack is sealed with the workings that campaign could actually reach. Every frozen pack still reproduces its exact hash — rules 17 `b79c78ed`, 18 `98b97bba`, 19–20 `3127e431`, 21 `f70d99d5`, 22–23 `f4076f55` — and rules 24 seals as `015468d1`.

## Verified locally

- Typecheck, lint, `content:validate` and build pass.
- `pnpm test`: 1,812/1,812 across unit, campaign and repository projects.
- A genuine rules-23 save and its 1,944-order archive from deployed `ef7a831` load, re-seal to identical v23 bytes, replay exactly, re-seal into a v24 envelope and continue ten rounds of AI play.
- Historical rules refuse the new theory, and an older envelope refuses a campaign that has researched it.

## Not done

- Unbinding is cast on your own round; there is no reactive interception of a cast as it happens.
- Aptitudes still never grow within a campaign, and the counter has no artwork of its own — it reuses the ward effect.
