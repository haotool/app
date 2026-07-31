import type Phaser from 'phaser';
import { PLAYER } from '../core/config';
import { playSfx, stopSfx } from '../audio/sfx';
import type { ControlsSystem } from './controls';
import type { FxSystem } from './fx';
import type { PlayerHandle } from './player';
import type { ToastSystem } from './toasts';
import type { WaveRunner } from './waves';

// 玩家體感同步（GAME_DESIGN §30/§45/§110/§119）自 GameScene 抽出（W2 前置 1200 行閘）：
// 嘴部錨點/吸入音效邊緣觸發、跳躍配音、SP 變身首次教學、低幀率沉地防護與教學輸入。
// groundTop 沿 bossFactory/eliteRoom 慣例由 GameScene 傳入（模組不 value-import phaser）。

const MOUTH_OFFSET_X = 26;

// SP 變身教學浮字（§110）：變身徽章首次浮現時一次性教學，session 記憶體慣例
//（跨關卡重試保留、重載重置）——與 starburstDirector 的教學旗標同制。
let taughtTransformSp = false;

export interface PlayerFeelHooks {
  player(): PlayerHandle;
  controls(): ControlsSystem;
  fx(): FxSystem;
  toasts(): ToastSystem;
  waves(): WaveRunner;
}

export interface PlayerFeel {
  // 教學浮字：偵測首次任一操作輸入，交由 waves 排程淡出。
  syncTutorialInput(): void;
  // SP 情境鍵同步與變身教學（§110/§119）：任一形態資格徽章首次浮現即教一次。
  syncSpMode(): void;
  // 低幀率沉地防護（§45）：完整沒入地面帶即回貼地表——正常著地永不觸發。
  clampAboveGround(): void;
  // 跳躍/拍翅無契約事件，以速度轉變判定配音（buffer 觸發的跳躍無當幀按壓）。
  syncJumpSfx(): void;
  syncInhale(): void;
  // 嘴部錨點（穩定參照，逐幀就地更新）：fx 吸入粒子與 applyInhalePull 共用。
  mouth(): { x: number; y: number };
}

export function createPlayerFeel(groundTop: number, hooks: PlayerFeelHooks): PlayerFeel {
  const mouth = { x: 0, y: 0 };
  let prevVy = 0;
  let wasInhaling = false;

  function syncTutorialInput(): void {
    const { left, right, jumpHeld, actionHeld } = hooks.controls().state;
    if (left || right || jumpHeld || actionHeld) hooks.waves().noteInput();
  }

  function syncSpMode(): void {
    const spMode = hooks.player().getSpMode();
    hooks.controls().setSpMode(spMode);
    // TF 鍵（#952）：與 SP 同幀同步，兩鍵呈現皆為「圖示即行為」。
    const tfMode = hooks.player().getTransformKeyMode();
    hooks.controls().setTransformKeyMode(tfMode);
    // 變身技能圖示（§124 W5a）：變身期 B 鍵換形態 skill 鍵帽，解除即還原。
    hooks.controls().setFormSkill(hooks.player().getTransformState().form);
    // SP 變身教學（§110/§119）：任一形態資格徽章首次浮現即教一次。
    // #952 拆鍵後資格徽章移至 TF 鍵，教學改讀 TF 模式。
    const tfIsForm = tfMode !== 'hidden' && tfMode !== 'dismiss';
    if (!taughtTransformSp && tfIsForm) {
      taughtTransformSp = true;
      hooks.toasts().flavor('同系星彈 ×3！按變身鍵立即變身');
    }
  }

  function clampAboveGround(): void {
    const sprite = hooks.player().sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (body.top <= groundTop + 2 || body.velocity.y < 0) return;
    const { x: vx } = body.velocity;
    const lift = body.bottom - groundTop;
    body.reset(sprite.x, sprite.y - lift);
    body.setVelocity(vx, 0);
  }

  function syncJumpSfx(): void {
    const vy = (hooks.player().sprite.body as Phaser.Physics.Arcade.Body).velocity.y;
    if (vy !== prevVy) {
      if (vy === PLAYER.jumpVelocity) playSfx('jump');
      else if (vy === PLAYER.floatLift) playSfx('flap');
    }
    prevVy = vy;
  }

  function syncInhale(): void {
    const player = hooks.player();
    mouth.x = player.sprite.x + player.getFacing() * MOUTH_OFFSET_X;
    mouth.y = player.sprite.y;
    const inhaling = player.isInhaling();
    if (inhaling && !wasInhaling) {
      hooks.fx().startInhale(mouth);
      playSfx('inhale');
    } else if (!inhaling && wasInhaling) {
      hooks.fx().stopInhale();
      stopSfx('inhale');
    }
    wasInhaling = inhaling;
  }

  return {
    syncTutorialInput,
    syncSpMode,
    clampAboveGround,
    syncJumpSfx,
    syncInhale,
    mouth: () => mouth,
  };
}

// 測試重置鉤子：session 模組狀態在 vitest 間隔離（沿 starburstDirector 慣例）。
export function resetPlayerFeelSession(): void {
  taughtTransformSp = false;
}
