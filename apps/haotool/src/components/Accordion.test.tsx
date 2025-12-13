/**
 * Accordion Component Tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccordionItem } from './Accordion';

const mockFaqItem = {
  question: 'What is this?',
  answer: 'This is a test answer.',
};

describe('AccordionItem', () => {
  it('renders the question', () => {
    render(<AccordionItem item={mockFaqItem} />);
    expect(screen.getByText('What is this?')).toBeInTheDocument();
  });

  it('answer is hidden by default', () => {
    render(<AccordionItem item={mockFaqItem} />);
    expect(screen.queryByText('This is a test answer.')).not.toBeInTheDocument();
  });

  it('shows answer when clicked', async () => {
    render(<AccordionItem item={mockFaqItem} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByText('This is a test answer.')).toBeInTheDocument();
  });

  it('toggles aria-expanded attribute', () => {
    render(<AccordionItem item={mockFaqItem} />);
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
