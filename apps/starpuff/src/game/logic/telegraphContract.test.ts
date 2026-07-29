import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { AUDIT_THRESHOLDS } from './difficulty';

const logicDir = dirname(fileURLToPath(import.meta.url));

// telegraph 分層契約可執行核對清單（#890 驗收第 3 項）。
//
// GAME_DESIGN 硬不變式原本宣稱「telegraph ≥600ms 跨檔恆成立」，但 runtime 有大量
// 500ms——文件過度宣稱，而非實作缺陷：小怪較短是刻意設計（威脅較低、節奏較快，
// 全面拉到 600ms 會顯著拖慢戰鬥手感）。契約因此收窄為分層：
//
//   魔王招式 ≥600ms（telegraphMinMs）／小怪 ≥500ms（telegraphMinimalMinionMs）
//
// 低於魔王紅線者必須列入下方例外表並寫明補償機制。新增例外會強迫改動本表，
// 使「悄悄調低某個王的前搖」無法通過守門——這正是把文件契約變成可執行清單的目的。
const BOSS_TELEGRAPH_EXCEPTIONS: Record<string, { minMs: number; compensationZh: string }> = {
  'prismixFsm.beamTelegraphMs': {
    minMs: 500,
    compensationZh:
      '全寬預示線精確標示光束 Y 位置（systems/prismix fireBeam）——空間資訊零判讀，' +
      '玩家只需離開該線，與需判讀左右對衝時機的 pincer 性質不同。',
  },
  'syronaFsm.lobTelegraphMs': {
    minMs: 500,
    compensationZh:
      '拋物射彈：離手後仍有飛行時間，實質反應窗＝telegraph＋飛行位移窗，' +
      '與瞬間命中整條帶狀判定的光束不同。待 bot 迴避率探針複驗（#890 後續）。',
  },
};

function readFsmConstants(): { key: string; ms: number }[] {
  const out: { key: string; ms: number }[] = [];
  for (const file of readdirSync(logicDir).filter((f) => f.endsWith('Fsm.ts'))) {
    const src = readFileSync(join(logicDir, file), 'utf8');
    const module = file.replace(/\.ts$/, '');
    for (const match of src.matchAll(/^\s*(\w*[Tt]elegraphMs):\s*(\d+),/gm)) {
      out.push({ key: `${module}.${match[1]}`, ms: Number(match[2]) });
    }
  }
  return out;
}

describe('telegraph 分層契約（#890）', () => {
  const bossTelegraphs = readFsmConstants();

  it('掃描到的魔王 telegraph 常數不為空（守門本身沒失效）', () => {
    expect(bossTelegraphs.length).toBeGreaterThan(30);
  });

  it('魔王招式一律 ≥600ms，例外須登記於例外表並附補償機制', () => {
    const violations = bossTelegraphs.filter(
      (t) => t.ms < AUDIT_THRESHOLDS.telegraphMinMs && !(t.key in BOSS_TELEGRAPH_EXCEPTIONS),
    );
    expect(violations).toEqual([]);
  });

  it('例外仍不得低於小怪層級下限，且補償說明不得留空', () => {
    for (const [key, spec] of Object.entries(BOSS_TELEGRAPH_EXCEPTIONS)) {
      const actual = bossTelegraphs.find((t) => t.key === key);
      expect(actual, `例外表登記了不存在的常數：${key}`).toBeDefined();
      expect(actual?.ms).toBe(spec.minMs);
      expect(actual?.ms).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinimalMinionMs);
      expect(spec.compensationZh.length).toBeGreaterThan(20);
    }
  });

  it('例外表不得囤積已回到紅線之上的條目（避免清單腐爛）', () => {
    for (const key of Object.keys(BOSS_TELEGRAPH_EXCEPTIONS)) {
      const actual = bossTelegraphs.find((t) => t.key === key);
      expect(actual?.ms, `${key} 已達紅線，應自例外表移除`).toBeLessThan(
        AUDIT_THRESHOLDS.telegraphMinMs,
      );
    }
  });
});

describe('小怪 telegraph 下限（#890）', () => {
  it('enemyFsm 的所有前搖／瞄準／閃爍窗 ≥500ms', () => {
    const src = readFileSync(join(logicDir, 'enemyFsm.ts'), 'utf8');
    const values = [...src.matchAll(/^\s*(windupMs|aimMs|shimmerMs):\s*(\d+),/gm)].map((m) => ({
      key: m[1],
      ms: Number(m[2]),
    }));
    expect(values.length).toBeGreaterThan(10);
    for (const v of values) {
      expect(v.ms, `${v.key}=${v.ms}`).toBeGreaterThanOrEqual(
        AUDIT_THRESHOLDS.telegraphMinimalMinionMs,
      );
    }
  });
});
