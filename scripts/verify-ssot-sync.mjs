#!/usr/bin/env node
/**
 * SSOT 同步驗證腳本
 *
 * 功能：驗證 TypeScript SSOT 和 JavaScript SSOT 的路徑配置是否一致
 *
 * 用法：
 *   node scripts/verify-ssot-sync.mjs
 *
 * 建立時間: 2025-12-14
 * 依據: [P0 Priority] 防止 SSOT 不同步
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

/**
 * 從文件內容中提取具名陣列的字串項目
 */
function extractNamedArray(content, arrayName, asSuffix = '') {
  const escapedSuffix = asSuffix ? asSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  const pattern = new RegExp(`export const ${arrayName} = \\[([\\s\\S]*?)\\]${escapedSuffix};`);
  const match = content.match(pattern);
  if (!match) return [];

  const allMatches = [...match[1].matchAll(/['"]([^'"]+)['"]/g)];
  return allMatches.map((m) => m[1]);
}

function extractRegexSources(content, exportName) {
  const pattern = new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\](?: as const)?;`);
  const match = content.match(pattern);
  if (!match) return [];

  const regexMatches = [...match[1].matchAll(/\/((?:\\\/|[^/])+)\/[a-z]*/g)];
  return regexMatches.map((m) => m[1].replaceAll('\\/', '/'));
}

function extractNamedNumberMap(content, exportName) {
  const pattern = new RegExp(`export const ${exportName}:[^=]*= \\{([\\s\\S]*?)\\n\\};`);
  const fallbackPattern = new RegExp(`export const ${exportName} = \\{([\\s\\S]*?)\\n\\};`);
  const match = content.match(pattern) ?? content.match(fallbackPattern);
  if (!match) return {};

  return Object.fromEntries(
    [...match[1].matchAll(/([a-z]{3}):\s*\[([^\]]*)\]/g)].map(([, code, values]) => [
      code,
      values
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value)),
    ]),
  );
}

function buildIndexedAmountPaths(currencyPaths, amountMap, mode) {
  return currencyPaths.flatMap((path) => {
    const code =
      mode === 'forward'
        ? path.replace(/\//g, '').replace('-twd', '')
        : path.replace(/\//g, '').replace('twd-', '');
    return (amountMap[code] ?? []).map((amount) => `${path}${amount}/`);
  });
}

/**
 * 從 TypeScript 文件中提取 SEO 路徑
 * 支援 inline 與 spread 語法
 */
function extractPathsFromTS(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  const inlinePaths = extractNamedArray(content, 'SEO_PATHS', ' as const');
  if (inlinePaths.length > 0) return inlinePaths;

  const contentPaths = extractNamedArray(content, 'CONTENT_SEO_PATHS', ' as const');
  const currencyPaths = extractNamedArray(content, 'CURRENCY_SEO_PATHS', ' as const');
  const reversePaths = extractNamedArray(content, 'REVERSE_CURRENCY_SEO_PATHS', ' as const');
  const forwardAmounts = extractNamedNumberMap(content, 'INDEXABLE_FORWARD_AMOUNTS');
  const reverseAmounts = extractNamedNumberMap(content, 'INDEXABLE_REVERSE_TWD_AMOUNTS');

  if (contentPaths.length > 0 || currencyPaths.length > 0 || reversePaths.length > 0) {
    return [
      ...contentPaths,
      ...currencyPaths,
      ...reversePaths,
      ...buildIndexedAmountPaths(currencyPaths, forwardAmounts, 'forward'),
      ...buildIndexedAmountPaths(reversePaths, reverseAmounts, 'reverse'),
    ];
  }

  throw new Error('無法從 TypeScript 文件中提取 SEO_PATHS');
}

/**
 * 從 JavaScript (.mjs) 文件中提取 SEO 路徑
 * 優先使用 dynamic import；fallback 為 regex
 */
async function extractPathsFromMJS(filePath) {
  try {
    const mod = await import(pathToFileURL(filePath).href);
    if (mod.INDEXABLE_CANONICAL_PATHS && Array.isArray(mod.INDEXABLE_CANONICAL_PATHS)) {
      return [...mod.INDEXABLE_CANONICAL_PATHS];
    }
    // 僅比較靜態基礎路徑（SEO_PATHS 現在還包含動態生成的 amount 落地頁，不納入比較）。
    if (mod.CONTENT_SEO_PATHS && mod.CURRENCY_SEO_PATHS && mod.REVERSE_CURRENCY_SEO_PATHS) {
      return [
        ...mod.CONTENT_SEO_PATHS,
        ...mod.CURRENCY_SEO_PATHS,
        ...mod.REVERSE_CURRENCY_SEO_PATHS,
      ];
    }
    if (mod.SEO_PATHS && Array.isArray(mod.SEO_PATHS) && mod.SEO_PATHS.length > 0) {
      return [...mod.SEO_PATHS];
    }
  } catch {
    // dynamic import 失敗時 fallback 到 regex
  }

  const content = readFileSync(filePath, 'utf-8');
  const canonicalPaths = extractNamedArray(content, 'INDEXABLE_CANONICAL_PATHS');
  if (canonicalPaths.length > 0) return canonicalPaths;
  const inlinePaths = extractNamedArray(content, 'SEO_PATHS');
  if (inlinePaths.length > 0) return inlinePaths;

  const contentPaths = extractNamedArray(content, 'CONTENT_SEO_PATHS');
  const legalPaths = extractNamedArray(content, 'LEGAL_SSG_PATHS');
  const currencyPaths = extractNamedArray(content, 'CURRENCY_SEO_PATHS');
  const reversePaths = extractNamedArray(content, 'REVERSE_CURRENCY_SEO_PATHS');
  if (contentPaths.length > 0 || legalPaths.length > 0 || currencyPaths.length > 0) {
    return [...contentPaths, ...legalPaths, ...currencyPaths, ...reversePaths];
  }

  throw new Error('無法從 .mjs 文件中提取 SEO_PATHS');
}

function extractDynamicPatternsFromTS(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const directPattern =
    content.match(/export const DYNAMIC_AMOUNT_ROUTE_PATTERN = \/((?:\\\/|[^/])+)\/[a-z]*;/)?.[1] ??
    null;
  if (directPattern) return [directPattern.replaceAll('\\/', '/')];
  return extractRegexSources(content, 'SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS');
}

async function extractDynamicPatternsFromMJS(filePath) {
  try {
    const mod = await import(pathToFileURL(filePath).href);
    if (
      mod.SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS &&
      Array.isArray(mod.SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS)
    ) {
      return mod.SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS.map((pattern) =>
        pattern.source.replaceAll('\\/', '/'),
      );
    }
    if (Array.isArray(mod.APP_CONFIG?.supportedDynamicRoutePatterns)) {
      return mod.APP_CONFIG.supportedDynamicRoutePatterns.map((pattern) =>
        pattern.replaceAll('\\/', '/'),
      );
    }
  } catch {
    // dynamic import 失敗時 fallback 到 regex
  }

  const content = readFileSync(filePath, 'utf-8');
  return extractRegexSources(content, 'SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS');
}

/**
 * 比較兩個路徑數組
 */
function comparePaths(tsPaths, mjsPaths) {
  const errors = [];

  // 檢查數量
  if (tsPaths.length !== mjsPaths.length) {
    errors.push(
      `路徑數量不一致: TypeScript (${tsPaths.length}) vs JavaScript (${mjsPaths.length})`,
    );
  }

  // 檢查順序和內容
  const maxLength = Math.max(tsPaths.length, mjsPaths.length);
  for (let i = 0; i < maxLength; i++) {
    const tsPath = tsPaths[i];
    const mjsPath = mjsPaths[i];

    if (tsPath !== mjsPath) {
      errors.push(`位置 ${i}: TypeScript "${tsPath}" ≠ JavaScript "${mjsPath}"`);
    }
  }

  // 檢查是否有缺少或多餘的路徑
  const tsSet = new Set(tsPaths);
  const mjsSet = new Set(mjsPaths);

  const onlyInTS = tsPaths.filter((p) => !mjsSet.has(p));
  const onlyInMJS = mjsPaths.filter((p) => !tsSet.has(p));

  if (onlyInTS.length > 0) {
    errors.push(`只存在於 TypeScript: ${onlyInTS.join(', ')}`);
  }

  if (onlyInMJS.length > 0) {
    errors.push(`只存在於 JavaScript: ${onlyInMJS.join(', ')}`);
  }

  return errors;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rgbTripletToHex(rgbTriplet) {
  const values = rgbTriplet
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10));

  if (values.length !== 3 || values.some((value) => Number.isNaN(value))) {
    throw new Error(`無效的 RGB triplet: ${rgbTriplet}`);
  }

  return `#${values
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function rgbTripletToCssRgb(rgbTriplet) {
  const values = rgbTriplet
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10));

  if (values.length !== 3 || values.some((value) => Number.isNaN(value))) {
    throw new Error(`無效的 RGB triplet: ${rgbTriplet}`);
  }

  return `rgb(${values.join(', ')})`;
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error('DESIGN.md 缺少 YAML frontmatter');
  }

  return match[1];
}

