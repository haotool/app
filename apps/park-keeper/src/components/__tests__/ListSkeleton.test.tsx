import { render } from '@testing-library/react';
import ListSkeleton from '../ListSkeleton';
import { THEMES, DEFAULT_SETTINGS } from '@app/park-keeper/constants';

describe('ListSkeleton', () => {
  const theme = THEMES[DEFAULT_SETTINGS.theme]!;

  it('應渲染 3 張骨架卡片，且對 a11y 樹隱藏', () => {
    const { container } = render(<ListSkeleton theme={theme} />);

    const root = container.firstElementChild;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('骨架卡片應套用 motion-reduce:animate-none 以尊重降低動態偏好', () => {
    const { container } = render(<ListSkeleton theme={theme} />);
    const cards = container.querySelectorAll('.motion-reduce\\:animate-none');
    expect(cards).toHaveLength(3);
  });
});
