/**
 * Toast Component - Notification toast with automatic dismissal
 * [update:2025-12-16] - Added from .example/haotool.org-v1.0.6
 * [context7:/websites/motion-dev-docs:2025-12-16]
 */
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
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

export default Toast;
