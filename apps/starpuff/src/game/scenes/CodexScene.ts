import Phaser from 'phaser';
import { CODEX_MONSTERS, CODEX_SKILLS, CODEX_TAB_GRIDS, MONSTER_PAGE_SIZE } from '../core/codex';
import { fitBoundedGrid, gridRowTop } from '../core/gridLayout';
import { loadSave } from '../core/save';
import { SceneKeys, type CodexTab, type LevelId } from '../core/types';
import { ACHIEVEMENTS, unlockedAchievements } from '../logic/achievements';
import { LEVELS, exConquestDone } from '../logic/levels';
import { playSfx } from '../audio/sfx';
import { createMenuBackdrop, type BackgroundHandle } from '../systems/background';
import { addDomButton, addMuteButton, bindMenuRelayout, hudSafeInsets } from '../systems/hud';

// 魔王品種 → 魔王關對照（LEVELS 派生，加王自動跟進）。
const BOSS_LEVEL_BY_KIND = new Map<string, LevelId>(
  LEVELS.filter((level) => level.boss !== null).map((level) => [level.boss as string, level.id]),
);

const TEXT_DARK = '#3a3a4a';
const TEXT_SOFT = '#5a5a6e';
const ACCENT = '#7a5fb8';

interface CodexSceneData {
  tab?: CodexTab;
  monsterPage?: number;
}

// 圖鑑與技能介紹（GAME_DESIGN §36）：單場景雙分頁，內容由 core/codex.ts 資料驅動；
// 立繪直接取既有 sprite 資產。分頁切換以 restart 重建（選單輕量無局內狀態）。
export class CodexScene extends Phaser.Scene {
  tab: CodexTab = 'monsters';
  private backdrop: BackgroundHandle | null = null;
  private monsterPage = 0;

  constructor() {
    super(SceneKeys.Codex);
  }

