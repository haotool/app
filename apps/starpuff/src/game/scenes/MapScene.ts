import Phaser from 'phaser';
import { startBgm } from '../audio/bgm';
import { playSfx, unlockAudio } from '../audio/sfx';
import {
  currentChallenge,
  isLevelUnlocked,
  loadSave,
  nodeStatus,
  resetSave,
  eggsFoundCount,
  type SaveData,
} from '../core/save';
import { SceneKeys, type LevelId } from '../core/types';
import { LEVELS, exConquestDone, type LevelSpec } from '../logic/levels';
import { ZONES, levelsInZone, zoneOf, type ZoneSpec } from '../logic/zones';
import { createMenuBackdrop, type BackgroundHandle } from '../systems/background';
import { addDomButton, addMuteButton, bindMenuRelayout } from '../systems/hud';

const TEXT_DARK = '#3a3a4a';
const ACCENT = '#7a5fb8';
// v12 分區分頁（§78）：每頁 ≤5 節點，半徑回復 24（v11 單頁 20 節點極限已解除）。
const NODE_RADIUS = 24;
// 頁內鋸齒高度：走動關 300/262 交錯、魔王節點固定最高階 224（EX 徽鈕淨空恆成立）。
const NODE_Y_LOW = 300;
const NODE_Y_MID = 262;
const NODE_Y_BOSS = 224;
// 節點主題色鏡像關卡 bg 主色調（data-driven 自 LEVELS bgKey）。
const NODE_TINTS: Record<string, number> = {
  'bg-meadow': 0xbff3e0,
  'bg-heights': 0xa8d8f0,
  'bg-arena': 0xcbb7f0,
  'bg-throne': 0x9b7bd8,
  'bg-canyon': 0xf5c9a8,
  'bg-gallery': 0xb8a8e8,
  'bg-eclipse': 0x8478c8,
  'bg-cavern': 0x8a98c8,
  'bg-mirror': 0xd8dce8,
  'bg-lumen': 0x9fe8d8,
  'bg-magnetic': 0xa89ae0,
  'bg-prism': 0xc5a8e8,
  // v11 四區焙糖火山（§72/§74）。
  'bg-kiln': 0xf2b26b,
  'bg-valley': 0xe89040,
  'bg-kilnway': 0xd07830,
  'bg-kilnhall': 0xc86828,
  // v12 五區星核聖域（§81）。
  'bg-astral': 0xc8b8f0,
  'bg-meteorfield': 0xa898e8,
  'bg-starcourt': 0x8878d0,
  'bg-voidcore': 0x685aa8,
};
// 揭霧動畫（§39）：短暫停拍後霧散 + 節點彈出 + zzfx sting。
const REVEAL_DELAY_MS = 450;
const REVEAL_FADE_MS = 550;
// 重置進度兩步確認（§38）：武裝態 3 秒未確認自動解除。
const RESET_ARM_MS = 3000;

interface MapSceneData {
  reveal?: LevelId | null;
  // 分頁狀態（§78）：頁籤切換以 restart 帶入；缺省由進度推導。
  page?: number;
}

