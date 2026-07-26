import { describe, expect, it } from 'vitest';

import { resolveBuildCommitSha } from '../lib/build-commit-sha.mjs';

const FULL_SHA = '9505d2b1e1030141ae9745e589b85909a70bdf23';
const noGit = () => '';

describe('resolveBuildCommitSha / 來源優先序', () => {
  it('優先採用 Zeabur 內建 ZEABUR_GIT_COMMIT_SHA 並裁成 7 碼', () => {
    expect(resolveBuildCommitSha({ ZEABUR_GIT_COMMIT_SHA: FULL_SHA }, noGit)).toBe('9505d2b');
  });

  it('Zeabur 變數缺席時退回 repo Docker 慣例 GIT_COMMIT_HASH', () => {
    expect(resolveBuildCommitSha({ GIT_COMMIT_HASH: 'abc1234' }, noGit)).toBe('abc1234');
  });

  it('兩個 env 皆缺席時退回 git rev-parse', () => {
    expect(resolveBuildCommitSha({}, () => FULL_SHA)).toBe('9505d2b');
  });

  it('全部來源皆不可得時回傳空字串（呼叫端省略版本後綴）', () => {
    expect(resolveBuildCommitSha({}, noGit)).toBe('');
  });
});

describe('resolveBuildCommitSha / 無效值防禦', () => {
  it('Docker 未傳入 ARG 造成的空字串不算命中，續往下一個來源', () => {
    expect(
      resolveBuildCommitSha({ ZEABUR_GIT_COMMIT_SHA: '', GIT_COMMIT_HASH: 'abc1234' }, noGit),
    ).toBe('abc1234');
  });

  it('未展開的 ${} 佔位不算命中', () => {
    expect(
      resolveBuildCommitSha({ ZEABUR_GIT_COMMIT_SHA: '${ZEABUR_GIT_COMMIT_SHA}' }, noGit),
    ).toBe('');
  });

  it('長度不足 7 碼的殘值不算命中', () => {
    expect(resolveBuildCommitSha({ GIT_COMMIT_HASH: 'abc12' }, () => FULL_SHA)).toBe('9505d2b');
  });

  it('大寫 SHA 正規化為小寫，避免同一 commit 產生兩種版本字串', () => {
    expect(resolveBuildCommitSha({ GIT_COMMIT_HASH: 'ABC1234DEF' }, noGit)).toBe('abc1234');
  });
});
