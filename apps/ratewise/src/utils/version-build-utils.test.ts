import { describe, expect, it } from 'vitest';
import { getVersionFromCommitCount } from './version-build-utils';

describe('version-build-utils', () => {
  it('commit count 為空字串時回傳 null，避免產生無效 build metadata', () => {
    expect(getVersionFromCommitCount('2.9.0', '')).toBeNull();
  });

  it('commit count 非數字時回傳 null', () => {
    expect(getVersionFromCommitCount('2.9.0', 'abc')).toBeNull();
  });

  it('有效 commit count 會產生正確 build metadata', () => {
    expect(getVersionFromCommitCount('2.9.0', '321')).toBe('2.9.0+build.321');
  });
});
