/**
 * text-* 色 token 死類守門（issue #641）
 *
 * 背景：tailwind config 缺 `text-muted` 色鍵時，全站 ~145 處 `text-text-muted`
 * 為死類——dist CSS 零規則、實渲染為繼承色，且無任何警示（#640 審查獨立驗證）。
 * 同族變體 `text-primary-foreground`（QA-H 補列）則是「類名可編譯、CSS 變數未定義」
 * 的第二型死類。本守門雙層攔截：
 *
 * 1. 編譯層：src 產品源碼的全部 text-* 候選類名，經真實 tailwind.config 編譯
 *    必須產出 CSS 規則（無對應色鍵／字級鍵即為死類）。
 * 2. 變數層：編譯產出引用的每個 `--color-*` 變數，必須在 index.css 全部
 *    [data-style] 主題區塊皆有宣告（攔截 text-primary-foreground 型缺變數死類）。
 *
 * 非類名字串（token 定義鍵、CSS-in-string、展示文案）以 file|token 允許清單列管。
 * 「突變驗證」證明兩層規則都咬得住違規，防止守門本身靜默失效。
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import type { Config } from 'tailwindcss';
import tailwindConfig from '../../tailwind.config';

const SRC_ROOT = join(__dirname, '..');

/** 已知非類名字串（`相對 src 路徑|token`）：token 定義鍵、CSS 字串、展示文案。 */
const NON_CLASS_ALLOWLIST: ReadonlySet<string> = new Set([
  // design token 巢狀色鍵字串（'text-secondary' 等為 neutral/primary/brand 的子鍵名）
  'config/design-tokens/colors.ts|text-secondary',
  'config/design-tokens/colors.ts|text-light',
  'config/design-tokens/colors.ts|text-dark',
  'config/design-tokens/colors.ts|text-muted',
  // inline CSS 字串屬性（非 Tailwind 類名）
  'utils/pwaOfflineFallback.ts|text-align',
  // UIShowcase 展示文案「次要文字 (text-muted)」
  'pages/UIShowcase.tsx|text-muted',
]);

/** 遞迴收集 src 下的產品源碼（排除測試與 generated；與 design-system-guards 同法）。 */
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

/** text-* 候選類名（含 /alpha 修飾；排除任意值與變數引用等前綴黏連）。 */
const TEXT_CANDIDATE = /(?<![\w/.-])text-[a-z][a-z0-9-]*(?:\/\d{1,3})?(?![\w-])/g;

interface Candidate {
  file: string;
  token: string;
}

