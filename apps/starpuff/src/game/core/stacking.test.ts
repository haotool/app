import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// 堆疊順序守門（#959）：修前各層 z-index 為散落字面值且無序——設定頁（45）低於
// 暫停覆層（50），自暫停開啟設定會被整片遮蔽。該症狀同時是「行動裝置設定被遮蔽」
// 與「暫停中無法改設定」兩個回報的共同根因。
// 本組直接讀 style.css 斷言尺標與消費端，使「模態必須高於暫停」成為可執行契約。

const CSS = readFileSync(fileURLToPath(new URL('../../style.css', import.meta.url)), 'utf8');

function tokenValue(name: string): number {
  const match = new RegExp(`--${name}:\\s*(\\d+)`).exec(CSS);
  expect(match, `缺少堆疊尺標 --${name}`).not.toBeNull();
  return Number(match?.[1]);
}

// 取某選擇器區塊內的 z-index 宣告（僅支援本檔用到的單一選擇器區塊）。
function zIndexOf(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(CSS);
  expect(block, `找不到選擇器 ${selector}`).not.toBeNull();
  const zi = /z-index:\s*([^;]+);/.exec(block?.[1] ?? '');
  expect(zi, `${selector} 未宣告 z-index`).not.toBeNull();
  return (zi?.[1] ?? '').trim();
}

describe('堆疊尺標（#959）', () => {
  it('尺標嚴格遞增：控制層 < 暫停 < 模態', () => {
    const controls = tokenValue('z-controls');
    const pause = tokenValue('z-pause');
    const modal = tokenValue('z-modal');
    expect(controls).toBeLessThan(pause);
    expect(pause).toBeLessThan(modal);
  });

  it('暫停覆層消費 --z-pause 尺標，不用字面值', () => {
    expect(zIndexOf('.pause-overlay')).toBe('var(--z-pause)');
  });

  // 這兩者是根因所在：自暫停開啟時必須蓋在暫停覆層之上。
  it('設定頁與按鍵配置頁消費 --z-modal 尺標', () => {
    expect(zIndexOf('.settings-overlay')).toBe('var(--z-modal)');
    expect(zIndexOf('.cfg-overlay')).toBe('var(--z-modal)');
  });

  it('反證：模態層若不高於暫停層則契約破裂', () => {
    expect(tokenValue('z-modal')).toBeGreaterThan(tokenValue('z-pause'));
  });
});
