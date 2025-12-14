import React, { useState, Suspense, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence, MotionConfig, Variants } from 'framer-motion';
import Lenis from 'lenis';
import { 
  Github, 
  Twitter, 
  Mail, 
  Sparkles, 
  ArrowRight,
  Check,
  Menu,
  X,
  AtSign // Used for Threads
} from 'lucide-react';
import { PROJECTS, STATS, FAQS, APP_NAME } from './constants';
import { ProjectCategory } from './types';
import ProjectCard, { ProjectCardSkeleton } from './components/ProjectCard';
import AccordionItem from './components/Accordion';
import ThreeHero from './components/ThreeHero';
import SectionBackground from './components/SectionBackground';
import { generateCreativeIdea } from './services/geminiService';

// --- Motion Tokens ---
const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

// --- Sub-components ---

const TextReveal: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  return (
    <span className={className}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
            show: { 
              opacity: 1, 
              y: 0, 
              filter: "blur(0px)",
              transition: { 
                duration: 0.8, 
                ease: EASING_NEBULA 
              } 
            }
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
};

const Counter: React.FC<{ value: string; suffix?: string }> = ({ value, suffix }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const numericValue = parseFloat(value.replace(/,/g, ''));
  const isNumber = !isNaN(numericValue);
  
  const springValue = useSpring(0, {
    damping: 30,
    stiffness: 100,
    mass: 1
  });
  
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView && isNumber) {
      springValue.set(numericValue);
    }
  }, [isInView, numericValue, springValue, isNumber]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(latest);
    });
  }, [springValue]);

  return (
    <span ref={ref} className="tabular-nums">
      {isNumber 
        ? (displayValue % 1 === 0 ? displayValue.toFixed(0) : displayValue.toFixed(1)) 
        : value}
      {suffix && <span className="text-slate-500 text-lg ml-1 font-light">{suffix}</span>}
    </span>
  );
};

