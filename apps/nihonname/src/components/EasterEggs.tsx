import { type useEasterEggs } from '../hooks/useEasterEggs';
import { useMemo, memo } from 'react';

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
const fireworkParticles = generateParticles(20, [4, 8], [0.5, 1.5]);

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
 * 花火大會 - 手機搖晃觸發
 * 使用專案主色 red-900, red-600 和輔色 amber-500
 */
const Fireworks = () => {
  const particles = useMemo(() => fireworkParticles, []);
  // 使用專案色系
  const colors = ['#7f1d1d', '#dc2626', '#f59e0b', '#fbbf24', '#b91c1c', '#ef4444', '#fcd34d'];

  return (
    <div className="absolute inset-0">
      {[0, 1, 2, 3, 4].map((burst) => (
        <div
          key={burst}
          className="absolute animate-firework"
          style={{
            left: `${15 + burst * 18}%`,
            top: `${20 + (burst % 2) * 20}%`,
            animationDelay: `${burst * 0.8}s`,
          }}
        >
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-spark"
              style={{
                backgroundColor: colors[(burst + i) % colors.length],
                transform: `rotate(${i * 18}deg) translateY(-${30 + p.size * 5}px)`,
                animationDelay: `${burst * 0.8 + p.delay * 0.2}s`,
              }}
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes firework {
          0% { opacity: 0; transform: scale(0); }
          10% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(2); }
        }
        @keyframes spark {
          0% { opacity: 1; transform: rotate(var(--rotation)) translateY(0); }
          100% { opacity: 0; transform: rotate(var(--rotation)) translateY(-100px); }
        }
        .animate-firework { animation: firework 2s ease-out infinite; }
        .animate-spark { animation: spark 1.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

/**
 * 禪意水墨 - 靜止 45 秒觸發，任意互動立即消失
 * 使用專案輔色 stone-800
 */
const ZenInk = () => (
  <div className="absolute inset-0 bg-stone-100/95 flex items-center justify-center animate-in fade-in duration-2000 pointer-events-auto">
    <div className="relative">
      <svg width="300" height="300" viewBox="0 0 300 300" className="opacity-80">
        <defs>
          <filter id="ink-blur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        {/* 圓相 (Enso) - 使用 stone-800 */}
        <circle
          cx="150"
          cy="150"
          r="100"
          fill="none"
          stroke="#292524"
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray="550"
          strokeDashoffset="550"
          filter="url(#ink-blur)"
          className="animate-enso"
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-jp text-stone-800 opacity-60">
        禪
      </div>
      <p className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-xs text-stone-400 whitespace-nowrap">
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
