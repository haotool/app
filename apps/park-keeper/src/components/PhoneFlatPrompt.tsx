import { motion } from 'motion/react';

interface PhoneFlatPromptProps {
  text?: string;
  color?: string;
  orientation?: 'portrait' | 'landscape';
  className?: string;
}

/**
 * PhoneFlatPrompt - 高級平放手機提示動畫組件
 *
 * 特點：
 * - 流暢的 3D 旋轉動畫效果
 * - 脈動光暈與呼吸燈效果
 * - 優雅的微互動設計
 * - 支援自訂主題顏色
 */
export default function PhoneFlatPrompt({
  text = '請平放手機以獲取羅盤方位',
  color = '#3b82f6',
  orientation = 'portrait',
  className = '',
}: PhoneFlatPromptProps) {
  const isFlat = orientation === 'landscape';

  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
      {/* SVG 動畫容器 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative"
      >
        {/* 外層脈動光暈 */}
        <motion.div
          className="absolute inset-0 rounded-3xl blur-2xl opacity-30"
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
          data-animation="pulse"
        />

        {/* 主 SVG 動畫 */}
        <svg
          viewBox="0 0 200 200"
          className="w-32 h-32 relative z-10"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="平放手機提示動畫"
        >
          {/* 背景圓形呼吸光環 */}
          <motion.circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={color}
            strokeWidth="2"
            opacity="0.2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.8, 1, 0.8],
              opacity: [0, 0.2, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          />

          {/* 旋轉動畫組 */}
          <motion.g
            data-testid="animated-group"
            initial={{ rotateX: 0 }}
            animate={{
              rotateX: isFlat ? [0, 90, 90] : [90, 0, 90],
              rotateY: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
              times: [0, 0.5, 1],
            }}
            style={{ transformOrigin: '100px 100px' }}
          >
            {/* 手機外框 */}
            <g data-testid="phone-frame">
              {/* 手機主體 */}
              <rect x="70" y="50" width="60" height="100" rx="8" fill={color} opacity="0.9" />

              {/* 手機螢幕 */}
              <rect x="75" y="60" width="50" height="75" rx="4" fill="white" opacity="0.95" />

              {/* 聽筒 */}
              <rect x="90" y="55" width="20" height="3" rx="1.5" fill="white" opacity="0.7" />

              {/* Home 鍵 */}
              <circle cx="100" cy="142" r="4" fill="white" opacity="0.6" />

              {/* 螢幕內容 - 羅盤圖示 */}
              <g opacity="0.4">
                <motion.circle
                  cx="100"
                  cy="97.5"
                  r="15"
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'linear',
                  }}
                  style={{ transformOrigin: '100px 97.5px' }}
                />
                <motion.path
                  d="M 100 82.5 L 95 97.5 L 100 112.5 L 105 97.5 Z"
                  fill={color}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'linear',
                  }}
                  style={{ transformOrigin: '100px 97.5px' }}
                />
              </g>
            </g>
          </motion.g>

          {/* 裝飾性粒子效果 */}
          {[...Array<undefined>(8)].map((_, i) => {
            const angle = (i * 360) / 8;
            const radius = 70;
            const x = 100 + radius * Math.cos((angle * Math.PI) / 180);
            const y = 100 + radius * Math.sin((angle * Math.PI) / 180);

            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="2"
                fill={color}
                opacity="0.4"
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.25,
                  ease: 'easeInOut',
                }}
                data-animation="pulse"
              />
            );
          })}
        </svg>
      </motion.div>

      {/* 提示文字 */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center text-sm font-medium"
        style={{ color }}
      >
        {text}
      </motion.p>

      {/* 副提示 - 細微的呼吸動畫 */}
      <motion.div
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
        className="flex items-center gap-2 text-xs opacity-60"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium">自動偵測中...</span>
      </motion.div>
    </div>
  );
}
