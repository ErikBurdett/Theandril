/** Durable client settings: what a player chose for reading the game, kept in
 * the browser's own storage and read back on the next visit. Nothing here is
 * canonical campaign state; the simulation never sees it. */
export const SETTINGS_STORAGE_KEY = 'theandril.settings.v1';
export const TEXT_SCALES = ['1', '1.15', '1.3'] as const;
export type TextScale = typeof TEXT_SCALES[number];
export interface ClientSettings { textScale: TextScale; reduceMotion: boolean }
export const DEFAULT_SETTINGS: ClientSettings = { textScale: '1', reduceMotion: false };

/** Reads the saved settings, or the defaults with a reason when nothing valid was saved. */
export function loadSettings(read: () => string | null): { settings: ClientSettings; error: string } {
  try {
    const text = read();
    if (text === null) return { settings: { ...DEFAULT_SETTINGS }, error: '' };
    const input: unknown = JSON.parse(text);
    if (!input || typeof input !== 'object') throw new Error('Invalid settings');
    const record = input as Record<string, unknown>;
    if (!TEXT_SCALES.includes(record.textScale as TextScale) || typeof record.reduceMotion !== 'boolean') throw new Error('Invalid settings');
    return { settings: { textScale: record.textScale as TextScale, reduceMotion: record.reduceMotion }, error: '' };
  } catch {
    return { settings: { ...DEFAULT_SETTINGS }, error: 'Saved settings could not be read. Using the defaults; change them in Campaign & settings.' };
  }
}

/** Writes the settings; a storage that refuses leaves the session's choices in force and says so. */
export function saveSettings(settings: ClientSettings, write: (text: string) => void): string {
  try { write(JSON.stringify(settings)); return ''; }
  catch { return 'Settings work for this session, but browser storage could not save them.'; }
}
