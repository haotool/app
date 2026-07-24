import type Phaser from 'phaser';
import { isMuted, setMuted } from '../audio/mute';
import {
  CHARGED_STAR,
  EGG_HP_CAP,
  PLAYER,
  STAR,
  STAR_FLAVORS,
  getMix,
  type MagazineSlot,
} from '../core/config';
import { menuHitCssRect } from '../core/domButton';
import { GameEvents, onGameEvent, offGameEvent, type GameEventName } from '../core/events';
import { readShellSafeArea, toLogicalPx } from '../core/safeArea';
import { TRANSFORM_FORMS, eligibleForm } from '../logic/transform';
import { fillStarPath } from './fx';
import { openPauseMenu } from './pause';

// 殼左右緣净 inset 邏輯偏移（§93）：standalone 直持下瀏海/動態島換軸到殼緣會
// 遮蔽貼緣元素（C/D 修正），HUD 與選單場景錨定時避讓；無瀏海裝置為 0。
export function hudSafeInsets(scene: Phaser.Scene): { left: number; right: number } {
  const inset = readShellSafeArea();
  const canvasCssWidth = scene.game.canvas.clientWidth;
  return {
    left: toLogicalPx(inset.left, scene.scale.width, canvasCssWidth),
    right: toLogicalPx(inset.right, scene.scale.width, canvasCssWidth),
  };
}

function hudInsetRight(scene: Phaser.Scene): number {
  return hudSafeInsets(scene).right;
}

const HEART_TEX = 'hud-heart';
const STAR_TEX = 'hud-star';
const SLOT_RING_TEX = 'hud-slot-ring';
const SPEAKER_ON_TEX = 'hud-spk-on';
const SPEAKER_OFF_TEX = 'hud-spk-off';
const PAUSE_TEX = 'hud-pause';
const HUD_DEPTH = 100;
const MUTE_STORAGE_KEY = 'sp-muted';
// 指標完程（pointerup）後抑制合成 click 的短窗（#823）：click 緊隨 pointerup 同拍
// 派發，350ms 足以涵蓋；鍵盤/AT 的 click 無指標前程不受抑制。
const POINTER_CLICK_SUPPRESS_MS = 350;

export interface Hud {
  destroy(): void;
}

// 喇叭圖形（§21 去文字化）：喇叭錐體 + 聲波弧；靜音態改斜線覆蓋。
function ensureSpeakerTextures(scene: Phaser.Scene): void {
  const drawBody = (g: Phaser.GameObjects.Graphics) => {
    g.fillStyle(0x3a3a4a, 0.85);
    g.fillRect(4, 11, 6, 8);
    g.fillTriangle(10, 15, 17, 7, 17, 23);
  };
  if (!scene.textures.exists(SPEAKER_ON_TEX)) {
    const g = scene.add.graphics();
    drawBody(g);
    g.lineStyle(2.5, 0x3a3a4a, 0.85);
    g.beginPath();
    g.arc(18, 15, 5, -0.9, 0.9);
    g.strokePath();
    g.beginPath();
    g.arc(18, 15, 9, -0.9, 0.9);
    g.strokePath();
    g.generateTexture(SPEAKER_ON_TEX, 30, 30);
    g.destroy();
  }
  if (!scene.textures.exists(SPEAKER_OFF_TEX)) {
    const g = scene.add.graphics();
    drawBody(g);
    g.lineStyle(3, 0xd94b4b, 0.9);
    g.lineBetween(4, 4, 26, 26);
    g.generateTexture(SPEAKER_OFF_TEX, 30, 30);
    g.destroy();
  }
}

