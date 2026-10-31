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
export const hearthEventConditionSchema = z.enum(['any', 'populous', 'devastated', 'coastal', 'seam', 'wartime']);
export type HearthEventCondition = z.infer<typeof hearthEventConditionSchema>;
export const hearthEventEffectsSchema = z.object({ food: small, coin, knowledge: coin, population: z.number().int().min(-2).max(2), devastation: small }).strict();
export type HearthEventEffects = z.infer<typeof hearthEventEffectsSchema>;
export const hearthEventChoiceSchema = z.object({ id: choiceId, label: name, description: text, effects: hearthEventEffectsSchema }).strict();
export const hearthEventSchema = z.object({
  id, name, text, condition: hearthEventConditionSchema, weight: z.number().int().min(1).max(10),
  choices: z.array(hearthEventChoiceSchema).min(2).max(3), sinceRules: z.literal(46),
}).strict();
export type HearthEventChoiceDefinition = z.infer<typeof hearthEventChoiceSchema>;
export type HearthEventDefinition = z.infer<typeof hearthEventSchema>;

const none: HearthEventEffects = { food: 0, coin: 0, knowledge: 0, population: 0, devastation: 0 };
const effects = (changes: Partial<HearthEventEffects>): HearthEventEffects => ({ ...none, ...changes });

/** Sealed packs hash this order; append new events. The first choice of each event is the one a lapsed event takes. */
export const HEARTH_EVENTS: readonly HearthEventDefinition[] = [
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

/** Rules-aware catalog: historical campaigns offer no events. */
export const hearthEventsForRules = (version: number): readonly HearthEventDefinition[] => HEARTH_EVENTS.filter(event => event.sinceRules <= version);
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
    if (event.choices.every(choice => Object.values(choice.effects).every(value => value === 0))) throw new Error('A hearth event changes something: ' + event.id);
  }
}
