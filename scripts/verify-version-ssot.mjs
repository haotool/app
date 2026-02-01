/**
 * 版本 SSOT 驗證
 *
 * 驗證重點:
 * 1. 禁止在 src 內直接讀取 import.meta.env.VITE_APP_VERSION
 * 2. 禁止在 src 內硬編碼版本相關 storage key
 * 3. 若 staged 變更包含 package.json 版本，則要求 root 與 app 版本一致
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const appDir = join(rootDir, 'apps', 'ratewise');
const appSrcDir = join(appDir, 'src');

const ALLOWED_ENV_FILES = new Set([
  join(appSrcDir, 'config', 'version.ts'),
  join(appSrcDir, 'vite-env.d.ts'),
]);
const ALLOWED_STORAGE_KEY_FILES = new Set([
  join(appSrcDir, 'features', 'ratewise', 'storage-keys.ts'),
]);

const errors = [];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function walkFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkFiles(fullPath, files);
      continue;
    }
    if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function ensureNoDirectEnvAccess() {
  const files = walkFiles(appSrcDir);
  for (const file of files) {
    if (ALLOWED_ENV_FILES.has(file)) continue;
    const content = readFileSync(file, 'utf-8');
    if (content.includes('import.meta.env.VITE_APP_VERSION')) {
      errors.push(`禁止直接使用 import.meta.env.VITE_APP_VERSION: ${relative(rootDir, file)}`);
    }
  }
}

function ensureNoRawStorageKeys() {
  const files = walkFiles(appSrcDir);
  for (const file of files) {
    if (ALLOWED_STORAGE_KEY_FILES.has(file)) continue;
    const content = readFileSync(file, 'utf-8');
    if (content.includes('app_version') || content.includes('version_history')) {
      errors.push(`禁止硬編碼版本 storage key: ${relative(rootDir, file)}`);
    }
  }
}

function ensureVersionSyncIfStaged() {
  const stagedFiles = getStagedFiles();
  const hasPackageVersionChange = stagedFiles.some(
    (file) => file === 'package.json' || file === 'apps/ratewise/package.json',
  );
  if (!hasPackageVersionChange) return;

  const rootVersion = readJson(join(rootDir, 'package.json')).version;
  const appVersion = readJson(join(appDir, 'package.json')).version;
  if (rootVersion !== appVersion) {
    errors.push(
      `版本不一致: package.json=${rootVersion} / apps/ratewise/package.json=${appVersion}`,
    );
  }
}

function readStaged(filePath) {
  try {
    return execSync(`git show :${filePath}`, { encoding: 'utf-8' });
  } catch {
    return null;
  }
}

function readFromGit(ref, filePath) {
  try {
    return execSync(`git show ${ref}:${filePath}`, { encoding: 'utf-8' });
  } catch {
    return null;
  }
}

function hasPackageVersionBump(filePath) {
  const stagedContent = readStaged(filePath);
  if (!stagedContent) return false;

  const headContent = readFromGit('HEAD', filePath);
  if (!headContent) return true;

  const stagedVersion = JSON.parse(stagedContent).version;
  const headVersion = JSON.parse(headContent).version;
  return stagedVersion !== headVersion;
}

function isRuntimeChange(filePath) {
  if (filePath.startsWith('apps/ratewise/public/')) return true;
  if (filePath === 'apps/ratewise/index.html') return true;
  if (filePath === 'apps/ratewise/vite.config.ts') return true;
  if (!filePath.startsWith('apps/ratewise/src/')) return false;

  const isTestFile =
    filePath.includes('/__tests__/') ||
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.test.tsx') ||
    filePath.endsWith('.spec.ts') ||
    filePath.endsWith('.spec.tsx') ||
    filePath.endsWith('.stories.tsx');

  return !isTestFile;
}

function ensureChangelogUpdatedIfVersionChanged() {
  const stagedFiles = getStagedFiles();
  const hasPackageVersionChange = stagedFiles.some(
    (file) => file === 'package.json' || file === 'apps/ratewise/package.json',
  );
  if (!hasPackageVersionChange) return;

  // 讀取暫存區的 package.json 取得目標版本
  const stagedPkg = readStaged('apps/ratewise/package.json');
  const appVersion = stagedPkg
    ? JSON.parse(stagedPkg).version
    : readJson(join(appDir, 'package.json')).version;

  // 確認 CHANGELOG.md 已暫存且包含版本條目
  if (!stagedFiles.includes('CHANGELOG.md')) {
    errors.push(`CHANGELOG.md 未暫存：版本 ${appVersion} 變更需同步更新 CHANGELOG`);
    return;
  }

  const changelog = readStaged('CHANGELOG.md');
  if (!changelog) {
    errors.push(`無法讀取暫存區 CHANGELOG.md`);
    return;
  }

  const versionHeader = `## [${appVersion}]`;
  if (!changelog.includes(versionHeader)) {
    errors.push(`CHANGELOG.md 缺少版本 ${appVersion} 條目`);
  }
}

function ensureVersionBumpForAppChanges() {
  const stagedFiles = getStagedFiles();
  const hasRuntimeChanges = stagedFiles.some((file) => isRuntimeChange(file));
  if (!hasRuntimeChanges) return;

  const hasVersionBump =
    hasPackageVersionBump('apps/ratewise/package.json') || hasPackageVersionBump('package.json');
  const hasChangeset = stagedFiles.some(
    (file) => file.startsWith('.changeset/') && file.endsWith('.md'),
  );

  if (!hasVersionBump && !hasChangeset) {
    errors.push('偵測到 RateWise 產出內容變更，需更新版本號或新增 changeset 檔案');
  }
}

function main() {
  ensureNoDirectEnvAccess();
  ensureNoRawStorageKeys();
  ensureVersionSyncIfStaged();
  ensureChangelogUpdatedIfVersionChanged();
  ensureVersionBumpForAppChanges();

  if (errors.length > 0) {
    console.error('版本 SSOT 驗證失敗:');
    for (const message of errors) {
      console.error(`- ${message}`);
    }
    process.exit(1);
  }
  console.log('版本 SSOT 驗證通過');
}

main();
