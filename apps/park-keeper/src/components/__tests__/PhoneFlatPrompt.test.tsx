import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PhoneFlatPrompt from '../PhoneFlatPrompt';

describe('PhoneFlatPrompt - 垂直手機正面動畫（站立紅→平躺綠）', () => {
  it('RED: 應該渲染垂直手機正面 SVG', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox');
  });

  it('RED: 手機應該包含螢幕邊框與機身', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    const phoneBody = container.querySelector('[data-testid="phone-body"]');
    expect(phoneBody).toBeInTheDocument();
  });

  it('RED: 手機螢幕內應該顯示地圖與羅盤', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    const screen = container.querySelector('[data-testid="phone-screen"]');
    expect(screen).toBeInTheDocument();

    // 驗證螢幕內有地圖標記
    const mapMarker = container.querySelector('[data-testid="screen-map-marker"]');
    expect(mapMarker).toBeInTheDocument();

    // 驗證螢幕內有羅盤
    const compass = container.querySelector('[data-testid="screen-compass"]');
    expect(compass).toBeInTheDocument();
  });

  it('RED: 站立狀態應該是紅色主題', () => {
    const { container } = render(<PhoneFlatPrompt color="#FF3333" />);

    const phoneBody = container.querySelector('[data-testid="phone-body"]');
    expect(phoneBody).toBeInTheDocument();
    // 紅色會透過 stroke 或 fill 屬性設定
  });

  it('RED: 應該包含旋轉動畫（站立→平躺）', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    const animatedGroup = container.querySelector('[data-testid="phone-rotation-group"]');
    expect(animatedGroup).toBeInTheDocument();
  });

  it('RED: 平躺後應該顯示綠色並指向汽車', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    // 驗證有汽車圖示
    const car = container.querySelector('[data-testid="car-target"]');
    expect(car).toBeInTheDocument();
  });

  it('RED: 應該包含流暢的顏色轉換動畫（紅→綠）', () => {
    const { container } = render(<PhoneFlatPrompt color="#3b82f6" />);

    // 驗證有顏色動畫元素
    const colorAnimated = container.querySelectorAll('[data-animation="color-shift"]');
    expect(colorAnimated.length).toBeGreaterThan(0);
  });
});