function extractFrontmatterQuotedValue(frontmatter, keyPath) {
  const match = frontmatter.match(
    new RegExp(`^\\s*${escapeRegExp(keyPath)}:\\s*(?:"([^"]+)"|'([^']+)'|([^\\n]+))\\s*$`, 'm'),
  );
  return match?.[1] ?? match?.[2] ?? match?.[3]?.trim() ?? null;
}

function extractFrontmatterNumberValue(frontmatter, keyPath) {
  const match = frontmatter.match(
    new RegExp(`^\\s*${escapeRegExp(keyPath)}:\\s*(\\d+(?:\\.\\d+)?)\\s*$`, 'm'),
  );
  return match?.[1] ?? null;
}

function extractZenColorHexMap(cssContent) {
  const zenBlockMatch = cssContent.match(/:root,\s*\[data-style='zen'\]\s*\{([\s\S]*?)\n\s*\}/);
  if (!zenBlockMatch) {
    throw new Error('無法從 index.css 提取 zen 基準色票');
  }

  const colorKeys = [
    'background',
    'surface',
    'surface-elevated',
    'surface-sunken',
    'text',
    'text-muted',
    'primary',
    'secondary',
    'accent',
    'border',
    'info',
    'success',
    'warning',
    'destructive',
    'chart-line',
    'chart-area-top',
    'chart-area-bottom',
  ];

  return Object.fromEntries(
    colorKeys.map((key) => {
      const match = zenBlockMatch[1].match(
        new RegExp(`--color-${escapeRegExp(key)}:\\s*(\\d+\\s+\\d+\\s+\\d+);`),
      );
      if (!match) {
        throw new Error(`index.css 缺少 --color-${key}`);
      }

      return [key, rgbTripletToHex(match[1])];
    }),
  );
}

