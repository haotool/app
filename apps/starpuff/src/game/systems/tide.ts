import type Phaser from 'phaser';
import { VIEW } from '../core/config';
import type { EnemyKind } from '../core/types';
import {
  TIDE,
  isTideSubmerged,
  tideFilterKind,
  tidePhase,
  tideSpawnY,
  tideWaterY,
  type TidePhase,
  type TideSpec,
} from '../logic/tide';
import { FX_TEXTURES, ensureFxTextures } from './fx';

// 糖漿潮汐呈現層（GAME_DESIGN §71）：水位真值由 logic/tide.ts 純函式導出，
// 本模組只負責糖漿面/冒泡 telegraph 視覺與 spawn 過濾接線。

export interface TideHandle {
  update(deltaMs: number): void;
  waterY(): number;
  phase(): TidePhase;
  isSubmerged(bottomY: number): boolean;
  // 漲潮期生成上收（交叉不變式 17）：補生落點恆於水面上方淨空帶。
  adjustSpawnY(defaultY: number): number;
  // 漲潮期 Magno 生成排除（交叉不變式 13）：磁場不得覆蓋漲潮期可站位。
  filterSpawnKind(kind: EnemyKind): EnemyKind;
  // 大沸騰調參（§74 Syrona P3）：換週期/漲頂，相位計時延續不重置。
  setSpec(next: TideSpec): void;
  destroy(): void;
}

const GROUND_TOP = VIEW.height - 80;
const SYRUP_TINT = 0xd07830;
const SYRUP_ALPHA = 0.62;
const BUBBLE_TINT = 0xf0a860;

export function createTide(scene: Phaser.Scene, initial: TideSpec, worldWidth: number): TideHandle {
  ensureFxTextures(scene);
  let spec = initial;
  let elapsedMs = 0;
  let currentWaterY: number = TIDE.baseY;

  // 糖漿面：世界全寬矩形，頂緣貼水位；乾潮期收納世界底（不可見）。
  const surface = scene.add
    .rectangle(worldWidth / 2, VIEW.height, worldWidth, 8, SYRUP_TINT, SYRUP_ALPHA)
    .setOrigin(0.5, 0)
    .setDepth(40);
  const glaze = scene.add
    .rectangle(worldWidth / 2, VIEW.height, worldWidth, 4, 0xffd9a0, 0.5)
    .setOrigin(0.5, 0)
    .setDepth(41);

  // 冒泡 telegraph（§71 漲潮前 1s）：沿水面線隨機上冒泡點。
  const bubbles = scene.add
    .particles(0, 0, FX_TEXTURES.dot, {
      x: { min: 0, max: worldWidth },
      y: GROUND_TOP - 4,
      speedY: { min: -60, max: -30 },
      speedX: { min: -6, max: 6 },
      scale: { start: 0.5, end: 0.1 },
      alpha: { start: 0.7, end: 0 },
      lifespan: { min: 500, max: 900 },
      frequency: 90,
      quantity: 1,
      tint: [BUBBLE_TINT, 0xffffff],
      maxAliveParticles: 14,
    })
    .setDepth(39);
  bubbles.stop();

  let bubbling = false;

  return {
    update(deltaMs: number) {
      elapsedMs += deltaMs;
      currentWaterY = tideWaterY(elapsedMs, spec, GROUND_TOP);
      const phase = tidePhase(elapsedMs, spec);
      const visibleY = Math.min(currentWaterY, VIEW.height);
      surface.setPosition(worldWidth / 2, visibleY);
      surface.setDisplaySize(worldWidth, Math.max(1, VIEW.height - visibleY + 8));
      glaze.setPosition(worldWidth / 2, visibleY - 2);
      glaze.setVisible(currentWaterY < VIEW.height);
      // 漲潮前冒泡與漲潮期水面持續氣泡；乾潮期停。
      const shouldBubble = phase !== 'dry';
      if (shouldBubble && !bubbling) {
        bubbles.start();
        bubbling = true;
      } else if (!shouldBubble && bubbling) {
        bubbles.stop();
        bubbling = false;
      }
      if (bubbling) {
        bubbles.particleY = phase === 'telegraph' ? GROUND_TOP - 4 : visibleY - 4;
      }
    },
    waterY: () => currentWaterY,
    phase: () => tidePhase(elapsedMs, spec),
    isSubmerged: (bottomY: number) => isTideSubmerged(bottomY, currentWaterY),
    adjustSpawnY: (defaultY: number) => tideSpawnY(defaultY, currentWaterY),
    filterSpawnKind: (kind: EnemyKind) => tideFilterKind(kind, tidePhase(elapsedMs, spec)),
    setSpec(next: TideSpec) {
      // 相位比例映射至新週期，避免切換當幀水位跳變。
      const ratio = (elapsedMs % spec.periodMs) / spec.periodMs;
      spec = next;
      elapsedMs = ratio * next.periodMs;
    },
    destroy() {
      surface.destroy();
      glaze.destroy();
      bubbles.destroy();
    },
  };
}
