import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import type * as AssetLoader from './assetLoader';
import type { AssetEntry } from './assets';

// 分階段載入執行層契約（§115）：本檔鎖住「佔位色塊 vs 正式立繪」逐出邏輯與失敗降級
// ——兩者都是玩家看得到的路徑（缺圖／卡在載入畫面），且無法由 assetPlan 純測涵蓋。
// scene 替身沿 voidra.test.ts／player.test.ts 的 `as unknown as Phaser.Scene` 慣例。

type Handler = (...args: unknown[]) => void;

interface FakeScene {
  scene: Phaser.Scene;
  textures: { exists(key: string): boolean; keys: Set<string> };
  loaded: { key: string; url: string }[];
  removed: string[];
  labelText(): string;
  destroyed(): number;
  emit(event: string, ...args: unknown[]): void;
  loadCompleteCalls(): number;
}

function createFakeScene(existing: readonly string[] = []): FakeScene {
  const keys = new Set(existing);
  const loaded: { key: string; url: string }[] = [];
  const removed: string[] = [];
  const handlers = new Map<string, Handler[]>();
  const onceHandlers = new Map<string, Handler[]>();
  let labelText = '';
  let destroyed = 0;
  let loadCompleteCalls = 0;

  const emit = (event: string, ...args: unknown[]): void => {
    for (const handler of handlers.get(event) ?? []) handler(...args);
    const once = onceHandlers.get(event) ?? [];
    onceHandlers.set(event, []);
    for (const handler of once) handler(...args);
  };

  const load = {
    image: (key: string, url: string) => loaded.push({ key, url }),
    on: (event: string, handler: Handler) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    },
    once: (event: string, handler: Handler) => {
      onceHandlers.set(event, [...(onceHandlers.get(event) ?? []), handler]);
    },
    off: (event: string, handler: Handler) => {
      handlers.set(
        event,
        (handlers.get(event) ?? []).filter((h) => h !== handler),
      );
    },
    // 真實 loadComplete 會清佇列、progress 補 1 並發出 complete；替身只保留可觀測行為。
    loadComplete: () => {
      loadCompleteCalls += 1;
      emit('complete');
    },
  };

  // 顯示物件替身：鏈式 setter 回傳自身、destroy 計數（沿 voidra.test.ts chainable 慣例）。
  const rectangle = () => {
    const rect = {
      width: 0,
      destroy: () => (destroyed += 1),
      setStrokeStyle: () => rect,
      setOrigin: () => rect,
    };
    return rect;
  };
  const text = (_x: number, _y: number, initial: string) => {
    labelText = initial;
    const txt = {
      destroy: () => (destroyed += 1),
      setOrigin: () => txt,
      setText: (next: string) => {
        labelText = next;
        return txt;
      },
    };
    return txt;
  };

  const scene = {
    scale: { width: 854, height: 480 },
    textures: {
      exists: (key: string) => keys.has(key),
      remove: (key: string) => {
        removed.push(key);
        keys.delete(key);
      },
    },
    load,
    add: { rectangle, text },
  };

  return {
    scene: scene as unknown as Phaser.Scene,
    textures: { exists: (key: string) => keys.has(key), keys },
    loaded,
    removed,
    labelText: () => labelText,
    destroyed: () => destroyed,
    emit,
    loadCompleteCalls: () => loadCompleteCalls,
  };
}

const entry = (key: string): AssetEntry => ({ key, url: `${key}.webp`, phase: 'level' });

