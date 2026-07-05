/**
 * E1 設計系統靜態 lint 守門（防回退）
 *
 * 掃描 src 產品源碼（排除測試檔與 generated），守四條紅線：
 * 1. 禁 <12px 文字（任意值 text-[Npx]，N < 12）
 * 2. 按鈕類 JSX 禁新增 bg-gradient；品牌按鈕漸層 token 全域禁用
 * 3. 圓角白名單：禁任意值 rounded-[...]；radiusTokens 實值恰為三級（+full）
 * 4. 陰影白名單：禁 shadow-2xl／彩色陰影／任意值；shadowTokens 實值恰為兩級中性色
 * 另守動效紅線：hover-scale 清零、四個 infinite 動畫不得復活。
 *
 * 「突變驗證」describe 以刻意注入違規的 fixture 驗證每條規則確實會咬人，
 * 防止守門本身因 regex 失效而靜默放行。
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { radiusTokens, shadowTokens } from '../config/design-tokens';

const SRC_ROOT = join(__dirname, '..');

/** 遞迴收集 src 下的產品源碼（排除測試與 generated）。 */
function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      if (entry === '__tests__' || entry === 'generated' || entry === 'node_modules') continue;
      files.push(...collectSourceFiles(fullPath));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    if (/\.(test|spec)\.(ts|tsx)$/.test(entry)) continue;
    files.push(fullPath);
  }
  return files;
}

interface Violation {
  file: string;
  match: string;
}

/** 對內容套用規則，回傳違規清單（供源碼掃描與突變驗證共用）。 */
function scan(content: string, file: string, pattern: RegExp): Violation[] {
  const violations: Violation[] = [];
  for (const match of content.matchAll(pattern)) {
    violations.push({ file, match: match[0].slice(0, 120) });
  }
  return violations;
}

/** 規則 1：任意值 px 字級 <12px。 */
const SUB_12PX_TEXT = /text-\[(\d+(?:\.\d+)?)px\]/g;
function findSub12pxText(content: string, file: string): Violation[] {
  const violations: Violation[] = [];
  for (const match of content.matchAll(SUB_12PX_TEXT)) {
    if (Number(match[1]) < 12) {
      violations.push({ file, match: match[0] });
    }
  }
  return violations;
}

/**
 * 規則 2a：button／motion.button 開標籤內出現 bg-gradient。
 * 已知限制：僅掃 JSX 開標籤內的字面值，無法涵蓋 className 以變數／常數間接注入的漸層；
 * 該缺口由規則 2b 補位——品牌漸層 token 於常數定義處（任何位置）即會被全域禁用抓到。
 */
const BUTTON_GRADIENT = /<(?:motion\.)?button\b[^<]*?bg-gradient/g;
/** 規則 2b：品牌按鈕漸層 token（E1 已下線，任何位置皆禁）。 */
const BRAND_BUTTON_GRADIENT_TOKEN = /from-brand-button-from|to-brand-button-to/g;

/** 規則 3：任意值圓角。 */
const ARBITRARY_RADIUS = /rounded-(?:[a-z]+-)?\[[^\]]+\]/g;

/** 規則 4：陰影黑名單（Tailwind 預設大陰影、彩色陰影、任意值）。 */
const SHADOW_BLOCKLIST = /shadow-2xl|shadow-primary\/|shadow-brand-shadow|shadow-\[[^\]]+\]/g;

/** 動效紅線：hover 縮放與四個 infinite 動畫 class。 */
const HOVER_SCALE = /(?:group-)?hover:scale-/g;
const INFINITE_ANIMATIONS = /animate-(?:ping-slow|pulse-soft|wiggle|attention-ring)/g;

const sourceFiles = collectSourceFiles(SRC_ROOT);
const sources = sourceFiles.map((file) => ({
  file: relative(SRC_ROOT, file),
  content: readFileSync(file, 'utf8'),
}));

function scanAll(rule: (content: string, file: string) => Violation[]): Violation[] {
  return sources.flatMap(({ file, content }) => rule(content, file));
}

