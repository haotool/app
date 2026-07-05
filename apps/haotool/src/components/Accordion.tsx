import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '../config/faq';

interface AccordionProps {
  items: readonly FaqItem[];
}

/**
 * FAQ 手風琴（deep-dive §4.3）：一次僅展開一題；grid-rows 0fr→1fr 240ms 展開。
 * 觸發列 min-height 56px、aria-expanded/aria-controls；reduced-motion 直接切換（CSS 降級）。
 */
export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <li key={item.question} className="rounded-btn border border-border bg-surface">
            <h3>
              <button
                type="button"
                id={`faq-trigger-${index}`}
                aria-expanded={open}
                aria-controls={`faq-panel-${index}`}
                onClick={() => setOpenIndex(open ? null : index)}
                className="press focus-ring flex min-h-14 w-full items-center justify-between gap-4 rounded-btn px-5 py-4 text-left text-[16px] font-semibold text-text hover:bg-background active:bg-surface-sunken"
              >
                {item.question}
                <ChevronDown
                  className="accordion-chevron size-5 shrink-0 text-text-muted"
                  data-open={open}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={`faq-panel-${index}`}
              role="region"
              aria-labelledby={`faq-trigger-${index}`}
              className="accordion-panel"
              data-open={open}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-body-sm leading-[1.7] text-text-muted">
                  {item.answer}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
