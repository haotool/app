/**
 * 文字 alpha 稀釋合成對比守門（issue #609）
 *
 * 背景：AA property 測試只驗實色 token；`text-primary-on-surface/70`、
 * `opacity-[0.35]` 等 alpha 疊加會把達標實色稀釋到實效對比 < 4.5:1
 * （kawaii text 0.7 合成後僅 3.56:1、zen text 0.35 合成後僅 2.22:1）。
 *
 * 守門規則：
 * 1. 靜態掃描 src 下全部 .ts/.tsx（排除測試檔）：
 *    - `text-primary-on-surface/<alpha>` 稀釋變體
 *    - className 內任意值 `opacity-[<x>]`
 *    兩者必須完全等於允許清單；新增條目需先以合成計算證明 ≥ 4.5:1。
 * 2. 已收斂消費點的實色錨點斷言：底部導覽 inactive 錨定 text-muted、
 *    換錢所 badge 圖示錨定 on-surface，對各主題自身底色 ≥ 4.5:1。
 * 3. 歷史 alpha 值合成斷言：以合成公式證明 0.7 / 0.35 稀釋不達 AA，
 *    作為收斂依據並防止回退。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * alpha 稀釋允許清單（`相對 src 路徑:行號`）。
 * #609 收斂後應維持為空；新增條目需附「合成後對比 ≥ 4.5:1」計算證明與 PM/a11y 裁決。
 */
const ALPHA_DILUTION_ALLOWLIST: readonly string[] = [];

const SRC_ROOT = resolve(__dirname, '../..');
const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx']);

/** 文字消費面的 alpha 稀釋樣式。 */
const ALPHA_DILUTION_PATTERNS: readonly RegExp[] = [
  /text-primary-on-surface\/\d+/,
  /opacity-\[0?\.\d+\]/,
];

function isTestFile(path: string): boolean {
  return path.includes('__tests__') || /\.(test|spec)\.(ts|tsx)$/.test(path);
}

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    if (!SCANNED_EXTENSIONS.has(extname(entry.name)) || isTestFile(path)) return [];
    return [path];
  });
}

function scanDilutions(): string[] {
  return collectSourceFiles(SRC_ROOT).flatMap((path) => {
    const lines = readFileSync(path, 'utf-8').split('\n');
    return lines.flatMap((line, index) =>
      ALPHA_DILUTION_PATTERNS.some((pattern) => pattern.test(line))
        ? [`${relative(SRC_ROOT, path)}:${index + 1}`]
        : [],
    );
  });
}

