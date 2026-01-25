/**
 * Button Component Tests - TDD Coverage
 *
 * 測試範圍：
 * - 基本渲染
 * - 變體樣式 (primary, secondary, ghost, danger)
 * - 尺寸變化 (sm, md, lg)
 * - 圖標支援
 * - 載入狀態
 * - 禁用狀態
 * - 無障礙屬性
 *
 * @see src/components/Button.tsx
 * @created 2026-01-25
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, IconButton } from '../Button';

describe('Button Component', () => {
  describe('基本渲染', () => {
    it('應該渲染按鈕文字', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('應該使用預設變體 (primary) 和尺寸 (md)', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      // 驗證包含 primary 變體的類別
      expect(button.className).toContain('bg-primary');
      expect(button.className).toContain('text-white');
    });
  });

  describe('變體樣式', () => {
    it('primary 變體應該有正確的樣式', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-primary');
      expect(button.className).toContain('text-white');
    });

    it('secondary 變體應該有正確的樣式', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-surface-elevated');
      expect(button.className).toContain('border');
    });

    it('ghost 變體應該有正確的樣式', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-transparent');
    });

    it('danger 變體應該有正確的樣式', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-destructive');
      expect(button.className).toContain('text-white');
    });
  });

  describe('尺寸變化', () => {
    it('sm 尺寸應該有較小的 padding', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
      expect(button.className).toContain('text-sm');
    });

    it('md 尺寸應該有中等的 padding', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('text-base');
    });

    it('lg 尺寸應該有較大的 padding', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('text-lg');
    });
  });

  describe('點擊事件', () => {
    it('點擊時應該觸發 onClick 回調', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('禁用時不應該觸發 onClick', () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>,
      );

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('載入狀態', () => {
    it('載入時應該顯示 spinner', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      // 檢查 aria-busy 屬性
      expect(button).toHaveAttribute('aria-busy', 'true');
      // 檢查 spinner SVG
      expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
    });

    it('載入時按鈕應該被禁用', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('載入時原內容應該透明化', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      const contentSpan = button.querySelector('span.opacity-0');
      expect(contentSpan).toBeInTheDocument();
    });
  });

  describe('禁用狀態', () => {
    it('禁用時按鈕應該有 disabled 屬性', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('禁用時應該有降低透明度的樣式', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:opacity-50');
    });
  });

  describe('滿版寬度', () => {
    it('fullWidth 時應該有 w-full 類別', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('w-full');
    });
  });

  describe('圖標支援', () => {
    it('應該渲染左側圖標', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      render(<Button leftIcon={<LeftIcon />}>With Left Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('應該渲染右側圖標', () => {
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      render(<Button rightIcon={<RightIcon />}>With Right Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('應該同時渲染左右圖標', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      render(
        <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
          Both Icons
        </Button>,
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('自定義類別', () => {
    it('應該合併自定義 className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('無障礙功能', () => {
    it('應該支援 type 屬性', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('應該支援 aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
    });
  });
});

describe('IconButton Component', () => {
  const TestIcon = () => <span data-testid="test-icon">🎯</span>;

  it('應該渲染圖標', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Test icon button" />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('應該有必填的 aria-label', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Target" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Target');
  });

  it('應該有正方形尺寸', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Test" size="md" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-10');
    expect(button.className).toContain('h-10');
  });

  it('sm 尺寸應該是 32x32', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Test" size="sm" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-8');
    expect(button.className).toContain('h-8');
  });

  it('lg 尺寸應該是 48x48', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Test" size="lg" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-12');
    expect(button.className).toContain('h-12');
  });

  it('預設應該使用 ghost 變體', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Test" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-transparent');
  });
});
