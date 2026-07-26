import type Phaser from 'phaser';
import { PLAYER } from '../core/config';
import {
  MERCY_HEAL,
  advanceMercyHeal,
  createMercyState,
  type MercyState,
} from '../logic/mercyHeal';
import { playSfx } from '../audio/sfx';
import { spawnHealPickup } from './pickups';
import type { FxSystem } from './fx';
import type { PlayerHandle } from './player';

// 慈悲補血導演（GAME_DESIGN §62／v19 pity）：每 5s 評估低血久戰保底與生成錨點
// 自 GameScene 抽出（W2 前置 1200 行閘）；決策邏輯由 logic/mercyHeal 單點供給，
// 生成與否確定性、RNG 僅決定生成位置。一般關與魔王關（含 EX）皆啟用。
// groundTop 沿 bossFactory/eliteRoom 慣例由 GameScene 傳入（模組不 value-import phaser）。

// 與 Phaser.Math.Clamp 同語意：本模組不 value-import phaser 維持 node 可測。
const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export interface MercyDirectorHooks {
  player(): PlayerHandle;
  playerHp(): number;
  fx(): FxSystem;
  isBossLevel(): boolean;
  exMode: boolean;
  // 本關（本命）經過時間：GameScene levelTimeMs（死亡重試由 create/resetLife 歸零）。
  elapsedMs(): number;
  // 前室魔王關（§69）：入 arena 後單向門鎖閉，錨點下界改 arena 左緣防落於門後。
  bossRoomEntered(): boolean;
  arenaLeft(): number;
  worldWidth(): number;
}

export interface MercyDirector {
  update(deltaMs: number): void;
  // 每命狀態重置（§67 卡點重生）：不重啟場景時由呼叫端顯式歸零。
  resetLife(): void;
  // e2e 鉤子（§62／v19 pity）：時間快轉供守門案觸發（生成已確定性）；
  // RNG 固定使生成位置可預期（玩家左側地面錨點）。
  warp(ms: number): void;
  // e2e 觀測點（§62）：本命累計愛心生成數。
  spawnedCount(): number;
}

export function createMercyDirector(
  scene: Phaser.Scene,
  groundTop: number,
  hooks: MercyDirectorHooks,
): MercyDirector {
  // 每關每命狀態（create 重建即歸零）；rng/時間快轉供 e2e 注入。
  let mercy: MercyState = createMercyState();
  let mercyRng: () => number = Math.random;
  let mercyWarpMs = 0;

  // 慈悲補血（§62／v19 pity）：每 5s 評估低血久戰保底，生成與否確定性；
  // 一般關與魔王關（含 EX）皆啟用，mercyRng 僅決定生成位置。
  function update(deltaMs: number): void {
    const result = advanceMercyHeal(mercy, {
      deltaMs,
      elapsedMs: hooks.elapsedMs() + mercyWarpMs,
      hp: hooks.playerHp(),
      maxHp: PLAYER.maxHp,
      bossRoom: hooks.isBossLevel(),
      exMode: hooks.exMode,
    });
    mercy = result.state;
    if (result.spawn) spawnMercyHeart();
  }

  function spawnMercyHeart(): void {
    const side = mercyRng() < 0.5 ? -1 : 1;
    const offset = 120 + mercyRng() * 120;
    // 夾限下界 50：玩家貼世界左牆（hurtbox 右緣 ~31）時拾取帶仍可觸及（anti-softlock）。
    // 前室魔王關（§69）：入 arena 後單向門鎖閉，錨點下界改 arena 左緣防落於門後。
    const playerX = hooks.player().sprite.x;
    const minX =
      hooks.bossRoomEntered() && playerX >= hooks.arenaLeft() ? hooks.arenaLeft() + 50 : 50;
    const x = clamp(playerX + side * offset, minX, hooks.worldWidth() - 50);
    const groundY = groundTop - 22;
    const airborne = mercyRng() >= 0.5;
    const y = airborne ? 150 : groundY;
    playSfx('reveal');
    hooks.fx().burstSmall(x, y, 0xff9ec4);
    spawnHealPickup(
      scene,
      x,
      y,
      { player: () => hooks.player(), playerHp: () => hooks.playerHp() },
      { healHp: MERCY_HEAL.healHp, ...(airborne ? { driftToY: groundY } : {}) },
    );
  }

  return {
    update,
    resetLife: () => {
      mercy = createMercyState();
    },
    warp: (ms) => {
      mercyWarpMs += ms;
      mercyRng = () => 0;
    },
    spawnedCount: () => mercy.spawned,
  };
}
