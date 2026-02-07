/**
 * 配色方案比較頁面
 * 用於展示和比較不同的通知視窗配色方案
 */

export default function ColorSchemeComparison() {
  const notificationVariants = [
    {
      id: 'current',
      name: '當前 - 棉花糖甜心',
      description: '粉紅粉紫粉藍三色漸變',
      containerBg: 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50',
      containerBorder: 'border-purple-100',
      iconBg: 'bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200',
      iconColor: 'text-purple-600',
      titleColor: 'text-purple-700',
      descColor: 'text-purple-500',
      primaryBtn: 'bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300',
      primaryBtnHover: 'hover:from-pink-400 hover:via-purple-400 hover:to-blue-400',
      secondaryBtn: 'bg-white/90 text-purple-600 border-purple-200',
      bubbleTop: 'bg-purple-100/50',
      bubbleBottom: 'bg-pink-100/50',
    },
    {
      id: 'brand-aligned',
      name: '方案 A - 品牌對齊',
      description: '藍紫雙色漸變 (與主應用一致)',
      containerBg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
      containerBorder: 'border-indigo-100',
      iconBg: 'bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200',
      iconColor: 'text-indigo-600',
      titleColor: 'text-indigo-700',
      descColor: 'text-indigo-500',
      primaryBtn: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500',
      primaryBtnHover: 'hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600',
      secondaryBtn: 'bg-white/90 text-indigo-600 border-indigo-200',
      bubbleTop: 'bg-indigo-100/50',
      bubbleBottom: 'bg-blue-100/50',
    },
    {
      id: 'cool-tone',
      name: '方案 B - 冷色調',
      description: '藍紫色調 (專業穩重)',
      containerBg: 'bg-gradient-to-br from-blue-50 via-violet-50 to-slate-50',
      containerBorder: 'border-violet-100',
      iconBg: 'bg-gradient-to-br from-blue-200 via-violet-200 to-slate-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-700',
      descColor: 'text-blue-500',
      primaryBtn: 'bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500',
      primaryBtnHover: 'hover:from-blue-600 hover:via-violet-600 hover:to-purple-600',
      secondaryBtn: 'bg-white/90 text-blue-600 border-blue-200',
      bubbleTop: 'bg-violet-100/50',
      bubbleBottom: 'bg-blue-100/50',
    },
    {
      id: 'vibrant',
      name: '方案 C - 活力漸變',
      description: '藍紫漸變 (年輕活潑)',
      containerBg: 'bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50',
      containerBorder: 'border-blue-100',
      iconBg: 'bg-gradient-to-br from-cyan-200 via-blue-200 to-purple-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-700',
      descColor: 'text-blue-500',
      primaryBtn: 'bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400',
      primaryBtnHover: 'hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500',
      secondaryBtn: 'bg-white/90 text-blue-600 border-blue-200',
      bubbleTop: 'bg-blue-100/50',
      bubbleBottom: 'bg-cyan-100/50',
    },
  ];

  const NotificationCard = ({ variant }: { variant: (typeof notificationVariants)[0] }) => {
    return (
      <div className="flex flex-col items-center">
        {/* 方案名稱 */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-bold text-slate-800 mb-1">{variant.name}</h3>
          <p className="text-sm text-slate-500">{variant.description}</p>
        </div>

        {/* 通知視窗模擬 */}
        <div className="relative">
          <div
            className={`
              relative overflow-hidden rounded-[32px]
              w-80 max-w-[calc(100vw-2rem)]
              ${variant.containerBg}
              border-2 ${variant.containerBorder}
              shadow-xl
              transition-transform duration-300 hover:scale-105
            `}
          >
            {/* 棉花糖泡泡裝飾 */}
            <div
              className={`absolute top-0 right-0 w-24 h-24 rounded-full ${variant.bubbleTop} blur-3xl`}
              aria-hidden="true"
            />
            <div
              className={`absolute bottom-0 left-0 w-24 h-24 rounded-full ${variant.bubbleBottom} blur-3xl`}
              aria-hidden="true"
            />

            {/* 內容區域 */}
            <div className="relative p-6">
              {/* 圖標區 */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div
                    className={`absolute inset-0 rounded-full ${variant.iconBg.replace('bg-gradient-to-br', 'bg-purple-200')} blur-md opacity-50`}
                  />
                  <div
                    className={`relative w-16 h-16 rounded-full ${variant.iconBg} flex items-center justify-center`}
                  >
                    <svg
                      className={`w-8 h-8 ${variant.iconColor}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 標題 */}
              <h2 className={`text-xl font-bold ${variant.titleColor} mb-2 text-center`}>
                🎉 發現新版本
              </h2>

              {/* 描述 */}
              <p className={`text-sm ${variant.descColor} mb-5 leading-relaxed text-center px-2`}>
                新版本帶來更棒的體驗哦！
              </p>

              {/* 按鈕 */}
              <div className="flex flex-col space-y-2">
                <button
                  className={`
                    w-full px-5 py-3 rounded-[20px]
                    ${variant.primaryBtn}
                    text-white text-sm font-bold
                    shadow-lg
                    ${variant.primaryBtnHover}
                    active:scale-[0.98]
                    transition-all duration-200
                  `}
                >
                  馬上更新
                </button>

                <button
                  className={`
                    w-full px-5 py-3 rounded-[20px]
                    ${variant.secondaryBtn}
                    backdrop-blur-sm
                    text-sm font-semibold
                    border-2
                    hover:bg-white hover:border-opacity-100
                    active:scale-[0.98]
                    transition-all duration-200
                  `}
                >
                  等等再說
                </button>
              </div>
            </div>

            {/* 關閉按鈕 */}
            <button
              className={`
                absolute top-4 right-4 p-2 rounded-full
                bg-white/80 ${variant.titleColor.replace('text-', '').split('-')[0]}-400
                hover:bg-white
                transition-colors
              `}
              aria-label="關閉通知"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 配色說明 */}
        <div className="mt-4 p-4 bg-white rounded-lg shadow-md w-80 max-w-[calc(100vw-2rem)]">
          <h4 className="text-sm font-bold text-slate-700 mb-2">配色詳情</h4>
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${variant.containerBg} border border-slate-200`} />
              <span>背景漸變</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${variant.primaryBtn}`} />
              <span>主要按鈕</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${variant.iconBg} border border-slate-200`} />
              <span>圖標背景</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
            通知視窗配色方案比較
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            根據主應用的 <strong>藍紫色調</strong> 設計，以下是四種配色方案。
            <br />
            請選擇最符合品牌風格且視覺舒適的方案。
          </p>
        </div>

        {/* 主應用配色參考 */}
        <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold text-slate-800 mb-4">📐 主應用配色參考</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">主背景漸變</p>
              <div className="h-16 rounded-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-slate-200" />
              <code className="text-xs text-slate-500 mt-1 block">
                from-blue-50 via-indigo-50 to-purple-50
              </code>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">標題漸變</p>
              <div className="h-16 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600" />
              <code className="text-xs text-slate-500 mt-1 block">from-blue-600 to-purple-600</code>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">按鈕漸變</p>
              <div className="h-16 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500" />
              <code className="text-xs text-slate-500 mt-1 block">from-blue-500 to-purple-500</code>
            </div>
          </div>
        </div>

        {/* 配色方案網格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {notificationVariants.map((variant) => (
            <NotificationCard key={variant.id} variant={variant} />
          ))}
        </div>

        {/* 返回按鈕 */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回主頁
          </a>
        </div>
      </div>
    </div>
  );
}
