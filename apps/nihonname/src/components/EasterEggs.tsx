import { type useEasterEggs } from '../hooks/useEasterEggs';
import { useMemo, memo, useEffect, useRef } from 'react';

/**
 * EasterEggs - 彩蛋效果渲染元件
 *
 * [fix:2025-12-06] 重構彩蛋設計：
 * - 移除所有電腦版彩蛋
 * - 使用專案主色 (red-900, red-600) 和輔色 (stone-800, amber-500)
 * - 優化手機體驗
 *
 * 使用 React.memo 優化，僅在 activeEgg 變更時重新渲染
 * [Context7: react.dev/reference/react/memo - 2025-12-06]
 */
export const EasterEggs = memo(function EasterEggs({
  activeEgg,
}: {
  activeEgg: ReturnType<typeof useEasterEggs>['activeEgg'];
}) {
  if (!activeEgg) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[200] overflow-hidden ${activeEgg === 'rumble' ? 'animate-shake' : ''}`}
    >
      {/* 手機版彩蛋 */}
      {activeEgg === 'sakura' && <SakuraStorm />}
      {activeEgg === 'fireworks' && <Fireworks />}
      {activeEgg === 'zen' && <ZenInk />}
      {activeEgg === 'samurai' && <SamuraiSlash />}
      {activeEgg === 'torii' && <ToriiGate />}
      {activeEgg === 'glow' && <GoldenGlow />}

      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .animate-shake {
          animation: shake 0.5s;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
});

// Pre-generate random values to avoid calling Math.random() during render
const generateParticles = (
  count: number,
  sizeRange: [number, number],
  durationRange: [number, number],
) =>
  Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 80 + 10,
    size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
    duration: Math.random() * (durationRange[1] - durationRange[0]) + durationRange[0],
    delay: Math.random() * 2,
  }));

const sakuraParticles = generateParticles(50, [10, 30], [2, 5]);

// ==================== 彩蛋組件 ====================

/**
 * 櫻花雨 - Logo 5 次點擊觸發
 * 使用專案主色 red-900, red-600
 */
const SakuraStorm = () => {
  const particles = useMemo(() => sakuraParticles, []);

  return (
    <div className="absolute inset-0">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute animate-fall"
          style={{
            left: `${p.left}%`,
            top: `-20px`,
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            // 使用專案主色系
            color: i % 3 === 0 ? '#dc2626' : i % 3 === 1 ? '#fca5a5' : '#fecdd3',
          }}
        >
          🌸
        </div>
      ))}
      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(360deg); }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </div>
  );
};

/**
 * 花火大會 - 使用 tsParticles Fireworks 全屏煙火 + 簡易音效
 * 持續 12 秒，使用主題紅/琥珀/玫瑰色彩
 *
 * [fix:2025-12-07] 根據 Context7 tsParticles 官方文檔修復
 * - 移除自定義 canvas ref，讓 tsparticles 自動管理
 * - 使用官方推薦的 async fireworks() 模式
 * - 簡化 confetti API 調用
 * [context7:/tsparticles/tsparticles:fireworks:2025-12-07]
 */
const Fireworks = () => {
  const cleanupRef = useRef<{
    stopParticles?: () => void;
    stopSound?: () => void;
    stopConfetti?: () => void;
  }>({});

  useEffect(() => {
    const primaryPalette: string[] = [
      '#7f1d1d',
      '#dc2626',
      '#fb923c',
      '#fbbf24',
      '#fecdd3',
      '#ffffff',
    ];
    const neonPalette: string[] = ['#c026d3', '#22d3ee', '#e11d48', '#f59e0b', '#84cc16'];

    // 1. 啟動 tsParticles Fireworks (官方推薦 async 模式)
    void (async () => {
      try {
        const { fireworks } = await import('@tsparticles/fireworks');
        // [context7:/tsparticles/tsparticles:fireworks] 使用官方推薦的簡化調用
        const instance = await fireworks({
          colors: primaryPalette,
        });
        if (instance) {
          cleanupRef.current.stopParticles = () => {
            instance.stop();
          };
        }
      } catch {
        // 忽略煙火載入失敗的錯誤，不影響主功能
      }
    })();

    // 2. 簡易音效：每 900ms 觸發一次短促爆裂聲
    if (typeof window !== 'undefined') {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const playBang = () => {
            try {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(220 + Math.random() * 420, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
              osc.connect(gain).connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.3);
            } catch {
              // 忽略音效播放錯誤
            }
          };
          playBang();
          const interval = setInterval(playBang, 900);
          const timer = setTimeout(() => {
            clearInterval(interval);
            audioCtx.close().catch(() => undefined);
          }, 12000);
          cleanupRef.current.stopSound = () => {
            clearInterval(interval);
            clearTimeout(timer);
            audioCtx.close().catch(() => undefined);
          };
        }
      } catch {
        // 忽略 AudioContext 初始化錯誤
      }
    }

    // 3. Confetti 疊加效果
    void (async () => {
      try {
        const { confetti } = await import('@tsparticles/confetti');
        let isRunning = true;

        const burst = async (palette: string[]) => {
          if (!isRunning) return;
          const originX = Math.random();
          const originY = 0.5 + Math.random() * 0.3;
          // [context7:/tsparticles/tsparticles:confetti] 使用官方推薦的參數格式
          await confetti({
            angle: 45 + Math.random() * 90,
            count: 80 + Math.floor(Math.random() * 40),
            spread: 55 + Math.random() * 25,
            startVelocity: 35 + Math.random() * 20,
            gravity: 0.9,
            drift: Math.random() * 0.5,
            ticks: 200 + Math.random() * 80,
            colors: palette,
            shapes: ['circle', 'square', 'star'],
            scalar: 0.9 + Math.random() * 0.3,
            position: { x: originX * 100, y: originY * 100 },
            zIndex: 90,
          });
        };

        const timer = setInterval(() => {
          void burst(primaryPalette);
          void burst(neonPalette);
        }, 700);

        cleanupRef.current.stopConfetti = () => {
          isRunning = false;
          clearInterval(timer);
        };
      } catch {
        // confetti 載入失敗忽略
      }
    })();

    return () => {
      cleanupRef.current.stopParticles?.();
      cleanupRef.current.stopSound?.();
      cleanupRef.current.stopConfetti?.();
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-stone-900/60 to-black/80" />
      {/* tsParticles 會自動創建並管理 canvas */}
    </div>
  );
};

/**
 * 禪意水墨 - 靜止 45 秒觸發，任意互動立即消失
 * 使用專案輔色 stone-800
 */
const ZenInk = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-red-950/95 via-red-900/90 to-stone-900/80 flex items-center justify-center animate-in fade-in duration-2000 pointer-events-auto">
    <div className="relative">
      <svg width="300" height="300" viewBox="0 0 300 300" className="opacity-90 drop-shadow-2xl">
        <defs>
          <filter id="ink-blur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        {/* 圓相 (Enso) - 使用主題紅 */}
        <circle
          cx="150"
          cy="150"
          r="100"
          fill="none"
          stroke="#fecdd3"
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray="550"
          strokeDashoffset="550"
          filter="url(#ink-blur)"
          className="animate-enso"
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-jp text-red-100 opacity-80">
        禪
      </div>
      <p className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-xs text-red-100/80 whitespace-nowrap">
        點擊任意處繼續
      </p>
    </div>
    <style>{`
      @keyframes enso {
        0% { stroke-dashoffset: 550; }
        100% { stroke-dashoffset: 50; }
      }
      .animate-enso { animation: enso 3s ease-out forwards; }
    `}</style>
  </div>
);

/**
 * 武士斬擊 - 快速連點 7 次觸發
 * 使用專案主色 red-900, red-600
 */
const SamuraiSlash = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative w-full h-full">
      {/* 斬擊線條 - 使用 red-900 */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="100"
          x2="100"
          y2="0"
          stroke="#7f1d1d"
          strokeWidth="0.5"
          strokeLinecap="round"
          className="animate-slash"
        />
        <line
          x1="0"
          y1="60"
          x2="100"
          y2="40"
          stroke="#dc2626"
          strokeWidth="0.3"
          strokeLinecap="round"
          className="animate-slash-2"
        />
      </svg>
      {/* 閃光效果 */}
      <div className="absolute inset-0 bg-white animate-flash" />
      {/* 文字 - 使用 red-900 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-6xl font-jp text-red-900 opacity-0 animate-kanji">斬</span>
      </div>
    </div>
    <style>{`
      @keyframes slash {
        0% { stroke-dasharray: 200; stroke-dashoffset: 200; opacity: 0; }
        10% { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 0; }
      }
      @keyframes slash-2 {
        0% { stroke-dasharray: 200; stroke-dashoffset: 200; opacity: 0; }
        20% { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 0; }
      }
      @keyframes flash {
        0% { opacity: 0; }
        5% { opacity: 0.8; }
        100% { opacity: 0; }
      }
      @keyframes kanji {
        0% { opacity: 0; transform: scale(3); }
        30% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.8); }
      }
      .animate-slash { animation: slash 0.8s ease-out forwards; }
      .animate-slash-2 { animation: slash-2 0.8s ease-out 0.1s forwards; }
      .animate-flash { animation: flash 0.3s ease-out forwards; }
      .animate-kanji { animation: kanji 1.5s ease-out 0.3s forwards; }
    `}</style>
  </div>
);

/**
 * 鳥居之門 - 印章 3 次點擊觸發
 * 使用專案主色 red-900 和輔色 amber-500
 */
const ToriiGate = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-amber-50/50">
    <div className="relative animate-torii-reveal">
      <svg width="300" height="350" viewBox="0 0 300 350" className="drop-shadow-2xl">
        {/* 主橫樑 - 使用 red-900 */}
        <rect x="20" y="30" width="260" height="25" fill="#7f1d1d" rx="3" />
        <rect x="10" y="25" width="280" height="15" fill="#7f1d1d" rx="2" />
        {/* 次橫樑 */}
        <rect x="50" y="80" width="200" height="15" fill="#7f1d1d" />
        {/* 左柱 */}
        <rect x="50" y="55" width="25" height="295" fill="#7f1d1d" />
        {/* 右柱 */}
        <rect x="225" y="55" width="25" height="295" fill="#7f1d1d" />
        {/* 裝飾 - 使用 amber-500 */}
        <circle cx="62.5" cy="100" r="8" fill="#f59e0b" />
        <circle cx="237.5" cy="100" r="8" fill="#f59e0b" />
      </svg>
      {/* 光芒效果 - 使用 amber-500 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 bg-amber-400/50 rounded-full animate-torii-glow blur-xl" />
      </div>
    </div>
    <style>{`
      @keyframes torii-reveal {
        0% { opacity: 0; transform: scale(0.5) translateY(50px); }
        50% { opacity: 1; transform: scale(1.1) translateY(-10px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes torii-glow {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.5); }
      }
      .animate-torii-reveal { animation: torii-reveal 2s ease-out forwards; }
      .animate-torii-glow { animation: torii-glow 2s ease-in-out infinite; }
    `}</style>
  </div>
);

/**
 * 金光效果 - 標題雙擊觸發
 * 使用專案輔色 amber-500
 */
const GoldenGlow = () => (
  <div className="absolute inset-0 bg-amber-500/20 mix-blend-overlay animate-pulse duration-300" />
);