// 迷霧世界地圖（GAME_DESIGN §39/§78）：分區分頁——每區一頁、頁籤直達已解鎖區；
// 節點 data-driven 自 LEVELS 區間過濾；未解鎖蓋迷霧＋問號、已通關顯示星星與最佳
// 用時、當前可挑戰節點脈動；點擊已解鎖節點直接進入該關。禁自由漫遊大地圖（KISS）。
export class MapScene extends Phaser.Scene {
  private backdrop: BackgroundHandle | null = null;
  private reveal: LevelId | null = null;
  private pageOverride: number | null = null;
  private resetArmed = false;
  // 武裝時刻採牆鐘（Date.now）：高負載下場景時鐘落後牆鐘，確認窗以真實時間計才安全。
  private resetArmedAt = 0;
  private resetTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super(SceneKeys.Map);
  }

  init(data: MapSceneData): void {
    this.reveal = data.reveal ?? null;
    this.pageOverride = data.page ?? null;
    this.resetArmed = false;
    this.resetArmedAt = 0;
    this.resetTimer = null;
  }

  create(): void {
    const { width } = this.scale;
    const save = loadSave();
    const pages = ZONES.filter((zone) => levelsInZone(zone, LEVELS).length > 0);
    const activeZone = this.resolveZone(save, pages);
    this.backdrop = createMenuBackdrop(this, {
      bgKey: 'bg-heights',
      autoScrollPxPerSec: 10,
      clouds: true,
    });
    this.events.once('shutdown', () => this.backdrop?.destroy());
    addMuteButton(this);
    // 視寬變更重排：保留當前分頁，不重播揭霧動畫。
    bindMenuRelayout(this, { page: activeZone.id });

    this.add
      .text(width / 2, 34, '世界地圖', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: ACCENT,
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.renderZoneTabs(save, pages, activeZone);
    this.renderZoneHeader(save, activeZone);
    this.addBackButton();
    this.addResetButton(save);
    this.renderNodes(save, activeZone);

    // EX 解鎖提示（§60/§86）：L9 通關後提示魔王節點第二入口，直至五王星核制霸達成。
    const exPending = save.levels[9]?.cleared === true && !exConquestDone(save);
    if (exPending) {
      const hint = this.add
        .text(width / 2, 136, 'EX 挑戰已解鎖：點魔王節點上方的 EX 入口', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#d84b6a',
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: hint,
        alpha: 0.55,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // 鍵盤備援：ENTER 直接進當前可挑戰關（列車過渡期關卡未在編則略過）。
    const challenge = currentChallenge(save);
    if (challenge !== null && LEVELS.some((level) => level.id === challenge)) {
      this.input.keyboard?.once('keydown-ENTER', () => this.enterLevel(challenge));
    }
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start(SceneKeys.Title));
  }

  // 當前分頁（§78）：優先 restart 帶入的頁籤選擇；其次揭霧節點所屬區；
  // 缺省為當前可挑戰關所屬區（全通關回末頁）。
  private resolveZone(save: SaveData, pages: readonly ZoneSpec[]): ZoneSpec {
    const targetId =
      this.pageOverride ??
      (this.reveal !== null
        ? zoneOf(this.reveal).id
        : zoneOf(currentChallenge(save) ?? Math.max(save.highestClearedLevel, 1)).id);
    const matched = pages.find((zone) => zone.id === targetId) ?? pages[pages.length - 1];
    if (!matched) throw new Error('分區分頁資料為空');
    return matched;
  }

  // 區解鎖（§78 分頁即區域錨點）：區首關解鎖＝前區魔王已擊破。
  private isZoneUnlocked(save: SaveData, zone: ZoneSpec): boolean {
    return isLevelUnlocked(save, zone.firstLevelId as LevelId);
  }

  // 頁籤列（§78）：已解鎖區可直達（等效快速旅行）；未解鎖區灰顯無入口。
  private renderZoneTabs(save: SaveData, pages: readonly ZoneSpec[], activeZone: ZoneSpec): void {
    const { width } = this.scale;
    const tabW = Math.min(150, (width - 60) / pages.length);
    const left = width / 2 - (tabW * pages.length) / 2;
    pages.forEach((zone, index) => {
      const x = left + tabW * (index + 0.5);
      const unlocked = this.isZoneUnlocked(save, zone);
      const active = zone.id === activeZone.id;
      const label = this.add
        .text(x, 78, zone.nameZh, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: active ? TEXT_DARK : '#ffffff',
          backgroundColor: active ? '#ffffff' : unlocked ? ACCENT : '#9a9aa8',
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5)
        .setAlpha(unlocked ? 1 : 0.55);
      if (!unlocked || active) return;
      addDomButton(
        this,
        `前往第 ${zone.id} 區 ${zone.nameZh}`,
        { x, y: label.y, w: tabW - 6, h: 46 },
        () => {
          playSfx('pop');
          this.scene.restart({ page: zone.id });
        },
        `zone-${zone.id}`,
      );
    });
  }

  // 頁標頭（§78 引用 P-11 分項透明化）：該區彩蛋 found/total。
  // 區序前綴（§97 F-01）：區名與關名近義並列（果凍平原 vs 果凍草原）易讀成漂移，
  // 標頭明示「第 N 區」建立區≠關的層級語意。
  private renderZoneHeader(save: SaveData, zone: ZoneSpec): void {
    const inZone = levelsInZone(zone, LEVELS);
    const total = inZone.reduce((sum, level) => sum + level.easterEggs.length, 0);
    const found = inZone.reduce((sum, level) => sum + eggsFoundCount(save, level.id), 0);
    this.add
      .text(this.scale.width / 2, 112, `第 ${zone.id} 區 ${zone.nameZh}・彩蛋 ${found}/${total}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: TEXT_DARK,
        strokeThickness: 4,
      })
      .setOrigin(0.5);
  }

  // 頁內節點座標：橫向等距由頁內節點數推導（禁硬編視寬）；魔王節點固定最高階。
  private nodePosition(index: number, count: number, isBoss: boolean): { x: number; y: number } {
    const { width } = this.scale;
    const ratio = count <= 1 ? 0.5 : 0.14 + (0.72 * index) / (count - 1);
    const y = isBoss ? NODE_Y_BOSS : index % 2 === 0 ? NODE_Y_LOW : NODE_Y_MID;
    return { x: width * ratio, y };
  }

  // 節點間虛線路徑：等距圓點沿線段鋪設；未解鎖段降透明度。
  private drawPath(save: SaveData, inZone: readonly LevelSpec[]): void {
    const dots = this.add.graphics().setDepth(1);
    for (let i = 0; i < inZone.length - 1; i += 1) {
      const prev = inZone[i];
      const next = inZone[i + 1];
      if (!prev || !next) continue;
      const from = this.nodePosition(i, inZone.length, prev.boss !== null);
      const to = this.nodePosition(i + 1, inZone.length, next.boss !== null);
      const lit = nodeStatus(save, next.id) !== 'locked';
      dots.fillStyle(0xffffff, lit ? 0.75 : 0.28);
      const dist = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
      const steps = Math.floor(dist / 20);
      for (let s = 1; s < steps; s += 1) {
        const t = s / steps;
        dots.fillCircle(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, 3);
      }
    }
  }

  private renderNodes(save: SaveData, zone: ZoneSpec): void {
    const inZone = levelsInZone(zone, LEVELS);
    this.drawPath(save, inZone);
    inZone.forEach((level, index) => {
      const { x, y } = this.nodePosition(index, inZone.length, level.boss !== null);
      const status = nodeStatus(save, level.id);
      const revealing = this.reveal === level.id && status !== 'locked';
      const tint = NODE_TINTS[level.bgKey] ?? 0xffffff;

      const node = this.add.container(x, y).setDepth(5);
      const circle = this.add
        .circle(0, 0, level.boss ? NODE_RADIUS + 4 : NODE_RADIUS, tint, 1)
        .setStrokeStyle(4, status === 'locked' ? 0x9a9aa8 : 0xffffff, 0.95);
      const numeral = this.add
        .text(0, 0, `${level.id}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: level.id >= 10 ? '19px' : '22px',
          fontStyle: 'bold',
          color: TEXT_DARK,
        })
        .setOrigin(0.5);
      node.add([circle, numeral]);

      const name = this.add
        .text(x, y + NODE_RADIUS + 20, level.nameZh, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: TEXT_DARK,
          strokeThickness: 4,
        })
        .setOrigin(0.5);

      if (status === 'cleared') {
        // 已通關：金星徽記 + 最佳用時。
        const star = this.add
          .image(x + NODE_RADIUS - 6, y - NODE_RADIUS + 6, 'fx-star')
          .setDisplaySize(30, 30)
          .setDepth(6);
        this.tweens.add({
          targets: star,
          angle: 8,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        const best = save.levels[level.id]?.bestTimeMs ?? 0;
        this.add
          .text(x, y + NODE_RADIUS + 42, `最佳 ${(best / 1000).toFixed(1)}s`, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            color: '#ffffff',
            stroke: TEXT_DARK,
            strokeThickness: 3,
          })
          .setOrigin(0.5);
        // EX 挑戰（§58）：已通關魔王節點的第二入口；EX 通關掛紀念星章（紫星）。
        if (level.boss) this.addExEntrance(level.id, level.nameZh, x, y, save);
      }

      if (status === 'open' && !revealing) this.pulseNode(node);

      if (status === 'locked' || revealing) {
        // 迷霧遮罩＋問號：雲團圓組合；揭霧時霧散、節點彈出。
        const fog = this.add.container(x, y).setDepth(7);
        const cloudColor = 0xdcd8ea;
        fog.add([
          this.add.circle(-16, -4, 22, cloudColor, 0.96),
          this.add.circle(14, -8, 19, cloudColor, 0.96),
          this.add.circle(0, 8, 24, cloudColor, 0.96),
          this.add.circle(-2, -14, 17, cloudColor, 0.96),
          this.add
            .text(0, -2, '?', {
              fontFamily: 'system-ui, sans-serif',
              fontSize: '30px',
              fontStyle: 'bold',
              color: '#6e6e80',
            })
            .setOrigin(0.5),
        ]);
        if (revealing) {
          node.setScale(0.6).setAlpha(0.4);
          this.time.delayedCall(REVEAL_DELAY_MS, () => {
            playSfx('reveal');
            this.tweens.add({
              targets: fog,
              alpha: 0,
              scale: 1.7,
              duration: REVEAL_FADE_MS,
              ease: 'Quad.easeOut',
              onComplete: () => fog.destroy(),
            });
            this.tweens.add({
              targets: node,
              scale: 1,
              alpha: 1,
              duration: REVEAL_FADE_MS,
              ease: 'Back.easeOut',
              onComplete: () => {
                this.pulseNode(node);
                // 揭霧競態防護（§39）：入口鈕延至揭霧演出完成才掛，杜絕霧下誤觸。
                this.addNodeButton(level.id, level.nameZh, x, y);
              },
            });
          });
        } else {
          name.setAlpha(0.55);
        }
      }

      // 已解鎖節點（open/cleared）以 DOM 鈕承接命中（旋轉殼 hit-test 正確）；
      // 揭霧中的節點由揭霧 onComplete 延遲掛鈕。
      if (status !== 'locked' && !revealing) {
        this.addNodeButton(level.id, level.nameZh, x, y);
      }
    });
  }

  private addNodeButton(levelId: LevelId, nameZh: string, x: number, y: number): void {
    // 關序從屬標示（§97 F-01）：aria 與視覺同義——節點＝關卡、頁籤/標頭＝區域。
    addDomButton(
      this,
      `進入第 ${levelId} 關 ${nameZh}`,
      { x, y, w: NODE_RADIUS * 2 + 20, h: NODE_RADIUS * 2 + 20 },
      () => this.enterLevel(levelId),
      `node-${levelId}`,
    );
  }

  // EX 挑戰第二入口（§58）：節點上方小徽鈕；EX 已通關改掛紫星紀念章＋可重玩。
  private addExEntrance(
    levelId: LevelId,
    nameZh: string,
    x: number,
    y: number,
    save: SaveData,
  ): void {
    const exY = y - NODE_RADIUS - 26;
    const exCleared = save.levels[levelId]?.exCleared === true;
    const badge = this.add
      .text(x, exY, 'EX 挑戰', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: exCleared ? '#7a5fb8' : '#d84b6a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.tweens.add({
      targets: badge,
      scale: 1.08,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    if (exCleared) {
      const star = this.add
        .image(x - NODE_RADIUS + 4, y - NODE_RADIUS + 6, 'fx-star')
        .setDisplaySize(26, 26)
        .setTint(0x9b7bd8)
        .setDepth(6);
      this.tweens.add({
        targets: star,
        angle: -8,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    addDomButton(
      this,
      `EX 挑戰 ${nameZh}`,
      { x, y: exY, w: 108, h: 44 },
      () => this.enterLevel(levelId, true),
      `node-${levelId}-ex`,
    );
  }

  // 當前可挑戰節點脈動（§39）。
  private pulseNode(node: Phaser.GameObjects.Container): void {
    this.tweens.add({
      targets: node,
      scale: 1.12,
      duration: 640,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private enterLevel(levelId: LevelId, ex = false): void {
    unlockAudio();
    // 地圖進關同步啟動 BGM（審查修復 #724）：startBgm 冪等，重複呼叫不疊音軌。
    startBgm();
    playSfx('pop');
    this.scene.start(SceneKeys.Game, { levelId, deaths: 0, ex });
  }

  private addBackButton(): void {
    const visual = this.add
      .text(56, 34, '返回', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: TEXT_DARK,
        backgroundColor: '#ffffff',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5)
      .setAlpha(0.92);
    addDomButton(
      this,
      '返回主選單',
      { x: visual.x, y: visual.y, w: 132, h: 56 },
      () => {
        playSfx('pop');
        this.scene.start(SceneKeys.Title);
      },
      'back',
    );
  }

  // 重置進度（§38）：兩步確認，僅清 sp-save；3 秒未確認自動退回。
  private addResetButton(save: SaveData): void {
    // 全新存檔無可重置內容，不顯示入口。
    if (Object.keys(save.levels).length === 0) return;
    const { height } = this.scale;
    const visual = this.add
      .text(84, height - 32, '重置進度', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: TEXT_DARK,
        backgroundColor: '#ffffff',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setAlpha(0.85);
    addDomButton(
      this,
      '重置進度',
      { x: visual.x, y: visual.y, w: 150, h: 52 },
      () => {
        // 武裝逾時以牆鐘判定（場景時鐘可能落後）：逾時視同未武裝，重新進入武裝態。
        const expired = Date.now() - this.resetArmedAt > RESET_ARM_MS;
        if (!this.resetArmed || expired) {
          this.resetArmed = true;
          this.resetArmedAt = Date.now();
          playSfx('pop');
          visual.setText('確定重置？').setBackgroundColor('#ffb0b0');
          // 文案自動還原為視覺提示；武裝有效性由上方牆鐘判定把關。
          this.resetTimer?.remove();
          this.resetTimer = this.time.delayedCall(RESET_ARM_MS, () => {
            this.resetArmed = false;
            visual.setText('重置進度').setBackgroundColor('#ffffff');
          });
          return;
        }
        this.resetTimer?.remove();
        resetSave();
        playSfx('break');
        this.scene.restart({});
      },
      'reset',
    );
  }

  override update(_time: number, deltaMs: number): void {
    this.backdrop?.update(deltaMs);
  }
}
