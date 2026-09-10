import data from './compendium/data.json';

type Entry = { id: string; name: string };
const factions = data.factions as Entry[];
const units = data.units as Entry[];

/** Query values may be a short id from an internal link or a full content id pasted from the source. */
function find(entries: Entry[], prefix: string, value: string | null): Entry | undefined {
  if (!value) return undefined;
  const id = value.startsWith(prefix) ? value : `${prefix}${value}`;
  return entries.find(entry => entry.id === id);
}

export const resolveCulture = (value: string | null) => find(factions, 'faction.', value);
export const resolveUnit = (value: string | null) => find(units, 'unit.', value);
