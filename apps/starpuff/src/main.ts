import Phaser from 'phaser';
import './pwa';
import './style.css';
import { initInstallGuide } from './installGuide';
import { initOrientationGuide } from './orientationGuide';
import { initRotationNotice } from './rotationNotice';
import { initWakeLock } from './wakeLock';
import { GRAVITY_Y, STAR_FLAVORS, VIEW, type StarFlavor } from './game/core/config';
import { applyLayoutToDom, loadLayout } from './game/core/layout';
import { applyDesktopModeClass, applyRotationClass, loadRotationPref } from './game/core/rotation';
import { loadSave, persistSave, type SaveData } from './game/core/save';
import { awardAchievements } from './game/logic/achievements';
import { eligibleForm } from './game/logic/transform';
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
import { CreditsScene } from './game/scenes/CreditsScene';
import { restoreMutePreference } from './game/systems/hud';
import { isGamePaused, openPauseMenu } from './game/systems/pause';

restoreMutePreference();
// 桌機正置（#817）：boot 一次判定掛 sp-desktop class——旋轉殼旁路（CSS transform 免除
// ＋getShellRotation 恆 none）、虛擬鍵隱藏；Phaser boot 前套用使殼量測即為正置尺寸。
applyDesktopModeClass();
// 方向變更一次性告知（§87）：回訪玩家優先於安裝指引（同為殼層卡片，先到先顯示，
// 另一張等殼層再次安靜）。
initRotationNotice();
// 方向解鎖引導＋桌機鍵位卡（#817）：與其他殼層卡片同走安靜時刻管線依序顯示。
initOrientationGuide();
// PWA 安裝指引（§90）：已安裝／已忽略／不支援平台不打擾；殼內 overlay 不進 Phaser Scene。
initInstallGuide();
// 螢幕常亮（§91）：遊戲進行中取得、離開釋放；不支援或被拒靜默降級。
initWakeLock();
// 開機成就補發單點（§94）：舊存檔（v1 遷移或版本更新新增成就）依既有資料靜默補發
// 歷史成就（無 toast，圖鑑成就頁可見）；有增量才落盤，順帶完成 schema v2 遷移。
const bootSave = loadSave();
if (awardAchievements(bootSave).length > 0) persistSave(bootSave);
// 開機套用直持旋轉偏好（§87）：CSS 預設即新方向（ccw），僅舊方向偏好需掛 class。
applyRotationClass(loadRotationPref());
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
      // 走動抖動歸因（§45）：非跟隨段的幀間位移 0/3.667/7.333px 跳動源於 fixedStep
      // 60Hz 與渲染幀率錯拍（單一渲染幀吞 0/1/2 個物理步）；剛性跟隨段 screen-space
      // 實測恆 0（角色與捲軸同步），玩家可感抖動來自視覺姿態層而非位移層。
      // 實測 fixedStep:false 在低幀率下重力穿地（8 連測 1-2 次沉地 ~80px、彈簧判定帶
      // 失效），故維持預設 fixedStep:true（確定性物理），禁止以 variable step 掩蓋。
    },
  },
  // 非 pixel-art 美術關閉 roundPixels（US-022 / recon C.8）：與 camera 跟隨的次像素
  // 捲動值互斥，開啟會把小數落差量化成 ±1–2px 逐幀跳動。
  pixelArt: false,
  roundPixels: false,
  scene: [BootScene, TitleScene, MapScene, GameScene, ResultScene, CodexScene, CreditsScene],
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
      gotoLevel: (levelId: LevelId, ex?: boolean) => void;
      spawn: (kind: EnemyKind, x?: number, y?: number) => void;
      grantStar: (flavor: StarFlavor) => void;
      shieldRaised: () => boolean;
      transform: () => { form: string | null; remainingMs: number };
      // 變身資格觀測（#848 審查修復）：同系星彈合計 ≥3（強化槽計 2）——槽數
      // 因連吞合成塌縮，slot count 無法代表資格，量測 driver 必須讀此真值。
      transformEligible: () => boolean;
      starburst: () => { phase: string };
      mercyWarp: (ms: number) => void;
      hurtPlayer: (damage: number) => void;
      mercyCount: () => number;
      buff: () => { id: string | null; remainingMs: number };
      bossPos: () => { x: number; y: number };
      bossBodies: () => { x: number; y: number }[];
      bossShots: () => { x: number; y: number }[];
      bossHazards: () => { x: number; y: number; w: number; h: number }[];
      enemyPositions: () => { x: number; y: number }[];
      ammo: () => { ammo: number; flavor: string; mix: string | null };
      walk: () => { rotation: number; bob: number; vy: number };
      crouch: () => number;
      elite: () => { armed: boolean; done: boolean; doorX: number | null };
      slayElite: () => void;
      damageBoss: (amount: number) => void;
      save: () => SaveData;
      probe: () => { x: number; y: number; scrollX: number };
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
      twinHud: () => { active: boolean; aRatio: number; bRatio: number };
      tide: () => { waterY: number; phase: string } | null;
      meteor: () => { falling: number; embers: number; telegraphs: number } | null;
      damageBossAt: (amount: number, x: number, y: number) => void;
      bossState: () => { phase: string; state: string } | null;
      bossHint: () => string;
      grantInvuln: (ms: number) => void;
      achievementToast: () => string;
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
    gotoLevel: (levelId, ex) => gameScene().gotoLevel(levelId, ex),
    spawn: (kind, x = 240, y = 300) => internals().enemies.spawn(kind, x, y),
    // v6 受控賦星與盾態觀測（§40 e2e）：走正式 swallow 管線；
    // 鉤子入口校驗星味（e2e 傳任意字串），非法值拒絕並警示。
    grantStar: (flavor) => {
      if (!(flavor in STAR_FLAVORS)) {
        console.warn(`grantStar 未知星味：${String(flavor)}`);
        return;
      }
      internals().player.grantStar(flavor);
    },
    shieldRaised: () => internals().player.isShieldRaised(),
    // v9 觀測點（§57 e2e）：星化形態與剩餘時間。
    transform: () => internals().player.getTransformState(),
    // 變身資格觀測（#848 審查修復）：走 eligibleForm SSOT，零第二份資格邏輯。
    transformEligible: () => eligibleForm(internals().player.getMagazine()) !== null,
    // v19 觀測點（§109 e2e/探針）：蓄能結晶相位。
    starburst: () => internals().player.getStarburst(),
    // v9 慈悲補血鉤子（§62 e2e）：時間快轉＋RNG 必中、正式受擊管線壓血、生成計數觀測。
    mercyWarp: (ms) => gameScene().mercyWarp(ms),
    hurtPlayer: (damage) => gameScene().hurtPlayer(damage),
    mercyCount: () => gameScene().mercySpawnedCount(),
    // v10 觀測點（§69 e2e）：短期增益狀態。
    buff: () => gameScene().buffState(),
    // 難度實測觀測點（§54 bot 驗收）：魔王本體與彈幕座標供 bot 瞄準/走位/迴避取樣。
    bossPos: () => {
      const body = gameScene().bossBody() as unknown as { x: number; y: number };
      return { x: Math.round(body.x), y: Math.round(body.y) };
    },
    // v10 觀測點（§68 e2e）：多本體座標（雙子迴避取樣）。
    bossBodies: () =>
      gameScene()
        .bossBodyPositions()
        .map((pos) => ({ x: Math.round(pos.x), y: Math.round(pos.y) })),
    bossShots: () => {
      const shots: { x: number; y: number }[] = [];
      for (const child of gameScene().bossProjectiles().getChildren()) {
        if (!child.active) continue;
        const ball = child as unknown as { x: number; y: number };
        shots.push({ x: Math.round(ball.x), y: Math.round(ball.y) });
      }
      return shots;
    },
    // v13 觀測點（§86 bot 迴避取樣）：場上敵人座標（小怪接觸傷/反射彈迴避）。
    enemyPositions: () => {
      const positions: { x: number; y: number }[] = [];
      for (const child of internals().enemies.getGroup().getChildren()) {
        if (!child.active) continue;
        const foe = child as unknown as { x: number; y: number };
        positions.push({ x: Math.round(foe.x), y: Math.round(foe.y) });
      }
      return positions;
    },
    // v13 觀測點（§86 bot 迴避取樣）：shockwave 型危害（晶柱/光束/糖漿波等）。
    bossHazards: () => {
      const hazards: { x: number; y: number; w: number; h: number }[] = [];
      for (const child of gameScene().bossHazardBodies().getChildren()) {
        if (!child.active) continue;
        const wave = child as unknown as {
          x: number;
          y: number;
          displayWidth: number;
          displayHeight: number;
        };
        hazards.push({
          x: Math.round(wave.x),
          y: Math.round(wave.y),
          w: Math.round(wave.displayWidth),
          h: Math.round(wave.displayHeight),
        });
      }
      return hazards;
    },
    ammo: () => internals().player.getAmmoState(),
    // v7 觀測點（§45/§48 e2e）：走動姿態、精英房狀態與受控秒殺。
    walk: () => internals().player.getWalkVisual(),
    // §77 觀測點：蹲姿比例（0..1）。
    crouch: () => internals().player.getCrouch(),
    elite: () => gameScene().eliteState(),
    slayElite: () => gameScene().slayElite(),
    // v8 鉤子（§54 e2e）：以正式傷害管線打魔王，階段/死亡走完整 FSM 事件流。
    damageBoss: (amount) => gameScene().damageBoss(amount),
    // 存檔觀測點（§38）：回傳解析後 sp-save（含容錯回退）。
    save: () => loadSave(),
    // 抖動診斷探針（US-022）：逐幀取玩家世界座標與相機捲動，量測 screen-space 穩定度。
    probe: () => ({
      x: internals().player.sprite.x,
      y: internals().player.sprite.y,
      scrollX: gameScene().cameras.main.scrollX,
    }),
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
    // v11 觀測點（§70 收尾/§71 e2e）：HUD 雙節狀態、潮汐水位/相位（噴口相位走 __spStage）。
    twinHud: () =>
      (gameScene().registry.get('twinHud') as
        | { active: boolean; aRatio: number; bRatio: number }
        | undefined) ?? { active: false, aRatio: 0, bRatio: 0 },
    tide: () => gameScene().tideState(),
    // v12 觀測點（§79 e2e）：流星雨墜落/餘燼/預警圈數量。
    meteor: () => gameScene().meteorState(),
    // v12 鉤子（§83 v11 觀察項收尾）：帶座標精確傷害（皇冠 ×2 可驗）、
    // 魔王 FSM 觀測與受控無敵窗（自然循環觀測案存活用）。
    damageBossAt: (amount, x, y) => gameScene().damageBossAtPoint(amount, x, y),
    bossState: () => gameScene().bossDebugState(),
    // #809 觀測點：前室反制提示浮字（canvas 文字不可由 DOM 查詢）。
    bossHint: () => gameScene().bossHintText(),
    grantInvuln: (ms) => gameScene().grantInvuln(ms),
    // v15 觀測點（§94 e2e）：最近成就 toast 文案（canvas 文字不可由 DOM 查詢）。
    achievementToast: () => gameScene().lastAchievementToast,
    enemies: () => {
      const list: { kind: string; x: number; y: number }[] = [];
      // 場景轉換瞬間（Result/restart）內部系統短暫不可用：防禦回空（審查修復）。
      try {
        for (const child of internals().enemies.getGroup().getChildren()) {
          const kind = internals().enemies.kindOf(child);
          if (!kind) continue;
          const sprite = child as unknown as { x: number; y: number };
          list.push({ kind, x: Math.round(sprite.x), y: Math.round(sprite.y) });
        }
      } catch {
        return list;
      }
      return list;
    },
  };
}
