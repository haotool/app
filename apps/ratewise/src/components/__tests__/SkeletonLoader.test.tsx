/**
 * SkeletonLoader Test Suite
 *
 * 測試策略 (Linus Style):
 * 1. 測試行為，不測實作細節 (test behavior, not implementation)
 * 2. 用戶視角測試 (user-centric testing with ARIA)
 * 3. 簡潔優先 (simple, focused tests)
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkeletonLoader, CurrencyCardSkeleton, ConverterSkeleton } from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  describe('基本渲染', () => {
    it('渲染完整頁面骨架屏', () => {
      render(<SkeletonLoader />);

      // ✅ Accessibility: role="status" 正確設置
      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();

      // ✅ SR-only 文字存在
      expect(screen.getByText('載入匯率資料中...')).toBeInTheDocument();
    });

    it('渲染所有主要區塊', () => {
      const { container } = render(<SkeletonLoader />);

      // ✅ 使用快照測試驗證結構穩定性
      // Linus 原則: "如果結構改變，測試應該失敗"
      expect(container.firstChild).toMatchSnapshot();
    });

    it('應用正確的動畫類別', () => {
      const { container } = render(<SkeletonLoader />);

      // ✅ 檢查 animate-pulse 存在於多個區塊
      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('包含 aria-live="polite" 屬性', () => {
      const { container } = render(<SkeletonLoader />);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('包含螢幕閱讀器專用文字', () => {
      render(<SkeletonLoader />);

      const srText = screen.getByText('載入匯率資料中...');
      expect(srText).toHaveClass('sr-only');
    });
  });
});

describe('CurrencyCardSkeleton', () => {
  it('渲染貨幣卡片骨架', () => {
    render(<CurrencyCardSkeleton />);

    // ✅ role="status" 存在
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('包含正確的結構元素', () => {
    const { container } = render(<CurrencyCardSkeleton />);

    // ✅ 圓形頭像 skeleton
    const avatar = container.querySelector('.rounded-full');
    expect(avatar).toBeInTheDocument();

    // ✅ 動畫效果
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('匹配設計快照', () => {
    const { container } = render(<CurrencyCardSkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('ConverterSkeleton', () => {
  describe('模式: single', () => {
    it('渲染單一轉換器骨架', () => {
      render(<ConverterSkeleton mode="single" />);

      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
    });

    it('不渲染 CurrencyCardSkeleton', () => {
      const { container } = render(<ConverterSkeleton mode="single" />);

      // ✅ single 模式沒有圓形頭像
      const avatars = container.querySelectorAll('.rounded-full');
      expect(avatars).toHaveLength(0);
    });

    it('匹配 single 模式快照', () => {
      const { container } = render(<ConverterSkeleton mode="single" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('模式: multi', () => {
    it('渲染多貨幣轉換器骨架', () => {
      render(<ConverterSkeleton mode="multi" />);

      // ✅ multi 模式有多個 role="status"，使用 getAllByRole
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('渲染多個 CurrencyCardSkeleton (4個)', () => {
      render(<ConverterSkeleton mode="multi" />);

      // ✅ multi 模式有 5 個 role="status"
      // 1 個來自 ConverterSkeleton，4 個來自 CurrencyCardSkeleton
      const statuses = screen.getAllByRole('status');
      expect(statuses).toHaveLength(5);
    });

    it('匹配 multi 模式快照', () => {
      const { container } = render(<ConverterSkeleton mode="multi" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('邊界情況', () => {
    it('處理 undefined mode (default single)', () => {
      // @ts-expect-error - 測試邊界情況
      const { container } = render(<ConverterSkeleton />);

      // ✅ 應該渲染 single 模式
      const avatars = container.querySelectorAll('.rounded-full');
      expect(avatars).toHaveLength(0);
    });
  });
});

describe('性能測試', () => {
  it('快速渲染不影響 TTI', () => {
    const start = performance.now();

    render(<SkeletonLoader />);

    const duration = performance.now() - start;

    // ✅ Lighthouse 優化目標: <50ms
    expect(duration).toBeLessThan(50);
  });

  it('所有組件渲染時間 <100ms', () => {
    const start = performance.now();

    render(
      <>
        <SkeletonLoader />
        <CurrencyCardSkeleton />
        <ConverterSkeleton mode="single" />
        <ConverterSkeleton mode="multi" />
      </>,
    );

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
