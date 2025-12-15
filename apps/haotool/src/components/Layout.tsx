/**
 * Layout Component
 * Main layout wrapper with navigation, smooth scrolling, and footer
 * [context7:/darkroomengineering/lenis:2025-12-14] - Lenis smooth scroll integration
 */
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Menu, X, Github, AtSign, Mail, Check, ArrowRight } from 'lucide-react';
import { APP_NAME, SOCIAL_LINKS } from '../constants';
import { useLenis } from '../hooks/useLenis';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Projects', path: '/projects' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const location = useLocation();

  // Initialize Lenis smooth scroll
  const { scrollTo, stop, start } = useLenis();

  // Scroll animations for navbar
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

  // Lock/Unlock scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      stop();
    } else {
      start();
    }
  }, [isMenuOpen, stop, start]);

  // Close menu on route change
  const prevPathnameRef = React.useRef(location.pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      queueMicrotask(() => {
        setIsMenuOpen(false);
      });
    }
  }, [location.pathname]);

  // Navigation handler for smooth scrolling
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    // Only handle hash links
    if (targetId.startsWith('#')) {
      e.preventDefault();
      setIsMenuOpen(false);
      scrollTo(targetId, {
        offset: -80,
        duration: 1.5,
      });
    }
  };

  // Copy email to clipboard
  const copyEmail = () => {
    void navigator.clipboard.writeText(SOCIAL_LINKS.email);
    setToastMessage('Email copied to clipboard');
    setIsEmailCopied(true);
    setTimeout(() => setIsEmailCopied(false), 2000);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-200 selection:bg-brand-500/30 font-sans overflow-x-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
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
            <span className="text-sm font-medium text-white">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASING_NEBULA }}
        style={{
          height: navHeight,
          backgroundColor: navBackground,
          backdropFilter: navBackdrop,
          borderBottom: '1px solid',
          borderColor: navBorder,
        }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center"
      >
        <nav className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-lg font-bold tracking-tight hover:text-brand-400 transition-colors z-50"
          >
            {APP_NAME}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  text-sm font-medium transition-colors relative
                  ${
                    location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path))
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }
                `}
              >
                {item.label}
                {(location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 -mr-2 text-slate-400 hover:text-white transition-colors z-50"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ y: '-100%', opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                transition: {
                  duration: 0.6,
                  ease: EASING_NEBULA,
                },
              }}
              exit={{
                y: '-100%',
                opacity: 0,
                transition: {
                  duration: 0.4,
                  ease: [0.33, 1, 0.68, 1],
                },
              }}
              className="fixed inset-0 z-40 bg-[#020617]/98 backdrop-blur-2xl pt-32 px-8 flex flex-col md:hidden"
            >
              <motion.div
                className="flex flex-col gap-10 text-3xl font-light text-white tracking-tight"
                variants={{
                  closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
                  open: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
                }}
                initial="closed"
                animate="open"
              >
                {NAV_ITEMS.map((item) => (
                  <motion.div
                    key={item.path}
                    variants={{
                      closed: { y: 20, opacity: 0 },
                      open: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
                    }}
                    className="border-b border-white/5 pb-6 flex justify-between items-center group cursor-pointer"
                    whileTap={{ scale: 0.98, color: '#818cf8' }}
                  >
                    <Link
                      to={item.path}
                      onClick={(e) => handleNavClick(e, item.path)}
                      className="w-full flex justify-between items-center"
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="text-brand-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main Content */}
      <Outlet />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#020617] py-12 md:py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10">
            <div className="flex flex-col items-center md:items-start">
              <h2 className="text-xl font-bold text-white tracking-tight mb-2">{APP_NAME}</h2>
              <p className="text-slate-600 text-xs font-mono">
                ENGINEERED BY AH ZHANG.
                <br className="md:hidden" />© {new Date().getFullYear()}
              </p>
            </div>

            <div className="flex gap-4 md:gap-6">
              {[
                { icon: AtSign, href: SOCIAL_LINKS.threads, label: 'Threads' },
                { icon: Github, href: SOCIAL_LINKS.github, label: 'GitHub' },
                { icon: Mail, href: '#', label: 'Email', isEmail: true },
              ].map((item, i) => (
                <motion.a
                  key={i}
                  href={item.href}
                  onClick={(e) => {
                    if (item.isEmail) {
                      e.preventDefault();
                      copyEmail();
                    }
                  }}
                  target={item.isEmail ? undefined : '_blank'}
                  rel={item.isEmail ? undefined : 'noopener noreferrer'}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative flex items-center justify-center p-3 md:p-2 rounded-full bg-white/5 md:bg-transparent transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] ring-1 ring-transparent hover:ring-white/20"
                  aria-label={item.label}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {item.isEmail && isEmailCopied ? (
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
              ))}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
