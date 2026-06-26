/**
 * Radius SSOT 守門測試
 *
 * 設計系統圓角採語義五級制（card/panel/control/icon/compact）+ full/none。
 * 本測試防止元件層回歸使用 bare `rounded` 或 Tailwind 原生尺寸
 * （rounded-sm/md/lg/xl/2xl/3xl），與 themes.test.ts 的顏色守門同級。
 *
 * 允許：rounded-card / rounded-panel / rounded-control / rounded-icon /
 *       rounded-compact / rounded-full / rounded-none 及其方向變體。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = join(__dirname, '..', '..');
const SCAN_DIRS = ['components', 'features', 'pages'] as const;
const EXTRA_FILES = [join(SRC_ROOT, 'config', 'design-tokens.ts')];

/** bare rounded 或 Tailwind 原生尺寸（含方向變體），語義 token 與 full/none 不受限 */
const FORBIDDEN_RADIUS_PATTERN =
  /(?:^|[\s"'`{])rounded(?:-(?:t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee))?(?:-(?:sm|md|lg|xl|2xl|3xl))?(?=$|[\s"'`}])/;

const EXCLUDED_SEGMENTS = ['__tests__', 'node_modules'];
const EXCLUDED_FILE_PATTERN = /\.(test|spec|stories)\.tsx?$/;

function collectTsxFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    if (EXCLUDED_SEGMENTS.includes(entry)) continue;
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectTsxFiles(fullPath));
    } else if (fullPath.endsWith('.tsx') && !EXCLUDED_FILE_PATTERN.test(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('radius SSOT 守門', () => {
  it('元件層與 design-tokens 不得使用 bare rounded 或 Tailwind 原生圓角尺寸', () => {
    const targets = [
      ...SCAN_DIRS.flatMap((dir) => collectTsxFiles(join(SRC_ROOT, dir))),
      ...EXTRA_FILES,
    ];

    const offenders: string[] = [];
    for (const file of targets) {
      const source = readFileSync(file, 'utf8');
      const lines = source.split('\n');
      lines.forEach((line, index) => {
        // 只檢查 className / token 字串語境，避免註解中的一般英文誤判
        if (!/className|rounded/.test(line)) return;
        if (/^\s*(\*|\/\/|\/\*)/.test(line)) return;
        if (FORBIDDEN_RADIUS_PATTERN.test(line)) {
          offenders.push(`${relative(SRC_ROOT, file)}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    expect(
      offenders,
      `發現非語義圓角（請改用 rounded-card/panel/control/icon/compact/full/none）：\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
