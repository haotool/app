import type Phaser from 'phaser';
import type { AssetEntry } from './assets';

// 分階段載入執行層（§115）：把 assetPlan 算出的條目排進 scene loader，並統一負責
// 載入回饋與失敗降級。任何 scene 一律走此單點，禁止各自呼叫 this.load.image。

// 逾時保險（anti-softlock）：請求永久 pending 時 Phaser 不會結束 preload，玩家會卡在
// 載入畫面且無法自行脫離。逾時強制收尾進 create——缺圖走既有佔位降級仍可通關，未取得
// 的資產於下次進關重試。取值須寬到慢速連線能正常載完（Fast 3G 首關實測約 3 秒）。
const LOAD_TIMEOUT_MS = 20_000;

// systems/enemies.ts 於 create 期會為缺圖品種生成佔位色塊，佔用同一貼圖鍵；Phaser
// loader 遇既有鍵會直接跳過，正式立繪將永遠載不進來。載入前先移除佔位。
// 只記錄「確實載入成功」的鍵：若把排入即記為 manifest 來源，載入失敗後生成的佔位
// 色塊會被誤認為正式立繪而永不替換。
const fromManifest = new Set<string>();

function queue(scene: Phaser.Scene, entries: readonly AssetEntry[]): number {
  let queued = 0;
  for (const { key, url } of entries) {
    if (scene.textures.exists(key)) {
      if (fromManifest.has(key)) continue;
      scene.textures.remove(key);
    }
    scene.load.image(key, url);
    queued += 1;
  }
  return queued;
}

// 載入期回饋（§115）：任何非瞬時載入都必須看得到進度，絕不留無回饋黑畫面；
// 失敗與逾時一律明說並續玩，不讓玩家對著不會動的進度條猜。
function attachLoading(scene: Phaser.Scene): void {
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
  const onFileComplete = (key: string): void => {
    fromManifest.add(key);
  };
  const onLoadError = (): void => {
    label.setText('部分素材載入失敗，將以簡易圖示續玩');
  };
  const timeout = setTimeout(() => {
    label.setText('載入逾時，將以簡易圖示續玩');
    // 強制收尾：清空佇列、progress 補 1 並發出 complete，場景照常進 create。
    scene.load.loadComplete();
  }, LOAD_TIMEOUT_MS);

  scene.load.on('progress', onProgress);
  scene.load.on('filecomplete', onFileComplete);
  scene.load.on('loaderror', onLoadError);
  scene.load.once('complete', () => {
    clearTimeout(timeout);
    scene.load.off('progress', onProgress);
    scene.load.off('filecomplete', onFileComplete);
    scene.load.off('loaderror', onLoadError);
    frame.destroy();
    fill.destroy();
    label.destroy();
  });
}

// 排入待載條目並在有實際下載時顯示進度；已在快取者零成本略過。
export function loadAssets(scene: Phaser.Scene, entries: readonly AssetEntry[]): void {
  if (queue(scene, entries) > 0) attachLoading(scene);
}
