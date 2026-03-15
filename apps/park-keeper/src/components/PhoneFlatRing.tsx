import { motion, AnimatePresence } from 'motion/react';
import {
  NORTH_COLOR,
  WARNING_RING_STROKE,
  WARNING_SCREEN_FILL,
  WARNING_LABEL,
} from '@app/park-keeper/config/colors';

interface PhoneFlatRingProps {
  /** 是否顯示（手機未平放且已取得 GPS 位置時為 true） */
  visible: boolean;
  /** 底部標籤文字，由父層傳入 i18n 翻譯後的字串 */
  label: string;
}

/**
 * PhoneFlatRing — 手機平放提示動畫環。
 *
 * 設計目標：不遮擋 Hub 中心的距離與方向資訊，
 * 改以環形出現在 Hub 外圍（Hub 128px 與羅盤刻度 288px 之間的 24px 間隙），
 * 搭配旋轉虛線圓環 + 手機圖示傾斜動畫，視覺傳達「請平放手機」。
 */
export default function PhoneFlatRing({ visible, label }: PhoneFlatRingProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="phone-flat-ring"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.88 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute w-44 h-44 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 9 }}
          data-testid="phone-flat-ring"
        >
          {/* 緩慢旋轉虛線環 */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
          >
            <svg viewBox="0 0 176 176" className="w-full h-full" aria-hidden="true">
              <circle
                data-testid="ring-circle"
                cx="88"
                cy="88"
                r="82"
                fill="none"
                stroke={WARNING_RING_STROKE}
                strokeWidth="1.5"
                strokeDasharray="9 6"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>

          {/* 手機圖示：在環頂端，前後傾斜表示「請放平」 */}
          <div className="absolute" style={{ top: 4, left: '50%', transform: 'translateX(-50%)' }}>
            <motion.div
              animate={{ rotate: [28, 0, 28] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            >
              <svg
                data-testid="phone-svg"
                viewBox="0 0 28 46"
                width="14"
                height="23"
                fill="none"
                aria-hidden="true"
              >
                {/* 手機外框 */}
                <rect
                  x="1.5"
                  y="1.5"
                  width="25"
                  height="43"
                  rx="5"
                  stroke={NORTH_COLOR}
                  strokeWidth="2"
                />
                {/* 螢幕區域 */}
                <rect x="4" y="7" width="20" height="29" rx="2" fill={WARNING_SCREEN_FILL} />
                {/* 頂部缺口 */}
                <rect x="10" y="3.5" width="8" height="2" rx="1" fill={NORTH_COLOR} opacity="0.7" />
                {/* Home 鍵 */}
                <circle cx="14" cy="39.5" r="2" fill={NORTH_COLOR} />
              </svg>
            </motion.div>
          </div>

          {/* 底部標籤 */}
          <p
            className="absolute text-[8px] font-black uppercase tracking-[0.22em] whitespace-nowrap"
            style={{ bottom: 5, color: WARNING_LABEL }}
          >
            {label}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
