import Phaser from 'phaser';
import type { LevelSpec } from '../logic/levels';
import { fillStarPath } from './fx';

// 背景視覺系統（§25 / recon C.7）：橫向無縫雙層視差 + 共用雲層 + 每關 ambience 粒子 + 色彩分級。
// tileSprite 一律 ≤ 邏輯 viewport、scrollFactor(0) + 手動 tilePositionX，與 camera 跟隨解耦。

export interface BackgroundHandle {
  update(deltaMs: number): void;
  destroy(): void;
}

const NEAR_FACTOR = 0.6;
const FAR_FACTOR = 0.25;
const CLOUD_DRIFT_PX_PER_SEC = 8;
const CLOUD_ALPHA = 0.55;
const GRADE_ALPHA = 0.06;
const GRADE_DEPTH = 85;
const DEPTH_BG = -20;
const DEPTH_CLOUDS = -18;
const DEPTH_AMBIENCE = -8;
// §25：ambience 同屏 ≤8 顆、低頻生成。
const AMBIENCE_MAX = 8;
const AMBIENCE_FREQ_MS = 1400;

const AMB_TEXTURES = {
  petal: 'bg-amb-petal',
  wisp: 'bg-amb-wisp',
  mote: 'bg-amb-mote',
  dot: 'bg-amb-dot',
} as const;

interface AmbienceSpec {
  texture: string;
  tint: number[];
  blend: 'ADD' | 'NORMAL';
  alpha: number;
  scale: { start: number; end: number };
  speedY: { min: number; max: number };
  tumble: boolean;
}

interface ThemeSpec {
  grade: number;
  ambience: AmbienceSpec;
}

// v8 貼圖重用別名（§55）：L6 迴聲石廊重用星空回廊橫景，以 grade/ambience 變化辨識。
// v9（§60）：L8 磁極洞窟重用蝕月夜景、L9 鏡影迴廊重用星空回廊，均不生成新背景。
// v10（§65/§66）：L10 幽光晶湖重用星空回廊、L11 磁晶險徑重用蝕月夜景，均以 grade 區分。
const TEXTURE_ALIAS: Record<string, string> = {
  'bg-gallery': 'bg-arena',
  'bg-cavern': 'bg-eclipse',
  'bg-mirror': 'bg-arena',
  'bg-lumen': 'bg-arena',
  'bg-magnetic': 'bg-eclipse',
};

function textureKeyOf(bgKey: string): string {
  return `${TEXTURE_ALIAS[bgKey] ?? bgKey}-l`;
}

