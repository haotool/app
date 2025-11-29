import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RateTypeTooltip } from './RateTypeTooltip';

describe('RateTypeTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本渲染', () => {
    it('should render children correctly', () => {
      render(
        <RateTypeTooltip message="Test message" isDisabled={false}>
          <button>Test Button</button>
        </RateTypeTooltip>,
      );

      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('should not show tooltip by default', () => {
      render(
        <RateTypeTooltip message="Test message" isDisabled={false}>
          <button>Test Button</button>
        </RateTypeTooltip>,
      );

      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  describe('isDisabled = false（啟用狀態）', () => {
    it('should not show tooltip when clicking enabled button', () => {
      render(
        <RateTypeTooltip message="Test message" isDisabled={false}>
          <button>Test Button</button>
        </RateTypeTooltip>,
      );

      fireEvent.click(screen.getByText('Test Button'));

      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  describe('isDisabled = true（禁用狀態）', () => {
    it('should show tooltip when clicking disabled button', () => {
      render(
        <RateTypeTooltip message="Disabled message" isDisabled={true}>
          <button>Disabled Button</button>
        </RateTypeTooltip>,
      );

      fireEvent.click(screen.getByText('Disabled Button'));

      expect(screen.getByText('Disabled message')).toBeInTheDocument();
    });

    it('should stop event propagation when clicking disabled button', () => {
      const parentClickHandler = vi.fn();

      render(
        <div onClick={parentClickHandler}>
          <RateTypeTooltip message="Disabled message" isDisabled={true}>
            <button>Disabled Button</button>
          </RateTypeTooltip>
        </div>,
      );

      fireEvent.click(screen.getByText('Disabled Button'));

      // 事件應該被 stopPropagation() 阻止，父元素不應觸發
      expect(parentClickHandler).not.toHaveBeenCalled();
      expect(screen.getByText('Disabled message')).toBeInTheDocument();
    });

    it('should auto hide tooltip after 3 seconds', () => {
      render(
        <RateTypeTooltip message="Auto hide message" isDisabled={true}>
          <button>Disabled Button</button>
        </RateTypeTooltip>,
      );

      // 點擊顯示 tooltip
      fireEvent.click(screen.getByText('Disabled Button'));
      expect(screen.getByText('Auto hide message')).toBeInTheDocument();

      // 快進 3 秒
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // tooltip 應該消失
      expect(screen.queryByText('Auto hide message')).not.toBeInTheDocument();
    });

    it('should hide tooltip when clicking background overlay', () => {
      render(
        <RateTypeTooltip message="Close on overlay" isDisabled={true}>
          <button>Disabled Button</button>
        </RateTypeTooltip>,
      );

      // 點擊顯示 tooltip
      fireEvent.click(screen.getByText('Disabled Button'));
      expect(screen.getByText('Close on overlay')).toBeInTheDocument();

      // 找到背景遮罩並點擊（使用 class selector）
      const overlay = document.querySelector('.fixed.inset-0.z-40');
      expect(overlay).toBeInTheDocument();

      fireEvent.click(overlay!);

      // tooltip 應該立即消失
      expect(screen.queryByText('Close on overlay')).not.toBeInTheDocument();
    });

    it('should display correct message content', () => {
      const customMessage = 'KRW 僅提供現金匯率';

      render(
        <RateTypeTooltip message={customMessage} isDisabled={true}>
          <button>Disabled Button</button>
        </RateTypeTooltip>,
      );

      fireEvent.click(screen.getByText('Disabled Button'));

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should handle multiple clicks correctly', () => {
      render(
        <RateTypeTooltip message="Multi-click test" isDisabled={true}>
          <button>Disabled Button</button>
        </RateTypeTooltip>,
      );

      // 第一次點擊
      fireEvent.click(screen.getByText('Disabled Button'));
      expect(screen.getByText('Multi-click test')).toBeInTheDocument();

      // 關閉
      const overlay = document.querySelector('.fixed.inset-0.z-40');
      fireEvent.click(overlay!);
      expect(screen.queryByText('Multi-click test')).not.toBeInTheDocument();

      // 第二次點擊
      fireEvent.click(screen.getByText('Disabled Button'));
      expect(screen.getByText('Multi-click test')).toBeInTheDocument();
    });
  });

  describe('樣式與結構', () => {
    it('should render with correct CSS classes for positioning', () => {
      render(
        <RateTypeTooltip message="Positioning test" isDisabled={true}>
          <button>Test Button</button>
        </RateTypeTooltip>,
      );

      fireEvent.click(screen.getByText('Test Button'));

      // 檢查 tooltip 容器是否有正確的定位 class
      const tooltipContainer = screen.getByText('Positioning test').closest('.absolute');
      expect(tooltipContainer).toHaveClass(
        'bottom-full',
        'left-1/2',
        '-translate-x-1/2',
        'mb-2',
        'z-50',
      );
    });

    it('should render arrow element when tooltip is shown', () => {
      render(
        <RateTypeTooltip message="Arrow test" isDisabled={true}>
          <button>Test Button</button>
        </RateTypeTooltip>,
      );

      fireEvent.click(screen.getByText('Test Button'));

      // 檢查箭頭元素存在（使用特定的 class 組合）
      const arrow = document.querySelector('.w-3.h-3.bg-blue-600.rotate-45');
      expect(arrow).toBeInTheDocument();
    });
  });

  describe('邊界條件', () => {
    it('should handle empty message gracefully', () => {
      render(
        <RateTypeTooltip message="" isDisabled={true}>
          <button>Empty Message</button>
        </RateTypeTooltip>,
      );

      fireEvent.click(screen.getByText('Empty Message'));

      // 即使訊息為空，tooltip 結構仍應存在
      const overlay = document.querySelector('.fixed.inset-0.z-40');
      expect(overlay).toBeInTheDocument();
    });

    it('should handle complex children elements', () => {
      render(
        <RateTypeTooltip message="Complex children" isDisabled={true}>
          <div>
            <span>Icon</span>
            <span>Text</span>
          </div>
        </RateTypeTooltip>,
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });
});
