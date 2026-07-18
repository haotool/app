import type Phaser from 'phaser';
import { VIEW } from '../core/config';
import {
  METEOR,
  advanceMeteorTimer,
  meteorSpawnY,
  pickMeteorX,
  type ExclusionBand,
  type MeteorSpec,
} from '../logic/meteor';
import { playSfx } from '../audio/sfx';

// 流星雨呈現層（GAME_DESIGN §78）：波次節拍/落點抽選由 logic/meteor.ts 純函式導出，
// 本模組負責預警圈、隕星墜落、著地餘燼與碎裂演出；傷害結算由 GameScene overlap 承接。

const GROUND_TOP = VIEW.height - 80;
const ROCK_TEX = 'meteor-rock';
const EMBER_TEX = 'meteor-ember';
const ROCK_SIZE = 30;
const EMBER_W = 44;
const EMBER_H = 12;
// 著地判定線：岩心貼地面頂上緣。
const IMPACT_Y = GROUND_TOP - ROCK_SIZE / 2;
const ROCK_SPIN_RAD_PER_MS = 0.004;
const WARN_TINT = 0xb89af0;
const ROCK_TINT = 0x8878d0;
const EMBER_TINT = 0xffa868;
const POOL_SIZE = 6;

export interface MeteorContext {
  viewLeft: number;
  viewRight: number;
  playerX: number;
  // 星星門 x（開門後禁投帶 §10.2-7）；未開門為 null。
  gateX: number | null;
}

export interface MeteorSystem {
  update(deltaMs: number, ctx: MeteorContext): void;
  getMeteors(): Phaser.Physics.Arcade.Group;
  getEmbers(): Phaser.Physics.Arcade.Group;
  // 星彈擊碎／命中玩家共用的消滅出口（碎裂粒子演出）。
  shatter(meteor: Phaser.GameObjects.GameObject): void;
  // e2e 觀測點：墜落中/餘燼/預警圈數量。
  state(): { falling: number; embers: number; telegraphs: number };
  destroy(): void;
}

function ensureMeteorTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(ROCK_TEX)) {
    const g = scene.add.graphics();
    g.fillStyle(ROCK_TINT, 1);
    g.fillCircle(ROCK_SIZE / 2, ROCK_SIZE / 2, ROCK_SIZE / 2);
    g.fillStyle(0x685aa8, 1);
    g.fillCircle(ROCK_SIZE / 2 - 5, ROCK_SIZE / 2 - 4, 5);
    g.fillCircle(ROCK_SIZE / 2 + 6, ROCK_SIZE / 2 + 5, 3.5);
    g.lineStyle(2.5, 0xffe9a8, 0.9);
    g.strokeCircle(ROCK_SIZE / 2, ROCK_SIZE / 2, ROCK_SIZE / 2 - 1);
    g.generateTexture(ROCK_TEX, ROCK_SIZE, ROCK_SIZE);
    g.destroy();
  }
  if (!scene.textures.exists(EMBER_TEX)) {
    const g = scene.add.graphics();
    g.fillStyle(EMBER_TINT, 0.85);
    g.fillEllipse(EMBER_W / 2, EMBER_H / 2, EMBER_W, EMBER_H);
    g.fillStyle(0xffe9a8, 0.9);
    g.fillEllipse(EMBER_W / 2, EMBER_H / 2, EMBER_W * 0.55, EMBER_H * 0.55);
    g.generateTexture(EMBER_TEX, EMBER_W, EMBER_H);
    g.destroy();
  }
}

