# 0018 — general-led armies and sea travel

Date: 2026-09-05. Status: implementation in progress, not yet verified.

The user requested larger general-led armies with skill trees and ocean transport/naval warfare. Extend the existing formation containers, real characters and shared combat kernel rather than introducing a second military simulation.

Detached armies retain twelve formations. A healthy attached marshal commands sixteen; earned prerequisite-based command nodes can raise this to twenty. Preserve existing exclusive specializations and add separate learned tree nodes. Leader loss preserves every formation, blocks additional troops and limits an over-command army to one movement until reorganized or competently led. All capacity/skill decisions originate in simulation. The tactical grid expands to five columns/four ranks for modern twenty-formation battles; historical rules remain twelve/three ranks.

Fleets use the same formation containers but cannot mix land troops and ships. A separate canonical transport relation binds each carried land army to one owned fleet. Capacity counts land formations, not nested army containers; no nested transport. Embark/disembark commit movement and require adjacent permitted shores. Carried troops retain their identities and characters but cannot act or supply independent vision. Fleet movement and losses propagate to cargo deterministically; visible cargo-loss consequences must be explained and archived. Manual naval combat and autoresolve use the existing deterministic combat kernel with actual ship statistics and water-valid retreats.

Static water depth is a compact land/shallow/deep array. Generator 3 adds coastal shelves without changing land, existing biomes, fertility or starts. Existing generator versions reproduce their geography and legacy projections omit newly derived metadata. Coastal navigation, harbor construction and real ship recruitment establish access; ocean navigation and suitable hulls jointly gate deep water. Movement previews, queued paths and AI must use these same rules.

Save schema/rules 8 migrate schema 7 explicitly; genuine pre-change schema-7 mission, pending Rally battle and aftermath are retained in `packages/chronicle/src/fixtures/v7-archives.json` (gzip/base64, independently captured before content changes). Portable archive format stays version 2 with monotonically versioned records. Root owns canonical transport, save/record integration and verification; independent agents own general/character rules, geography/naval content, and human controls respectively.

Acceptance requires real commands, human and AI use, saved voyages/battles, historical replay, transport conservation/fog checks, narrow-screen inspection and measured larger battles/loaded fleets. This is not full 1.0 supply, invasions, naval diplomacy, officer politics or final ship animation.
