import { Link } from 'react-router-dom';

/**
 * Showcase 索引頁面 - 導航到不同的設計方案展示
 * 創建時間: 2025-10-23T01:30:00+08:00
 */
export default function ShowcaseIndex() {
  console.log('ShowcaseIndex 組件已載入');
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 標題 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">通知視窗設計方案展示</h1>
          <p className="text-xl text-slate-600">選擇一個系列查看所有設計方案</p>
          <p className="text-sm text-slate-500 mt-2">
            創建時間: 2025-10-23T01:30:00+08:00 | 共 10 個專業設計方案
          </p>
        </div>

        {/* 系列選擇卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 深色系/原始系列 */}
          <Link
            to="/showcase/notification"
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 p-8 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/30"
          >
            {/* 背景裝飾 */}
            <div
              className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
              style={{
                background:
                  'radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 60%)',
              }}
            />

            <div className="relative">
              {/* 標籤 */}
              <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold mb-4">
                原始系列
              </div>

              {/* 標題 */}
              <h2 className="text-3xl font-bold mb-4">深色系方案</h2>

              {/* 描述 */}
              <p className="text-white/80 mb-6 leading-relaxed">
                包含 5 個深色/強對比設計方案，適合現代感、科技感強的應用
              </p>

              {/* 方案列表 */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-white/70">
                  <span className="w-2 h-2 rounded-full bg-purple-400 mr-2" />
                  液態玻璃效果
                </li>
                <li className="flex items-center text-sm text-white/70">
                  <span className="w-2 h-2 rounded-full bg-blue-400 mr-2" />
                  極簡扁平風格
                </li>
                <li className="flex items-center text-sm text-white/70">
                  <span className="w-2 h-2 rounded-full bg-purple-400 mr-2" />
                  新擬態風格
                </li>
                <li className="flex items-center text-sm text-white/70">
                  <span className="w-2 h-2 rounded-full bg-blue-400 mr-2" />
                  霓虹賽博風格
                </li>
                <li className="flex items-center text-sm text-white/70">
                  <span className="w-2 h-2 rounded-full bg-purple-400 mr-2" />
                  柔和漸變風格
                </li>
              </ul>

              {/* 按鈕 */}
              <div className="flex items-center text-sm font-semibold group-hover:translate-x-2 transition-transform">
                查看方案
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>

          {/* 淺色系列 */}
          <Link
            to="/showcase/notification-light"
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 p-8 text-purple-900 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-300/50"
          >
            {/* 背景裝飾 */}
            <div
              className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity"
              style={{
                background:
                  'radial-gradient(circle at 70% 30%, rgba(167, 139, 250, 0.2) 0%, transparent 60%)',
              }}
            />

            <div className="relative">
              {/* 標籤 */}
              <div className="inline-block px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm text-xs font-semibold mb-4 text-purple-700">
                新增系列
              </div>

              {/* 標題 */}
              <h2 className="text-3xl font-bold mb-4">淺色系方案</h2>

              {/* 描述 */}
              <p className="text-purple-700/80 mb-6 leading-relaxed">
                包含 5 個淺色系設計方案，適合清新、優雅、親和力強的應用
              </p>

              {/* 方案列表 */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-purple-700/70">
                  <span className="w-2 h-2 rounded-full bg-purple-400 mr-2" />
                  粉彩雲朵
                </li>
                <li className="flex items-center text-sm text-purple-700/70">
                  <span className="w-2 h-2 rounded-full bg-blue-300 mr-2" />
                  薰衣草迷霧
                </li>
                <li className="flex items-center text-sm text-purple-700/70">
                  <span className="w-2 h-2 rounded-full bg-purple-400 mr-2" />
                  晨露清新
                </li>
                <li className="flex items-center text-sm text-purple-700/70">
                  <span className="w-2 h-2 rounded-full bg-pink-300 mr-2" />
                  棉花糖甜心
                </li>
                <li className="flex items-center text-sm text-purple-700/70">
                  <span className="w-2 h-2 rounded-full bg-purple-300 mr-2" />
                  珍珠微光
                </li>
              </ul>

              {/* 按鈕 */}
              <div className="flex items-center text-sm font-semibold group-hover:translate-x-2 transition-transform">
                查看方案
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* 說明文字 */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 text-sm leading-relaxed">
            所有方案基於當前專案的 purple-blue 配色設計
            <br />
            參考了 shadcn/ui、Smashing Magazine、CSS-Tricks、NN/g 等權威來源
          </p>
        </div>
      </div>
    </div>
  );
}
