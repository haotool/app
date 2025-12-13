/**
 * Counter Component Tests
 * Tests for the animated counter component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock framer-motion hooks before importing Counter
vi.mock('framer-motion', () => ({
  useInView: () => true,
  useSpring: () => ({
    get: () => 0,
    set: () => void 0,
    on: () => () => void 0,
  }),
}));

import { Counter } from './Counter';

describe('Counter', () => {
  it('renders the component with numeric value', () => {
    render(<Counter value="100" />);

    // The counter should render with initial display value
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with suffix', () => {
    render(<Counter value="50" suffix="+" />);

    // The suffix should be rendered
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('handles non-numeric values', () => {
    render(<Counter value="N/A" />);

    // Non-numeric values should be displayed as-is
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders a span element', () => {
    const { container } = render(<Counter value="100" />);

    // The counter should render a span with tabular-nums class
    const span = container.querySelector('span.tabular-nums');
    expect(span).toBeInTheDocument();
  });
});
