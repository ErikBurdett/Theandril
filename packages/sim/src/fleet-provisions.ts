/** Rules 31: turns a fleet can feed itself and its passengers beyond harbour supply.
 * Kept independent of supply queries so composition and save schemas do not pull
 * the simulation's command graph into their module initialization. */
export const FLEET_PROVISION_TURNS = 8;