// 模組級 fromManifest 跨 scene 常駐：每案重載模組隔離（沿 settings.test.ts／
// mute.test.ts 的 resetModules 慣例，不為測試在產品碼開後門）。
async function freshLoader(): Promise<typeof AssetLoader> {
  vi.resetModules();
  return import('./assetLoader');
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('佔位色塊逐出', () => {
  it('未載過的鍵直接排入載入佇列', async () => {
    const { loadAssets } = await freshLoader();
    const fake = createFakeScene();
    loadAssets(fake.scene, [entry('minion-jelly')]);
    expect(fake.loaded).toEqual([{ key: 'minion-jelly', url: 'minion-jelly.webp' }]);
    expect(fake.removed).toEqual([]);
  });

  it('非 manifest 來源的既有貼圖（enemies 佔位色塊）先移除再載正式立繪', async () => {
    const { loadAssets } = await freshLoader();
    const fake = createFakeScene(['minion-magno']);
    loadAssets(fake.scene, [entry('minion-magno')]);
    expect(fake.removed).toEqual(['minion-magno']);
    expect(fake.loaded.map((f) => f.key)).toEqual(['minion-magno']);
  });

  it('已自 manifest 載成功的鍵不重複載入也不被移除', async () => {
    const { loadAssets } = await freshLoader();
    const first = createFakeScene();
    loadAssets(first.scene, [entry('bg-kiln-l')]);
    first.emit('filecomplete', 'bg-kiln-l');
    first.emit('complete');

    const second = createFakeScene(['bg-kiln-l']);
    loadAssets(second.scene, [entry('bg-kiln-l')]);
    expect(second.loaded).toEqual([]);
    expect(second.removed).toEqual([]);
  });

  it('載入失敗的鍵不記為 manifest 來源，下次進關仍會逐出佔位重試', async () => {
    const { loadAssets } = await freshLoader();
    const first = createFakeScene();
    loadAssets(first.scene, [entry('boss-syrona')]);
    first.emit('loaderror', { key: 'boss-syrona' });
    first.emit('complete');

    // create 期 enemies/boss 為缺圖生成佔位色塊，佔用同一鍵。
    const second = createFakeScene(['boss-syrona']);
    loadAssets(second.scene, [entry('boss-syrona')]);
    expect(second.removed).toEqual(['boss-syrona']);
    expect(second.loaded.map((f) => f.key)).toEqual(['boss-syrona']);
  });
});

describe('失敗與逾時降級（anti-softlock）', () => {
  it('全數已快取時不建立載入 UI 也不掛逾時', async () => {
    const { loadAssets } = await freshLoader();
    const first = createFakeScene();
    loadAssets(first.scene, [entry('fx-star')]);
    first.emit('filecomplete', 'fx-star');
    first.emit('complete');

    const second = createFakeScene(['fx-star']);
    loadAssets(second.scene, [entry('fx-star')]);
    expect(second.destroyed()).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(second.loadCompleteCalls()).toBe(0);
  });

  it('loaderror 明說降級而非停在「載入中…」', async () => {
    const { loadAssets } = await freshLoader();
    const fake = createFakeScene();
    loadAssets(fake.scene, [entry('minion-chompy')]);
    expect(fake.labelText()).toBe('載入中…');
    fake.emit('loaderror', { key: 'minion-chompy' });
    expect(fake.labelText()).toBe('部分素材載入失敗，將以簡易圖示續玩');
  });

  it('請求永久 pending 時停滯逾時強制收尾，玩家不會卡在載入畫面', async () => {
    const { loadAssets } = await freshLoader();
    const fake = createFakeScene();
    loadAssets(fake.scene, [entry('bg-astral-l')]);
    // 永不觸發任何事件：模擬請求掛起。
    vi.advanceTimersByTime(19_000);
    expect(fake.loadCompleteCalls()).toBe(0);
    vi.advanceTimersByTime(1_500);
    expect(fake.loadCompleteCalls()).toBe(1);
    expect(fake.labelText()).toBe('載入逾時，將以簡易圖示續玩');
    // 收尾一併拆掉載入 UI（外框／進度條／文字三件）。
    expect(fake.destroyed()).toBe(3);
  });

  it('慢網持續有進度時不誤判掛死——單關 600KB 在 Slow 3G 可能遠超停滯門檻', async () => {
    const { loadAssets } = await freshLoader();
    const fake = createFakeScene();
    loadAssets(fake.scene, [entry('bg-astral-l')]);
    // 每 15 秒推進一點進度，總時長 90 秒（遠超 20 秒停滯門檻）仍不得被降級。
    for (let elapsed = 0; elapsed < 90_000; elapsed += 15_000) {
      vi.advanceTimersByTime(15_000);
      fake.emit('progress', elapsed / 90_000);
      expect(fake.loadCompleteCalls()).toBe(0);
    }
    expect(fake.labelText()).toBe('載入中…');
  });

  it('進度極慢仍會被硬上限接住（anti-softlock 兜底）', async () => {
    const { loadAssets } = await freshLoader();
    const fake = createFakeScene();
    loadAssets(fake.scene, [entry('bg-astral-l')]);
    for (let elapsed = 0; elapsed < 130_000; elapsed += 10_000) {
      vi.advanceTimersByTime(10_000);
      fake.emit('progress', 0.01);
    }
    expect(fake.loadCompleteCalls()).toBeGreaterThanOrEqual(1);
  });

  it('逾時收尾後才抵達的檔案不記為 manifest 來源（該幀已用佔位色塊）', async () => {
    const { loadAssets } = await freshLoader();
    const first = createFakeScene();
    loadAssets(first.scene, [entry('boss-prismix')]);
    vi.advanceTimersByTime(21_000);
    expect(first.loadCompleteCalls()).toBe(1);
    // in-flight 檔案晚到：監聽已於 complete 清理時解除，不得誤記。
    first.emit('filecomplete', 'boss-prismix');

    const second = createFakeScene(['boss-prismix']);
    loadAssets(second.scene, [entry('boss-prismix')]);
    expect(second.removed).toEqual(['boss-prismix']);
    expect(second.loaded.map((f) => f.key)).toEqual(['boss-prismix']);
  });

  it('正常完成後解除逾時，不會事後誤觸強制收尾', async () => {
    const { loadAssets } = await freshLoader();
    const fake = createFakeScene();
    loadAssets(fake.scene, [entry('prop-kiln-1')]);
    fake.emit('filecomplete', 'prop-kiln-1');
    fake.emit('complete');
    expect(fake.destroyed()).toBe(3);
    vi.advanceTimersByTime(60_000);
    expect(fake.loadCompleteCalls()).toBe(0);
  });
});
