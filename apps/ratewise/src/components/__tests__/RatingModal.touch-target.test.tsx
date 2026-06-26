import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RatingModal } from '../RatingModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

function renderModal() {
  return render(
    <RatingModal
      isVisible={true}
      markRated={vi.fn()}
      snooze={vi.fn()}
      dismiss={vi.fn()}
      isFinalChance={false}
    />,
  );
}

describe('RatingModal 觸控目標', () => {
  it('星星按鈕應維持 44px 觸控目標（h-11 w-11）與圓形命中區', () => {
    renderModal();

    const stars = screen.getAllByRole('radio');
    expect(stars).toHaveLength(5);

    for (const star of stars) {
      expect(star.className).toContain('h-11');
      expect(star.className).toContain('w-11');
      expect(star.className).toContain('rounded-full');
      expect(star.className).not.toMatch(/\bw-8\b/);
    }
  });

  it('星星按鈕應保留鍵盤 focus-visible ring', () => {
    renderModal();

    for (const star of screen.getAllByRole('radio')) {
      expect(star.className).toContain('focus-visible:ring-2');
    }
  });
});