const THEME_STYLE_NAMES = ['zen', 'nitro', 'kawaii', 'classic', 'ocean', 'forest'];
const CSS_THEME_COLOR_KEYS = [
  'background',
  'surface',
  'text',
  'text-muted',
  'primary',
  'secondary',
  'accent',
  'border',
  'info',
  'success',
  'warning',
  'chart-line',
  'chart-area-top',
  'chart-area-bottom',
];
const THEME_COLOR_KEY_MAP = {
  background: 'background',
  surface: 'surface',
  text: 'text',
  'text-muted': 'textMuted',
  primary: 'primary',
  secondary: 'secondary',
  accent: 'accent',
  border: 'border',
  info: 'info',
  success: 'success',
  warning: 'warning',
  'chart-line': 'chartLine',
  'chart-area-top': 'chartAreaTop',
  'chart-area-bottom': 'chartAreaBottom',
};
const SKELETON_THEME_KEY_MAP = {
  '--sk-bg': 'background',
  '--sk-surface': 'surface',
  '--sk-border': 'border',
  '--sk-text': 'text',
  '--sk-text-muted': 'textMuted',
};

function normalizeHexColor(hexColor) {
  return hexColor.toUpperCase();
}

function extractCssThemeColorMap(cssContent, styleName) {
  const selector =
    styleName === 'zen'
      ? /:root,\s*\[data-style='zen'\]\s*\{([\s\S]*?)\n\s*\}/
      : new RegExp(`\\[data-style='${escapeRegExp(styleName)}'\\]\\s*\\{([\\s\\S]*?)\\n\\s*\\}`);
  const blockMatch = cssContent.match(selector);
  if (!blockMatch) {
    throw new Error(`無法從 index.css 提取 ${styleName} 色票`);
  }

  return Object.fromEntries(
    CSS_THEME_COLOR_KEYS.map((key) => {
      const match = blockMatch[1].match(
        new RegExp(`--color-${escapeRegExp(key)}:\\s*(\\d+\\s+\\d+\\s+\\d+);`),
      );
      if (!match) {
        throw new Error(`index.css 的 ${styleName} 缺少 --color-${key}`);
      }

      return [key, rgbTripletToHex(match[1])];
    }),
  );
}

function extractThemeDefinitionColorMap(themesContent, styleName) {
  const definitionMatch = themesContent.match(
    new RegExp(
      `const\\s+${escapeRegExp(styleName)}Style:[\\s\\S]*?colors:\\s*\\{([\\s\\S]*?)\\n\\s*\\},\\n\\};`,
    ),
  );
  if (!definitionMatch) {
    throw new Error(`無法從 themes.ts 提取 ${styleName} 色票`);
  }

  return Object.fromEntries(
    Object.values(THEME_COLOR_KEY_MAP).map((key) => {
      const match = definitionMatch[1].match(new RegExp(`${escapeRegExp(key)}:\\s*'([^']+)'`));
      if (!match) {
        throw new Error(`themes.ts 的 ${styleName} 色票缺少 ${key}`);
      }

      return [key, match[1]];
    }),
  );
}

