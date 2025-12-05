/**
 * ShareButtons Component Tests
 * [Created: 2025-12-06] 補齊 ShareButtons 組件測試覆蓋率
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShareButtons } from './ShareButtons';

// Mock window.open
const mockOpen = vi.fn();
const originalOpen = window.open;

// Mock navigator.clipboard
const mockWriteText = vi.fn();
const originalClipboard = navigator.clipboard;

describe('ShareButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.open = mockOpen;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    });
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    window.open = originalOpen;
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  });

  it('should render share buttons', () => {
    render(<ShareButtons />);
    expect(screen.getByText('分享你的日本姓氏')).toBeInTheDocument();
    expect(screen.getByTitle('分享到 Twitter')).toBeInTheDocument();
    expect(screen.getByTitle('分享到 Facebook')).toBeInTheDocument();
    expect(screen.getByTitle('分享到 Line')).toBeInTheDocument();
    expect(screen.getByTitle('複製連結')).toBeInTheDocument();
  });

  it('should render with custom surname and japaneseName', () => {
    render(<ShareButtons surname="林" japaneseName="小林" />);
    expect(screen.getByText('分享你的日本姓氏，邀請朋友一起探索歷史！')).toBeInTheDocument();
  });

  it('should not render hint when surname and japaneseName are not provided', () => {
    render(<ShareButtons />);
    expect(screen.queryByText('分享你的日本姓氏，邀請朋友一起探索歷史！')).not.toBeInTheDocument();
  });

  it('should open Twitter share window with correct URL and text', () => {
    render(<ShareButtons surname="林" japaneseName="小林" />);
    const twitterButton = screen.getByTitle('分享到 Twitter');
    fireEvent.click(twitterButton);
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet?text='),
      '_blank',
      'width=550,height=420',
    );
  });

  it('should open Facebook share window with correct URL', () => {
    render(<ShareButtons surname="林" japaneseName="小林" />);
    const facebookButton = screen.getByTitle('分享到 Facebook');
    fireEvent.click(facebookButton);
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer'),
      '_blank',
      'width=550,height=420',
    );
  });

  it('should open Line share window with correct URL', () => {
    render(<ShareButtons surname="林" japaneseName="小林" />);
    const lineButton = screen.getByTitle('分享到 Line');
    fireEvent.click(lineButton);
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('line.me/lineit/share?url='),
      '_blank',
      'width=550,height=420',
    );
  });

  it('should copy link to clipboard when copy button is clicked', async () => {
    render(<ShareButtons />);
    const copyButton = screen.getByTitle('複製連結');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  it('should show "已複製" text after copying', async () => {
    render(<ShareButtons />);
    const copyButton = screen.getByTitle('複製連結');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('已複製')).toBeInTheDocument();
    });
  });

  it('should handle clipboard error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockWriteText.mockRejectedValue(new Error('Clipboard error'));

    render(<ShareButtons />);
    const copyButton = screen.getByTitle('複製連結');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should generate correct share text with surname and japaneseName', () => {
    render(<ShareButtons surname="陳" japaneseName="田中" />);
    const twitterButton = screen.getByTitle('分享到 Twitter');
    fireEvent.click(twitterButton);

    // Verify the URL contains the expected encoded text
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('陳')),
      '_blank',
      'width=550,height=420',
    );
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('田中')),
      '_blank',
      'width=550,height=420',
    );
  });

  it('should generate default share text without surname', () => {
    render(<ShareButtons description="測試描述" />);
    const twitterButton = screen.getByTitle('分享到 Twitter');
    fireEvent.click(twitterButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('測試描述')),
      '_blank',
      'width=550,height=420',
    );
  });

  it('should use custom URL when provided', () => {
    const customUrl = 'https://example.com/custom';
    render(<ShareButtons url={customUrl} />);
    const twitterButton = screen.getByTitle('分享到 Twitter');
    fireEvent.click(twitterButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(customUrl)),
      '_blank',
      'width=550,height=420',
    );
  });

  it('should track share event with gtag if available', () => {
    const mockGtag = vi.fn();
    const win = window as Window & {
      gtag?: (command: string, action: string, params: Record<string, string>) => void;
    };
    win.gtag = mockGtag;

    render(<ShareButtons surname="林" japaneseName="小林" />);
    const twitterButton = screen.getByTitle('分享到 Twitter');
    fireEvent.click(twitterButton);

    expect(mockGtag).toHaveBeenCalledWith('event', 'share', {
      method: 'twitter',
      content_type: 'japanese_name_result',
      item_id: '林',
    });

    delete win.gtag;
  });

  it('should track share event without surname', () => {
    const mockGtag = vi.fn();
    const win = window as Window & {
      gtag?: (command: string, action: string, params: Record<string, string>) => void;
    };
    win.gtag = mockGtag;

    render(<ShareButtons />);
    const facebookButton = screen.getByTitle('分享到 Facebook');
    fireEvent.click(facebookButton);

    expect(mockGtag).toHaveBeenCalledWith('event', 'share', {
      method: 'facebook',
      content_type: 'japanese_name_result',
      item_id: 'homepage',
    });

    delete win.gtag;
  });

  it('should render all four share buttons with correct text labels', () => {
    render(<ShareButtons />);
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.getByText('複製')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ShareButtons />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('title');
    });
  });
});
