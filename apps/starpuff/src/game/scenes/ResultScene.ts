import Phaser from 'phaser';
import { SceneKeys, type GameResultData, type LevelId } from '../core/types';
import { getAchievement } from '../logic/achievements';
import { nextLevelId } from '../logic/levels';
import { createMenuBackdrop, type BackgroundHandle } from '../systems/background';
import { createFx } from '../systems/fx';
import { addDomButton, bindMenuRelayout } from '../systems/hud';

export class ResultScene extends Phaser.Scene {
  private result: GameResultData = { result: 'won', timeMs: 0, deaths: 0, levelId: 1 };
  private backdrop: BackgroundHandle | null = null;

  constructor() {
    super(SceneKeys.Result);
  }

  init(data: Partial<GameResultData>): void {
    this.result = {
      result: data.result ?? 'won',
      timeMs: data.timeMs ?? 0,
      deaths: data.deaths ?? 0,
      levelId: data.levelId ?? 1,
      ex: data.ex === true,
      unlocked: data.unlocked ?? [],
    };
  }

  create(): void {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const seconds = (this.result.timeMs / 1000).toFixed(1);
    const won = this.result.result === 'won';

    // 勝利：星空回廊緩捲 + 金塵緩落；敗北：靜止背景 + 降飽和覆層。
    this.backdrop = createMenuBackdrop(this, {
      bgKey: 'bg-arena',
      autoScrollPxPerSec: won ? 8 : 0,
      clouds: won,
      ambience: won ? 'bg-throne' : undefined,
    });
    this.events.once('shutdown', () => this.backdrop?.destroy());
    bindMenuRelayout(this, this.result);
    if (!won) {
      this.add.rectangle(centerX, height / 2, width, height, 0x9a9aa8, 0.4).setDepth(-5);
    }

    const heroKey = won ? 'hero-puffed' : 'hero-hurt';
    if (this.textures.exists(heroKey)) {
      const hero = this.add.image(centerX, height * 0.5, heroKey);
      hero.setDisplaySize(130, 130);
      if (!won) hero.setTint(0xbcbcc8);
      this.tweens.add({
        targets: hero,
        y: '-=10',
        duration: 1300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.add
      .text(centerX, height * 0.18, won ? '勝利！' : '失敗…', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '54px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: won ? '#e8a33d' : '#6e6e80',
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    // 勝利加列本輪總死亡次數（PM 裁決）；零死亡給嘉獎文案。
    const stats = won
      ? `用時 ${seconds} 秒｜${this.result.deaths === 0 ? '無傷通關！' : `死亡 ${this.result.deaths} 次`}`
      : `用時 ${seconds} 秒`;
    this.add
      .text(centerX, height * 0.31, stats, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: won ? '#5a4a2a' : '#5a5a6e',
      })
      .setOrigin(0.5);

    if (won) createFx(this).confetti();

    // 成就解鎖名單（§94）：勝利演出期 toast 可能因轉場漏播，結算頁列示兜底；
    // 敗北局內解鎖的彩蛋成就同樣如實列出。
    const unlocked = this.result.unlocked ?? [];
    if (unlocked.length > 0) {
      const names = unlocked.map((id) => getAchievement(id)?.nameZh ?? id).join('、');
      this.add
        .text(centerX, height * 0.84, `成就解鎖：${names}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#8a6a1f',
          backgroundColor: '#ffe9a8',
          padding: { x: 14, y: 6 },
          align: 'center',
          wordWrap: { width: width - 120, useAdvancedWrap: true },
        })
        .setOrigin(0.5)
        .setAlpha(0.95);
    }

    // 一般勝利主 CTA＝下一關（§100 D3：接續遊玩零折返）；EX 勝利與敗北維持原語意。
    // Result 勝利僅魔王關觸發（走動關經星星門直進地圖揭霧），L20 全破走謝幕，
    // 故一般勝利必有下一關；資料防禦仍回退地圖。
    const next = won && this.result.ex !== true ? nextLevelId(this.result.levelId) : null;
    const buttonY = height * 0.68;
    const primaryLabel = won
      ? next !== null
        ? '下一關'
        : '世界地圖'
      : this.result.ex
        ? '再戰 EX'
        : '再戰魔王';
    const primaryX = next !== null ? centerX + 118 : centerX;
    // 純視覺鈕：命中一律由同熱區 DOM 鈕承接（單一命中，見下方 addDomButton）。
    const primaryButton = this.add
      .text(primaryX, buttonY, primaryLabel, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#3a3a4a',
        backgroundColor: '#bff3e0',
        padding: { x: 32, y: 14 },
      })
      .setOrigin(0.5);

    // 敗北重試直接回到戰敗關卡（魔王關），延續本輪用時與死亡計數；EX 變體保留（§86）。
    const primary = () =>
      won
        ? next !== null
          ? this.enterLevel(next)
          : this.scene.start(SceneKeys.Map, {})
        : this.scene.start(SceneKeys.Game, {
            levelId: this.result.levelId,
            deaths: this.result.deaths,
            ex: this.result.ex,
          });
    this.input.keyboard?.once('keydown-ENTER', primary);
    // 主鈕唯一指標命中路徑（recon-v4 A.3）：覆蓋 canvas 視覺鈕的透明 DOM 鈕，
    // 兩種持向 hit-test 皆正確；canvas 同熱區不再掛 interactive，杜絕雙命中。
    addDomButton(
      this,
      primaryButton.text,
      { x: primaryX, y: buttonY, w: 220, h: 72 },
      primary,
      next !== null ? 'next-level' : undefined,
    );

    // 世界地圖降為次選（§100 D3）：僅一般勝利雙鈕呈現。
    if (next !== null) {
      const mapX = centerX - 128;
      this.add
        .text(mapX, buttonY, '世界地圖', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#3a3a4a',
          backgroundColor: '#ffffff',
          padding: { x: 22, y: 12 },
        })
        .setOrigin(0.5)
        .setAlpha(0.92);
      addDomButton(
        this,
        '世界地圖',
        { x: mapX, y: buttonY, w: 180, h: 60 },
        () => this.scene.start(SceneKeys.Map, {}),
        'map',
      );
    }
  }

  private enterLevel(levelId: LevelId): void {
    this.scene.start(SceneKeys.Game, { levelId, deaths: 0 });
  }

  override update(_time: number, deltaMs: number): void {
    this.backdrop?.update(deltaMs);
  }
}
