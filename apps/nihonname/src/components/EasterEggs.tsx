import { type useEasterEggs } from '../hooks/useEasterEggs';
import { useMemo, memo, useEffect } from 'react';

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
      {activeEgg === 'confetti' && <ConfettiCelebration />}

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
 * 花火大會 - 精緻全屏煙火效果
 * 持續 12 秒，使用主題紅/琥珀/玫瑰色彩，佔滿全屏絢爛綻放
 *
 * [fix:2025-12-07] 優化為更精緻的全屏煙火庫
 * - 多層次煙火從畫面各處發射
 * - 增加煙火密度和粒子數量
 * - 更絢爛的色彩組合和尾跡效果
 * [context7:/tsparticles/tsparticles:fireworks:2025-12-07]
 */
const Fireworks = () => {
  useEffect(() => {
    let isMounted = true;

    // 絢爛色彩組合 - 日本花火大會風格
    const hanabiFestivalPalette: string[] = [
      '#ff1744', // 鮮紅
      '#ff4081', // 桃紅
      '#f50057', // 洋紅
      '#d500f9', // 紫
      '#651fff', // 深紫
      '#00e5ff', // 青
      '#1de9b6', // 翠綠
      '#76ff03', // 螢光綠
      '#ffea00', // 金黃
      '#ff9100', // 橙
      '#ffffff', // 白
      '#ffd54f', // 淺金
    ];
    const traditionalPalette: string[] = [
      '#7f1d1d', // 深紅
      '#dc2626', // 紅
      '#fb923c', // 橙
      '#fbbf24', // 琥珀
      '#fecdd3', // 粉
      '#c026d3', // 洋紫
      '#22d3ee', // 青
    ];

    let particlesInstance: { stop: () => void } | null | undefined = null;
    let audioInterval: ReturnType<typeof setInterval> | null = null;
    let audioTimeout: ReturnType<typeof setTimeout> | null = null;
    let audioCtx: AudioContext | null = null;
    let confettiIntervals: ReturnType<typeof setInterval>[] = [];

    // 1. 啟動 tsParticles Fireworks - 全屏高密度煙火
    void (async () => {
      if (!isMounted) return;
      try {
        const { fireworks } = await import('@tsparticles/fireworks');
        if (!isMounted) return;

        // 使用完整色彩組合創建壯觀的煙火效果
        const instance = await fireworks({
          colors: [...hanabiFestivalPalette, ...traditionalPalette],
        });

        if (!isMounted) {
          instance?.stop();
          return;
        }

        particlesInstance = instance;
      } catch {
        // 忽略煙火載入失敗的錯誤
      }
    })();

    // 2. 豐富的音效：模擬真實花火大會音效
    if (typeof window !== 'undefined') {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          const playBang = () => {
            if (!isMounted || !audioCtx) return;
            // 保存到局部變數以避免 closure 中的類型問題
            const ctx = audioCtx;
            try {
              // 創建多層次爆破音效
              const frequencies = [180, 320, 480, 640];
              frequencies.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = i % 2 === 0 ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(freq + Math.random() * 100, ctx.currentTime);
                gain.gain.setValueAtTime(0.04 / (i + 1), ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
                osc.connect(gain).connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.02);
                osc.stop(ctx.currentTime + 0.35);
              });
            } catch {
              // 忽略音效播放錯誤
            }
          };

          playBang();
          audioInterval = setInterval(playBang, 600 + Math.random() * 400);
          audioTimeout = setTimeout(() => {
            if (audioInterval) clearInterval(audioInterval);
            audioCtx?.close().catch(() => undefined);
          }, 12000);
        }
      } catch {
        // 忽略 AudioContext 初始化錯誤
      }
    }

    // 3. 多層次 Confetti 疊加 - 從畫面各處發射
    void (async () => {
      if (!isMounted) return;
      try {
        const { confetti } = await import('@tsparticles/confetti');
        if (!isMounted) return;

        // 隨機位置大型爆發
        const burstFromPosition = async (x: number, y: number, palette: string[]) => {
          if (!isMounted) return;
          await confetti({
            angle: 60 + Math.random() * 60,
            count: 100 + Math.floor(Math.random() * 60),
            spread: 70 + Math.random() * 40,
            startVelocity: 45 + Math.random() * 25,
            gravity: 0.8,
            drift: (Math.random() - 0.5) * 0.8,
            ticks: 250 + Math.random() * 100,
            colors: palette,
            shapes: ['circle', 'star'],
            scalar: 1.0 + Math.random() * 0.4,
            position: { x: x * 100, y: y * 100 },
            zIndex: 90,
          });
        };

        // 從底部向上發射的煙火軌跡
        const launchFirework = async () => {
          if (!isMounted) return;
          const x = 0.1 + Math.random() * 0.8; // 橫向隨機位置
          const launchY = 0.9; // 從底部發射
          const burstY = 0.2 + Math.random() * 0.3; // 在上方爆炸

          // 先發射軌跡
          await confetti({
            count: 3,
            angle: 90,
            spread: 5,
            startVelocity: 60,
            gravity: 1.5,
            colors: ['#ffea00', '#ff9100'],
            shapes: ['circle'],
            scalar: 0.6,
            position: { x: x * 100, y: launchY * 100 },
            zIndex: 85,
          });

          // 延遲後爆炸
          setTimeout(() => {
            if (!isMounted) return;
            const palette = Math.random() > 0.5 ? hanabiFestivalPalette : traditionalPalette;
            void burstFromPosition(x, burstY, palette.slice(0, 6));
          }, 300);
        };

        // 密集發射間隔
        const interval1 = setInterval(() => {
          void launchFirework();
        }, 500);

        const interval2 = setInterval(() => {
          // 隨機位置大爆發
          const x = 0.15 + Math.random() * 0.7;
          const y = 0.25 + Math.random() * 0.35;
          void burstFromPosition(x, y, hanabiFestivalPalette);
        }, 800);

        const interval3 = setInterval(() => {
          // 螢幕邊緣煙火
          const side = Math.random() > 0.5;
          const x = side ? 0.1 + Math.random() * 0.15 : 0.75 + Math.random() * 0.15;
          const y = 0.3 + Math.random() * 0.3;
          void burstFromPosition(x, y, traditionalPalette);
        }, 1100);

        confettiIntervals = [interval1, interval2, interval3];
      } catch {
        // confetti 載入失敗忽略
      }
    })();

    return () => {
      isMounted = false;

      if (particlesInstance) {
        try {
          particlesInstance.stop();
        } catch {
          // 忽略清理錯誤
        }
      }

      if (audioInterval) clearInterval(audioInterval);
      if (audioTimeout) clearTimeout(audioTimeout);
      if (audioCtx) {
        audioCtx.close().catch(() => undefined);
      }

      confettiIntervals.forEach((interval) => clearInterval(interval));
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* 深色漸層背景突顯煙火效果 */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/85 via-stone-900/80 to-black/90" />
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

/**
 * 彩帶慶祝效果 - 高分諧音梗觸發 (8分以上)
 * 持續 3 秒，背景不變暗，純粹的彩帶慶祝
 * [fix:2025-12-07] 新增高分諧音梗獎勵效果
 */
const ConfettiCelebration = () => {
  useEffect(() => {
    let isMounted = true;
    let confettiIntervals: ReturnType<typeof setInterval>[] = [];

    // 慶祝色彩組合 - 金、紅、粉色系
    const celebrationPalette: string[] = [
      '#fbbf24', // 金黃
      '#f59e0b', // 琥珀
      '#ef4444', // 紅
      '#f472b6', // 粉紅
      '#a855f7', // 紫
      '#22d3ee', // 青
      '#ffffff', // 白
      '#fcd34d', // 淺金
    ];

    void (async () => {
      if (!isMounted) return;
      try {
        const { confetti } = await import('@tsparticles/confetti');
        if (!isMounted) return;

        // 從左右兩側同時發射彩帶
        const burstFromSide = async (isLeft: boolean) => {
          if (!isMounted) return;
          await confetti({
            angle: isLeft ? 60 : 120,
            count: 60 + Math.floor(Math.random() * 30),
            spread: 55 + Math.random() * 25,
            startVelocity: 40 + Math.random() * 15,
            gravity: 0.9,
            drift: isLeft ? 0.3 : -0.3,
            ticks: 200,
            colors: celebrationPalette,
            shapes: ['circle', 'square', 'star'],
            scalar: 0.9 + Math.random() * 0.3,
            position: { x: isLeft ? 10 : 90, y: 60 },
            zIndex: 250,
          });
        };

        // 中央向上爆發
        const burstFromCenter = async () => {
          if (!isMounted) return;
          await confetti({
            angle: 90,
            count: 80 + Math.floor(Math.random() * 40),
            spread: 100 + Math.random() * 30,
            startVelocity: 50 + Math.random() * 20,
            gravity: 0.85,
            ticks: 220,
            colors: celebrationPalette,
            shapes: ['circle', 'star'],
            scalar: 1.0 + Math.random() * 0.3,
            position: { x: 50, y: 70 },
            zIndex: 250,
          });
        };

        // 立即發射初始彩帶
        await Promise.all([burstFromSide(true), burstFromSide(false), burstFromCenter()]);

        // 持續發射 3 秒
        const interval1 = setInterval(() => {
          void burstFromSide(true);
          void burstFromSide(false);
        }, 400);

        const interval2 = setInterval(() => {
          void burstFromCenter();
        }, 600);

        confettiIntervals = [interval1, interval2];

        // 3 秒後停止
        setTimeout(() => {
          confettiIntervals.forEach((interval) => clearInterval(interval));
        }, 3000);
      } catch {
        // confetti 載入失敗忽略
      }
    })();

    return () => {
      isMounted = false;
      confettiIntervals.forEach((interval) => clearInterval(interval));
    };
  }, []);

  // 背景不變暗，只有彩帶效果
  return <div className="absolute inset-0 pointer-events-none" aria-hidden="true" />;
};
