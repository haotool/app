import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FundingRateBadge } from './FundingRateBadge';

describe('FundingRateBadge', () => {
  it('colors a positive rate with the long tone and shows the countdown', () => {
    render(<FundingRateBadge rate={0.0001} nextFundingTime={Date.now() + 65_000} />);
    expect(screen.getByText('+0.0100%')).toHaveClass('text-long');
    expect(screen.getByText(/^\d+:\d{2}:\d{2}$|^\d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it('colors a negative rate with the short tone', () => {
    render(<FundingRateBadge rate={-0.0002} nextFundingTime={Date.now() + 65_000} />);
    expect(screen.getByText('-0.0200%')).toHaveClass('text-short');
  });

  it('falls back to placeholders when funding fields are missing', () => {
    render(<FundingRateBadge rate={undefined} nextFundingTime={undefined} />);
    expect(screen.getByText('--')).toHaveClass('text-text-2');
    expect(screen.getByText('--:--')).toBeInTheDocument();
  });
});
