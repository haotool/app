import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

declare global {
  // React 18 測試環境必須開啟 act() 支援旗標
  // 參考: https://react.dev/reference/react/act

  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock HTMLCanvasElement for lightweight-charts tests
// Based on Vitest best practices: https://vitest.dev/guide/mocking.html#globals
const mockCanvasRenderingContext2D = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: [] })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: [] })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  isPointInPath: vi.fn(() => false),
  quadraticCurveTo: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  canvas: null,
};

// Mock HTMLCanvasElement.prototype methods
// Type assertion needed because getContext is an overloaded function
HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === '2d') {
    return mockCanvasRenderingContext2D as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
HTMLCanvasElement.prototype.toBlob = vi.fn();

// Mock window.matchMedia for responsive design tests
// Required by lightweight-charts for handling responsive layouts
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for chart resizing tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

beforeEach(() => {
  window.localStorage.clear();
});