// 主題以關卡 bgKey 索引（§25：花瓣/雲絮/星塵/金塵；分級 tint 統一 alpha 0.06）。
const THEMES: Record<string, ThemeSpec> = {
  'bg-meadow': {
    grade: 0x8fe0a8,
    ambience: {
      texture: AMB_TEXTURES.petal,
      tint: [0xffb3c7, 0xffd1e0, 0xffe9f2],
      blend: 'NORMAL',
      alpha: 0.85,
      scale: { start: 1, end: 0.7 },
      speedY: { min: 32, max: 58 },
      tumble: true,
    },
  },
  'bg-heights': {
    grade: 0x9ec9ff,
    ambience: {
      texture: AMB_TEXTURES.wisp,
      tint: [0xffffff],
      blend: 'NORMAL',
      alpha: 0.5,
      scale: { start: 1.15, end: 0.8 },
      speedY: { min: 18, max: 34 },
      tumble: false,
    },
  },
  'bg-arena': {
    grade: 0xb28bf0,
    ambience: {
      texture: AMB_TEXTURES.mote,
      tint: [0xcbb7f0, 0xfff3b0, 0xa78bfa],
      blend: 'ADD',
      alpha: 0.9,
      scale: { start: 0.9, end: 0.3 },
      speedY: { min: 22, max: 40 },
      tumble: true,
    },
  },
  'bg-throne': {
    grade: 0xdfae4e,
    ambience: {
      texture: AMB_TEXTURES.dot,
      tint: [0xffd966, 0xffe9a8],
      blend: 'ADD',
      alpha: 0.85,
      scale: { start: 0.85, end: 0.25 },
      speedY: { min: 16, max: 30 },
      tumble: false,
    },
  },
  // v8 新 biome（§55）：峽谷暖風絮／石廊回聲光塵／蝕月銀星塵。
  'bg-canyon': {
    grade: 0xf0b088,
    ambience: {
      texture: AMB_TEXTURES.wisp,
      tint: [0xfff1e0, 0xffe3ce],
      blend: 'NORMAL',
      alpha: 0.45,
      scale: { start: 1.1, end: 0.7 },
      speedY: { min: 20, max: 38 },
      tumble: false,
    },
  },
  'bg-gallery': {
    grade: 0x8a6fd0,
    ambience: {
      texture: AMB_TEXTURES.mote,
      tint: [0xa8c8f0, 0xd8e8ff, 0xc9b8ff],
      blend: 'ADD',
      alpha: 0.9,
      scale: { start: 0.9, end: 0.3 },
      speedY: { min: 24, max: 42 },
      tumble: true,
    },
  },
  'bg-eclipse': {
    grade: 0x4e4478,
    ambience: {
      texture: AMB_TEXTURES.dot,
      tint: [0xd8d0f0, 0xffe9a8],
      blend: 'ADD',
      alpha: 0.85,
      scale: { start: 0.8, end: 0.25 },
      speedY: { min: 14, max: 26 },
      tumble: false,
    },
  },
  // v9 新 biome（§60）：磁極洞窟鋼藍磁塵／鏡影迴廊銀鏡光塵。
  'bg-cavern': {
    grade: 0x6a80c8,
    ambience: {
      texture: AMB_TEXTURES.dot,
      tint: [0x8ab0e8, 0xd8e0f5],
      blend: 'ADD',
      alpha: 0.85,
      scale: { start: 0.75, end: 0.25 },
      speedY: { min: 16, max: 30 },
      tumble: false,
    },
  },
  'bg-mirror': {
    grade: 0xb8c8e0,
    ambience: {
      texture: AMB_TEXTURES.mote,
      tint: [0xf0f4ff, 0xd8dce8, 0xc9d8ff],
      blend: 'ADD',
      alpha: 0.9,
      scale: { start: 0.9, end: 0.3 },
      speedY: { min: 22, max: 40 },
      tumble: true,
    },
  },
  // v10 新 biome（§65/§66）：幽光晶湖冰青湖光塵／磁晶險徑磁紫晶塵。
  'bg-lumen': {
    grade: 0x5fd0c8,
    ambience: {
      texture: AMB_TEXTURES.mote,
      tint: [0x9fe8d8, 0xdffff5, 0x7fd8c8],
      blend: 'ADD',
      alpha: 0.9,
      scale: { start: 0.85, end: 0.3 },
      speedY: { min: 18, max: 34 },
      tumble: true,
    },
  },
  'bg-magnetic': {
    grade: 0x7a6ad0,
    ambience: {
      texture: AMB_TEXTURES.dot,
      tint: [0xb0a0e8, 0x8ab0e8, 0xd8d0f0],
      blend: 'ADD',
      alpha: 0.85,
      scale: { start: 0.75, end: 0.25 },
      speedY: { min: 16, max: 30 },
      tumble: false,
    },
  },
};

function ensureAmbienceTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(AMB_TEXTURES.petal)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(7, 5, 13, 8);
    g.generateTexture(AMB_TEXTURES.petal, 14, 10);
    g.destroy();
  }
  if (!scene.textures.exists(AMB_TEXTURES.wisp)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(13, 6, 26, 11);
    g.fillStyle(0xffffff, 0.75);
    g.fillEllipse(13, 6, 18, 7);
    g.generateTexture(AMB_TEXTURES.wisp, 26, 12);
    g.destroy();
  }
  if (!scene.textures.exists(AMB_TEXTURES.mote)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    fillStarPath(g, 6, 6, 6, 2.6);
    g.generateTexture(AMB_TEXTURES.mote, 12, 12);
    g.destroy();
  }
  if (!scene.textures.exists(AMB_TEXTURES.dot)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture(AMB_TEXTURES.dot, 6, 6);
    g.destroy();
  }
}

