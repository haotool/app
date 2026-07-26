import type Phaser from 'phaser';
import type { AssetEntry } from './assets';

// 分階段載入執行層（§115）：把 assetPlan 算出的條目排進 scene loader，並提供
// 統一的載入回饋。任何 scene 一律走此單點，禁止各自呼叫 this.load.image。

// systems/enemies.ts 於 create 期會為缺圖品種生成佔位色塊，佔用同一貼圖鍵；
// Phaser loader 遇既有鍵會直接跳過，正式立繪將永遠載不進來。載入前先移除佔位。
const fromManifest = new Set<string>();

function queue(scene: Phaser.Scene, entries: readonly AssetEntry[]): number {
  let queued = 0;
  for (const { key, url } of entries) {
    if (scene.textures.exists(key)) {
      if (fromManifest.has(key)) continue;
      scene.textures.remove(key);
    }
    scene.load.image(key, url);
    fromManifest.add(key);
    queued += 1;
  }
  return queued;
}

// 載入回饋（§115）：任何非瞬時載入都必須看得到進度，絕不留無回饋黑畫面。
function showProgress(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const barWidth = width * 0.6;
  const barHeight = 14;
  const y = height / 2;

  const frame = scene.add
    .rectangle(width / 2, y, barWidth + 8, barHeight + 8)
    .setStrokeStyle(2, 0x8ad9be);
  const fill = scene.add
    .rectangle((width - barWidth) / 2, y, 1, barHeight, 0xbff3e0)
    .setOrigin(0, 0.5);
  const label = scene.add
    .text(width / 2, y + 34, '載入中…', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: '#5a4390',
    })
    .setOrigin(0.5);

  const onProgress = (value: number): void => {
    fill.width = Math.max(1, barWidth * value);
  };
  scene.load.on('progress', onProgress);
  scene.load.once('complete', () => {
    scene.load.off('progress', onProgress);
    frame.destroy();
    fill.destroy();
    label.destroy();
  });
}

// 排入待載條目並在有實際下載時顯示進度；已在快取者零成本略過。
export function loadAssets(scene: Phaser.Scene, entries: readonly AssetEntry[]): void {
  if (queue(scene, entries) > 0) showProgress(scene);
}

// 測試用重置：貼圖鍵註冊表跨 scene 常駐，單元測試需可回到乾淨狀態。
export function resetLoadedKeys(): void {
  fromManifest.clear();
}
