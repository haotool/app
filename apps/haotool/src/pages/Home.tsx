/**
 * Home Page Component
 * Portfolio homepage with hero section, stats, and featured projects
 * [context7:/darkroomengineering/lenis:2025-12-14] - Smooth scroll integration
 * [context7:/websites/motion-dev-docs:2025-12-14] - Framer Motion animations
 * [context7:@react-three/fiber:2025-12-14] - 3D hero integration
 */
import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Github, Sparkles } from 'lucide-react';
import { Counter } from '../components/Counter';
import { ProjectCard } from '../components/ProjectCard';
import { AccordionItem } from '../components/Accordion';
import { STATS, PROJECTS, FAQS, SOCIAL_LINKS } from '../constants';

// Lazy load ThreeHero for better initial load performance
// This splits the 1.4MB Three.js bundle from the main bundle
const ThreeHero = lazy(() => import('../components/ThreeHero'));

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Text reveal animation component
interface TextRevealProps {
  text: string;
  className?: string;
}

function TextReveal({ text, className = '' }: TextRevealProps) {
  const chars = text.split('');
  return (
    <span className={className}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
            show: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: {
                duration: 0.8,
                ease: EASING_NEBULA,
              },
            },
          }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

export default function Home() {
  const [isCtaHovered, setIsCtaHovered] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: EASING_NEBULA,
      },
    },
  };

  const textContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1,
      },
    },
  };

  const featuredProjects = PROJECTS.filter((p) => p.featured);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center pt-24 pb-12 overflow-hidden">
        {/* Ambient backdrop to keep copy legible while showcasing 3D scene */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(45,212,191,0.12),transparent_25%),linear-gradient(120deg,#050505_0%,#050505_45%,transparent_70%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:120px_120px] opacity-40" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 w-full">
          <div className="grid md:grid-cols-[1.05fr_0.95fr] items-center gap-10 lg:gap-14">
            <div className="space-y-6 md:space-y-8 text-left">
              {/* Badge */}
              <motion.div variants={containerVariants} initial="hidden" animate="show">
                <motion.span
                  variants={itemVariants}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase bg-white/5 text-slate-200 rounded-full border border-white/10 backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                  </span>
                  Open for Commissions
                </motion.span>
              </motion.div>

              {/* Main Title */}
              <motion.h1
                variants={textContainerVariants}
                initial="hidden"
                animate="show"
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white leading-[1.05] mb-4 drop-shadow-[0_10px_35px_rgba(0,0,0,0.55)]"
              >
                <div className="overflow-hidden">
                  <TextReveal text="Design" />
                </div>
                <div className="overflow-hidden text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-white to-purple-300 animate-gradient-x">
                  <TextReveal text="Engineering." />
                </div>
              </motion.h1>

              {/* Subtitle */}
              <motion.div
                variants={textContainerVariants}
                initial="hidden"
                animate="show"
                className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed font-light mb-6 md:mb-8"
              >
                <TextReveal text="「HAOTOOL」取自「好工具」的諧音，代表這裡產出的每一個工具，都必須實用且優雅。" />
                <br className="hidden sm:block" />
                <TextReveal text="融合 3D 互動、動態設計與 React 架構，打造令人過目不忘的網頁體驗。" />
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: EASING_NEBULA }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <Link
                  to="/projects"
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-full transition-all hover:bg-slate-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.35)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-300 focus-visible:outline-none"
                  onMouseEnter={() => setIsCtaHovered(true)}
                  onMouseLeave={() => setIsCtaHovered(false)}
                >
                  瀏覽作品
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-x-1">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
                <a
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-full border border-white/10 transition-all hover:border-brand-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-300 focus-visible:outline-none"
                  onMouseEnter={() => setIsCtaHovered(true)}
                  onMouseLeave={() => setIsCtaHovered(false)}
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </motion.div>
            </div>

            <div className="relative h-[320px] sm:h-[440px] md:h-[620px]">
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#020617] to-[#0f172a]">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                      <span className="text-sm text-slate-400 font-mono">Loading 3D Scene...</span>
                    </div>
                  </div>
                }
              >
                <ThreeHero
                  isCtaHovered={isCtaHovered}
                  className="absolute inset-0 right-[-16%] md:right-[-20%] md:w-[125%]"
                />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-6 left-6 md:left-auto md:right-10 hidden md:flex flex-col items-center gap-4 z-20 mix-blend-difference"
        >
          <div className="h-16 w-[1px] bg-gradient-to-b from-transparent via-slate-400 to-transparent" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-y border-white/[0.03] bg-[#020617]/50 backdrop-blur-sm py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-y-10 gap-x-8 md:grid-cols-4">
            {STATS.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-start space-y-1">
                <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  {stat.label}
                </dt>
                <dd className="text-3xl md:text-4xl font-light tracking-tight text-white font-sans">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
            <div className="flex flex-col items-start space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Current Focus
              </div>
              <div className="flex items-center gap-2 text-brand-300 pt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                <span className="font-mono text-xs md:text-sm text-slate-300">
                  Advanced Shaders
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" className="py-20 md:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-12 md:mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: EASING_NEBULA }}
            >
              <h2 className="text-3xl font-bold text-white md:text-5xl tracking-tighter mb-4 md:mb-6">
                Selected Works
              </h2>
              <p className="text-slate-400 max-w-md text-base md:text-lg font-light leading-relaxed">
                結合實用性與娛樂性的數位實驗。
              </p>
            </motion.div>
          </div>

          {/* Projects Grid */}
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {featuredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASING_NEBULA }}
            className="flex justify-center"
          >
            <Link
              to="/projects"
              className="group inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              查看所有作品
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About & FAQ Section */}
      <section
        id="about"
        className="py-20 md:py-24 bg-gradient-to-b from-transparent via-brand-900/10 to-transparent border-y border-white/[0.02] relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Intro Text */}
          <motion.div
            className="max-w-3xl mb-16 md:mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASING_NEBULA }}
          >
            <div className="inline-block mb-6">
              <span className="text-brand-300 font-mono text-xs tracking-wider uppercase border border-brand-500/20 px-2 py-1 rounded bg-brand-500/5 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                About the craft
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-6 md:mb-8 md:text-4xl tracking-tight">
              Bridging Design & Engineering
            </h2>
            <div className="prose prose-invert prose-lg text-slate-400 font-light text-base md:text-lg">
              <p className="mb-6">
                「HAOTOOL」取自「好工具」的諧音，代表這裡產出的每一個專案，都必須是個
                <span className="text-white font-medium">好工具</span>。
              </p>
              <p className="mb-6">
                在程式碼的世界裡，我追求的不僅是功能實現，更是感官的延伸。我相信好的使用者體驗來自於對細節的偏執——從
                <span className="text-slate-200 mx-1 border-b border-brand-500/30">
                  60fps 的流暢度
                </span>
                到
                <span className="text-slate-200 mx-1 border-b border-brand-500/30">
                  像素級的對齊
                </span>
                。
              </p>
            </div>
          </motion.div>

          {/* AI Lab & FAQ Grid */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {/* Left Column: Feature Highlight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASING_NEBULA, delay: 0.1 }}
            >
              <div className="group relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 ring-1 ring-white/5 p-1 transition-all hover:ring-brand-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)] h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-xl bg-[#050505] p-6 md:p-8 overflow-hidden h-full flex flex-col">
                  {/* Subtle Grid Background */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-white">技術堆疊</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">Modern Web Stack</p>
                      </div>
                    </div>

                    <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                      專注於現代 Web 開發技術，追求效能、可維護性與開發體驗的最佳平衡。
                    </p>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      {['React 19', 'TypeScript', 'Tailwind', 'Vite', 'Framer Motion', 'PWA'].map(
                        (tech) => (
                          <span
                            key={tech}
                            className="text-xs font-mono text-brand-300 bg-brand-500/10 px-2 py-1 rounded border border-brand-500/20"
                          >
                            {tech}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: FAQ */}
            <motion.div
              className="flex flex-col h-full"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASING_NEBULA, delay: 0.2 }}
            >
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 md:mb-8">
                FAQ
              </h3>
              <div className="space-y-1">
                {FAQS.map((faq, i) => (
                  <AccordionItem key={i} item={faq} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
