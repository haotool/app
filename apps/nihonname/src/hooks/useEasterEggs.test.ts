import { renderHook, act } from '@testing-library/react';
import { useEasterEggs } from './useEasterEggs';
import { describe, it, expect } from 'vitest';

describe('useEasterEggs', () => {
  it('detects Konami code', () => {
    const { result } = renderHook(() => useEasterEggs());

    act(() => {
      // Simulate Konami Code: Up Up Down Down Left Right Left Right B A
      const keys = [
        'ArrowUp',
        'ArrowUp',
        'ArrowDown',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'ArrowLeft',
        'ArrowRight',
        'b',
        'a',
      ];
      keys.forEach((key) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
      });
    });

    expect(result.current.activeEgg).toBe('sakura');
  });

  it('detects "sushi" typing', () => {
    const { result } = renderHook(() => useEasterEggs());

    act(() => {
      ['s', 'u', 's', 'h', 'i'].forEach((key) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
      });
    });

    expect(result.current.activeEgg).toBe('sushi');
  });
});