// 右上角靜音鈕（修復包 B／§101 F-06）：Title 與 Game 場景共用；狀態經 localStorage
// 跨次保存；右緣錨定隨視寬變更重排（§28）。命中改由同位 DOM 鈕承接（旋轉殼
// hit-test 天然正確、讀屏可及），canvas 僅保留圖示視覺。
export function addMuteButton(scene: Phaser.Scene): void {
  ensureSpeakerTextures(scene);
  const texture = () => (isMuted() ? SPEAKER_OFF_TEX : SPEAKER_ON_TEX);
  const button = scene.add
    .image(scene.scale.width - 26 - hudInsetRight(scene), 26, texture())
    .setDepth(HUD_DEPTH + 20)
    .setScrollFactor(0);
  const anchor = (): void => {
    button.setX(scene.scale.width - 26 - hudInsetRight(scene));
  };
  scene.scale.on('resize', anchor);
  scene.events.once('shutdown', () => scene.scale.off('resize', anchor));
  const domButton = addDomButton(
    scene,
    '靜音切換',
    () => ({ x: scene.scale.width - 26 - hudInsetRight(scene), y: 26, w: 44, h: 44 }),
    () => {
      const next = !isMuted();
      setMuted(next);
      // 隱私模式下 localStorage 可能拋錯：靜音仍生效，僅不跨次保存。
      try {
        localStorage.setItem(MUTE_STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* noop */
      }
      button.setTexture(texture());
      domButton?.setAttribute('aria-pressed', next ? 'true' : 'false');
    },
    'mute',
  );
  domButton?.setAttribute('aria-pressed', isMuted() ? 'true' : 'false');
}

// 遊戲場景暫停鍵（§35／§101 F-06）：與靜音鈕同列（top-right 硬熱區，避開戰鬥區）；
// 圖形雙豎條（禁 emoji/文字鍵帽），命中由同位 DOM 鈕承接，pointerdown 開暫停選單。
export function addPauseButton(scene: Phaser.Scene): void {
  if (!scene.textures.exists(PAUSE_TEX)) {
    const g = scene.add.graphics();
    g.fillStyle(0x3a3a4a, 0.85);
    g.fillRoundedRect(6, 4, 7, 22, 3);
    g.fillRoundedRect(17, 4, 7, 22, 3);
    g.generateTexture(PAUSE_TEX, 30, 30);
    g.destroy();
  }
  const button = scene.add
    .image(scene.scale.width - 74 - hudInsetRight(scene), 26, PAUSE_TEX)
    .setDepth(HUD_DEPTH + 20)
    .setScrollFactor(0);
  const anchor = (): void => {
    button.setX(scene.scale.width - 74 - hudInsetRight(scene));
  };
  scene.scale.on('resize', anchor);
  scene.events.once('shutdown', () => scene.scale.off('resize', anchor));
  addDomButton(
    scene,
    '暫停',
    () => ({ x: scene.scale.width - 74 - hudInsetRight(scene), y: 26, w: 44, h: 44 }),
    () => openPauseMenu(scene.game),
    'pause',
  );
}

// 開機還原上次靜音選擇；由 main.ts 於建立遊戲前呼叫。
export function restoreMutePreference(): void {
  // 隱私模式下 localStorage 可能拋錯：維持預設不靜音。
  try {
    setMuted(localStorage.getItem(MUTE_STORAGE_KEY) === '1');
  } catch {
    /* noop */
  }
}

// 選單場景視寬自適應（§28）：邏輯寬變更時以原資料重啟場景重排（選單輕量無局內狀態）；
// 寬未變的 refresh（旋轉同寬、僅殼位移）不重啟。
export function bindMenuRelayout(scene: Phaser.Scene, restartData?: object): void {
  const createdWidth = scene.scale.width;
  const onResize = (gameSize: { width: number }): void => {
    if (gameSize.width !== createdWidth) scene.scene.restart(restartData);
  };
  scene.scale.on('resize', onResize);
  scene.events.once('shutdown', () => scene.scale.off('resize', onResize));
}

// 場景 DOM 鈕（recon-v4 A.3）：旋轉殼下 canvas 指標會錯位，Title/Result 主按鈕以殼內
// 透明 DOM 鈕作為唯一指標命中路徑（hit-test 隨殼旋轉自然正確；canvas 同熱區不掛
// interactive，杜絕雙命中）。幾何以遊戲邏輯座標換算 canvas CSS px，隨 scale resize 重算；
// 命中短邊 48px 保底（§98 D2：直持縮放會把 44–56 邏輯高壓到 36–45 CSS px）；
// rect 可傳 getter（§101：HUD 鈕邏輯座標依視寬/inset 動態錨定）。
// 觸發路徑（#823）：指標走 pointerdown 即發維持觸控體感（殼層 touchstart
// preventDefault 會吞觸控合成 click，不能只綁 click）；鍵盤/輔助技術 activation
// 無指標前程、只發 click——補 click 監聽並以 pointerup 短窗抑制指標合成 click，
// 兩路徑互斥不雙觸發（WCAG 2.1.1 鍵盤可操作）。
interface LogicalRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function addDomButton(
  scene: Phaser.Scene,
  label: string,
  rect: LogicalRect | (() => LogicalRect),
  onPress: () => void,
  menuId?: string,
): HTMLButtonElement | null {
  const shell = document.getElementById('game-shell');
  if (!shell) return null;
  const rectOf = typeof rect === 'function' ? rect : () => rect;
  const canvas = scene.game.canvas;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'dom-btn';
  button.setAttribute('aria-label', label);
  if (menuId) button.dataset['menu'] = menuId;
  const relayout = (): void => {
    const sx = canvas.clientWidth / scene.scale.width;
    const sy = canvas.clientHeight / scene.scale.height;
    const css = menuHitCssRect(rectOf(), sx, sy);
    button.style.left = `${canvas.offsetLeft + css.left}px`;
    button.style.top = `${canvas.offsetTop + css.top}px`;
    button.style.width = `${css.w}px`;
    button.style.height = `${css.h}px`;
  };
  relayout();
  shell.appendChild(button);
  let suppressClickUntil = 0;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    onPress();
  });
  button.addEventListener('pointerup', () => {
    suppressClickUntil = performance.now() + POINTER_CLICK_SUPPRESS_MS;
  });
  button.addEventListener('click', () => {
    if (performance.now() < suppressClickUntil) return;
    onPress();
  });
  scene.scale.on('resize', relayout);
  scene.events.once('shutdown', () => {
    scene.scale.off('resize', relayout);
    button.remove();
  });
  return button;
}

function ensureHudTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(HEART_TEX)) {
    const g = scene.add.graphics();
    g.fillStyle(0xff6b8a, 1);
    g.fillCircle(7, 8, 6.5);
    g.fillCircle(17, 8, 6.5);
    g.fillTriangle(1.5, 11, 22.5, 11, 12, 22);
    g.generateTexture(HEART_TEX, 24, 24);
    g.destroy();
  }
  if (!scene.textures.exists(STAR_TEX)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffd966, 1);
    fillStarPath(g, 10, 10, 10, 4.2);
    g.generateTexture(STAR_TEX, 20, 20);
    g.destroy();
  }
  // 槽位外圈（§23/§46）：白底描邊供 tint 上色——charged/gold 金邊、混合槽第二味色。
  if (!scene.textures.exists(SLOT_RING_TEX)) {
    const g = scene.add.graphics();
    g.lineStyle(2.5, 0xffffff, 1);
    g.strokeCircle(14, 14, 12);
    g.generateTexture(SLOT_RING_TEX, 28, 28);
    g.destroy();
  }
}

export function createHud(scene: Phaser.Scene): Hud {
  ensureHudTextures(scene);
  addMuteButton(scene);
  addPauseButton(scene);

  const bus = scene.events;
  const unbinders: (() => void)[] = [];
  let destroyed = false;
  let waveText: Phaser.GameObjects.Text | null = null;

  const root = scene.add.container(0, 0).setDepth(HUD_DEPTH).setScrollFactor(0);

  // 心心至彩蛋上限 6（§24）：第 6 顆僅在超額治療時顯示。
  const hearts: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < EGG_HP_CAP; i++) {
    hearts.push(scene.add.image(24 + i * 30, 26, HEART_TEX).setVisible(i < PLAYER.maxHp));
  }
  root.add(hearts);

  const ammoStars: Phaser.GameObjects.Image[] = [];
  const slotRings: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < STAR.maxAmmo; i++) {
    ammoStars.push(scene.add.image(22 + i * 26, 58, STAR_TEX).setAlpha(0.25));
    slotRings.push(scene.add.image(22 + i * 26, 58, SLOT_RING_TEX).setVisible(false));
  }
  root.add(ammoStars);
  root.add(slotRings);

  // 頂列橫排（§21）：HP 左上、STAGE 中上、配額（星形+數字）右上、Boss 條頂中。
  const labelStyle = {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '18px',
    fontStyle: 'bold',
    color: '#3a3a4a',
    stroke: '#ffffff',
    strokeThickness: 4,
  };
  const stageText = scene.add.text(0, 26, '', labelStyle).setOrigin(0.5);
  const quotaIcon = scene.add.image(0, 26, STAR_TEX).setVisible(false);
  const quotaText = scene.add.text(0, 26, '', labelStyle).setOrigin(1, 0.5);
  root.add([stageText, quotaIcon, quotaText]);

  // Boss HP 條：__WHITE 內建紋理拉伸上色，fill 以 scaleX tween 平滑更新。
  const barWidth = 320;
  const barHeight = 12;
  const bossBar = scene.add.container(0, 52).setAlpha(0);
  const barBg = scene.add
    .image(0, 0, '__WHITE')
    .setDisplaySize(barWidth + 4, barHeight + 4)
    .setTint(0x3a3a4a)
    .setAlpha(0.45);
  const barFill = scene.add
    .image(-barWidth / 2, 0, '__WHITE')
    .setOrigin(0, 0.5)
    .setDisplaySize(barWidth, barHeight)
    .setTint(0x9b7bd8);
  const fullScaleX = barFill.scaleX;
  // 雙節顯示（§68 雙子獨立血條）：同一 bossBar 內雙填充＋中央分隔 tick，零新面板；
  // BOSS_TWIN_HP active=false 回落單節。
  const twinFillA = scene.add
    .image(-barWidth / 2, 0, '__WHITE')
    .setOrigin(0, 0.5)
    .setDisplaySize(barWidth / 2 - 2, barHeight)
    .setTint(0xffb8d8)
    .setVisible(false);
  const twinFillB = scene.add
    .image(2, 0, '__WHITE')
    .setOrigin(0, 0.5)
    .setDisplaySize(barWidth / 2 - 2, barHeight)
    .setTint(0x9ecbff)
    .setVisible(false);
  const twinHalfScaleX = twinFillA.scaleX;
  const twinDivider = scene.add
    .image(0, 0, '__WHITE')
    .setDisplaySize(3, barHeight + 6)
    .setTint(0xffffff)
    .setAlpha(0.9)
    .setVisible(false);
  bossBar.add([barBg, barFill, twinFillA, twinFillB, twinDivider]);
  root.add(bossBar);

  // 頂列錨定重排（§28）：中上/右上元素依當前視寬定位；resize 事件觸發重錨。
  // 右上鍵位序（§35）：靜音 width-26、暫停 width-74，配額左移讓位（48px 間距不疊熱區）；
  // 右緣整列依殼右 inset 左移（§93 C 修正），與暫停/靜音鍵同步避讓瀏海。
  function relayout(): void {
    const width = scene.scale.width;
    const insetRight = hudInsetRight(scene);
    stageText.setX(width / 2);
    bossBar.setX(width / 2);
    quotaIcon.setX(width - 112 - insetRight);
    quotaText.setX(width - 126 - insetRight);
    waveText?.setX(width / 2);
  }
  relayout();
  scene.scale.on('resize', relayout);
  unbinders.push(() => scene.scale.off('resize', relayout));

  function updateHearts(hp: number): void {
    hearts.forEach((heart, i) => {
      heart.setVisible(i < PLAYER.maxHp || i < hp);
      heart.setAlpha(i < hp ? 1 : 0.25);
    });
    scene.tweens.add({
      targets: hearts,
      scale: 1.3,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
      delay: scene.tweens.stagger(30),
    });
  }

  // 就緒脈動（§57/§109）：同系 ≥3 可變身時彈藥列脈動＋外圈套形態色（SP 鍵可變身）；
  // 蓄能星存在時再滿匣（不疊加）改套金色脈動提示。
  let readyTween: Phaser.Tweens.Tween | null = null;
  function updateReadyPulse(magazine: readonly MagazineSlot[]): boolean {
    const form = eligibleForm(magazine);
    const fullWithCharge = magazine.length >= STAR.maxAmmo;
    if (form || fullWithCharge) {
      const tint = form ? TRANSFORM_FORMS[form].tint : CHARGED_STAR.tint;
      slotRings.forEach((ring) => ring.setVisible(true).setTint(tint));
      readyTween ??= scene.tweens.add({
        targets: [...ammoStars, ...slotRings],
        scale: 1.22,
        duration: 340,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      return true;
    }
    if (readyTween) {
      readyTween.destroy();
      readyTween = null;
      [...ammoStars, ...slotRings].forEach((image) => image.setScale(1));
    }
    return false;
  }

  // 槽位彈匣（§23/§46）：每槽依屬性上色、charged/gold 金邊；混合槽星芯配方色、
  // 外圈第二味色（雙色可讀）；標準星白 tint 保留原色。
  function updateAmmo(magazine: readonly MagazineSlot[]): void {
    ammoStars.forEach((star, i) => {
      const slot = magazine[i];
      const wasFilled = star.alpha === 1;
      if (slot) {
        const mix = slot.mix !== undefined ? getMix(slot.mix) : null;
        star.setTint(
          mix
            ? mix.tint
            : slot.gold
              ? CHARGED_STAR.tint
              : slot.flavor === 'jelly'
                ? 0xffffff
                : STAR_FLAVORS[slot.flavor].tint,
        );
        star.setAlpha(1);
        if (!wasFilled) {
          scene.tweens.add({
            targets: star,
            scale: { from: 0.4, to: 1 },
            duration: 220,
            ease: 'Back.easeOut',
          });
        }
        const ring = slotRings[i];
        if (ring) {
          if (mix) {
            // 第二味外圈：配對中非首味成分的屬性色。
            const second = mix.pair[0] === slot.flavor ? mix.pair[1] : mix.pair[0];
            ring.setVisible(true).setTint(STAR_FLAVORS[second].tint);
          } else if (slot.charged || slot.gold) {
            ring.setVisible(true).setTint(CHARGED_STAR.tint);
          } else {
            ring.setVisible(false);
          }
        }
      } else {
        star.setTint(0xffffff);
        star.setAlpha(0.25);
        slotRings[i]?.setVisible(false);
      }
    });
  }

  function showAnnounce(message: string): void {
    waveText?.destroy();
    waveText = scene.add
      .text(scene.scale.width / 2, scene.scale.height * 0.34, message, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3a3a4a',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH + 10)
      .setScrollFactor(0)
      .setAlpha(0);
    scene.tweens.chain({
      targets: waveText,
      tweens: [
        { alpha: 1, duration: 200, ease: 'Quad.easeOut' },
        { alpha: 0, y: '-=20', duration: 300, delay: 900, ease: 'Quad.easeIn' },
      ],
      onComplete: () => {
        waveText?.destroy();
        waveText = null;
      },
    });
  }

  function bind<K extends GameEventName>(
    event: K,
    handler: Parameters<typeof onGameEvent<K>>[2],
  ): void {
    onGameEvent(bus, event, handler);
    unbinders.push(() => offGameEvent(bus, event, handler));
  }

  bind(GameEvents.PLAYER_DAMAGED, ({ hp }) => updateHearts(hp));
  bind(GameEvents.PLAYER_HEALED, ({ hp }) => updateHearts(hp));
  bind(GameEvents.AMMO_CHANGED, ({ magazine }) => {
    updateAmmo(magazine);
    updateReadyPulse(magazine);
  });
  bind(GameEvents.BOSS_SPAWNED, () => {
    barFill.scaleX = fullScaleX;
    scene.tweens.add({
      targets: bossBar,
      alpha: 1,
      y: { from: 38, to: 52 },
      duration: 300,
      ease: 'Quad.easeOut',
    });
  });
  bind(GameEvents.BOSS_DAMAGED, ({ hp, maxHp }) => {
    scene.tweens.add({
      targets: barFill,
      scaleX: fullScaleX * Math.max(0, hp / maxHp),
      duration: 180,
      ease: 'Cubic.easeOut',
    });
  });
  bind(GameEvents.BOSS_PHASE, ({ phase, barTint }) => {
    if (phase === 'p2') barFill.setTint(0xd94b4b);
    // P4 專屬型態換色（§114/§8.2 EX 限定）：預設金緋（Prismix 裂核殘響）；
    // barTint 覆寫供各王差分（Syrona 暴走深紅、Voidra 內核裸奔亮紫）。
    if (phase === 'p4') barFill.setTint(barTint ?? 0xe8b45a);
  });
  // 雙節切換（§68）：分裂期各半條依雙子血量獨立縮放；合體/擊破回落單節。
  // 觀測點（v10 審查殘餘收尾）：最新雙節狀態寫入 registry 供 __sp.twinHud 直接觀測。
  bind(GameEvents.BOSS_TWIN_HP, ({ hpA, hpB, maxHp, active }) => {
    barFill.setVisible(!active);
    twinFillA.setVisible(active);
    twinFillB.setVisible(active);
    twinDivider.setVisible(active);
    const half = maxHp / 2;
    const aRatio = Math.max(0, Math.min(1, hpA / half));
    const bRatio = Math.max(0, Math.min(1, hpB / half));
    scene.registry.set('twinHud', { active, aRatio, bRatio });
    if (!active) return;
    twinFillA.scaleX = twinHalfScaleX * aRatio;
    twinFillB.scaleX = twinHalfScaleX * bRatio;
  });
  bind(GameEvents.BOSS_DEFEATED, () => {
    scene.tweens.add({ targets: bossBar, alpha: 0, duration: 400 });
  });

  bind(GameEvents.LEVEL_CHANGED, ({ levelId, nameZh, killQuota }) => {
    const isBoss = killQuota <= 0;
    stageText.setText(`STAGE ${levelId} ${nameZh}`);
    quotaIcon.setVisible(!isBoss);
    quotaText.setText(isBoss ? '' : `0/${killQuota}`);
    showAnnounce(isBoss ? '魔王來襲！' : `STAGE ${levelId} ${nameZh}`);
  });
  bind(GameEvents.LEVEL_QUOTA, ({ killCount, killQuota }) => {
    if (killQuota <= 0) return;
    quotaText.setText(`${Math.min(killCount, killQuota)}/${killQuota}`);
  });
  bind(GameEvents.LEVEL_GATE_OPENED, () => {
    quotaText.setText('星星門開啟！往右前進');
  });

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    unbinders.forEach((off) => off());
    unbinders.length = 0;
    waveText?.destroy();
    waveText = null;
    root.destroy(true);
  }

  scene.events.once('shutdown', destroy);

  return { destroy };
}
