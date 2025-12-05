import { type useEasterEggs } from '../hooks/useEasterEggs';
import { useMemo, memo } from 'react';

/**
 * EasterEggs - 彩蛋效果渲染元件
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
      {/* 原有彩蛋 */}
      {activeEgg === 'sakura' && <SakuraStorm />}
      {activeEgg === 'sushi' && <SushiRain />}
      {activeEgg === 'night' && <NightModeOverlay />}
      {activeEgg === 'glow' && <GoldenGlow />}

      {/* 新增 10 種高級彩蛋 */}
      {activeEgg === 'koi' && <KoiPond />}
      {activeEgg === 'fireworks' && <Fireworks />}
      {activeEgg === 'zen' && <ZenInk />}
      {activeEgg === 'matsuri' && <MatsuriLanterns />}
      {activeEgg === 'origami' && <OrigamiCranes />}
      {activeEgg === 'samurai' && <SamuraiSlash />}
      {activeEgg === 'wave' && <GreatWave />}
      {activeEgg === 'dragon' && <DragonDance />}
      {activeEgg === 'ninja' && <NinjaSmoke />}
      {activeEgg === 'torii' && <ToriiGate />}

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
    top: Math.random() * 80 + 10, // 預生成 top 位置
    size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
    duration: Math.random() * (durationRange[1] - durationRange[0]) + durationRange[0],
    delay: Math.random() * 2,
  }));

const sakuraParticles = generateParticles(50, [10, 30], [2, 5]);
const sushiParticles = generateParticles(30, [20, 50], [1, 3]);
const sushis = ['🍣', '🍤', '🍱', '🍙', '🍵'];
const sushiEmojis = Array.from(
  { length: 30 },
  () => sushis[Math.floor(Math.random() * sushis.length)],
);

// 新增彩蛋的預生成數據 - 使用自定義 top 範圍
const generateParticlesWithTop = (
  count: number,
  sizeRange: [number, number],
  durationRange: [number, number],
  topRange: [number, number],
) =>
  Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    top: Math.random() * (topRange[1] - topRange[0]) + topRange[0],
    size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
    duration: Math.random() * (durationRange[1] - durationRange[0]) + durationRange[0],
    delay: Math.random() * 2,
  }));

const koiParticles = generateParticlesWithTop(8, [60, 100], [8, 12], [30, 70]);
const fireworkParticles = generateParticles(20, [4, 8], [0.5, 1.5]);
const lanternParticles = generateParticles(15, [30, 50], [4, 8]);
const craneParticles = generateParticlesWithTop(12, [25, 40], [6, 10], [20, 80]);

// ==================== 原有彩蛋組件 ====================

