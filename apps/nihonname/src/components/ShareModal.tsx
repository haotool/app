import { X, Twitter, Facebook, Copy, Check } from 'lucide-react';
import { useState, memo } from 'react';

// 真實台灣人分享風格文案 - 20 種（含日本姓名佔位符）
const TAIWAN_SHARE_COPIES = [
  '乾...我上輩子居然叫「{fullName}」？😂 別名還是「{punName}」也太中二！',
  '笑死，我的日本名字是「{fullName}」聽起來好強！Kuso 名還叫「{punName}」www',
  '欸不是，「{fullName}」這名字是不是有點太帥？還有諧音「{punName}」🤣',
  '原來我在日治時期會叫「{fullName}」...好像有點猛，別名「{punName}」更猛',
  '測出來了！我的皇民化名字是「{fullName}」，諧音名「{punName}」笑翻 😳',
  '這產生器有毒，我測出「{fullName}」，Kuso「{punName}」太好笑了 www',
  '快笑死，我的日本名字「{fullName}」超奇怪，別名「{punName}」更怪 XD',
  '「{fullName}」這是什麼動漫角色的名字啦！諧音「{punName}」更像反派！',
  '我覺得「{fullName}」比本名好聽耶（小聲），「{punName}」也很讚',
  '這網站做得太精緻了，推個！我是「{fullName}」aka「{punName}」👍',
  '這是什麼羞恥 play 啦 www 我的名字「{fullName}」諧音「{punName}」',
  '居然還有族譜考據，我測出「{fullName}」，別名「{punName}」有點東西...',
  '「{fullName}」這名字聽起來很有錢（？諧音「{punName}」更有錢',
  '「{fullName}」感覺是反派角色吧？👿 「{punName}」更像最終 Boss',
  '好想真的叫「{fullName}」喔...「{punName}」也很可以',
  '大家快幫我看看「{fullName}」這個名字適合我嗎？Kuso「{punName}」呢？',
  '測完覺得自己變日本人了（誤）🇯🇵 我是「{fullName}」',
  '「{fullName}」這名字...感覺會呼吸之呼吸？⚔️「{punName}」是水之呼吸',
  '靠北，「{fullName}」聽起來像武士，「{punName}」像忍者 🥷',
  '剛測完日治時期改名，我是「{fullName}」，諧音「{punName}」，你們也來測！',
];

// 指定的 Threads 貼文連結
const THREADS_POST_URL =
  'https://www.threads.com/@azlife_1224/post/DR2NCeEj6Fo?xmt=AQF032vOaV8jaHsEMblSwCHo25bk4wL24utd2Rz4f1bE-g';

// Custom Threads Icon (官方 SVG)
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 192 192" className={className} fill="currentColor">
    <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4485 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.807C118.417 71.654 119.926 75.3499 120.589 79.8615C113.617 78.2975 106.24 77.5071 98.4036 77.5071C68.9712 77.5071 47.1532 94.449 47.1532 117.106C47.1532 132.356 56.442 144.341 72.8324 144.341C87.0834 144.341 97.1446 135.013 100.926 125.605C103.66 135.898 112.77 144.137 124.068 144.137C139.105 144.137 147.104 131.199 148.503 111.864C148.623 110.206 148.684 108.51 148.684 106.779C148.684 72.575 134.37 48.503 116.018 33.5478C97.3901 18.3681 73.2494 12.9816 48.8625 18.6853L52.7502 35.308C71.818 30.8474 90.2763 34.8144 105.097 46.8912C119.868 58.9278 131.687 79.0167 131.687 106.779C131.687 108.231 131.64 109.66 131.547 111.065C130.426 126.552 125.122 127.192 124.068 127.192C120.934 127.192 117.564 124.852 115.779 120.519C115.133 118.952 114.654 117.227 114.346 115.366C117.628 113.351 120.484 110.969 122.827 108.26C122.931 108.139 123.034 108.018 123.136 107.896C123.882 107.004 124.593 106.075 125.267 105.111C126.721 103.027 127.933 100.771 128.862 98.3537C130.552 93.9536 131.514 89.1306 131.645 83.9945C132.87 84.4266 134.075 84.8885 135.258 85.3804C137.42 86.2794 139.507 87.2845 141.537 88.9883ZM101.232 106.713C99.7778 109.029 97.9943 111.128 95.9359 112.961C90.8788 117.463 84.0659 120.295 77.0193 120.295C74.5043 120.295 71.5743 119.686 69.3686 118.388C66.8306 116.894 64.1532 113.798 64.1532 106.662C64.1532 100.51 68.3748 94.2583 75.5881 94.2583C84.6447 94.2583 93.378 97.6297 101.232 106.713Z" />
  </svg>
);

// Line Icon
const LineIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  surname: string;
  japaneseSurname: string;
  japaneseGivenName: string;
  punName: string;
  url?: string;
}

/**
 * ShareModal - 分享模態窗元件
 *
 * 使用 React.memo 優化，避免父元件重新渲染時不必要的更新
 * [Context7: react.dev/reference/react/memo - 2025-12-06]
 */
