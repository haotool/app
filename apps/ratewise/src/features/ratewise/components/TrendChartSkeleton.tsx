import type { FC } from 'react';

/**
 * Trend Chart Skeleton - Line Trace Wave
 * 波浪式繪製骨架屏，用於趨勢圖載入
 * 保持原配色：藍紫漸層背景
 */
export const TrendChartSkeleton: FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-b-xl overflow-hidden relative"
      data-testid="trend-chart-skeleton"
    >
      <svg className="w-full h-full px-4 py-3" viewBox="0 0 400 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          <linearGradient id="waveArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.03" />
          </linearGradient>

          <mask id="waveMask">
            <rect x="0" y="0" width="400" height="100" fill="white">
              <animate
                attributeName="width"
                from="0"
                to="400"
                dur="2.6s"
                repeatCount="indefinite"
              />
            </rect>
          </mask>
        </defs>

        {/* 區域填充 */}
        <path
          d="M 0 55 Q 40 38, 80 52 T 160 48 T 240 54 T 320 50 T 400 52 L 400 100 L 0 100 Z"
          fill="url(#waveArea)"
          mask="url(#waveMask)"
        />

        {/* 波浪線條 */}
        <path
          d="M 0 55 Q 40 38, 80 52 T 160 48 T 240 54 T 320 50 T 400 52"
          stroke="url(#waveGrad)"
          strokeWidth="2.5"
          fill="none"
          mask="url(#waveMask)"
          strokeLinecap="round"
        />

        {/* 波浪跟隨點 */}
        <g mask="url(#waveMask)">
          {/* 波紋環 1 */}
          <circle r="6" fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.4">
            <animateMotion
              dur="2.6s"
              repeatCount="indefinite"
              path="M 0 55 Q 40 38, 80 52 T 160 48 T 240 54 T 320 50 T 400 52"
            />
            <animate attributeName="r" values="4;8;4" dur="1.2s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.5;0.1;0.5"
              dur="1.2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* 波紋環 2 */}
          <circle r="4" fill="none" stroke="#c084fc" strokeWidth="1" opacity="0.5">
            <animateMotion
              dur="2.6s"
              repeatCount="indefinite"
              path="M 0 55 Q 40 38, 80 52 T 160 48 T 240 54 T 320 50 T 400 52"
            />
            <animate attributeName="r" values="3;6;3" dur="0.9s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.6;0.2;0.6"
              dur="0.9s"
              repeatCount="indefinite"
            />
          </circle>

          {/* 核心點 */}
          <circle r="3" fill="url(#waveGrad)">
            <animateMotion
              dur="2.6s"
              repeatCount="indefinite"
              path="M 0 55 Q 40 38, 80 52 T 160 48 T 240 54 T 320 50 T 400 52"
            />
          </circle>

          {/* 中心亮點 */}
          <circle r="1.2" fill="white">
            <animateMotion
              dur="2.6s"
              repeatCount="indefinite"
              path="M 0 55 Q 40 38, 80 52 T 160 48 T 240 54 T 320 50 T 400 52"
            />
          </circle>
        </g>
      </svg>

      <span className="sr-only">趨勢圖載入中</span>
    </div>
  );
};