  init(data: CodexSceneData): void {
    this.tab = data.tab ?? 'monsters';
    this.monsterPage = data.monsterPage ?? 0;
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
    bindMenuRelayout(this, { tab: this.tab, monsterPage: this.monsterPage });

    // 可讀性底襯：內容區半透明白卡。
    this.add.rectangle(width / 2, 282, Math.min(width - 40, 1100), 350, 0xffffff, 0.35);

    const titles: Record<CodexTab, string> = {
      monsters: '圖鑑',
      skills: '技能介紹',
      achievements: '成就',
    };
    this.add
      .text(width / 2, 34, titles[this.tab], {
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
    else if (this.tab === 'skills') this.renderSkills();
    else this.renderAchievements();
  }

  private addBackButton(): void {
    // 殼左緣避讓（§93 D）：直持下 home indicator／瀏海換軸到殼左會壓住返回鈕。
    const visual = this.add
      .text(56 + hudSafeInsets(this).left, 34, '返回', {
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
    // v15 三分頁（§94）：等距展開，854 寬下三鈕含間距 468px 仍居中無溢出。
    const tabs: { tab: CodexTab; label: string }[] = [
      { tab: 'monsters', label: '圖鑑' },
      { tab: 'skills', label: '技能' },
      { tab: 'achievements', label: '成就' },
    ];
    tabs.forEach((entry, i) => {
      const x = width / 2 + (i - (tabs.length - 1) / 2) * 156;
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

  // 怪物分頁網格（§104 F-03 取代 §76 單頁定案）：每頁 12 格 6×2——854 寬 cellW 由
  // 67 放大至 134、行為敘述 12+ 字/行，直持不再過密；頁序沿 CODEX_MONSTERS。
  private renderMonsters(): void {
    const { width } = this.scale;
    // 殼緣避讓（§93 D）：徽記與網格以左右净 inset 收縮，瀏海/home indicator 不遮條目；
    // 靜音鈕已依 inset 左移（§93 C），徽記同步左移防重疊。
    const insets = hudSafeInsets(this);
    // 星核制霸格（§86）：五王 EX 全制霸的圖鑑常設榮譽章。
    if (exConquestDone(loadSave())) {
      const star = this.add
        .image(width - 158 - insets.right, 34, 'fx-star')
        .setDisplaySize(24, 24)
        .setTint(0xffd870);
      this.tweens.add({
        targets: star,
        angle: 8,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.add
        .text(width - 100 - insets.right, 34, '星核制霸', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#8a6a1f',
          backgroundColor: '#ffe9a8',
          padding: { x: 10, y: 4 },
        })
        .setOrigin(0.5);
    }
    const pages = Math.max(1, Math.ceil(CODEX_MONSTERS.length / MONSTER_PAGE_SIZE));
    const page = Math.min(this.monsterPage, pages - 1);
    const pageMonsters = CODEX_MONSTERS.slice(
      page * MONSTER_PAGE_SIZE,
      (page + 1) * MONSTER_PAGE_SIZE,
    );
    this.addMonsterPager(page, pages);
    const usableW = width - insets.left - insets.right;
    const grid = fitBoundedGrid(pageMonsters.length, CODEX_TAB_GRIDS.monsters);
    const cols = grid.cols;
    const cellW = Math.min(170, (usableW - 50) / cols);
    const gridLeft = insets.left + usableW / 2 - (cellW * cols) / 2;
    pageMonsters.forEach((monster, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cx = gridLeft + cellW * (col + 0.5);
      const top = gridRowTop(row, CODEX_TAB_GRIDS.monsters);
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
      // EX 紀念星章（§58/§86）：EX 擊破過的魔王條目掛紫星——魔王關對照由 LEVELS
      // 派生（禁第二份硬編清單）；codex kind 'boss'＝jellord 的歷史別名。
      const exLevelId = BOSS_LEVEL_BY_KIND.get(monster.kind === 'boss' ? 'jellord' : monster.kind);
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
          // CJK 無空白斷詞：必須逐字換行，否則窄格橫向溢出相鄰格。
          wordWrap: { width: cellW - 10, useAdvancedWrap: true },
        })
        .setOrigin(0.5, 0);
    });
  }

  // 怪物頁切換列（§104 F-03）：底緣置中「上一頁／第 n/N 頁／下一頁」，
  // restart 帶頁參（沿分頁切換慣例）；單頁時不顯示。
  private addMonsterPager(page: number, pages: number): void {
    if (pages <= 1) return;
    const { width } = this.scale;
    const centerX = width / 2;
    const pagerY = 448;
    this.add
      .text(centerX, pagerY, `第 ${page + 1}/${pages} 頁`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: TEXT_DARK,
      })
      .setOrigin(0.5);
    const entries: { label: string; delta: number; menuId: string }[] = [
      { label: '上一頁', delta: -1, menuId: 'monsters-prev' },
      { label: '下一頁', delta: 1, menuId: 'monsters-next' },
    ];
    for (const entry of entries) {
      const target = page + entry.delta;
      if (target < 0 || target >= pages) continue;
      const x = centerX + entry.delta * 128;
      this.add
        .text(x, pagerY, entry.label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: TEXT_DARK,
          backgroundColor: '#ffffff',
          padding: { x: 14, y: 7 },
        })
        .setOrigin(0.5)
        .setAlpha(0.92);
      addDomButton(
        this,
        `圖鑑${entry.label}`,
        { x, y: pagerY, w: 128, h: 44 },
        () => {
          playSfx('pop');
          this.scene.restart({ tab: 'monsters', monsterPage: target });
        },
        entry.menuId,
      );
    }
  }

  // 成就網格（§94）：6 欄 4 列徽章格——已解鎖亮金、未解鎖灰、隱藏未解鎖遮蔽為
  // 「？？？」；解鎖態恆由 save 資料即時派生（stored 只管頒發去重）。零新圖：
  // 徽章以 fx-star tint＋圓底程序繪製。
  private renderAchievements(): void {
    const { width } = this.scale;
    // 殼緣避讓（§93 D 慣例）：計數徽記與網格以左右净 inset 收縮。
    const insets = hudSafeInsets(this);
    const unlocked = unlockedAchievements(loadSave());
    this.add
      .text(width - 100 - insets.right, 34, `解鎖 ${unlocked.size}/${ACHIEVEMENTS.length}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#8a6a1f',
        backgroundColor: '#ffe9a8',
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5);
    const usableW = width - insets.left - insets.right;
    // 有界網格（§96）：欄數隨成就總量增長，任何內容不超出 y=470（守門單測）。
    const gridSpec = CODEX_TAB_GRIDS.achievements;
    const { cols } = fitBoundedGrid(ACHIEVEMENTS.length, gridSpec);
    const cellW = Math.min(170, (usableW - 50) / cols);
    const gridLeft = insets.left + usableW / 2 - (cellW * cols) / 2;
    ACHIEVEMENTS.forEach((spec, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cx = gridLeft + cellW * (col + 0.5);
      const top = gridRowTop(row, gridSpec);
      const done = unlocked.has(spec.id);
      const masked = spec.hidden && !done;
      // 徽章：圓底＋星形；未解鎖降飽和低透明。
      this.add.circle(cx, top + 16, 16, done ? 0xffffff : 0x9a9aa8, done ? 0.9 : 0.28);
      const star = this.add
        .image(cx, top + 16, 'fx-star')
        .setDisplaySize(22, 22)
        .setTint(done ? 0xffc93c : 0x9a9aa8)
        .setAlpha(done ? 1 : 0.55);
      if (done) {
        this.tweens.add({
          targets: star,
          angle: 8,
          duration: 1400,
          delay: index * 60,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
      this.add
        .text(cx, top + 42, masked ? '？？？' : spec.nameZh, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: done ? TEXT_DARK : TEXT_SOFT,
        })
        .setOrigin(0.5)
        .setAlpha(done ? 1 : 0.8);
      this.add
        .text(cx, top + 56, masked ? '隱藏成就' : spec.descZh, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          color: TEXT_SOFT,
          align: 'center',
          // CJK 無空白斷詞：逐字換行防窄格橫向溢出（沿 §76 慣例）。
          wordWrap: { width: cellW - 10, useAdvancedWrap: true },
        })
        .setOrigin(0.5, 0)
        .setAlpha(done ? 0.9 : 0.65);
    });
  }

  // 技能網格列表：名稱＋操作方式（同列）＋效果說明（含來源怪物對應）。
  // 有界網格（§96 P1-01 修復）：v15 前雙欄 5 列第 9 項說明 y=486 溢出邏輯畫布
  // （480）；改固定 3 列、欄隨量增，任何內容不超出 y=470（守門單測）。
  private renderSkills(): void {
    const { width } = this.scale;
    // 殼緣避讓（§93 D）：網格以左右净 inset 收縮的有效區排版。
    const insets = hudSafeInsets(this);
    const usableW = width - insets.left - insets.right;
    const gridSpec = CODEX_TAB_GRIDS.skills;
    const { cols } = fitBoundedGrid(CODEX_SKILLS.length, gridSpec);
    const cellW = (usableW - 24) / cols;
    const gridLeft = insets.left + usableW / 2 - (cellW * cols) / 2;
    CODEX_SKILLS.forEach((skill, index) => {
      const left = gridLeft + cellW * (index % cols) + 8;
      const y = gridRowTop(Math.floor(index / cols), gridSpec);
      const name = this.add
        .text(left, y, skill.nameZh, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          color: TEXT_DARK,
        })
        .setOrigin(0, 0);
      // 操作方式緊隨名稱動態排列（§96）：854 寬含瀏海 inset 的最窄格也不越格。
      this.add
        .text(left + name.width + 8, y + 3, skill.howTo, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          color: ACCENT,
        })
        .setOrigin(0, 0);
      this.add
        .text(left, y + 26, skill.detail, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: TEXT_SOFT,
          // CJK 無空白斷詞：逐字換行防窄格橫向溢出（沿 §76 慣例）。
          wordWrap: { width: cellW - 16, useAdvancedWrap: true },
        })
        .setOrigin(0, 0);
    });
  }

  override update(_time: number, deltaMs: number): void {
    this.backdrop?.update(deltaMs);
  }
}
