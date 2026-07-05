/** LanguagePreferenceSync — hydration 後才套用語言偏好，且每次 page load 僅同步一次（issue #560）。 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import {
  LanguagePreferenceSync,
  resetLanguagePreferenceSyncForTests,
} from '../LanguagePreferenceSync';
import i18n, { getPreferredLanguage } from '../../i18n';

vi.mock('../../i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../i18n')>();
  return { ...actual, getPreferredLanguage: vi.fn(() => 'zh-TW') };
});

const getPreferredLanguageMock = vi.mocked(getPreferredLanguage);

describe('LanguagePreferenceSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLanguagePreferenceSyncForTests();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // 還原全域語言，避免污染同檔其他測試
    if (i18n.resolvedLanguage !== 'zh-TW') {
      await i18n.changeLanguage('zh-TW');
    }
  });

  it('偏好與目前語言不同時，mount 後切換到偏好語言', () => {
    getPreferredLanguageMock.mockReturnValue('en');
    const changeLanguageSpy = vi
      .spyOn(i18n, 'changeLanguage')
      .mockResolvedValue((() => '') as never);

    render(<LanguagePreferenceSync />);

    expect(changeLanguageSpy).toHaveBeenCalledTimes(1);
    expect(changeLanguageSpy).toHaveBeenCalledWith('en');
  });

  it('偏好與目前語言相同時不切換（避免多餘 re-render）', () => {
    getPreferredLanguageMock.mockReturnValue(
      (i18n.resolvedLanguage ?? 'zh-TW') as ReturnType<typeof getPreferredLanguage>,
    );
    const changeLanguageSpy = vi
      .spyOn(i18n, 'changeLanguage')
      .mockResolvedValue((() => '') as never);

    render(<LanguagePreferenceSync />);

    expect(changeLanguageSpy).not.toHaveBeenCalled();
  });

  it('B1 迴歸：session 內切換語言後跨佈局導覽（remount）不得回滾語言', async () => {
    // 模擬 init 前捕捉的 stale 偏好（zh-TW）
    getPreferredLanguageMock.mockReturnValue('zh-TW');

    // 首次掛載（初始 hydration）：偏好與目前語言一致，不切換
    const first = render(<LanguagePreferenceSync />);
    first.unmount();

    // 使用者於 session 內手動切換語言（真實 changeLanguage）
    await i18n.changeLanguage('en');
    expect(i18n.resolvedLanguage).toBe('en');

    // 跨佈局 SPA 導覽（AppLayout → Layout）造成 remount
    render(<LanguagePreferenceSync />);

    // 修正前：remount effect 以 stale 捕捉值回滾 zh-TW
    expect(i18n.resolvedLanguage).toBe('en');
  });

  it('同一次 page load 內重複 mount 不再重放偏好（單次同步）', () => {
    getPreferredLanguageMock.mockReturnValue('en');
    const changeLanguageSpy = vi
      .spyOn(i18n, 'changeLanguage')
      .mockResolvedValue((() => '') as never);

    const first = render(<LanguagePreferenceSync />);
    first.unmount();
    render(<LanguagePreferenceSync />);

    expect(changeLanguageSpy).toHaveBeenCalledTimes(1);
  });

  it('不渲染任何 DOM 節點', () => {
    getPreferredLanguageMock.mockReturnValue('zh-TW');
    vi.spyOn(i18n, 'changeLanguage').mockResolvedValue((() => '') as never);

    const { container } = render(<LanguagePreferenceSync />);

    expect(container).toBeEmptyDOMElement();
  });
});
