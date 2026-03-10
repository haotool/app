import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type * as ReactRouterDom from 'react-router-dom';
import { MemoryRouter } from 'react-router-dom';
import { BottomNavigation } from '../BottomNavigation';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'nav.mainNavigation': 'Main Navigation',
        'nav.singleCurrency': 'Single',
        'nav.singleCurrencyFull': 'Single Currency',
        'nav.multiCurrency': 'Multi',
        'nav.multiCurrencyFull': 'Multi Currency',
        'nav.favorites': 'Favorites',
        'nav.favoritesFull': 'Favorites & History',
        'nav.settings': 'Settings',
        'nav.settingsFull': 'App Settings',
      };
      return translations[key] ?? key;
    },
  }),
}));

describe('BottomNavigation', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('點擊當前頁籤時不應重複觸發 navigate', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNavigation />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Single Currency' }));

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('點擊其他頁籤時應攔截預設導覽並改走 react-router navigate', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNavigation />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Multi Currency' }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/multi');
  });
});
