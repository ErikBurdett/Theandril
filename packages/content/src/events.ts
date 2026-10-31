import { z } from 'zod';

/** Rules 46: hearth events. Every so many turns a realm's hearth meets a
 * small, local turn of fortune and its ruler answers it with one of two or
 * three choices. Each choice moves only canonical fields that already exist:
 * the hearth's stored food, people and devastation, and the realm's coin and
 * knowledge. Which hearth and which event is drawn from the campaign seed, the
 * turn and the realm's seat, so a replay offers the same events; an unanswered
 * event takes its first choice when it lapses. Templates are original and
 * data-driven; the simulation evaluates every condition from its own state. */
const id = z.string().regex(/^event\.[a-z_]+$/);
const choiceId = z.string().regex(/^[a-z_]+$/);
const name = z.string().min(1).max(60);
const text = z.string().min(1).max(400);
const small = z.number().int().min(-40).max(40);
const coin = z.number().int().min(-200).max(200);
/** `chained` events are never drawn: they are reached only as another event's follow-up. */
export const hearthEventConditionSchema = z.enum(['any', 'populous', 'devastated', 'coastal', 'seam', 'wartime', 'harbor', 'archive', 'garrisoned', 'peace', 'wide', 'young', 'chained']);
export type HearthEventCondition = z.infer<typeof hearthEventConditionSchema>;
/** Rules 47 adds ashglass (the realm's stockpile) and garrison (the strength of the realm's companies at the hearth); rules 46 templates carry neither key, so their seal is unchanged. */
export const hearthEventEffectsSchema = z.object({ food: small, coin, knowledge: coin, population: z.number().int().min(-2).max(2), devastation: small,
  ashglass: z.number().int().min(-20).max(20).optional(), garrison: z.number().int().min(-30).max(30).optional() }).strict();
export type HearthEventEffects = z.infer<typeof hearthEventEffectsSchema>;
/** Rules 48: an answer may schedule a follow-up event at the same hearth after a few turns, so an event can escalate or recover by what was chosen. */
export const hearthEventFollowUpSchema = z.object({ templateId: id, afterTurns: z.number().int().min(1).max(10) }).strict();
export type HearthEventFollowUp = z.infer<typeof hearthEventFollowUpSchema>;
export const hearthEventChoiceSchema = z.object({ id: choiceId, label: name, description: text, effects: hearthEventEffectsSchema, followUp: hearthEventFollowUpSchema.optional() }).strict();
export const hearthEventSchema = z.object({
  id, name, text, condition: hearthEventConditionSchema, weight: z.number().int().min(1).max(10),
  choices: z.array(hearthEventChoiceSchema).min(2).max(3), sinceRules: z.union([z.literal(46), z.literal(47), z.literal(48)]),
}).strict();
export type HearthEventChoiceDefinition = z.infer<typeof hearthEventChoiceSchema>;
export type HearthEventDefinition = z.infer<typeof hearthEventSchema>;

const none: HearthEventEffects = { food: 0, coin: 0, knowledge: 0, population: 0, devastation: 0 };
const effects = (changes: Partial<HearthEventEffects>): HearthEventEffects => ({ ...none, ...changes });
// Rules 47 keys are present only where a template uses them, so the rules 46 templates seal exactly as before.

