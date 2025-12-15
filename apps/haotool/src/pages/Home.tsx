/**
 * Home Page Component
 * Portfolio homepage with hero section, stats, and featured projects
 * [update:2025-12-16] - Aligned with .example/haotool.org-v1.0.6
 * [context7:/darkroomengineering/lenis:2025-12-16] - Smooth scroll integration
 * [context7:/websites/motion-dev-docs:2025-12-16] - Framer Motion animations
 * [context7:@react-three/fiber:2025-12-16] - 3D hero integration
 */
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, MotionConfig } from 'framer-motion';
import Lenis from 'lenis';
import { ArrowRight, Github, Sparkles, Menu, X, Check } from 'lucide-react';
import { Counter } from '../components/Counter';
import { ProjectCard } from '../components/ProjectCard';
import { AccordionItem } from '../components/Accordion';
import { STATS, PROJECTS, FAQS, SOCIAL_LINKS, APP_NAME } from '../constants';
import MobileMenu from '../components/MobileMenu';

// Lazy load ThreeHero for better initial load performance
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

// Toast notification component
interface ToastProps {
  message: string;
  onClose: () => void;
}

function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ ease: EASING_NEBULA, duration: 0.4 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] whitespace-nowrap"
    >
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 text-green-400">
        <Check className="w-3 h-3" />
      </div>
      <span className="text-sm font-medium text-white">{message}</span>
    </motion.div>
  );
}

