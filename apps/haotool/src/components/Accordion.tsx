/**
 * Accordion Component
 * Animated FAQ accordion with smooth expand/collapse
 * [context7:/websites/motion-dev-docs:2025-12-14] - Framer Motion integration
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { FaqItem } from '../constants';

const EASING_NEBULA: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface AccordionItemProps {
  item: FaqItem;
}

export function AccordionItem({ item }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-6 text-left focus:outline-none group"
        aria-expanded={isOpen}
      >
        <span
          className={`text-base md:text-lg font-medium transition-colors duration-300 ${isOpen ? 'text-brand-400' : 'text-slate-200 group-hover:text-white'}`}
        >
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.4, ease: EASING_NEBULA }}
          className={`ml-4 flex-shrink-0 ${isOpen ? 'text-brand-400' : 'text-slate-500'}`}
        >
          <Plus className="h-5 w-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASING_NEBULA }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-slate-400 leading-relaxed font-light">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AccordionItem;
