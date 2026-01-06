/**
 * ThreeHeroFallback Component - Static Fallback for 3D Hero
 *
 * 用於以下情況：
 * 1. 3D 場景尚未載入時顯示
 * 2. Lighthouse/PageSpeed 分析時顯示（避免超時）
 * 3. 低效能裝置時顯示
 *
 * [context7:/websites/react_dev_reference:2026-01-07]
 * [SEO-fix:2026-01-07] 解決 PageSpeed Insights RPC::DEADLINE_EXCEEDED 問題
 */
import React from 'react';

const ThreeHeroFallback: React.FC = () => {
  return (
    <div
      className="absolute inset-0 z-0 w-full h-full pointer-events-none"
      aria-label="3D Hero Loading"
    >
      {/* 背景漸變 - 模擬 3D 場景的深色背景 */}
      <div className="absolute inset-0 bg-[#020617]" />

      {/* 模擬 3D 物件的靜態視覺效果 */}
      <div className="absolute inset-0 flex items-center justify-end pr-[10%]">
        {/* 外層光暈效果 */}
        <div className="relative w-64 h-64 md:w-96 md:h-96">
          {/* 主要光暈 */}
          <div className="absolute inset-0 rounded-full bg-gradient-radial from-brand-500/20 via-brand-500/5 to-transparent blur-3xl animate-pulse" />

          {/* 幾何形狀模擬 - 外層 */}
          <div className="absolute inset-8 md:inset-12 rounded-full border border-brand-500/20 animate-spin-slow" />

          {/* 幾何形狀模擬 - 內層 */}
          <div
            className="absolute inset-16 md:inset-20 rounded-full border border-white/10 animate-spin-reverse"
            style={{ animationDuration: '20s' }}
          />

          {/* 中心光點 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 shadow-lg shadow-brand-500/20" />
          </div>
        </div>
      </div>

      {/* 環境光效果 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl" />
    </div>
  );
};

export default ThreeHeroFallback;
