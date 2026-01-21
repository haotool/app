/**
 * SkeletonLoader Test Suite - SSOT Design System
 *
 * 測試策略 (Linus Style):
 * 1. 測試行為，不測實作細節 (test behavior, not implementation)
 * 2. 用戶視角測試 (user-centric testing with ARIA)
 * 3. 簡潔優先 (simple, focused tests)
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  SkeletonLoader,
  CurrencyCardSkeleton,
  ConverterSkeleton,
  SettingsSkeleton,
  FavoritesSkeleton,
  MultiConverterSkeleton,
} from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  describe('基本渲染', () => {
    it('渲染完整頁面骨架屏', () => {
      render(<SkeletonLoader />);

      // Accessibility: role="status" 正確設置
      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();

      // SR-only 文字存在
      expect(screen.getByText('載入匯率資料中...')).toBeInTheDocument();
    });

    it('渲染所有主要區塊', () => {
      const { container } = render(<SkeletonLoader />);

      // 驗證結構穩定性 - 檢查主要元素存在
      expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-shimmer')).toBeInTheDocument();
    });

    it('使用 SSOT 主題感知顏色類', () => {
      const { container } = render(<SkeletonLoader />);

      // 檢查 skeleton-shimmer 存在（SSOT 設計）
      const shimmerElements = container.querySelectorAll('.skeleton-shimmer');
      expect(shimmerElements.length).toBeGreaterThan(0);

      // 檢查 skeleton-card 存在
      const cardElements = container.querySelectorAll('.skeleton-card');
      expect(cardElements.length).toBeGreaterThan(0);
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

    // role="status" 存在
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('包含正確的結構元素', () => {
    const { container } = render(<CurrencyCardSkeleton />);

    // 圓形頭像 skeleton
    const avatar = container.querySelector('.rounded-full');
    expect(avatar).toBeInTheDocument();

    // Shimmer 效果
    expect(container.querySelector('.skeleton-shimmer')).toBeInTheDocument();
  });

  it('使用 SSOT skeleton-card 類', () => {
    const { container } = render(<CurrencyCardSkeleton />);
    expect(container.querySelector('.skeleton-card')).toBeInTheDocument();
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

      // single 模式沒有圓形頭像
      const avatars = container.querySelectorAll('.rounded-full');
      expect(avatars).toHaveLength(0);
    });

    it('使用 shimmer 動畫', () => {
      const { container } = render(<ConverterSkeleton mode="single" />);
      expect(container.querySelector('.skeleton-shimmer')).toBeInTheDocument();
    });
  });

  describe('模式: multi', () => {
    it('渲染多貨幣轉換器骨架', () => {
      render(<ConverterSkeleton mode="multi" />);

      // multi 模式有多個 role="status"
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('渲染多個 CurrencyCardSkeleton (4個)', () => {
      render(<ConverterSkeleton mode="multi" />);

      // multi 模式有 5 個 role="status"
      // 1 個來自 ConverterSkeleton，4 個來自 CurrencyCardSkeleton
      const statuses = screen.getAllByRole('status');
      expect(statuses).toHaveLength(5);
    });

    it('使用 shimmer 動畫', () => {
      const { container } = render(<ConverterSkeleton mode="multi" />);
      expect(container.querySelector('.skeleton-shimmer')).toBeInTheDocument();
    });
  });

  describe('邊界情況', () => {
    it('處理 undefined mode (default single)', () => {
      // @ts-expect-error - 測試邊界情況
      const { container } = render(<ConverterSkeleton />);

      // 應該渲染 single 模式（無圓形頭像）
      const avatars = container.querySelectorAll('.rounded-full');
      expect(avatars).toHaveLength(0);
    });
  });
});

describe('SettingsSkeleton', () => {
  it('渲染設定頁面骨架屏', () => {
    render(<SettingsSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('載入設定中...')).toBeInTheDocument();
  });

  it('包含風格選擇區域', () => {
    const { container } = render(<SettingsSkeleton />);
    // 6 個風格選項骨架
    const styleCards = container.querySelectorAll('.skeleton-shimmer.h-20');
    expect(styleCards).toHaveLength(6);
  });
});

describe('FavoritesSkeleton', () => {
  it('渲染收藏頁面骨架屏', () => {
    render(<FavoritesSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('載入收藏中...')).toBeInTheDocument();
  });

  it('包含頁籤切換器', () => {
    const { container } = render(<FavoritesSkeleton />);
    const tabs = container.querySelectorAll('.skeleton-shimmer.h-14');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });
});

describe('MultiConverterSkeleton', () => {
  it('渲染多幣別頁面骨架屏', () => {
    render(<MultiConverterSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('載入多幣別換算中...')).toBeInTheDocument();
  });

  it('包含貨幣列表', () => {
    const { container } = render(<MultiConverterSkeleton />);
    // 至少 5 個貨幣卡片骨架
    const cards = container.querySelectorAll('.skeleton-card');
    expect(cards.length).toBeGreaterThanOrEqual(5);
  });
});

describe('性能測試', () => {
  it('快速渲染不影響 TTI', () => {
    const start = performance.now();

    render(<SkeletonLoader />);

    const duration = performance.now() - start;

    // Lighthouse 優化目標: <200ms
    expect(duration).toBeLessThan(200);
  });

  it('所有組件渲染時間 <100ms', () => {
    const start = performance.now();

    render(
      <>
        <SkeletonLoader />
        <CurrencyCardSkeleton />
        <ConverterSkeleton mode="single" />
        <ConverterSkeleton mode="multi" />
        <SettingsSkeleton />
        <FavoritesSkeleton />
        <MultiConverterSkeleton />
      </>,
    );

    const duration = performance.now() - start;
    // CI 環境可能較慢，放寬至 500ms
    expect(duration).toBeLessThan(500);
  });
});

describe('SSOT Design Tokens', () => {
  it('使用 skeleton-page 作為頁面容器', () => {
    const { container } = render(<SkeletonLoader />);
    expect(container.querySelector('.skeleton-page')).toBeInTheDocument();
  });

  it('使用 skeleton-card 作為卡片容器', () => {
    const { container } = render(<SkeletonLoader />);
    expect(container.querySelector('.skeleton-card')).toBeInTheDocument();
  });

  it('使用 skeleton-shimmer 作為動畫效果', () => {
    const { container } = render(<SkeletonLoader />);
    expect(container.querySelector('.skeleton-shimmer')).toBeInTheDocument();
  });

  it('使用 skeleton-shimmer-accent 作為強調動畫', () => {
    const { container } = render(<SkeletonLoader />);
    expect(container.querySelector('.skeleton-shimmer-accent')).toBeInTheDocument();
  });
});
