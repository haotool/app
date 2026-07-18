import Phaser from 'phaser';
import { startBgm } from '../audio/bgm';
import { playSfx, unlockAudio } from '../audio/sfx';
import {
  currentChallenge,
  loadSave,
  nodeStatus,
  resetSave,
  eggsFoundCount,
  type SaveData,
} from '../core/save';
import { SceneKeys, type LevelId } from '../core/types';
import { LEVELS } from '../logic/levels';
import { createMenuBackdrop, type BackgroundHandle } from '../systems/background';
import { addDomButton, addMuteButton, bindMenuRelayout } from '../systems/hud';

const TEXT_DARK = '#3a3a4a';
const ACCENT = '#7a5fb8';
const NODE_RADIUS = 30;
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
};
// 揭霧動畫（§39）：短暫停拍後霧散 + 節點彈出 + zzfx sting。
const REVEAL_DELAY_MS = 450;
const REVEAL_FADE_MS = 550;
// 重置進度兩步確認（§38）：武裝態 3 秒未確認自動解除。
const RESET_ARM_MS = 3000;

interface MapSceneData {
  reveal?: LevelId | null;
}

// 迷霧世界地圖（GAME_DESIGN §39）：橫向節點路徑 data-driven 自 LEVELS；
// 未解鎖蓋迷霧＋問號、已通關顯示星星與最佳用時、當前可挑戰節點脈動；
// 點擊已解鎖節點直接進入該關（關卡選擇＝重玩入口）。禁自由漫遊大地圖（KISS）。
export class MapScene extends Phaser.Scene {
  private backdrop: BackgroundHandle | null = null;
  private reveal: LevelId | null = null;
  private resetArmed = false;
  // 武裝時刻採牆鐘（Date.now）：高負載下場景時鐘落後牆鐘，確認窗以真實時間計才安全。
  private resetArmedAt = 0;
  private resetTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super(SceneKeys.Map);
  }

  init(data: MapSceneData): void {
    this.reveal = data.reveal ?? null;
    this.resetArmed = false;
    this.resetArmedAt = 0;
    this.resetTimer = null;
  }

  create(): void {
    const { width } = this.scale;
    const save = loadSave();
    this.backdrop = createMenuBackdrop(this, {
      bgKey: 'bg-heights',
      autoScrollPxPerSec: 10,
      clouds: true,
    });
    this.events.once('shutdown', () => this.backdrop?.destroy());
    addMuteButton(this);
    // 視寬變更重排：重啟時不重播揭霧動畫。
    bindMenuRelayout(this, {});

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

    // 彩蛋計數（§39）：found/total，total 由關卡資料推導。
    const secretTotal = LEVELS.reduce((sum, level) => sum + level.easterEggs.length, 0);
    const secretFound = LEVELS.reduce((sum, level) => sum + eggsFoundCount(save, level.id), 0);
    this.add
      .text(width / 2, 70, `彩蛋 ${secretFound}/${secretTotal}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: TEXT_DARK,
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.addBackButton();
    this.addResetButton(save);
    this.renderNodes(save);

    // EX 解鎖提示（§60）：L9 通關且尚有 EX 未制霸時，提示魔王節點的第二入口。
    const exPending =
      save.levels[9]?.cleared === true &&
      (save.levels[4]?.exCleared !== true || save.levels[7]?.exCleared !== true);
    if (exPending) {
      const hint = this.add
        .text(width / 2, 96, 'EX 挑戰已解鎖：點魔王節點上方的 EX 入口', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
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

    // 鍵盤備援：ENTER 直接進當前可挑戰關。
    const challenge = currentChallenge(save);
    if (challenge !== null) {
      this.input.keyboard?.once('keydown-ENTER', () => this.enterLevel(challenge));
    }
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start(SceneKeys.Title));
  }

  // v9 九節點（§60）：鋸齒路徑橫排；節點半徑收斂 30 保留名牌間距。
  private nodePosition(index: number): { x: number; y: number } {
    const { width } = this.scale;
    const xs = [0.06, 0.165, 0.27, 0.375, 0.48, 0.585, 0.69, 0.795, 0.9];
    const ys = [292, 232, 292, 240, 296, 234, 288, 238, 292];
    return { x: width * (xs[index] ?? 0.5), y: ys[index] ?? 270 };
  }

  // 節點間虛線路徑：等距圓點沿線段鋪設；未解鎖段降透明度。
  private drawPath(save: SaveData): void {
    const dots = this.add.graphics().setDepth(1);
    for (let i = 0; i < LEVELS.length - 1; i += 1) {
      const from = this.nodePosition(i);
      const to = this.nodePosition(i + 1);
      const nextLevel = LEVELS[i + 1];
      const lit = nextLevel !== undefined && nodeStatus(save, nextLevel.id) !== 'locked';
      dots.fillStyle(0xffffff, lit ? 0.75 : 0.28);
      const dist = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
      const steps = Math.floor(dist / 20);
      for (let s = 1; s < steps; s += 1) {
        const t = s / steps;
        dots.fillCircle(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, 3);
      }
    }
  }

  private renderNodes(save: SaveData): void {
    this.drawPath(save);
    LEVELS.forEach((level, index) => {
      const { x, y } = this.nodePosition(index);
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
          fontSize: '30px',
          fontStyle: 'bold',
          color: TEXT_DARK,
        })
        .setOrigin(0.5);
      node.add([circle, numeral]);

      const name = this.add
        .text(x, y + NODE_RADIUS + 22, level.nameZh, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
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
          .text(x, y + NODE_RADIUS + 44, `最佳 ${(best / 1000).toFixed(1)}s`, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
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
    addDomButton(
      this,
      `進入 ${nameZh}`,
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