export default function Home() {
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Lock/Unlock scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      lenisRef.current?.stop();
    } else {
      lenisRef.current?.start();
    }
  }, [isMobileMenuOpen]);

  // Universal Navigation Handler
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLButtonElement>,
    targetId: string,
  ) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetId, {
        offset: -80,
        duration: 1.5,
      });
    } else {
      const element = document.querySelector(targetId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll Animations for Navbar
  const { scrollY } = useScroll();
  const navHeight = useTransform(scrollY, [0, 100], [80, 64]);
  const navBackground = useTransform(
    scrollY,
    [0, 100],
    ['rgba(2, 6, 23, 0)', 'rgba(2, 6, 23, 0.9)'],
  );
  const navBackdrop = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(12px)']);
  const navBorder = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.05)'],
  );

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

  const copyEmail = () => {
    void navigator.clipboard.writeText('contact@haotool.org');
    setToastMessage('Email copied to clipboard');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-[#020617] text-slate-200 selection:bg-brand-500/30 font-sans overflow-x-hidden">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </AnimatePresence>

        {/* Deep Space Background Gradients */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[1200px] h-[1200px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-900/30 via-[#020617]/0 to-transparent blur-[120px] opacity-60" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#020617]/0 to-transparent blur-[100px] opacity-40" />
        </div>

        {/* Navigation */}
        <motion.nav
          style={{
            height: navHeight,
            backgroundColor: navBackground,
            backdropFilter: navBackdrop,
            borderBottom: `1px solid`,
            borderColor: navBorder,
          }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center"
        >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: EASING_NEBULA }}
              className="flex items-center gap-3 group cursor-pointer z-50"
              onClick={(e) => {
                e.preventDefault();
                if (lenisRef.current) lenisRef.current.scrollTo(0);
                else window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="relative h-6 w-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-brand-500 rounded blur-[3px] opacity-40 group-hover:opacity-80 transition-opacity" />
                <div className="relative h-2.5 w-2.5 bg-slate-100 rounded-sm z-10 shadow-sm" />
              </div>
              <span className="font-bold tracking-tight text-white group-hover:text-brand-300 transition-colors">
                {APP_NAME}
              </span>
            </motion.div>

            {/* Desktop Nav */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASING_NEBULA }}
              className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400"
            >
              <a
                href="#projects"
                onClick={(e) => handleNavClick(e, '#projects')}
                className="hover:text-white transition-colors"
              >
                作品集
              </a>
              <a
                href="#about"
                onClick={(e) => handleNavClick(e, '#about')}
                className="hover:text-white transition-colors"
              >
                關於
              </a>
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, '#contact')}
                className="hover:text-white transition-colors"
              >
                聯繫
              </a>
            </motion.div>

            <div className="flex items-center gap-4">
              <motion.a
                href="#contact"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '#contact')}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: EASING_NEBULA }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:block rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-colors border border-white/5 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:border-brand-500/20"
              >
                Contact
              </motion.a>

              {/* Mobile Hamburger */}
              <button
                className="md:hidden z-50 text-white p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </motion.nav>

        {/* Mobile Menu Overlay */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onNavigate={handleNavClick}
        />

        {/* Hero Section */}
        <section className="relative flex min-h-screen items-center pt-24 pb-12 overflow-hidden">
          {/* Main 3D Background - Full screen absolute positioning */}
          <Suspense fallback={null}>
            <ThreeHero isCtaHovered={isCtaHovered} />
          </Suspense>

          {/* Mobile Overlay to ensure text readability against 3D */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/50 md:hidden z-0 pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl px-6 grid md:grid-cols-12 gap-8 md:gap-12 items-center w-full pointer-events-none">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="md:col-span-8 lg:col-span-7 pointer-events-auto"
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-900/30 px-3 py-1 mb-6 md:mb-8 backdrop-blur-md"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                <span className="text-[10px] font-bold text-brand-200 tracking-[0.2em] uppercase">
                  Open for Commissions
                </span>
              </motion.div>

              <motion.h1
                variants={textContainerVariants}
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white leading-[1.1] mb-6"
              >
                <div className="overflow-hidden">
                  <TextReveal text="Design" />
                </div>
                {/* Fixed: Use a single unified motion span for 'Engineering.' to guarantee correct gradient display.
                    Background clipping on split text components (inline-blocks) is unreliable in many browsers. */}
                <motion.span
                  initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.0, ease: EASING_NEBULA, delay: 0.2 }}
                  className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-white to-purple-300 animate-gradient-x pb-2 pr-1"
                >
                  Engineering.
                </motion.span>
              </motion.h1>

              <motion.div
                variants={textContainerVariants}
                className="text-base sm:text-lg text-slate-300 md:text-slate-400 max-w-lg leading-relaxed font-light mb-8 md:mb-10 shadow-black drop-shadow-md md:drop-shadow-none"
              >
                <TextReveal text="「HAOTOOL」取自「好工具」的諧音，代表這裡產出的每一個工具，都必須實用且優雅。" />
                <br className="hidden sm:block" />
                <TextReveal text="融合 3D 互動、動態設計與 React 架構，打造令人過目不忘的網頁體驗。" />
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                <a
                  href="#projects"
                  onClick={(e) => handleNavClick(e, '#projects')}
                  onMouseEnter={() => setIsCtaHovered(true)}
                  onMouseLeave={() => setIsCtaHovered(false)}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className="group relative flex items-center gap-2 rounded-full bg-white pl-8 pr-6 py-3.5 text-sm font-bold text-black transition-all hover:bg-slate-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer"
                  >
                    瀏覽作品
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-x-1">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </motion.div>
                </a>
                <motion.a
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onMouseEnter={() => setIsCtaHovered(true)}
                  onMouseLeave={() => setIsCtaHovered(false)}
                  className="group flex items-center gap-2 rounded-full bg-white/5 px-6 py-3.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-brand-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] backdrop-blur-md"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </motion.a>
              </motion.div>
            </motion.div>
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
              <a
                href="#projects"
                onClick={(e) => handleNavClick(e, '#projects')}
                className="group inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium transition-colors"
              >
                查看所有作品
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
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

            {/* Feature & FAQ Grid */}
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
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            Modern Web Stack
                          </p>
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

        {/* Contact Section */}
        <section id="contact" className="py-20 md:py-32 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASING_NEBULA }}
            >
              <h2 className="text-3xl font-bold text-white md:text-5xl tracking-tighter mb-6">
                Let&apos;s Build Something
              </h2>
              <p className="text-slate-400 max-w-md mx-auto text-base md:text-lg font-light leading-relaxed mb-10">
                有專案想法？或只是想聊聊技術？隨時歡迎聯繫。
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={copyEmail}
                  className="group relative flex items-center gap-2 rounded-full bg-white pl-8 pr-6 py-3.5 text-sm font-bold text-black transition-all hover:bg-slate-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer"
                >
                  複製 Email
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-x-1">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </motion.button>

                <motion.a
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="group flex items-center gap-2 rounded-full bg-white/5 px-6 py-3.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-brand-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] backdrop-blur-md"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </motion.a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.03] py-8 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-5 w-5 flex items-center justify-center">
                  <div className="absolute inset-0 bg-brand-500 rounded blur-[2px] opacity-40" />
                  <div className="relative h-2 w-2 bg-slate-100 rounded-sm z-10" />
                </div>
                <span className="text-sm text-slate-500">
                  © 2025 {APP_NAME}. All rights reserved.
                </span>
              </div>

              <div className="flex items-center gap-6">
                <a
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
