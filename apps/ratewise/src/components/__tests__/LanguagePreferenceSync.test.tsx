/** LanguagePreferenceSync — hydration 後才套用語言偏好（issue #560）。 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { LanguagePreferenceSync } from '../LanguagePreferenceSync';
import i18n, { getPreferredLanguage } from '../../i18n';

vi.mock('../../i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../i18n')>();
  return { ...actual, getPreferredLanguage: vi.fn(() => 'zh-TW') };
});

const getPreferredLanguageMock = vi.mocked(getPreferredLanguage);

describe('LanguagePreferenceSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('不渲染任何 DOM 節點', () => {
    getPreferredLanguageMock.mockReturnValue('zh-TW');
    vi.spyOn(i18n, 'changeLanguage').mockResolvedValue((() => '') as never);

    const { container } = render(<LanguagePreferenceSync />);

    expect(container).toBeEmptyDOMElement();
  });
});
