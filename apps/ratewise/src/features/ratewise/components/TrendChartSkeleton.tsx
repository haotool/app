import { useId, type FC } from 'react';

/**
 * Trend Chart Skeleton - Line Trace Wave
 * 波浪式繪製骨架屏，用於趨勢圖載入
 * 顏色使用 CSS Variables，自動隨主題切換
 */
export const TrendChartSkeleton: FC = () => {
  const uniqueId = useId();

  // 生成唯一的 gradient IDs（避免多個骨架屏時 ID 衝突）
  const waveGradId = `waveGrad-${uniqueId}`;
  const waveAreaId = `waveArea-${uniqueId}`;
  const waveMaskId = `waveMask-${uniqueId}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full h-full flex items-center justify-center rounded-b-xl overflow-hidden relative skeleton-bg"
      data-testid="trend-chart-skeleton"
    >
      <svg className="w-full h-full px-4 py-3" viewBox="0 0 400 100" preserveAspectRatio="none">
        <defs>
          {/* 波浪漸層 - 使用 CSS Variables 實現主題切換 */}
          <linearGradient id={waveGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'rgb(var(--color-chart-area-bottom))' }} />
            <stop offset="50%" style={{ stopColor: 'rgb(var(--color-chart-line))' }} />
            <stop offset="100%" style={{ stopColor: 'rgb(var(--color-accent))' }} />
          </linearGradient>

          {/* 區域填充漸層 */}
          <linearGradient id={waveAreaId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: 'rgb(var(--color-chart-line))', stopOpacity: 0.2 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: 'rgb(var(--color-chart-line))', stopOpacity: 0.03 }}
            />
          </linearGradient>

          <mask id={waveMaskId}>
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
          fill={`url(#${waveAreaId})`}
          mask={`url(#${waveMaskId})`}
        />

        {/* 波浪線條 */}
        <path
          d="M 0 55 Q 40 38, 80 52 T 160 48 T 240 54 T 320 50 T 400 52"
          stroke={`url(#${waveGradId})`}
          strokeWidth="2.5"
          fill="none"
          mask={`url(#${waveMaskId})`}
          strokeLinecap="round"
        />

        {/* 波浪跟隨點 */}
        <g mask={`url(#${waveMaskId})`}>
          {/* 波紋環 1 */}
          <circle
            r="6"
            fill="none"
            style={{ stroke: 'rgb(var(--color-chart-line))' }}
            strokeWidth="1.5"
            opacity="0.4"
          >
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
          <circle
            r="4"
            fill="none"
            style={{ stroke: 'rgb(var(--color-accent))' }}
            strokeWidth="1"
            opacity="0.5"
          >
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
          <circle r="3" fill={`url(#${waveGradId})`}>
            <animateMotion
              dur="2.6s"
              repeatCount="indefinite"
              path="M 0 55 Q 40 38, 80 52 T 160 48 T 240 54 T 320 50 T 400 52"
            />
          </circle>

          {/* 中心亮點 */}
          <circle r="1.2" style={{ fill: 'rgb(var(--color-surface))' }}>
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