/** 'R G B' → 相對亮度（WCAG 2.x，測試內獨立實作）。 */
function relativeLuminance(triple: string): number {
  const [r, g, b] = triple.split(/\s+/).map((n) => {
    const c = Number(n) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** alpha 合成：前景以 alpha 疊在底色上的實效顏色（sRGB 線性插值）。 */
function composite(foreground: string, background: string, alpha: number): string {
  const fg = foreground.split(/\s+/).map(Number);
  const bg = background.split(/\s+/).map(Number);
  return fg.map((channel, i) => Math.round(alpha * channel + (1 - alpha) * (bg[i] ?? 0))).join(' ');
}

/** 由 index.css 解析各主題區塊變數（與 raw-primary-text-exposure 同法）。 */
const css = readFileSync(resolve(SRC_ROOT, 'index.css'), 'utf-8');
const blockStarts = [...css.matchAll(/\[data-style='([\w-]+)'\]\s*\{/g)];
const themeBlocks = blockStarts.map((match, index) => ({
  theme: match[1] ?? '',
  body: css.slice(match.index ?? 0, blockStarts[index + 1]?.index ?? css.length),
}));

function readVar(body: string, name: string): string {
  return new RegExp(`${name}:\\s*([0-9]+ [0-9]+ [0-9]+)\\s*;`).exec(body)?.[1] ?? '';
}

/** readVar 加一層 var() 間接解析（--color-warning-text: var(--color-warning) 型）。 */
function resolveVar(body: string, name: string): string {
  const direct = readVar(body, name);
  if (direct) return direct;
  const indirect = new RegExp(`${name}:\\s*var\\((--color-[\\w-]+)\\)\\s*;`).exec(body)?.[1];
  return indirect ? readVar(body, indirect) : '';
}

describe('文字 alpha 稀釋曝露面守門（#609）', () => {
  it('掃描範圍非空（防止路徑失效讓守門空轉）', () => {
    expect(collectSourceFiles(SRC_ROOT).length).toBeGreaterThan(100);
  });

  it('alpha 稀釋用法必須完全等於允許清單', () => {
    const dilutions = scanDilutions().sort();
    expect(
      dilutions,
      `發現未列管的文字 alpha 稀釋點（請改實色 token，或附合成對比證明加入允許清單）：\n${dilutions.join('\n')}`,
    ).toEqual([...ALPHA_DILUTION_ALLOWLIST].sort());
  });

  it('守門樣式自檢：可辨識稀釋用法且不誤傷實色 token', () => {
    const [onSurfacePattern, opacityPattern] = ALPHA_DILUTION_PATTERNS;
    expect(onSurfacePattern?.test('text-primary-on-surface/70')).toBe(true);
    expect(onSurfacePattern?.test('text-primary-on-surface')).toBe(false);
    expect(opacityPattern?.test("'opacity-[0.35] scale-100'")).toBe(true);
    expect(opacityPattern?.test('opacity-70')).toBe(false);
    expect(opacityPattern?.test('opacity-100')).toBe(false);
  });
});

describe('已收斂消費點的實色錨點合成驗證（#609）', () => {
  it.each(themeBlocks)(
    '[$theme] 底部導覽 inactive 錨點 text-muted 對 background ≥ 4.5:1',
    ({ theme, body }) => {
      const textMuted = readVar(body, '--color-text-muted');
      const background = readVar(body, '--color-background');
      expect(textMuted, `${theme} 缺少 --color-text-muted`).not.toBe('');
      expect(
        contrast(textMuted, background),
        `${theme} text-muted on background`,
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  // #641：text-text-muted 色鍵活化後，muted 消費面擴及 surface / elevated / sunken
  //（QuoteMatrix/RateInsight sunken 註腳、OpenData elevated 卡等），全底皆須 AA。
  it.each(themeBlocks)(
    '[$theme] text-muted 對 surface / surface-elevated / surface-sunken ≥ 4.5:1（#641 活化面）',
    ({ theme, body }) => {
      const textMuted = readVar(body, '--color-text-muted');
      for (const base of [
        '--color-surface',
        '--color-surface-elevated',
        '--color-surface-sunken',
      ] as const) {
        const value = readVar(body, base);
        expect(value, `${theme} 缺少 ${base}`).not.toBe('');
        expect(contrast(textMuted, value), `${theme} text-muted on ${base}`).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    },
  );

  // #641：text-warning-text 色鍵活化（過期匯率警示 banner：bg-warning/10 疊 background）。
  it.each(themeBlocks)(
    '[$theme] warning-text 對 warning/10 疊 background 合成底 ≥ 4.5:1（#641 活化面）',
    ({ theme, body }) => {
      const warningText = resolveVar(body, '--color-warning-text');
      const warning = readVar(body, '--color-warning');
      const background = readVar(body, '--color-background');
      expect(warningText, `${theme} 缺少 --color-warning-text`).not.toBe('');
      const banner = composite(warning, background, 0.1);
      expect(
        contrast(warningText, banner),
        `${theme} warning-text on warning/10 banner`,
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  // badge 為圖示（非文字），適用 WCAG 1.4.11 圖形對比 ≥ 3:1；
  // 文字面的 4.5:1 由 raw-primary-text-exposure 的白名單合約守門。
  it.each(themeBlocks)(
    '[$theme] badge 圖示錨點 on-surface 對 surface ≥ 3:1（實色，無稀釋）',
    ({ theme, body }) => {
      const onSurface = readVar(body, '--color-primary-on-surface');
      const surface = readVar(body, '--color-surface');
      expect(onSurface, `${theme} 缺少 --color-primary-on-surface`).not.toBe('');
      expect(contrast(onSurface, surface), `${theme} on-surface on surface`).toBeGreaterThanOrEqual(
        3,
      );
    },
  );
});

describe('歷史 alpha 消費點合成斷言（收斂依據，防回退）', () => {
  const byTheme = new Map(themeBlocks.map(({ theme, body }) => [theme, body]));

  it('kawaii text 以 0.7 疊底後對 background < 4.5:1（原 opacity-70 待命態不達 AA）', () => {
    const body = byTheme.get('kawaii') ?? '';
    const diluted = composite(
      readVar(body, '--color-text'),
      readVar(body, '--color-background'),
      0.7,
    );
    expect(contrast(diluted, readVar(body, '--color-background'))).toBeLessThan(4.5);
  });

  it('zen text 以 0.35 疊底後對 background < 4.5:1（原 opacity-[0.35] inactive 態不達 AA）', () => {
    const body = byTheme.get('zen') ?? '';
    const diluted = composite(
      readVar(body, '--color-text'),
      readVar(body, '--color-background'),
      0.35,
    );
    expect(contrast(diluted, readVar(body, '--color-background'))).toBeLessThan(4.5);
  });

  it('zen on-surface 以 0.7 疊白底後 < 4.5:1（原 text-primary-on-surface/70 badge 不達 AA）', () => {
    const body = byTheme.get('zen') ?? '';
    const surface = readVar(body, '--color-surface');
    const diluted = composite(readVar(body, '--color-primary-on-surface'), surface, 0.7);
    expect(contrast(diluted, surface)).toBeLessThan(4.5);
  });
});