// 512 高圖以 cover 邏輯等比放大貼齊畫布（高度主導 480/512），藝術底帶對齊世界地面。
// 視寬動態（§28）：一律讀當下 scale 尺寸，禁硬編 854。
function coverScale(scene: Phaser.Scene, key: string): number {
  const src = scene.textures.get(key).getSourceImage() as { width: number; height: number };
  return Math.max(scene.scale.width / src.width, scene.scale.height / src.height);
}

function addCoverTile(scene: Phaser.Scene, key: string): Phaser.GameObjects.TileSprite {
  const tile = scene.add
    .tileSprite(0, 0, scene.scale.width, scene.scale.height, key)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(DEPTH_BG);
  tile.setTileScale(coverScale(scene, key));
  return tile;
}

function addClouds(scene: Phaser.Scene): Phaser.GameObjects.TileSprite {
  return scene.add
    .tileSprite(0, 4, scene.scale.width, 256, 'fx-clouds')
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(DEPTH_CLOUDS)
    .setAlpha(CLOUD_ALPHA);
}

// 粒子走世界座標：x 於發射當下讀取相機捲動，落下後相機自然掠過（同 fx.ts inhale 模式）。
function addAmbience(
  scene: Phaser.Scene,
  spec: AmbienceSpec,
): Phaser.GameObjects.Particles.ParticleEmitter {
  ensureAmbienceTextures(scene);
  return scene.add
    .particles(0, 0, spec.texture, {
      x: () => scene.cameras.main.scrollX + Phaser.Math.Between(-30, scene.scale.width + 30),
      y: -16,
      speedY: { min: spec.speedY.min, max: spec.speedY.max },
      speedX: { min: -16, max: 16 },
      scale: { start: spec.scale.start, end: spec.scale.end },
      alpha: { start: spec.alpha, end: 0, ease: 'Quad.easeIn' },
      rotate: spec.tumble ? { start: 0, end: 200 } : 0,
      lifespan: { min: 8000, max: 11000 },
      frequency: AMBIENCE_FREQ_MS,
      quantity: 1,
      blendMode: spec.blend,
      tint: spec.tint,
      maxAliveParticles: AMBIENCE_MAX,
    })
    .setDepth(DEPTH_AMBIENCE);
}

function addGrade(scene: Phaser.Scene, color: number): Phaser.GameObjects.Rectangle {
  const { width, height } = scene.scale;
  return scene.add
    .rectangle(width / 2, height / 2, width, height, color, GRADE_ALPHA)
    .setScrollFactor(0)
    .setDepth(GRADE_DEPTH);
}

// 視寬變更重排（§28 resize 回呼）：滿版元素（平鋪層/雲層/分級/單張 cover）依新視寬調整，
// 場景 shutdown 時解除監聽。
function bindViewResize(scene: Phaser.Scene, relayout: () => void): () => void {
  scene.scale.on('resize', relayout);
  const off = () => scene.scale.off('resize', relayout);
  scene.events.once('shutdown', off);
  return off;
}

