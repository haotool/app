import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { CatCompanion } from '../CatCompanion';

const catName = () => i18n.t('app.cat_companion');

describe('CatCompanion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('點擊時應進入 react 狀態並顯示愛心', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<CatCompanion />);

    const button = screen.getByRole('button', { name: catName() });
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

    const button = screen.getByRole('button', { name: catName() });

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    fireEvent.click(button);
    expect(screen.queryByText('💜')).toBeNull();
  });
});
