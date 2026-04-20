import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_INFO } from '../src/config/app-info.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function substitute(template) {
  return template
    .replace(/__BRAND_SHORT__/g, APP_INFO.shortName)
    .replace(/__BRAND_FULL__/g, APP_INFO.name);
}

function generate(templatePath, outPath) {
  const template = readFileSync(resolve(ROOT, templatePath), 'utf-8');
  writeFileSync(resolve(ROOT, outPath), substitute(template));
  console.log(`  ✅ ${outPath}`);
}

console.log('🧾 生成靜態資源（從品牌模板）...');
generate('scripts/templates/offline.template.html', 'public/offline.html');
generate('scripts/templates/security.template.txt', 'public/.well-known/security.txt');
console.log('✅ 靜態品牌資源生成完成');
