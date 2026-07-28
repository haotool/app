import type Phaser from 'phaser';
import { ENEMY_TEXTURE_KEYS } from '../core/assetPlan';
import { ENEMY_SIZE } from '../core/config';
import type { EnemyKind } from '../core/types';

// 小怪佔位色塊與 hazards 程序化材質（GAME_DESIGN §10/§16 缺圖保底）：自 enemies.ts
// 機械式搬移（§125 前置 1200 行閘分檔），烘焙內容零改變；貼圖鍵/尺寸常數為
// enemies.ts spawner 與本檔烘焙共用 SSOT，一律由本檔匯出。

export const FALLBACK_COLORS: Record<EnemyKind, number> = {
  jelly: 0xffb3c7,
  floaty: 0xcbb7f0,
  spiky: 0xd9f29b,
  puffy: 0xffa8a0,
  chompy: 0xf5e6a8,
  shelly: 0x7fd8c8,
  zappy: 0xe8d88a,
  drilly: 0xd8a26b,
  glowy: 0xffe9a8,
  spora: 0xa8d8a0,
  gusty: 0xa8cbf0,
  boomy: 0xe8a878,
  magno: 0x8a98c8,
  mirri: 0xd8dce8,
  bubbla: 0xf2b26b,
  splatta: 0xc88850,
  twinkla: 0xf5e6b8,
  cometa: 0x9fd8f0,
  cargo: 0xd8a888,
  ticketa: 0xf0d8a0,
  scanna: 0xe89ab0,
  foamy: 0xbfe8f0,
  frosty: 0xcfeeff,
  manta: 0x8ac8e8,
  copypuff: 0xd8cdeb,
  prismbee: 0xf0c8e8,
  datamote: 0xc0d8f0,
  gravitybub: 0xa890e0,
  orbiton: 0x8878c8,
  riftling: 0xb0a0e8,
  bearlet: 0xc89890,
  bullrun: 0xf0c060,
  bearmarket: 0x7858a8,
};

// puffy 爆刺彈貼圖（§16）。
export const SPIKE_TEX = 'hazard-spike';
export const SPIKE_SIZE = 12;
// v8 hazards（§52）：孢子雲滯留區與迴旋殼刃。
export const SPORE_TEX = 'hazard-spore';
export const SPORE_SIZE = 28;
export const SHELL_TEX = 'hazard-shell';
export const SHELL_SIZE = 22;
// v11 hazards（§73）：splatta 拋物糖球與落地灼燙糖斑。
export const BLOB_TEX = 'hazard-blob';
export const BLOB_SIZE = 18;
// §120 hazards：foamy 漂浮泡泡（不傷人上浮拒止）。
export const BUBBLE_TEX = 'hazard-bubble';
export const BUBBLE_SIZE = 30;
// §125 hazards：熊市怪地面震波（拍地雙側波／低血甦醒全場波，跳躍迴避）。
export const MARKET_WAVE_TEX = 'hazard-marketwave';
export const MARKET_WAVE_W = 26;
export const MARKET_WAVE_H = 20;

