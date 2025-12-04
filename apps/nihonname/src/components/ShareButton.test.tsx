/**
 * ShareButton Component Tests
 * [Created: 2025-12-05]
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from './ShareButton';

// Mock navigator.share
const mockShare = vi.fn();
const mockClipboard = {
  writeText: vi.fn(),
};

// Mock window.open
const mockOpen = vi.fn();

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Button variants', () => {
    it('should render icon variant', () => {
      render(<ShareButton variant="icon" />);
      expect(screen.getByRole('button', { name: '分享' })).toBeInTheDocument();
    });

    it('should render compact variant', () => {
      render(<ShareButton variant="compact" />);
      expect(screen.getByText('分享')).toBeInTheDocument();
    });

    it('should render button variant (default)', () => {
      render(<ShareButton />);
      expect(screen.getByText('分享我的日本名字')).toBeInTheDocument();
    });
  });

  describe('Button sizes', () => {
    it('should apply small size', () => {
      render(<ShareButton variant="compact" size="sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-xs');
    });

    it('should apply medium size (default)', () => {
      render(<ShareButton variant="compact" size="md" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-sm');
    });

    it('should apply large size', () => {
      render(<ShareButton variant="compact" size="lg" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-base');
    });
  });

  describe('Native share (Web Share API)', () => {
    it('should call navigator.share when available', async () => {
      mockShare.mockResolvedValue(undefined);
      render(<ShareButton />);

      const button = screen.getByRole('button', { name: /分享.*日本名字/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'NihonName 皇民化改姓生成器',
            url: 'https://app.haotool.org/nihonname/',
          }),
        );
      });
    });

    it('should handle share rejection gracefully', async () => {
      mockShare.mockRejectedValue(new DOMException('User cancelled', 'AbortError'));
      render(<ShareButton />);

      const button = screen.getByRole('button', { name: /分享.*日本名字/i });
      fireEvent.click(button);

      // Should not throw error
      await waitFor(() => {
        expect(mockShare).toHaveBeenCalled();
      });
    });
  });

  describe('Fallback menu (desktop)', () => {
    beforeEach(() => {
      // Remove navigator.share to simulate desktop
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('should show menu when share is not available', async () => {
      render(<ShareButton />);

      const button = screen.getByRole('button', { name: /分享.*日本名字/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('選擇分享方式')).toBeInTheDocument();
      });
    });

    it('should copy link when clicking copy button', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);
      render(<ShareButton />);

      const button = screen.getByRole('button', { name: /分享.*日本名字/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('複製分享文案')).toBeInTheDocument();
      });

      const copyButton = screen.getByText('複製分享文案');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should open Twitter share window', async () => {
      render(<ShareButton />);

      const button = screen.getByRole('button', { name: /分享.*日本名字/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('分享到 X (Twitter)')).toBeInTheDocument();
      });

      const twitterButton = screen.getByText('分享到 X (Twitter)');
      fireEvent.click(twitterButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.any(String),
      );
    });

    it('should open Facebook share window', async () => {
      render(<ShareButton />);

      const button = screen.getByRole('button', { name: /分享.*日本名字/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('分享到 Facebook')).toBeInTheDocument();
      });

      const fbButton = screen.getByText('分享到 Facebook');
      fireEvent.click(fbButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        expect.any(String),
      );
    });

    it('should open LINE share window', async () => {
      render(<ShareButton />);

      const button = screen.getByRole('button', { name: /分享.*日本名字/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('分享到 LINE')).toBeInTheDocument();
      });

      const lineButton = screen.getByText('分享到 LINE');
      fireEvent.click(lineButton);

      expect(mockOpen).toHaveBeenCalledWith(expect.stringContaining('line.me'), '_blank');
    });
  });

  describe('Custom share text', () => {
    it('should use personalized text with Japanese name', async () => {
      mockShare.mockResolvedValue(undefined);
      render(<ShareButton japaneseName="田中太郎" surname="林" />);

      const button = screen.getByRole('button', { name: /分享.*日本名字/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining('我的日本名字是「田中太郎」'),
          }),
        );
      });
    });

    it('should use custom text when provided', async () => {
      mockShare.mockResolvedValue(undefined);
      render(<ShareButton text="自訂分享文案" />);

      const button = screen.getByRole('button', { name: /分享.*日本名字/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            text: '自訂分享文案',
          }),
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<ShareButton variant="icon" />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', '分享');
    });

    it('should have title attribute for icon variant', () => {
      render(<ShareButton variant="icon" />);
      expect(screen.getByRole('button')).toHaveAttribute('title', '分享');
    });
  });
});
