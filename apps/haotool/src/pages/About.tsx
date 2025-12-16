/**
 * About Page Component
 * Personal introduction and tech stack
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Palette, Zap, Heart } from 'lucide-react';
import { AccordionItem } from '../components/Accordion';
import { FAQS, SOCIAL_LINKS } from '../constants';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

const SKILLS = [
  {
    icon: Code2,
    title: '前端開發',
    description: '使用 React, TypeScript, Tailwind CSS 打造高效能的現代 Web 應用。',
    techs: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vite', 'Next.js'],
  },
  {
    icon: Palette,
    title: 'UI/UX 設計',
    description: '注重使用者體驗，從原型設計到動態效果的完整實現。',
    techs: ['Framer Motion', 'Figma', 'Responsive Design', 'A11y'],
  },
  {
    icon: Zap,
    title: '效能優化',
    description: '追求極致的載入速度與互動流暢度，Lighthouse 滿分不是終點。',
    techs: ['PWA', 'SSG/SSR', 'Web Vitals', 'Bundle Optimization'],
  },
  {
    icon: Heart,
    title: '開源貢獻',
    description: '相信開源文化能促進技術交流，所有專案皆開源於 GitHub。',
    techs: ['Git', 'GitHub Actions', 'CI/CD', 'Documentation'],
  },
];

export default function About() {
  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASING_NEBULA }}
          className="max-w-3xl mb-16"
        >
          <span className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20">
            About Me
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            關於{' '}
            <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              阿璋
            </span>
          </h1>
          <div className="prose prose-invert prose-lg text-slate-400 font-light">
            <p className="text-xl leading-relaxed mb-6">
              嗨，我是阿璋。一位將程式碼雕琢為數位藝術的全端開發者。
            </p>
            <p className="mb-6">
              我是阿璋。HAOTOOL 取自「好工具」的諧音，這代表我對產出的堅持：它必須是個
              <span className="text-white font-medium">好工具</span>。
            </p>
            <p>
              在程式碼的世界裡，我追求的不僅是功能實現，更是感官的延伸。我相信好的使用者體驗來自於對細節的偏執——從
              <span className="text-slate-200 mx-1 border-b border-brand-500/30">
                60fps 的流暢度
              </span>{' '}
              到
              <span className="text-slate-200 mx-1 border-b border-brand-500/30">像素級的對齊</span>
              。
            </p>
          </div>
        </motion.div>

        {/* Skills Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASING_NEBULA }}
          className="grid sm:grid-cols-2 gap-6 mb-20"
        >
          {SKILLS.map((skill, index) => (
            <motion.div
              key={skill.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: EASING_NEBULA }}
              className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-500/30 hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 group-hover:bg-brand-500/20 transition-colors">
                  <skill.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{skill.title}</h3>
                  <p className="text-sm text-slate-400 mb-4">{skill.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {skill.techs.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-1 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASING_NEBULA }}
          className="mb-20"
        >
          <h2 className="text-2xl font-bold text-white mb-8">常見問題</h2>
          <div className="space-y-1">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} item={faq} />
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASING_NEBULA }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">有興趣合作？</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            歡迎透過 Email、Threads 或 GitHub 與我聯繫，讓我們一起打造令人驚艷的數位體驗。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-medium rounded-full transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
            >
              聯繫我
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href={SOCIAL_LINKS.threads}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-medium rounded-full border border-purple-500/20 transition-all"
            >
              Threads (@阿璋)
            </a>
            <a
              href={SOCIAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-full border border-white/10 transition-all"
            >
              查看 GitHub
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
