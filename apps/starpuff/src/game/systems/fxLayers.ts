import type Phaser from 'phaser';
import { STAR_FLAVORS, getMix, type MixId, type StarFlavor } from '../core/config';
import { acquirePooled } from '../core/poolFlags';
import { loadSettings } from '../core/settings';

// 分層素材特效（§124 W5a）：core/shock/trail/debris/overlay 五層疊加爆發與星彈
// 命中爆閃的單一出口。素材未載時回 false，由呼叫端保留既有程序化回退；
// reducedMotion 偏好降層（僅 core），沿 cameraFxGate 的偏好每次呼叫重讀慣例。

// 高頻爆閃共用池（非物理顯示 sprite）：per-scene 惰性建立，shutdown 自動釋放。
// 取出一律走 acquirePooled（型別層守門）；特效 sprite 純顯示、無跨系統一次性
// 互動標記，POOL_TRANSIENT_FLAGS 零新增。
const pools = new WeakMap<Phaser.Scene, Phaser.GameObjects.Group>();
const FLASH_POOL_MAX = 32;

function poolOf(scene: Phaser.Scene): Phaser.GameObjects.Group {
  let pool = pools.get(scene);
  if (!pool) {
    pool = scene.add.group({ maxSize: FLASH_POOL_MAX });
    pools.set(scene, pool);
    scene.events.once('shutdown', () => pools.delete(scene));
  }
  return pool;
}

// 池取出即全量重設（殘值歸位）：texture／transform／alpha 每次取出必寫。
// acquirePooled 回傳型別為物理 Sprite 超集，本池為顯示 Sprite——僅使用顯示 API。
function acquireFlash(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
): Phaser.GameObjects.Sprite | null {
  const image = acquirePooled(poolOf(scene), x, y, key);
  if (!image) return null;
  scene.tweens.killTweensOf(image);
  image.setTexture(key);
  image.setActive(true).setVisible(true);
  image.setPosition(x, y);
  image.setRotation(0);
  image.setFlipX(false);
  image.setAlpha(1);
  image.setScale(1);
  return image;
}

export interface FlashOptions {
  durationMs?: number;
  depth?: number;
  // 起始縮放比（相對結束尺寸）：<1 爆開、>1 收斂。
  fromScale?: number;
  rotate?: boolean;
}

// 單張素材爆閃（星彈 hit／explosion）：popIn 放大＋淡出回池；素材未載回 false。
export function flashSprite(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  sizePx: number,
  opts: FlashOptions = {},
): boolean {
  if (!scene.textures.exists(key)) return false;
  const image = acquireFlash(scene, x, y, key);
  if (!image) return true;
  const durationMs = (opts.durationMs ?? 180) * (loadSettings().reducedMotion ? 0.6 : 1);
  const frameW = image.frame.realWidth || 1;
  const scale = sizePx / frameW;
  image.setDepth(opts.depth ?? 90);
  image.setScale(scale * (opts.fromScale ?? 0.45));
  scene.tweens.add({
    targets: image,
    scale,
    alpha: 0,
    rotation: opts.rotate === true ? 0.5 : 0,
    duration: durationMs,
    ease: 'Quad.easeOut',
    onComplete: () => {
      image.setActive(false).setVisible(false);
    },
  });
  return true;
}

// 星味命中演出（§124 W5a）：爆裂終端出 explosion 環、一般命中出 hit 閃；視覺味
// 以 fxFlavor 為準（稜片走 prism 素材），素材缺載時沿既有回饋（敵方閃白）零疊加。
export function flashStarImpact(
  scene: Phaser.Scene,
  star: Phaser.Physics.Arcade.Sprite,
  absorb: boolean,
): void {
  const flavor = star.getData('flavor') as StarFlavor | undefined;
  if (flavor === undefined) return;
  const fxFlavor = (star.getData('fxFlavor') as string | undefined) ?? flavor;
  const mixId = star.getData('mix') as MixId | null | undefined;
  const spec = mixId ? getMix(mixId) : STAR_FLAVORS[flavor];
  if (absorb && spec.aoeRadiusPx > 0) {
    flashSprite(scene, `fx-star-${fxFlavor}-explosion`, star.x, star.y, spec.aoeRadiusPx * 2, {
      durationMs: 260,
      depth: 89,
    });
  } else {
    flashSprite(scene, `fx-star-${fxFlavor}-hit`, star.x, star.y, 44, {
      durationMs: 170,
      depth: 89,
    });
  }
}

export interface LayerBurstOptions {
  // core 層目標直徑 px；shock/overlay 依比例外擴。
  sizePx: number;
  depth?: number;
  // 粒子迸發數（debris 層）；0 停用。
  debrisCount?: number;
}

// 五層一次性爆發（落地／浮空／吸入起手／變身光環爆）：core 縮放淡出＋shock 擴散
// ＋overlay 加色閃光＋debris/trail 粒子迸發；reducedMotion 僅出 core。
// prefix 例：'fx-common-landing'、'fx-ember-aura'；core 缺載視為整組未交付回 false。
export function burstLayers(
  scene: Phaser.Scene,
  x: number,
  y: number,
  prefix: string,
  opts: LayerBurstOptions,
): boolean {
  if (!scene.textures.exists(`${prefix}-core`)) return false;
  const depth = opts.depth ?? 88;
  const reduced = loadSettings().reducedMotion;
  flashSprite(scene, `${prefix}-core`, x, y, opts.sizePx, { durationMs: 320, depth });
  if (reduced) return true;
  flashSprite(scene, `${prefix}-shock`, x, y, opts.sizePx * 1.7, {
    durationMs: 300,
    depth: depth - 1,
    fromScale: 0.3,
  });
  flashSprite(scene, `${prefix}-overlay`, x, y, opts.sizePx * 1.25, {
    durationMs: 420,
    depth: depth + 1,
    fromScale: 0.6,
    rotate: true,
  });
  const debrisCount = opts.debrisCount ?? 8;
  if (debrisCount > 0 && scene.textures.exists(`${prefix}-debris`)) {
    // 一次性迸發 emitter（沿 fx.burstSmall 播畢自毀慣例）；trail 素材作次層拖屑。
    const textures = [`${prefix}-debris`];
    if (scene.textures.exists(`${prefix}-trail`)) textures.push(`${prefix}-trail`);
    for (const [index, texture] of textures.entries()) {
      const debris = scene.add
        .particles(x, y, texture, {
          speed: { min: 50, max: 160 },
          angle: { min: 0, max: 360 },
          // 1024 源素材作粒子：以目標 px 換算縮放（frame 尺寸單點讀取）。
          scale: { start: (opts.sizePx * 0.24) / 1024, end: 0 },
          alpha: { start: 0.9, end: 0 },
          rotate: { min: 0, max: 360 },
          lifespan: { min: 220, max: 380 },
          blendMode: 'ADD',
          emitting: false,
          maxAliveParticles: debrisCount,
        })
        .setDepth(depth + 2);
      debris.explode(index === 0 ? debrisCount : Math.ceil(debrisCount / 2));
      scene.time.delayedCall(460, () => debris.destroy());
    }
  }
  return true;
}
