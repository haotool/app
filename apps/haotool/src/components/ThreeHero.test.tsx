import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as drei from '@react-three/drei';
import ThreeHero from './ThreeHero';

describe('ThreeHero', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('應使用程序化 Environment，避免依賴遠端 HDR preset 導致首頁 CSP 與渲染失效', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const environmentSpy = vi.spyOn(drei, 'Environment');

    render(<ThreeHero isCtaHovered={false} />);

    expect(environmentSpy).toHaveBeenCalled();
    const calls = environmentSpy.mock.calls;
    const props = calls.at(0)?.[0];

    expect(props).toBeDefined();
    expect(props).not.toHaveProperty('preset');
    expect(props).toHaveProperty('resolution', 256);
    expect(props).toHaveProperty('children');
  });
});
