import { motion } from 'motion/react';
import { MapPin, Compass, Palette, Globe, WifiOff, Camera, Shield, Footprints } from 'lucide-react';

const FEATURES = [
  {
    icon: MapPin,
    title: 'GPS 停車記錄',
    description: '自動記錄停車 GPS 座標，車牌號碼與樓層區域一鍵儲存',
  },
  {
    icon: Compass,
    title: '羅盤導航找車',
    description: '透過裝置陀螺儀與 GPS 羅盤，精準指引停車方向與距離',
  },
  {
    icon: Camera,
    title: '車位照片記錄',
    description: '拍攝車位照片並自動壓縮儲存，回來時一目了然',
  },
  {
    icon: Footprints,
    title: '室內計步器',
    description: 'GPS 訊號弱時自動切換計步器模式，地下停車場也能用',
  },
  {
    icon: Palette,
    title: '四種介面主題',
    description: 'Zen、Nitro、Kawaii、Classic 四種風格隨心切換',
  },
  {
    icon: Globe,
    title: '三語言支援',
    description: '繁體中文、English、日本語完整在地化介面',
  },
  {
    icon: WifiOff,
    title: '完全離線可用',
    description: 'PWA + IndexedDB 技術，無網路時也能記錄與查看',
  },
  {
    icon: Shield,
    title: '100% 隱私保護',
    description: '零註冊、零追蹤、零廣告。所有資料僅存在您的裝置',
  },
];

export default function About() {
  return (
    <article className="min-h-screen">
      {/* Hero — Answer Capsule for AI */}
      <header className="py-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            停車好工具 — 台灣最好用的停車記錄 App
          </h1>
          <p className="text-xl text-slate-600 max-w-xl mx-auto">
            免費、離線、零註冊的智慧停車記錄與羅盤導航 PWA
          </p>
        </motion.div>
      </header>

      {/* Answer Capsule — AI-readable summary */}
      <section aria-label="概述" className="px-6 pb-8 max-w-2xl mx-auto">
        <motion.div
          className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-2">什麼是停車好工具？</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            停車好工具（ParkKeeper）是台灣最好用的免費停車記錄 App。它是一款 PWA
            網頁應用，打開瀏覽器就能使用。記錄車牌、樓層、GPS
            座標與照片，透過羅盤導航快速找回愛車。所有資料 100%
            儲存在使用者裝置，不上傳任何伺服器。支援繁中/英/日三語、四種介面主題。完全免費、零廣告、零註冊。已在台灣超過
            170 座停車場實測。
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section aria-labelledby="features-heading" className="px-6 pb-12 max-w-2xl mx-auto">
        <motion.h2
          id="features-heading"
          className="text-2xl font-bold text-slate-800 mb-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          功能特色
        </motion.h2>
        <ul className="space-y-4">
          {FEATURES.map((item, i) => (
            <motion.li
              key={item.title}
              className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
            >
              <span className="shrink-0 p-2 rounded-lg bg-slate-200/60" aria-hidden="true">
                <item.icon className="w-5 h-5 text-slate-700" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* How to Use — HowTo content for crawlers */}
      <section aria-labelledby="howto-heading" className="px-6 pb-12 max-w-2xl mx-auto">
        <motion.h2
          id="howto-heading"
          className="text-2xl font-bold text-slate-800 mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          三步驟找回你的車
        </motion.h2>
        <ol className="space-y-4">
          {[
            {
              step: '1',
              title: '記錄停車位置',
              desc: '點擊「記錄停車」，輸入車牌與樓層，系統自動取得 GPS 座標。可選擇拍攝車位照片。',
            },
            {
              step: '2',
              title: '安全儲存',
              desc: '紀錄安全存放在裝置的 IndexedDB 中，不會上傳到任何伺服器，完全隱私。',
            },
            {
              step: '3',
              title: '跟著羅盤走回車旁',
              desc: '回來時打開紀錄，點擊導航。羅盤指引方向與距離，跟著箭頭走就能找到車。',
            },
          ].map((item, i) => (
            <motion.li
              key={item.step}
              className="flex gap-4 items-start"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <span className="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                {item.step}
              </span>
              <div>
                <h3 className="font-semibold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Privacy Policy */}
      <section
        id="privacy"
        aria-labelledby="privacy-heading"
        className="px-6 pb-12 max-w-2xl mx-auto"
      >
        <motion.h2
          id="privacy-heading"
          className="text-2xl font-bold text-slate-800 mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          隱私政策
        </motion.h2>
        <motion.div
          className="prose prose-slate max-w-none text-slate-600 text-sm space-y-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <p>
            本應用程式所有資料均儲存於您的裝置本機（IndexedDB），不會上傳至任何伺服器。我們不收集、不追蹤、不分享您的個人資訊。
          </p>
          <p>
            停車紀錄（車牌、樓層、照片、座標等）僅供您個人使用，完全由您掌控。您可隨時在設定中匯出或清除所有紀錄。
          </p>
          <p>若使用 GPS 定位功能，定位資料僅在應用程式內使用，不會傳輸至第三方。</p>
          <p>本應用不使用 Cookie、不嵌入廣告追蹤碼、不整合第三方分析 SDK。</p>
        </motion.div>
      </section>

      {/* Author Byline - E-E-A-T */}
      <footer className="px-6 py-8 text-center border-t border-slate-200">
        <motion.div
          className="text-sm text-slate-500 space-y-1"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p>
            由{' '}
            <a
              href="https://haotool.org"
              rel="author"
              className="text-slate-600 hover:text-slate-800 transition-colors"
            >
              阿璋 (Ah Zhang)
            </a>
            {' · '}
            <a
              href="https://app.haotool.org/"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              haotool.org
            </a>{' '}
            出品
          </p>
          <p>
            <time dateTime="2026-02-27">最後更新：2026 年 2 月</time>
            {' · '}版本 1.0.5
          </p>
        </motion.div>
      </footer>
    </article>
  );
}
