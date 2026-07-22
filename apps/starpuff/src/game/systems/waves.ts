import type Phaser from 'phaser';
import { ENEMY_SIZE, VIEW } from '../core/config';
import { GameEvents, emitGameEvent, offGameEvent, onGameEvent } from '../core/events';
import { isDesktopMode } from '../core/rotation';
import type { EnemyKind, LevelId } from '../core/types';
import {
  RESCUE_REACH_PX,
  RESCUE_REPOSITION_MS,
  advanceLevelSpawn,
  createLevelRun,
  getLevel,
  isInSafeTail,
  pickRescueKind,
  pickSpawnKind,
  recordKill,
  rescueSpawnX,
  type LevelRunState,
} from '../logic/levels';
import type { EnemySystem } from './enemies';

export interface WaveRunner {
  start(): void;
  update(deltaMs: number): void;
  noteInput(): void;
  isGateOpen(): boolean;
  getQuota(): { killCount: number; killQuota: number };
  forceQuota(): void;
  destroy(): void;
}

// 生成調整 hook（§71 潮汐關）：交叉不變式 13（漲潮排除 magno）與 17（落點上收至
// 乾位可及範圍）由 GameScene 注入；缺省直通零回歸。
export interface WaveSpawnHooks {
  adjustSpawn?(kind: EnemyKind, y: number): { kind: EnemyKind; y: number };
  // 滿潮生成降載（§107，issue #806）：滿潮期暫停一般補生；飢荒救援不受閘。
  holdSpawn?(): boolean;
}

const SPAWN_MARGIN_X = 48;
// 主地面頂（沿 stage.ts 派生式）。bubbla 重力關閉、生成 y 即潛伏錨點（baseY）——
// 必須落於地面線（#821）；沿用重力怪的高空落入值會令個體懸空漂浮約 70px。
const GROUND_TOP = VIEW.height - 80;
export const BUBBLA_SPAWN_Y = GROUND_TOP - ENEMY_SIZE / 2;
// 生成高度按品種（橫式地面頂 y=400）：floaty 定高飄移（240 在跳躍＋拍翅可達範圍內）；
// puffy 高空下飄（§16）；其餘自地面上方落入。
const SPAWN_Y: Record<EnemyKind, number> = {
  jelly: 330,
  floaty: 240,
  spiky: 330,
  puffy: 80,
  chompy: 330,
  shelly: 330,
  zappy: 240,
  drilly: 330,
  glowy: 240,
  spora: 330,
  gusty: 220,
  boomy: 330,
  magno: 330,
  mirri: 330,
  // v11（§73）：bubbla 貼地潛伏（地面派生錨點）、splatta 地面緩走。
  bubbla: BUBBLA_SPAWN_Y,
  splatta: 330,
  // v12（§80）：twinkla 空中星靈、cometa 高處巡游（俯衝起點高於玩家帶）。
  twinkla: 240,
  cometa: 150,
};

// #812 救援懸浮品種的可及帶定高（站立吸入錐直達，免跳拍追擊）。
const RESCUE_HOVER_Y = 300;
const RESCUE_HOVER_KINDS: readonly EnemyKind[] = ['floaty', 'zappy', 'glowy', 'twinkla', 'gusty'];

const TUTORIAL_TEXT_TOUCH = '左搖桿 移動　綠鍵 跳躍\n粉鍵 長按吸入・點按發射';
// 桌機教學浮字（#817）：虛擬鍵已隱藏，改示鍵盤鍵位（與 Title 鍵位卡文案一致）。
const TUTORIAL_TEXT_DESKTOP = '← → 移動　Z 跳躍\nX 點按發射・長按吸入';
// 教學浮字：首次操作輸入後 1s 淡出；無輸入最多停留 6s。
const TUTORIAL_INPUT_LINGER_MS = 1000;
const TUTORIAL_MAX_MS = 6000;

