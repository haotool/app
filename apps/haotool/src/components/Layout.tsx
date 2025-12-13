/**
 * Layout Component
 * Main layout wrapper with navigation and footer
 */
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Github, Twitter } from 'lucide-react';
import { APP_NAME } from '../constants';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Projects', path: '/projects' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change - use ref to track previous pathname
  const prevPathnameRef = React.useRef(location.pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      // Schedule state update for next tick to avoid cascading renders
      queueMicrotask(() => {
        setIsMenuOpen(false);
      });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Navigation */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASING_NEBULA }}
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${isScrolled ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}
        `}
      >
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-lg font-bold tracking-tight hover:text-brand-400 transition-colors"
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
            className="md:hidden p-2 -mr-2 text-slate-400 hover:text-white transition-colors"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      block px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${
                        location.pathname === item.path
                          ? 'bg-brand-500/10 text-brand-400'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main Content */}
      <Outlet />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="text-lg font-bold">{APP_NAME}</span>
              <span className="text-sm text-slate-500">Building digital experiences</span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://github.com/haotool"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/haotool"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
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
