import { zzfx, ZZFX } from 'zzfx';
import { STAR_FLAVORS } from '../core/config';
import { GameEvents, onGameEvent, offGameEvent, type GameEventName } from '../core/events';

export type SfxName =
  | 'jump'
  | 'flap'
  | 'inhale'
  | 'swallow'
  | 'shoot'
  | 'hit'
  | 'hurt'
  | 'pop'
  | 'chomp'
  | 'boss-roar'
  | 'boss-slam'
  | 'win'
  | 'lose';

// zzfx 參數序：volume, randomness, frequency, attack, sustain, release, shape,
// shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise。
// randomness ≥ 0.05 即內建 ±5% 音高隨機（Q 彈感）。
const PARAMS: Record<Exclude<SfxName, 'inhale'>, number[]> = {
  jump: [0.5, 0.05, 350, 0.02, 0.05, 0.14, 0, 1.9, 7],
  flap: [0.35, 0.1, 210, 0.01, 0.03, 0.08, 1, 1.4, 5],
  swallow: [0.6, 0.05, 340, 0.01, 0.06, 0.13, 0, 1.6, -9, 0, -110, 0.05],
  shoot: [0.45, 0.05, 690, 0.01, 0.04, 0.15, 1, 1.8, -3],
  hit: [0.45, 0.05, 520, 0.01, 0.02, 0.07, 2, 1.5, 0, 0, 0, 0, 0, 0.15],
  hurt: [0.6, 0.05, 175, 0.02, 0.06, 0.24, 1, 1.8, -6, 0, 0, 0, 0, 0.1],
  pop: [0.55, 0.1, 470, 0.01, 0.02, 0.16, 3, 1.6, -10, 0, 0, 0, 0, 0.45],
  chomp: [0.55, 0.05, 230, 0.01, 0.04, 0.1, 2, 1.7, -7, 0, 0, 0, 0, 0.2],
  'boss-roar': [0.8, 0.1, 64, 0.05, 0.22, 0.45, 3, 1.2, 0, 0, -25, 0.15, 0, 0.6],
  'boss-slam': [0.8, 0.05, 95, 0.01, 0.09, 0.32, 2, 1.7, -11, 0, 0, 0, 0, 0.8],
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
  bind(GameEvents.STAR_FIRED, ({ flavor }) => playSfx('shoot', STAR_FLAVORS[flavor].sfxPitch));
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
}
