/**
 * About Page - 停車好工具
 * Production-quality page with E-E-A-T, hero, features, and privacy policy
 */
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { MapPin, Compass, Palette, Globe, WifiOff } from 'lucide-react';

const FEATURES = [
  { icon: MapPin, titleKey: 'about.feature.gps.title', descKey: 'about.feature.gps.desc' },
  {
    icon: Compass,
    titleKey: 'about.feature.compass.title',
    descKey: 'about.feature.compass.desc',
  },
  { icon: Palette, titleKey: 'about.feature.theme.title', descKey: 'about.feature.theme.desc' },
  { icon: Globe, titleKey: 'about.feature.i18n.title', descKey: 'about.feature.i18n.desc' },
  {
    icon: WifiOff,
    titleKey: 'about.feature.offline.title',
    descKey: 'about.feature.offline.desc',
  },
] as const;

export default function About() {
  const { t } = useTranslation();
  // reduced-motion：進場動效改為直接呈現（initial=false 即以最終狀態渲染）。
  const shouldReduceMotion = useReducedMotion();

  return (
    // 固定亮底（R6 review /about 處方）：比照 Guide，slate 靜態配色不隨主題，
    // 阻絕深主題殘留 --color-bg 造成的對比崩潰。
    <article className="min-h-screen bg-slate-50">
      {/* Hero */}
      <header className="py-16 px-6 text-center">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-3">{t('app.title')}</h1>
          <p className="text-xl text-slate-600">{t('about.subtitle')}</p>
        </motion.div>
      </header>

      {/* Features */}
      <section aria-labelledby="features-heading" className="px-6 pb-12 max-w-2xl mx-auto">
        <motion.h2
          id="features-heading"
          className="text-2xl font-bold text-slate-800 mb-6 text-center"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t('about.features_heading')}
        </motion.h2>
        <ul className="space-y-4">
          {FEATURES.map((item, i) => (
            <motion.li
              key={item.titleKey}
              className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100"
              initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <span className="shrink-0 p-2 rounded-lg bg-slate-200/60" aria-hidden>
                <item.icon className="w-5 h-5 text-slate-700" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-800">{t(item.titleKey)}</h3>
                <p className="text-sm text-slate-600">{t(item.descKey)}</p>
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
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {t('about.privacy_heading')}
        </motion.h2>
        <motion.div
          className="prose prose-slate max-w-none text-slate-600 text-sm space-y-3"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <p>{t('about.privacy_p1')}</p>
          <p>{t('about.privacy_p2')}</p>
          <p>{t('about.privacy_p3')}</p>
        </motion.div>
      </section>

      {/* Author Byline - E-E-A-T */}
      <footer className="px-6 py-8 text-center border-t border-slate-200">
        {/* slate-600（R6 review）：slate-500 on slate-50 僅 4.55:1，axe 取樣偏差下無安全餘裕。 */}
        <motion.p
          className="text-sm text-slate-600"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <a
            href="https://haotool.org"
            rel="author"
            className="inline-block px-3.5 py-3.5 -mx-3.5 -my-3.5 text-slate-600 hover:text-slate-800 transition-colors"
          >
            阿璋 (Ah Zhang)
          </a>
          {' · '}
          <a
            href="https://app.haotool.org/park-keeper/"
            className="inline-block px-3.5 py-3.5 -mx-3.5 -my-3.5 text-slate-600 hover:text-slate-800 transition-colors"
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
