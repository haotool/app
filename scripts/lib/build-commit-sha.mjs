import { execSync } from 'node:child_process';

// 建置期 commit SHA 解析 SSOT：apps/* 的 vite config 共用同一條來源鏈，
// 避免版本指紋邏輯各寫一份而漂移。
//
// 來源優先序：
// 1. ZEABUR_GIT_COMMIT_SHA — Zeabur build 階段內建特殊變數（生產部署唯一可得來源，
//    因 .dockerignore 排除 .git，建置容器內無 git repo）。
//    https://zeabur.com/docs/en-US/deploy/config/environment-variables
// 2. GIT_COMMIT_HASH — repo Docker/CI 慣例 build arg（build-docker.sh、GitHub Actions）。
// 3. git rev-parse — 本地開發環境。
const SHA_ENV_KEYS = ['ZEABUR_GIT_COMMIT_SHA', 'GIT_COMMIT_HASH'];

const SHORT_SHA_LENGTH = 7;

// 排除空字串與未展開的 `${VAR}` 佔位：Docker 對未傳入的 ARG 會設成空字串。
const SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

function readGitHead() {
  try {
    return execSync('git rev-parse --short=40 HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/**
 * 解析建置期 short commit SHA；所有來源皆不可得時回傳空字串。
 *
 * @param {Record<string, string | undefined>} [env] 建置環境變數。
 * @param {() => string} [gitHead] git HEAD 解析器（測試注入用）。
 * @returns {string} 7 碼 short SHA，或空字串。
 */
export function resolveBuildCommitSha(env = process.env, gitHead = readGitHead) {
  for (const key of SHA_ENV_KEYS) {
    const value = (env[key] ?? '').trim();
    if (SHA_PATTERN.test(value)) return value.slice(0, SHORT_SHA_LENGTH).toLowerCase();
  }

  const fromGit = gitHead().trim();
  return SHA_PATTERN.test(fromGit) ? fromGit.slice(0, SHORT_SHA_LENGTH).toLowerCase() : '';
}
