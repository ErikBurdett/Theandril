import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, SETTINGS_STORAGE_KEY } from './settings';

describe('durable client settings', () => {
  it('round-trips a valid choice, defaults when nothing is saved, and reports unreadable or refused storage without throwing', () => {
    expect(SETTINGS_STORAGE_KEY).toBe('theandril.settings.v1');
    expect(loadSettings(() => null)).toEqual({ settings: DEFAULT_SETTINGS, error: '' });
    let stored: string | null = null;
    expect(saveSettings({ textScale: '1.3', reduceMotion: true }, text => { stored = text; })).toBe('');
    expect(loadSettings(() => stored)).toEqual({ settings: { textScale: '1.3', reduceMotion: true }, error: '' });
    for (const bad of ['{', '[]', '{"textScale":"2","reduceMotion":true}', '{"textScale":"1.15"}', '{"textScale":"1","reduceMotion":"yes"}']) {
      const read = loadSettings(() => bad);
      expect(read.settings).toEqual(DEFAULT_SETTINGS);
      expect(read.error).toContain('could not be read');
    }
    expect(loadSettings(() => { throw new Error('blocked'); }).error).toContain('could not be read');
    expect(saveSettings(DEFAULT_SETTINGS, () => { throw new Error('quota'); })).toContain('could not save');
  });
});
