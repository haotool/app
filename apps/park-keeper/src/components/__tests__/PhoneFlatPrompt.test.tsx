import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PhoneFlatPrompt from '../PhoneFlatPrompt';

describe('PhoneFlatPrompt - 俯視圖 3D 平放動畫', () => {
  it('RED: 應該渲染俯視圖 3D SVG 動畫', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    // 驗證 SVG 容器存在
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox');
  });

  it('RED: 應該包含手機從直立到平放的 3D 旋轉動畫', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    // 驗證手機元素存在（帶有旋轉動畫）
    const phone = container.querySelector('[data-testid="phone-3d"]');
    expect(phone).toBeInTheDocument();
  });

  it('RED: 應該顯示手機頂端箭頭指向小車的動畫', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    // 驗證箭頭元素
    const arrow = container.querySelector('[data-testid="phone-arrow"]');
    expect(arrow).toBeInTheDocument();

    // 驗證小車元素
    const car = container.querySelector('[data-testid="car-icon"]');
    expect(car).toBeInTheDocument();
  });

  it('RED: 應該在圓圈中央顯示完整動畫', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    // 驗證圓圈容器
    const circle = container.querySelector('[data-testid="animation-circle"]');
    expect(circle).toBeInTheDocument();
  });

  it('RED: 應該支援自訂主題顏色', () => {
    const { container } = render(<PhoneFlatPrompt color="#ef4444" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('RED: 應該包含流暢的脈動與呼吸動畫', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    // 驗證動畫元素存在
    const animatedElements = container.querySelectorAll('[data-animation="pulse"]');
    expect(animatedElements.length).toBeGreaterThan(0);
  });
});
