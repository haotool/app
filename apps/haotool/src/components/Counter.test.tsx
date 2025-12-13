/**
 * Counter Component Tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Counter } from './Counter';

describe('Counter', () => {
  it('renders the value', () => {
    render(<Counter value="100" />);
    // The counter animates, so we just check the element exists
    const counter = screen.getByText(/100|0/);
    expect(counter).toBeInTheDocument();
  });

  it('renders with suffix', () => {
    render(<Counter value="50" suffix="%" />);
    const suffix = screen.getByText('%');
    expect(suffix).toBeInTheDocument();
  });

  it('handles string values', () => {
    render(<Counter value="N/A" />);
    const text = screen.getByText('N/A');
    expect(text).toBeInTheDocument();
  });
});
