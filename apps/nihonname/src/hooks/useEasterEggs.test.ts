import { renderHook, act } from '@testing-library/react';
import { useEasterEggs } from './useEasterEggs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useEasterEggs', () => {
  // Mock Date.now for consistent timing tests
  let mockNow = 0;

  beforeEach(() => {
    mockNow = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => mockNow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers sakura on 5 logo clicks', () => {
    const { result } = renderHook(() => useEasterEggs());

    // Simulate 5 rapid logo clicks within 500ms each
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.handleLogoClick();
      });
      mockNow += 100; // 100ms between clicks
    }

    expect(result.current.activeEgg).toBe('sakura');
  });

  it('triggers torii on 3 stamp clicks', () => {
    const { result } = renderHook(() => useEasterEggs());

    // Create a mock event
    const mockEvent = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    // Simulate 3 rapid stamp clicks within 500ms each
    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.handleToriiClick(mockEvent);
      });
      mockNow += 100; // 100ms between clicks
    }

    expect(result.current.activeEgg).toBe('torii');
  });

  it('triggers glow on double text click', () => {
    const { result } = renderHook(() => useEasterEggs());

    act(() => {
      result.current.handleDoubleTextClick();
    });

    expect(result.current.activeEgg).toBe('glow');
  });

  it('triggers samurai on 7 rapid clicks', () => {
    const { result } = renderHook(() => useEasterEggs());

    // Simulate 7 rapid clicks within 300ms each
    for (let i = 0; i < 7; i++) {
      act(() => {
        result.current.handleRapidClick();
      });
      mockNow += 100; // 100ms between clicks (within 300ms limit)
    }

    expect(result.current.activeEgg).toBe('samurai');
  });

  it('returns null activeEgg initially', () => {
    const { result } = renderHook(() => useEasterEggs());
    expect(result.current.activeEgg).toBeNull();
  });

  it('provides all expected handler functions', () => {
    const { result } = renderHook(() => useEasterEggs());

    expect(typeof result.current.handleLogoClick).toBe('function');
    expect(typeof result.current.handleDoubleTextClick).toBe('function');
    expect(typeof result.current.handleToriiClick).toBe('function');
    expect(typeof result.current.handleRapidClick).toBe('function');
    expect(typeof result.current.handleLongPressStart).toBe('function');
    expect(typeof result.current.handleLongPressEnd).toBe('function');
    expect(typeof result.current.requestMotionPermission).toBe('function');
  });

  it('does not trigger sakura if clicks are too slow', () => {
    const { result } = renderHook(() => useEasterEggs());

    // Simulate 5 slow logo clicks (more than 500ms apart)
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.handleLogoClick();
      });
      mockNow += 600; // 600ms between clicks (too slow)
    }

    expect(result.current.activeEgg).toBeNull();
  });
});
