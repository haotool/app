/**
 * 自動版本號生成模組
 *
 * @description
 * 策略: 發佈時使用 package.json 語義化版本，開發時附加 git metadata
 * 格式: {semver}[+sha.{hash}[-dirty]] or {semver}[+build.{distance}]
 *
 * @author Linus-style refactoring [2025-11-10]
 * @reference [context7:vitejs/vite:2025-10-21]
 */

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/**
 * 讀取 package.json 版本號
 */
export function readPackageVersion(packagePath: string): string {
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8')) as { version: string };
  return packageJson.version;
}

/**
 * 嘗試從 Git 標籤獲取版本號
 * @returns 版本號（如: "1.1.0" 或 "1.1.0+build.5"）或 null（如果無標籤）
 */
export function getVersionFromGitTag(): string | null {
  try {
    const matchingTags = execSync('git tag --list "@app/ratewise@*"', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (matchingTags.length === 0) {
      return null;
    }

    const described: string = execSync('git describe --tags --long --match "@app/ratewise@*"', {
      encoding: 'utf-8',
    }).trim();

    const tagMatch = /@app\/ratewise@(\d+\.\d+\.\d+)-(\d+)-g[0-9a-f]+/.exec(described);
    if (!tagMatch) {
      return null;
    }

    const tagVersion = tagMatch[1] ?? '1.0.0';
    const distance = tagMatch[2] ?? '0';
    return Number(distance) === 0 ? tagVersion : `${tagVersion}+build.${distance}`;
  } catch {
    return null;
  }
}

/**
 * 使用 Git commit 數生成版本號
 * @param baseVersion - package.json 中的基礎版本
 * @returns 版本號（如: "1.0.123"）或 null（如果 Git 不可用）
 *
 * [fix:2025-11-05] 優先使用環境變數 GIT_COMMIT_COUNT（Docker 建置時提供）
 * 參考: Dockerfile ARG/ENV 最佳實踐
 */
export function getVersionFromCommitCount(baseVersion: string): string | null {
  try {
    // 優先使用 Docker build args 傳入的環境變數
    const commitCount =
      process.env['GIT_COMMIT_COUNT'] ??
      execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();

    const [major = '1', minor = '0'] = baseVersion.split('.').slice(0, 2);
    return `${major}.${minor}.${commitCount}`;
  } catch {
    return null;
  }
}

/**
 * 開發環境版本號（附加 Git SHA 和 dirty 標記）
 * @param baseVersion - package.json 中的基礎版本
 * @returns 開發版本號（如: "1.0.0+sha.abc123f-dirty"）
 *
 * [fix:2025-11-05] 優先使用環境變數 GIT_COMMIT_HASH（Docker 建置時提供）
 */
export function getDevelopmentVersion(baseVersion: string): string {
  try {
    const commitHash =
      process.env['GIT_COMMIT_HASH'] ??
      execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();

    const isDirty =
      execSync('git status --porcelain', { encoding: 'utf-8' }).trim().length > 0 ? '-dirty' : '';
    return `${baseVersion}+sha.${commitHash}${isDirty}`;
  } catch {
    return baseVersion;
  }
}

/**
 * 生成版本號（主函數）
 * 使用 nullish coalescing 串接多個策略，清晰簡潔
 *
 * [fix:2025-11-06] 加強健壯性：確保生產環境總能生成有效版本
 */
export function generateVersion(packagePath: string): string {
  const baseVersion = readPackageVersion(packagePath);

  // 開發環境：附加 Git metadata
  if (!process.env['CI'] && process.env['NODE_ENV'] !== 'production') {
    return getDevelopmentVersion(baseVersion);
  }

  // 生產環境：優先使用 Git 標籤，次之 commit 數，最後 fallback 到 package.json
  const version = getVersionFromGitTag() ?? getVersionFromCommitCount(baseVersion) ?? baseVersion;

  // [fix:2025-11-06] 確保版本號完整且有效
  if (!version || version.length < 5) {
    console.warn(
      `⚠️ Generated version is invalid: "${version}", using baseVersion: ${baseVersion}`,
    );
    return baseVersion;
  }

  console.log(`✅ Generated version: ${version}`);
  return version;
}