export const ShareModal = memo(function ShareModal({
  isOpen,
  onClose,
  surname,
  japaneseSurname,
  japaneseGivenName,
  punName,
  url,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Pre-generate random copy using useState initializer to avoid impure function calls during render
  const [randomCopy] = useState(() => {
    const index = Math.floor(Math.random() * TAIWAN_SHARE_COPIES.length);
    return TAIWAN_SHARE_COPIES[index] ?? '';
  });

  // SSR-safe URL: use passed url or get from window only on client
  const shareUrl =
    url ??
    (typeof window !== 'undefined' ? window.location.href : 'https://app.haotool.org/nihonname/');

  if (!isOpen) return null;

  const fullName = `${japaneseSurname}${japaneseGivenName}`;

  const getShareText = (platform: 'threads' | 'general') => {
    const text = randomCopy
      .replace('{fullName}', fullName)
      .replace('{punName}', punName)
      .replace('{fullName}', fullName)
      .replace('{punName}', punName);

    if (platform === 'threads') {
      return `${text}\n\n快來測你的日本姓氏 👉`;
    }
    return `${text}\n\n快來查詢你的日本姓氏 👉`;
  };

  /**
   * Threads 分享最佳實踐：
   * 1. 使用 Web Intent URL: https://www.threads.net/intent/post?text=...
   * 2. 在文案中附帶指定的 Threads 貼文連結
   * 3. 使用 window.open 開啟新視窗
   */
  const handleShare = (platform: string) => {
    let platformUrl = '';

    switch (platform) {
      case 'threads': {
        // Threads Web Intent - 附帶指定的 Threads 貼文連結
        const threadsText = `${getShareText('threads')}\n${THREADS_POST_URL}`;
        platformUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(threadsText)}`;
        break;
      }
      case 'twitter': {
        const twitterText = getShareText('general');
        platformUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      }
      case 'facebook': {
        platformUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(getShareText('general'))}`;
        break;
      }
      case 'line': {
        const lineText = `${getShareText('general')}\n${shareUrl}`;
        platformUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(lineText)}`;
        break;
      }
    }

    if (platformUrl && typeof window !== 'undefined') {
      // 最佳實踐：使用 noopener,noreferrer 增加安全性
      window.open(platformUrl, '_blank', 'width=600,height=500,noopener,noreferrer');
    }
  };

  const handleCopy = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const copyText = `${getShareText('general')}\n${shareUrl}`;
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-[#fcfaf7] w-full max-w-sm rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500 md:zoom-in-95 border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 日系風格 */}
        <div className="relative bg-gradient-to-br from-red-900 to-red-950 p-6 text-center">
          <button
            onClick={onClose}
            aria-label="close"
            className="absolute top-4 right-4 p-2 text-red-200 hover:text-white transition-colors rounded-full hover:bg-red-800/50"
          >
            <X size={20} />
          </button>

          {/* 日式裝飾 */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="seigaiha-share" width="20" height="10" patternUnits="userSpaceOnUse">
                <path
                  d="M0,5 A5,5 0 0,1 10,5 A5,5 0 0,1 20,5"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
              <rect width="100%" height="100%" fill="url(#seigaiha-share)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-red-800/50 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl shadow-inner border border-red-700/30">
              ⛩️
            </div>
            <h3 className="text-xl font-bold text-white font-jp">分享你的日本姓氏</h3>
            <p className="text-sm text-red-200 mt-1">讓朋友也來測測看吧！</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]">
          {/* Highlighted Result */}
          <div className="bg-white rounded-xl p-4 text-center border border-stone-200 shadow-sm">
            <p className="text-xs text-stone-400 mb-2">你的日治時期姓名</p>
            <p className="text-2xl font-bold text-red-900 font-jp tracking-wider">
              {japaneseSurname}
              <span className="text-stone-700">{japaneseGivenName}</span>
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-bold rounded">
                Kuso
              </span>
              <span className="text-sm text-stone-600 font-jp">{punName}</span>
            </div>
            {surname && <p className="text-xs text-stone-400 mt-2">原姓氏：{surname}</p>}
          </div>

          {/* Primary Action: Threads */}
          <button
            onClick={() => handleShare('threads')}
            className="w-full bg-black hover:bg-stone-800 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <ThreadsIcon className="w-6 h-6 relative z-10" />
            <span className="relative z-10">分享到 Threads</span>
            <span className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-stone-400">
              推薦 ✨
            </span>
          </button>

          {/* Secondary Actions Grid */}
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => handleShare('line')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-green-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-[#06C755] text-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <LineIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-stone-500">Line</span>
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Twitter size={20} />
              </div>
              <span className="text-[10px] text-stone-500">X</span>
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-[#1877F2] text-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Facebook size={20} />
              </div>
              <span className="text-[10px] text-stone-500">FB</span>
            </button>
            <button
              onClick={() => void handleCopy()}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-stone-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-stone-200 text-stone-600 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
              </div>
              <span className="text-[10px] text-stone-500">{copied ? '已複製' : '複製'}</span>
            </button>
          </div>

          {/* Preview Text */}
          <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-500 border border-stone-200">
            <p className="font-bold text-stone-600 mb-1">分享預覽：</p>
            <p className="line-clamp-3">
              {randomCopy.replace('{fullName}', fullName).replace('{punName}', punName)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
