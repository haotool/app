/**
 * MobileMenu Component - Full-screen mobile navigation overlay
 * [update:2025-12-16] - Added from .example/haotool.org-v1.0.6
 * [context7:/websites/motion-dev-docs:2025-12-16]
 */
import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onNavigate }) => {
  const menuVariants: Variants = {
    closed: { y: '-100%', opacity: 0 },
    open: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: EASING_NEBULA,
      },
    },
    exit: {
      y: '-100%',
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: [0.33, 1, 0.68, 1],
      },
    },
  };

  const containerVariants: Variants = {
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    open: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const linkVariants: Variants = {
    closed: { y: 20, opacity: 0 },
    open: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  const navLinks = [
    { id: '#projects', label: '作品集' },
    { id: '#about', label: '關於' },
    { id: '#contact', label: '聯繫' },
  ];

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
            {navLinks.map((link) => (
              <motion.a
                key={link.id}
                href={link.id}
                onClick={(e) => {
                  onNavigate(e, link.id);
                  onClose();
                }}
                variants={linkVariants}
                className="border-b border-white/5 pb-6 flex justify-between items-center group cursor-pointer"
                whileTap={{ scale: 0.98, color: '#818cf8' }}
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

export default MobileMenu;
