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
    expect(screen.getByText('GPS 停車記錄')).toBeInTheDocument();
    expect(screen.getByText('羅盤導航找車')).toBeInTheDocument();
    expect(screen.getByText('四種介面主題')).toBeInTheDocument();
    expect(screen.getByText('三語言支援')).toBeInTheDocument();
    expect(screen.getByText('完全離線可用')).toBeInTheDocument();
  });

  it('should render answer capsule section', () => {
    render(<About />);
    expect(screen.getByText('什麼是停車好工具？')).toBeInTheDocument();
    expect(screen.getByText(/台灣最好用的免費停車記錄/)).toBeInTheDocument();
  });

  it('should render how-to section', () => {
    render(<About />);
    expect(screen.getByText('三步驟找回你的車')).toBeInTheDocument();
    expect(screen.getByText('記錄停車位置')).toBeInTheDocument();
    expect(screen.getByText('跟著羅盤走回車旁')).toBeInTheDocument();
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

  it('should render 8 feature items', () => {
    render(<About />);
    const features = [
      'GPS 停車記錄',
      '羅盤導航找車',
      '車位照片記錄',
      '室內計步器',
      '四種介面主題',
      '三語言支援',
      '完全離線可用',
      '100% 隱私保護',
    ];
    features.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });
});
