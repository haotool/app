import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { SideNavigation } from '../SideNavigation';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SideNavigation layout', () => {
  it('keeps its fixed width so the main content cannot squeeze it on first paint', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <SideNavigation className="hidden md:block" />
      </MemoryRouter>,
    );

    // w-64 在 flex 容器內預設可被壓縮；SSG 首次繪製與 hydration 後主內容寬度不同時，
    // 側欄會從約 130px 跳到 256px，造成整個主區塊位移（CLS 約 0.084）。
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-64');
    expect(aside).toHaveClass('shrink-0');
  });
});
