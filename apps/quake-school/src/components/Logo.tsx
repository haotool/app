import React from 'react';
import { motion } from 'motion/react';

interface Props {
  className?: string;
  animate?: boolean;
}

const Logo: React.FC<Props> = ({ className = 'w-14 h-14', animate = true }) => {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
        </defs>

        {/* 外部守護容器 (軟圓角盾牌) */}
        <motion.path
          d="M50 5 C25 5 5 25 5 50 C5 75 25 95 50 95 C75 95 95 75 95 50 C95 25 75 5 50 5Z"
          className="fill-white stroke-sky-50"
          strokeWidth="2"
          initial={animate ? { scale: 0.8, opacity: 0 } : {}}
          animate={animate ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.8, type: 'spring' }}
        />

        {/* 背景裝飾：波紋擴散 */}
        {animate && (
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-sky-100"
            strokeWidth="1"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.2], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeOut' }}
          />
        )}

        {/* 主體：地震知識波 (Seismic Knowledge Wave) */}
        <g className="text-sky-500">
          {/* 影子層 (增加立體感) */}
          <motion.path
            d="M20 65 L35 65 L42 45 L50 85 L62 25 L70 65 L85 65"
            stroke="#e0f2fe"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animate ? { pathLength: 0 } : {}}
            animate={animate ? { pathLength: 1 } : {}}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />

          {/* 主線路徑 */}
          <motion.path
            d="M20 65 L35 65 L42 45 L50 85 L62 25 L70 65 L85 65"
            stroke="url(#waveGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animate ? { pathLength: 0 } : {}}
            animate={animate ? { pathLength: 1 } : {}}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />

          {/* 掃描亮點 */}
          {animate && (
            <motion.path
              d="M20 65 L35 65 L42 45 L50 85 L62 25 L70 65 L85 65"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0.1, pathOffset: 0 }}
              animate={{ pathOffset: [0, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{ filter: 'url(#logoGlow)' }}
            />
          )}

          {/* 智慧星點 (Knowledge Star) */}
          <motion.circle
            cx="62"
            cy="25"
            r="6"
            className="fill-sky-500"
            initial={animate ? { scale: 0 } : {}}
            animate={animate ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}}
            transition={{
              scale: { repeat: Infinity, duration: 2 },
              opacity: { repeat: Infinity, duration: 2 },
              delay: 1.2,
            }}
            style={{ filter: 'url(#logoGlow)' }}
          />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
