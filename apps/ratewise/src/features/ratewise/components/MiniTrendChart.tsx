import { useEffect, useRef, useMemo, useState } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { motion, AnimatePresence } from 'motion/react';

export interface MiniTrendDataPoint {
  date: string;
  rate: number;
}

export interface MiniTrendChartProps {
  data: MiniTrendDataPoint[];
  className?: string;
}

interface TooltipData {
  date: string;
  rate: number;
  x: number;
  y: number;
}

/**
 * 迷你趨勢圖組件 - 現代化高級 APP 風格
 * 使用 lightweight-charts 專業金融圖表庫
 * 特色：
 * - 左到右酷炫動畫
 * - Hover 互動顯示日期和價格
 * - 數據 ≥ 2 天時統一延伸到最寬
 * - 現代化配色與微互動
 */
export function MiniTrendChart({ data, className = '' }: MiniTrendChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  const displayData = data;

  const stats = useMemo(() => {
    if (displayData.length === 0) {
      return { min: 0, max: 0, minIndex: 0, maxIndex: 0, change24h: 0, changePercent: 0 };
    }

    const rates = displayData.map((d) => d.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const minIndex = rates.indexOf(min);
    const maxIndex = rates.indexOf(max);

    // 計算24小時變化
    const currentRate = rates[rates.length - 1] ?? 0;
    const rate24hAgo = rates[0] ?? 0;
    const change24h = currentRate - rate24hAgo;
    const changePercent = rate24hAgo !== 0 ? (change24h / rate24hAgo) * 100 : 0;

    return { min, max, minIndex, maxIndex, change24h, changePercent };
  }, [displayData]);

  useEffect(() => {
    if (!chartContainerRef.current || displayData.length < 2) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: false,
      },
      crosshair: {
        mode: 0, // CrosshairMode.Normal - 自由移動不吸附
        vertLine: {
          width: 1,
          color: 'rgba(139, 92, 246, 0.5)',
          style: LineStyle.Solid,
          labelVisible: false,
        },
        horzLine: {
          visible: false,
        },
      },
      handleScroll: false,
      handleScale: false,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current = chart;

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#8b5cf6',
      lineWidth: 2,
      topColor: 'rgba(139, 92, 246, 0.4)',
      bottomColor: 'rgba(59, 130, 246, 0.1)',
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    seriesRef.current = series;

    // 轉換數據格式為 lightweight-charts 格式
    const chartData = displayData.map((point) => ({
      time: point.date,
      value: point.rate,
    }));

    series.setData(chartData);
    chart.timeScale().fitContent();

    // Crosshair 移動事件 - 顯示 tooltip
    chart.subscribeCrosshairMove((param) => {
      if (param.point === undefined || !param.time || param.point.x < 0 || param.point.y < 0) {
        setTooltipData(null);
      } else {
        const dataPoint = param.seriesData.get(series);
        if (dataPoint && 'value' in dataPoint) {
          setTooltipData({
            date: param.time as string,
            rate: dataPoint.value,
            x: param.point.x,
            y: param.point.y,
          });
        }
      }
    });

    // 處理視窗大小變化
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
        chart.timeScale().fitContent();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [displayData, stats.maxIndex, stats.minIndex]);

  // 數據不足時不顯示圖表
  if (displayData.length < 2) {
    return null;
  }

  return (
    <motion.div
      className={`w-full h-full relative ${className}`}
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1], // 自定義緩動曲線
        scaleX: {
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1], // Material Design 標準緩動
        },
      }}
      style={{ transformOrigin: 'left center' }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Lightweight Charts 趨勢圖 */}
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Hover Tooltip - 現代化小巧設計 */}
      <AnimatePresence>
        {tooltipData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 5 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="fixed pointer-events-none"
            style={{
              left: `${tooltipData.x}px`,
              top: `${tooltipData.y - 50}px`,
              zIndex: 9999, // 確保不被遮蔽
              transform: 'translateX(-50%)', // 居中對齊
            }}
          >
            {/* 現代化小巧 Tooltip */}
            <div className="relative">
              <div className="bg-slate-900/95 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-md shadow-xl border border-slate-700/50">
                <div className="flex items-center gap-2 text-[10px] leading-tight">
                  <span className="text-slate-400 font-medium">{tooltipData.date}</span>
                  <span className="text-white font-bold">{tooltipData.rate.toFixed(2)}</span>
                </div>
              </div>
              {/* 小三角形指示器 - 更小巧 */}
              <div
                className="absolute left-1/2 -bottom-1 transform -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '4px solid rgba(15, 23, 42, 0.95)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