// 關卡 runner：讀 levels.ts 資料驅動生成與配額推進，禁止每關硬編碼分支。
// initialKills（§105 D5）：教學關死亡重試的配額結轉。
export function createWaveRunner(
  scene: Phaser.Scene,
  enemies: EnemySystem,
  levelId: LevelId,
  hooks: WaveSpawnHooks = {},
  initialKills = 0,
): WaveRunner {
  const level = getLevel(levelId);
  let run: LevelRunState = createLevelRun(levelId, initialKills);
  let stopped = false;
  let spawnCounter = 0;
  // 反卡死（§26）：以 AMMO_CHANGED 事件追蹤彈藥量，判定飢荒強制補可吸怪。
  let playerAmmo = 0;
  let tutorialText: Phaser.GameObjects.Text | null = null;
  let tutorialAgeMs = 0;
  let tutorialDismissAtMs = TUTORIAL_MAX_MS;

  const onAmmoChanged = ({ ammo }: { ammo: number }): void => {
    playerAmmo = ammo;
  };

  // #812 救援可及性保證：場上救援個體上限 1、逾時未取得重定位到玩家身旁。
  let rescueSprite: Phaser.Physics.Arcade.Sprite | null = null;
  let rescueAgeMs = 0;

  // 救援生成/重定位單點：玩家前方 RESCUE_AHEAD_MIN_PX–RESCUE_AHEAD_MAX_PX、低威脅品種
  // 優先、走 adjustSpawn 潮汐落點上收（同一可達地形層）；玩家座標不可得時回退視野外側路徑。
  function placeRescue(): void {
    const playerX = enemies.targetX();
    if (playerX === null) {
      spawnAhead(true);
      return;
    }
    if (rescueSprite?.active === true) {
      // 上限 1：已有存活救援個體——重定位它（含 RESCUE_REPOSITION_MS 逾時與再觸發兩路徑）。
      const kind = enemies.kindOf(rescueSprite) ?? 'jelly';
      enemies.removeInhaled(rescueSprite);
      respawnRescue(kind, playerX);
      return;
    }
    respawnRescue(pickRescueKind(level, Math.random(), hooks.holdSpawn?.() === true), playerX);
  }

  function respawnRescue(kind: EnemyKind, playerX: number): void {
    const x = rescueSpawnX(playerX, Math.random(), level);
    // 同層可及保證（#812）：懸浮定高品種降至站立錐可及帶（高空定飄要跳拍追擊，
    // 是救援尾部延遲主因）；地面/墜落/俯衝品種沿 SPAWN_Y 不動（行為錨不漂移）。
    const baseY = RESCUE_HOVER_KINDS.includes(kind) ? RESCUE_HOVER_Y : SPAWN_Y[kind];
    const adjusted = hooks.adjustSpawn?.(kind, baseY) ?? { kind, y: baseY };
    rescueSprite = enemies.spawn(adjusted.kind, x, adjusted.y);
    rescueAgeMs = 0;
  }

  // 魔王擊破後停止補生，避免勝利演出期間持續生怪。
  const onBossDefeated = (): void => {
    stopped = true;
  };

  // 擊殺與吞下皆計入配額：兩者都是玩家消滅敵人的手段。
  const onEnemyRemoved = (): void => {
    if (stopped || run.gateOpen) return;
    run = recordAndAnnounce(run);
  };

  function recordAndAnnounce(state: LevelRunState): LevelRunState {
    const next = recordKill(state);
    emitGameEvent(scene.events, GameEvents.LEVEL_QUOTA, {
      killCount: next.killCount,
      killQuota: level.killQuota,
    });
    if (!state.gateOpen && next.gateOpen) {
      emitGameEvent(scene.events, GameEvents.LEVEL_GATE_OPENED, { levelId: level.id });
    }
    return next;
  }

  // 生成位置：玩家前方視野外側；落在尾端安全區時改由後方入場，兩側皆無合法位即跳過。
  // 單屏魔王關（boss）沿用左右邊緣交替入場。
  function spawnAhead(starving: boolean): void {
    spawnCounter += 1;
    const kind = pickSpawnKind(level, Math.random(), starving);
    let x: number;
    if (level.boss) {
      // boss arena 寬 = 當前視寬（§28）、自前室右緣起算（§69）；右緣入場點隨之計算。
      // 難度根修（§54）：補給自玩家遠側入場——供給定位是彈藥，走向玩家的路程即
      // 拾取節奏，不形成近身第二傷害源。
      const arenaLeft = level.anteroomPx ?? 0;
      const arenaRight = arenaLeft + scene.scale.width;
      const playerX = enemies.targetX();
      if (playerX !== null) {
        x =
          playerX < arenaLeft + scene.scale.width / 2
            ? arenaRight - SPAWN_MARGIN_X
            : arenaLeft + SPAWN_MARGIN_X;
      } else {
        x = spawnCounter % 2 === 0 ? arenaRight - SPAWN_MARGIN_X : arenaLeft + SPAWN_MARGIN_X;
      }
    } else {
      // 生成邊距讀動態視寬（§28）：玩家前方「視野外側」隨邏輯寬 854–1200 變化。
      const scrollX = scene.cameras.main.scrollX;
      x = scrollX + scene.scale.width + SPAWN_MARGIN_X + Math.random() * SPAWN_MARGIN_X;
      if (x > level.worldWidth || isInSafeTail(level, x)) {
        x = scrollX - SPAWN_MARGIN_X - Math.random() * SPAWN_MARGIN_X;
        if (x < SPAWN_MARGIN_X) return;
      }
    }
    // 潮汐關生成調整（§71 交叉不變式 13/17）：漲潮期品種替換與落點上收。
    const adjusted = hooks.adjustSpawn?.(kind, SPAWN_Y[kind]) ?? { kind, y: SPAWN_Y[kind] };
    enemies.spawn(adjusted.kind, x, adjusted.y);
  }

  function showTutorial(text: string, fontSize = '24px'): void {
    // 教學浮字 y=0.46：與 STAGE 公告（hud y=0.34）垂直錯開，進關 1.4s 內不再同屏重疊。
    tutorialText = scene.add
      .text(scene.scale.width / 2, scene.scale.height * 0.46, text, {
        fontFamily: 'system-ui, sans-serif',
        fontSize,
        color: '#3a3a4a',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    scene.tweens.add({
      targets: tutorialText,
      y: '-=12',
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  function dismissTutorial(): void {
    if (!tutorialText) return;
    const text = tutorialText;
    tutorialText = null;
    scene.tweens.killTweensOf(text);
    scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: 400,
      onComplete: () => text.destroy(),
    });
  }

  return {
    start() {
      run = createLevelRun(levelId, initialKills);
      stopped = false;
      tutorialAgeMs = 0;
      tutorialDismissAtMs = TUTORIAL_MAX_MS;
      onGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDefeated);
      onGameEvent(scene.events, GameEvents.ENEMY_KILLED, onEnemyRemoved);
      onGameEvent(scene.events, GameEvents.ENEMY_INHALED, onEnemyRemoved);
      onGameEvent(scene.events, GameEvents.AMMO_CHANGED, onAmmoChanged);
      emitGameEvent(scene.events, GameEvents.LEVEL_CHANGED, {
        levelId: level.id,
        nameZh: level.nameZh,
        killQuota: level.killQuota,
      });
      // 配額結轉即時顯示（§105 D5）：HUD 於 LEVEL_CHANGED 預設 0/N，結轉時補發現值。
      if (run.killCount > 0) {
        emitGameEvent(scene.events, GameEvents.LEVEL_QUOTA, {
          killCount: run.killCount,
          killQuota: level.killQuota,
        });
      }
      if (level.tutorial) {
        showTutorial(isDesktopMode() ? TUTORIAL_TEXT_DESKTOP : TUTORIAL_TEXT_TOUCH);
      }
      // v9 關卡開場提示（§60）：資料驅動一行浮字（L8 星化教學），沿教學淡出機制。
      else if (level.hint) showTutorial(level.hint, '20px');
    },

    update(deltaMs: number) {
      if (stopped) return;
      if (tutorialText) {
        tutorialAgeMs += deltaMs;
        if (tutorialAgeMs >= tutorialDismissAtMs) dismissTutorial();
      }
      // #812 救援個體追蹤：被消化（吞/殺）即釋放追蹤；逾時未取得重定位到玩家身旁。
      if (rescueSprite) {
        if (!rescueSprite.active) {
          rescueSprite = null;
        } else {
          rescueAgeMs += deltaMs;
          if (rescueAgeMs >= RESCUE_REPOSITION_MS) placeRescue();
        }
      }
      // 飢荒判定走可及性口徑（#812）：走動關僅計玩家近域（RESCUE_REACH_PX）可吸個體——
      // 名義可吸但在視野外的個體不得阻斷救援；魔王關 arena 單屏維持全域計數。
      // 救援個體近域豁免（審查收斂）：無 safe 候選關（如 L14 全 ranged mix）的救援怪
      // 會被 ranged 排除——救援存活且近域即視為供給恢復候補，否則生成→不計→4s 再觸發
      // 的重定位循環自我否定；被消化後追蹤釋放、飢荒計時恢復（anti-softlock 不回退）。
      const playerX = enemies.targetX();
      const rescueNear =
        rescueSprite?.active === true &&
        playerX !== null &&
        Math.abs(rescueSprite.x - playerX) <= RESCUE_REACH_PX;
      const starving =
        playerAmmo <= 0 &&
        !rescueNear &&
        (level.boss || playerX === null
          ? enemies.aliveInhalableCount()
          : enemies.aliveInhalableCount(playerX, RESCUE_REACH_PX)) === 0;
      const result = advanceLevelSpawn(run, {
        deltaMs,
        aliveEnemies: enemies.aliveCount(),
        starving,
        floodHold: hooks.holdSpawn?.() === true,
      });
      run = result.state;
      if (!result.spawn) return;
      // 救援走可及性保證路徑（#812）；一般節流與魔王補生沿視野外側/遠側入場。
      if (result.rescue === true) placeRescue();
      else spawnAhead(starving);
    },

    noteInput() {
      if (!tutorialText) return;
      tutorialDismissAtMs = Math.min(tutorialDismissAtMs, tutorialAgeMs + TUTORIAL_INPUT_LINGER_MS);
    },

    isGateOpen() {
      return run.gateOpen;
    },

    // 深度 QA 觀測點（US-025）：當前配額進度。
    getQuota() {
      return { killCount: run.killCount, killQuota: level.killQuota };
    },

    // e2e 除錯鉤子：直接補滿配額觸發開門，仍走正式事件管道。
    forceQuota() {
      while (!level.boss && !run.gateOpen && !stopped) run = recordAndAnnounce(run);
    },

    destroy() {
      offGameEvent(scene.events, GameEvents.BOSS_DEFEATED, onBossDefeated);
      offGameEvent(scene.events, GameEvents.ENEMY_KILLED, onEnemyRemoved);
      offGameEvent(scene.events, GameEvents.ENEMY_INHALED, onEnemyRemoved);
      offGameEvent(scene.events, GameEvents.AMMO_CHANGED, onAmmoChanged);
      if (tutorialText) {
        scene.tweens.killTweensOf(tutorialText);
        tutorialText.destroy();
        tutorialText = null;
      }
    },
  };
}
