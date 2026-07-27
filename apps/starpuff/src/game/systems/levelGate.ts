import type Phaser from 'phaser';
import { SceneKeys, type LevelId } from '../core/types';
import { nextLevelId } from '../logic/levels';
import { crossedGate, type BoundsRect } from '../logic/stageModel';
import { playSfx, stopSfx } from '../audio/sfx';
import type { FxSystem } from './fx';
import type { PlayerHandle } from './player';

// 星星門流程（GAME_DESIGN §26/§39/§43）：生成演出、逐幀掃掠背擋與過關演出
// 自 GameScene 抽出（W2 前置 1200 行閘）；門必達背擋 crossedGate 幾何由
// logic/stageModel 單點供給，pair overlap 間歇漏檢的逐幀補判不得移除。
// groundTop 沿 bossFactory/eliteRoom 慣例由 GameScene 傳入（模組不 value-import phaser）。

// 星星門：位於世界右端、地面上方；演出時玩家縮小旋轉飛入。
const GATE_MARGIN_X = 120;
const GATE_ZONE_W = 90;
const GATE_ZONE_H = 150;
const GATE_ABSORB_MS = 700;
// 過關星爆停留短拍後進世界地圖（§39：通關後自動進入）。
const MAP_ENTER_DELAY_MS = 500;

export interface LevelGateHooks {
  player(): PlayerHandle;
  fx(): FxSystem;
  isBossLevel(): boolean;
  // 勝敗轉場窗（finished || transitioning）：期間不生成、不重複結算過關。
  isSettled(): boolean;
  beginTransition(): void;
  worldWidth(): number;
  levelId(): LevelId;
  // 蓄能星通關快照（§109）：委派 starburstDirector.noteClear。
  noteClear(): void;
  // 存檔寫入時機（§38）：通關即記錄，演出中斷（切頁/重載）不掉進度。
  persistClear(): void;
}

export interface LevelGateHandle {
  spawn(): void;
  // 逐幀掃掠背擋（§26/§43）：pair overlap 間歇漏檢的幾何補判，不得移除。
  sweep(): void;
  // 折躍瞬移（§66）：重置掃掠基準，防前後幀大位移被誤判為跨越星星門。
  noteWarp(x: number): void;
  // 流星雨排除帶（§79）：開門後門前帶消費；未生成回 null。
  gateX(): number | null;
}

export function createLevelGate(
  scene: Phaser.Scene,
  groundTop: number,
  hooks: LevelGateHooks,
): LevelGateHandle {
  const GATE_Y = groundTop - 90;
  let gate: Phaser.GameObjects.Container | null = null;
  let gateRect: BoundsRect | null = null;
  let prevPlayerX = 0;

  // 星星門：fx-star 放大 + 光暈脈動 + 浮動 tween（graphics 組合，不新增美術）。
  function spawn(): void {
    if (gate || hooks.isBossLevel() || hooks.isSettled()) return;
    const gx = hooks.worldWidth() - GATE_MARGIN_X;
    const glow = scene.add.image(0, 0, 'fx-star').setDisplaySize(150, 150).setAlpha(0.35);
    const core = scene.add.image(0, 0, 'fx-star').setDisplaySize(96, 96);
    const container = scene.add.container(gx, GATE_Y, [glow, core]);
    container.setScale(0);
    gate = container;
    scene.tweens.add({ targets: container, scale: 1, duration: 400, ease: 'Back.easeOut' });
    scene.tweens.add({
      targets: glow,
      scale: glow.scale * 1.25,
      alpha: 0.15,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: container,
      y: GATE_Y - 14,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const zone = scene.add.zone(gx, GATE_Y, GATE_ZONE_W, GATE_ZONE_H);
    scene.physics.add.existing(zone, true);
    scene.physics.add.overlap(hooks.player().sprite, zone, () => completeLevel());
    gateRect = {
      left: gx - GATE_ZONE_W / 2,
      right: gx + GATE_ZONE_W / 2,
      top: GATE_Y - GATE_ZONE_H / 2,
      bottom: GATE_Y + GATE_ZONE_H / 2,
    };
    prevPlayerX = hooks.player().sprite.x;
    // 門生在身後（§43）：開門瞬間玩家已在門區內或門心右側（右緣紮營），直接判入門。
    if (playerCrossedGate(prevPlayerX)) completeLevel();
  }

  // 星星門必達背擋（§26/§43）：pair overlap 間歇漏檢——逐幀 crossedGate 幾何補判。
  function sweep(): void {
    if (!gate) return;
    const x = hooks.player().sprite.x;
    const crossed = playerCrossedGate(prevPlayerX);
    prevPlayerX = x;
    if (crossed) completeLevel();
  }

  function playerCrossedGate(prevX: number): boolean {
    if (!gate || !gateRect) return false;
    const sprite = hooks.player().sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    return crossedGate(
      prevX,
      sprite.x,
      gate.x,
      { left: body.left, right: body.right, top: body.top, bottom: body.bottom },
      gateRect,
    );
  }

  // 過關演出（§39）：玩家縮小旋轉飛入門 → 寫入存檔 → 世界地圖（揭霧下一關節點）。
  function completeLevel(): void {
    if (hooks.isSettled() || !gate) return;
    hooks.beginTransition();
    stopSfx('inhale');
    hooks.fx().stopInhale();
    playSfx('swallow');
    const sprite = hooks.player().sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
    hooks.noteClear();
    hooks.persistClear();
    scene.tweens.add({
      targets: sprite,
      x: gate.x,
      y: gate.y,
      scale: 0,
      angle: 720,
      duration: GATE_ABSORB_MS,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        hooks.fx().starBurst(gate?.x ?? sprite.x, gate?.y ?? GATE_Y);
        playSfx('win');
        scene.time.delayedCall(MAP_ENTER_DELAY_MS, () =>
          scene.scene.start(SceneKeys.Map, { reveal: nextLevelId(hooks.levelId()) }),
        );
      },
    });
  }

  return {
    spawn,
    sweep,
    noteWarp: (x) => {
      prevPlayerX = x;
    },
    gateX: () => gate?.x ?? null,
  };
}
