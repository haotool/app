import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { APP_INFO } from '../src/config/app-info.ts';
import { STYLE_DEFINITIONS } from '../src/config/themes.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const zenColors = STYLE_DEFINITIONS.zen.colors;
const DARK_TEXT_COLOR = '2 6 23';
const LIGHT_TEXT_COLOR = '255 255 255';

function rgbTripletToHex(rgbTriplet) {
  return `#${rgbTriplet
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function rgbTripletToRgba(rgbTriplet, alpha) {
  const rgb = rgbTriplet
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10))
    .join(', ');

  return `rgba(${rgb}, ${alpha})`;
}

function rgbTripletToNumbers(rgbTriplet) {
  return rgbTriplet
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10));
}

function relativeLuminance(rgbTriplet) {
  const [red, green, blue] = rgbTripletToNumbers(rgbTriplet).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrastRatio(foreground, background) {
  const foregroundLuminosity = relativeLuminance(foreground);
  const backgroundLuminosity = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminosity, backgroundLuminosity);
  const darker = Math.min(foregroundLuminosity, backgroundLuminosity);

  return (lighter + 0.05) / (darker + 0.05);
}

function choosePrimaryForeground(primary) {
  return contrastRatio(LIGHT_TEXT_COLOR, primary) >= contrastRatio(DARK_TEXT_COLOR, primary)
    ? LIGHT_TEXT_COLOR
    : DARK_TEXT_COLOR;
}

function buildOfflineStyleBlock([styleName, definition]) {
  const { colors } = definition;
  const primaryForeground = choosePrimaryForeground(colors.primary);

  return `html[data-style='${styleName}'] {
        --offline-theme-color: ${rgbTripletToHex(colors.primary)};
        --offline-background: ${rgbTripletToHex(colors.background)};
        --offline-surface: ${rgbTripletToHex(colors.surface)};
        --offline-border: ${rgbTripletToHex(colors.border)};
        --offline-text: ${rgbTripletToHex(colors.text)};
        --offline-text-muted: ${rgbTripletToHex(colors.textMuted)};
        --offline-primary: ${rgbTripletToHex(colors.primary)};
        --offline-primary-foreground: ${rgbTripletToHex(primaryForeground)};
        --offline-secondary: ${rgbTripletToHex(colors.secondary)};
        --offline-accent: ${rgbTripletToHex(colors.accent)};
        --offline-primary-tint: ${rgbTripletToRgba(colors.primary, 0.08)};
        --offline-primary-border-tint: ${rgbTripletToRgba(colors.primary, 0.18)};
        --offline-primary-shadow-soft: ${rgbTripletToRgba(colors.primary, 0.18)};
        --offline-primary-shadow-strong: ${rgbTripletToRgba(colors.primary, 0.26)};
        --offline-primary-shadow-hover: ${rgbTripletToRgba(colors.primary, 0.34)};
        --offline-warning-tint: ${rgbTripletToRgba(colors.warning, 0.16)};
        --offline-warning: ${rgbTripletToHex(colors.warning)};
        --offline-success-tint: ${rgbTripletToRgba(colors.success, 0.12)};
        --offline-success: ${rgbTripletToHex(colors.success)};
      }`;
}

const themeColorMap = Object.fromEntries(
  Object.entries(STYLE_DEFINITIONS).map(([styleName, definition]) => [
    styleName,
    rgbTripletToHex(definition.colors.primary),
  ]),
);

const offlineThemeTokens = {
  __THEME_COLOR__: rgbTripletToHex(zenColors.primary),
  __OFFLINE_STYLE_BLOCKS__: Object.entries(STYLE_DEFINITIONS)
    .map(buildOfflineStyleBlock)
    .join('\n\n      '),
  __OFFLINE_THEME_COLOR_MAP__: JSON.stringify(themeColorMap),
};

function substitute(template) {
  return Object.entries(offlineThemeTokens).reduce(
    (content, [token, value]) => content.replace(new RegExp(token, 'g'), value),
    template
      .replace(/__BRAND_SHORT__/g, APP_INFO.shortName)
      .replace(/__BRAND_FULL__/g, APP_INFO.name),
  );
}

async function generate(templatePath, outPath) {
  const template = readFileSync(resolve(ROOT, templatePath), 'utf-8');
  const content = substitute(template);
  const absoluteOutPath = resolve(ROOT, outPath);
  const prettierConfig = (await resolveConfig(absoluteOutPath)) ?? {};
  const formatted = outPath.endsWith('.html')
    ? await format(content, { ...prettierConfig, filepath: absoluteOutPath })
    : content;
  writeFileSync(absoluteOutPath, formatted);
  console.log(`  ✅ ${outPath}`);
}

console.log('🧾 生成靜態資源（從品牌模板）...');
await generate('scripts/templates/offline.template.html', 'public/offline.html');
await generate('scripts/templates/security.template.txt', 'public/.well-known/security.txt');
console.log('✅ 靜態品牌資源生成完成');
