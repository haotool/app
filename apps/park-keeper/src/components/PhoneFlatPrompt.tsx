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
      {/* 外層容器：圓圈背景與脈動 */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* 背景圓圈 - 呼吸動畫 */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl"
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
          data-animation="pulse"
          data-testid="animation-circle"
        />

        {/* 主 SVG 動畫容器 */}
        <svg
          viewBox="0 0 240 240"
          className="w-40 h-40 relative z-10"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="平放手機提示動畫"
        >
          <defs>
            {/* 發光濾鏡 */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* 陰影濾鏡 */}
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* 背景圓圈 */}
          <circle cx="120" cy="120" r="80" fill={color} opacity="0.08" />

          {/* 裝飾性圓環 - 旋轉動畫 */}
          <motion.circle
            cx="120"
            cy="120"
            r="70"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="4 8"
            opacity="0.2"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
            style={{ transformOrigin: '120px 120px' }}
          />

          {/* 手機 3D 俯視圖動畫組 */}
          <motion.g
            data-testid="phone-3d"
            initial={{ rotateX: 0 }}
            animate={{
              rotateX: [0, 90, 90, 90, 0],
              scale: [1, 0.9, 1, 1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
              times: [0, 0.3, 0.5, 0.7, 1],
            }}
            style={{ transformOrigin: '120px 120px' }}
          >
            {/* 手機主體（直立狀態） */}
            <g filter="url(#shadow)">
              {/* 手機邊框 */}
              <rect x="95" y="85" width="50" height="90" rx="10" fill={color} opacity="0.9" />

              {/* 手機螢幕 */}
              <rect x="100" y="92" width="40" height="76" rx="6" fill="white" opacity="0.95" />

              {/* 攝像頭 */}
              <circle cx="120" cy="90" r="2" fill={color} opacity="0.4" />

              {/* Home 鍵 */}
              <circle cx="120" cy="171" r="3" fill="white" opacity="0.5" />

              {/* 螢幕內容 - 小圖標 */}
              <g opacity="0.3">
                <rect x="108" y="105" width="24" height="3" rx="1.5" fill={color} />
                <rect x="108" y="112" width="18" height="2" rx="1" fill={color} />
                <rect x="108" y="117" width="20" height="2" rx="1" fill={color} />
              </g>
            </g>

            {/* 手機頂端箭頭 */}
            <motion.g
              data-testid="phone-arrow"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 1, 1, 0],
                y: [0, -8, -8, -8, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
                times: [0, 0.3, 0.5, 0.7, 1],
              }}
            >
              {/* 箭頭線條 */}
              <motion.line
                x1="120"
                y1="75"
                x2="120"
                y2="45"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#glow)"
                animate={{
                  strokeDashoffset: [0, 30],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }}
                strokeDasharray="6 4"
              />

              {/* 箭頭尖端 */}
              <motion.path
                d="M 120 40 L 115 48 L 125 48 Z"
                fill={color}
                filter="url(#glow)"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                }}
                style={{ transformOrigin: '120px 45px' }}
              />
            </motion.g>
          </motion.g>

          {/* 小車圖示 - 目標點 */}
          <motion.g
            data-testid="car-icon"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0, 1, 1, 0],
              scale: [0, 0, 1, 1, 0],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
              times: [0, 0.3, 0.5, 0.7, 1],
            }}
          >
            {/* 車身主體 */}
            <rect x="102" y="20" width="36" height="16" rx="2" fill={color} opacity="0.9" />

            {/* 車頂 */}
            <path d="M 108 20 L 112 14 L 128 14 L 132 20 Z" fill={color} opacity="0.7" />

            {/* 車窗 */}
            <rect x="106" y="16" width="10" height="4" rx="1" fill="white" opacity="0.6" />
            <rect x="124" y="16" width="10" height="4" rx="1" fill="white" opacity="0.6" />

            {/* 車輪 */}
            <circle cx="110" cy="36" r="3" fill="#333" />
            <circle cx="130" cy="36" r="3" fill="#333" />
            <circle cx="110" cy="36" r="1.5" fill="#888" />
            <circle cx="130" cy="36" r="1.5" fill="#888" />

            {/* 車燈 */}
            <motion.circle
              cx="104"
              cy="24"
              r="1.5"
              fill="#FFD700"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
            <motion.circle
              cx="136"
              cy="24"
              r="1.5"
              fill="#FFD700"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
                delay: 0.4,
              }}
            />
          </motion.g>

          {/* 連接線動畫 - 從手機到車 */}
          <motion.line
            x1="120"
            y1="85"
            x2="120"
            y2="40"
            stroke={color}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.2"
            animate={{
              opacity: [0, 0, 0.3, 0.3, 0],
              strokeDashoffset: [0, -20],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
              times: [0, 0.3, 0.5, 0.7, 1],
            }}
          />

          {/* 裝飾性粒子 - 環繞動畫 */}
          {[...Array<undefined>(6)].map((_, i) => {
            const angle = (i * 360) / 6;
            const radius = 60;
            const x = 120 + radius * Math.cos((angle * Math.PI) / 180);
            const y = 120 + radius * Math.sin((angle * Math.PI) / 180);

            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="2"
                fill={color}
                opacity="0.3"
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.33,
                  ease: 'easeInOut',
                }}
                data-animation="pulse"
              />
            );
          })}
        </svg>
      </motion.div>
    </div>
  );
}
