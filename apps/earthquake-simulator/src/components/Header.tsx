import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';

interface Props {
  onBack: () => void;
  title?: string;
}

const Header: React.FC<Props> = ({ onBack, title = '地震小學堂' }) => {
  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-50 px-6 py-4 flex items-center justify-between">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex items-center space-x-3"
      >
        <motion.div
          initial={{ scale: 0.5, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="w-10 h-10 bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <Logo className="w-full h-full" animate={false} />
        </motion.div>
        <span className="font-black text-slate-800 text-sm tracking-[0.2em] uppercase">
          {title}
        </span>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: '#f1f5f9' }}
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 transition-colors hover:text-sky-500"
        aria-label="返回首頁"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </motion.button>
    </nav>
  );
};

export default Header;
