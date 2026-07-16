import Phaser from 'phaser';
import './pwa';
import './style.css';
import { GRAVITY_Y, VIEW, type StarFlavor } from './game/core/config';
import { applyLayoutToDom, loadLayout } from './game/core/layout';
import { loadSave, type SaveData } from './game/core/save';
import { initShellLayout, initialShellWidth } from './game/core/shellLayout';
import { SceneKeys, type EnemyKind, type LevelId } from './game/core/types';
import type { EnemySystem } from './game/systems/enemies';
import type { PlayerHandle } from './game/systems/player';
import type { WaveRunner } from './game/systems/waves';
import { BootScene } from './game/scenes/BootScene';
import { TitleScene } from './game/scenes/TitleScene';
import { MapScene } from './game/scenes/MapScene';
import { GameScene } from './game/scenes/GameScene';
import { ResultScene } from './game/scenes/ResultScene';
import { CodexScene } from './game/scenes/CodexScene';
import { restoreMutePreference } from './game/systems/hud';
import { isGamePaused, openPauseMenu } from './game/systems/pause';

restoreMutePreference();
// 開機套用虛擬鍵自訂布局（§34）：JS 就緒即覆蓋 CSS fallback 預設位。
applyLayoutToDom(document, loadLayout());

// iOS 觸控直通（§22 / recon checklist）：長按 loupe 的觸發點是按住不動的 touchstart，
// pointerdown preventDefault 不足，殼層需 passive:false 保險；三指以上留給系統手勢。
const blockTouchStart = (event: TouchEvent): void => {
  if (event.touches.length <= 2) event.preventDefault();
};
document
  .getElementById('game-shell')
  ?.addEventListener('touchstart', blockTouchStart, { passive: false });
// Safari pinch 縮放攔截；contextmenu 關長按/右鍵選單。
document.addEventListener('gesturestart', (event) => event.preventDefault(), { passive: false });
document.addEventListener('contextmenu', (event) => event.preventDefault());

// Phaser 接線集中於此；數值 SSOT 由 config.ts（純資料）供給。
// 置中由 #app CSS grid 負責（NO_CENTER）：autoCenter margin 在旋轉殼下讀 canvas AABB
// （寬高互換）會算出錯誤偏移。
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#FDEFF6',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: initialShellWidth(),
    height: VIEW.height,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY_Y },
      // Phaser 4.2.1 動態 RTree broadphase 間歇漏檢（§43 歸因）：useTree 只影響
      // sprite vs Group 配對（吸入區/星彈/觸碰 vs enemies group）——實體數 ≤40，
      // 關閉 tree 改直接枚舉根治該類漏檢。門/彈簧為 direct pair（collideSpriteVsSprite
      // 直呼 separate、從不查 tree），本設定救不到它們，必要背擋為 GameScene 的
      // syncGateSweep 與 stage 的 sweepSprings 幾何掃掠，不得視為冗餘移除。
      useTree: false,
    },
  },
  // 非 pixel-art 美術關閉 roundPixels（US-022 / recon C.8）：與 camera 跟隨的次像素
  // 捲動值互斥，開啟會把小數落差量化成 ±1–2px 逐幀跳動。
  pixelArt: false,
  roundPixels: false,
  scene: [BootScene, TitleScene, MapScene, GameScene, ResultScene, CodexScene],
});

// 旋轉殼佈局與 Phaser 私有 API 補償（recon-v4 A/B）集中於 core/shellLayout.ts。
initShellLayout(game);

const gameScene = () => game.scene.getScene<GameScene>(SceneKeys.Game);

// 離頁自動暫停（§35，取代 §26 自動恢復）：隱藏時開啟暫停選單（scene.pause + 音訊
// suspend 由選單統一處理），回前景停在選單由玩家點「繼續」接續，杜絕回來即被偷襲。
const pauseOnLeave = (): void => {
  if (document.hidden) openPauseMenu(game);
};
document.addEventListener('visibilitychange', pauseOnLeave);
// pagehide 同走 hidden 檢查（審查修復）：作為漏接 visibilitychange 的備援，避免雙觸發。
window.addEventListener('pagehide', pauseOnLeave);

