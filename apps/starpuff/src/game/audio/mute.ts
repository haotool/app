import { setBgmMuted } from './bgm';
import { setSfxMuted } from './sfx';

// 全域靜音開關：BGM gain 歸零 + SFX 播放抑制一致切換；UI 由此單一入口接線。
let muted = false;

export function setMuted(nextMuted: boolean): void {
  muted = nextMuted;
  setBgmMuted(nextMuted);
  setSfxMuted(nextMuted);
}

export function isMuted(): boolean {
  return muted;
}
