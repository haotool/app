import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const FORBIDDEN = [
  { phrase: '30+ 種貨幣', replacement: '18 種貨幣' },
  { phrase: '248 個可索引', replacement: '249 個可索引' },
  { phrase: '248 個 SEO URL', replacement: '249 個 SEO URL' },
  { phrase: '17 URLs', replacement: '249 SEO paths / historical only' },
  { phrase: '13 個長尾頁', replacement: 'historical only' },
  { phrase: 'generate-sitemap.mjs', replacement: 'generate-sitemap-2025.mjs' },
  { phrase: 'priority 欄位', replacement: 'lastmod / hreflang / image sitemap' },
];

const TARGETS = [
  'README.md',
  'apps/ratewise/README.md',
  'docs',
  'apps/ratewise/docs',
  'apps/ratewise/src',
];

const ALLOW_PATTERNS = [
  /^docs\/archive\//,
  /\.superseded\.md$/,
  /^docs\/dev\/002_/,
  /^apps\/ratewise\/docs\/dev\/002_/,
  /(?:^|\/)LIGHTHOUSE_OPTIMIZATION_LOG\.md$/,
  /(?:^|\/)__tests__\//,
  /\.test\.(ts|tsx)$/,
];

const isAllowed = (relativePath) => ALLOW_PATTERNS.some((pattern) => pattern.test(relativePath));

const shouldScanFile = (relativePath) => {
  if (isAllowed(relativePath)) return false;
  return /\.(md|ts|tsx)$/.test(relativePath);
};

const walk = (targetPath, collector) => {
  const absolute = path.resolve(ROOT, targetPath);
  if (!fs.existsSync(absolute)) return;
  const stat = fs.statSync(absolute);

  if (stat.isFile()) {
    const relativePath = path.relative(ROOT, absolute).replaceAll(path.sep, '/');
    if (shouldScanFile(relativePath)) collector.push(absolute);
    return;
  }

  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    walk(path.join(targetPath, entry.name), collector);
  }
};

const files = [];
for (const target of TARGETS) walk(target, files);

const violations = [];

for (const file of files) {
  const relativePath = path.relative(ROOT, file).replaceAll(path.sep, '/');
  const content = fs.readFileSync(file, 'utf8');

  if (content.includes('⚠️ SUPERSEDED / 歷史文件')) {
    continue;
  }

  for (const rule of FORBIDDEN) {
    if (content.includes(rule.phrase)) {
      violations.push(`${relativePath}: "${rule.phrase}" → 建議改為 "${rule.replacement}"`);
    }
  }
}

if (violations.length > 0) {
  console.error('❌ Documentation / public surface SSOT drift detected:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`✅ No documentation/public surface SSOT drift across ${files.length} files.`);
