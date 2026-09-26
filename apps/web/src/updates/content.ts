import type { Dispatch } from './types';

/** Editorial sequence, not release dates. Historical evidence is pinned below. */
export const sourceRevision = '8b3b8c148b7e8ee3689001210033fee7a1b8a6ef';
export const repository = 'https://github.com/ErikBurdett/Theandril';
const entries: Dispatch[] = [
  {
    publication: 'published', sourceRevision: '0d26fa3c34ac89164637f515e95671420400a841', sequence: 9,
    id: 'selection-groups', edition: '09', title: 'Recall a group, then give the order',
    subtitle: '26 September 2026 · Saved realm groups',
    summary: 'Remember the armies guarding a frontier or the hearths sharing a policy. Named groups now travel with the campaign, ready to recall, inspect and order through the existing registry.',
    topic: 'Engineering', tags: ['Empire management', 'Saved groups', 'Saves', 'Accessibility', 'Performance'],
    status: 'Reviewed checkpoint', checkpoint: 'Saved realm groups · rules 32', image: 'selection-groups-recall',
    takeaways: ['Keep up to twenty-four named army and hearth groups combined, with up to 128 members each.', 'Recall replaces the current tab’s selection. Postings and charters still require their explicit order buttons.', 'Groups follow campaign saves and exports; personal charter templates remain a separate browser library. M3 and all fifteen release gates remain open.'],
    sections: [
      { id: 'remember-the-selection', title: 'Remember the selection', paragraphs: [
        'A frontier watch may draw its armies from several registry pages. Hearths sharing a policy may be scattered across search results. Save that selection once, give it a name and recall it when the work returns. Each realm can keep up to twenty-four groups across armies and hearths, with up to 128 members per group and names of up to forty characters. Names are unique within each kind, ignoring case.',
        'Choosing a saved name only chooses the group to inspect. Recall group replaces the checks in the active tab with its currently eligible members, preserving the other tab’s selection. Recall changes neither the canonical hash nor worker-transfer totals. Post selected armies and Apply charters remain separate decisions, with the existing individual overrides and per-member refusal results.',
        'The compact image is an exact browser clip of the saved-army selector and Recall button at a 390-pixel viewport. Watch company has just been recalled in an authored regression with one hundred owned armies and forty hearths. Its three-member count and confirmation sit outside this clip; the linked full capture shows the surrounding selection. No posting has been issued at this stage.',
      ] },
      { id: 'keep-the-members-honest', title: 'Keep the members honest', paragraphs: [
        'A saved army group can retain an embarked land army, but Recall skips passengers while they are aboard because group postings operate on armies ashore. The interface reports skipped members. Updating a group replaces its whole membership with the current checks and warns about saved members that will be removed, including any skipped passengers. New groups need at least one member; existing groups may be deliberately emptied.',
        'Permanent loss, ownership changes, founding and merging away an army remove its membership. Empty groups remain available to refill or delete. A newly split army or a merge recipient is not enrolled automatically. Fleets are outside this slice. Deleting a group leaves existing postings and charters intact: the group remembers whom to select, while those policies continue to govern each entity.',
      ] },
      { id: 'carry-groups-with-the-campaign', title: 'Carry groups with the campaign', paragraphs: [
        'These groups belong to canonical campaign state and survive manual saves, reload, replay and compressed export/import. They are separate from the personal browser-local charter templates introduced in the previous dispatch. The simulation validates membership and names; only detached copies of the owning realm’s groups enter its observation. Group edits use ordinary recorded commands and a separate ID counter, so organization does not consume gameplay entity IDs or resources.',
        'Rules/save advance to 32; content remains 015468d1. Four genuine rules31 checkpoints were captured before canonical changes, retaining exact original bytes and replay seals for generated starts, founding, charters, postings and finite-supply naval travel. Older loads receive fresh empty group registers. A populated register or a used group counter cannot be silently exported or executed under older rules, even after its groups are deleted.',
        'Review found shared default arrays between older save loads and a response path that could report success before malformed group data failed to render. Fresh migration arrays and a bounded response check now close those paths. Recording, publication and presentation failures end pending work and require restoration before further orders. The evidence retains both findings and their corrections.',
      ] },
      { id: 'repair-the-supported-limit', title: 'Keep the supported campaign limit saveable', paragraphs: [
        'The first scale benchmark attempted sixty-four realms with an older generator that did not support them. Moving the fixture to current generator 8 exposed a real existing defect: a campaign could create sixty-four realms, but its arcane-research save register still accepted only forty-eight. Rules32 now accepts sixty-four research rows. Rules31 and earlier keep their frozen forty-eight-row schema, and historical export refuses an unrepresentable campaign.',
        'Generated campaigns with sixty-four major realms and with forty major realms plus twenty-four city-states now roundtrip exactly; sixty-five is rejected. The original failing regression and thirty-five focused passing tests remain linked. This bounded repair belongs to the existing giant-scale and save-integrity acceptance, Gates D and E. It adds no new gameplay scope.',
      ] },
      { id: 'measure-the-work', title: 'Measure the work being added', paragraphs: [
        'The authored Huge and Legendary benchmark saturates forty-eight and sixty-four realms with 147,456 and 196,608 membership references. Across fifteen samples after three warmups, retained-member reconciliation medians are 3.234 and 4.202 milliseconds; loss reconciliation medians are 3.274 and 4.205 milliseconds, with 95th percentiles of 4.136 and 4.910 milliseconds. Reconciliation runs after relevant entity-loss or transfer boundaries, not ordinary movement or observation.',
        'The owning realm’s groups add 36,518 and 36,590 bytes to observation JSON; full observation JSON is 643,105 and 642,803 bytes. Those figures are synthetic observation sizes, not packed worker responses or browser frame-time measurements. The benchmark includes strict saved roundtrips but excludes a full turn, rendering, sustained memory and organically grown mature realms.',
      ] },
      { id: 'another-part-of-delegation', title: 'Another part of delegation', paragraphs: [
        'At the pinned implementation revision, 1,941 headless tests across 243 files pass in 59.19 seconds. Twenty affected Chromium gameplay journeys pass in 2.6 minutes. One separate built-production group journey passes in 7.8 seconds through generated campaigns and ordinary controls. These overlapping scopes are reported separately, not added together. Whole-project typecheck, lint, content/art validation and the Pages-subpath build pass; publication checks follow this implementation pin.',
        'The authored large-realm journey covers saved selections across pages and filters, explicit orders, keyboard recall, 390-pixel controls and recovery. The separate production journey covers founding and pruning, both group kinds, manual save, reload, compressed export/import and campaign isolation. Two earlier browser failures came from reading the previous campaign before generation finished; the corrected barrier waits for terminal feedback, enabled End turn and the new seed. The original empty-group assertion remains unchanged, and both failed runs remain in the record.',
        'This advances existing ACT-32/M3 delegation and Gates D, E and I without cutting accepted scope. M3 remains in progress: theaters, patrol and escort roles, army-order templates, production sequences, broader governors and combined mature-realm acceptance remain open. All fifteen release gates remain open. Contributors can extend these workflows through the canonical commands and bounded registry, preserving explicit orders, loss handling and saved history.',
        'No campaign-resolution rule, AI policy or price changes here, so no new pacing run is claimed. The separate rules31 measurement from 23 September remains Standard 234, Long 342 and Epic 379; Standard and Long remain above their approximate targets. Passing proxy campaigns in the full suite does not replace that headline measurement. Cross-browser certification, sustained scale proof and overall release acceptance still need their own evidence.',
      ] },
    ],
    evidence: [
      { label: 'Saved groups verification', path: 'docs/development/2026-09-25-selection-groups/README.md', note: 'Exact local scopes, retained failures, compatibility, source boundaries and remaining ACT-32 acceptance.' },
      { label: 'Saved groups architecture', path: 'docs/architecture/0042-selection-groups.md', note: 'Canonical membership, loss reconciliation, separate IDs, observation privacy and historical schemas.' },
      { label: 'Independent integration review', path: 'docs/development/2026-09-25-selection-groups/integration-review.md', note: 'Canonical and worker review, malformed-response correction and the bounded sixty-four-realm save repair; reviewer authorship is disclosed.' },
      { label: 'Browser and visual review', path: 'docs/development/2026-09-25-selection-groups/browser-review.md', note: 'Authored scale and generated production journeys, exact screenshots, corrected observation barriers and narrow keyboard use.' },
      { label: 'Bounded reconciliation benchmark', path: 'docs/development/2026-09-25-selection-groups/benchmark.json', note: 'Forty-eight/sixty-four-realm synthetic saturation, fifteen samples, JSON sizes and strict saved roundtrips.' },
      { label: 'Current and historical save boundary', path: 'packages/sim/src/sixty-four-seat-save.test.ts', note: 'Both supported sixty-four-realm compositions, rejected sixty-five rows and frozen historical export limits.' },
      { label: 'Production saved-group journey', path: 'tests/production/selection-groups.spec.ts', note: 'Real generated campaigns, explicit orders, saved restoration and portable import without development hooks.' },
      { label: 'Original screenshots and provenance', path: 'docs/development/2026-09-25-selection-groups/screenshots/provenance.json', note: 'Exact full captures and native 318×121 browser clip; no post-capture transformations.' },
    ],
  },
  {
    publication: 'published', sourceRevision: '3ed4a6c456c3e4130fddf35b44dfdf51034cc269', sequence: 8,
    id: 'charter-templates', edition: '08', title: 'Keep a charter worth repeating',
    subtitle: '25 September 2026 · Reusable charter policies',
    summary: 'Save a useful charter policy by name, recall it in another campaign, then choose which hearths should receive it. A personal browser library keeps repeated setup apart from the orders already governing a realm.',
    topic: 'Engineering', tags: ['Empire management', 'Charters', 'Templates', 'Browser storage', 'Accessibility'],
    status: 'Reviewed checkpoint', checkpoint: 'Charter templates · ACT-32', image: 'charter-templates-controls',
    takeaways: ['Keep up to twenty-four named charter policies in this browser, each with a focus and coin ceiling.', 'Recall fills the group form. Apply charters is still the explicit order that changes selected hearths; editing a template never changes existing charters.', 'Keyboard, narrow-screen and storage recovery journeys verify this bounded workflow. Broader templates, named groups and M3 acceptance remain open.'],
    sections: [
      { id: 'keep-a-useful-policy', title: 'Keep a useful policy', paragraphs: [
        'A group of hearths may need the same brief several times: Learning with a 32-coin ceiling for one campaign, or Works with a smaller allowance for another. Open Charter templates inside the selected-hearth form, give the current focus and ceiling a name, and save it. The library holds up to twenty-four policies, with unique names of up to forty characters. Update replaces the selected saved policy; Delete removes it from the library.',
        'Choosing a saved entry shows its name and policy without changing the charter form. Recall template fills the form, and Apply charters remains a separate decision. The pictured Study charter has been recalled by keyboard. Its visible message asks the player to review the policy before issuing orders. The exact 318-by-724-pixel locator capture shows the actual controls within a 390-pixel browser viewport, with no later crop, resize or re-encoding.',
      ] },
      { id: 'a-library-beside-the-campaign', title: 'A library beside the campaign', paragraphs: [
        'The templates belong to this browser and origin. They survive refresh and a change of campaign, but are not included in campaign exports, synchronized to another device, or refreshed live from another open tab. Competing writes serialize; two tabs editing the same template use the last committed write. A template contains a name, a focus and a ceiling. It does not remember selected hearths or create a persistent named group.',
        'Once applied, each hearth’s charter follows the existing simulation rules and is saved in the campaign as before. A template update does not rewrite those active charters. Individual overrides, partial refusals, existing production queues, the per-work ceiling and the shared forty-coin reserve remain unchanged. The template library adds no purchase, turn processing or worker message.',
      ] },
      { id: 'keep-failures-visible', title: 'Keep failures visible', paragraphs: [
        'Storage reads and writes are bounded and validated. Unsupported or malformed stored rows are refused without being deleted or silently repaired. Duplicate names, a full library and failed writes produce a visible explanation. A failed library operation releases the ordinary charter controls, so the player can continue with the existing form. Retry reloads the library; it does not retry a game order.',
        'Independent review found that reusing a connection after an initial denied open could keep Retry from working after access returned. Retry now opens a fresh connection. Leaving the panel defers connection closure until an in-flight storage operation settles, and a late reply cannot update a replacement panel. If a template change commits but the following refresh fails, the message states that the change was saved and the library could not be loaded.',
      ] },
      { id: 'follow-a-policy-through-real-controls', title: 'Follow a policy through real controls', paragraphs: [
        'The authored Legendary browser fixture has forty owned hearths, one hundred owned armies and 4,000 armies in the world. Real controls save and update a policy, recall it by keyboard at 390 pixels, and verify that library actions do not change the canonical hash or worker-transfer totals. The actual compressed campaign export contains no template name or preference history. Applying forty Learning charters with a 32-coin ceiling then publishes one ordinary group response while preserving queues, treasury and explored knowledge. Individual override and exact campaign save restoration remain separate actions.',
        'The same journey retains the library after refresh and deletes through the visible controls. Other cases expose denied and malformed storage, preserve the malformed row, and recover from a transient failed open in the same mounted panel. The separate production journey founds hearths in two generated tiny two-realm campaigns, retains the template between them, and exercises recall, explicit assignment, manual save, narrow revocation and restoration without development hooks. These controlled journeys do not establish organic growth of the pictured large realm or browser-wide release certification.',
      ] },
      { id: 'another-part-of-delegation', title: 'Another part of delegation', paragraphs: [
        'The pinned implementation passes 1,902 headless tests across 237 files in 55.46 seconds with four local workers. Sixteen affected Chromium gameplay journeys pass in 1.8 minutes, and one separate built-production template journey passes in 8.2 seconds. Typecheck, lint, content and art validation, and the Pages-subpath build pass. These execution scopes overlap and are reported separately, not added together. The reviewed Retry defect and its correction remain in the evidence; the transient-denial browser case proves recovery. This eighth article’s publication checks follow separately.',
        'Rules/save remain 31 and content remains 015468d1. This interface and personal preference store changes no simulation rule, AI decision, price or campaign save format. Pacing was not rerun; the earlier headline remains Standard 234, Long 342 and Epic 379, with Standard and Long above their approximate targets.',
        'This advances existing ACT-32 scope without adding or cutting release obligations. M3 remains in progress. Saved charter policies cover one repeatable brief; army order templates, production sequences, durable named groups, theater strategy, patrol and escort roles, broader governor decisions and combined mature-campaign delegation remain unfinished. All fifteen release gates remain open.',
      ] },
    ],
    evidence: [
      { label: 'Charter templates verification', path: 'docs/development/2026-09-25-charter-templates/README.md', note: 'Exact local results, separate execution scopes, authored browser boundaries and remaining delegation work.' },
      { label: 'Charter templates architecture', path: 'docs/architecture/0041-charter-templates.md', note: 'Personal preferences, explicit Recall and Apply, bounded storage and unchanged canonical commands.' },
      { label: 'Independent storage review', path: 'docs/development/2026-09-25-charter-templates/integration-review.md', note: 'Transaction and validation review, explicit authorship boundaries and UI lifecycle self-review.' },
      { label: 'Independent UI review', path: 'docs/development/2026-09-25-charter-templates/storage-and-ui-review.md', note: 'Cached failed-open finding, fresh-connection correction and direct-control independence.' },
      { label: 'Actual production template journey', path: 'tests/production/charter-templates.spec.ts', note: 'Two generated campaigns, persistent browser preferences, explicit charter orders and saved restoration without debug hooks.' },
      { label: 'Original screenshot provenance', path: 'docs/development/2026-09-25-charter-templates/screenshots/provenance.json', note: 'Exact inspected Playwright pixels, authored setup and keyboard Recall before explicit Apply.' },
    ],
  },
  {
    publication: 'published', sourceRevision: 'f78ed07d04ffbc3310d05e0124aa6d8f9d5a09e9', sequence: 7,
    id: 'group-charters', edition: '07', title: 'One charter policy for forty hearths',
    subtitle: '24 September 2026 · Settlement delegation',
    summary: 'Give selected hearths the same standing charter, keep their queued work intact, and inspect each result. Shared controls now explain what every hearth may spend from the realm’s treasury.',
    topic: 'Engineering', tags: ['Empire management', 'Charters', 'Production', 'Worker transport', 'Saves'],
    status: 'Reviewed checkpoint', checkpoint: 'Group hearth charters · ACT-32', image: 'group-charters-narrow',
    takeaways: ['Select up to 128 owned hearths across search and 25-row pages, then apply or revoke existing charter policies together.', 'Each charter has a ceiling per work and shares the treasury’s forty-coin reserve. Assignment and revocation preserve current queues and spend no coin immediately.', 'Forty-hearth browser and worker fixtures prove bounded workflows; saved reusable templates, broader governor decisions and M3 acceptance remain open.'],
    sections: [
      { id: 'give-hearths-a-shared-brief', title: 'Give hearths a shared brief', paragraphs: [
        'A growing realm needs a way to give several hearths the same standing brief without opening every settlement panel. Select owned hearths across the registry’s search results and 25-row pages, choose Works, Wealth, Learning or Muster, then apply the existing charter policy to as many as 128 hearths in one request. Army and hearth selections remain independent across tabs.',
        'The shared form is a temporary convenience. Each resulting charter remains an individual saved policy, and an order at one hearth changes only that hearth. Accepted orders leave the selection; refused hearths stay checked with their canonical reason. Registry rows show the current policy and its observed next work or blocker.',
      ] },
      { id: 'understand-the-shared-treasury', title: 'Understand the shared treasury', paragraphs: [
        'Applying a charter spends nothing immediately. Once per turn after upkeep, a charter can buy one work when its hearth’s queue is empty, within its own ceiling and while leaving forty coin in the shared treasury. The ceiling applies to each work; it is not one pooled allowance for every selected hearth. Muster recruits land companies that add upkeep. Existing production always comes first.',
        'Revoking a charter stops future orders and keeps its current queue. The screenshot deliberately shows an empty, unsubmitted grant ceiling: Apply charters is disabled, while Revoke charters remains available for the forty existing policies. Revocation uses each saved charter’s valid ceiling, so an unfinished new form cannot prevent cancellation. This is an inspected 390-pixel browser capture with unchanged PNG bytes, not a normal empty campaign state.',
      ] },
      { id: 'keep-each-order-accountable', title: 'Keep each order accountable', paragraphs: [
        'The worker validates the entire request before applying its first command, then records ordinary setCharter commands in stable settlement-ID order. The simulation retains authority over legality and production. One final permitted observation reports the results; a canonical refusal does not undo earlier accepted orders or prevent later valid ones.',
        'These commands are not an atomic transaction. If recording fails after a mutation, processing stops, the actual partial state is returned and restoration is required. Missing or unreadable responses also finish pending work and lock further orders until a saved campaign is restored. The interface does not leave a spinner running or quietly retry an uncertain order.',
      ] },
      { id: 'follow-forty-hearths', title: 'Follow forty hearths', paragraphs: [
        'The authored Legendary browser fixture has forty owned hearths, one hundred owned armies and 4,000 armies overall. Real controls select across pages, filters and tabs, apply forty Wealth charters, save, override one hearth, revoke at 390 pixels and restore the exact saved hash. Assignment preserves treasury, existing queues and explored knowledge, and sends one final worker packet. Separate cases exercise a real capacity refusal and two damaged-response recoveries.',
        'A separate production journey begins a generated tiny two-realm campaign, founds a hearth through ordinary controls, grants Wealth with a 24-coin ceiling, saves, revokes on a narrow screen and restores the policy. It passes without development hooks. These are controlled player journeys; the pictured large realm was authored for regression coverage rather than grown through an organic campaign.',
        'The smaller worker fixture uses a Small map, generator 4 and seed 17, with forty authored hearths and two paid manual queues. Grouped and serial commands produce identical archives, replay and final hash e204a0e9. The grouped transfer is 193,929 bytes, including 1,981 result bytes, versus 7,409,845 bytes for forty serial responses. It publishes once instead of forty times. The retained 12.14ms and 459.89ms timings are one synthetic sample including cloning, not browser frame-time distributions or whole-campaign speedups.',
      ] },
      { id: 'a-further-step-toward-delegation', title: 'A further step toward delegation', paragraphs: [
        'The pinned implementation passes 1,889 headless tests across 235 files with four local test workers, 12 affected Chromium journeys and the one new built-production charter journey. Typecheck, lint, content and art validation, and the Pages-subpath build pass. These scopes are reported separately, not added together. Earlier selector failures, sandbox subprocess refusals and a Git-history timeout under concurrent load remain in the evidence. Timeouts and assertions were unchanged. This seventh article’s publication checks follow separately.',
        'Rules/save remain 31 and content remains 015468d1. No simulation rule, AI policy, price or save format changed, so pacing was not rerun for this interface and transport extension. The prior headline remains Standard 234, Long 342 and Epic 379, with Standard and Long above their approximate targets.',
        'This advances existing ACT-32 scope without adding or cutting release obligations. M3 remains in progress: durable named groups, saved reusable templates, theater strategy, patrol and escort roles, broader governor decisions and combined mature-campaign delegation still need implementation and proof. All fifteen release gates remain open.',
      ] },
    ],
    evidence: [
      { label: 'Group charters verification', path: 'docs/development/2026-09-24-group-charters/README.md', note: 'Exact local results, failed attempts, authored browser scope and remaining delegation work.' },
      { label: 'Group charter architecture', path: 'docs/architecture/0040-group-charters.md', note: 'Budget disclosure, preserved queues, canonical command authority and bounded worker publication.' },
      { label: 'Independent integration review', path: 'docs/development/2026-09-24-group-charters/integration-review.md', note: 'Client and worker boundaries reviewed separately from browser execution.' },
      { label: 'Worker evidence and client review', path: 'docs/development/2026-09-24-group-charters/worker-review.md', note: 'Forty-hearth serial comparison, exact bytes, sample timings and explicit reviewer authorship boundaries.' },
      { label: 'Actual production charter journey', path: 'tests/production/group-charters.spec.ts', note: 'Generated campaign, ordinary founding and charter controls, narrow revocation and saved restoration without debug hooks.' },
      { label: 'Original screenshot provenance', path: 'docs/development/2026-09-24-group-charters/screenshots/provenance.json', note: 'Exact inspected pixels and authored setup; the narrow view intentionally has an invalid unsubmitted grant ceiling.' },
    ],
  },
  {
    publication: 'published', sourceRevision: '3ae1581089411a76ecfd08a8f5f811258c4f77f6', sequence: 6,
    id: 'group-postings', edition: '06', title: 'One posting for a hundred armies',
    subtitle: '23 September 2026 · Standing orders across a realm',
    summary: 'Select armies across the registry, give them standing postings together, and keep control of each member. One bounded request now returns one campaign update with a clear result for every order.',
    topic: 'Engineering', tags: ['Empire management', 'Standing orders', 'Worker transport', 'Saves'],
    status: 'Reviewed checkpoint', checkpoint: 'Group postings · ACT-32', image: 'group-postings-desktop',
    takeaways: ['Select up to 128 land armies ashore across search and 25-row pages, then post them where they stand or at an owned hearth.', 'Each army keeps its own saved order. Accepted armies leave the selection; refused armies stay selected with their canonical reason.', 'The 100-army browser journey covers individual override, clearing and save restoration. Broader theater planning and all fifteen release gates remain open.'],
    sections: [
      { id: 'give-the-order-together', title: 'Give the order together', paragraphs: [
        'A hundred armies should not require a hundred trips through selected orders to receive the same standing instruction. The realm registry now lets players check land armies ashore and apply a posting to the group. Selection survives search changes and the existing 25-row pages. The panel counts selected armies outside the current filter, and Select matching armies reaches across pages up to a disclosed 128-army request limit. That limit does not cap the realm’s armies or postings.',
        'Choose where each army stands or one owned hearth, then choose Hold or Join on arrival. Existing travel orders take precedence, movement and joining use the ordinary rules, and stalled postings retain their explanations. An individual order can override one member later. Clearing postings skips selected armies without one. Selection is temporary interface state; the resulting postings are saved campaign orders.',
      ], image: 'group-postings-narrow' },
      { id: 'keep-the-result-inspectable', title: 'Keep the result inspectable', paragraphs: [
        'Accepted armies leave the selection. Refused armies remain checked beside the simulation’s reason, ready for inspection or correction. One refusal does not undo earlier accepted orders or prevent later valid ones. The interface submits existing commands; packages/sim still decides their legality.',
        'The worker validates the whole request before the first command, processes it in stable army-ID order and records accepted and canonically refused commands in the ordinary journal. It sends one final permitted observation with the results. These commands are not an atomic transaction: a recording interruption stops processing, returns the actual partial state and requires restoring a saved campaign. The interrupted order is never described as an ordinary refusal or a rollback.',
      ] },
      { id: 'follow-the-hundred-army-journey', title: 'Follow the hundred-army journey', paragraphs: [
        'The screenshots come from a real browser journey over an authored Legendary fixture: 100 owned armies, forty owned hearths and 4,000 armies in the world. Keyboard selection, paging and search lead to one hundred hold postings. Normal controls then save the campaign, change one army to Join, clear the group and restore the posted state with its exact hash. Selecting checkboxes changes neither canonical state nor worker-transfer totals.',
        'The desktop capture shows all 100 orders accepted. The 390-pixel capture shows the same armies selected before clearing, after the individual override. Both images retain their original PNG bytes. A separate boundary fixture produces an actual partial refusal at the existing posting limit. Two browser fault injections also prove that damaged responses finish pending work, require recovery and allow a clean retry after restoring a save. These authored regressions do not depict an organically developed empire.',
      ] },
      { id: 'send-the-summary-once', title: 'Send the summary once', paragraphs: [
        'A worker-harness comparison applies 100 grouped postings and the same commands separately. Both paths produce the same archive and hash e43b0ca7. The grouped request transfers 531,302 bytes, including 3,725 result bytes, instead of 51,416,921 bytes, publishing one state response instead of 100. A separate browser assertion verifies one final packet, unchanged explored knowledge and no cell rows beyond the empty codec header.',
        'The retained single harness sample took 10.97 milliseconds for the group and 686.40 milliseconds for the serial requests, including structured cloning. These are synthetic worker timings, not browser frame-time distributions or whole-campaign speedups. The final summary still contains the existing army read models; the improvement avoids publishing them repeatedly. No global work was added to each turn or frame.',
      ] },
      { id: 'a-bounded-step-toward-delegation', title: 'A bounded step toward delegation', paragraphs: [
        'At the pinned implementation revision, 1,876 headless tests across 234 files and seven affected Chromium journeys pass. Typecheck, lint, content and art validation, and the production build pass. The 27 production Pages checks also pass at that checkpoint, before this sixth article was added; its publication layout receives a separate review. These execution scopes overlap and are not added into a larger total. Earlier failed attempts and their corrections remain in the linked record.',
        'This advances existing ACT-32 and M3 scope without changing simulation or AI rules, canonical state, save formats, content or campaign prices. Rules/save remain 31 and content remains 015468d1. Pacing was not rerun for this interface and transport change; the preceding fleet measurement remains Standard 234, Long 342 and Epic 379.',
        'M3 remains in progress. Theater strategy, patrol and escort roles, durable named groups, broader order templates, settlement batch policies and combined mature-empire acceptance still need implementation and proof. Selection currently covers land armies ashore, not fleets or embarked passengers. No accepted scope is cut or added here, and all fifteen release gates remain open.',
      ] },
    ],
    evidence: [
      { label: 'Group postings verification', path: 'docs/development/2026-09-23-deploy-and-group-postings/README.md', note: 'Exact local checks, authored browser scope, corrected failures and remaining ACT-32 work.' },
      { label: 'Bounded worker architecture', path: 'docs/architecture/0039-group-postings.md', note: 'Canonical command authority, partial outcomes, interrupted recording and the single synthetic transfer sample.' },
      { label: 'Independent integration review', path: 'docs/development/2026-09-23-deploy-and-group-postings/code-review.md', note: 'Error-path finding, correction and real-worker recovery checks.' },
      { label: 'Real group-order browser journey', path: 'tests/gameplay/group-postings.spec.ts', note: 'Ordinary controls over authored scale and capacity fixtures; selection, individual override and exact save restoration.' },
      { label: 'Original screenshots and provenance', path: 'docs/development/2026-09-23-deploy-and-group-postings/screenshots/provenance.json', note: 'Retained desktop and narrow captures with source paths, dimensions and exact hashes.' },
      { label: 'Implementation status and remaining scope', path: 'docs/IMPLEMENTATION_STATUS.md', note: 'M3 remains in progress and every whole release gate remains open at this source pin.' },
    ],
  },
  {
    publication: 'published', sourceRevision: 'b623c2c91d4d852cba710f2d996c28a6b1b5d624', sequence: 5,
    id: 'fleet-provisions', edition: '05', title: 'A voyage needs stores for the way home',
    subtitle: '23 September 2026 · Fleet provisions & naval staging',
    summary: 'Fleets and their passengers now share finite stores. Sailors need a route back to harbor supply, the AI plans for that return, and a saved voyage keeps the supplies it actually has.',
    topic: 'Engineering', tags: ['Supply', 'Naval expeditions', 'AI', 'Campaign pacing', 'Saves'],
    status: 'Reviewed checkpoint', checkpoint: 'Fleet provisions · rules 31', image: 'fleet-provisions-saved-voyage',
    takeaways: ['Eight turns of stores feed hulls and passengers beyond friendly harbor supply; the last ration feeds everyone before later attrition begins.', 'The AI returns to known supply, waits to replenish and can fund an owned coastal staging harbor. Some disrupted or distant voyages still incur losses.', 'The measured twelve-realm Epic campaign ends at turn 379. Standard at 234 and Long at 342 remain above their approximate targets; all fifteen release gates remain open.'],
    sections: [
      { id: 'bring-enough-for-the-return', title: 'Bring enough for the return', paragraphs: [
        'A harbor could feed nearby water, but until now a fleet never needed that food. Ships and passengers could remain across an ocean indefinitely. Each fleet now carries eight turns of stores outside its own realm’s supply. The final ration still feeds every formation aboard. A further turn without supplies costs each hull and passenger formation four strength, bounded by the existing strength floor, and slows morale and fatigue recovery.',
        'The selected fleet and passenger panels show the same remaining stores and explain whether their position permits replenishment. End a turn within friendly harbor supply to refill. Supply resolves before queued movement, so a fleet arriving by a queued route refills at the following supply phase. Splitting hulls preserves their endurance; merging or transferring them retains the shorter endurance. Reorganization cannot manufacture food.',
      ] },
      { id: 'follow-a-saved-voyage', title: 'Follow a saved voyage', paragraphs: [
        'The illustrated expedition is an authored browser regression with funded ships, an explicit offshore starting position and two turns of stores. Through ordinary player controls it moves, saves, reloads and consumes those final rations. The next turn reduces every hull and passenger formation by exactly four strength. The player then sails into harbor reach, replenishes stores and saves again.',
        'The narrow capture shows the passengers drawing from their carrier’s empty stores. It is the actual selected-orders panel at 390 pixels wide, with the same warning and supply values used by gameplay. These are inspected, unchanged Playwright screenshots. They illustrate a controlled player journey; they do not depict an organically earned AI invasion.',
      ], image: 'fleet-provisions-exhausted-narrow' },
      { id: 'plan-the-way-home', title: 'Plan the way home before the fleet is empty', paragraphs: [
        'The AI reads its own supply observations and canonical movement quotes. It plans a return over observed, permitted water, accounts for sailing limited by current sight and waits for replenishment after reaching supply. An immediately legal expedition landing can take precedence over returning. A depleted expedition near an owned coastal foothold can also prompt a paid harbor order, using the ordinary construction price and eligibility rules.',
        'Independent review found a coastal galley choosing nearby deep-water supply cells even though it could reach supplied shallows around the bay. The corrected planner filters destinations by hull depth capability before retaining its two return candidates. The canonical route quote still decides whether the route is legal. Planning remains bounded to eight fleets and eight shared route queries per pass; two nearby candidates cannot prove every blocked channel or lost-port recovery.',
        'A separate generated Small/islands campaign, seed 20260905, ran 100 rounds with no granted ships, funds, harbors or map knowledge. It recorded 2,819 accepted orders and zero refusals, 289 return movement steps, 86 resupply events, six landings and two settlements founded by transported armies. A saved mirror matched 2,477 commands and final hash afc149a5. One fleet and one passenger army each suffered one attrition turn and lost four strength. That remaining cost is part of the evidence.',
      ], image: 'fleet-provisions-refilled-narrow' },
      { id: 'measure-the-campaign', title: 'Measure the campaign that players are promised', paragraphs: [
        'The headline measurement uses a Standard map with twelve realms and seed 20260905. At unchanged pace prices, Standard ends at turn 234, Long at 342 and Epic at 379. The comparable rules30 runs ended at 223, 367 and 388. Epic falls within its 350–400-turn target for this seed. Standard and Long remain above their approximate 200- and 300-turn targets, so this is not acceptance of every campaign pace.',
        'All seven final headline and tiny proxy cases reach Prosperity with zero refused orders. Tiny four-realm campaigns remain fast regression proxies, with their own retained bounds; they do not replace the headline. No price, test timeout, proxy bound or campaign cap was changed to obtain these results. Broader seed coverage and Standard/Long balance remain work for the campaign gates.',
      ] },
      { id: 'keep-the-supplies-and-the-record', title: 'Keep the supplies and the record', paragraphs: [
        'Campaign rules and save format advance to 31; content remains 015468d1. The simulation owns the optional fleet-store field, its attrition and its replenishment. The interface receives the owning realm’s supply read model, while foreign stores remain private. Resolving carriers before passengers prevents army identity ordering from consuming the passengers’ last ration too early.',
        'Six genuine rules30 saves and archives were captured before the change. Their original bytes, hashes and command replay remain exact. Continuing an old voyage under the current rules introduces finite stores without rewriting the old record prefix. Modern and mixed histories survive local storage, compressed export/import and replay. Old envelopes reject the new field instead of silently discarding it.',
        'At the pinned implementation checkpoint, typecheck, lint, content validation, the Pages-subpath production build and all 1,861 headless tests across 232 files pass. Nine affected Chromium journeys cover army composition, naval travel and battle, postings and supply. Earlier unsuccessful checks remain in the evidence record. These are local, scoped results, not complete browser certification or an overall release signoff.',
      ] },
      { id: 'the-cost-and-the-next-step', title: 'The cost and the next step toward 1.0', paragraphs: [
        'Returning intelligently adds work. On authored complete-chart Huge and Legendary workloads with 64 and 128 loaded fleets, median supply resolution measures 5.81 and 10.42 milliseconds. Aware naval planning measures 41.89 and 79.53 milliseconds, versus 33.77 and 63.04 without the provision policy. These isolated single-realm samples exclude setup, rendering, full economic turns and sustained memory; they are not a whole-campaign speedup or a completed scale gate.',
        'This completes the bounded fleet-provisions task within the accepted supply and sustained naval operations scope. No new gameplay obligation or scope cut is introduced. It advances Gates B, C, E, F, I and K while all fifteen release gates remain open. Material supply costs, paid trade routes, taxation, treaty access, coordinated escorts and reinforcement, broader lost-port recovery and Standard/Long pacing still need development and proof.',
        'Contributors can start with the fleet-supply regressions, the naval planner and the retained pacing driver linked below. New logistics work needs actual player controls, observation-limited AI, save/replay continuity and measured campaign outcomes. The current roadmap records these remaining obligations; the older dispatches keep their original source pins and historical results.',
      ] },
    ],
    evidence: [
      { label: 'Fleet provisions verification and limits', path: 'docs/development/2026-09-23-fleet-provisions/README.md', note: 'Local implementation evidence retained before publication, including historical comparisons, failed checks and current scope limits.' },
      { label: 'Fleet supply architecture', path: 'docs/architecture/0038-fleet-provisions.md', note: 'Canonical stores, turn ordering, passengers, reorganization and historical boundaries.' },
      { label: 'Measured campaign pacing', path: 'docs/development/2026-09-23-fleet-provisions/pacing-final.log', note: 'Final seven headline/proxy campaigns; Standard 234, Long 342 and Epic 379 on the twelve-realm headline.' },
      { label: 'Generated play and separate scale timings', path: 'docs/development/2026-09-23-fleet-provisions/benchmark-fleet-supply.json', note: 'Organic island play, saved mirror, actual remaining attrition and authored throughput samples.' },
      { label: 'Independent code review', path: 'docs/development/2026-09-23-fleet-provisions/code-review.md', note: 'Reproduced coastal-depth failure, verified correction and bounded planner limits.' },
      { label: 'Independent persistence review', path: 'docs/development/2026-09-23-fleet-provisions/persistence-review.md', note: 'Current field retention, old-envelope rejection, mixed history and fleet lifecycle.' },
      { label: 'Factual evidence review', path: 'docs/development/2026-09-23-fleet-provisions/factual-review.md', note: 'Counts, pacing, generated outcomes and exact artifact hashes checked before publication preparation.' },
      { label: 'Browser journeys and image provenance', path: 'docs/development/2026-09-23-fleet-provisions/screenshots/provenance.json', note: 'Exact reviewed pixels, source hashes, viewports and authored setup; no image transforms.' },
    ],
  },
  {
    publication: 'published', sourceRevision: '1e41ec24965e46e8035c57b4f54632a690b8b712', sequence: 4,
    id: 'campaign-foundation-and-development-order', edition: '04', title: 'A funded expedition and a practical route to 1.0',
    subtitle: '21 September 2026 · Campaign foundations & the next playable systems',
    summary: 'An island realm now counts the harbor it has already paid for. Fleet planning, explored land and campaign records take less repeated work, while the remaining Epic timing failure stays visible.',
    topic: 'Engineering', tags: ['AI', 'Naval expeditions', 'Performance', 'Records', 'Roadmap'],
    status: 'Reviewed checkpoint', checkpoint: 'Campaign foundation · rules 17', image: 'technical-ledger',
    takeaways: ['A paid second harbor counts toward the two-outlet commitment limit, even while construction is queued.', 'Routes, observations, save bytes and recorded decisions retain their verified results through the reviewed optimizations.', 'M0 and all fifteen whole release gates remain open. Client contracts and unification are next systems to develop, not features in this checkpoint.'],
    sections: [
      { id: 'fund-the-expedition', title: 'Spend on the expedition already under way', paragraphs: [
        'An isolated realm could pay for an unnecessary third harbor while its second was still being built. The naval planner now counts paid queued construction toward its two-outlet commitment limit. Ordinary payment, blocked scout funding and a saved caravan journey through arrival and founding have explicit regression coverage.',
        'Waiting founders also shared a chart but repeatedly rebuilt its geography. Selection now precedes shared assessment. Later work delays shoreline, home-land and navigation preparation until a plan actually uses it. Complete captured naval plans retain the same orders, reasons, held armies and expenditure. These corrections close the two original naval review findings; they do not certify every strategic AI behavior.',
        'The narrow image shows an authored human-command regression: after paid Ocean navigation and a saved deep-ocean journey, the passenger can select a legal shore and disembark. The test verifies its formations and saves again. It is not an organically planned AI colony.',
      ], image: 'transport-landing' },
      { id: 'same-journey', title: 'Keep the journey, remove repeated work', paragraphs: [
        'Movement searches skip edges that cannot improve a route, reuse local neighbor storage and omit unused predecessor maps in range searches. Fleet planning asks for a destination preview without publishing an unused reachable overlay. The preliminary search and shared 4,096-node budget remain intact; map controls still receive their complete movement results.',
        'Explored-land observations avoid temporary object copies, while eligible unordered explored-cell lists use native unsigned sorting for saves. Captured complete observations preserve optional fields, fog memory and historical rules. Callers still cannot mutate the campaign through a returned observation. An authored eight-turn paid voyage retains all 22 accepted commands, save mirrors and final hash fa29672f.',
      ] },
      { id: 'keep-the-record', title: 'Keep every order and the same saved history', paragraphs: [
        'Replay compares ordinary event and battle JSON trees directly instead of encoding both trees for each comparison. Technical records use direct sorted formatting without an intermediate parse and copy. Complete comparisons, corruption rejection and exact technical-export bytes remain covered. Current campaign rules and save version stay at 17; content remains b79c78ed. There is no migration.',
        'The ledger image comes from the generated Short AI-watch campaign with seed 20260905 after saved continuation and victory. It displays actual accepted orders and the complete JSON download control. The screenshot illustrates the existing record; it is not a new UI feature or proof that Epic archives meet their timing budget.',
        'Measurements have different boundaries. A prior generated Epic before/after sample retained 22,914 commands, 249 battles and final hash 1e4534db while campaign time changed from 32.443 to 27.161 seconds. Later query and detached-plan gains were modest or mixed. These local samples do not establish a universal whole-campaign speedup.',
      ] },
      { id: 'checked-and-open', title: 'What passed, and what still fails', paragraphs: [
        'The final 21 September local checkpoint passed typecheck, lint, content and art validation, the production build, 25 affected Chromium gameplay scenarios and 27 production Pages scenarios. Those browser counts are scoped journeys, not complete gameplay or cross-browser certification. Independent reviews found no blocking issue in the bounded changes and their factual and visual account.',
        'The unchanged default headless run passed 1,857 of 1,858 tests across 220 of 221 files. Epic archive verification remained the sole failure at 64.779 seconds against its 60-second limit. Eight-worker and four-worker diagnostics also failed that limit; neither cap was adopted. No assertion, timeout, historical seal, activity requirement or rendering budget was relaxed. These are retained checkpoint executions, not a claim about subsequent hosted CI.',
        'Broader hash caching, alternate hash kernels and a different pathfinding heap were investigated and rejected. A validation wrapper changed rejection formatting and was rejected too. None ships in the runtime. Browser compendium captures now write to current test output so later runs preserve historical review images.',
      ] },
      { id: 'development-order', title: 'A concrete order for the remaining game', paragraphs: [
        'The existing roadmap now orders the accepted work into M0–M10, with dependencies, owners, playable outcomes and acceptance. No gameplay scope is added or cut. M0 remains in progress, and all fifteen whole release gates remain open. Deployment makes a development checkpoint available; it does not turn that checkpoint into Theandril 1.0.',
        'First resolve the actual Epic archive runtime under the existing gate. Then M1 connects client-state diplomacy to a distinct, contestable unification victory. A genuine pre-change rules-17 treaty and pending-offer archive, plus interface handoffs, prepare compatibility work. Client contracts, tribute and unification are not implemented here.',
        'M2 follows with a complete magical-site, qualified-caster and counterplay loop; M3 adds practical empire delegation and coordinated orders. Supply and trade, independent powers and politics, epochs, deeper progression, authored breadth, online campaigns and integrated release proof follow the same canonical plan. Contributors should start from the linked development workflow and preserve simulation ownership in packages/sim.',
      ] },
    ],
    evidence: [
      { label: 'Campaign foundation work packet', path: 'docs/updates/campaign-foundation-work-packet.md', note: 'Full three-pass account and imagery, retained at its pre-publication reviewed checkpoint.' },
      { label: 'Paid harbor and founder corrections', path: 'docs/development/2026-09-21-roadmap-start/naval/README.md', note: 'Original naval findings, ordinary-command regressions and bounded geography measurements.' },
      { label: 'First campaign and replay measurements', path: 'docs/development/2026-09-21-roadmap-start/performance/README.md', note: 'Generated Epic sample and comparison-only timings, with their separate limits.' },
      { label: 'Observation, save and preview continuation', path: 'docs/development/2026-09-21-campaign-continuation/README.md', note: 'Exact-output evidence, paid-voyage checks and rejected hash-cache investigation.' },
      { label: 'Current checkpoint checks and limits', path: 'docs/development/2026-09-21-epic-baseline/README.md', note: '1,857/1,858 headless, scoped browser passes, movement/naval measurements and unsuccessful worker-cap diagnostics.' },
      { label: 'Independent factual and visual review', path: 'docs/development/2026-09-21-epic-baseline/review/final.md', note: 'Exact source/image readback and bounded approval; Epic, M0 and all release gates remain open.' },
      { label: 'Current image provenance', path: 'docs/development/2026-09-21-epic-baseline/screens/provenance.json', note: 'Exact original Playwright PNGs, capture contexts, dimensions and hashes.' },
      { label: 'Development sequence and acceptance', path: 'docs/1.0-DEVELOPMENT.md', note: 'The existing canonical M0–M10 plan, not a second roadmap or a release promise.' },
      { label: 'Implementation status', path: 'docs/IMPLEMENTATION_STATUS.md', note: 'Delivered, partial and historical systems at this exact checkpoint.' },
    ],
  },
  {
    publication: 'published', sourceRevision, sequence: 3,
    id: 'r17-campaign-safety', edition: '01', title: 'A campaign worth keeping',
    subtitle: 'Rule 17 · Save integrity, contested battles & the work still open',
    summary: 'Training should not break a save. A crowded garrison should not make a town untouchable. This checkpoint repairs both, without rewriting the history of older campaigns.',
    topic: 'Engineering', tags: ['R17', 'Campaign safety', 'Combat', 'Saves', 'Review'],
    status: 'Reviewed checkpoint', checkpoint: 'Audit remediation · rule 17', image: 'campaign',
    takeaways: ['New saves use version 17; historical rule-16 commands keep their recorded behavior.', 'Defending armies that do not fit the battle remain on the campaign map as reserves.', 'Backend, storage and UI have scoped approvals. AI findings and full integration remain open.'],
    sections: [
      { id: 'why-this-work', title: 'The campaign must survive its own battles', paragraphs: [
        'The failure was not a hypothetical malformed save. A genuine turn-236 checkpoint loaded correctly, then a trained battle left strategic morale outside the save validator’s allowed range. A command could be accepted and still leave the player with a campaign that would not load.',
        'Rule 17 separates temporary battle training from the morale carried home by survivors. It removes only the bonus actually granted under the tactical cap. In the capped regression, strategic morale stays 85 → 85: subtracting a nominal bonus that was never fully applied would invent a loss. This is a save-integrity correction, not a new healing mechanic.',
      ] },
      { id: 'contested-ground', title: 'A full battlefield is not an invulnerable town', paragraphs: [
        'The twenty-formation battle budget has not grown. Instead, current rules select whole defending armies that fit that budget. A named field target receives priority; a settlement assault uses stable army-ID order. Armies that do not fit remain strategic reserves with their formations, officers and cargo intact.',
        'Those reserves do not take part invisibly. They receive no battle losses or experience, and can still prevent an attacker from occupying the tile. An assault offers capture only after the actual garrison is cleared. A surviving reserve keeps the siege contested until a later engagement. This is successive bounded fighting, not mid-round reinforcement.',
        'Movement quotes, executable routes and the public committed/reserve readout use the canonical selection. Pending battle saves must validate that exact contingent; a resealed save cannot omit inconvenient defenders. The later assault correction closes that omission-validation finding while preserving named field-target priority.',
      ], image: 'battle' },
      { id: 'save-compatibility', title: 'New rules, old history', paragraphs: [
        'Current campaign saves use version 17. Valid version-16 snapshots migrate their envelope without rewriting the recorded campaign payload. Explicit historical rule-16 commands retain their original behavior and exact historical hashes. The tactical battle kernel remains version 10; this change does not introduce a new content roster or world generator.',
        'Already-invalid historical saves are still rejected rather than silently repaired. Keep a prior valid export, and use a build that supports save version 17 when moving a current campaign. Localhost and the hosted game have separate browser storage: export a .theandril file in one, then import it in the other.',
      ] },
      { id: 'evidence', title: 'What the checkpoint actually proves', paragraphs: [
        'After the assault and storage corrections, the recorded parent verification passed 753 non-AI simulation, chronicle, persistence and worker tests across 67 files. It also replayed 125,150 historical rule-16 commands across eight campaigns with exact results and final bytes. One originally invalid historical final save remained rejected.',
        'These are checkpoint evidence, not tests rerun to write this journal. Independent backend review passed 152 tests; independent storage review passed 52 tests and 14 temporary probes. The UI’s separate evidence records 28 development cases and four built-production cases, followed by a byte-faithful review of its captured patch. These scopes overlap: they must not be added into a new grand total.',
        'Earlier stable-source generated campaigns are useful, different evidence. Tiny/4 seed 99 reached a Glass Tide prosperity victory on turn 217; Standard/24 seed 74 reached a Mire Courts prosperity victory on turn 225. Both retained exact saves, midpoint continuation and full replay at that earlier checkpoint. They are actual automated campaign trajectories, not authored combat fixtures, and were not rerun for this page or the latest fix review.',
      ] },
      { id: 'limits', title: 'Approved checkpoints are not a release', paragraphs: [
        'The backend, storage and UI checkpoints are independently approved. This is not a 1.0 signoff. AI still has open queued second-harbor funding and repeated founder geography/chart-scan findings. Further AI checks and fixes were authorization-blocked in the source record; this journal does not retry them or imply they passed.',
        'A corrected supplemental backend probe and a final all-artifact freshness sweep were also consent-blocked. Their unexecuted assertions remain unexecuted. Full integration after further source changes, cross-browser support, sustained-memory behavior and release-scale performance require their own evidence.',
        'The storage repairs favor keeping readable history over availability: an unverifiable unrelated branch can refuse an otherwise valid save when garbage collection is queued. Append and no-op publication read, hash and parse O(prefix bytes); queued garbage-collection proof scans all stored payloads and manifests. The 64-item cap bounds deletions only. Zero history writes does not mean zero work.',
      ] },
    ],
    evidence: [
      { label: 'Campaign-safety decision', path: 'docs/architecture/0037-campaign-safety.md', note: 'R01/R03 behavior, historical compatibility and authored regression boundaries.' },
      { label: 'Post-fix review reconciliation', path: 'docs/development/post-fix-review/summary.json', note: 'Scoped approvals, retained failed verdicts and unresolved AI/integration work.' },
      { label: '753-test post-fix verification', path: 'docs/development/review-fix-2/parent-post-fix-verification.json', note: 'Recorded non-AI execution; not a full-suite total.' },
      { label: 'Historical replay verification', path: 'docs/development/legacy-replays-post-fix-2/summary.json', note: '125,150 rule-16 commands; one invalid historical final save remains rejected.' },
      { label: 'Stable campaign checkpoint', path: 'docs/development/stable-checkpoint.json', note: 'Earlier generated campaigns. Use contemporaneous metrics.jsonl for historical progression; retrospective checkpoint arrays alias live data.' },
      { label: 'UI review and pixels', path: 'docs/development/ui-review-current/parent-visual-review.md', note: 'Narrow capture and actual renderer evidence, separate from backend tests.' },
    ],
  },
  {
    publication: 'published', sourceRevision, sequence: 1,
    id: 'twenty-four-cultures', edition: '03', title: 'Twenty-four ways to keep a hearth',
    subtitle: 'The playable baseline · People, places & material identity',
    summary: 'A culture is a political bargain, not a recolored banner. The current roster connects authored societies to real names, ecological choices and distinct approved art.',
    topic: 'World & culture', tags: ['Culture', 'Lore', 'Art', 'Ecology', 'Baseline'],
    status: 'Playable baseline', checkpoint: 'Roster 4 · slices 22–27', image: 'cultures',
    takeaways: ['Twenty-four authored cultures are selectable; repeated campaign seats are not new cultures.', 'Biome affinities and paid cultivation are implemented, while many supernatural hooks remain lore.', 'Gallery images are authored in-game review fixtures, not scenes from an organic campaign.'],
    sections: [
      { id: 'political-bargains', title: 'More than a color on the map', paragraphs: [
        'The faction bible treats each culture as a political bargain between households and institutions. People migrate, dissent and serve other banners. Material choices and ecological traditions should make those bargains legible without turning ancestry into a single personality.',
        'The Ashen Compact brings hearth-gold, soot brown, repaired shields and workshop obligations. The Reedbound Council belongs to the river margins. The Vesper Court includes genuine vampiric patrons alongside living valley households; it is not simply a costume theme. These identities share a fractured world without settling the disputed causes of the Ashfall or the nature of the Witness Roads.',
        'Twenty-four selectable definitions now have stable IDs, name pools, worked-biome benefits and drawbacks, cultivation targets and paid AI recruitment preferences. A campaign uses distinct definitions before repeated seats. Larger seat counts can repeat a culture; they do not create new authored societies.',
      ] },
      { id: 'land-and-livelihood', title: 'Identity becomes a decision about land', paragraphs: [
        'A faction’s preferred ground changes explicit yields on worked land. For example, the Vesper Court gains knowledge from temperate forest and coin from taiga, while desert and ash scrub carry documented penalties. Paid cultivation can establish eligible preferred biomes on claimed land; it does not rewrite physical relief, water depth or movement rules.',
        'The slice-27 baseline also supports eight generated resource economies, paid extraction works, household assignment and branching development for companies, hearths and factions. Older worlds retain their original geography instead of gaining retroactively placed deposits. The baseline is substantive, but it is not the full economy or content target in the 1.0 scope.',
      ] },
      { id: 'material-record', title: 'An art kit is a promise with evidence', paragraphs: [
        'The current art record qualifies distinct settlement, heraldic, land-role and naval assets for all twenty-four cultures. Campaign-map hulls use static southeast poses; battles use shared animated role sheets. A separate source, review and runtime binding matter more than a renamed file or a tint.',
        'The image here is a retained, authored in-game city gallery from the culture review. Its deliberate arrangement lets a reviewer compare silhouettes and materials. It is illustrative/regression evidence, not an organic campaign cityscape, and it does not demonstrate every culture in every biome.',
      ], image: 'cultures' },
      { id: 'world-limits', title: 'Where the fiction stops and the rules begin', paragraphs: [
        'These are not twenty-four separate rules engines. Common troops, paid recruitment, upkeep, transport and combat rules are shared. The Vesper Court’s blood dependence is lore: feeding, life-steal, resurrection and night bonuses are not implemented systems. A proposed named character in the bible is not a unique runtime entity.',
        'Further faction asymmetry, exclusive rosters, full supernatural progression and the remaining 1.0 content targets require authored data, canonical rules, AI understanding, persistence and tests. The public journal will distinguish those additions from a new painting or a writing hook rather than counting them early.',
      ] },
    ],
    evidence: [
      { label: 'Faction bible', path: 'docs/lore/FACTION_BIBLE.md', note: 'Canonical identities, implementation boundaries and proposed character seeds.' },
      { label: 'Executable faction definitions', path: 'packages/content/src/factions.ts', note: 'Stable registered definitions, not a future roster wishlist.' },
      { label: 'Faction asset catalog', path: 'docs/art/FACTION_ASSET_CATALOG.md', note: 'Approved culture kit coverage and source provenance.' },
      { label: 'Art implementation status', path: 'docs/art/ART_IMPLEMENTATION_STATUS.md', note: 'Published assets, animation scope and visual/performance limitations.' },
      { label: 'Playable baseline and remaining work', path: 'docs/IMPLEMENTATION_STATUS.md', note: 'Slice-27 systems and later campaign-safety corrections.' },
    ],
  },
  {
    publication: 'published', sourceRevision, sequence: 2,
    id: 'keeping-the-record', edition: '02', title: 'Keeping the whole record',
    subtitle: 'R02 · A bounded archive, not an unlimited promise',
    summary: 'A long campaign is more than its final snapshot. The archive work preserves the orders, battles and provenance needed to tell its history—and replay it.',
    topic: 'Archives', tags: ['R02', 'Storage', 'Replay', 'Saves', 'Performance'],
    status: 'Bounded verification', checkpoint: 'Archive capacity · durability follow-up', image: 'archipelago',
    takeaways: ['The retained Long campaign contains 114,244 orders and 1,496 recorded battles.', 'Capacity execution and later durability review are different checkpoints.', 'Complete-or-error bounds protect history; they do not certify unlimited archives or mobile memory.'],
    sections: [
      { id: 'more-than-a-snapshot', title: 'The last turn is not the whole campaign', paragraphs: [
        'The retained Standard/24 Long campaign, seed 748291, reached victory on turn 446. Its archive contains 114,244 orders and 1,496 recorded battles under the original rule-16 victory seal 0f0b85f5. These are records from the captured campaign, not invented filler or newly replayed battles.',
        'At the capacity checkpoint, actual Chromium IndexedDB save/load, a downloaded portable export, re-import and full historical replay had retained execution evidence. Later checks compared the complete retained archive and original hashes. The large full replay was not rerun during the latest fix pass or independent re-review; that review did not rerun Chromium either.',
      ] },
      { id: 'bounded-storage', title: 'Keep everything—or refuse clearly', paragraphs: [
        'Immutable history chunks and atomic rotation let manifest version 2 reuse an existing prefix. Larger portable envelopes use bounded TAC2 gzip. Snapshot, record, file and logical-envelope limits are explicit; the system must refuse an oversized archive instead of quietly truncating its early history.',
        'The subsequent durability fixes verify the origin and every prefix dependency inside publication. Garbage collection derives references from digest-verified payload links and manifests, including orphan-successor leases, rather than trusting a resealed count. A failed transaction preserves the previous readable generation and retry cursor.',
      ] },
      { id: 'safety-cost', title: 'Safety has a cost you should be able to see', paragraphs: [
        'Append and no-op saves still read, hash and parse O(prefix bytes) inside the publication transaction. When garbage is queued, proof scans all stored payloads and manifests. The 64-item cap limits deletion, not the proof scan. Writing no new history payloads is not constant-time work.',
        'An unverifiable unrelated branch can atomically refuse an otherwise valid save when garbage collection is queued. That deliberately conservative choice preserves history at an availability cost. Overcounts without queued garbage are not proactively scrubbed, and large-store garbage-collection proof needs separate profiling.',
        'The retained Chromium cold/no-op/append samples are single diagnostics, not a performance certificate. Real quota exhaustion, process-kill durability, cross-browser behavior, sustained memory and large-case player controls remain unverified. Checksums detect integrity problems; they are not authentication.',
      ] },
      { id: 'review-boundary', title: 'Read the review, not just the green number', paragraphs: [
        'Independent re-review passed 52 storage-related tests and 14 additional probes. Those temporary probes are retained evidence, not yet permanent regression tests, and the parent recounted rather than reran them. The original failed verdict remains failed historical evidence beside the later scoped approval.',
        'The large append example added one real refused post-victory order. It did not manufacture extra gameplay to make the history larger. The useful claim is that complete historical values survive the tested paths within explicit bounds—not that all long campaigns, browsers or devices are now certified.',
      ] },
    ],
    evidence: [
      { label: 'Archive capacity report', path: 'docs/development/hermes-archive/README.md', note: 'Original retained campaign, actual browser roundtrip and historical replay execution.' },
      { label: 'Storage format and recovery decision', path: 'docs/development/hermes-archive/ADR-R02.md', note: 'Exact bounds, formats, migration and recovery policy.' },
      { label: 'Durability correction report', path: 'docs/development/review-fix-2/persistence-REPORT.md', note: 'Full-prefix and reference-proof corrections with performance and availability costs.' },
      { label: 'Independent persistence verdict', path: 'docs/development/post-fix-review/persistence.verdict.json', note: 'Scoped approval and explicit limits; not a new large replay.' },
    ],
  },
];

export const dispatches = [...entries].sort((a, b) => b.sequence - a.sequence);
