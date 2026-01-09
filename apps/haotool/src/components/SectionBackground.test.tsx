/**
 * SectionBackground Component Tests
 * [BDD:2026-01-09] 測試 SectionBackground 組件的渲染
 * [context7:vitest-dev/vitest:2026-01-09]
 *
 * Note: Three.js Canvas 組件在 jsdom 中無法完全測試
 * 這裡只測試 SSR 安全性和基本渲染
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import SectionBackground from './SectionBackground';

// Mock @react-three/fiber to avoid WebGL errors in jsdom
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-canvas">{children}</div>
  ),
  useFrame: vi.fn(),
}));

// framer-motion is mocked globally in test/setup.ts

describe('SectionBackground', () => {
  it('renders in browser environment', () => {
    // Ensure window exists (default in jsdom)
    const { container } = render(<SectionBackground />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders with correct structure', () => {
    const { getByTestId } = render(<SectionBackground />);

    // Should have the mocked Canvas
    expect(getByTestId('mock-canvas')).toBeInTheDocument();
  });

  it('has correct CSS classes for positioning', () => {
    const { container } = render(<SectionBackground />);

    // The root element should have positioning classes
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass('absolute');
    expect(rootDiv).toHaveClass('inset-0');
    expect(rootDiv).toHaveClass('z-0');
    expect(rootDiv).toHaveClass('pointer-events-none');
  });
});