// 缺圖保底與 hazards 材質單點烘焙：createEnemySystem 進場呼叫一次（冪等）。
export function ensureEnemyTextures(scene: Phaser.Scene): void {
  for (const kind of Object.keys(ENEMY_TEXTURE_KEYS) as EnemyKind[]) {
    if (!scene.textures.exists(ENEMY_TEXTURE_KEYS[kind])) {
      scene.add
        .graphics()
        .fillStyle(FALLBACK_COLORS[kind])
        .fillRoundedRect(0, 0, ENEMY_SIZE, ENEMY_SIZE, 12)
        .generateTexture(ENEMY_TEXTURE_KEYS[kind], ENEMY_SIZE, ENEMY_SIZE)
        .destroy();
    }
  }
  if (!scene.textures.exists(SPIKE_TEX)) {
    scene.add
      .graphics()
      .fillStyle(0xffa8a0)
      .fillTriangle(SPIKE_SIZE / 2, 0, SPIKE_SIZE, SPIKE_SIZE / 2, 0, SPIKE_SIZE / 2)
      .fillTriangle(0, SPIKE_SIZE / 2, SPIKE_SIZE, SPIKE_SIZE / 2, SPIKE_SIZE / 2, SPIKE_SIZE)
      .generateTexture(SPIKE_TEX, SPIKE_SIZE, SPIKE_SIZE)
      .destroy();
  }
  // 孢子雲（§52）：柔和三圓簇孢子團。
  if (!scene.textures.exists(SPORE_TEX)) {
    scene.add
      .graphics()
      .fillStyle(0xbce8a0, 0.85)
      .fillCircle(SPORE_SIZE / 2, SPORE_SIZE / 2, SPORE_SIZE / 2 - 2)
      .fillStyle(0xa8d8a0, 0.9)
      .fillCircle(SPORE_SIZE / 2 - 7, SPORE_SIZE / 2 + 4, 8)
      .fillCircle(SPORE_SIZE / 2 + 7, SPORE_SIZE / 2 + 3, 7)
      .generateTexture(SPORE_TEX, SPORE_SIZE, SPORE_SIZE)
      .destroy();
  }
  // 迴旋殼刃（§52）：雙圓疊色殼片，旋轉由 update 迴圈驅動。
  if (!scene.textures.exists(SHELL_TEX)) {
    scene.add
      .graphics()
      .fillStyle(0xe8a878, 1)
      .fillCircle(SHELL_SIZE / 2, SHELL_SIZE / 2, SHELL_SIZE / 2 - 1)
      .fillStyle(0xf5d8b8, 1)
      .fillCircle(SHELL_SIZE / 2 + 5, SHELL_SIZE / 2 - 3, SHELL_SIZE / 2 - 7)
      .generateTexture(SHELL_TEX, SHELL_SIZE, SHELL_SIZE)
      .destroy();
  }
  // 泡泡（§120）：淡藍空心圓＋高光點。
  if (!scene.textures.exists(BUBBLE_TEX)) {
    scene.add
      .graphics()
      .fillStyle(0xbfe8f0, 0.35)
      .fillCircle(BUBBLE_SIZE / 2, BUBBLE_SIZE / 2, BUBBLE_SIZE / 2 - 2)
      .lineStyle(2, 0xdff6ff, 0.9)
      .strokeCircle(BUBBLE_SIZE / 2, BUBBLE_SIZE / 2, BUBBLE_SIZE / 2 - 2)
      .fillStyle(0xffffff, 0.8)
      .fillCircle(BUBBLE_SIZE / 2 - 5, BUBBLE_SIZE / 2 - 6, 3)
      .generateTexture(BUBBLE_TEX, BUBBLE_SIZE, BUBBLE_SIZE)
      .destroy();
  }
  // 糖球（§73）：焦糖雙圓滴珠；落地轉灼燙糖斑（同貼圖壓扁著色）。
  if (!scene.textures.exists(BLOB_TEX)) {
    scene.add
      .graphics()
      .fillStyle(0xc88850, 1)
      .fillCircle(BLOB_SIZE / 2, BLOB_SIZE / 2, BLOB_SIZE / 2 - 1)
      .fillStyle(0xe8b070, 0.95)
      .fillCircle(BLOB_SIZE / 2 - 3, BLOB_SIZE / 2 - 3, BLOB_SIZE / 2 - 6)
      .generateTexture(BLOB_TEX, BLOB_SIZE, BLOB_SIZE)
      .destroy();
  }
  // 市場震波（§125 熊市怪）：深紫地面波峰（雙弧疊層），行進由生成端賦速。
  if (!scene.textures.exists(MARKET_WAVE_TEX)) {
    scene.add
      .graphics()
      .fillStyle(0x7858a8, 0.9)
      .fillTriangle(0, MARKET_WAVE_H, MARKET_WAVE_W / 2, 0, MARKET_WAVE_W, MARKET_WAVE_H)
      .fillStyle(0xa890e0, 0.85)
      .fillTriangle(
        MARKET_WAVE_W * 0.2,
        MARKET_WAVE_H,
        MARKET_WAVE_W / 2,
        MARKET_WAVE_H * 0.35,
        MARKET_WAVE_W * 0.8,
        MARKET_WAVE_H,
      )
      .generateTexture(MARKET_WAVE_TEX, MARKET_WAVE_W, MARKET_WAVE_H)
      .destroy();
  }
}
