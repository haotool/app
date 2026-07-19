import { zzfx, ZZFX } from 'zzfx';
import { GameEvents, onGameEvent, offGameEvent, type GameEventName } from '../core/events';
import { vibrateForSfx } from './haptics';

export type SfxName =
  | 'jump'
  | 'flap'
  | 'footstep'
  | 'inhale'
  | 'swallow'
  | 'shoot'
  | 'hit'
  | 'hurt'
  | 'metal'
  | 'pop'
  | 'chomp'
  | 'shell-spin'
  | 'zap'
  | 'boss-roar'
  | 'boss-slam'
  | 'charge'
  | 'starstorm'
  | 'slam-down'
  | 'jingle'
  | 'spring'
  | 'break'
  | 'reveal'
  | 'win'
  | 'lose';

// zzfx 參數序：volume, randomness, frequency, attack, sustain, release, shape,
// shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise。
// randomness ≥ 0.05 即內建 ±5% 音高隨機（Q 彈感）。
const PARAMS: Record<Exclude<SfxName, 'inhale'>, number[]> = {
  jump: [0.5, 0.05, 350, 0.02, 0.05, 0.14, 0, 1.9, 7],
  flap: [0.35, 0.1, 210, 0.01, 0.03, 0.08, 1, 1.4, 5],
  // 步伐拍點（§45）：低量噪波短點，隨步頻節拍輕觸不干擾主音場。
  footstep: [0.12, 0.15, 160, 0.001, 0.01, 0.04, 4, 1.2, 0, 0, 0, 0, 0, 0.4],
  swallow: [0.6, 0.05, 340, 0.01, 0.06, 0.13, 0, 1.6, -9, 0, -110, 0.05],
  shoot: [0.45, 0.05, 690, 0.01, 0.04, 0.15, 1, 1.8, -3],
  hit: [0.45, 0.05, 520, 0.01, 0.02, 0.07, 2, 1.5, 0, 0, 0, 0, 0, 0.15],
  hurt: [0.6, 0.05, 175, 0.02, 0.06, 0.24, 1, 1.8, -6, 0, 0, 0, 0, 0.1],
  // 短促金屬叮聲（§17 皇冠落地）：高頻三角波 + pitchJump 泛音。
  metal: [0.5, 0.05, 1046, 0.005, 0.03, 0.16, 1, 1.9, 0, 0, 520, 0.05],
  pop: [0.55, 0.1, 470, 0.01, 0.02, 0.16, 3, 1.6, -10, 0, 0, 0, 0, 0.45],
  chomp: [0.55, 0.05, 230, 0.01, 0.04, 0.1, 2, 1.7, -7, 0, 0, 0, 0, 0.2],
  // 殼殼縮殼旋轉（§30）：低頻鋸齒連擊模擬殼體高速旋轉。
  'shell-spin': [0.5, 0.1, 210, 0.01, 0.22, 0.16, 2, 1.4, 3, 0, 0, 0, 0.05, 0.25],
  // 雷雷放電環（§30）：高頻噪波短促電擊。
  zap: [0.55, 0.1, 730, 0.01, 0.06, 0.15, 4, 1.3, -4, 0, 0, 0, 0.06, 0.7],
  'boss-roar': [0.8, 0.1, 64, 0.05, 0.22, 0.45, 3, 1.2, 0, 0, -25, 0.15, 0, 0.6],
  'boss-slam': [0.8, 0.05, 95, 0.01, 0.09, 0.32, 2, 1.7, -11, 0, 0, 0, 0, 0.8],
  // 連吞升級（§23）：上揚雙音強化提示。
  charge: [0.55, 0.02, 440, 0.01, 0.08, 0.18, 0, 1.7, 0, 0, 220, 0.06],
  // 星暴（§23）：低頻轟鳴 + 上行泛音掃頻。
  starstorm: [0.9, 0.05, 110, 0.03, 0.3, 0.6, 2, 1.4, 4, 0.2, 180, 0.12, 0.1, 0.3],
  // 下衝擊落地（§23）：短促重擊。
  'slam-down': [0.7, 0.05, 130, 0.01, 0.06, 0.26, 2, 1.8, -9, 0, 0, 0, 0, 0.6],
  // 彩蛋 jingle（§24）：明亮琶音。
  jingle: [0.6, 0.02, 659.25, 0.02, 0.14, 0.28, 0, 1.6, 0, 0, 262, 0.06, 0.07],
  // 彈簧墊（§29）：上滑 boing 彈跳音。
  spring: [0.6, 0.05, 300, 0.01, 0.08, 0.2, 0, 1.8, 14],
  // 可破壞磚（§29）：噪聲碎裂聲。
  break: [0.55, 0.1, 210, 0.01, 0.05, 0.22, 3, 1.4, -8, 0, 0, 0, 0, 0.6],
  // 世界地圖揭霧 sting（§39）：上行琶音閃光。
  reveal: [0.55, 0.02, 523.25, 0.02, 0.12, 0.3, 0, 1.7, 0, 0, 392, 0.05, 0.06],
  win: [0.6, 0.02, 523.25, 0.02, 0.18, 0.3, 0, 1.5, 0, 0, 130, 0.07, 0.08],
  lose: [0.6, 0.02, 260, 0.03, 0.2, 0.5, 0, 1.3, -4, -0.15],
};

