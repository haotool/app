/**
 * raw primary 文字曝露面守門（issue #632）
 *
 * 背景：`--color-primary` 於 custom 主題為使用者原色 identity 映射（無 clamp），
 * 任何「文字消費點」直接使用 raw primary，近白主色即造成文字隱形。
 * 文字一律改錨 `--color-primary-on-surface`（內建主題同 primary 值、
 * custom 主題由 deriveCustomThemeCssVars AA clamp）。
 *
 * 守門規則：靜態掃描 src 下全部 .ts/.tsx/.css（排除測試檔），
 * 以下 raw primary 文字用法必須出現在 RAW_PRIMARY_TEXT_EXPOSURE_ALLOWLIST 中，
 * 否則測試變紅（新增文字消費點若用 raw primary 即紅）：
 * 1. Tailwind 類 `text-primary`（含 hover:/group-hover:/alpha 變體；不含 text-primary-*）
 * 2. 任意值類 `text-[rgb(var(--color-primary))]`
 * 3. CSS 宣告 `color: rgb(var(--color-primary))`
 */
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * raw primary 文字曝露面允許清單（`相對 src 路徑:行號內容摘要`）。
 * issue #632 收斂後應維持為空；新增條目需 PM/a11y 裁決並附理由。
 */
const RAW_PRIMARY_TEXT_EXPOSURE_ALLOWLIST: readonly string[] = [];

const SRC_ROOT = resolve(__dirname, '../..');
const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx', '.css']);

/** 文字消費面的 raw primary 用法（token 名後不得再接 -\w，允許 /alpha 變體）。 */
const RAW_PRIMARY_TEXT_PATTERNS: readonly RegExp[] = [
  /(?<![\w-])text-primary(?![\w-])/,
  /text-\[rgb\(var\(--color-primary\)/,
  /(?<![\w-])color:\s*['"]?rgb\(var\(--color-primary\s*[),]/,
];

function isTestFile(path: string): boolean {
  return (
    path.includes('__tests__') ||
    /\.(test|spec)\.(ts|tsx)$/.test(path) ||
    path.endsWith('.html.test.ts')
  );
}

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    if (!SCANNED_EXTENSIONS.has(extname(entry.name)) || isTestFile(path)) return [];
    return [path];
  });
}

function scanExposures(): string[] {
  return collectSourceFiles(SRC_ROOT).flatMap((path) => {
    const lines = readFileSync(path, 'utf-8').split('\n');
    return lines.flatMap((line, index) =>
      RAW_PRIMARY_TEXT_PATTERNS.some((pattern) => pattern.test(line))
        ? [`${relative(SRC_ROOT, path)}:${index + 1}`]
        : [],
    );
  });
}

/**
 * on-surface 覆寫白名單（issue #609 合約修訂）：
 * 內建主題預設維持 on-surface == primary（#632 視覺零變化）；
 * 列於本白名單者允許有意識覆寫，但必須通過對自身 surface / background /
 * surface-elevated / surface-sunken 全部 ≥ 4.5:1 的 AA 驗證。
 * 新增條目需 PM/a11y 裁決並附理由。
 */
const ON_SURFACE_OVERRIDE_WHITELIST: Record<string, string> = {
  // hot pink primary 對白底僅 2.65:1，文字錨點加深至 pink-700（白底 6.04:1）；品牌色本身不動。
  kawaii: 'primary 對白底不達 AA，文字面走加深 clamp 色',
  // 深色主題文字錨點亮向（對 surface 8.36:1），原 primary 對 surface-elevated 僅 4.53:1 貼線。
  nitro: '深色主題文字錨點亮向增加對比餘裕',
};

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