const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
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
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onNavigate }) => {
  const menuVariants: Variants = {
    closed: { y: "-100%", opacity: 0 },
    open: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.6, 
        ease: EASING_NEBULA 
      }
    },
    exit: { 
      y: "-100%", 
      opacity: 0,
      transition: { 
        duration: 0.4, 
        ease: [0.33, 1, 0.68, 1] 
      }
    }
  };

  const containerVariants: Variants = {
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    open: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const linkVariants: Variants = {
    closed: { y: 20, opacity: 0 },
    open: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="exit"
          variants={menuVariants}
          className="fixed inset-0 z-40 bg-[#020617]/98 backdrop-blur-2xl pt-32 px-8 flex flex-col md:hidden"
        >
          <motion.div 
            className="flex flex-col gap-10 text-3xl font-light text-white tracking-tight"
            variants={containerVariants}
            initial="closed"
            animate="open"
          >
            {[
              { id: '#projects', label: '作品集' },
              { id: '#about', label: '關於' },
              { id: '#contact', label: '聯繫' }
            ].map((link) => (
              <motion.a 
                key={link.id}
                href={link.id} 
                onClick={(e) => onNavigate(e, link.id)} 
                variants={linkVariants}
                className="border-b border-white/5 pb-6 flex justify-between items-center group cursor-pointer"
                whileTap={{ scale: 0.98, color: "#818cf8" }}
              >
                <span>{link.label}</span>
                <ArrowRight className="text-brand-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>(ProjectCategory.ALL);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Ref for Lenis to control scrolling programmatically
  const lenisRef = useRef<Lenis | null>(null);
  
  // Interaction State for 3D Scene
  const [isCtaHovered, setIsCtaHovered] = useState(false);

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
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLButtonElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false); // Close mobile menu

    // Use Lenis scrollTo if available, otherwise fallback to native
    if (lenisRef.current) {
       lenisRef.current.scrollTo(targetId, {
        offset: -80, // Offset for sticky nav
        duration: 1.5,
      });
    } else {
      // Fallback if Lenis isn't ready
      const element = document.querySelector(targetId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Simulate loading state when category changes
  useEffect(() => {
    setIsProjectLoading(true);
    const timer = setTimeout(() => {
        setIsProjectLoading(false);
    }, 500); // 500ms delay for premium feel
    return () => clearTimeout(timer);
  }, [activeCategory]);

  // Scroll Animations for Navbar
  const { scrollY } = useScroll();
  const navHeight = useTransform(scrollY, [0, 100], [80, 64]);
  const navBackground = useTransform(scrollY, [0, 100], ["rgba(2, 6, 23, 0)", "rgba(2, 6, 23, 0.9)"]);
  const navBackdrop = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(12px)"]);
  const navBorder = useTransform(scrollY, [0, 100], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.05)"]);

  const filteredProjects = activeCategory === ProjectCategory.ALL
    ? PROJECTS
    : PROJECTS.filter(p => p.category === activeCategory);

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse('');
    
    const result = await generateCreativeIdea(aiPrompt);
    setAiResponse(result);
    setIsAiLoading(false);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("contact@haotool.org");
    setToastMessage("Email copied to clipboard");
    setIsEmailCopied(true);
    setTimeout(() => setIsEmailCopied(false), 2000);
  };

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
        ease: EASING_NEBULA 
      }
    },
  };

  const textContainerVariants = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.03,
        delayChildren: 0.1
      }
    },
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-[#020617] text-slate-200 selection:bg-brand-500/30 font-sans overflow-x-hidden">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
          )}
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
            borderColor: navBorder
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
                 <div className="absolute inset-0 bg-brand-500 rounded blur-[3px] opacity-40 group-hover:opacity-80 transition-opacity"/>
                 <div className="relative h-2.5 w-2.5 bg-slate-100 rounded-sm z-10 shadow-sm" />
              </div>
              <span className="font-bold tracking-tight text-white group-hover:text-brand-300 transition-colors">{APP_NAME}</span>
            </motion.div>
            
            {/* Desktop Nav */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASING_NEBULA }}
              className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400"
            >
              <a href="#projects" onClick={(e) => handleNavClick(e, '#projects')} className="hover:text-white transition-colors">作品集</a>
              <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="hover:text-white transition-colors">關於</a>
              <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="hover:text-white transition-colors">聯繫</a>
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(99,102,241,0.16),transparent_35%),radial-gradient(circle_at_82%_0%,rgba(45,212,191,0.12),transparent_25%),linear-gradient(120deg,#050505_0%,#050505_45%,transparent_70%)]" />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:120px_120px] opacity-40" />

          <div className="relative z-10 mx-auto max-w-7xl px-6 grid md:grid-cols-[1.05fr_0.95fr] items-center gap-10 lg:gap-14 w-full">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6 md:space-y-8 text-left"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-900/30 px-3 py-1 w-fit backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                <span className="text-[10px] font-bold text-brand-200 tracking-[0.2em] uppercase">Open for Commissions</span>
              </motion.div>
              
              <motion.h1 
                variants={textContainerVariants}
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white leading-[1.05] mb-4 drop-shadow-[0_10px_35px_rgba(0,0,0,0.55)]"
              >
                <div className="overflow-hidden">
                  <TextReveal text="Design" />
                </div>
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-white to-purple-300 animate-gradient-x">
                  <TextReveal text="Engineering." />
                </div>
              </motion.h1>
              
              <motion.div 
                variants={textContainerVariants} 
                className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed font-light mb-6 md:mb-8"
              >
                <TextReveal text="嗨，我是阿璋。「HAOTOOL」取自「好工具」的諧音，代表我寫的每一行程式都必須實用且優雅。" />
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
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-brand-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] backdrop-blur-sm"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </motion.a>
              </motion.div>
            </motion.div>

            <div className="relative h-[320px] sm:h-[440px] md:h-[620px]">
              <Suspense fallback={null}>
                <ThreeHero isCtaHovered={isCtaHovered} className="absolute inset-0 right-[-18%] md:w-[125%]" />
              </Suspense>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-6 left-6 md:left-auto md:right-10 flex flex-col items-center gap-4 z-20 mix-blend-difference hidden md:flex"
          >
            <div className="h-16 w-[1px] bg-gradient-to-b from-transparent via-slate-400 to-transparent" />
          </motion.div>
        </section>

        {/* Stats / Tech Stack */}
        <section className="relative z-10 border-y border-white/[0.03] bg-[#020617]/50 backdrop-blur-sm py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 gap-y-10 gap-x-8 md:grid-cols-4">
              {STATS.map((stat, idx) => (
                <div key={idx} className="flex flex-col items-start space-y-1">
                  <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{stat.label}</dt>
                  <dd className="text-3xl md:text-4xl font-light tracking-tight text-white font-sans">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </dd>
                </div>
              ))}
              <div className="flex flex-col items-start space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Current Focus</div>
                <div className="flex items-center gap-2 text-brand-300 pt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                  </span>
                  <span className="font-mono text-xs md:text-sm text-slate-300">Advanced Shaders</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-20 md:py-32 relative z-10">
          {/* Auxiliary 3D Background for Projects */}
          <Suspense fallback={null}>
            <SectionBackground />
          </Suspense>

          <div className="mx-auto max-w-7xl px-6 relative z-10">
            <div className="mb-12 md:mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, ease: EASING_NEBULA }}
              >
                <h2 className="text-3xl font-bold text-white md:text-5xl tracking-tighter mb-4 md:mb-6">Selected Works</h2>
                <p className="text-slate-400 max-w-md text-base md:text-lg font-light leading-relaxed">
                  結合實用性與娛樂性的數位實驗。
                </p>
              </motion.div>
              
              {/* Filter Bar */}
              <div 
                role="group" 
                aria-label="Filter projects by category" 
                className="flex flex-wrap gap-2 p-1 rounded-2xl md:rounded-full border border-white/5 bg-slate-900/60 backdrop-blur-xl w-full md:w-auto overflow-x-auto"
              >
                {Object.values(ProjectCategory).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    aria-pressed={activeCategory === category}
                    className={`relative rounded-full px-4 py-2 text-xs md:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                      activeCategory === category ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {activeCategory === category && (
                      <motion.div
                        layoutId="activePill"
                        className="absolute inset-0 rounded-full bg-white/10 border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{category}</span>
                  </button>
                ))}
              </div>
            </div>

            <motion.div 
              layout 
              className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-h-[500px]"
            >
              <AnimatePresence mode='wait'>
                {isProjectLoading ? (
                  // Loading Skeletons
                  Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                      <ProjectCardSkeleton />
                    </motion.div>
                  ))
                ) : (
                  // Actual Projects
                  filteredProjects.map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index} />
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* About & Feature Section */}
        <section id="about" className="py-20 md:py-24 bg-gradient-to-b from-transparent via-brand-900/10 to-transparent border-y border-white/[0.02] relative z-10">
          <div className="mx-auto max-w-7xl px-6">
            
            {/* Intro Text */}
            <motion.div 
               className="max-w-3xl mb-16 md:mb-20"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8, ease: EASING_NEBULA }}
            >
              <div className="inline-block mb-6">
                <span className="text-brand-300 font-mono text-xs tracking-wider uppercase border border-brand-500/20 px-2 py-1 rounded bg-brand-500/5 shadow-[0_0_10px_rgba(99,102,241,0.1)]">About the craft</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-6 md:mb-8 md:text-4xl tracking-tight">Bridging Design & Engineering</h2>
              <div className="prose prose-invert prose-lg text-slate-400 font-light text-base md:text-lg">
                <p className="mb-6">
                  我是阿璋，「HAOTOOL」取自名字諧音，也代表我對產出的堅持：它必須是個<span className="text-white font-medium">好工具</span>。
                </p>
                <p className="mb-6">
                  在程式碼的世界裡，我追求的不僅是功能實現，更是感官的延伸。我相信好的使用者體驗來自於對細節的偏執——從 
                  <span className="text-slate-200 mx-1 border-b border-brand-500/30">60fps 的流暢度</span> 到
                  <span className="text-slate-200 mx-1 border-b border-brand-500/30">像素級的對齊</span>。
                </p>
              </div>
            </motion.div>

            {/* AI Lab & FAQ Grid */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
              
              {/* Left Column: AI Creative Lab */}
              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8, ease: EASING_NEBULA, delay: 0.1 }}
              >
                <div className="group relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 ring-1 ring-white/5 p-1 transition-all hover:ring-brand-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)] h-full">
                   <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                   <div className="relative rounded-xl bg-[#020617] p-6 md:p-8 overflow-hidden h-full flex flex-col">
                      {/* Subtle Grid Background */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

                      <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base md:text-lg font-bold text-white">AI 創意實驗室</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">Powered by Google Gemini 2.5</p>
                          </div>
                        </div>
                        
                        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                          這裡連接我的數位大腦。輸入一個關鍵字，讓 AI 幫你構想下一個有趣的專案。
                        </p>
                        
                        <form onSubmit={handleAiGenerate} className="flex flex-col sm:flex-row gap-2 mt-auto">
                          <input 
                            type="text" 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="輸入關鍵字 (e.g., 咖啡, 旅行)..."
                            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50 outline-none transition-all hover:bg-white/[0.07]"
                          />
                          <button 
                            type="submit"
                            disabled={isAiLoading || !aiPrompt}
                            className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                          >
                            {isAiLoading ? 'Thinking...' : 'Generate'}
                          </button>
                        </form>

                        {aiResponse && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 pt-6 border-t border-white/5"
                          >
                            <div className="text-brand-100 text-sm leading-7 whitespace-pre-line font-light tracking-wide">
                              {aiResponse}
                            </div>
                          </motion.div>
                        )}
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

        {/* Footer */}
        <footer id="contact" className="border-t border-white/5 bg-[#020617] py-12 md:py-20 relative z-10">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-10">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight mb-2">{APP_NAME}</h2>
                <p className="text-slate-600 text-xs font-mono">
                  ENGINEERED BY AH ZHANG.
                  <br className="md:hidden"/>
                  © {new Date().getFullYear()}
                </p>
              </div>

              <div className="flex gap-4 md:gap-6">
                {[
                  { icon: AtSign, href: "#", label: "Threads" },
                  { icon: Github, href: "#", label: "GitHub" },
                  { icon: Mail, href: "#", label: "Email" },
                ].map((item, i) => {
                  const isEmail = item.label === "Email";
                  return (
                    <motion.a 
                      key={i}
                      href={item.href} 
                      onClick={(e) => {
                        if (isEmail) {
                          e.preventDefault();
                          copyEmail();
                        }
                      }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative flex items-center justify-center p-3 md:p-2 rounded-full bg-white/5 md:bg-transparent transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] ring-1 ring-transparent hover:ring-white/20"
                      aria-label={item.label}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {isEmail && isEmailCopied ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Check className="h-5 w-5 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="icon"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <item.icon className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors duration-300" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
};

export default App;
