/**
 * ShareButton Component - 社群分享優化
 * [Created: 2025-12-05] 病毒式傳播功能
 *
 * Features:
 * - Web Share API (支援行動裝置原生分享)
 * - Fallback 到複製連結
 * - 預設分享文案優化
 */
import { useState, useCallback } from 'react';
import { Share2, Copy, Check, MessageCircle, Twitter, Facebook } from 'lucide-react';

interface ShareButtonProps {
  /** 分享標題 */
  title?: string;
  /** 分享文案 */
  text?: string;
  /** 分享 URL */
  url?: string;
  /** 生成的日本名字（用於個人化分享文案） */
  japaneseName?: string;
  /** 中文姓氏 */
  surname?: string;
  /** 按鈕樣式 */
  variant?: 'icon' | 'button' | 'compact';
  /** 按鈕大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 自訂 className */
  className?: string;
}

const SITE_URL = 'https://app.haotool.org/nihonname/';

/**
 * 生成個人化分享文案
 */
function generateShareText(japaneseName?: string, surname?: string): string {
  if (japaneseName && surname) {
    return `我的日本名字是「${japaneseName}」！🇯🇵\n\n來自皇民化改姓生成器，輸入你的姓氏，看看1940年代你可能叫什麼日本名字！\n\n#皇民化 #日本名字 #台灣歷史`;
  }

  return `你知道1940年代你的姓氏可能改成什麼日本姓嗎？🇯🇵\n\n來試試皇民化改姓生成器，輸入姓氏就能查詢！\n\n#皇民化 #日本名字 #台灣歷史`;
}

/**
 * 社群分享按鈕
 */
export function ShareButton({
  title = 'NihonName 皇民化改姓生成器',
  text,
  url = SITE_URL,
  japaneseName,
  surname,
  variant = 'button',
  size = 'md',
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const shareText = text ?? generateShareText(japaneseName, surname);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  /**
   * 使用 Web Share API（行動裝置優先）
   */
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url,
        });
        return true;
      } catch (error) {
        // 用戶取消分享，不是錯誤
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn('Share failed:', error);
        }
        return false;
      }
    }
    return false;
  }, [title, shareText, url]);

  /**
   * 複製連結到剪貼簿
   */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Copy failed:', error);
    }
  }, [shareText, url]);

  /**
   * 分享到 Twitter/X
   */
  const handleTwitterShare = useCallback(() => {
    const tweetText = encodeURIComponent(shareText);
    const tweetUrl = encodeURIComponent(url);
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`,
      '_blank',
      'width=600,height=400',
    );
  }, [shareText, url]);

  /**
   * 分享到 Facebook
   */
  const handleFacebookShare = useCallback(() => {
    const fbUrl = encodeURIComponent(url);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${fbUrl}`,
      '_blank',
      'width=600,height=400',
    );
  }, [url]);

  /**
   * 分享到 LINE
   */
  const handleLineShare = useCallback(() => {
    const lineText = encodeURIComponent(`${shareText}\n${url}`);
    window.open(`https://social-plugins.line.me/lineit/share?text=${lineText}`, '_blank');
  }, [shareText, url]);

  /**
   * 主要分享動作
   */
  const handleShare = useCallback(async () => {
    // 優先使用原生分享（行動裝置）
    const shared = await handleNativeShare();
    if (!shared) {
      // 桌面裝置顯示分享選單
      setShowMenu((prev) => !prev);
    }
  }, [handleNativeShare]);

  /**
   * 同步包裝的 handleShare（避免 ESLint no-misused-promises）
   */
  const onShareClick = useCallback(() => {
    void handleShare();
  }, [handleShare]);

  /**
   * 同步包裝的 handleCopyLink
   */
  const onCopyClick = useCallback(() => {
    void handleCopyLink();
  }, [handleCopyLink]);

  // Icon-only 變體
  if (variant === 'icon') {
    return (
      <button
        onClick={onShareClick}
        className={`p-2 rounded-full bg-red-100 text-red-800 hover:bg-red-200 transition-colors ${className}`}
        aria-label="分享"
        title="分享"
      >
        <Share2 size={iconSizes[size]} />
      </button>
    );
  }

  // Compact 變體
  if (variant === 'compact') {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          onClick={onShareClick}
          className={`inline-flex items-center gap-1 ${sizeClasses[size]} rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors`}
          aria-label="分享"
        >
          <Share2 size={iconSizes[size]} />
          <span>分享</span>
        </button>

        {/* 分享選單 */}
        {showMenu && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-stone-200 p-2 z-50 min-w-[160px]">
            <button
              onClick={() => {
                onCopyClick();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              {copied ? '已複製！' : '複製連結'}
            </button>
            <button
              onClick={() => {
                handleTwitterShare();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Twitter size={16} />
              分享到 X
            </button>
            <button
              onClick={() => {
                handleFacebookShare();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Facebook size={16} />
              分享到 Facebook
            </button>
            <button
              onClick={() => {
                handleLineShare();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <MessageCircle size={16} />
              分享到 LINE
            </button>
          </div>
        )}
      </div>
    );
  }

  // 完整按鈕變體
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={onShareClick}
        className={`inline-flex items-center gap-2 ${sizeClasses[size]} rounded-lg bg-gradient-to-r from-red-700 to-red-800 text-white hover:from-red-800 hover:to-red-900 transition-all shadow-md hover:shadow-lg`}
        aria-label="分享你的日本名字"
      >
        <Share2 size={iconSizes[size]} />
        <span className="font-medium">分享我的日本名字</span>
      </button>

      {/* 分享選單 */}
      {showMenu && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-200 p-3 z-50 min-w-[200px]">
          <p className="text-xs text-stone-500 mb-2 px-2">選擇分享方式</p>
          <div className="space-y-1">
            <button
              onClick={() => {
                onCopyClick();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              {copied ? (
                <Check size={18} className="text-green-600" />
              ) : (
                <Copy size={18} className="text-stone-500" />
              )}
              {copied ? '已複製！' : '複製分享文案'}
            </button>
            <button
              onClick={() => {
                handleTwitterShare();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Twitter size={18} className="text-[#1DA1F2]" />
              分享到 X (Twitter)
            </button>
            <button
              onClick={() => {
                handleFacebookShare();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Facebook size={18} className="text-[#1877F2]" />
              分享到 Facebook
            </button>
            <button
              onClick={() => {
                handleLineShare();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <MessageCircle size={18} className="text-[#00B900]" />
              分享到 LINE
            </button>
          </div>
        </div>
      )}

      {/* 點擊外部關閉選單 */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} aria-hidden="true" />
      )}
    </div>
  );
}

export default ShareButton;
