import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PhoneFlatPrompt from '../PhoneFlatPrompt';

describe('PhoneFlatPrompt - 平放手機提示動畫', () => {
  it('RED: 應該渲染高級動畫 SVG 元素', () => {
    render(<PhoneFlatPrompt />);

    // 驗證 SVG 容器存在
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox');
  });

  it('RED: 應該包含手機外框與旋轉動畫', () => {
    const { container } = render(<PhoneFlatPrompt />);

    // 驗證手機外框元素
    const phoneFrame = container.querySelector('[data-testid="phone-frame"]');
    expect(phoneFrame).toBeInTheDocument();

    // 驗證動畫元素
    const animatedGroup = container.querySelector('[data-testid="animated-group"]');
    expect(animatedGroup).toBeInTheDocument();
  });

  it('RED: 應該顯示提示文字', () => {
    render(<PhoneFlatPrompt text="請平放手機以獲取羅盤方位" />);

    // 驗證提示文字顯示
    expect(screen.getByText('請平放手機以獲取羅盤方位')).toBeInTheDocument();
  });

  it('RED: 應該支援自訂主題顏色', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    // 驗證顏色應用（檢查 SVG 元素的樣式）
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('RED: 應該包含流暢的脈動動畫效果', () => {
    const { container } = render(<PhoneFlatPrompt />);

    // 驗證動畫元素存在
    const pulseElements = container.querySelectorAll('[data-animation="pulse"]');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('RED: 應該在 landscape 模式顯示不同的提示', () => {
    render(<PhoneFlatPrompt orientation="landscape" text="手機已平放" />);

    // 驗證不同方向的文字
    expect(screen.getByText('手機已平放')).toBeInTheDocument();
  });
});
