import { motion } from 'motion/react';

interface PhoneFlatPromptProps {
  color?: string;
  className?: string;
}

export default function PhoneFlatPrompt({
  color = '#3b82f6',
  className = '',
}: PhoneFlatPromptProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* 外層容器 */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* 背景光暈 */}
        <motion.div
          className="absolute inset-0 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
          style={{
            backgroundColor: color,
          }}
        />

        {/* 主 SVG 動畫 */}
        <svg
          viewBox="0 0 200 280"
          className="w-32 h-44 relative z-10"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="平放手機提示動畫"
        >
          <defs>
            {/* 漸層 - 紅色 (站立) */}
            <linearGradient id="redGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF3333" stopOpacity="1">
                <animate
                  attributeName="stop-opacity"
                  values="1;0;0;0;1"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#CC0000" stopOpacity="1">
                <animate
                  attributeName="stop-opacity"
                  values="1;0;0;0;1"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>

            {/* 漸層 - 綠色 (平躺) */}
            <linearGradient id="greenGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00FF41" stopOpacity="0">
                <animate
                  attributeName="stop-opacity"
                  values="0;1;1;1;0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#00CC33" stopOpacity="0">
                <animate
                  attributeName="stop-opacity"
                  values="0;1;1;1;0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>

            {/* 發光濾鏡 */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* 陰影 */}
            <filter id="shadow">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* 旋轉動畫組 */}
          <motion.g
            data-testid="phone-rotation-group"
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
            style={{ transformOrigin: '100px 140px' }}
          >
            {/* 手機機身 */}
            <g data-testid="phone-body" filter="url(#shadow)">
              {/* 外框 - 顏色轉換 */}
              <rect
                x="60"
                y="60"
                width="80"
                height="160"
                rx="12"
                fill="url(#redGlow)"
                stroke="url(#greenGlow)"
                strokeWidth="2"
                data-animation="color-shift"
              />
              <rect
                x="60"
                y="60"
                width="80"
                height="160"
                rx="12"
                fill="url(#greenGlow)"
                data-animation="color-shift"
              />

              {/* 螢幕區域 */}
              <g data-testid="phone-screen">
                {/* 螢幕背景 */}
                <rect x="65" y="70" width="70" height="140" rx="8" fill="#1a1a1a" opacity="0.95" />

                {/* 螢幕內容：迷你地圖 */}
                <g data-testid="screen-map-marker">
                  {/* 地圖網格線 */}
                  <line x1="70" y1="100" x2="130" y2="100" stroke="#333" strokeWidth="0.5" />
                  <line x1="70" y1="120" x2="130" y2="120" stroke="#333" strokeWidth="0.5" />
                  <line x1="70" y1="140" x2="130" y2="140" stroke="#333" strokeWidth="0.5" />
                  <line x1="85" y1="80" x2="85" y2="160" stroke="#333" strokeWidth="0.5" />
                  <line x1="100" y1="80" x2="100" y2="160" stroke="#333" strokeWidth="0.5" />
                  <line x1="115" y1="80" x2="115" y2="160" stroke="#333" strokeWidth="0.5" />

                  {/* 地圖標記點 (脈動) */}
                  <motion.circle
                    cx="100"
                    cy="130"
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
                    style={{ transformOrigin: '100px 130px' }}
                  />
                  <circle cx="100" cy="130" r="1.5" fill="white" />
                </g>

                {/* 螢幕內容：迷你羅盤 */}
                <g data-testid="screen-compass">
                  {/* 羅盤外環 */}
                  <circle cx="100" cy="180" r="15" fill="none" stroke="#444" strokeWidth="1" />

                  {/* 羅盤指針 (旋轉) */}
                  <motion.g
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'linear',
                    }}
                    style={{ transformOrigin: '100px 180px' }}
                  >
                    <path
                      d="M 100 165 L 103 180 L 100 190 L 97 180 Z"
                      fill="#FF3333"
                      opacity="0.8"
                    />
                    <path d="M 100 190 L 103 180 L 100 200 L 97 180 Z" fill="#666" opacity="0.6" />
                  </motion.g>

                  {/* 羅盤中心點 */}
                  <circle cx="100" cy="180" r="2" fill="white" />
                </g>
              </g>

              {/* 相機孔 */}
              <circle cx="100" cy="75" r="3" fill="#0a0a0a" opacity="0.7" />
              <circle cx="100" cy="75" r="1.5" fill="#1a3a5a" opacity="0.5" />

              {/* Home 鍵 / 指紋 */}
              <circle cx="100" cy="205" r="5" fill="#0a0a0a" opacity="0.3" />
              <circle
                cx="100"
                cy="205"
                r="3"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
                opacity="0.2"
              />
            </g>
          </motion.g>

          {/* 汽車目標 (平躺時出現) */}
          <motion.g
            data-testid="car-target"
            animate={{
              opacity: [0, 0, 1, 1, 0],
              y: [20, 20, 0, 0, 20],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
          >
            {/* 汽車圖示 */}
            <g transform="translate(100, 30)">
              {/* 車身 */}
              <rect x="-15" y="0" width="30" height="12" rx="2" fill={color} opacity="0.9" />
              {/* 車頂 */}
              <path d="M -10 0 L -7 -5 L 7 -5 L 10 0 Z" fill={color} opacity="0.7" />
              {/* 車窗 */}
              <rect x="-8" y="-4" width="6" height="3" rx="0.5" fill="white" opacity="0.5" />
              <rect x="2" y="-4" width="6" height="3" rx="0.5" fill="white" opacity="0.5" />
              {/* 車輪 */}
              <circle cx="-8" cy="12" r="2" fill="#333" />
              <circle cx="8" cy="12" r="2" fill="#333" />
              <circle cx="-8" cy="12" r="1" fill="#666" />
              <circle cx="8" cy="12" r="1" fill="#666" />
              {/* 車燈 (閃爍) */}
              <motion.circle
                cx="-13"
                cy="6"
                r="1"
                fill="#FFD700"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
              />
              <motion.circle
                cx="13"
                cy="6"
                r="1"
                fill="#FFD700"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
              />
            </g>

            {/* 箭頭指示 (手機→汽車) */}
            <motion.line
              x1="100"
              y1="60"
              x2="100"
              y2="45"
              stroke="#00FF41"
              strokeWidth="2"
              strokeDasharray="4 2"
              filter="url(#glow)"
              animate={{
                strokeDashoffset: [0, -12],
              }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              }}
            />
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
}
