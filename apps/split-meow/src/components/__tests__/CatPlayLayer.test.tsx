import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatPlayLayer } from '../CatPlayLayer';
import type { Particle } from '../../lib/catPlay';

describe('CatPlayLayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('應透過 portal 渲染 paw 與 celebrate 粒子', () => {
    const particles: Particle[] = [
      { id: 1, x: 10, y: 20, emoji: '🐾', type: 'paw', spin: 0 },
      { id: 2, x: 30, y: 40, emoji: '🎉', type: 'celebrate', spin: 45 },
    ];

    render(<CatPlayLayer particles={particles} onRemove={vi.fn()} />);

    expect(screen.getByText('🐾')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('應在粒子生命週期結束後呼叫 onRemove', () => {
    const onRemove = vi.fn();
    const particles: Particle[] = [
      { id: 7, x: 10, y: 20, emoji: '🐾', type: 'paw', spin: 0 },
      { id: 8, x: 30, y: 40, emoji: '🎉', type: 'celebrate', spin: 45 },
    ];

    render(<CatPlayLayer particles={particles} onRemove={onRemove} />);

    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(onRemove).toHaveBeenCalledWith(7);

    act(() => {
      vi.advanceTimersByTime(550);
    });
    expect(onRemove).toHaveBeenCalledWith(8);
  });
});