const SakuraStorm = () => {
  const particles = useMemo(() => sakuraParticles, []);

  return (
    <div className="absolute inset-0">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute text-pink-300 animate-fall"
          style={{
            left: `${p.left}%`,
            top: `-20px`,
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
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

const SushiRain = () => {
  const particles = useMemo(() => sushiParticles, []);
  const emojis = useMemo(() => sushiEmojis, []);

  return (
    <div className="absolute inset-0">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute animate-fall"
          style={{
            left: `${p.left}%`,
            top: `-40px`,
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {emojis[i]}
        </div>
      ))}
    </div>
  );
};

const NightModeOverlay = () => (
  <div className="absolute inset-0 bg-indigo-950/90 mix-blend-multiply animate-in fade-in duration-1000 pointer-events-none flex items-center justify-center">
    <div className="text-red-500 font-jp text-9xl opacity-20 font-bold tracking-widest writing-vertical-rl">
      百鬼夜行
    </div>
  </div>
);

const GoldenGlow = () => (
  <div className="absolute inset-0 bg-amber-500/20 mix-blend-overlay animate-pulse duration-300" />
);

// ==================== 新增 10 種高級彩蛋組件 ====================

// 1. 錦鯉游動
const KoiPond = () => {
  const particles = useMemo(() => koiParticles, []);

  return (
    <div className="absolute inset-0 bg-blue-900/20">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute animate-koi"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <svg width={p.size} height={p.size * 0.5} viewBox="0 0 100 50" className="drop-shadow-lg">
            <defs>
              <linearGradient id={`koi-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={i % 2 === 0 ? '#f97316' : '#ef4444'} />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor={i % 2 === 0 ? '#f97316' : '#ef4444'} />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="25" rx="45" ry="20" fill={`url(#koi-${i})`} />
            <path
              d="M95,25 Q110,15 95,5 Q100,25 95,45 Q110,35 95,25"
              fill={i % 2 === 0 ? '#f97316' : '#ef4444'}
            />
            <circle cx="20" cy="20" r="4" fill="#1a1a1a" />
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes koi {
          0% { transform: translateX(-100px) scaleX(1); }
          49% { transform: translateX(calc(100vw + 100px)) scaleX(1); }
          50% { transform: translateX(calc(100vw + 100px)) scaleX(-1); }
          99% { transform: translateX(-100px) scaleX(-1); }
          100% { transform: translateX(-100px) scaleX(1); }
        }
        .animate-koi { animation: koi ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// 2. 花火大會
const Fireworks = () => {
  const particles = useMemo(() => fireworkParticles, []);
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

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

// 3. 禪意水墨
const ZenInk = () => (
  <div className="absolute inset-0 bg-stone-100/95 flex items-center justify-center animate-in fade-in duration-2000">
    <div className="relative">
      <svg width="300" height="300" viewBox="0 0 300 300" className="opacity-80">
        <defs>
          <filter id="ink-blur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        {/* 圓相 (Enso) */}
        <circle
          cx="150"
          cy="150"
          r="100"
          fill="none"
          stroke="#1a1a1a"
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

// 4. 祭典燈籠
const MatsuriLanterns = () => {
  const particles = useMemo(() => lanternParticles, []);

  return (
    <div className="absolute inset-0">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute animate-lantern"
          style={{
            left: `${p.left}%`,
            top: `-60px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <svg width={p.size} height={p.size * 1.5} viewBox="0 0 40 60">
            <rect x="15" y="0" width="10" height="5" fill="#8B4513" />
            <ellipse cx="20" cy="35" rx="18" ry="25" fill={i % 2 === 0 ? '#dc2626' : '#f97316'} />
            <ellipse cx="20" cy="35" rx="14" ry="20" fill="#fef3c7" opacity="0.5" />
            <text x="20" y="40" textAnchor="middle" fill="#7c2d12" fontSize="12" fontFamily="serif">
              祭
            </text>
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes lantern {
          0% { transform: translateY(0) rotate(-5deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(calc(100vh + 100px)) rotate(5deg); opacity: 0; }
        }
        .animate-lantern { animation: lantern linear forwards; }
      `}</style>
    </div>
  );
};

// 5. 千紙鶴
const OrigamiCranes = () => {
  const particles = useMemo(() => craneParticles, []);

  return (
    <div className="absolute inset-0">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute animate-crane"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <svg width={p.size} height={p.size} viewBox="0 0 50 50" className="drop-shadow">
            <polygon
              points="25,5 45,25 25,45 5,25"
              fill={['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#bfdbfe', '#ddd6fe'][i % 6]}
              stroke="#9ca3af"
              strokeWidth="0.5"
            />
            <polygon points="25,5 35,15 25,25 15,15" fill="white" opacity="0.5" />
            <line x1="25" y1="25" x2="50" y2="35" stroke="#9ca3af" strokeWidth="1" />
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes crane {
          0% { transform: translateX(-50px) translateY(0) rotate(-10deg); }
          25% { transform: translateX(25vw) translateY(-20px) rotate(10deg); }
          50% { transform: translateX(50vw) translateY(0) rotate(-10deg); }
          75% { transform: translateX(75vw) translateY(-20px) rotate(10deg); }
          100% { transform: translateX(calc(100vw + 50px)) translateY(0) rotate(-10deg); }
        }
        .animate-crane { animation: crane ease-in-out forwards; }
      `}</style>
    </div>
  );
};

// 6. 武士斬擊
const SamuraiSlash = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative w-full h-full">
      {/* 斬擊線條 */}
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
          stroke="#dc2626"
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
      {/* 文字 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-6xl font-jp text-red-600 opacity-0 animate-kanji">斬</span>
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

// 7. 神奈川沖浪
const GreatWave = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute bottom-0 left-0 right-0 h-1/2 animate-wave-rise">
      <svg viewBox="0 0 1200 400" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0c1929" />
          </linearGradient>
        </defs>
        <path
          d="M0,200 Q150,100 300,200 T600,200 T900,200 T1200,200 L1200,400 L0,400 Z"
          fill="url(#wave-gradient)"
          className="animate-wave"
        />
        <path
          d="M0,250 Q150,150 300,250 T600,250 T900,250 T1200,250 L1200,400 L0,400 Z"
          fill="#2563eb"
          opacity="0.5"
          className="animate-wave-2"
        />
        {/* 浪花 */}
        <circle cx="200" cy="180" r="15" fill="white" className="animate-foam" />
        <circle cx="500" cy="190" r="12" fill="white" className="animate-foam-2" />
        <circle cx="800" cy="175" r="18" fill="white" className="animate-foam" />
      </svg>
    </div>
    <style>{`
      @keyframes wave-rise {
        0% { transform: translateY(100%); }
        100% { transform: translateY(0); }
      }
      @keyframes wave {
        0% { d: path("M0,200 Q150,100 300,200 T600,200 T900,200 T1200,200 L1200,400 L0,400 Z"); }
        50% { d: path("M0,200 Q150,250 300,200 T600,200 T900,200 T1200,200 L1200,400 L0,400 Z"); }
        100% { d: path("M0,200 Q150,100 300,200 T600,200 T900,200 T1200,200 L1200,400 L0,400 Z"); }
      }
      @keyframes foam {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.5); }
      }
      .animate-wave-rise { animation: wave-rise 1s ease-out forwards; }
      .animate-wave { animation: wave 2s ease-in-out infinite; }
      .animate-wave-2 { animation: wave 2s ease-in-out 0.5s infinite; }
      .animate-foam { animation: foam 1s ease-in-out infinite; }
      .animate-foam-2 { animation: foam 1s ease-in-out 0.3s infinite; }
    `}</style>
  </div>
);

// 8. 龍舞
const DragonDance = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative animate-dragon-move">
      <svg width="400" height="200" viewBox="0 0 400 200" className="drop-shadow-2xl">
        {/* 龍身 */}
        <path
          d="M50,100 Q100,50 150,100 Q200,150 250,100 Q300,50 350,100"
          fill="none"
          stroke="#dc2626"
          strokeWidth="30"
          strokeLinecap="round"
          className="animate-dragon-body"
        />
        {/* 龍頭 */}
        <circle cx="350" cy="100" r="35" fill="#dc2626" />
        <circle cx="360" cy="90" r="8" fill="#fef3c7" />
        <circle cx="363" cy="90" r="4" fill="#1a1a1a" />
        {/* 龍鬚 */}
        <path d="M380,85 Q400,70 390,60" fill="none" stroke="#f97316" strokeWidth="3" />
        <path d="M380,95 Q400,80 395,70" fill="none" stroke="#f97316" strokeWidth="3" />
        {/* 龍珠 */}
        <circle cx="30" cy="100" r="15" fill="#fbbf24" className="animate-pearl" />
      </svg>
    </div>
    <style>{`
      @keyframes dragon-move {
        0% { transform: translateX(-100%) rotate(-5deg); }
        50% { transform: translateX(0) rotate(5deg); }
        100% { transform: translateX(100%) rotate(-5deg); }
      }
      @keyframes dragon-body {
        0%, 100% { stroke-dasharray: 0 1000; }
        50% { stroke-dasharray: 500 500; }
      }
      @keyframes pearl {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px #fbbf24); }
        50% { transform: scale(1.2); filter: drop-shadow(0 0 20px #fbbf24); }
      }
      .animate-dragon-move { animation: dragon-move 4s ease-in-out forwards; }
      .animate-dragon-body { animation: dragon-body 2s ease-in-out infinite; }
      .animate-pearl { animation: pearl 1s ease-in-out infinite; }
    `}</style>
  </div>
);

// 9. 忍者煙霧
const ninjaPositions = Array.from({ length: 8 }, (_, i) => ({
  left: -64 + Math.cos((i * Math.PI) / 4) * 100,
  top: -64 + Math.sin((i * Math.PI) / 4) * 100,
  delay: i * 0.1,
}));

const NinjaSmoke = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative">
      {/* 煙霧效果 */}
      {ninjaPositions.map((pos, i) => (
        <div
          key={i}
          className="absolute w-32 h-32 rounded-full bg-stone-600 animate-smoke"
          style={{
            left: `${pos.left}px`,
            top: `${pos.top}px`,
            animationDelay: `${pos.delay}s`,
          }}
        />
      ))}
      {/* 忍者剪影 */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 animate-ninja-appear">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="30" r="20" fill="#1a1a1a" />
          <rect x="35" y="45" width="30" height="40" fill="#1a1a1a" />
          <rect x="20" y="50" width="60" height="5" fill="#1a1a1a" />
        </svg>
      </div>
    </div>
    <style>{`
      @keyframes smoke {
        0% { opacity: 0; transform: scale(0); }
        50% { opacity: 0.8; }
        100% { opacity: 0; transform: scale(3); }
      }
      @keyframes ninja-appear {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -150%) scale(0.5); }
      }
      .animate-smoke { animation: smoke 1s ease-out forwards; }
      .animate-ninja-appear { animation: ninja-appear 1.5s ease-out forwards; }
    `}</style>
  </div>
);

// 10. 鳥居之門
const ToriiGate = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-amber-50/50">
    <div className="relative animate-torii-reveal">
      <svg width="300" height="350" viewBox="0 0 300 350" className="drop-shadow-2xl">
        {/* 主橫樑 */}
        <rect x="20" y="30" width="260" height="25" fill="#dc2626" rx="3" />
        <rect x="10" y="25" width="280" height="15" fill="#dc2626" rx="2" />
        {/* 次橫樑 */}
        <rect x="50" y="80" width="200" height="15" fill="#dc2626" />
        {/* 左柱 */}
        <rect x="50" y="55" width="25" height="295" fill="#dc2626" />
        {/* 右柱 */}
        <rect x="225" y="55" width="25" height="295" fill="#dc2626" />
        {/* 裝飾 */}
        <circle cx="62.5" cy="100" r="8" fill="#fbbf24" />
        <circle cx="237.5" cy="100" r="8" fill="#fbbf24" />
      </svg>
      {/* 光芒效果 */}
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
