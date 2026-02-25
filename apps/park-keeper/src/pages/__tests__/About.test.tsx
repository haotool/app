import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import About from '../About';

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
            motionProps.forEach((p) => delete domProps[p]);
            return React.createElement(tag, domProps, children);
          };
          Component.displayName = `motion.${String(prop)}`;
          return Component;
        },
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

describe('About', () => {
  it('should render the heading "停車好工具"', () => {
    render(<About />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('停車好工具');
  });

  it('should render feature items', () => {
    render(<About />);
    expect(screen.getByText('GPS 記錄')).toBeInTheDocument();
    expect(screen.getByText('羅盤導航')).toBeInTheDocument();
    expect(screen.getByText('多主題介面')).toBeInTheDocument();
    expect(screen.getByText('多語言支援')).toBeInTheDocument();
    expect(screen.getByText('離線可用')).toBeInTheDocument();
  });

  it('should render privacy policy section', () => {
    render(<About />);
    expect(screen.getByRole('heading', { name: '隱私政策' })).toBeInTheDocument();
    expect(screen.getByText(/本應用程式所有資料均儲存於您的裝置本機/)).toBeInTheDocument();
    expect(screen.getByText(/停車紀錄/)).toBeInTheDocument();
  });

  it('should have author byline for E-E-A-T', () => {
    render(<About />);
    const authorLink = screen.getByRole('link', { name: '阿璋 (Ah Zhang)' });
    expect(authorLink).toBeInTheDocument();
    expect(authorLink).toHaveAttribute('rel', 'author');
    expect(authorLink).toHaveAttribute('href', 'https://haotool.org');
  });

  it('should render 5 feature items', () => {
    render(<About />);
    const features = ['GPS 記錄', '羅盤導航', '多主題介面', '多語言支援', '離線可用'];
    features.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });
});
