import { useEffect, useLayoutEffect, useRef, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  createChart,
  ColorType,
  LineStyle,
  AreaSeries,
  TrackingModeExitMode,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { motion, AnimatePresence } from 'motion/react';
import { formatExchangeRate } from '../../../utils/currencyFormatter';
import { getChartColors } from '../../../config/themes';
import { chartTransitions } from '../../../config/animations';
import type { CurrencyCode } from '../types';

export interface MiniTrendDataPoint {
  date: string;
  rate: number;
}

export interface MiniTrendChartProps {
  data: MiniTrendDataPoint[];
  currencyCode: CurrencyCode;
  className?: string;
  /** 走勢價格基準標註（例如「現金賣出走勢」）；提供時顯示於圖角與 tooltip。 */
  basisLabel?: string;
}

interface TooltipData {
  date: string;
  rate: number;
  x: number;
  y: number;
}

/**
 * 將 tooltip 中心 x 夾在 viewport 內，確保首尾資料點的 tooltip 完整可見。
 */
export function clampTooltipCenterX(
  x: number,
  tooltipWidth: number,
  viewportWidth: number,
  margin = 8,
): number {
  const halfWidth = tooltipWidth / 2;
  const min = halfWidth + margin;
  const max = viewportWidth - halfWidth - margin;
  if (max < min) return viewportWidth / 2;
  return Math.min(Math.max(x, min), max);
}

/**
 * 迷你趨勢圖組件 - 現代化高級 APP 風格
 * 使用 lightweight-charts 專業金融圖表庫
 * 特色：
 * - Hover/長按互動顯示日期和價格（單一事件來源：subscribeCrosshairMove）
 * - 觸控長按追蹤採用 library 內建 trackingMode（240ms long-tap，退出於放開手指），
 *   不再自製手勢計時器，避免與內建觸控處理互相干擾造成 tooltip 跳動
 * - Tooltip 錨定於 crosshair 資料點 x、固定顯示於圖表上緣，不被手指遮擋
 * - **SSOT Design Token** - 圖表顏色從 CSS Variables 獲取，data-style 切換即時重建
 *
 * @version 3.0.0 - 收斂觸控處理至 lightweight-charts 內建 tracking mode
 */
export function MiniTrendChart({ data, className = '', basisLabel }: MiniTrendChartProps) {
  // 使用真實數據（Safari 404 問題已透過 logger.debug 降級處理修復）
  const displayData = data;
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  // 追蹤主題變化 - 用於觸發圖表重建
  const [themeVersion, setThemeVersion] = useState(0);

  // MutationObserver 監聽 <html> 的 data-style / class 變化（主題切換）。
  // applyTheme 以 data-style 切換主題，僅監聽 class 會漏掉同字體主題間的切換。
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'data-style' || mutation.attributeName === 'class') {
          setThemeVersion((v) => v + 1);
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-style', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  // 獲取主題色彩（SSOT from CSS Variables）- themeVersion 變化時重新獲取
  // eslint-disable-next-line react-hooks/exhaustive-deps -- themeVersion 是故意的依賴，用於觸發主題切換時重建圖表
  const getThemeColors = useCallback(() => getChartColors(), [themeVersion]);

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

    // 從 SSOT 獲取圖表顏色
    const chartColors = getThemeColors();

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        // 主題正文色（軸線/刻度全隱藏，唯一可見消費者是 TradingView attribution logo）：
        // 官方 AttributionLogoWidget 依 textColor 灰階 >160 切換亮/暗版，深色主題 logo 不再隱形（#687）。
        // 原 'transparent' 解析為灰階 0，logo 永遠深色版壓深底。
        textColor: chartColors.textColor,
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
          color: chartColors.topColor, // SSOT: 使用主題色 (40% opacity)
          style: LineStyle.Solid,
          labelVisible: false,
        },
        horzLine: {
          visible: false,
        },
      },
      // 行動裝置長按追蹤：交由內建 tracking mode 處理（240ms long-tap 啟動），
      // 放開手指即退出，crosshairMove 為唯一 tooltip 事件來源。
      trackingMode: {
        exitMode: TrackingModeExitMode.OnTouchEnd,
      },
      handleScroll: false,
      handleScale: false,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current = chart;

    // SSOT: 從 CSS Variables 獲取圖表配色
    const series = chart.addSeries(AreaSeries, {
      lineColor: chartColors.lineColor, // SSOT: --color-chart-line
      lineWidth: 2,
      topColor: chartColors.topColor, // SSOT: --color-chart-area-top (40% opacity)
      bottomColor: chartColors.bottomColor, // SSOT: --color-chart-area-bottom (10% opacity)
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

    // Performance mark: 趨勢圖渲染完成
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark('rw:chart-rendered');
        // 嘗試量測從 fetch 到渲染的總時間
        if (performance.getEntriesByName('rw:chart-fetch-start').length > 0) {
          performance.measure('rw:chart-total-time', 'rw:chart-fetch-start', 'rw:chart-rendered');
        }
      } catch {
        // Safari 可能拒絕某些 mark/measure
      }
    }

    // Crosshair 移動事件 - tooltip 唯一來源（滑鼠 hover 與觸控 tracking mode 共用）。
    // x 錨定 crosshair 座標、y 固定於圖表上緣：位置穩定且不被手指遮擋。
    chart.subscribeCrosshairMove((param) => {
      if (param.point === undefined || !param.time || param.point.x < 0 || param.point.y < 0) {
        setTooltipData(null);
      } else {
        const dataPoint = param.seriesData.get(series);
        if (dataPoint && 'value' in dataPoint) {
          const container = chartContainerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            setTooltipData({
              date: param.time as string,
              rate: dataPoint.value,
              x: rect.left + param.point.x,
              y: rect.top,
            });
          }
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
  }, [displayData, stats.maxIndex, stats.minIndex, getThemeColors]);

  // Tooltip portal 至 body 後量測實際寬度，將中心 x 夾在 viewport 內（首尾資料點防溢出）。
  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el || !tooltipData) return;
    const clampedX = clampTooltipCenterX(tooltipData.x, el.offsetWidth, window.innerWidth);
    el.style.left = `${clampedX}px`;
  }, [tooltipData]);

  // 數據不足時不顯示圖表
  if (displayData.length < 2) {
    return null;
  }

  return (
    <motion.div
      className={`w-full h-full relative ${className}`}
      data-testid="mini-trend-chart"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={chartTransitions.fadeIn}
    >
      {/* Lightweight Charts 趨勢圖：觸控長按由 library trackingMode 內建處理。
       * touch-none 阻止瀏覽器手勢、select-none 防止長按選字/iOS 放大鏡。 */}
      <div
        ref={chartContainerRef}
        data-testid="mini-trend-chart-surface"
        className="w-full h-full touch-none select-none"
      />

      {/* 走勢基準標註（例如「現金賣出走勢」）- 展開視圖下常駐可見 */}
      {basisLabel && (
        <span
          data-testid="trend-basis-label"
          className="absolute top-1 left-2 z-10 pointer-events-none text-2xs font-medium text-text-muted whitespace-nowrap"
        >
          {basisLabel}
        </span>
      )}

      {/* Hover Tooltip - SSOT 主題色設計。
       * Portal 至 body：position:fixed 不再受帶 transform 的祖先（motion whileHover）
       * 影響而以錯誤的 containing block 定位；translateX(-50%) 置中放在外層純 div，
       * 避免被 Framer Motion 的 animate transform 覆寫；useLayoutEffect 夾 viewport 邊界。 */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {tooltipData && (
              <div
                ref={tooltipRef}
                data-testid="mini-trend-chart-tooltip"
                className="pointer-events-none"
                style={{
                  position: 'fixed',
                  left: `${tooltipData.x}px`,
                  top: `${tooltipData.y - 55}px`,
                  zIndex: 99999,
                  transform: 'translateX(-50%)',
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 8 }}
                  transition={chartTransitions.tooltipBounce}
                >
                  {/* SSOT: 使用主題色 Tooltip (card/foreground/primary) */}
                  <div className="relative">
                    <div className="bg-card/98 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-floating border-2 border-border">
                      {basisLabel && (
                        <div className="text-2xs leading-tight text-text-muted whitespace-nowrap">
                          {basisLabel}
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 text-2xs leading-tight whitespace-nowrap">
                        <span className="text-primary-on-surface font-semibold">
                          {tooltipData.date}
                        </span>
                        <span className="text-foreground font-bold">
                          {formatExchangeRate(tooltipData.rate)}
                        </span>
                      </div>
                    </div>
                    {/* 小三角形指示器 - 使用 card 色 */}
                    <div
                      className="absolute left-1/2 -bottom-[5px] transform -translate-x-1/2"
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '5px solid rgb(var(--color-card) / 0.98)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                      }}
                    />
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </motion.div>
  );
}
