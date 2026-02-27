/**
 * About Page - 停車好工具
 * Production-quality page with E-E-A-T, hero, features, and privacy policy
 */
import { motion } from 'motion/react';
import { MapPin, Compass, Palette, Globe, WifiOff } from 'lucide-react';

const FEATURES = [
  {
    icon: MapPin,
    title: 'GPS 記錄',
    description: '自動記錄停車位置座標，地圖一鍵導航找回愛車',
  },
  {
    icon: Compass,
    title: '羅盤導航',
    description: '透過裝置陀螺儀與羅盤，精準指引停車方向與距離',
  },
  {
    icon: Palette,
    title: '多主題介面',
    description: 'Zen、Nitro、Kawaii、Classic 四種風格隨心切換',
  },
  {
    icon: Globe,
    title: '多語言支援',
    description: '繁體中文、English、日本語完整在地化',
  },
  {
    icon: WifiOff,
    title: '離線可用',
    description: 'PWA 技術，無網路時也能使用已儲存的紀錄',
  },
];

export default function About() {
  return (
    <article className="min-h-screen">
      {/* Hero */}
      <header className="py-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-3">停車好工具</h1>
          <p className="text-xl text-slate-600">智慧停車記錄與導航 PWA</p>
        </motion.div>
      </header>

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
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <span className="shrink-0 p-2 rounded-lg bg-slate-200/60" aria-hidden>
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
            本應用程式所有資料均儲存於您的裝置本機，不會上傳至任何伺服器。我們不收集、不追蹤、不分享您的個人資訊。
          </p>
          <p>
            停車紀錄（車牌、樓層、照片、座標等）僅供您個人使用，完全由您掌控。您可隨時在設定中匯出或清除所有紀錄。
          </p>
          <p>若使用 GPS 定位功能，定位資料僅在應用程式內使用，不會傳輸至第三方。</p>
        </motion.div>
      </section>

      {/* Author Byline - E-E-A-T */}
      <footer className="px-6 py-8 text-center border-t border-slate-200">
        <motion.p
          className="text-sm text-slate-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <a
            href="https://haotool.org"
            rel="author"
            className="text-slate-600 hover:text-slate-800 transition-colors"
          >
            阿璋 (Ah Zhang)
          </a>
          {' · '}
          <a
            href="https://app.haotool.org/park-keeper/"
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            haotool.org
          </a>
          {' · '}
          <time dateTime="2026-02-25">2026</time>
        </motion.p>
      </footer>
    </article>
  );
}
