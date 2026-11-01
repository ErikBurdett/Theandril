import { z } from 'zod';
import { CRISES } from './crises';
import { EPOCHS, epochIndexOf } from './epochs';

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
/** `chained` events are never drawn: they are reached only as another event's follow-up. Rules 52: `landmark` holds at a hearth whose borders hold a landmark. Rules 54: `crisis` events are never drawn: the crisis they name offers them as it comes. */
export const hearthEventConditionSchema = z.enum(['any', 'populous', 'devastated', 'coastal', 'seam', 'wartime', 'harbor', 'archive', 'garrisoned', 'peace', 'wide', 'young', 'chained', 'landmark', 'crisis']);
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
  choices: z.array(hearthEventChoiceSchema).min(2).max(3), sinceRules: z.union([z.literal(46), z.literal(47), z.literal(48), z.literal(49), z.literal(52), z.literal(54), z.literal(57), z.literal(59), z.literal(62), z.literal(66)]),
  /** Rules 49: drawn only once the world has reached this age. */
  epoch: z.string().regex(/^epoch\.[a-z_]+$/).optional(),
  /** Rules 54: drawn only while this crisis stands. */
  crisis: z.string().regex(/^crisis\.[a-z_]+$/).optional(),
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
/** Rules 49: events of the ages, drawn only once the world has reached them. */
const FOURTH_BATCH: readonly HearthEventDefinition[] = [
  { id: 'event.toll_dispute', name: 'A dispute at the toll', condition: 'any', epoch: 'epoch.roads', weight: 2, sinceRules: 49,
    text: 'Carters on the new road through {hearth} refuse the toll and block the gate with their wagons until it is settled.',
    choices: [
      { id: 'lower_the_toll', label: 'Lower the toll', description: 'Settle it cheaply; the road stays open and some of the carters stay.', effects: effects({ coin: -10, population: 1 }) },
      { id: 'hold_the_toll', label: 'Hold the toll', description: 'Clear the wagons and take the toll; the gate quarter pays for the quarrel.', effects: effects({ coin: 20, devastation: 3 }) },
    ] },
  { id: 'event.road_wardens', name: 'Wardens for the road', condition: 'garrisoned', epoch: 'epoch.roads', weight: 2, sinceRules: 49,
    text: 'The carters’ guild of {hearth} asks for a company to ward the road for a season, and offers to pay for it.',
    choices: [
      { id: 'post_the_wardens', label: 'Post the wardens', description: 'Lend the company to the road; it comes back thinner and paid.', effects: effects({ garrison: -5, coin: 15 }) },
      { id: 'keep_them_home', label: 'Keep them home', description: 'The company stays at the hearth and the carters ward themselves.', effects: effects({}) },
    ] },
  { id: 'event.glass_rumours', name: 'Rumours of glass', condition: 'any', epoch: 'epoch.seams', weight: 2, sinceRules: 49,
    text: 'Travellers at {hearth} swear the Ashfall glass on the ridge sings at night, now that everyone knows what a seam is.',
    choices: [
      { id: 'send_surveyors', label: 'Send surveyors', description: 'Pay a party to walk the ridge and write down what it finds.', effects: effects({ coin: -20, knowledge: 15 }) },
      { id: 'ignore_the_rumours', label: 'Ignore the rumours', description: 'Glass sings in every tavern.', effects: effects({}) },
    ] },
  { id: 'event.seam_pilgrims', name: 'Pilgrims to the seam', condition: 'seam', epoch: 'epoch.seams', weight: 2, sinceRules: 49,
    text: 'Pilgrims come to {hearth} to see the seam its borders hold, and will not be kept from it.',
    choices: [
      { id: 'admit_them', label: 'Admit them', description: 'Let them in to the lower terraces and learn what they carry from other seams.', effects: effects({ knowledge: 20, food: -4 }) },
      { id: 'charge_them', label: 'Charge them', description: 'Sell them a look from the wall.', effects: effects({ coin: 10 }) },
    ] },
  { id: 'event.bid_fever', name: 'The fever of the bid', condition: 'any', epoch: 'epoch.bids', weight: 2, sinceRules: 49,
    text: 'Word that a realm has opened its bid for the world reaches {hearth}, and the market will talk of nothing else.',
    choices: [
      { id: 'raise_a_subscription', label: 'Raise a subscription', description: 'Let the hearth subscribe to the realm’s own future; it pays, and quarrels over it.', effects: effects({ coin: 30, devastation: 5 }) },
      { id: 'calm_the_hearth', label: 'Calm the hearth', description: 'Open the stores and the archive and let the talk burn down.', effects: effects({ food: -5, knowledge: 10 }) },
    ] },
  { id: 'event.wagers_on_the_future', name: 'Wagers on the future', condition: 'populous', epoch: 'epoch.bids', weight: 2, sinceRules: 49,
    text: 'The bookmakers of {hearth} are taking wagers on which realm will close the age.',
    choices: [
      { id: 'take_the_house_share', label: 'Take the house’s share', description: 'Licence the wagers and take a share of every book.', effects: effects({ coin: 40 }) },
      { id: 'forbid_the_wagers', label: 'Forbid the wagers', description: 'Close the books and put the bookmakers’ clerks to the archive.', effects: effects({ knowledge: 10 }) },
    ] },
];
/** Rules 52: six events of the old places, drawn only at a hearth whose borders hold a landmark. */
const FIFTH_BATCH: readonly HearthEventDefinition[] = [
  { id: 'event.pilgrims_at_the_place', name: 'Pilgrims at the old place', condition: 'landmark', weight: 3, sinceRules: 52,
    text: 'Pilgrims come up the road to the old place within the borders of {hearth}, more each day, and ask leave to camp beside it.',
    choices: [
      { id: 'let_them_pass', label: 'Let them pass freely', description: 'Open the road and the place; they leave coin at the stones and stories in the lanes.', effects: effects({ coin: 15, knowledge: 10 }) },
      { id: 'charge_a_toll', label: 'Charge a toll', description: 'Set a warden on the road and take coin from every pilgrim; the camp is trampled and resented.', effects: effects({ coin: 40, devastation: 3 }) },
    ] },
  { id: 'event.relic_hunters', name: 'Relic hunters', condition: 'landmark', weight: 2, sinceRules: 52,
    text: 'Diggers with a licence from nobody have opened a pit at the old place within the borders of {hearth}.',
    choices: [
      { id: 'license_the_dig', label: 'License the dig', description: 'Take a fee and set a clerk over the pit; whatever they bring up comes to the hearth in a few turns.', effects: effects({ coin: 20 }), followUp: follow('event.the_find', 4) },
      { id: 'drive_them_off', label: 'Drive them off', description: 'Send the watch to fill the pit and turn the diggers out; the place stays as it was.', effects: effects({ coin: -10 }) },
    ] },
  { id: 'event.the_find', name: 'The find', condition: 'chained', weight: 1, sinceRules: 52,
    text: 'The diggers at the old place of {hearth} have brought something up: a sealed jar, a sheet of beaten metal, writing nobody here can read.',
    choices: [
      { id: 'keep_the_find', label: 'Keep the find', description: 'Pay the diggers off and send the find to the archive; the clerks will be years reading it.', effects: effects({ coin: -20, knowledge: 60 }) },
      { id: 'sell_the_find', label: 'Sell the find', description: 'Let the diggers sell it on and take the hearth’s share.', effects: effects({ coin: 50 }) },
    ] },
  { id: 'event.keeper_of_the_place', name: 'A keeper for the place', condition: 'landmark', weight: 2, sinceRules: 52,
    text: 'An old woman who has lived beside the old place of {hearth} longer than anyone remembers asks the hearth for a stipend to keep it.',
    choices: [
      { id: 'pay_the_keeper', label: 'Pay the keeper', description: 'Grant the stipend; she knows every stone of the place and tells the clerks what they ask.', effects: effects({ coin: -30, knowledge: 25 }) },
      { id: 'leave_it_to_the_hearth', label: 'Leave it to the hearth', description: 'The hearth keeps its own places; she goes on as before, unpaid, and the coin stays.', effects: effects({ coin: 10 }) },
    ] },
  { id: 'event.the_stones_moved', name: 'The stones are moved', condition: 'landmark', weight: 2, sinceRules: 52,
    text: 'Somebody has shifted the stones of the old place within the borders of {hearth} in the night, and the farmers will not work the fields beside it.',
    choices: [
      { id: 'set_them_back', label: 'Set them back', description: 'Pay masons to set every stone where it stood and hold a rite over it; the fields are worked again.', effects: effects({ coin: -20, devastation: -5 }) },
      { id: 'let_them_lie', label: 'Let them lie', description: 'Stones are stones; the fields beside the place lie fallow a season.', effects: effects({ food: -10, devastation: 5 }) },
    ] },
  { id: 'event.festival_at_the_place', name: 'A festival at the old place', condition: 'landmark', weight: 2, sinceRules: 52,
    text: 'The people of {hearth} ask to hold the summer festival at the old place within its borders, as their grandparents did.',
    choices: [
      { id: 'hold_the_festival', label: 'Hold the festival', description: 'Feed the hearth at the place for three days; the traders come, and the hearth remembers the year.', effects: effects({ food: -10, coin: 30 }) },
      { id: 'keep_it_within_the_walls', label: 'Keep it within the walls', description: 'Hold the festival in the square as every year; the place stays quiet.', effects: effects({ coin: 5 }) },
    ] },
];
/** Rules 54: one event of each crisis, offered to every realm with a free event slot as the crisis comes. */
const SIXTH_BATCH: readonly HearthEventDefinition[] = [
  { id: 'event.last_of_the_grain', name: 'The last of the grain', condition: 'crisis', crisis: 'crisis.grey_winter', weight: 5, sinceRules: 54,
    text: 'The stores of {hearth} are down to the seed grain, and the millers ask whether they are to grind it.',
    choices: [
      { id: 'grind_the_seed', label: 'Grind the seed grain', description: 'Feed the hearth through the winter on next year’s seed.', effects: effects({ food: 15 }) },
      { id: 'buy_from_the_roads', label: 'Buy grain on the roads', description: 'Pay the carters’ winter price and keep the seed for the spring.', effects: effects({ coin: -15, food: 5 }) },
    ] },
  { id: 'event.toll_at_our_gate', name: 'A toll at our own gate', condition: 'crisis', crisis: 'crisis.toll_wars', weight: 5, sinceRules: 54,
    text: 'The road wardens have set a toll bar at the gate of {hearth} itself and will not lift it for the hearth’s own carts.',
    choices: [
      { id: 'pay_the_wardens', label: 'Pay the wardens', description: 'Pay the bar down and keep the carts moving.', effects: effects({ coin: -15 }) },
      { id: 'bar_the_gate', label: 'Bar the gate to them', description: 'Shut the gate on the wardens; the hearth keeps its coin, and the carts stop until they go.', effects: effects({ coin: 10, devastation: 4 }) },
    ] },
  { id: 'event.clerks_fall_sick', name: 'The clerks fall sick', condition: 'crisis', crisis: 'crisis.glass_fever', weight: 5, sinceRules: 54,
    text: 'The fever has reached the clerks of {hearth}; half the ledgers lie open and no one is well enough to close them.',
    choices: [
      { id: 'close_the_rooms', label: 'Close the rooms', description: 'Send the clerks home and pay them to stay there; the work waits.', effects: effects({ coin: -10, knowledge: -10 }) },
      { id: 'keep_them_at_it', label: 'Keep them at it', description: 'The ledgers are closed and the fever takes who it takes.', effects: effects({ knowledge: 20, population: -1 }) },
    ] },
  { id: 'event.cistern_cracks', name: 'The cistern cracks', condition: 'crisis', crisis: 'crisis.tremors', weight: 5, sinceRules: 54,
    text: 'A night tremor has cracked the great cistern of {hearth}, and the water is running into the lanes.',
    choices: [
      { id: 'rebuild_the_cistern', label: 'Rebuild the cistern', description: 'Pay the masons to rebuild it on sounder ground; the lanes are mended with it.', effects: effects({ coin: -25, devastation: -5 }) },
      { id: 'patch_it', label: 'Patch it', description: 'Stop the crack with clay and hope; the lanes stay wet and the stores stay short.', effects: effects({ food: -5, devastation: 5 }) },
    ] },
  { id: 'event.run_on_the_market', name: 'A run on the market', condition: 'crisis', crisis: 'crisis.fever_of_the_end', weight: 5, sinceRules: 54,
    text: 'The merchants of {hearth} are calling in every debt at once, and the market square is a shouting match.',
    choices: [
      { id: 'guarantee_the_market', label: 'Guarantee the market', description: 'Stand behind the merchants’ debts from the treasury; the square settles.', effects: effects({ coin: -30 }) },
      { id: 'let_it_run', label: 'Let it run', description: 'Take the hearth’s due from the wreck and let the merchants settle their own.', effects: effects({ coin: 20, devastation: 5 }) },
    ] },
  { id: 'event.ash_in_the_fields', name: 'Ash in the fields', condition: 'crisis', crisis: 'crisis.long_dark', weight: 5, sinceRules: 54,
    text: 'Ash is lying on the standing crop of {hearth}, and the reeves ask whether to bring it in green or leave it to the dark.',
    choices: [
      { id: 'bring_it_in', label: 'Bring it in early', description: 'Pay every hand in the hearth to cut the crop green and under cover.', effects: effects({ food: 10, coin: -10 }) },
      { id: 'leave_it_standing', label: 'Leave it standing', description: 'Let it stand; what the dark spares is sold as fodder.', effects: effects({ food: -8, coin: 5 }) },
    ] },
];
/** Rules 57: six more events of the old places, one of them a chain. */
const SEVENTH_BATCH: readonly HearthEventDefinition[] = [
  { id: 'event.hermit_at_the_place', name: 'A hermit at the old place', condition: 'landmark', weight: 2, sinceRules: 57,
    text: 'A hermit has taken up living at the old place within the borders of {hearth}, and the farmers bring him bread and questions.',
    choices: [
      { id: 'let_him_stay', label: 'Let him stay', description: 'Leave him his place; what he tells the farmers finds its way to the archive.', effects: effects({ knowledge: 20, food: -5 }) },
      { id: 'move_him_on', label: 'Move him on', description: 'Send the watch to turn him off the realm’s land; the farmers grumble and give nothing.', effects: effects({ coin: -5, devastation: 2 }) },
    ] },
  { id: 'event.stone_robbers', name: 'Stone-robbers', condition: 'landmark', weight: 2, sinceRules: 57,
    text: 'Carts have been seen at night at the old place within the borders of {hearth}, and the dressed stone is going somewhere.',
    choices: [
      { id: 'set_a_watch', label: 'Set a watch', description: 'Pay a watch at the place; the stone stays and the carts go elsewhere.', effects: effects({ coin: -15 }) },
      { id: 'sell_the_stone', label: 'Sell the stone yourself', description: 'If it is going, it goes at the hearth’s price; the place is diminished.', effects: effects({ coin: 35, devastation: 3 }), followUp: follow('event.the_bare_place', 5) },
    ] },
  { id: 'event.the_bare_place', name: 'The bare place', condition: 'chained', weight: 1, sinceRules: 57,
    text: 'The old place of {hearth} stands stripped to its footings, and the pilgrims who came for it have stopped coming.',
    choices: [
      { id: 'raise_it_again', label: 'Raise it again', description: 'Pay masons to raise the place in new stone; the pilgrims return in time.', effects: effects({ coin: -40, devastation: -3 }) },
      { id: 'let_it_lie', label: 'Let it lie', description: 'Footings are footings; the fields take the ground.', effects: effects({ food: 5 }) },
    ] },
  { id: 'event.market_at_the_stones', name: 'A market at the stones', condition: 'landmark', weight: 3, sinceRules: 57,
    text: 'Traders from beyond the border have begun to meet at the old place within the borders of {hearth}, and ask the hearth’s leave to make a market of it.',
    choices: [
      { id: 'grant_the_market', label: 'Grant the market', description: 'Take a stall fee and let the market stand; the lanes of the hearth fill on market days.', effects: effects({ coin: 25, food: 5 }) },
      { id: 'forbid_it', label: 'Forbid it', description: 'The old place is no market; the traders go to the next hearth and so do the fees.', effects: effects({ coin: -10 }) },
    ] },
  { id: 'event.travellers_tales', name: 'Travellers’ tales', condition: 'landmark', weight: 2, sinceRules: 57,
    text: 'A company of travellers lodged at {hearth} swears the old place within its borders is spoken of across the sea, and offers to tell what they know for a fee.',
    choices: [
      { id: 'pay_for_the_tales', label: 'Pay for the tales', description: 'Pay the fee and set a clerk to write the tales down.', effects: effects({ coin: -20, knowledge: 30 }) },
      { id: 'send_them_on', label: 'Send them on their way', description: 'The hearth knows its own place; the travellers leave with their tales.', effects: effects({ coin: 5 }) },
    ] },
  { id: 'event.fire_at_the_place', name: 'Fire at the old place', condition: 'landmark', weight: 2, sinceRules: 57,
    text: 'A grass fire has run up to the old place within the borders of {hearth}, and the wardens ask whether to fight it there or let it burn to the stones.',
    choices: [
      { id: 'fight_the_fire', label: 'Fight the fire', description: 'Turn out every hand to beat the fire back from the place; the fields beside it are trampled.', effects: effects({ food: -10, coin: -5 }) },
      { id: 'let_it_burn', label: 'Let it burn to the stones', description: 'Stone does not burn; the grass does, and the ash feeds next year’s crop.', effects: effects({ food: 8, devastation: 4 }) },
    ] },
];
/** Rules 59: the events of the regional crises. */
const EIGHTH_BATCH: readonly HearthEventDefinition[] = [
  { id: 'event.seed_from_the_next_valley', name: 'Seed from the next valley', condition: 'crisis', crisis: 'crisis.valley_blight', weight: 5, sinceRules: 59,
    text: 'Carters from beyond the blight offer {hearth} clean seed at twice the price, and the reeves ask whether to pay it or sow what the hearth has.',
    choices: [
      { id: 'pay_for_clean_seed', label: 'Pay for clean seed', description: 'Pay the carters’ price and sow clean; the fields come through.', effects: effects({ coin: -20, food: 8 }) },
      { id: 'sow_what_we_have', label: 'Sow what we have', description: 'Sow the hearth’s own seed and hope the blight has passed it by.', effects: effects({ food: -6, coin: 5 }) },
    ] },
  { id: 'event.glass_in_the_thatch', name: 'Glass in the thatch', condition: 'crisis', crisis: 'crisis.glass_storm', weight: 5, sinceRules: 59,
    text: 'The storm has left the roofs of {hearth} full of glass, and the thatchers will not go up until they are paid double.',
    choices: [
      { id: 'pay_the_thatchers', label: 'Pay the thatchers', description: 'Pay double and have the roofs cleared before the rain.', effects: effects({ coin: -15, devastation: -3 }) },
      { id: 'clear_it_ourselves', label: 'Clear it ourselves', description: 'Send the hearth’s own people up; some come down cut.', effects: effects({ population: -1, coin: 5 }) },
    ] },
  { id: 'event.the_granary_doors', name: 'The granary doors', condition: 'crisis', crisis: 'crisis.bread_riots', weight: 5, sinceRules: 59,
    text: 'A crowd stands at the granary doors of {hearth} with the price chalked on a board, and the keeper asks whether to open them.',
    choices: [
      { id: 'open_the_doors', label: 'Open the doors', description: 'Sell at the chalked price and bear the loss; the crowd goes home fed.', effects: effects({ food: -10, coin: -10 }) },
      { id: 'bar_the_doors', label: 'Bar the doors', description: 'Keep the price and the doors; the crowd breaks something else.', effects: effects({ coin: 10, devastation: 5 }) },
    ] },
];
/** Rules 62: fifteen more, one a chain, across the conditions and the ages. */
const NINTH_BATCH: readonly HearthEventDefinition[] = [
  { id: 'event.lantern_festival', name: 'The lantern festival', condition: 'any', weight: 2, sinceRules: 62,
    text: 'The lanes of {hearth} ask for oil to light every door on the night of the Ashfall’s turning, as the old towns did.',
    choices: [
      { id: 'light_the_lanes', label: 'Light the lanes', description: 'Pay for the oil; the night is remembered and the stories told at every door are written down.', effects: effects({ coin: -10, knowledge: 10 }) },
      { id: 'keep_the_oil', label: 'Keep the oil', description: 'Oil is dear; the lanes stay dark and the treasury keeps its coin.', effects: effects({ coin: 5 }) },
    ] },
  { id: 'event.widows_toll', name: 'The widows’ toll', condition: 'wartime', weight: 3, sinceRules: 62,
    text: 'The widows of the fallen stand at the granary door of {hearth} with their children and ask for bread.',
    choices: [
      { id: 'feed_them', label: 'Feed them', description: 'Open the granary to every widow; the lanes are mended by hands that have reason to.', effects: effects({ food: -8, devastation: -3 }) },
      { id: 'turn_them_to_the_mills', label: 'Turn them to the mills', description: 'Set them to work for their bread; the mills turn, and the lanes resent it.', effects: effects({ coin: 10, devastation: 3 }) },
    ] },
  { id: 'event.harbor_masters_offer', name: 'A harbor-master’s offer', condition: 'harbor', weight: 2, sinceRules: 62,
    text: 'A harbor-master from beyond the sea offers to run the quay of {hearth} for a cut of what passes over it.',
    choices: [
      { id: 'take_the_offer', label: 'Take the offer', description: 'Let the foreigner run the quay; the coin comes in and the clerks learn less of what passes.', effects: effects({ coin: 20, knowledge: -5 }) },
      { id: 'keep_the_quay', label: 'Keep the quay', description: 'The quay is the hearth’s; pay its own master a little more.', effects: effects({ coin: -5 }) },
    ] },
  { id: 'event.lost_ledger', name: 'The lost ledger', condition: 'archive', weight: 2, sinceRules: 62,
    text: 'The clerks of {hearth} have found an old tax roll behind a shelf, naming dues nobody has paid in a generation.',
    choices: [
      { id: 'enforce_the_roll', label: 'Enforce the roll', description: 'Collect the old dues; the coin comes in and the lanes remember who kept the roll.', effects: effects({ coin: 25, devastation: 2 }) },
      { id: 'burn_the_roll', label: 'Burn the roll', description: 'Let the old dues go; the clerks copy what the roll says of the hearth’s founding first.', effects: effects({ knowledge: 15 }) },
    ] },
  { id: 'event.muster_day', name: 'Muster day', condition: 'garrisoned', weight: 2, sinceRules: 62,
    text: 'The companies quartered at {hearth} ask for a day of games before the campaigning season.',
    choices: [
      { id: 'hold_the_games', label: 'Hold the games', description: 'Pay for the games; the companies come back to the drill ground with their strength up.', effects: effects({ coin: -10, garrison: 8 }) },
      { id: 'keep_them_at_drill', label: 'Keep them at drill', description: 'No games; the drill goes on and the stores feed it.', effects: effects({ food: -3, garrison: 3 }) },
    ] },
  { id: 'event.long_peace', name: 'The long peace', condition: 'peace', epoch: 'epoch.roads', weight: 2, sinceRules: 62,
    text: 'The smiths of {hearth} ask leave to beat the spare spearheads into ploughshares, since no war has come up the roads.',
    choices: [
      { id: 'let_them', label: 'Let them', description: 'Ploughshares it is; the fields gain and the companies at the hearth lose their spare iron.', effects: effects({ food: 10, garrison: -6 }) },
      { id: 'forbid_it', label: 'Forbid it', description: 'The spears stay spears; pay the smiths for their idle day.', effects: effects({ coin: -5 }) },
    ] },
  { id: 'event.far_cousins', name: 'Far cousins', condition: 'wide', weight: 2, sinceRules: 62,
    text: 'Kin from the far hearths of the realm have come to {hearth} asking for land of their own.',
    choices: [
      { id: 'grant_them_land', label: 'Grant them land', description: 'Give them a quarter and feed them until the first harvest.', effects: effects({ population: 1, food: -8 }) },
      { id: 'send_them_home', label: 'Send them home', description: 'Pay their road home; the hearth keeps its land.', effects: effects({ coin: 8 }) },
    ] },
  { id: 'event.first_harvest', name: 'The first harvest', condition: 'young', weight: 3, sinceRules: 62,
    text: 'The first crop of {hearth} is in, and the hearth asks what is to be done with it.',
    choices: [
      { id: 'share_it_out', label: 'Share it out', description: 'Every household takes its share; the stores fill.', effects: effects({ food: 12 }) },
      { id: 'sell_it', label: 'Sell it on the road', description: 'Sell the crop to the carters and keep the seed; the stores stay thin.', effects: effects({ coin: 20, food: -4 }) },
    ] },
  { id: 'event.cistern_silts', name: 'The cistern silts', condition: 'populous', weight: 2, sinceRules: 62,
    text: 'The great cistern of {hearth} is silting, and the water comes up brown.',
    choices: [
      { id: 'dredge_it', label: 'Dredge it', description: 'Pay the dredgers; the water runs clear again.', effects: effects({ coin: -15 }) },
      { id: 'ration_the_water', label: 'Ration the water', description: 'Measure the water out; the stores are short and the lanes grumble.', effects: effects({ food: -6, devastation: 2 }) },
    ] },
  { id: 'event.foundling', name: 'A foundling at the gate', condition: 'any', weight: 2, sinceRules: 62,
    text: 'A child has been left at the gate of {hearth} with a token nobody can read.',
    choices: [
      { id: 'take_the_child_in', label: 'Take the child in', description: 'Raise the child at the hearth’s cost; the token goes to the clerks.', effects: effects({ coin: -5, knowledge: 5 }) },
      { id: 'send_to_the_hospice', label: 'Send the child to the hospice', description: 'Pay the hospice to raise the child; the lanes think better of the hearth.', effects: effects({ coin: -10, devastation: -1 }) },
    ] },
  { id: 'event.glass_pedlar', name: 'A glass pedlar', condition: 'seam', epoch: 'epoch.seams', weight: 2, sinceRules: 62,
    text: 'A pedlar at {hearth} opens a pack of ashglass shards he swears came from the seam, and asks a price.',
    choices: [
      { id: 'buy_the_shards', label: 'Buy the shards', description: 'Pay his price; the shards are what he says.', effects: effects({ coin: -20, ashglass: 4 }) },
      { id: 'charge_him_a_stall', label: 'Charge him a stall', description: 'Let him sell to who he likes for a fee.', effects: effects({ coin: 5 }) },
    ] },
  { id: 'event.rumours_of_the_bid', name: 'Rumours of the bid', condition: 'any', epoch: 'epoch.bids', weight: 2, sinceRules: 62,
    text: 'The merchants of {hearth} are laying wagers on which realm’s bid will carry, and ask whether the hearth will stake with them.',
    choices: [
      { id: 'keep_out_of_it', label: 'Keep out of it', description: 'Wagers are for merchants; the hearth takes a fee from the table.', effects: effects({ coin: 5 }) },
      { id: 'stake_the_treasury', label: 'Stake the treasury', description: 'Put thirty coin on the hearth’s own judgement; the wager comes due in a few turns.', effects: effects({ coin: -30 }), followUp: follow('event.the_wager_comes_due', 4) },
    ] },
  { id: 'event.the_wager_comes_due', name: 'The wager comes due', condition: 'chained', weight: 1, sinceRules: 62,
    text: 'The merchants of {hearth} have settled the wager, and the hearth’s stake has come back with more.',
    choices: [
      { id: 'collect', label: 'Collect', description: 'Take the winnings and close the table.', effects: effects({ coin: 50 }) },
      { id: 'let_it_ride', label: 'Let it ride', description: 'Leave the stake on the table and buy the merchants’ news with the rest.', effects: effects({ coin: -20, knowledge: 20 }) },
    ] },
  { id: 'event.tide_flats', name: 'The tide flats', condition: 'coastal', weight: 2, sinceRules: 62,
    text: 'A spring tide has left the flats below {hearth} bare and covered in shellfish.',
    choices: [
      { id: 'gather_them', label: 'Gather them', description: 'Turn out the hearth to the flats before the tide returns.', effects: effects({ food: 10, coin: 5 }) },
      { id: 'leave_them', label: 'Leave them to the birds', description: 'The clerks count the birds that come instead.', effects: effects({ knowledge: 5 }) },
    ] },
  { id: 'event.old_walls_fall', name: 'The old walls fall', condition: 'devastated', weight: 3, sinceRules: 62,
    text: 'A stretch of the old wall of {hearth} has come down in the night across two lanes.',
    choices: [
      { id: 'rebuild_the_wall', label: 'Rebuild the wall', description: 'Pay the masons to raise it again and clear the lanes.', effects: effects({ coin: -25, devastation: -8 }) },
      { id: 'clear_the_rubble', label: 'Clear the rubble and sell the stone', description: 'The lanes are cleared and the dressed stone sold; the gap stays.', effects: effects({ coin: 10, devastation: -2 }) },
    ] },
];
/** Rules 66: fifteen more, one a chain, across the conditions and the ages. */
const TENTH_BATCH: readonly HearthEventDefinition[] = [
  { id: 'event.bell_founders', name: 'The bell-founders', condition: 'any', weight: 2, sinceRules: 66,
    text: 'A company of bell-founders has set up its pit outside {hearth} and offers to cast the hearth a bell that will be heard three valleys off.',
    choices: [
      { id: 'cast_the_bell', label: 'Cast the bell', description: 'Pay for the bronze; the bell is rung for every hour and every death, and the lanes keep better time.', effects: effects({ coin: -15, devastation: -2, knowledge: 5 }) },
      { id: 'melt_the_old_bell', label: 'Sell them the old bell', description: 'The founders buy the cracked bell for its bronze and move on.', effects: effects({ coin: 10 }) },
    ] },
  { id: 'event.tax_farmers', name: 'The tax-farmers', condition: 'populous', weight: 2, sinceRules: 66,
    text: 'A syndicate offers to collect the dues of {hearth} for a season, paying the hearth now and keeping whatever more it can wring out.',
    choices: [
      { id: 'sell_the_dues', label: 'Sell the dues', description: 'Take their coin now; the lanes meet the collectors later.', effects: effects({ coin: 20, devastation: 3 }) },
      { id: 'keep_the_dues', label: 'Keep the dues', description: 'The hearth’s own clerks collect, slowly and honestly.', effects: effects({ coin: -5 }) },
    ] },
  { id: 'event.ash_in_the_wells', name: 'Ash in the wells', condition: 'devastated', weight: 3, sinceRules: 66,
    text: 'The wells of {hearth} have come up grey; the ash of the ruined quarter has found the water.',
    choices: [
      { id: 'dig_new_wells', label: 'Dig new wells', description: 'Pay the well-diggers to sink clean wells beyond the ruin.', effects: effects({ coin: -20, devastation: -6 }) },
      { id: 'draw_from_the_river', label: 'Draw from the river', description: 'Carry water from the river; the carrying costs the stores and the ruin stays.', effects: effects({ food: -6, devastation: -1 }) },
    ] },
  { id: 'event.whale_ashore', name: 'A whale ashore', condition: 'coastal', weight: 2, sinceRules: 66,
    text: 'A whale has come ashore below {hearth}, and the whole hearth is on the beach with knives and buckets.',
    choices: [
      { id: 'render_it', label: 'Render it', description: 'Turn out the hearth to the flensing; the stores fill and the oil sells.', effects: effects({ food: 12, coin: 8 }) },
      { id: 'leave_it_to_the_shore_folk', label: 'Leave it to the shore folk', description: 'Let the beach families take it; the clerks draw the skeleton.', effects: effects({ devastation: -2, knowledge: 3 }) },
    ] },
  { id: 'event.seam_lights', name: 'Lights over the seam', condition: 'seam', epoch: 'epoch.seams', weight: 2, sinceRules: 66,
    text: 'Lights have been seen over the seam near {hearth} three nights running, and the lanes will not pass that road after dark.',
    choices: [
      { id: 'send_the_clerks', label: 'Send the clerks', description: 'Pay the clerks to sit the nights out at the seam and write what they see.', effects: effects({ coin: -5, knowledge: 15 }) },
      { id: 'toll_the_seam_road', label: 'Toll the seam road', description: 'Nobody uses the road at night anyway; charge the day traffic for the watch.', effects: effects({ coin: 5 }) },
    ] },
  { id: 'event.deserters', name: 'Deserters at the gate', condition: 'wartime', weight: 3, sinceRules: 66,
    text: 'A dozen deserters from the realm’s own companies have come to the gate of {hearth} asking to be let in.',
    choices: [
      { id: 'hang_them', label: 'Hang them', description: 'The companies see the gibbet and stay in their ranks; the lanes see it too.', effects: effects({ garrison: 4, devastation: 3 }) },
      { id: 'pardon_them', label: 'Pardon and feed them', description: 'Take them back into the ranks and feed them; the companies are the stronger for it.', effects: effects({ garrison: 8, food: -6 }) },
    ] },
  { id: 'event.customs_house', name: 'The customs house', condition: 'harbor', weight: 2, sinceRules: 66,
    text: 'The merchants of {hearth} ask that the quay be given a customs house, with clerks to count what lands and take the realm’s due.',
    choices: [
      { id: 'let_the_quay_be', label: 'Let the quay be', description: 'The quay stays as it is; the merchants pay a fee for the asking.', effects: effects({ coin: 5 }) },
      { id: 'raise_the_customs_house', label: 'Raise the customs house', description: 'Pay for the house and the clerks; the dues come in a few turns on.', effects: effects({ coin: -20 }), followUp: follow('event.customs_dues', 5) },
    ] },
  { id: 'event.customs_dues', name: 'The customs dues', condition: 'chained', weight: 1, sinceRules: 66,
    text: 'The customs house of {hearth} has counted its first season, and the clerks lay the books before the hearth.',
    choices: [
      { id: 'collect', label: 'Collect the dues', description: 'Take the realm’s due and close the books.', effects: effects({ coin: 40 }) },
      { id: 'publish_the_books', label: 'Publish the books', description: 'Take less and let the clerks copy the books into the archive, with every cargo named.', effects: effects({ coin: 15, knowledge: 15 }) },
    ] },
  { id: 'event.scriptorium_fire', name: 'Fire in the scriptorium', condition: 'archive', weight: 2, sinceRules: 66,
    text: 'A lamp has gone over in the scriptorium of {hearth}; the copies are saved but the originals are burning.',
    choices: [
      { id: 'buy_back_copies', label: 'Buy back copies', description: 'Send to every archive of the realm for copies of what burned.', effects: effects({ coin: -20, knowledge: 10 }) },
      { id: 'let_it_burn', label: 'Let it burn', description: 'The copies will serve; sell the scorched vellum to the glue-makers.', effects: effects({ knowledge: -15, coin: 5 }) },
    ] },
  { id: 'event.quartermasters_count', name: 'The quartermaster’s count', condition: 'garrisoned', weight: 2, sinceRules: 66,
    text: 'The quartermaster of the companies at {hearth} has counted the rolls against the ration and found them a company short.',
    choices: [
      { id: 'honest_count', label: 'Strike the dead from the rolls', description: 'The rolls are corrected; the hearth keeps the ration it was paying for ghosts.', effects: effects({ garrison: -4, coin: 10 }) },
      { id: 'pad_the_rolls', label: 'Fill the rolls', description: 'Pay to recruit up to the roll from the lanes.', effects: effects({ garrison: 4, coin: -8 }) },
    ] },
  { id: 'event.peace_fair', name: 'The peace fair', condition: 'peace', epoch: 'epoch.roads', weight: 2, sinceRules: 66,
    text: 'With the roads quiet, the carters ask {hearth} for a fair at the crossroads, three days with the gates open.',
    choices: [
      { id: 'hold_the_fair', label: 'Hold the fair', description: 'Open the gates for three days; the stalls pay and the stores fill.', effects: effects({ coin: 15, food: 5 }) },
      { id: 'keep_the_gates', label: 'Keep the gates', description: 'No fair; the clerks buy the carters’ news instead.', effects: effects({ knowledge: 5 }) },
    ] },
  { id: 'event.border_stones', name: 'The border stones', condition: 'wide', weight: 2, sinceRules: 66,
    text: 'The far farms of {hearth} are quarrelling over where the border stones stood before the Ashfall.',
    choices: [
      { id: 'resurvey_the_border', label: 'Resurvey the border', description: 'Pay a surveyor to walk the line and set new stones; the clerks keep the new map.', effects: effects({ coin: -10, knowledge: 10 }) },
      { id: 'let_them_settle_it', label: 'Let the farms settle it', description: 'Fine both sides for the trouble and let them argue.', effects: effects({ coin: 5, devastation: 2 }) },
    ] },
  { id: 'event.early_winter', name: 'An early winter', condition: 'young', weight: 3, sinceRules: 66,
    text: 'The first winter of {hearth} has come early and the herd has no fodder laid in.',
    choices: [
      { id: 'buy_fodder', label: 'Buy fodder', description: 'Pay the carters for hay; the herd comes through.', effects: effects({ coin: -12, food: 10 }) },
      { id: 'cull_the_herd', label: 'Cull the herd', description: 'Slaughter what cannot be fed and salt it down; the hides sell.', effects: effects({ food: 8, coin: 5 }) },
    ] },
  { id: 'event.old_debts', name: 'Old debts called in', condition: 'any', epoch: 'epoch.bids', weight: 2, sinceRules: 66,
    text: 'With the bids in the air, the moneylenders of {hearth} are calling in every old debt of the hearth at once.',
    choices: [
      { id: 'pay_the_debts', label: 'Pay the debts', description: 'Pay what is owed; the lanes are easier for it.', effects: effects({ coin: -25, devastation: -2 }) },
      { id: 'refuse_them', label: 'Refuse them', description: 'The hearth pays nothing; the lenders close their doors and the lanes feel it.', effects: effects({ coin: 10, devastation: 4 }) },
    ] },
  { id: 'event.glassblowers_guild', name: 'The glassblowers’ guild', condition: 'any', epoch: 'epoch.seams', weight: 2, sinceRules: 66,
    text: 'The glassblowers of {hearth} ask for a charter of their own, with the right to buy ashglass before the realm does.',
    choices: [
      { id: 'charter_the_guild', label: 'Charter the guild', description: 'Grant the charter for a fee; the guild’s first buying goes to the realm’s store.', effects: effects({ coin: -10, ashglass: 3 }) },
      { id: 'tax_the_guild', label: 'Tax them instead', description: 'No charter; tax every furnace in the lanes.', effects: effects({ coin: 15 }) },
    ] },
];
export const HEARTH_EVENTS: readonly HearthEventDefinition[] = [...FIRST_BATCH, ...SECOND_BATCH, ...THIRD_BATCH, ...FOURTH_BATCH, ...FIFTH_BATCH, ...SIXTH_BATCH, ...SEVENTH_BATCH, ...EIGHTH_BATCH, ...NINTH_BATCH, ...TENTH_BATCH];
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
    if (event.sinceRules < 49 && event.epoch) throw new Error('An event before rules 49 names no age: ' + event.id);
    if (event.epoch && epochIndexOf(event.epoch) < 0) throw new Error('An event names an age of the catalogue: ' + event.id);
    if (event.epoch === EPOCHS[0]!.id) throw new Error('The first age gates nothing: ' + event.id);
    if (event.condition === 'chained' && event.sinceRules < 48) throw new Error('A chained event belongs to rules 48 or later: ' + event.id);
    if (event.condition === 'landmark' && event.sinceRules < 52) throw new Error('A landmark event belongs to rules 52 or later: ' + event.id);
    if (event.crisis && event.sinceRules < 54) throw new Error('An event before rules 54 names no crisis: ' + event.id);
    if ((event.condition === 'crisis') !== Boolean(event.crisis)) throw new Error('A crisis event names its crisis, and only a crisis event does: ' + event.id);
    if (event.crisis && !CRISES.some(crisis => crisis.id === event.crisis)) throw new Error('An event names a crisis of the catalogue: ' + event.id);
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
