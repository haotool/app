import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BottomSheet } from '../BottomSheet';

describe('BottomSheet', () => {
  it('renders children when open', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <div>Sheet Content</div>
      </BottomSheet>,
    );
    expect(screen.getByText('Sheet Content')).toBeInTheDocument();
  });

  it('renders a drag handle', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <div>content</div>
      </BottomSheet>,
    );
    // drag handle — role="button" with accessible label
    expect(screen.getByRole('button', { name: /drag|handle|拖/i })).toBeInTheDocument();
  });

  it('starts collapsed (peek state)', () => {
    const { container } = render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <div>content</div>
      </BottomSheet>,
    );
    // The sheet wrapper should exist
    const sheet = container.querySelector('[data-testid="bottom-sheet"]');
    expect(sheet).toBeInTheDocument();
  });

  it('expands when drag handle is clicked', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <div>content</div>
      </BottomSheet>,
    );
    const handle = screen.getByRole('button', { name: /drag|handle|拖/i });
    fireEvent.click(handle);
    // After toggle, data-expanded should be true
    const sheet = screen.getByTestId('bottom-sheet');
    expect(sheet).toHaveAttribute('data-expanded', 'true');
  });

  it('collapses when handle is clicked again', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <div>content</div>
      </BottomSheet>,
    );
    const handle = screen.getByRole('button', { name: /drag|handle|拖/i });
    fireEvent.click(handle);
    fireEvent.click(handle);
    const sheet = screen.getByTestId('bottom-sheet');
    expect(sheet).toHaveAttribute('data-expanded', 'false');
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <BottomSheet isOpen={false} onClose={vi.fn()}>
        <div>content</div>
      </BottomSheet>,
    );
    const sheet = container.querySelector('[data-testid="bottom-sheet"]');
    expect(sheet).toBeNull();
  });
});