/** Sealed packs hash this order; append new events. The first choice of each event is the one a lapsed event takes. */
const FIRST_BATCH: readonly HearthEventDefinition[] = [
  { id: 'event.bumper_harvest', name: 'A heavy harvest', condition: 'any', weight: 3, sinceRules: 46,
    text: 'The terraces of {hearth} yield beyond what the granary was built to hold, and the carts stand full in the road.',
    choices: [
      { id: 'fill_the_granary', label: 'Fill the granary', description: 'Store what can be stored and let the rest feed the road crews.', effects: effects({ food: 12 }) },
      { id: 'sell_the_surplus', label: 'Sell the surplus', description: 'Send the carts to the nearest market before the grain turns.', effects: effects({ coin: 40 }) },
    ] },
  { id: 'event.kiln_fire', name: 'A kiln fire', condition: 'any', weight: 2, sinceRules: 46,
    text: 'A kiln in {hearth} cracks in the night and the fire runs along the drying racks toward the workshops.',
    choices: [
      { id: 'douse_the_works', label: 'Douse the works', description: 'Pay the bucket lines and the carters, and lose only the racks.', effects: effects({ coin: -30, devastation: 5 }) },
      { id: 'let_it_burn_out', label: 'Let it burn out', description: 'Keep the coin and rebuild the quarter when the ash cools.', effects: effects({ devastation: 15 }) },
    ] },
  { id: 'event.ashfall_squall', name: 'An ashfall squall', condition: 'any', weight: 2, sinceRules: 46,
    text: 'Grey ash comes down on {hearth} for three days, thick enough to choke the lanes and dim the lamps at noon.',
    choices: [
      { id: 'shelter_the_people', label: 'Shelter the people', description: 'Close the works and open the stores until the squall passes.', effects: effects({ food: -6 }) },
      { id: 'keep_the_works_open', label: 'Keep the works open', description: 'Pay danger wages and sweep the roofs as they fill; the quarter suffers for it.', effects: effects({ coin: 20, devastation: 10 }) },
    ] },
  { id: 'event.wandering_scholars', name: 'Wandering scholars', condition: 'populous', weight: 2, sinceRules: 46,
    text: 'A company of wandering scholars asks to lodge the winter in {hearth}, offering their records of the Witness Roads in return.',
    choices: [
      { id: 'lodge_them', label: 'Lodge them', description: 'Feed and house them through the winter and copy what they carry.', effects: effects({ coin: -20, knowledge: 40 }) },
      { id: 'charge_them_passage', label: 'Charge them passage', description: 'Let them pass through for a fee and keep the winter stores for your own.', effects: effects({ coin: 10 }) },
    ] },
  { id: 'event.glass_tremor', name: 'A glass tremor', condition: 'seam', weight: 3, sinceRules: 46,
    text: 'The seam beneath {hearth} shudders in the night and a fissure of ashglass opens through the lower terraces.',
    choices: [
      { id: 'open_the_fissure', label: 'Open the fissure', description: 'Let the Waykeepers read the fresh glass before it is filled, whatever it costs the terraces.', effects: effects({ knowledge: 30, devastation: 10 }) },
      { id: 'seal_it', label: 'Seal it', description: 'Pay the masons to fill and cap the fissure before anyone falls in.', effects: effects({ coin: -25 }) },
    ] },
  { id: 'event.road_refugees', name: 'Refugees on the road', condition: 'wartime', weight: 3, sinceRules: 46,
    text: 'A column of people driven out by the war reaches the gate of {hearth}, carrying what they could and asking to stay.',
    choices: [
      { id: 'take_them_in', label: 'Take them in', description: 'Open the gate and the stores; they will work the land by spring.', effects: effects({ food: -8, population: 1 }) },
      { id: 'turn_them_away', label: 'Turn them away', description: 'Point them down the road and keep the stores for the levy.', effects: effects({}) },
    ] },
  { id: 'event.tide_wrack', name: 'Tide wrack', condition: 'coastal', weight: 2, sinceRules: 46,
    text: 'A storm tide leaves the shore below {hearth} heaped with wrack, drowned timber and the broken hull of a stranger’s boat.',
    choices: [
      { id: 'salvage_it', label: 'Salvage it', description: 'Put the carters to the timber and the hull and sell what the shipwrights will take.', effects: effects({ coin: 25, food: 4 }) },
      { id: 'leave_it_to_the_fishers', label: 'Leave it to the fishers', description: 'Let the fishing families take the wrack and the catch that shelters in it.', effects: effects({ food: 8 }) },
    ] },
  { id: 'event.old_quarter_collapse', name: 'An old quarter gives way', condition: 'devastated', weight: 3, sinceRules: 46,
    text: 'A scarred quarter of {hearth} that was never properly rebuilt gives way in the rains, and the lane behind it goes with it.',
    choices: [
      { id: 'rebuild_it', label: 'Rebuild it', description: 'Pay the masons to raise the quarter properly this time.', effects: effects({ coin: -40, devastation: -15 }) },
      { id: 'clear_the_rubble', label: 'Clear the rubble', description: 'Clear the lane and leave the quarter as open ground.', effects: effects({ devastation: -5 }) },
    ] },
];

