import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatCompanion } from '../CatCompanion';

describe('CatCompanion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('點擊時應進入 react 狀態並顯示愛心', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<CatCompanion bottomOffset={96} />);

    const button = screen.getByRole('button', { name: '貓咪夥伴' });
    fireEvent.click(button);

    expect(button).toHaveTextContent('😸');
    expect(screen.getByText('💜')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(button).toHaveTextContent('🐱');
  });

  it('walking 狀態下點擊不應再次觸發愛心', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<CatCompanion />);

    const button = screen.getByRole('button', { name: '貓咪夥伴' });

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    fireEvent.click(button);
    expect(screen.queryByText('💜')).toBeNull();
  });
});
