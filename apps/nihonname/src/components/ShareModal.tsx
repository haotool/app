import { X, Facebook, Copy, Check } from 'lucide-react';
import { useState, memo } from 'react';
import { ThreadsIcon, XIcon } from './icons';

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
                <XIcon className="w-5 h-5" />
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