/** Rules 47: sixteen more, with the harbor, archive, garrison, peace, breadth and youth of a hearth as conditions, and ashglass and garrison strength among the effects. */
const SECOND_BATCH: readonly HearthEventDefinition[] = [
  { id: 'event.drowned_ledger', name: 'A drowned ledger', condition: 'harbor', weight: 2, sinceRules: 47,
    text: 'A coaster founders in the harbor mouth of {hearth} and the divers bring up its strongbox and a sodden ledger of every port it called at.',
    choices: [
      { id: 'dry_the_ledger', label: 'Dry the ledger', description: 'Set the scribes to the ledger before the pages rot; the strongbox pays for their time.', effects: effects({ coin: 15, knowledge: 25 }) },
      { id: 'keep_the_strongbox', label: 'Keep the strongbox', description: 'Count the coin and let the ledger go back to the sea.', effects: effects({ coin: 45 }) },
    ] },
  { id: 'event.harbor_silt', name: 'The harbor silts', condition: 'harbor', weight: 2, sinceRules: 47,
    text: 'A season of storms has silted the harbor of {hearth} until the deeper hulls scrape at low water.',
    choices: [
      { id: 'dredge_the_channel', label: 'Dredge the channel', description: 'Pay the dredging crews and keep the quays working.', effects: effects({ coin: -35 }) },
      { id: 'work_the_shallows', label: 'Work the shallows', description: 'Let the boats work what water is left and put the crews to the mudflats.', effects: effects({ food: 6, devastation: 8 }) },
    ] },
  { id: 'event.archive_fire', name: 'Fire in the archive', condition: 'archive', weight: 2, sinceRules: 47,
    text: 'A lamp falls in the Witness archive of {hearth} and the oldest shelves catch before the watch wakes.',
    choices: [
      { id: 'save_the_shelves', label: 'Save the shelves', description: 'Turn out the whole quarter with buckets; the archive stands, the lanes do not.', effects: effects({ devastation: 10 }) },
      { id: 'save_the_quarter', label: 'Save the quarter', description: 'Let the archive burn and keep the fire from the houses; what was written is lost.', effects: effects({ knowledge: -30 }) },
    ] },
  { id: 'event.visiting_witness', name: 'A visiting Witness', condition: 'archive', weight: 3, sinceRules: 47,
    text: 'A Witness of the old roads lodges in the archive of {hearth} and offers to read its oldest records aloud, for a fee or for a favour.',
    choices: [
      { id: 'pay_the_fee', label: 'Pay the fee', description: 'Pay in coin and copy every reading.', effects: effects({ coin: -25, knowledge: 45 }) },
      { id: 'ask_the_favour', label: 'Ask the favour', description: 'Feed and house the Witness for the season instead.', effects: effects({ food: -8, knowledge: 25 }) },
    ] },
  { id: 'event.garrison_fever', name: 'Fever in the garrison', condition: 'garrisoned', weight: 2, sinceRules: 47,
    text: 'A fever runs through the companies quartered at {hearth}, and the surgeons ask for the stores.',
    choices: [
      { id: 'open_the_stores', label: 'Open the stores', description: 'Feed the sick well and lose only the food.', effects: effects({ food: -10 }) },
      { id: 'ration_the_sick', label: 'Ration the sick', description: 'Keep the stores for the people; the companies recover thinner.', effects: effects({ garrison: -12 }) },
    ] },
  { id: 'event.veteran_drill', name: 'A veteran’s drill', condition: 'garrisoned', weight: 2, sinceRules: 47,
    text: 'An old campaigner settled in {hearth} offers to drill the companies quartered there through the winter.',
    choices: [
      { id: 'pay_the_drill', label: 'Pay the drill', description: 'Pay the veteran and put the companies through the yard every morning.', effects: effects({ coin: -20, garrison: 15 }) },
      { id: 'thank_the_veteran', label: 'Thank the veteran', description: 'Keep the coin and the companies as they are.', effects: effects({}) },
    ] },
  { id: 'event.glass_vein', name: 'A vein of ashglass', condition: 'seam', weight: 2, sinceRules: 47,
    text: 'Quarrymen at {hearth} break into a vein of ashglass running off the seam, brittle and bright.',
    choices: [
      { id: 'work_the_vein', label: 'Work the vein', description: 'Pay the quarrymen to cut it out carefully.', effects: effects({ coin: -15, ashglass: 8 }) },
      { id: 'sell_the_cut', label: 'Sell the cut', description: 'Take what breaks free and sell it on the road.', effects: effects({ coin: 30, ashglass: 2 }) },
    ] },
  { id: 'event.border_fair', name: 'A border fair', condition: 'peace', weight: 3, sinceRules: 47,
    text: 'Traders from beyond the border ask to hold a fair outside the walls of {hearth} while the peace holds.',
    choices: [
      { id: 'grant_the_fair', label: 'Grant the fair', description: 'Take the tolls and let the realm see what the road brings.', effects: effects({ coin: 35, knowledge: 10 }) },
      { id: 'hold_the_fair_inside', label: 'Hold it inside the walls', description: 'Bring the fair into the market square and feed it from the stores.', effects: effects({ coin: 20, food: -5, population: 1 }) },
    ] },
  { id: 'event.far_hearth_petition', name: 'A petition from the far hearths', condition: 'wide', weight: 2, sinceRules: 47,
    text: 'Elders from the realm’s farthest hearths reach {hearth} to petition for a share of the stores kept there.',
    choices: [
      { id: 'share_the_stores', label: 'Share the stores', description: 'Send carts out along the roads; the realm remembers it.', effects: effects({ food: -10, knowledge: 15 }) },
      { id: 'send_them_home', label: 'Send them home', description: 'Keep the stores where they are and the elders go home unheard.', effects: effects({ devastation: 5 }) },
    ] },
  { id: 'event.first_winter', name: 'The first winter', condition: 'young', weight: 3, sinceRules: 47,
    text: 'The first hard winter closes on the new hearth of {hearth} before its granary is finished.',
    choices: [
      { id: 'send_a_relief_train', label: 'Send a relief train', description: 'Pay the carters to bring grain from the older hearths.', effects: effects({ coin: -20, food: 10 }) },
      { id: 'let_them_manage', label: 'Let them manage', description: 'The settlers eat what they have and lose a little of what they built.', effects: effects({ devastation: 8 }) },
    ] },
  { id: 'event.pilgrims_road', name: 'Pilgrims on the road', condition: 'any', weight: 2, sinceRules: 47,
    text: 'A band of pilgrims following the old Witness Roads stops at {hearth} and asks only for water and a place to sleep.',
    choices: [
      { id: 'open_the_gate', label: 'Open the gate', description: 'House them a night; some stay, and they leave what they know of the road.', effects: effects({ food: -4, population: 1, knowledge: 10 }) },
      { id: 'sell_them_provisions', label: 'Sell them provisions', description: 'Water is free; the rest is not.', effects: effects({ coin: 15 }) },
    ] },
  { id: 'event.wolf_winter', name: 'A wolf winter', condition: 'any', weight: 2, sinceRules: 47,
    text: 'Wolves come down to the outlying farms of {hearth} in a hard winter and the herders will not go out without an escort.',
    choices: [
      { id: 'pay_the_hunters', label: 'Pay the hunters', description: 'Hire hunters to clear the woods and keep the farms working.', effects: effects({ coin: -25 }) },
      { id: 'bring_the_herds_in', label: 'Bring the herds in', description: 'Pen the herds inside the walls and feed them from the granary.', effects: effects({ food: -8 }) },
      { id: 'leave_the_farms', label: 'Leave the farms', description: 'Abandon the outlying farms until spring.', effects: effects({ devastation: 10 }) },
    ] },
  { id: 'event.merchant_bequest', name: 'A merchant’s bequest', condition: 'populous', weight: 2, sinceRules: 47,
    text: 'A merchant of {hearth} dies without heirs and leaves the realm the choice of his warehouse or his library.',
    choices: [
      { id: 'take_the_warehouse', label: 'Take the warehouse', description: 'Sell its stock.', effects: effects({ coin: 50 }) },
      { id: 'take_the_library', label: 'Take the library', description: 'Carry the books to the nearest archive.', effects: effects({ knowledge: 50 }) },
    ] },
  { id: 'event.well_fouled', name: 'The well is fouled', condition: 'populous', weight: 2, sinceRules: 47,
    text: 'The great well of {hearth} comes up foul and the lower quarters fall sick.',
    choices: [
      { id: 'dig_a_new_well', label: 'Dig a new well', description: 'Pay the diggers and the masons.', effects: effects({ coin: -30 }) },
      { id: 'haul_water', label: 'Haul water', description: 'Haul water from the river until the well clears; the sick are not all saved.', effects: effects({ population: -1, food: -4 }) },
    ] },
  { id: 'event.quiet_season', name: 'A quiet season', condition: 'peace', weight: 2, sinceRules: 47,
    text: 'The season passes quietly at {hearth}: no raiders, no fever, a fair harvest, and the companies idle in the yard.',
    choices: [
      { id: 'repair_the_walls', label: 'Repair the walls', description: 'Put the idle hands to the walls and the lanes.', effects: effects({ devastation: -10 }) },
      { id: 'hold_a_festival', label: 'Hold a festival', description: 'Open the stores and let the hearth feast; it will be remembered.', effects: effects({ food: -10, population: 1 }) },
    ] },
  { id: 'event.seam_hum', name: 'The seam hums', condition: 'seam', weight: 2, sinceRules: 47,
    text: 'For a week the seam beneath {hearth} hums so that the glass in every window sings, and the Waykeepers ask to be left alone with it.',
    choices: [
      { id: 'leave_them_to_it', label: 'Leave them to it', description: 'Close the lower terraces and let them listen.', effects: effects({ knowledge: 20, ashglass: 4, food: -3 }) },
      { id: 'quiet_the_seam', label: 'Quiet the seam', description: 'Spend ashglass to damp the seam before the windows break.', effects: effects({ ashglass: -6 }) },
    ] },
];
/** Rules 48: three chains. Each begins with a drawn event whose answers either settle the matter or let it run, and runs through chained events no draw can reach. */
const follow = (templateId: string, afterTurns: number): HearthEventFollowUp => ({ templateId, afterTurns });
const THIRD_BATCH: readonly HearthEventDefinition[] = [
  { id: 'event.sickness_in_the_lanes', name: 'Sickness in the lanes', condition: 'populous', weight: 2, sinceRules: 48,
    text: 'A sickness takes hold in the lower lanes of {hearth}, and the surgeons ask for the lanes to be closed before it climbs the hill.',
    choices: [
      { id: 'close_the_lanes', label: 'Close the lanes', description: 'Shut the lower lanes, feed the shut-in from the stores and pay the surgeons; it goes no further.', effects: effects({ coin: -20, food: -5 }) },
      { id: 'let_it_run', label: 'Let it run', description: 'Keep the lanes open and the works going; what follows, follows.', effects: effects({}), followUp: follow('event.sickness_spreads', 3) },
    ] },
  { id: 'event.sickness_spreads', name: 'The sickness spreads', condition: 'chained', weight: 1, sinceRules: 48,
    text: 'The sickness climbs the hill of {hearth} faster than the surgeons can follow it.',
    choices: [
      { id: 'quarantine_the_quarter', label: 'Quarantine the quarter', description: 'Wall off the sick quarter and pay for its keeping; the lanes inside suffer.', effects: effects({ coin: -40, devastation: 5 }) },
      { id: 'pray_it_passes', label: 'Pray it passes', description: 'Keep the hearth open and bury who must be buried.', effects: effects({ population: -1 }), followUp: follow('event.dying_season', 3) },
    ] },
  { id: 'event.dying_season', name: 'The dying season', condition: 'chained', weight: 1, sinceRules: 48,
    text: 'The dying season closes on {hearth}, and the bells do not stop.',
    choices: [
      { id: 'bury_the_dead', label: 'Bury the dead', description: 'Dig the pits beyond the walls and let the quarter stand empty.', effects: effects({ population: -2, devastation: 10 }) },
      { id: 'burn_the_quarter', label: 'Burn the quarter', description: 'Burn the sick quarter to end it; fewer die, and the quarter is gone.', effects: effects({ population: -1, devastation: 25 }) },
    ] },
  { id: 'event.riders_on_the_ridge', name: 'Riders on the ridge', condition: 'any', weight: 2, sinceRules: 48,
    text: 'Riders are seen on the ridge above {hearth}, counting its herds and its gates.',
    choices: [
      { id: 'pay_them_off', label: 'Pay them off', description: 'Send coin up the ridge and they ride on.', effects: effects({ coin: -30 }) },
      { id: 'muster_the_levy', label: 'Muster the levy', description: 'Call the levy in from the farms, feed it, and let the riders see the walls manned.', effects: effects({ food: -6, garrison: 5 }) },
      { id: 'bar_the_gates', label: 'Bar the gates', description: 'Bar the gates and wait them out.', effects: effects({}), followUp: follow('event.riders_strike', 2) },
    ] },
  { id: 'event.riders_strike', name: 'The riders strike', condition: 'chained', weight: 1, sinceRules: 48,
    text: 'The riders come down on the farms of {hearth} at dawn, and the herds are already moving.',
    choices: [
      { id: 'sally_out', label: 'Sally out', description: 'Send the companies out after them; it costs them, and the farms burn a little.', effects: effects({ garrison: -10, devastation: 5 }), followUp: follow('event.riders_driven_off', 2) },
      { id: 'endure_the_raid', label: 'Endure the raid', description: 'Keep the gates shut and count the losses when they are gone.', effects: effects({ food: -12, coin: -20, devastation: 10 }) },
    ] },
  { id: 'event.riders_driven_off', name: 'The riders driven off', condition: 'chained', weight: 1, sinceRules: 48,
    text: 'The riders are driven off from {hearth} and leave what they took in the ditches along the road.',
    choices: [
      { id: 'gather_the_plunder', label: 'Gather the plunder', description: 'Bring it in to the stores and the treasury.', effects: effects({ coin: 25, food: 6 }) },
      { id: 'return_it_to_the_farms', label: 'Return it to the farms', description: 'Give it back where it was taken; the farms recover and remember.', effects: effects({ devastation: -5, knowledge: 5 }) },
    ] },
  { id: 'event.river_rising', name: 'The river rising', condition: 'any', weight: 2, sinceRules: 48,
    text: 'The river below {hearth} rises a hand a day, and the lower fields are already wet.',
    choices: [
      { id: 'raise_the_levees', label: 'Raise the levees', description: 'Pay the diggers now and see whether the levees hold.', effects: effects({ coin: -25 }), followUp: follow('event.levees_hold', 2) },
      { id: 'wait_and_see', label: 'Wait and see', description: 'The river has risen before and gone down again.', effects: effects({}), followUp: follow('event.river_floods', 2) },
    ] },
  { id: 'event.levees_hold', name: 'The levees hold', condition: 'chained', weight: 1, sinceRules: 48,
    text: 'The levees at {hearth} hold, and the flood passes on down the valley to someone else’s fields.',
    choices: [
      { id: 'open_the_sluices', label: 'Open the sluices', description: 'Let the silt onto the fields for the spring.', effects: effects({ food: 10 }) },
      { id: 'keep_the_works', label: 'Keep the works', description: 'Keep the diggers on and learn the river’s measure.', effects: effects({ knowledge: 15 }) },
    ] },
  { id: 'event.river_floods', name: 'The river floods', condition: 'chained', weight: 1, sinceRules: 48,
    text: 'The river takes the lower fields of {hearth} and does not give them back for a season.',
    choices: [
      { id: 'rebuild_the_fields', label: 'Rebuild the fields', description: 'Pay to drain and reterrace the lower fields.', effects: effects({ coin: -35, food: -6 }) },
      { id: 'move_the_fields_uphill', label: 'Move the fields uphill', description: 'Give up the lower fields and break new ground above the flood line.', effects: effects({ food: -10, devastation: 8, knowledge: 10 }) },
    ] },
];
export const HEARTH_EVENTS: readonly HearthEventDefinition[] = [...FIRST_BATCH, ...SECOND_BATCH, ...THIRD_BATCH];
export const hearthEventTemplate = (templateId: string): HearthEventDefinition | undefined => HEARTH_EVENTS.find(item => item.id === templateId);
/** Rules-aware catalog: historical campaigns offer no events. */
export const hearthEventsForRules = (version: number): readonly HearthEventDefinition[] => HEARTH_EVENTS.filter(event => event.sinceRules <= version);
export const HEARTH_EVENT_EFFECT_KEYS = ['food', 'coin', 'knowledge', 'population', 'devastation', 'ashglass', 'garrison'] as const;
export const hearthEventEffect = (effects: HearthEventEffects, key: typeof HEARTH_EVENT_EFFECT_KEYS[number]): number => effects[key] ?? 0;
/** A realm's first forty turns are spent founding and finding its neighbours; its hearths' fortunes turn once it has settled. */
export const HEARTH_EVENT_FIRST_TURN = 40;
/** The turns between one realm's events, and the chance an eligible turn offers one. */
export const HEARTH_EVENT_INTERVAL = 10;
export const HEARTH_EVENT_CHANCE_PERCENT = 35;
export const HEARTH_EVENT_ANSWER_TURNS = 5;