// 一站式關卡背景：平鋪關雙層視差（近景 0.6 / 遠景雲 0.25 + 自漂移）；魔王關單張置中 cover。
export function createParallaxBackground(scene: Phaser.Scene, level: LevelSpec): BackgroundHandle {
  const key = textureKeyOf(level.bgKey);
  const theme = THEMES[level.bgKey];
  const objects: Phaser.GameObjects.GameObject[] = [];
  let near: Phaser.GameObjects.TileSprite | null = null;
  let clouds: Phaser.GameObjects.TileSprite | null = null;
  let nearScale = 1;
  let driftMs = 0;
  let destroyed = false;

  let fallback: Phaser.GameObjects.Rectangle | null = null;
  let bossImg: Phaser.GameObjects.Image | null = null;
  let grade: Phaser.GameObjects.Rectangle | null = null;

  if (!scene.textures.exists(key)) {
    const { width, height } = scene.scale;
    fallback = scene.add
      .rectangle(width / 2, height / 2, width, height, 0xd6ecff)
      .setScrollFactor(0)
      .setDepth(DEPTH_BG);
    objects.push(fallback);
  } else if (level.boss) {
    bossImg = scene.add
      .image(scene.scale.width / 2, scene.scale.height / 2, key)
      .setScrollFactor(0)
      .setDepth(DEPTH_BG);
    bossImg.setScale(coverScale(scene, key));
    objects.push(bossImg);
  } else {
    near = addCoverTile(scene, key);
    nearScale = near.tileScaleX;
    clouds = addClouds(scene);
    objects.push(near, clouds);
  }

  if (theme) {
    objects.push(addAmbience(scene, theme.ambience));
    grade = addGrade(scene, theme.grade);
    objects.push(grade);
  }

  const offResize = bindViewResize(scene, () => {
    const { width, height } = scene.scale;
    near?.setSize(width, height);
    clouds?.setSize(width, 256);
    fallback?.setPosition(width / 2, height / 2).setSize(width, height);
    grade?.setPosition(width / 2, height / 2).setSize(width, height);
    if (bossImg) bossImg.setPosition(width / 2, height / 2).setScale(coverScale(scene, key));
  });

  return {
    update(deltaMs: number): void {
      if (destroyed) return;
      driftMs += deltaMs;
      const scrollX = scene.cameras.main.scrollX;
      // tilePosition 以紋理像素計，除以 tileScale 使螢幕視差係數精確為 0.6 / 0.25。
      if (near) near.tilePositionX = (scrollX * NEAR_FACTOR) / nearScale;
      if (clouds) {
        clouds.tilePositionX = scrollX * FAR_FACTOR + (driftMs / 1000) * CLOUD_DRIFT_PX_PER_SEC;
      }
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      offResize();
      objects.forEach((obj) => obj.destroy());
      objects.length = 0;
    },
  };
}

export interface MenuBackdropOptions {
  bgKey: string;
  autoScrollPxPerSec?: number;
  clouds?: boolean;
  ambience?: string;
}

// 選單背景（Title / Result）：無相機捲動，平鋪緩慢自捲動 + 雲層漂移 + 可選 ambience。
export function createMenuBackdrop(
  scene: Phaser.Scene,
  options: MenuBackdropOptions,
): BackgroundHandle {
  const key = `${options.bgKey}-l`;
  const autoScroll = options.autoScrollPxPerSec ?? 0;
  const objects: Phaser.GameObjects.GameObject[] = [];
  let tile: Phaser.GameObjects.TileSprite | null = null;
  let clouds: Phaser.GameObjects.TileSprite | null = null;
  let tileScale = 1;
  let driftMs = 0;
  let destroyed = false;

  if (scene.textures.exists(key)) {
    tile = addCoverTile(scene, key);
    tileScale = tile.tileScaleX;
    objects.push(tile);
    if (options.clouds) {
      clouds = addClouds(scene);
      objects.push(clouds);
    }
  }
  const theme = options.ambience ? THEMES[options.ambience] : undefined;
  if (theme) objects.push(addAmbience(scene, theme.ambience));

  const offResize = bindViewResize(scene, () => {
    const { width, height } = scene.scale;
    tile?.setSize(width, height);
    clouds?.setSize(width, 256);
  });

  return {
    update(deltaMs: number): void {
      if (destroyed) return;
      driftMs += deltaMs;
      if (tile) tile.tilePositionX = ((driftMs / 1000) * autoScroll) / tileScale;
      if (clouds) clouds.tilePositionX = (driftMs / 1000) * CLOUD_DRIFT_PX_PER_SEC;
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      offResize();
      objects.forEach((obj) => obj.destroy());
      objects.length = 0;
    },
  };
}
