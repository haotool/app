import { render } from '@testing-library/react';
import HomeSkeleton from '../HomeSkeleton';

describe('HomeSkeleton', () => {
  it('should render skeleton layout with pulse animations', () => {
    const { container } = render(<HomeSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('should render header, search, records, and FAB placeholders', () => {
    const { container } = render(<HomeSkeleton />);
    expect(container.querySelector('header')).toBeInTheDocument();
    const roundedItems = container.querySelectorAll('.rounded-2xl');
    expect(roundedItems.length).toBe(3);
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });
});
