import Phaser from 'phaser';
import { CODEX_MONSTERS, CODEX_SKILLS } from '../core/codex';
import { loadSave } from '../core/save';
import { SceneKeys, type CodexTab, type LevelId } from '../core/types';
import { playSfx } from '../audio/sfx';
import { createMenuBackdrop, type BackgroundHandle } from '../systems/background';
import { addDomButton, addMuteButton, bindMenuRelayout } from '../systems/hud';

const TEXT_DARK = '#3a3a4a';
const TEXT_SOFT = '#5a5a6e';
const ACCENT = '#7a5fb8';

interface CodexSceneData {
  tab?: CodexTab;
}

// 圖鑑與技能介紹（GAME_DESIGN §36）：單場景雙分頁，內容由 core/codex.ts 資料驅動；
// 立繪直接取既有 sprite 資產。分頁切換以 restart 重建（選單輕量無局內狀態）。
export class CodexScene extends Phaser.Scene {
  tab: CodexTab = 'monsters';
  private backdrop: BackgroundHandle | null = null;

  constructor() {
    super(SceneKeys.Codex);
  }

  init(data: CodexSceneData): void {
    this.tab = data.tab ?? 'monsters';
  }

  create(): void {
    const { width } = this.scale;
    this.backdrop = createMenuBackdrop(this, {
      bgKey: 'bg-arena',
      autoScrollPxPerSec: 8,
      clouds: true,
    });
    this.events.once('shutdown', () => this.backdrop?.destroy());
    addMuteButton(this);
    bindMenuRelayout(this, { tab: this.tab });

    // 可讀性底襯：內容區半透明白卡。
    this.add.rectangle(width / 2, 282, Math.min(width - 40, 1100), 350, 0xffffff, 0.35);

    this.add
      .text(width / 2, 34, this.tab === 'monsters' ? '圖鑑' : '技能介紹', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: ACCENT,
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.addBackButton();
    this.addTabButtons();
    if (this.tab === 'monsters') this.renderMonsters();
    else this.renderSkills();
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
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start(SceneKeys.Title));
  }

  private addTabButtons(): void {
    const { width } = this.scale;
    const tabs: { tab: CodexTab; label: string }[] = [
      { tab: 'monsters', label: '圖鑑' },
      { tab: 'skills', label: '技能' },
    ];
    tabs.forEach((entry, i) => {
      const x = width / 2 + (i === 0 ? -78 : 78);
      const active = entry.tab === this.tab;
      this.add
        .text(x, 84, entry.label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: active ? '#ffffff' : TEXT_DARK,
          backgroundColor: active ? ACCENT : '#ffffff',
          padding: { x: 26, y: 8 },
        })
        .setOrigin(0.5)
        .setAlpha(active ? 1 : 0.88);
      if (!active) {
        addDomButton(
          this,
          `切換至${entry.label}`,
          { x, y: 84, w: 140, h: 52 },
          () => {
            playSfx('pop');
            this.scene.restart({ tab: entry.tab });
          },
          `tab-${entry.tab}`,
        );
      }
    });
  }

  // 全怪物 7×2 網格（v8 十四格：十二小怪＋雙魔王）：立繪 + 名稱 + 行為 + 可吸標記。
  private renderMonsters(): void {
    const { width } = this.scale;
    const cols = 7;
    const cellW = Math.min(170, (width - 50) / cols);
    const gridLeft = width / 2 - (cellW * cols) / 2;
    const rowTops = [116, 282];
    CODEX_MONSTERS.forEach((monster, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cx = gridLeft + cellW * (col + 0.5);
      const top = rowTops[row] ?? 116;
      const sprite = this.add.image(cx, top + 30, monster.textureKey);
      const scale = 50 / Math.max(sprite.width, sprite.height);
      sprite.setScale(scale);
      this.tweens.add({
        targets: sprite,
        scale: { from: 0, to: scale },
        duration: 320,
        delay: index * 45,
        ease: 'Back.easeOut',
      });
      this.add
        .text(cx, top + 66, monster.nameZh, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: TEXT_DARK,
        })
        .setOrigin(0.5);
      // EX 紀念星章（§58）：EX 擊破過的魔王條目掛紫星。
      const exLevel: Partial<Record<string, LevelId>> = { boss: 4, noctra: 7 };
      const exLevelId = exLevel[monster.kind];
      if (exLevelId !== undefined && loadSave().levels[exLevelId]?.exCleared === true) {
        this.add
          .image(cx + 26, top + 12, 'fx-star')
          .setDisplaySize(20, 20)
          .setTint(0x9b7bd8)
          .setDepth(6);
      }
      // 可吸標記：圓點 + 文字（綠=可吸、琥珀=條件可吸、灰=不可吸），禁 emoji。
      const badge = this.add.container(cx, top + 86);
      const dotColor = monster.inhalable ? 0x3dbb8a : monster.conditional ? 0xe8a33d : 0x9a9aa8;
      const label = this.add
        .text(6, 0, monster.inhalable ? '可吸' : monster.conditional ? '條件可吸' : '不可吸', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          color: monster.inhalable ? '#2e8a67' : monster.conditional ? '#a56a1f' : TEXT_SOFT,
        })
        .setOrigin(0.5);
      const dot = this.add.circle(label.x - label.width / 2 - 8, 0, 4, dotColor);
      badge.add([dot, label]);
      this.add
        .text(cx, top + 102, monster.behavior, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          color: TEXT_SOFT,
          align: 'center',
          // CJK 無空白斷詞：必須逐字換行，否則 7 欄窄格橫向溢出相鄰格。
          wordWrap: { width: cellW - 10, useAdvancedWrap: true },
        })
        .setOrigin(0.5, 0);
    });
  }

  // 技能雙欄列表：名稱 + 操作方式 + 效果說明（含來源怪物對應）。
  private renderSkills(): void {
    const { width } = this.scale;
    const colX = [width * 0.28, width * 0.72];
    const colW = Math.min(400, width * 0.42);
    CODEX_SKILLS.forEach((skill, index) => {
      const x = colX[index % 2] ?? width / 2;
      const y = 122 + Math.floor(index / 2) * 84;
      this.add
        .text(x - colW / 2, y, skill.nameZh, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: TEXT_DARK,
        })
        .setOrigin(0, 0);
      this.add
        .text(x - colW / 2 + 96, y + 3, skill.howTo, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: ACCENT,
        })
        .setOrigin(0, 0);
      this.add
        .text(x - colW / 2, y + 28, skill.detail, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          color: TEXT_SOFT,
          wordWrap: { width: colW },
        })
        .setOrigin(0, 0);
    });
  }

  override update(_time: number, deltaMs: number): void {
    this.backdrop?.update(deltaMs);
  }
}
