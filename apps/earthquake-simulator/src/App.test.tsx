/**
 * App Component Tests
 * [BDD:2025-12-29] 紅燈-綠燈-重構流程
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => {
  const createMotionComponent = (Tag: React.ElementType) => {
    const MotionComponent = ({
      children,
      // Filter out framer-motion props
      initial: _initial,
      animate: _animate,
      exit: _exit,
      whileTap: _whileTap,
      whileHover: _whileHover,
      transition: _transition,
      layoutId: _layoutId,
      whileInView: _whileInView,
      viewport: _viewport,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) => {
      return <Tag {...props}>{children}</Tag>;
    };
    return MotionComponent;
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      button: createMotionComponent('button'),
      h1: createMotionComponent('h1'),
      p: createMotionComponent('p'),
      g: createMotionComponent('g'),
      path: createMotionComponent('path'),
      circle: createMotionComponent('circle'),
      rect: createMotionComponent('rect'),
      svg: createMotionComponent('svg'),
      text: createMotionComponent('text'),
      line: createMotionComponent('line'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReducedMotion: () => false,
  };
});

describe('App 元件', () => {
  describe('當用戶首次訪問時', () => {
    it('應該顯示 Landing 頁面標題', () => {
      render(<App />);

      expect(screen.getByText('地震')).toBeInTheDocument();
      expect(screen.getByText('小學堂')).toBeInTheDocument();
    });

    it('應該顯示開始探索按鈕', () => {
      render(<App />);

      expect(screen.getByRole('button', { name: /開始探索/i })).toBeInTheDocument();
    });

    it('應該顯示口號文字', () => {
      render(<App />);

      expect(screen.getByText(/規模看大小/)).toBeInTheDocument();
      expect(screen.getByText(/震度看搖晃/)).toBeInTheDocument();
    });
  });

  describe('當用戶點擊開始探索按鈕時', () => {
    it('應該導航到課程頁面', async () => {
      render(<App />);

      const startButton = screen.getByRole('button', { name: /開始探索/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('能量模擬室')).toBeInTheDocument();
      });
    });

    it('應該觸發振動回饋', () => {
      render(<App />);

      const startButton = screen.getByRole('button', { name: /開始探索/i });
      fireEvent.click(startButton);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
    });
  });

  describe('當 initialStage 設為 QUIZ 時', () => {
    it('應該直接顯示測驗頁面', () => {
      render(<App initialStage="QUIZ" />);

      expect(screen.getByText('Knowledge Check')).toBeInTheDocument();
    });
  });

  describe('課程頁面功能', () => {
    it('應該顯示震度分級速查表', async () => {
      render(<App />);

      const startButton = screen.getByRole('button', { name: /開始探索/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('震度分級速查表')).toBeInTheDocument();
      });
    });

    it('應該顯示所有課程章節', async () => {
      render(<App />);

      const startButton = screen.getByRole('button', { name: /開始探索/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('成因：地球大拼圖')).toBeInTheDocument();
        expect(screen.getByText('地震波：誰先敲門？')).toBeInTheDocument();
        expect(screen.getByText('規模 (Magnitude)')).toBeInTheDocument();
      });
    });
  });
});
