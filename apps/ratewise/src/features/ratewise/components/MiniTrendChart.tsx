import { useEffect, useRef, useMemo } from 'react';
import { createChart, ColorType, LineStyle, AreaSeries } from 'lightweight-charts';

export interface MiniTrendDataPoint {
  date: string;
  rate: number;
}

export interface MiniTrendChartProps {
  data: MiniTrendDataPoint[];
  className?: string;
}

/**
 * 迷你趨勢圖組件 - 藍紫色配色，背景顯示
 * 使用 lightweight-charts 專業金融圖表庫
 * 標注最高和最低點
 */
export function MiniTrendChart({ data: _data, className = '' }: MiniTrendChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // 🎭 DEMO MODE: 使用假數據展示完整趨勢圖效果
  const mockData: MiniTrendDataPoint[] = [
    { date: '2025-10-08', rate: 31.025 },
    { date: '2025-10-09', rate: 31.125 },
    { date: '2025-10-10', rate: 31.245 },
    { date: '2025-10-11', rate: 31.185 },
    { date: '2025-10-12', rate: 31.345 },
    { date: '2025-10-13', rate: 31.425 },
    { date: '2025-10-14', rate: 31.745 },
  ];

  const displayData = mockData; // 🎭 DEMO: 使用假數據

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
        horzLine: { visible: false },
        vertLine: { visible: false },
      },
      handleScroll: false,
      handleScale: false,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#8b5cf6',
      lineWidth: 2,
      topColor: 'rgba(139, 92, 246, 0.4)',
      bottomColor: 'rgba(59, 130, 246, 0.1)',
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // 轉換數據格式為 lightweight-charts 格式
    const chartData = displayData.map((point) => ({
      time: point.date,
      value: point.rate,
    }));

    series.setData(chartData);
    chart.timeScale().fitContent();

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
    };
  }, [displayData, stats.maxIndex, stats.minIndex]);

  // 🎭 DEMO MODE: 強制顯示假數據趨勢圖
  // if (displayData.length < 2) {
  //   return null;
  // }

  return (
    <div className={`w-full h-full ${className}`}>
      {/* Lightweight Charts 趨勢圖 */}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}
