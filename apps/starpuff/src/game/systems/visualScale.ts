// 物理/視覺縮放解耦通道（v19 #819 子項 3，根治 GAME_DESIGN §77 型缺陷家族）。
// Phaser 4 Arcade Body 每物理步經 updateBounds 以 sourceWidth × |scale| 重算碰撞箱
//（Body.js updateBounds；官方無凍結旗標，syncBounds 只會更強耦合），且 TweenManager
// 與物理 world 同掛 SceneEvents.UPDATE——直接 tween sprite scale 會在同幀被物理讀到，
// 形成落地擠壓迴圈、腳底離台、穿台與 overlap 漏檢。
// 本通道把蹲姿/走 bob 已驗證的「PRE_UPDATE 還原、POST_UPDATE 套用」視覺通道模式
// 全遊戲統一：物理步只見基準 scale，渲染見 基準×fx×mod；瞬態縮放永不進物理。
// - base：物理基準 scale（精英體型、鑽地鰭、縮殼、魔王 phase 縮體等狀態性造型）。
// - fx：tween 標的代理（squash/stretch、popIn、wobble、死亡壓縮）。
// - mod：逐幀直寫代理（idle 呼吸、蹲姿壓扁），由擁有者每幀維護。
import Phaser from 'phaser';

export interface VisualScaleProxy {
  sx: number;
  sy: number;
}

// 結構性最小面：單元測試可用替身 sprite，不依賴完整 Arcade.Sprite。
export interface ScalableSprite {
  scaleX: number;
  scaleY: number;
  setScale(x: number, y?: number): unknown;
  scene?: unknown;
}

interface Entry {
  sprite: ScalableSprite;
  baseX: number;
  baseY: number;
  fx: VisualScaleProxy;
  mod: VisualScaleProxy;
}

export interface VisualScaleChannel {
  // 註冊（冪等）：以 sprite 當前 scale 為物理基準；重複註冊＝rebase＋fx/mod 全復位
  //（物件池重用單點）。
  register(sprite: ScalableSprite): void;
  // 以 sprite 當前 scale 重錨基準：setDisplaySize 等「狀態性造型」變更後呼叫。
  rebase(sprite: ScalableSprite): void;
  // 直接指定物理基準：狀態機逐幀維持造型（鑽地鰭/半潛/縮殼）用。
  setBase(sprite: ScalableSprite, sx: number, sy: number): void;
  fx(sprite: ScalableSprite): VisualScaleProxy;
  mod(sprite: ScalableSprite): VisualScaleProxy;
  // 終止 fx tween（保留當前 fx 值，死亡壓縮自當前形變接續用）。
  killFxTweens(sprite: ScalableSprite): void;
  // 終止 fx tween 並復位為 1（squash 重觸發、演出中斷復位用）。
  resetFx(sprite: ScalableSprite): void;
  isFxTweening(sprite: ScalableSprite): boolean;
  unregister(sprite: ScalableSprite): void;
}

const channels = new WeakMap<Phaser.Scene, VisualScaleChannel>();

function createChannel(scene: Phaser.Scene): VisualScaleChannel {
  const entries = new Map<ScalableSprite, Entry>();

  const entryOf = (sprite: ScalableSprite): Entry => {
    const entry = entries.get(sprite);
    if (!entry) throw new Error('visualScale：sprite 未註冊');
    return entry;
  };

  // 物理讀取前還原基準：本幀 tween/狀態機寫入的一切視覺形變不進 updateBounds。
  const restoreBase = () => {
    for (const entry of entries.values()) {
      if (!entry.sprite.scene) continue;
      entry.sprite.setScale(entry.baseX, entry.baseY);
    }
  };
  // 物理回寫後套用視覺：渲染見 基準×fx×mod。
  const applyVisual = () => {
    for (const entry of entries.values()) {
      if (!entry.sprite.scene) continue;
      entry.sprite.setScale(
        entry.baseX * entry.fx.sx * entry.mod.sx,
        entry.baseY * entry.fx.sy * entry.mod.sy,
      );
    }
  };
  scene.events.on(Phaser.Scenes.Events.PRE_UPDATE, restoreBase);
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, applyVisual);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.PRE_UPDATE, restoreBase);
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, applyVisual);
    entries.clear();
    channels.delete(scene);
  });

  const killFxTweens = (sprite: ScalableSprite) => {
    scene.tweens.killTweensOf(entryOf(sprite).fx);
  };

  return {
    register(sprite) {
      const existing = entries.get(sprite);
      if (existing) {
        scene.tweens.killTweensOf(existing.fx);
        existing.baseX = sprite.scaleX;
        existing.baseY = sprite.scaleY;
        existing.fx.sx = 1;
        existing.fx.sy = 1;
        existing.mod.sx = 1;
        existing.mod.sy = 1;
        return;
      }
      entries.set(sprite, {
        sprite,
        baseX: sprite.scaleX,
        baseY: sprite.scaleY,
        fx: { sx: 1, sy: 1 },
        mod: { sx: 1, sy: 1 },
      });
    },
    rebase(sprite) {
      const entry = entryOf(sprite);
      entry.baseX = sprite.scaleX;
      entry.baseY = sprite.scaleY;
    },
    setBase(sprite, sx, sy) {
      const entry = entryOf(sprite);
      entry.baseX = sx;
      entry.baseY = sy;
    },
    fx(sprite) {
      return entryOf(sprite).fx;
    },
    mod(sprite) {
      return entryOf(sprite).mod;
    },
    killFxTweens,
    resetFx(sprite) {
      killFxTweens(sprite);
      const { fx } = entryOf(sprite);
      fx.sx = 1;
      fx.sy = 1;
    },
    isFxTweening(sprite) {
      return scene.tweens.isTweening(entryOf(sprite).fx);
    },
    unregister(sprite) {
      const entry = entries.get(sprite);
      if (!entry) return;
      scene.tweens.killTweensOf(entry.fx);
      entries.delete(sprite);
    },
  };
}

// 場景鍵入惰性單例：模組各自取用免穿線；scene restart 由 shutdown 清理後自然重建。
export function getVisualScale(scene: Phaser.Scene): VisualScaleChannel {
  const existing = channels.get(scene);
  if (existing) return existing;
  const channel = createChannel(scene);
  channels.set(scene, channel);
  return channel;
}
