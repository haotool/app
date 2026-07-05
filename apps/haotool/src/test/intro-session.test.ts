// @vitest-environment node
/**
 * S1 開場序列 session 閘測試（motion-deep-dive §2 S1）：
 * 直接執行 index.html 的 head 內聯腳本，驗證首次/二次 session 與 sessionStorage 不可用路徑。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { describe, it, expect } from 'vitest';

const html = readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf-8');

function extractIntroScript(): string {
  const match = /<script>\s*([^<]*htl-intro[^<]*)<\/script>/.exec(html);
  if (!match?.[1]) throw new Error('index.html 缺少 S1 session 內聯腳本');
  return match[1];
}

interface SandboxResult {
  dataset: Record<string, string>;
  store: Map<string, string>;
}

function runIntroScript(options: { preset?: string; throws?: boolean } = {}): SandboxResult {
  const store = new Map<string, string>();
  if (options.preset) store.set('htl-intro', options.preset);
  const dataset: Record<string, string> = {};
  const sessionStorage = options.throws
    ? {
        getItem() {
          throw new Error('SecurityError');
        },
        setItem() {
          throw new Error('SecurityError');
        },
      }
    : {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      };

  runInNewContext(extractIntroScript(), {
    sessionStorage,
    document: { documentElement: { dataset } },
  });
  return { dataset, store };
}

describe('S1 session 閘（index.html 內聯腳本）', () => {
  it('首次 session：設定 sessionStorage 並開啟 html[data-intro]', () => {
    const { dataset, store } = runIntroScript();
    expect(dataset['intro']).toBe('1');
    expect(store.get('htl-intro')).toBe('1');
  });

  it('二次造訪（同 session）：不再開啟 data-intro', () => {
    const { dataset } = runIntroScript({ preset: '1' });
    expect(dataset['intro']).toBeUndefined();
  });

  it('sessionStorage 不可用（Safari 私密模式）：靜默略過、完全無動畫', () => {
    expect(() => runIntroScript({ throws: true })).not.toThrow();
    const { dataset } = runIntroScript({ throws: true });
    expect(dataset['intro']).toBeUndefined();
  });

  it('腳本位於 head 且在模組載入前（首繪前執行）', () => {
    const headEnd = html.indexOf('</head>');
    const scriptIndex = html.indexOf('htl-intro');
    expect(scriptIndex).toBeGreaterThan(-1);
    expect(scriptIndex).toBeLessThan(headEnd);
  });
});
