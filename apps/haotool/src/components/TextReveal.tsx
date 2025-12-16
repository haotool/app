/**
 * TextReveal Component - Character-by-character text animation with blur effect
 * [update:2025-12-16] - Added from .example/haotool.org-v1.0.6
 * [context7:/websites/motion-dev-docs:2025-12-16]
 */
import React from 'react';
import { motion } from 'framer-motion';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface TextRevealProps {
  text: string;
  className?: string;
}

export const TextReveal: React.FC<TextRevealProps> = ({ text, className = '' }) => {
  return (
    <span className={className}>
      {text.split('').map((char, i) => (
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
};

export default TextReveal;
