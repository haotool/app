/**
 * ShareButtons Component - 社群分享按鈕
 * 支援 Twitter, Facebook, Line, 複製連結
 * [Created: 2025-12-06] 實作社群分享優化功能
 */
import { useState } from 'react';
import { Share2, Check, Twitter, Facebook } from 'lucide-react';

interface ShareButtonsProps {
  url?: string;
  title?: string;
  description?: string;
  surname?: string;
  japaneseName?: string;
}

export function ShareButtons({
  url = window.location.href,
  title: _title = 'NihonName 皇民化改姓生成器',
  description = '查詢你的姓氏在日治時期可能改為哪些日本姓氏',
  surname,
  japaneseName,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  // 動態生成分享文案
  const getShareText = () => {
    if (surname && japaneseName) {
      return `我的姓氏「${surname}」在日治時期可能改為「${japaneseName}」！快來查詢你的日本姓氏 👉`;
    }
    return `${description} 👉`;
  };

  const shareText = getShareText();
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  // 追蹤分享事件
  const trackShare = (platform: string) => {
    // Google Analytics 事件追蹤
    const win = window as Window & {
      gtag?: (command: string, action: string, params: Record<string, string>) => void;
    };
    if (typeof window !== 'undefined' && win.gtag) {
      win.gtag('event', 'share', {
        method: platform,
        content_type: 'japanese_name_result',
        item_id: surname ?? 'homepage',
      });
    }
    console.log(`[Share] ${platform}:`, { surname, japaneseName });
  };

  // 複製連結
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackShare('copy_link');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Twitter/X 分享
  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    trackShare('twitter');
  };

  // Facebook 分享
  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
    trackShare('facebook');
  };

  // Line 分享
  const handleLineShare = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedText}`;
    window.open(lineUrl, '_blank', 'width=550,height=420');
    trackShare('line');
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-stone-700">
          <Share2 size={16} className="mr-2" />
          <span className="text-sm font-medium">分享你的日本姓氏</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {/* Twitter/X */}
        <button
          onClick={handleTwitterShare}
          className="flex flex-col items-center justify-center p-3 bg-stone-50 hover:bg-blue-50 rounded-lg transition-colors group"
          title="分享到 Twitter"
        >
          <Twitter size={20} className="text-stone-600 group-hover:text-blue-500 mb-1" />
          <span className="text-[10px] text-stone-600 group-hover:text-blue-500">Twitter</span>
        </button>

        {/* Facebook */}
        <button
          onClick={handleFacebookShare}
          className="flex flex-col items-center justify-center p-3 bg-stone-50 hover:bg-blue-50 rounded-lg transition-colors group"
          title="分享到 Facebook"
        >
          <Facebook size={20} className="text-stone-600 group-hover:text-blue-600 mb-1" />
          <span className="text-[10px] text-stone-600 group-hover:text-blue-600">Facebook</span>
        </button>

        {/* Line */}
        <button
          onClick={handleLineShare}
          className="flex flex-col items-center justify-center p-3 bg-stone-50 hover:bg-green-50 rounded-lg transition-colors group"
          title="分享到 Line"
        >
          <svg
            className="w-5 h-5 text-stone-600 group-hover:text-green-600 mb-1"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          <span className="text-[10px] text-stone-600 group-hover:text-green-600">Line</span>
        </button>

        {/* 複製連結 */}
        <button
          onClick={() => void handleCopyLink()}
          className="flex flex-col items-center justify-center p-3 bg-stone-50 hover:bg-red-50 rounded-lg transition-colors group"
          title="複製連結"
        >
          {copied ? (
            <>
              <Check size={20} className="text-green-600 mb-1" />
              <span className="text-[10px] text-green-600">已複製</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 text-stone-600 group-hover:text-red-700 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              <span className="text-[10px] text-stone-600 group-hover:text-red-700">複製</span>
            </>
          )}
        </button>
      </div>

      {/* 分享提示 */}
      {surname && japaneseName && (
        <p className="text-xs text-stone-500 mt-3 text-center">
          分享你的日本姓氏，邀請朋友一起探索歷史！
        </p>
      )}
    </div>
  );
}
