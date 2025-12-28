import React from 'react';
import { motion } from 'motion/react';

interface Props {
  tips: string[];
}

const KeyNotesCard: React.FC<Props> = ({ tips }) => {
  return (
    <div className="flex flex-col gap-3">
      {tips.map((tip, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -40, scale: 0.9 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          whileHover={{ x: 5, scale: 1.02, backgroundColor: '#f0f9ff' }}
          transition={{
            type: 'spring',
            damping: 12,
            stiffness: 100,
            delay: i * 0.12,
            opacity: { duration: 0.4 },
          }}
          viewport={{ once: true, margin: '-20px' }}
          className="bg-white px-6 py-5 rounded-[2rem] border border-sky-50 shadow-sm shadow-sky-100/50 flex items-center space-x-5 cursor-default transition-colors"
        >
          <div className="shrink-0 w-12 h-12 bg-sky-100 rounded-[1.25rem] flex items-center justify-center relative overflow-hidden group">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: i * 0.5 }}
              className="relative z-10"
            >
              <svg
                className="w-6 h-6 text-sky-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>
            <div className="absolute inset-0 bg-sky-200/30 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full" />
          </div>
          <p className="text-sm font-black text-slate-700 leading-snug flex-grow">{tip}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default KeyNotesCard;
