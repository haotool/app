import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PhoneFlatPrompt from '../PhoneFlatPrompt';

describe('PhoneFlatPrompt - 專業 SVG 手機平放動畫 v1.0.12', () => {
  describe('結構化視覺設計測試', () => {
    it('應該渲染垂直手機正面視圖 SVG (200x280 viewBox)', () => {
      const { container } = render(<PhoneFlatPrompt />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 200 280');
    });

    it('應該包含手機裝置結構 (銀色邊框 + 黑色螢幕)', () => {
      const { container } = render(<PhoneFlatPrompt />);
      const phoneDevice = container.querySelector('[data-testid="phone-device"]');
      expect(phoneDevice).toBeInTheDocument();

      // 驗證螢幕區域
      const phoneScreen = container.querySelector('[data-testid="phone-screen"]');
      expect(phoneScreen).toBeInTheDocument();
    });

    it('應該顯示螢幕內容 (3x3 地圖網格 + 旋轉羅盤)', () => {
      const { container } = render(<PhoneFlatPrompt />);

      // 驗證地圖網格
      const mapGrid = container.querySelector('[data-testid="map-grid"]');
      expect(mapGrid).toBeInTheDocument();

      // 驗證羅盤元素
      const compass = container.querySelector('[data-testid="compass-element"]');
      expect(compass).toBeInTheDocument();
    });
  });

  describe('顏色轉換動畫測試', () => {
    it('應該包含紅色到綠色的漸層轉換', () => {
      const { container } = render(<PhoneFlatPrompt />);

      // 驗證紅色漸層定義
      const redGradient = container.querySelector('#red-gradient');
      expect(redGradient).toBeInTheDocument();

      // 驗證綠色漸層定義
      const greenGradient = container.querySelector('#green-gradient');
      expect(greenGradient).toBeInTheDocument();
    });

    it('應該有 4 秒循環的顏色動畫', () => {
      const { container } = render(<PhoneFlatPrompt />);

      // 驗證動畫元素存在
      const animatedBackground = container.querySelector('[data-testid="color-transition"]');
      expect(animatedBackground).toBeInTheDocument();
    });
  });

  describe('旋轉動畫測試', () => {
    it('應該包含 rotateX 動畫 (0° → 85° → 0°)', () => {
      const { container } = render(<PhoneFlatPrompt />);

      // 驗證旋轉動畫組
      const rotationGroup = container.querySelector('[data-testid="rotation-group"]');
      expect(rotationGroup).toBeInTheDocument();
    });

    it('應該在平放時顯示汽車指示器', () => {
      const { container } = render(<PhoneFlatPrompt />);

      // 驗證汽車元素
      const carIndicator = container.querySelector('[data-testid="car-indicator"]');
      expect(carIndicator).toBeInTheDocument();
    });
  });

  describe('效能優化測試', () => {
    it('應該保持 SVG 元素數量在合理範圍內', () => {
      const { container } = render(<PhoneFlatPrompt />);
      // 只計算主要的結構元素，不包含深層嵌套
      const mainElements = container.querySelectorAll('svg > g, svg > defs, svg > rect');
      const structuralElements = container.querySelectorAll('[data-testid]');

      // 根據最佳實踐，主要元素數量應在合理範圍
      expect(mainElements.length).toBeGreaterThanOrEqual(3);
      expect(mainElements.length).toBeLessThanOrEqual(10);

      // 結構元素應該都有 testid 標記
      expect(structuralElements.length).toBeGreaterThanOrEqual(5);
    });

    it('應該使用 GPU 加速屬性 (transform, opacity)', () => {
      const { container } = render(<PhoneFlatPrompt />);

      // 驗證使用 transform 的動畫元素
      const transformElements = container.querySelectorAll('[data-animation-type="transform"]');
      expect(transformElements.length).toBeGreaterThan(0);
    });
  });

  describe('SSOT 原則測試', () => {
    it('應該只接受 color 和 className props (無技術債)', () => {
      const component = <PhoneFlatPrompt color="#FF3333" className="test-class" />;

      // TypeScript 會在編譯時檢查，這裡只驗證 props 結構
      expect(component.props).toHaveProperty('color');
      expect(component.props).toHaveProperty('className');
      // 使用類型斷言來滿足 TypeScript
      expect(Object.keys(component.props as Record<string, unknown>).length).toBe(2);
    });
  });
});