function extractIndexHtmlSkeletonColorMap(indexHtmlContent, styleName) {
  const selector =
    styleName === 'zen'
      ? /:root,\s*\[data-style='zen'\]\s*\{([\s\S]*?)\n\s*\}/
      : new RegExp(`\\[data-style='${escapeRegExp(styleName)}'\\]\\s*\\{([\\s\\S]*?)\\n\\s*\\}`);
  const blockMatch = indexHtmlContent.match(selector);
  if (!blockMatch) {
    throw new Error(`無法從 index.html 提取 ${styleName} skeleton 色票`);
  }

  return Object.fromEntries(
    Object.entries(SKELETON_THEME_KEY_MAP).map(([cssVariable, themeKey]) => {
      const match = blockMatch[1].match(
        new RegExp(`${escapeRegExp(cssVariable)}:\\s*(#[0-9A-Fa-f]{6});`),
      );
      if (!match) {
        throw new Error(`index.html 的 ${styleName} skeleton 缺少 ${cssVariable}`);
      }

      return [themeKey, normalizeHexColor(match[1])];
    }),
  );
}

function extractIndexHtmlThemeColor(indexHtmlContent) {
  const match = indexHtmlContent.match(
    /<meta\s+name="theme-color"\s+content="(#[0-9A-Fa-f]{6})"\s*\/?>/,
  );
  if (!match) {
    throw new Error('無法從 index.html 提取 theme-color meta');
  }

  return normalizeHexColor(match[1]);
}

function extractHtmlThemeColor(htmlContent, fileLabel) {
  const match = htmlContent.match(
    /<meta\s+name="theme-color"\s+content="(#[0-9A-Fa-f]{6})"\s*\/?>/,
  );
  if (!match) {
    throw new Error(`無法從 ${fileLabel} 提取 theme-color meta`);
  }

  return normalizeHexColor(match[1]);
}

function extractStylePreviewMap(themesContent, styleName, themeColors) {
  const previewMatch = themesContent.match(
    new RegExp(
      `value:\\s*'${escapeRegExp(styleName)}'[\\s\\S]*?previewBg:\\s*'([^']+)'[\\s\\S]*?previewText:\\s*'([^']+)'[\\s\\S]*?previewAccent:\\s*'([^']+)'`,
    ),
  );
  if (!previewMatch) {
    if (themesContent.includes('buildStyleOption') && themesContent.includes('STYLE_OPTIONS')) {
      return {
        previewBg: rgbTripletToCssRgb(themeColors.background),
        previewText: rgbTripletToCssRgb(themeColors.text),
        previewAccent: rgbTripletToCssRgb(themeColors.primary),
      };
    }

    throw new Error(`無法從 themes.ts 提取 ${styleName} preview 色票`);
  }

  return {
    previewBg: previewMatch[1],
    previewText: previewMatch[2],
    previewAccent: previewMatch[3],
  };
}

function verifyThemeDefinitions(cssContent, themesContent) {
  const errors = [];

  for (const styleName of THEME_STYLE_NAMES) {
    const cssColors = extractCssThemeColorMap(cssContent, styleName);
    const themeColors = extractThemeDefinitionColorMap(themesContent, styleName);
    const previewColors = extractStylePreviewMap(themesContent, styleName, themeColors);

    for (const [cssKey, themeKey] of Object.entries(THEME_COLOR_KEY_MAP)) {
      const expectedHex = cssColors[cssKey];
      const themeHex = rgbTripletToHex(themeColors[themeKey]);
      if (themeHex !== expectedHex) {
        errors.push(
          `[themes.ts] ${styleName}.colors.${themeKey}=${themeHex} 與 index.css 基準色 ${expectedHex} 不一致`,
        );
      }
    }

    const expectedPreview = {
      previewBg: rgbTripletToCssRgb(themeColors.background),
      previewText: rgbTripletToCssRgb(themeColors.text),
      previewAccent: rgbTripletToCssRgb(themeColors.primary),
    };
    for (const [key, value] of Object.entries(expectedPreview)) {
      if (previewColors[key] !== value) {
        errors.push(`[themes.ts] ${styleName}.${key}=${previewColors[key]} 應為 ${value}`);
      }
    }
  }

  if (errors.length === 0) {
    log(colors.green, '✓', `themes.ts 與 index.css 的 ${THEME_STYLE_NAMES.length} 種風格色票同步`);
  }

  return errors;
}

