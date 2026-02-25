import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Settings from '../Settings';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual: typeof import('react-router-dom') = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Settings', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render heading "設定 | 停車好工具"', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('設定 | 停車好工具');
  });

  it('should render feature list items', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    expect(screen.getByText('功能')).toBeInTheDocument();
    expect(screen.getByText('四種介面主題：Zen、Nitro、Kawaii、Classic')).toBeInTheDocument();
    expect(screen.getByText('三語言：繁體中文、English、日本語')).toBeInTheDocument();
    expect(screen.getByText('快取管理：自訂保留天數')).toBeInTheDocument();
    expect(screen.getByText('資料管理：匯出或清除所有紀錄')).toBeInTheDocument();
  });

  it("should call navigate('/') on mount in browser context", () => {
    expect(typeof window).toBe('object');
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should render author info', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    expect(screen.getByText('阿璋 (Ah Zhang)')).toBeInTheDocument();
    expect(document.querySelector('time[dateTime="2026-02-25"]')).toBeInTheDocument();
  });
});
