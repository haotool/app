import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import PhotoViewerModal from '../PhotoViewerModal';

vi.mock('motion/react', () => {
  const motionProps = ['initial', 'animate', 'whileInView', 'viewport', 'transition', 'exit'];
  // Cache per tag so React sees the same component type on every render (prevents unmount/remount).
  const cache = new Map<
    string,
    React.FC<{ children?: React.ReactNode } & Record<string, unknown>>
  >();
  return {
    motion: new Proxy(
      {},
      {
        get(_target, prop) {
          const tag = String(prop);
          if (cache.has(tag)) return cache.get(tag)!;
          const Component = ({
            children,
            ...props
          }: { children?: React.ReactNode } & Record<string, unknown>) => {
            const domProps = { ...props };
            const style = domProps['style'] as Record<string, unknown> | undefined;
            motionProps.forEach((key) => delete domProps[key]);
            delete domProps['drag'];
            delete domProps['dragMomentum'];
            delete domProps['dragElastic'];
            if (
              style &&
              (typeof style['scale'] === 'number' || typeof style['scale'] === 'string')
            ) {
              domProps['style'] = {
                ...style,
                transform: `scale(${style['scale']})`,
              };
              delete (domProps['style'] as Record<string, unknown>)['scale'];
            }
            return React.createElement(tag, domProps, children);
          };
          Component.displayName = `motion.${tag}`;
          cache.set(tag, Component);
          return Component;
        },
      },
    ),
  };
});

describe('PhotoViewerModal', () => {
  it('應該點擊背景時關閉 modal，但點擊圖片時不關閉', () => {
    const onClose = vi.fn();

    render(<PhotoViewerModal src="data:image/png;base64,abc" alt="停車照片" onClose={onClose} />);

    fireEvent.click(screen.getByRole('img', { name: '停車照片' }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog', { name: '照片檢視器' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('應該支援按鈕縮放、重設與最大邊界 MAX_SCALE=5', () => {
    render(<PhotoViewerModal src="data:image/png;base64,abc" alt="停車照片" onClose={vi.fn()} />);

    const getImage = () => screen.getByRole('img', { name: '停車照片' });
    const getZoomIn = () => screen.getByRole('button', { name: '放大照片' });
    const getReset = () => screen.getByRole('button', { name: '重設照片位置' });

    // Click zoom-in 20 times — should cap at 5
    act(() => {
      for (let index = 0; index < 20; index += 1) {
        fireEvent.click(getZoomIn());
      }
    });
    expect(getImage().style.transform).toBe('scale(5)');

    act(() => {
      fireEvent.click(getReset());
    });
    expect(getImage().style.transform).toBe('scale(1)');
  });

  it('應該支援按鈕縮小到 MIN_SCALE=0.5', () => {
    render(<PhotoViewerModal src="data:image/png;base64,abc" alt="停車照片" onClose={vi.fn()} />);

    const getImage = () => screen.getByRole('img', { name: '停車照片' });
    const getZoomOut = () => screen.getByRole('button', { name: '縮小照片' });

    act(() => {
      for (let index = 0; index < 10; index += 1) {
        fireEvent.click(getZoomOut());
      }
    });
    expect(getImage().style.transform).toBe('scale(0.5)');
  });

  it('應該支援滑鼠滾輪縮放與 Escape 關閉', () => {
    const onClose = vi.fn();

    render(<PhotoViewerModal src="data:image/png;base64,abc" alt="停車照片" onClose={onClose} />);

    const getImage = () => screen.getByRole('img', { name: '停車照片' });

    act(() => {
      fireEvent.wheel(getImage(), { deltaY: -100 });
    });
    expect(getImage().style.transform).toBe('scale(1.25)');

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('應該透過關閉按鈕觸發 onClose', () => {
    const onClose = vi.fn();

    render(<PhotoViewerModal src="data:image/png;base64,abc" alt="停車照片" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: '關閉照片' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('應顯示行動裝置操作提示文字', () => {
    render(<PhotoViewerModal src="data:image/png;base64,abc" alt="停車照片" onClose={vi.fn()} />);
    expect(screen.getByText('雙指縮放 · 雙擊切換 · 拖曳移動')).toBeInTheDocument();
  });

  describe('雙擊切換縮放', () => {
    // 用 Date.now spy 控制時間，避免 fake timers 影響 React scheduler
    let fakeTime = 0;
    beforeEach(() => {
      fakeTime = 0;
      vi.spyOn(Date, 'now').mockImplementation(() => fakeTime);
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const touch = { clientX: 100, clientY: 100, identifier: 0 };

    it('應雙擊從 1 切換到 2.5', () => {
      render(<PhotoViewerModal src="data:image/png;base64,abc" alt="停車照片" onClose={vi.fn()} />);
      const img = screen.getByRole('img', { name: '停車照片' });

      // 第一次 tap（t=0）
      act(() => {
        fireEvent.touchStart(img, { touches: [touch], changedTouches: [touch] });
      });
      expect(img.style.transform).toBe('scale(1)');

      // 第二次 tap（t=100ms，< 300ms）
      fakeTime = 100;
      act(() => {
        fireEvent.touchStart(img, { touches: [touch], changedTouches: [touch] });
      });
      expect(img.style.transform).toBe('scale(2.5)');
    });

    it('應雙擊從已縮放恢復到 1', () => {
      render(<PhotoViewerModal src="data:image/png;base64,abc" alt="停車照片" onClose={vi.fn()} />);
      const img = screen.getByRole('img', { name: '停車照片' });
      const getZoomIn = () => screen.getByRole('button', { name: '放大照片' });

      // 先放大到 2
      act(() => {
        for (let i = 0; i < 4; i++) fireEvent.click(getZoomIn());
      });
      expect(img.style.transform).toBe('scale(2)');

      // 第一次 tap
      act(() => {
        fireEvent.touchStart(img, { touches: [touch], changedTouches: [touch] });
      });
      // 第二次 tap（100ms 後）
      fakeTime = 100;
      act(() => {
        fireEvent.touchStart(img, { touches: [touch], changedTouches: [touch] });
      });
      expect(img.style.transform).toBe('scale(1)');
    });

    it('超過 300ms 後不視為雙擊', () => {
      render(<PhotoViewerModal src="data:image/png;base64,abc" alt="停車照片" onClose={vi.fn()} />);
      const img = screen.getByRole('img', { name: '停車照片' });

      act(() => {
        fireEvent.touchStart(img, { touches: [touch], changedTouches: [touch] });
      });
      // 超過 300ms
      fakeTime = 400;
      act(() => {
        fireEvent.touchStart(img, { touches: [touch], changedTouches: [touch] });
      });
      expect(img.style.transform).toBe('scale(1)');
    });
  });
});