// e2e 測試鉤子：查詢場景/關卡狀態、強制勝敗、補滿配額與直達魔王關。
// 僅開發與測試環境掛載（修復包 B）：production bundle 不暴露除錯入口；
// version（§42）為唯一例外，production 也掛載供現場排障。
declare global {
  interface Window {
    __sp: { version: () => string } & Partial<{
      scene: () => string;
      stage: () => number;
      bossHp: () => number;
      playerHp: () => number;
      win: () => void;
      lose: () => void;
      fillQuota: () => void;
      skipToBoss: () => void;
      gotoLevel: (levelId: LevelId) => void;
      spawn: (kind: EnemyKind, x?: number, y?: number) => void;
      grantStar: (flavor: StarFlavor) => void;
      shieldRaised: () => boolean;
      ammo: () => { ammo: number; flavor: string };
      save: () => SaveData;
      probe: () => { x: number; scrollX: number };
      alive: () => { total: number; inhalable: number };
      gateOpen: () => boolean;
      quota: () => { killCount: number; killQuota: number };
      listeners: (event: string) => number;
      enemies: () => { kind: string; x: number; y: number }[];
      view: () => { width: number; height: number };
      paused: () => boolean;
      scenePaused: () => boolean;
      gameTime: () => number;
      codexTab: () => string;
    }>;
  }
}
window.__sp = { version: () => __APP_VERSION__ };
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  // 受控 spawn 與彈匣查詢（US-018）：以型別斷言讀場景私有系統，production 不暴露。
  const internals = () =>
    gameScene() as unknown as { enemies: EnemySystem; player: PlayerHandle; waves: WaveRunner };
  window.__sp = {
    version: () => __APP_VERSION__,
    scene: () => game.scene.getScenes(true)[0]?.scene.key ?? '',
    stage: () => gameScene().currentLevelId,
    bossHp: () => gameScene().bossHp,
    playerHp: () => gameScene().playerHp,
    win: () => gameScene().forceWin(),
    lose: () => gameScene().forceLose(),
    fillQuota: () => gameScene().forceGate(),
    skipToBoss: () => gameScene().skipToBoss(),
    // 各關反卡關走查鉤子（§43）。
    gotoLevel: (levelId) => gameScene().gotoLevel(levelId),
    spawn: (kind, x = 240, y = 300) => internals().enemies.spawn(kind, x, y),
    // v6 受控賦星與盾態觀測（§40 e2e）：走正式 swallow 管線。
    grantStar: (flavor) => internals().player.grantStar(flavor),
    shieldRaised: () => internals().player.isShieldRaised(),
    ammo: () => internals().player.getAmmoState(),
    // 存檔觀測點（§38）：回傳解析後 sp-save（含容錯回退）。
    save: () => loadSave(),
    // 抖動診斷探針（US-022）：逐幀取玩家世界座標與相機捲動，量測 screen-space 穩定度。
    probe: () => ({ x: internals().player.sprite.x, scrollX: gameScene().cameras.main.scrollX }),
    // 反卡死深度 QA 觀測點（US-025）：場上敵數、開門狀態與事件監聽數。
    alive: () => ({
      total: internals().enemies.aliveCount(),
      inhalable: internals().enemies.aliveInhalableCount(),
    }),
    gateOpen: () => internals().waves.isGateOpen(),
    quota: () => internals().waves.getQuota(),
    listeners: (event: string) => gameScene().events.listenerCount(event),
    // 響應寬幅觀測點（US-028）：回報當前邏輯視寬（854–1200）與固定邏輯高。
    view: () => ({ width: game.scale.width, height: game.scale.height }),
    // v5 觀測點（§35/§36）：暫停選單開啟態、場景真暫停態（sys.isPaused）、場景時鐘與圖鑑分頁。
    paused: () => isGamePaused(),
    scenePaused: () => game.scene.isPaused(SceneKeys.Game),
    gameTime: () => gameScene()?.time.now ?? -1,
    codexTab: () => game.scene.getScene<CodexScene>(SceneKeys.Codex)?.tab ?? '',
    enemies: () => {
      const list: { kind: string; x: number; y: number }[] = [];
      for (const child of internals().enemies.getGroup().getChildren()) {
        const kind = internals().enemies.kindOf(child);
        if (!kind) continue;
        const sprite = child as unknown as { x: number; y: number };
        list.push({ kind, x: Math.round(sprite.x), y: Math.round(sprite.y) });
      }
      return list;
    },
  };
}