export function validateHearthEventContent(events = HEARTH_EVENTS): void {
  events.forEach(event => hearthEventSchema.parse(event));
  const ids = events.map(event => event.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate hearth event ID');
  for (const event of events) {
    if (!event.text.includes('{hearth}')) throw new Error('A hearth event names its hearth: ' + event.id);
    const choices = event.choices.map(choice => choice.id);
    if (new Set(choices).size !== choices.length) throw new Error('Duplicate hearth event choice: ' + event.id);
    if (event.choices.every(choice => Object.values(choice.effects).every(value => !value))) throw new Error('A hearth event changes something: ' + event.id);
    if (event.sinceRules === 46 && event.choices.some(choice => 'ashglass' in choice.effects || 'garrison' in choice.effects)) throw new Error('A rules 46 event carries no rules 47 effect: ' + event.id);
    if (event.sinceRules < 48 && event.choices.some(choice => choice.followUp)) throw new Error('A rules 46 or 47 event schedules no follow-up: ' + event.id);
    if (event.condition === 'chained' && event.sinceRules < 48) throw new Error('A chained event belongs to rules 48 or later: ' + event.id);
    for (const choice of event.choices) if (choice.followUp) {
      const next = events.find(item => item.id === choice.followUp!.templateId);
      if (!next || next.id === event.id) throw new Error('A follow-up names another event of the catalogue: ' + event.id);
      if (next.condition !== 'chained') throw new Error('A follow-up is a chained event: ' + event.id);
    }
  }
  for (const event of events) {
    if (event.condition === 'chained' && !events.some(item => item.choices.some(choice => choice.followUp?.templateId === event.id))) throw new Error('A chained event is reached by some follow-up: ' + event.id);
  }
}
