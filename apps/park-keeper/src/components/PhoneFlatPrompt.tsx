import { motion } from 'motion/react';

interface PhoneFlatPromptProps {
  color?: string;
  className?: string;
}

/**
 * PhoneFlatPrompt - 專業 SVG 手機平放動畫元件 v1.0.12
 *
 * 特點 (基於 2026 最佳實踐)：
 * - 垂直手機正面視圖 (200x280 viewBox)
 * - 紅色 (#FF3333) → 綠色 (#00FF41) 顏色轉換
 * - rotateX 動畫 (0° → 85° → 0°)
 * - GPU 加速屬性 (transform, opacity)
 * - 5-20 個優化 SVG 元素
 * - 60fps 流暢動畫
 */
export default function PhoneFlatPrompt({
  color = '#3b82f6',
  className = '',
}: PhoneFlatPromptProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 280"
        className="w-48 h-64"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="手機平放提示動畫"
      >
        {/* 定義漸層 - 紅色與綠色 */}
        <defs>
          <linearGradient id="red-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF3333">
              <animate
                attributeName="stop-opacity"
                values="1;1;0;0;1"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#CC0000">
              <animate
                attributeName="stop-opacity"
                values="1;1;0;0;1"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>

          <linearGradient id="green-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00FF41">
              <animate
                attributeName="stop-opacity"
                values="0;0;1;1;0"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#00CC33">
              <animate
                attributeName="stop-opacity"
                values="0;0;1;1;0"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>

          {/* 濾鏡效果 */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 背景顏色轉換層 */}
        <rect
          x="0"
          y="0"
          width="200"
          height="280"
          fill="url(#red-gradient)"
          opacity="0.1"
          data-testid="color-transition"
        />
        <rect x="0" y="0" width="200" height="280" fill="url(#green-gradient)" opacity="0.1" />

        {/* 旋轉動畫組 */}
        <motion.g
          data-testid="rotation-group"
          animate={{
            rotateX: [0, 0, 85, 85, 0],
            scale: [1, 1, 0.95, 0.95, 1],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
            times: [0, 0.25, 0.5, 0.75, 1],
          }}
          style={{
            transformOrigin: '100px 140px',
            transformStyle: 'preserve-3d',
          }}
          data-animation-type="transform"
        >
          {/* 手機裝置 */}
          <g data-testid="phone-device">
            {/* 手機外框 (銀色) */}
            <rect
              x="60"
              y="60"
              width="80"
              height="160"
              rx="8"
              fill="#C0C0C0"
              stroke="#999"
              strokeWidth="1"
            />

            {/* 手機螢幕 (黑色背景) */}
            <rect
              x="70"
              y="80"
              width="60"
              height="120"
              rx="4"
              fill="#1a1a1a"
              data-testid="phone-screen"
            />

            {/* 頂部聽筒 */}
            <rect x="90" y="70" width="20" height="2" rx="1" fill="#666" />

            {/* 底部 Home 鍵 */}
            <circle cx="100" cy="210" r="5" fill="#999" opacity="0.5" />

            {/* 螢幕內容組 */}
            <g clipPath="url(#screen-clip)">
              {/* 地圖網格 (3x3) */}
              <g data-testid="map-grid" opacity="0.6">
                {/* 水平線 */}
                <line x1="70" y1="110" x2="130" y2="110" stroke="#333" strokeWidth="0.5" />
                <line x1="70" y1="140" x2="130" y2="140" stroke="#333" strokeWidth="0.5" />
                <line x1="70" y1="170" x2="130" y2="170" stroke="#333" strokeWidth="0.5" />

                {/* 垂直線 */}
                <line x1="85" y1="80" x2="85" y2="200" stroke="#333" strokeWidth="0.5" />
                <line x1="100" y1="80" x2="100" y2="200" stroke="#333" strokeWidth="0.5" />
                <line x1="115" y1="80" x2="115" y2="200" stroke="#333" strokeWidth="0.5" />

                {/* 脈動定位標記 */}
                <motion.circle
                  cx="100"
                  cy="140"
                  r="3"
                  fill={color}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.6, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                />
                <circle cx="100" cy="140" r="1.5" fill="white" />
              </g>

              {/* 羅盤元素 */}
              <g data-testid="compass-element">
                {/* 羅盤外圈 */}
                <circle cx="100" cy="180" r="15" fill="none" stroke="#444" strokeWidth="1" />

                {/* 旋轉指針組 */}
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'linear',
                  }}
                  style={{ transformOrigin: '100px 180px' }}
                >
                  {/* 北指針 (紅色) */}
                  <path d="M 100 165 L 103 180 L 100 175 L 97 180 Z" fill="#FF3333" opacity="0.8" />
                  {/* 南指針 (灰色) */}
                  <path d="M 100 195 L 103 180 L 100 185 L 97 180 Z" fill="#666" opacity="0.6" />
                </motion.g>

                {/* 中心點 */}
                <circle cx="100" cy="180" r="2" fill="white" opacity="0.8" />
              </g>
            </g>

            {/* 螢幕裁切定義 */}
            <clipPath id="screen-clip">
              <rect x="70" y="80" width="60" height="120" rx="4" />
            </clipPath>
          </g>
        </motion.g>

        {/* 汽車指示器 */}
        <motion.g
          data-testid="car-indicator"
          animate={{
            opacity: [0, 0, 1, 1, 0],
            y: [20, 20, 0, 0, 20],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            times: [0, 0.25, 0.5, 0.75, 1],
          }}
          style={{ transformOrigin: '100px 250px' }}
        >
          <g transform="translate(100, 250)">
            {/* 車身 */}
            <rect x="-15" y="-6" width="30" height="12" rx="2" fill={color} opacity="0.9" />

            {/* 車窗 */}
            <rect x="-10" y="-4" width="8" height="6" rx="1" fill="#333" opacity="0.5" />
            <rect x="2" y="-4" width="8" height="6" rx="1" fill="#333" opacity="0.5" />

            {/* 車輪 */}
            <circle cx="-8" cy="6" r="2" fill="#333" />
            <circle cx="8" cy="6" r="2" fill="#333" />

            {/* 車燈 (閃爍) */}
            <motion.circle
              cx="-13"
              cy="0"
              r="1"
              fill="#FFD700"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 0.8,
                repeat: Number.POSITIVE_INFINITY,
              }}
            />
            <motion.circle
              cx="13"
              cy="0"
              r="1"
              fill="#FFD700"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 0.8,
                repeat: Number.POSITIVE_INFINITY,
                delay: 0.4,
              }}
            />

            {/* 指向箭頭 */}
            <motion.path
              d="M 0 -15 L -5 -20 L 0 -25 L 5 -20 Z"
              fill="#00FF41"
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
              }}
            />
          </g>
        </motion.g>
      </svg>
    </div>
  );
}
