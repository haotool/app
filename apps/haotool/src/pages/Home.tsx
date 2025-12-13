/**
 * Home Page Component
 * Portfolio homepage with hero section, stats, and featured projects
 * [context7:/darkroomengineering/lenis:2025-12-14] - Smooth scroll integration
 * [context7:/websites/motion-dev-docs:2025-12-14] - Framer Motion animations
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Github, Sparkles } from 'lucide-react';
import { Counter } from '../components/Counter';
import { ProjectCard } from '../components/ProjectCard';
import { AccordionItem } from '../components/Accordion';
import { STATS, PROJECTS, FAQS, SOCIAL_LINKS } from '../constants';

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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] animate-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-8">
            <motion.span
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase bg-white/5 text-slate-300 rounded-full border border-white/10 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Open for Projects
            </motion.span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            variants={textContainerVariants}
            initial="hidden"
            animate="show"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <div className="overflow-hidden">
              <TextReveal text="Design" className="text-white" />
            </div>
            <div className="overflow-hidden">
              <TextReveal
                text="Engineering."
                className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x"
              />
            </div>
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            variants={textContainerVariants}
            initial="hidden"
            animate="show"
            className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10"
          >
            <TextReveal text="嗨，我是阿璋。我將程式碼雕琢為" />
            <span className="text-white font-medium">
              <TextReveal text="數位藝術" />
            </span>
            <TextReveal text="。" />
            <br className="hidden sm:block" />
            <TextReveal text="融合現代 Web 技術與動態設計，打造令人過目不忘的使用者體驗。" />
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASING_NEBULA }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/projects"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-full transition-all hover:bg-slate-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-full border border-white/10 transition-all hover:border-brand-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] backdrop-blur-sm"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-6 w-6 text-slate-500 animate-bounce" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 bg-[#0a0a0a]/50 border-y border-white/[0.03]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: EASING_NEBULA }}
                className="text-center md:text-left"
              >
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASING_NEBULA }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20">
              Featured Works
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              精選{' '}
              <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
                作品
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              結合實用性與美學的數位作品，每一個專案都追求極致的使用者體驗。
            </p>
          </motion.div>

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
        className="py-20 md:py-24 bg-gradient-to-b from-transparent via-brand-900/10 to-transparent border-y border-white/[0.02]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
                我是阿璋，「HAOTOOL」取自名字諧音，也代表我對產出的堅持：它必須是個
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