function collectCandidates(): Candidate[] {
  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  for (const filePath of collectSourceFiles(SRC_ROOT)) {
    const file = relative(SRC_ROOT, filePath);
    const content = readFileSync(filePath, 'utf8');
    for (const match of content.matchAll(TEXT_CANDIDATE)) {
      const key = `${file}|${match[0]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({ file, token: match[0] });
    }
  }
  return candidates;
}

/** 以真實 tailwind.config 編譯候選類名（content 覆寫為 raw fixture）。 */
async function compileClasses(classNames: readonly string[]): Promise<string> {
  const config: Config = {
    ...tailwindConfig,
    content: [{ raw: `<div class="${classNames.join(' ')}"></div>`, extension: 'html' }],
  };
  const result = await postcss([tailwindcss(config)]).process('@tailwind utilities;', {
    from: undefined,
  });
  return result.css;
}

/** 類名 → 編譯後 CSS 選擇器（跳脫 `/` 與 `.`）。 */
function escapedSelector(className: string): string {
  return `.${className.replace(/[./]/g, (char) => `\\${char}`)}`;
}

const candidates = collectCandidates();
const uniqueTokens = [...new Set(candidates.map(({ token }) => token))];
/** 全候選只編譯一次（memoized promise，各 it 內 await）。 */
const compiledCssPromise = compileClasses(uniqueTokens);

/** index.css 各 [data-style] 主題區塊（zen 為 `:root,[data-style='zen']` 組合選擇器）。 */
const indexCss = readFileSync(join(SRC_ROOT, 'index.css'), 'utf8');
const themeBlockStarts = [...indexCss.matchAll(/\[data-style='([\w-]+)'\]\s*\{/g)];
const themeBlocks = themeBlockStarts.map((match, index) => ({
  theme: match[1] ?? '',
  body: indexCss.slice(match.index ?? 0, themeBlockStarts[index + 1]?.index ?? indexCss.length),
}));

function isVarDeclaredInAllThemes(varName: string): boolean {
  return themeBlocks.every(({ body }) => new RegExp(`${varName}:\\s*[^;]+;`).test(body));
}

describe('#641 text-* 色 token 守門：編譯層（死類清零）', () => {
  it('掃描範圍健全（候選 token 至少 50 種、涵蓋 text-text-muted；8 個主題區塊）', () => {
    expect(uniqueTokens.length).toBeGreaterThan(50);
    expect(uniqueTokens).toContain('text-text-muted');
    expect(themeBlocks.length).toBe(8);
  });

  it('src 產品源碼不存在無對應色鍵的 text-* 類名（允許清單外零死類）', async () => {
    const compiledCss = await compiledCssPromise;
    const dead = candidates
      .filter(({ token }) => !compiledCss.includes(escapedSelector(token)))
      .filter(({ file, token }) => !NON_CLASS_ALLOWLIST.has(`${file}|${token}`))
      .map(({ file, token }) => `${file}|${token}`)
      .sort();
    expect(
      dead,
      `發現死類 text-* token（tailwind config 無對應鍵，渲染為繼承色）：\n${dead.join('\n')}`,
    ).toEqual([]);
  });

  it('允許清單條目必須仍然存在且確實不可編譯（防止過期條目遮蔽真死類）', async () => {
    const compiledCss = await compiledCssPromise;
    const candidateKeys = new Set(candidates.map(({ file, token }) => `${file}|${token}`));
    for (const entry of NON_CLASS_ALLOWLIST) {
      expect(candidateKeys.has(entry), `允許清單條目已失效，請移除：${entry}`).toBe(true);
      const token = entry.split('|')[1] ?? '';
      expect(
        compiledCss.includes(escapedSelector(token)),
        `允許清單條目可編譯，不再是非類名字串，請移除：${entry}`,
      ).toBe(false);
    }
  });

  it('dist 死類清零的等價保證：text-text-muted 產出規則且引用 --color-text-muted', async () => {
    const compiledCss = await compiledCssPromise;
    expect(compiledCss).toContain('.text-text-muted');
    expect(compiledCss).toContain('var(--color-text-muted)');
  });
});

describe('#641 text-* 色 token 守門：變數層（缺 CSS 變數死類）', () => {
  it('編譯產出引用的每個 --color-* 變數，全部主題區塊皆有宣告', async () => {
    const compiledCss = await compiledCssPromise;
    const referencedVars = [
      ...new Set([...compiledCss.matchAll(/var\((--color-[\w-]+)/g)].map((m) => m[1] ?? '')),
    ];
    expect(referencedVars.length).toBeGreaterThan(5);
    const missing = referencedVars.filter((varName) => !isVarDeclaredInAllThemes(varName));
    expect(
      missing,
      `text-* 類名引用了未在全部主題宣告的 CSS 變數（text-primary-foreground 型死類）：\n${missing.join('\n')}`,
    ).toEqual([]);
  });
});

describe('#641 突變驗證（規則必須咬得住違規）', () => {
  it('編譯層：不存在的色鍵類名不產規則；既有色鍵類名產規則', async () => {
    const css = await compileClasses(['text-text-muted', 'text-nonexistent-token']);
    expect(css).toContain('.text-text-muted');
    expect(css).not.toContain('.text-nonexistent-token');
  });

  it('變數層：--color-primary-foreground（QA-H 死類變體的變數）未在全部主題宣告', () => {
    // 色鍵存在（可編譯）但變數未定義——若有人重新使用 text-primary-foreground，
    // 編譯層放行、本層必須攔截。
    expect(isVarDeclaredInAllThemes('--color-primary-foreground')).toBe(false);
    expect(isVarDeclaredInAllThemes('--color-text-muted')).toBe(true);
  });

  it('候選正則：命中 className 與 alpha 修飾；不誤傷任意值/變數引用/連字前綴', () => {
    const hits = (source: string) => [...source.matchAll(TEXT_CANDIDATE)].map((m) => m[0]);
    expect(hits('className="text-text-muted hover:text-favorite"')).toEqual([
      'text-text-muted',
      'text-favorite',
    ]);
    expect(hits("'text-text-muted/80'")).toEqual(['text-text-muted/80']);
    expect(hits('text-[rgb(var(--color-text-muted))]')).toEqual([]);
    expect(hits('bg/light/active/text-light 階差')).toEqual([]);
    expect(hits('--color-text-muted: 94 110 132;')).toEqual([]);
  });
});
