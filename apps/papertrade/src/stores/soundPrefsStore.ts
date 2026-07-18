import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

export const SOUND_PREFS_STORAGE_KEY = 'papertrade:sound-prefs';
export const SOUND_PREFS_STORAGE_VERSION = 1;

const persistedSoundPrefsSchema = z.object({
  liquidationSound: z.boolean(),
});

interface SoundPrefsState {
  liquidationSound: boolean;
  toggleLiquidationSound: () => void;
}

export const useSoundPrefsStore = create<SoundPrefsState>()(
  persist(
    (set) => ({
      liquidationSound: true,
      toggleLiquidationSound: () => set((state) => ({ liquidationSound: !state.liquidationSound })),
    }),
    {
      name: SOUND_PREFS_STORAGE_KEY,
      version: SOUND_PREFS_STORAGE_VERSION,
      partialize: (state) => ({ liquidationSound: state.liquidationSound }),
      // 解析失敗安全回落預設值（開啟），不 crash。
      merge: (persisted, current) => {
        const parsed = persistedSoundPrefsSchema.safeParse(persisted);
        if (!parsed.success) return current;
        return { ...current, liquidationSound: parsed.data.liquidationSound };
      },
    },
  ),
);
