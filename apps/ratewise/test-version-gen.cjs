#!/usr/bin/env node
/**
 * 測試 version.json 生成腳本
 * 用於驗證版本號生成邏輯是否正確
 */

const { writeFileSync, mkdirSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

// 讀取 package.json 版本
function readPackageVersion() {
  const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
  return packageJson.version;
}

// 生成版本資訊
const appVersion = readPackageVersion();
const buildTime = new Date().toISOString();

const versionData = {
  version: appVersion,
  buildTime: buildTime,
  packageVersion: appVersion,
};

// 確保 dist 目錄存在
const distPath = resolve(__dirname, 'dist');
mkdirSync(distPath, { recursive: true });

// 寫入 version.json
const versionPath = resolve(distPath, 'version.json');
writeFileSync(
  versionPath,
  JSON.stringify(versionData, null, 2),
  'utf-8'
);

console.log('✅ version.json 生成成功!');
console.log(`   路徑: ${versionPath}`);
console.log(`   版本: ${appVersion}`);
console.log(`   建置時間: ${buildTime}`);
console.log('\n檔案內容:');
console.log(JSON.stringify(versionData, null, 2));

