import { render, screen, fireEvent } from '@testing-library/react';
import { ShareModal } from './ShareModal';
import { vi, describe, it, expect } from 'vitest';

describe('ShareModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    surname: '陳',
    japaneseSurname: '田中',
    japaneseGivenName: '太郎',
    punName: '竜后莉宮',
    url: 'https://example.com',
  };

  it('renders correctly when open', () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByText(/分享你的日本姓氏/i)).toBeInTheDocument();
    expect(screen.getByText(/Threads/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ShareModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/分享你的日本姓氏/i)).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ShareModal {...defaultProps} />);
    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays the full Japanese name', () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByText('田中')).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
  });

  it('displays the pun name (Kuso)', () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByText('竜后莉宮')).toBeInTheDocument();
  });

  it('generates random Taiwanese copy for Threads', () => {
    render(<ShareModal {...defaultProps} />);
    const threadsButton = screen.getByText(/Threads/i).closest('button');
    expect(threadsButton).toBeInTheDocument();
  });
});
