import { describe, expect, it } from 'vitest';
import {
  SOUND_PREFS_STORAGE_KEY,
  SOUND_PREFS_STORAGE_VERSION,
  useSoundPrefsStore,
} from './soundPrefsStore';

describe('useSoundPrefsStore', () => {
  it('defaults the liquidation sound to on and toggles it', () => {
    useSoundPrefsStore.setState({ liquidationSound: true });
    useSoundPrefsStore.getState().toggleLiquidationSound();
    expect(useSoundPrefsStore.getState().liquidationSound).toBe(false);
    useSoundPrefsStore.getState().toggleLiquidationSound();
    expect(useSoundPrefsStore.getState().liquidationSound).toBe(true);
  });

  it('falls back to defaults on a corrupted persisted payload', async () => {
    window.localStorage.setItem(
      SOUND_PREFS_STORAGE_KEY,
      JSON.stringify({ state: { liquidationSound: 'yes' }, version: SOUND_PREFS_STORAGE_VERSION }),
    );
    useSoundPrefsStore.setState({ liquidationSound: true });
    await useSoundPrefsStore.persist.rehydrate();
    expect(useSoundPrefsStore.getState().liquidationSound).toBe(true);
  });

  it('rehydrates a valid persisted payload', async () => {
    window.localStorage.setItem(
      SOUND_PREFS_STORAGE_KEY,
      JSON.stringify({ state: { liquidationSound: false }, version: SOUND_PREFS_STORAGE_VERSION }),
    );
    await useSoundPrefsStore.persist.rehydrate();
    expect(useSoundPrefsStore.getState().liquidationSound).toBe(false);
  });
});