const INHALE_PARAMS = [0.3, 0, 150, 0.04, 0.35, 0.1, 4, 0.6, 0, 0, 0, 0, 0, 0.5];

let inhaleSource: AudioBufferSourceNode | null = null;
let inhaleSamples: number[] | null = null;
let muted = false;

// pitchScale 以頻率倍率微調音高（§20：發射音依星彈屬性分色）。
export function playSfx(name: SfxName, pitchScale = 1): void {
  if (muted) return;
  // 觸覺與音效同源觸發（§94）：靜音早退即同步關閉震動。
  vibrateForSfx(name);
  if (name === 'inhale') {
    if (inhaleSource) return;
    inhaleSamples ??= ZZFX.buildSamples(...INHALE_PARAMS);
    inhaleSource = ZZFX.playSamples([inhaleSamples], 0.8, 1, 0, true);
    return;
  }
  const params = PARAMS[name];
  if (pitchScale === 1) {
    zzfx(...params);
    return;
  }
  const pitched = [...params];
  pitched[2] = (pitched[2] ?? 0) * pitchScale;
  zzfx(...pitched);
}

// 靜音時同步停掉進行中的 inhale 迴圈，避免殘留長音。
export function setSfxMuted(nextMuted: boolean): void {
  muted = nextMuted;
  if (muted) stopSfx('inhale');
}

export function stopSfx(name: SfxName): void {
  if (name === 'inhale' && inhaleSource) {
    inhaleSource.stop();
    inhaleSource = null;
  }
}

type Bus = Parameters<typeof onGameEvent>[0];

// 契約事件自動配音；jump / flap / inhale / boss-slam 無對應事件，由各系統顯式呼叫。
export function bindSfxToEvents(bus: Bus): () => void {
  const unbinders: (() => void)[] = [];
  const bind = <K extends GameEventName>(
    event: K,
    handler: Parameters<typeof onGameEvent<K>>[2],
  ): void => {
    onGameEvent(bus, event, handler);
    unbinders.push(() => offGameEvent(bus, event, handler));
  };

  bind(GameEvents.PLAYER_DAMAGED, () => playSfx('hurt'));
  bind(GameEvents.ENEMY_INHALED, () => {
    stopSfx('inhale');
    playSfx('swallow');
  });
  bind(GameEvents.ENEMY_KILLED, () => playSfx('hit'));
  // 發射 pitch（§23）：payload 已含強化 -15% 規則後的最終倍率。
  bind(GameEvents.STAR_FIRED, ({ pitch }) => playSfx('shoot', pitch));
  bind(GameEvents.BOSS_SPAWNED, () => playSfx('boss-roar'));
  bind(GameEvents.BOSS_PHASE, () => playSfx('boss-roar'));
  bind(GameEvents.BOSS_DAMAGED, () => playSfx('hit'));
  bind(GameEvents.GAME_WON, () => {
    stopSfx('inhale');
    playSfx('win');
  });
  bind(GameEvents.GAME_LOST, () => {
    stopSfx('inhale');
    playSfx('lose');
  });

  return () => {
    unbinders.forEach((off) => off());
    unbinders.length = 0;
  };
}

// 暫停系統音訊全停（§35）：suspend 停 BGM 與 SFX；resume 同時涵蓋 iOS 切背景後的
// 非標準 'interrupted' 態（§33 調研：!== 'running' 即需 resume，且須在手勢堆疊內呼叫）。
// intentionallySuspended 區分「刻意暫停」與「系統中斷」：前者不被手勢保險喚回。
let intentionallySuspended = false;

export function suspendAudio(): void {
  intentionallySuspended = true;
  // 迴圈音源顯式停止（審查修復）：suspend 只凍結 context，resume 後迴圈會殘留續播。
  stopSfx('inhale');
  const ctx = ZZFX.audioContext;
  if (ctx.state === 'running') void ctx.suspend();
}

export function resumeAudio(): void {
  intentionallySuspended = false;
  const ctx = ZZFX.audioContext;
  if (ctx.state !== 'running') void ctx.resume();
}

let unlocked = false;

// iOS Safari：首次使用者手勢 resume AudioContext 並播靜音 blip（recon-tech 模式）。
export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  const ctx = ZZFX.audioContext;
  if (ctx.state === 'suspended') void ctx.resume();
  zzfx(0.01, 0, 0, 0, 0, 0.01);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  // 回前景復聲保險（§33）：iOS 切 app 後 context 進 interrupted，任一手勢內喚回；
  // 刻意暫停（暫停選單）期間不喚回，由選單「繼續」統一恢復。
  window.addEventListener(
    'pointerdown',
    () => {
      if (unlocked && !intentionallySuspended) resumeAudio();
    },
    { passive: true },
  );
}
