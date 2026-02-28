import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PhotoViewerModal from '../PhotoViewerModal';

vi.mock('motion/react', () => {
  const motionProps = ['initial', 'animate', 'whileInView', 'viewport', 'transition', 'exit'];
  return {
    motion: new Proxy(
      {},
      {
        get(_target, prop) {
          const Component = ({
            children,
            ...props
          }: { children?: React.ReactNode } & Record<string, unknown>) => {
            const tag = String(prop);
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
          Component.displayName = `motion.${String(prop)}`;
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

  it('應該支援按鈕縮放、重設與最大最小邊界', () => {
    render(<PhotoViewerModal src="data:image/png;base64,abc" alt="停車照片" onClose={vi.fn()} />);

    const getImage = () => screen.getByRole('img', { name: '停車照片' });
    const getZoomOut = () => screen.getByRole('button', { name: '縮小照片' });
    const getZoomIn = () => screen.getByRole('button', { name: '放大照片' });
    const getReset = () => screen.getByRole('button', { name: '重設照片位置' });

    act(() => {
      fireEvent.click(getZoomOut());
    });
    expect(getImage().style.transform).toBe('scale(1)');

    act(() => {
      for (let index = 0; index < 10; index += 1) {
        fireEvent.click(getZoomIn());
      }
    });
    expect(getImage().style.transform).toBe('scale(3)');

    act(() => {
      fireEvent.click(getReset());
    });
    expect(getImage().style.transform).toBe('scale(1)');
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
});