function verifySkeletonThemeDefinitions(indexHtmlContent, themesContent) {
  const errors = [];

  const zenThemeColor = rgbTripletToHex(
    extractThemeDefinitionColorMap(themesContent, 'zen').primary,
  );
  const indexHtmlThemeColor = extractIndexHtmlThemeColor(indexHtmlContent);
  if (indexHtmlThemeColor !== zenThemeColor) {
    errors.push(`[index.html] theme-color=${indexHtmlThemeColor} 應為 ${zenThemeColor}`);
  }

  for (const styleName of THEME_STYLE_NAMES) {
    const skeletonColors = extractIndexHtmlSkeletonColorMap(indexHtmlContent, styleName);
    const themeColors = extractThemeDefinitionColorMap(themesContent, styleName);

    for (const themeKey of Object.values(SKELETON_THEME_KEY_MAP)) {
      const expectedHex = rgbTripletToHex(themeColors[themeKey]);
      if (skeletonColors[themeKey] !== expectedHex) {
        errors.push(
          `[index.html] ${styleName} skeleton ${themeKey}=${skeletonColors[themeKey]} 應為 ${expectedHex}`,
        );
      }
    }
  }

  if (errors.length === 0) {
    log(
      colors.green,
      '✓',
      `index.html skeleton 與 themes.ts 的 ${THEME_STYLE_NAMES.length} 種風格首屏色票同步`,
    );
  }

  return errors;
}

function verifyPwaThemeArtifacts(manifestContent, offlineHtmlContent, themesContent) {
  const errors = [];
  const zenColors = extractThemeDefinitionColorMap(themesContent, 'zen');
  const expectedThemeColor = rgbTripletToHex(zenColors.primary);
  const expectedBackgroundColor = rgbTripletToHex(zenColors.background);

  let manifest;
  try {
    manifest = JSON.parse(manifestContent);
  } catch (error) {
    throw new Error(`無法解析 manifest.webmanifest: ${error.message}`);
  }

  const manifestThemeColor = normalizeHexColor(manifest.theme_color ?? '');
  if (manifestThemeColor !== expectedThemeColor) {
    errors.push(
      `[manifest.webmanifest] theme_color=${manifestThemeColor || '缺少'} 應為 ${expectedThemeColor}`,
    );
  }

  const manifestBackgroundColor = normalizeHexColor(manifest.background_color ?? '');
  if (manifestBackgroundColor !== expectedBackgroundColor) {
    errors.push(
      `[manifest.webmanifest] background_color=${manifestBackgroundColor || '缺少'} 應為 ${expectedBackgroundColor}`,
    );
  }

  const offlineThemeColor = extractHtmlThemeColor(offlineHtmlContent, 'public/offline.html');
  if (offlineThemeColor !== expectedThemeColor) {
    errors.push(
      `[public/offline.html] theme-color=${offlineThemeColor} 應為 ${expectedThemeColor}`,
    );
  }

  if (errors.length === 0) {
    log(colors.green, '✓', 'manifest.webmanifest 與 offline.html 的 PWA 色票同步');
  }

  return errors;
}