describe('E1 設計系統守門：源碼掃描', () => {
  it('掃描範圍健全（至少涵蓋百檔源碼）', () => {
    expect(sourceFiles.length).toBeGreaterThan(100);
  });

  it('禁 <12px 文字：全站無 text-[8~11px] 任意值', () => {
    expect(scanAll(findSub12pxText)).toEqual([]);
  });

  it('按鈕禁漸層：button 開標籤內無 bg-gradient', () => {
    expect(scanAll((content, file) => scan(content, file, BUTTON_GRADIENT))).toEqual([]);
  });

  it('品牌按鈕漸層 token 全域下線', () => {
    expect(scanAll((content, file) => scan(content, file, BRAND_BUTTON_GRADIENT_TOKEN))).toEqual(
      [],
    );
  });

  it('圓角白名單：無任意值 rounded-[...]', () => {
    expect(scanAll((content, file) => scan(content, file, ARBITRARY_RADIUS))).toEqual([]);
  });

  it('陰影白名單：無 shadow-2xl／彩色陰影／任意值陰影', () => {
    expect(scanAll((content, file) => scan(content, file, SHADOW_BLOCKLIST))).toEqual([]);
  });

  it('hover-scale 清零', () => {
    expect(scanAll((content, file) => scan(content, file, HOVER_SCALE))).toEqual([]);
  });

  it('四個 infinite 動畫 class 不得復活', () => {
    expect(scanAll((content, file) => scan(content, file, INFINITE_ANIMATIONS))).toEqual([]);
  });

  it('index.css 常駐動畫僅限豁免清單（安裝指引指標＋骨架 shimmer）', () => {
    const css = readFileSync(join(SRC_ROOT, 'index.css'), 'utf8');
    const infiniteLines = css
      .split('\n')
      .filter((line) => line.includes('infinite') && line.includes('animation:'));
    expect(infiniteLines).toHaveLength(3);
    expect(infiniteLines.filter((line) => line.includes('point-up-right'))).toHaveLength(1);
    expect(infiniteLines.filter((line) => line.includes('skeleton-shimmer'))).toHaveLength(2);
  });
});

describe('E1 設計系統守門：token SSOT 收斂', () => {
  it('radiusTokens 實值恰為三級（20/16/12px）＋pill full', () => {
    const distinct = new Set(Object.values(radiusTokens.values));
    expect(distinct).toEqual(new Set(['1.25rem', '1rem', '0.75rem', '9999px']));
  });

  it('shadowTokens 實值恰為兩級且不含主色（彩色陰影清零）', () => {
    const values = Object.values(shadowTokens.values);
    expect(new Set(values).size).toBe(2);
    for (const value of values) {
      expect(value).not.toContain('--color-primary');
    }
  });
});

describe('E1 設計系統守門：突變驗證（規則必須咬得住違規）', () => {
  it('text-[8px]~text-[11px] 會被禁小字規則抓到；12px 以上放行', () => {
    for (const px of ['8', '9', '10', '11', '11.5']) {
      expect(findSub12pxText(`<span className="text-[${px}px]" />`, 'fixture.tsx')).toHaveLength(1);
    }
    expect(findSub12pxText('<span className="text-[12px] text-[32px]" />', 'f.tsx')).toEqual([]);
  });

  it('button 內 bg-gradient 會被按鈕禁漸層規則抓到；裝飾性 div 漸層放行', () => {
    const bad = '<button type="button" className="px-2 bg-gradient-to-r from-a to-b">Go</button>';
    const badMotion = '<motion.button className={`bg-gradient-to-r ${x}`}>Go</motion.button>';
    const good = '<div className="bg-gradient-to-b from-surface to-surface-elevated" />';
    expect(scan(bad, 'f.tsx', BUTTON_GRADIENT)).toHaveLength(1);
    expect(scan(badMotion, 'f.tsx', BUTTON_GRADIENT)).toHaveLength(1);
    expect(scan(good, 'f.tsx', BUTTON_GRADIENT)).toEqual([]);
  });

  it('品牌按鈕漸層 token 任何位置都會被抓到', () => {
    expect(
      scan("const c = 'from-brand-button-from';", 'f.ts', BRAND_BUTTON_GRADIENT_TOKEN),
    ).toHaveLength(1);
  });

  it('任意值圓角會被白名單規則抓到；token 圓角放行', () => {
    expect(scan('className="rounded-[20px]"', 'f.tsx', ARBITRARY_RADIUS)).toHaveLength(1);
    expect(scan('className="rounded-t-[24px]"', 'f.tsx', ARBITRARY_RADIUS)).toHaveLength(1);
    expect(
      scan('className="rounded-card rounded-t-card rounded-full"', 'f.tsx', ARBITRARY_RADIUS),
    ).toEqual([]);
  });

  it('黑名單陰影會被抓到；token 陰影放行', () => {
    for (const bad of [
      'shadow-2xl',
      'shadow-primary/25',
      'shadow-brand-shadow',
      'shadow-[0_1px_2px_red]',
    ]) {
      expect(scan(`className="${bad}"`, 'f.tsx', SHADOW_BLOCKLIST)).toHaveLength(1);
    }
    expect(
      scan('className="shadow-card shadow-floating shadow-sm"', 'f.tsx', SHADOW_BLOCKLIST),
    ).toEqual([]);
  });

  it('hover-scale 與 infinite 動畫 class 會被抓到', () => {
    expect(scan('className="hover:scale-[1.02]"', 'f.tsx', HOVER_SCALE)).toHaveLength(1);
    expect(scan('className="group-hover:scale-105"', 'f.tsx', HOVER_SCALE)).toHaveLength(1);
    expect(scan('className="animate-wiggle"', 'f.tsx', INFINITE_ANIMATIONS)).toHaveLength(1);
    expect(scan('className="active:scale-[0.97] animate-fade-in"', 'f.tsx', HOVER_SCALE)).toEqual(
      [],
    );
  });
});