export function createMeteorSystem(scene: Phaser.Scene, spec: MeteorSpec): MeteorSystem {
  ensureMeteorTextures(scene);
  const meteors = scene.physics.add.group({ defaultKey: ROCK_TEX, maxSize: POOL_SIZE });
  const embers = scene.physics.add.group({ defaultKey: EMBER_TEX, maxSize: POOL_SIZE });
  const telegraphs = new Set<Phaser.GameObjects.Arc>();
  let timerMs = 0;

  const activeFalling = (): number => meteors.getChildren().filter((child) => child.active).length;

  // 落點預警圈：0.8s 由小擴滿（滿張即著地），與隕星同步生成。
  const spawnTelegraph = (x: number): void => {
    const ring = scene.add
      .circle(x, GROUND_TOP - 6, 30, WARN_TINT, 0.12)
      .setStrokeStyle(3, WARN_TINT, 0.9)
      .setDepth(58)
      .setScale(0.2);
    telegraphs.add(ring);
    scene.tweens.add({
      targets: ring,
      scale: 1,
      duration: METEOR.telegraphMs,
      ease: 'Linear',
      onComplete: () => {
        telegraphs.delete(ring);
        ring.destroy();
      },
    });
  };

  const spawnMeteor = (x: number): void => {
    const rock = meteors.get(x, meteorSpawnY(IMPACT_Y)) as Phaser.Physics.Arcade.Sprite | null;
    if (!rock) return;
    rock.setActive(true).setVisible(true);
    rock.setTexture(ROCK_TEX);
    rock.setDepth(56);
    rock.setAlpha(1);
    rock.setRotation(0);
    const body = rock.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(x, meteorSpawnY(IMPACT_Y));
    body.setSize(ROCK_SIZE * 0.85, ROCK_SIZE * 0.85);
    // 恆定墜速不掛重力（交叉不變式 14）：低重力關落地時刻不延後。
    body.setAllowGravity(false);
    body.setVelocity(0, METEOR.fallSpeedPxPerSec);
    spawnTelegraph(x);
  };

  const spawnEmber = (x: number): void => {
    const ember = embers.get(x, GROUND_TOP - EMBER_H / 2) as Phaser.Physics.Arcade.Sprite | null;
    if (!ember) return;
    ember.setActive(true).setVisible(true);
    ember.setTexture(EMBER_TEX);
    ember.setDepth(55);
    ember.setAlpha(0.95);
    const body = ember.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(x, GROUND_TOP - EMBER_H / 2);
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    // 餘燼 0.4s 淡出消散（壽命上限必回收 §56）。
    scene.tweens.add({
      targets: ember,
      alpha: 0.3,
      duration: METEOR.emberMs,
      ease: 'Quad.easeIn',
      onComplete: () => ember.disableBody(true, true),
    });
  };

  const impactBurst = (x: number, y: number, tint: number): void => {
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
      const shard = scene.add.circle(x, y, 3.5, tint, 0.95).setDepth(57);
      scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * (26 + Math.random() * 18),
        y: y + Math.sin(angle) * (22 + Math.random() * 14),
        alpha: 0,
        duration: 320,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy(),
      });
    }
  };

  return {
    update(deltaMs: number, ctx: MeteorContext): void {
      // 墜落推進與著地結算。
      for (const child of meteors.getChildren()) {
        if (!child.active) continue;
        const rock = child as Phaser.Physics.Arcade.Sprite;
        rock.rotation += ROCK_SPIN_RAD_PER_MS * deltaMs;
        if (rock.y >= IMPACT_Y) {
          playSfx('break', 0.6);
          impactBurst(rock.x, GROUND_TOP - 8, EMBER_TINT);
          spawnEmber(rock.x);
          rock.disableBody(true, true);
        }
      }
      const tick = advanceMeteorTimer(timerMs, deltaMs, spec.intervalMs);
      timerMs = tick.timerMs;
      if (!tick.wave) return;
      // 單波投放：同屏上限內逐顆抽落點；排除帶＝玩家縱帶＋開門後門前帶（§10.2-7）。
      const exclusions: ExclusionBand[] = [
        { center: ctx.playerX, halfWidthPx: METEOR.playerClearancePx },
      ];
      if (ctx.gateX !== null) {
        exclusions.push({ center: ctx.gateX, halfWidthPx: METEOR.gateClearancePx });
      }
      const budget = Math.min(spec.waveSize, METEOR.maxOnScreen - activeFalling());
      for (let i = 0; i < budget; i += 1) {
        const x = pickMeteorX(
          Math.random(),
          ctx.viewLeft + METEOR.edgeMarginPx,
          ctx.viewRight - METEOR.edgeMarginPx,
          exclusions,
        );
        if (x !== null) spawnMeteor(x);
      }
    },
    getMeteors: () => meteors,
    getEmbers: () => embers,
    shatter(meteor: Phaser.GameObjects.GameObject): void {
      const rock = meteor as Phaser.Physics.Arcade.Sprite;
      if (!rock.active) return;
      playSfx('break', 0.8);
      impactBurst(rock.x, rock.y, 0xd8ccff);
      rock.disableBody(true, true);
    },
    state() {
      return {
        falling: activeFalling(),
        embers: embers.getChildren().filter((child) => child.active).length,
        telegraphs: telegraphs.size,
      };
    },
    destroy(): void {
      for (const ring of telegraphs) ring.destroy();
      telegraphs.clear();
      meteors.destroy(true);
      embers.destroy(true);
    },
  };
}