function normalizeFontFamily(fontFamily) {
  return fontFamily
    .replaceAll('"', '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .join(', ');
}

function toFontFamilyTokens(fontFamily) {
  return normalizeFontFamily(fontFamily)
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

function extractTypographySansFamily(tsContent) {
  const match = tsContent.match(/sans:\s*\[([^\]]+)\]/);
  if (!match) {
    throw new Error('無法從 design-tokens.ts 提取 sans font family');
  }

  const parts = [...match[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map(([, single, double]) =>
    (single ?? double).trim(),
  );
  if (parts.length === 0) {
    throw new Error('design-tokens.ts 的 sans font family 為空');
  }

  return normalizeFontFamily(parts.join(', '));
}

function extractDefaultThemeStyle(themesContent) {
  const match = themesContent.match(/style:\s*'([^']+)'/);
  if (!match) {
    throw new Error('無法從 themes.ts 提取預設 style');
  }

  return match[1];
}

function verifyDesignDoc(
  designPath,
  cssPath,
  typographyPath,
  themesPath,
  indexHtmlPath,
  manifestPath,
  offlineHtmlPath,
) {
  const errors = [];

  if (!existsSync(designPath)) {
    return ['[DESIGN.md] 檔案不存在'];
  }

  const designContent = readFileSync(designPath, 'utf-8');
  const cssContent = readFileSync(cssPath, 'utf-8');
  const typographyContent = readFileSync(typographyPath, 'utf-8');
  const themesContent = readFileSync(themesPath, 'utf-8');
  const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');
  const manifestContent = readFileSync(manifestPath, 'utf-8');
  const offlineHtmlContent = readFileSync(offlineHtmlPath, 'utf-8');
  const frontmatter = extractFrontmatter(designContent);

  const requiredSections = [
    '## Overview',
    '## Colors',
    '## Typography',
    '## Elevation',
    '## Components',
    "## Do's and Don'ts",
  ];

  for (const section of requiredSections) {
    if (!designContent.includes(section)) {
      errors.push(`[DESIGN.md] 缺少必要章節: ${section}`);
    }
  }

  if (!designContent.includes('The Quiet Exchange Desk')) {
    errors.push('[DESIGN.md] 缺少 Creative North Star');
  }

  if (!designContent.includes('`zen`')) {
    errors.push('[DESIGN.md] 未聲明 zen 為預設產品語法');
  }

  const expectedName = extractFrontmatterQuotedValue(frontmatter, 'name');
  if (expectedName !== 'RateWise') {
    errors.push(`[DESIGN.md] name 應為 "RateWise"，目前為 "${expectedName ?? '缺少'}"`);
  }

  const docColors = {
    background: extractFrontmatterQuotedValue(frontmatter, 'background'),
    surface: extractFrontmatterQuotedValue(frontmatter, 'surface'),
    'surface-elevated': extractFrontmatterQuotedValue(frontmatter, 'surface-elevated'),
    'surface-sunken': extractFrontmatterQuotedValue(frontmatter, 'surface-sunken'),
    text: extractFrontmatterQuotedValue(frontmatter, 'text'),
    'text-muted': extractFrontmatterQuotedValue(frontmatter, 'text-muted'),
    primary: extractFrontmatterQuotedValue(frontmatter, 'primary'),
    secondary: extractFrontmatterQuotedValue(frontmatter, 'secondary'),
    accent: extractFrontmatterQuotedValue(frontmatter, 'accent'),
    border: extractFrontmatterQuotedValue(frontmatter, 'border'),
    info: extractFrontmatterQuotedValue(frontmatter, 'info'),
    success: extractFrontmatterQuotedValue(frontmatter, 'success'),
    warning: extractFrontmatterQuotedValue(frontmatter, 'warning'),
    destructive: extractFrontmatterQuotedValue(frontmatter, 'destructive'),
  };
  const cssColors = extractZenColorHexMap(cssContent);

  for (const [key, value] of Object.entries(docColors)) {
    if (!value) {
      errors.push(`[DESIGN.md] colors.${key} 缺少值`);
      continue;
    }

    if (value !== cssColors[key]) {
      errors.push(
        `[DESIGN.md] colors.${key}=${value} 與 index.css 基準色 ${cssColors[key]} 不一致`,
      );
    }
  }

  const typographySans = extractTypographySansFamily(typographyContent);
  const displayFontFamily = normalizeFontFamily(
    extractFrontmatterQuotedValue(frontmatter, 'fontFamily') ?? '',
  );
  if (!displayFontFamily.includes('Inter') || !displayFontFamily.includes('Noto Sans TC')) {
    errors.push('[DESIGN.md] typography.display.fontFamily 必須包含 Inter 與 Noto Sans TC');
  }
  const missingFontTokens = toFontFamilyTokens(typographySans).filter(
    (token) => !toFontFamilyTokens(displayFontFamily).includes(token),
  );
  if (missingFontTokens.length > 0) {
    errors.push(
      `[DESIGN.md] typography.display.fontFamily 缺少 design-tokens sans family 項目: ${missingFontTokens.join(', ')}`,
    );
  }
  const displayFontWeight = extractFrontmatterNumberValue(frontmatter, 'fontWeight');
  if (!displayFontWeight) {
    errors.push('[DESIGN.md] typography.display.fontWeight 缺少值');
  }

  const defaultStyle = extractDefaultThemeStyle(themesContent);
  if (defaultStyle !== 'zen') {
    errors.push(`[themes.ts] 預設 style 應為 "zen"，目前為 "${defaultStyle}"`);
  }

  errors.push(...verifyThemeDefinitions(cssContent, themesContent));
  errors.push(...verifySkeletonThemeDefinitions(indexHtmlContent, themesContent));
  errors.push(...verifyPwaThemeArtifacts(manifestContent, offlineHtmlContent, themesContent));

  if (errors.length === 0) {
    log(colors.green, '✓', 'DESIGN.md 與 zen 基準設計 token 同步');
  }

  return errors;
}

/**
 * 驗證 robots.txt 與 seo-paths.config.mjs 的 SSOT 一致性
 *
 * 檢查項目：
 * - DEV_ONLY_PATHS 每條路徑都有對應 Disallow
 * - APP_ONLY_NOINDEX_PATHS 路徑不應有 Disallow（由 SEOHelmet noindex 處理）
 * - Sitemap URL 與 SITE_CONFIG.url 一致
 */
async function verifyRobotsTxt(mjsPath, robotsTxtPath) {
  const errors = [];

  if (!existsSync(robotsTxtPath)) {
    return [
      `[robots.txt] 檔案不存在: ${robotsTxtPath}（請先執行 node scripts/generate-robots-txt.mjs）`,
    ];
  }

  let mod;
  try {
    mod = await import(pathToFileURL(mjsPath).href);
  } catch (e) {
    return [`[robots.txt] 無法載入 seo-paths.config.mjs: ${e.message}`];
  }

  const devOnlyPaths = mod.DEV_ONLY_PATHS;
  const noindexPaths = mod.APP_ONLY_NOINDEX_PATHS;
  const siteUrl = mod.SITE_CONFIG?.url;

  if (!Array.isArray(devOnlyPaths) || !Array.isArray(noindexPaths) || !siteUrl) {
    return [
      '[robots.txt] seo-paths.config.mjs 缺少 DEV_ONLY_PATHS / APP_ONLY_NOINDEX_PATHS / SITE_CONFIG',
    ];
  }

  const robotsTxt = readFileSync(robotsTxtPath, 'utf-8');
  const expectedSitemap = `Sitemap: ${siteUrl}sitemap.xml`;

  // 從 SITE_CONFIG.url 提取生產環境 base path（例如 /ratewise）。
  const siteUrlObj = new URL(siteUrl);
  const basePath = siteUrlObj.pathname.replace(/\/$/, ''); // '/ratewise'

  // DEV_ONLY_PATHS 必須有 Disallow（含 base path 前綴與尾斜線）
  for (const path of devOnlyPaths) {
    const normalized = path.endsWith('/') ? path : `${path}/`;
    const disallowEntry = `Disallow: ${basePath}${normalized}`;
    if (!robotsTxt.includes(disallowEntry)) {
      errors.push(`[robots.txt] DEV_ONLY_PATHS "${path}" 缺少 "${disallowEntry}"`);
    }
  }

  // APP_ONLY_NOINDEX_PATHS 不應有 Disallow（Google 需爬取才能讀 noindex）
  for (const path of noindexPaths) {
    const fullPath = `${basePath}${path}`;
    const fullBare = fullPath.replace(/\/$/, '');
    if (
      robotsTxt.includes(`Disallow: ${fullPath}`) ||
      robotsTxt.includes(`Disallow: ${fullBare}`)
    ) {
      errors.push(
        `[robots.txt] noindex 頁面 "${path}" 有 Disallow（應移除，改由 SEOHelmet noindex 處理）`,
      );
    }
  }

  // Sitemap URL 須與 SITE_CONFIG.url 一致
  if (!robotsTxt.includes(expectedSitemap)) {
    errors.push(`[robots.txt] Sitemap URL 不符，預期: "${expectedSitemap}"`);
  }

  if (errors.length === 0) {
    log(
      colors.green,
      '✓',
      `robots.txt SSOT 同步（DEV Disallow: ${devOnlyPaths.length} 條，noindex 頁面: ${noindexPaths.length} 條未 Disallow）`,
    );
  }

  return errors;
}

/**
 * 驗證單一路徑群組的 TS/MJS 一致性
 */
function verifyGroup(groupName, tsContent, mjsContent, asSuffix) {
  const tsPaths = extractNamedArray(tsContent, groupName, asSuffix);
  const mjsPaths = extractNamedArray(mjsContent, groupName);
  if (tsPaths.length === 0 && mjsPaths.length === 0) return [];
  const errors = comparePaths(tsPaths, mjsPaths).map((e) => `[${groupName}] ${e}`);
  if (errors.length === 0) {
    log(colors.green, '✓', `${groupName}: ${tsPaths.length} 路徑一致`);
  }
  return errors;
}

function verifyDynamicPatterns(tsPatterns, mjsPatterns) {
  const errors = comparePaths(tsPatterns, mjsPatterns).map(
    (error) => `[SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS] ${error}`,
  );
  if (errors.length === 0) {
    log(
      colors.green,
      '✓',
      `SUPPORTED_DYNAMIC_AMOUNT_ROUTE_PATTERNS: ${tsPatterns.length} 規則一致`,
    );
  }
  return errors;
}

async function main() {
  console.log('\n🔍 SSOT 同步驗證');
  console.log('─'.repeat(50));

  const tsPath = join(__dirname, '../apps/ratewise/src/config/seo-paths.ts');
  const mjsPath = join(__dirname, '../apps/ratewise/seo-paths.config.mjs');
  const designDocPath = join(__dirname, '../DESIGN.md');
  const indexCssPath = join(__dirname, '../apps/ratewise/src/index.css');
  const designTokensPath = join(__dirname, '../apps/ratewise/src/config/design-tokens.ts');
  const themesPath = join(__dirname, '../apps/ratewise/src/config/themes.ts');
  const indexHtmlPath = join(__dirname, '../apps/ratewise/index.html');
  const manifestPath = join(__dirname, '../apps/ratewise/public/manifest.webmanifest');
  const offlineHtmlPath = join(__dirname, '../apps/ratewise/public/offline.html');

  let hasErrors = false;
  let shouldShowPathDetails = false;

  try {
    console.log('\n📂 讀取配置文件:');
    log(colors.cyan, '→', 'TypeScript: src/config/seo-paths.ts');
    const tsPaths = extractPathsFromTS(tsPath);
    log(colors.green, '✓', `提取 ${tsPaths.length} 個 canonical 路徑`);

    log(colors.cyan, '→', 'JavaScript: seo-paths.config.mjs');
    const mjsPaths = await extractPathsFromMJS(mjsPath);
    log(colors.green, '✓', `提取 ${mjsPaths.length} 個 canonical 路徑`);

    console.log('\n🔄 比較 canonical paths:');
    const seoErrors = comparePaths(tsPaths, mjsPaths);

    if (seoErrors.length === 0) {
      log(colors.green, '✅', 'INDEXABLE_CANONICAL_PATHS 完全同步！');
      console.log(`   TypeScript: ${tsPaths.length} | JavaScript: ${mjsPaths.length}`);
    } else {
      log(colors.red, '❌', 'INDEXABLE_CANONICAL_PATHS 不同步:');
      seoErrors.forEach((e) => log(colors.red, '  ✗', e));
      hasErrors = true;
      shouldShowPathDetails = true;
    }

    console.log('\n🔄 比較動態金額路由規則:');
    const tsPatterns = extractDynamicPatternsFromTS(tsPath);
    const mjsPatterns = await extractDynamicPatternsFromMJS(mjsPath);
    const dynamicErrors = verifyDynamicPatterns(tsPatterns, mjsPatterns);
    if (dynamicErrors.length > 0) {
      dynamicErrors.forEach((e) => log(colors.red, '  ✗', e));
      hasErrors = true;
      shouldShowPathDetails = true;
    }

    console.log('\n🔄 比較其他路徑群組:');
    const tsContent = readFileSync(tsPath, 'utf-8');
    const mjsContent = readFileSync(mjsPath, 'utf-8');

    const groups = [
      'CONTENT_SEO_PATHS',
      'CURRENCY_SEO_PATHS',
      'REVERSE_CURRENCY_SEO_PATHS',
      'APP_ONLY_PATHS',
      'LEGAL_SSG_PATHS',
      'SEO_FILES',
    ];
    for (const group of groups) {
      const groupErrors = verifyGroup(group, tsContent, mjsContent, ' as const');
      if (groupErrors.length > 0) {
        groupErrors.forEach((e) => log(colors.red, '  ✗', e));
        hasErrors = true;
        shouldShowPathDetails = true;
      }
    }

    console.log('\n🤖 robots.txt SSOT 驗證:');
    const robotsTxtPath = join(__dirname, '../apps/ratewise/public/robots.txt');
    const robotsErrors = await verifyRobotsTxt(mjsPath, robotsTxtPath);
    if (robotsErrors.length > 0) {
      robotsErrors.forEach((e) => log(colors.red, '  ✗', e));
      hasErrors = true;
    }

    console.log('\n🎨 DESIGN SSOT 驗證:');
    const designErrors = verifyDesignDoc(
      designDocPath,
      indexCssPath,
      designTokensPath,
      themesPath,
      indexHtmlPath,
      manifestPath,
      offlineHtmlPath,
    );
    if (designErrors.length > 0) {
      designErrors.forEach((e) => log(colors.red, '  ✗', e));
      hasErrors = true;
    }

    if (shouldShowPathDetails) {
      console.log('\n📋 詳細路徑列表:');
      console.log('\nTypeScript canonical paths:');
      tsPaths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
      console.log('\nJavaScript canonical paths:');
      mjsPaths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
    }
  } catch (error) {
    log(colors.red, '❌', `驗證失敗: ${error.message}`);
    hasErrors = true;
  }

  console.log('\n' + '─'.repeat(50));

  if (hasErrors) {
    console.log('\n💡 修復建議:');
    console.log('  1. 檢查 src/config/seo-paths.ts 和 seo-paths.config.mjs');
    console.log(
      '  2. 確保所有路徑群組完全一致（INDEXABLE_CANONICAL_PATHS, APP_ONLY_PATHS, SEO_FILES 等）',
    );
    console.log('  3. 路徑必須按照相同順序排列');
    console.log('  4. 路徑格式必須一致（包括尾斜線）');
    console.log(
      '  5. robots.txt 漂移：執行 node apps/ratewise/scripts/generate-robots-txt.mjs 重新生成\n',
    );
    console.log(
      '  6. DESIGN.md 漂移：同步 root DESIGN.md、src/index.css、design-tokens.ts 與 themes.ts\n',
    );
    process.exit(1);
  } else {
    console.log('');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('驗證腳本錯誤:', error);
  process.exit(1);
});
