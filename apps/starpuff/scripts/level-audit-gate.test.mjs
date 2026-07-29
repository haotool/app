import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { AUDIT_THRESHOLDS } from '../src/game/logic/difficulty.ts';
import { evaluateClearRateGate } from './level-audit.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// 勝率量化驗收 gate（#890）：先前 level-audit 只輸出 clearRate 供人看，
// 「普通 ≥40%、熟練 ≥80%」這條產品層硬需求沒有任何 enforcement。
describe('勝率門檻 gate（#890）', () => {
  const base = { levelId: 1, nameZh: 'L1', ex: false, runs: AUDIT_THRESHOLDS.clearRateMinRuns };

  it('mid bot 達 40% 過門、未達不過門', () => {
    expect(evaluateClearRateGate({ ...base, bot: 'mid', clearRate: 0.4 }).pass).toBe(true);
    expect(evaluateClearRateGate({ ...base, bot: 'mid', clearRate: 0.2 }).pass).toBe(false);
  });

  it('high bot 達 80% 過門、未達不過門', () => {
    expect(evaluateClearRateGate({ ...base, bot: 'high', clearRate: 0.8 }).pass).toBe(true);
    expect(evaluateClearRateGate({ ...base, bot: 'high', clearRate: 0.6 }).pass).toBe(false);
  });

  it('low bot 不設下限——低階本就該常敗，設下限會反向逼降難度', () => {
    const gate = evaluateClearRateGate({ ...base, bot: 'low', clearRate: 0 });
    expect(gate.applicable).toBe(false);
    expect(gate.pass).toBe(true);
  });

  it('EX 模式不套本門檻（走 exLowPassMaxRate／exHighPassMinRate）', () => {
    const gate = evaluateClearRateGate({ ...base, bot: 'high', ex: true, clearRate: 0.1 });
    expect(gate.applicable).toBe(false);
    expect(gate.pass).toBe(true);
  });

  // 樣本不足判「不過」而非「通過」：否則 --runs 1 就是繞過 gate 的後門。
  it('樣本數低於最小值一律不過門，即使通關率 100%', () => {
    const gate = evaluateClearRateGate({
      ...base,
      bot: 'mid',
      runs: AUDIT_THRESHOLDS.clearRateMinRuns - 1,
      clearRate: 1,
    });
    expect(gate.pass).toBe(false);
    expect(gate.reason).toContain('樣本不足');
  });

  // ×5 讓 40%（2/5）與 80%（4/5）都恰好落在整數次數上——門檻不落在兩個
  // 可達值之間，邊界判定無歧義。這是最小樣本數取 5 的理由，隨常數一起守門。
  it('最小樣本數使兩條門檻都落在可達的整數成功次數上', () => {
    const n = AUDIT_THRESHOLDS.clearRateMinRuns;
    for (const rate of [AUDIT_THRESHOLDS.clearRateMinMid, AUDIT_THRESHOLDS.clearRateMinHigh]) {
      expect(Number.isInteger(rate * n)).toBe(true);
    }
  });

  it('門檻常數只存在於 difficulty.ts——level-audit.mjs 不得複製第二份', () => {
    const src = readFileSync(join(here, 'level-audit.mjs'), 'utf8');
    // 允許引用 AUDIT_THRESHOLDS.clearRateMin*，但不得出現裸數值定義。
    expect(src).not.toMatch(/clearRateMin(Mid|High|Runs)\s*[:=]\s*[\d.]/);
    expect(src).toContain('AUDIT_THRESHOLDS.clearRateMinMid');
    expect(src).toContain('AUDIT_THRESHOLDS.clearRateMinHigh');
    expect(src).toContain('AUDIT_THRESHOLDS.clearRateMinRuns');
  });

  // import 副作用守門：本檔 import level-audit.mjs 取 gate 函式，若 CLI 進入點沒有
  // direct-run 守衛，import 當下就會執行 main()——缺 levelArg 即拋錯並 process.exit(1)，
  // 使整個 vitest run 以 unhandled error 失敗。此回歸實際發生過（#890 引入，
  // #918 接上 starpuff test:coverage 後才在 CI 曝光），故以斷言釘住守衛存在。
  it('CLI 進入點有 direct-run 守衛，import 不得產生副作用', () => {
    const src = readFileSync(join(here, 'level-audit.mjs'), 'utf8');
    expect(src).toContain('function isDirectRun()');
    expect(src).toMatch(/if\s*\(isDirectRun\(\)\)\s*\{[\s\S]*main\(\)/);
    // 行首裸呼叫即代表守衛被繞過。
    expect(src).not.toMatch(/^main\(\)/m);
  });
});
