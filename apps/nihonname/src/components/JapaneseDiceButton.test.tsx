/**
 * JapaneseDiceButton 元件單元測試
 *
 * 測試日式骰子按鈕的互動行為和動畫效果
 *
 * @see [context7:testing-library/react-testing-library:2025-12-04] userEvent
 * @see [context7:vitest-dev/vitest:2025-12-04] timer mocks
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { JapaneseDiceButton } from './JapaneseDiceButton';

describe('JapaneseDiceButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('渲染', () => {
    it('應該正確渲染骰子按鈕', () => {
      const onClick = vi.fn();
      render(<JapaneseDiceButton onClick={onClick} label="改名" />);

      const button = screen.getByRole('button', { name: /改名/i });
      expect(button).toBeInTheDocument();
    });

    it('應該顯示紅色圓點（日本傳統骰子特色）', () => {
      const onClick = vi.fn();
      const { container } = render(<JapaneseDiceButton onClick={onClick} label="擲骰" />);

      // 紅色圓點應該存在
      const redDot = container.querySelector('.bg-red-600');
      expect(redDot).toBeInTheDocument();
    });

    it('應該根據 size prop 調整尺寸', () => {
      const onClick = vi.fn();

      // 測試 sm 尺寸
      const { rerender, container } = render(
        <JapaneseDiceButton onClick={onClick} label="小" size="sm" />,
      );
      expect(container.querySelector('.w-8')).toBeInTheDocument();

      // 測試 md 尺寸（預設）
      rerender(<JapaneseDiceButton onClick={onClick} label="中" size="md" />);
      expect(container.querySelector('.w-10')).toBeInTheDocument();

      // 測試 lg 尺寸
      rerender(<JapaneseDiceButton onClick={onClick} label="大" size="lg" />);
      expect(container.querySelector('.w-12')).toBeInTheDocument();
    });

    it('應該在 hover 時顯示標籤', () => {
      const onClick = vi.fn();
      const { container } = render(<JapaneseDiceButton onClick={onClick} label="測試標籤" />);

      // 標籤應該存在但預設不可見（opacity-0）
      const label = container.querySelector('span');
      expect(label).toHaveTextContent('測試標籤');
      expect(label).toHaveClass('opacity-0');
    });
  });

  describe('互動', () => {
    it('應該在點擊時呼叫 onClick', () => {
      const onClick = vi.fn();
      render(<JapaneseDiceButton onClick={onClick} label="點擊" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('應該在點擊時觸發旋轉動畫', () => {
      const onClick = vi.fn();
      const { container } = render(<JapaneseDiceButton onClick={onClick} label="動畫" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // 點擊後應該添加動畫 class
      const diceContainer = container.querySelector('.animate-dice-roll');
      expect(diceContainer).toBeInTheDocument();
    });

    it('應該在動畫結束後重置狀態（600ms）', () => {
      const onClick = vi.fn();
      const { container } = render(<JapaneseDiceButton onClick={onClick} label="重置" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // 動畫進行中
      expect(container.querySelector('.animate-dice-roll')).toBeInTheDocument();

      // 快進 600ms 並等待 React 更新
      act(() => {
        vi.advanceTimersByTime(600);
      });

      // 動畫應該結束
      expect(container.querySelector('.animate-dice-roll')).not.toBeInTheDocument();
    });

    it('應該在動畫進行中忽略重複點擊', () => {
      const onClick = vi.fn();
      render(<JapaneseDiceButton onClick={onClick} label="防連點" />);

      const button = screen.getByRole('button');

      // 第一次點擊
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);

      // 動畫進行中再次點擊
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1); // 仍然是 1 次

      // 快進讓動畫結束並等待 React 更新
      act(() => {
        vi.advanceTimersByTime(600);
      });

      // 動畫結束後可以再次點擊
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('disabled 狀態', () => {
    it('應該在 disabled 時不呼叫 onClick', () => {
      const onClick = vi.fn();
      render(<JapaneseDiceButton onClick={onClick} label="禁用" disabled />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('應該在 disabled 時顯示禁用樣式', () => {
      const onClick = vi.fn();
      const { container } = render(<JapaneseDiceButton onClick={onClick} label="禁用" disabled />);

      // 應該有 opacity-50 和 cursor-not-allowed
      const button = container.querySelector('button');
      expect(button).toHaveClass('opacity-50');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('應該有 disabled 屬性', () => {
      const onClick = vi.fn();
      render(<JapaneseDiceButton onClick={onClick} label="禁用" disabled />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('自訂樣式', () => {
    it('應該接受並應用 className prop', () => {
      const onClick = vi.fn();
      const { container } = render(
        <JapaneseDiceButton onClick={onClick} label="自訂" className="custom-class" />,
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('無障礙性', () => {
    it('應該有 title 屬性作為輔助說明', () => {
      const onClick = vi.fn();
      render(<JapaneseDiceButton onClick={onClick} label="無障礙" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', '無障礙');
    });
  });
});