describe('內建主題 on-surface 錨點合約（#632 預設零變化 + #609 白名單覆寫）', () => {
  const css = readFileSync(resolve(SRC_ROOT, 'index.css'), 'utf-8');
  const blockStarts = [...css.matchAll(/\[data-style='([\w-]+)'\]\s*\{/g)];
  const themeBlocks = blockStarts.map((match, index) => ({
    theme: match[1] ?? '',
    body: css.slice(match.index ?? 0, blockStarts[index + 1]?.index ?? css.length),
  }));

  function readVar(body: string, name: string): string | undefined {
    return new RegExp(`${name}:\\s*([0-9]+ [0-9]+ [0-9]+)\\s*;`).exec(body)?.[1];
  }

  it('白名單主題必須實際存在於 index.css（防止殘留條目）', () => {
    const themes = new Set(themeBlocks.map((block) => block.theme));
    Object.keys(ON_SURFACE_OVERRIDE_WHITELIST).forEach((theme) => {
      expect(themes.has(theme), `白名單主題 ${theme} 不存在於 index.css`).toBe(true);
    });
  });

  it.each(themeBlocks)(
    '[data-style=$theme] 的 --color-primary-on-surface 必須定義；非白名單主題必須等於 --color-primary',
    ({ theme, body }) => {
      const primary = readVar(body, '--color-primary');
      const onSurface = readVar(body, '--color-primary-on-surface');
      expect(primary, `${theme} 缺少 --color-primary`).toBeDefined();
      expect(
        onSurface,
        `${theme} 缺少 --color-primary-on-surface（文字錨點需全主題齊備）`,
      ).toBeDefined();
      if (!(theme in ON_SURFACE_OVERRIDE_WHITELIST)) {
        expect(onSurface, `${theme} 未列於白名單，on-surface 必須等於 primary（視覺零變化）`).toBe(
          primary,
        );
      }
    },
  );

  it.each(themeBlocks.filter(({ theme }) => theme in ON_SURFACE_OVERRIDE_WHITELIST))(
    '[data-style=$theme] 白名單覆寫必須對自身全部底色 ≥ 4.5:1（AA）',
    ({ theme, body }) => {
      const onSurface = readVar(body, '--color-primary-on-surface');
      const primary = readVar(body, '--color-primary');
      expect(onSurface).toBeDefined();
      expect(onSurface, `${theme} 列於白名單但 on-surface 仍等於 primary（覆寫不存在）`).not.toBe(
        primary,
      );
      for (const name of [
        '--color-surface',
        '--color-background',
        '--color-surface-elevated',
        '--color-surface-sunken',
      ]) {
        const surface = readVar(body, name);
        expect(surface, `${theme} 缺少 ${name}`).toBeDefined();
        expect(
          contrast(onSurface ?? '', surface ?? ''),
          `${theme} on-surface 對 ${name} 對比不達 AA`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});

describe('死類 text-primary-foreground 守門', () => {
  // --color-primary-foreground CSS 變數未定義，此類實渲染為繼承色（QA-H E6：
  // 深藏青字壓 bg-primary-strong 僅 3.3:1）。白字實底一律用 text-white。
  it('src 下使用數必須為 0', () => {
    const pattern = /(?<![\w-])text-primary-foreground(?![\w-])/;
    const hits = collectSourceFiles(SRC_ROOT).flatMap((path) => {
      const lines = readFileSync(path, 'utf-8').split('\n');
      return lines.flatMap((line, index) =>
        pattern.test(line) ? [`${relative(SRC_ROOT, path)}:${index + 1}`] : [],
      );
    });
    expect(
      hits,
      `發現死類 text-primary-foreground（請改用 text-white）：\n${hits.join('\n')}`,
    ).toEqual([]);
  });
});

describe('raw primary 文字曝露面守門（#632）', () => {
  it('掃描範圍非空（防止路徑失效讓守門空轉）', () => {
    expect(collectSourceFiles(SRC_ROOT).length).toBeGreaterThan(100);
  });

  it('文字消費點禁止 raw primary：曝露面必須完全等於允許清單', () => {
    const exposures = scanExposures().sort();
    expect(
      exposures,
      `發現未列管的 raw primary 文字消費點（請改錨 text-primary-on-surface 或按 #632 合約裁決加入允許清單）：\n${exposures.join('\n')}`,
    ).toEqual([...RAW_PRIMARY_TEXT_EXPOSURE_ALLOWLIST].sort());
  });

  it('守門樣式自檢：可辨識 raw 用法且不誤傷 clamp token', () => {
    const [tailwindPattern, arbitraryPattern, cssPattern] = RAW_PRIMARY_TEXT_PATTERNS;
    expect(tailwindPattern?.test('className="text-primary underline"')).toBe(true);
    expect(tailwindPattern?.test('hover:text-primary/80')).toBe(true);
    expect(tailwindPattern?.test('group-hover:text-primary')).toBe(true);
    expect(tailwindPattern?.test('text-primary-on-surface')).toBe(false);
    expect(tailwindPattern?.test('text-primary-strong')).toBe(false);
    expect(tailwindPattern?.test('text-primary-text')).toBe(false);
    expect(arbitraryPattern?.test('text-[rgb(var(--color-primary))]')).toBe(true);
    expect(
      arbitraryPattern?.test('text-[rgb(var(--color-primary-strong,var(--color-primary)))]'),
    ).toBe(false);
    expect(cssPattern?.test('color: rgb(var(--color-primary));')).toBe(true);
    expect(cssPattern?.test("style={{ color: 'rgb(var(--color-primary))' }}")).toBe(true);
    expect(cssPattern?.test('color: rgb(var(--color-primary-strong, var(--color-primary)));')).toBe(
      false,
    );
    expect(cssPattern?.test('background-color: rgb(var(--color-primary));')).toBe(false);
  });
});
