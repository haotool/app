/**
 * SourceAccordion - 展開式來源清單組件
 *
 * 高級 app 風格的展開/收合動畫效果
 * [UI/UX 2025-12-04] 和風設計 + 流暢過渡動畫
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ExternalLink, BookOpen, FileText } from 'lucide-react';
import type { SurnameSource } from '../types';

interface SourceAccordionProps {
  /** 來源清單 */
  sources: SurnameSource[];
  /** 變異法說明 */
  description?: string;
  /** 總筆數 */
  count?: number;
}

/**
 * 展開式來源清單
 */
export function SourceAccordion({ sources, description, count }: SourceAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // 計算內容高度以實現流暢動畫
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [sources, description]);

  return (
    <div className="mt-6 border border-stone-200 rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-sm">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left transition-all duration-300 hover:bg-stone-50/80 group"
        aria-expanded={isOpen}
        aria-controls="source-content"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-700 group-hover:bg-red-100 transition-colors">
            <BookOpen size={16} />
          </div>
          <div>
            <span className="font-bold text-stone-700 text-sm">歷史來源與變異法</span>
            {count && <span className="ml-2 text-xs text-stone-400">({count} 筆記錄)</span>}
          </div>
        </div>
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 transition-all duration-300 ease-out ${
            isOpen ? 'rotate-180 bg-red-100' : ''
          }`}
        >
          <ChevronDown
            size={14}
            className={`transition-colors ${isOpen ? 'text-red-600' : 'text-stone-400'}`}
          />
        </div>
      </button>

      {/* Accordion Content with smooth animation */}
      <div
        id="source-content"
        className="overflow-hidden transition-all duration-500 ease-out"
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="border-t border-stone-100">
          {/* 變異法說明 */}
          {description && (
            <div className="px-4 py-3 bg-gradient-to-r from-amber-50/80 to-orange-50/50">
              <div className="flex items-start gap-2">
                <FileText size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-1">變異法說明</p>
                  <p className="text-xs text-amber-700 leading-relaxed">{description}</p>
                </div>
              </div>
            </div>
          )}

          {/* 來源清單 */}
          <div className="p-4 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2">
              參考文獻來源
            </p>
            <div className="space-y-2">
              {sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-3 rounded-lg bg-stone-50/80 hover:bg-red-50/80 border border-transparent hover:border-red-200 transition-all duration-200 transform hover:scale-[1.01]"
                  style={{
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-white shadow-sm text-stone-400 group-hover:text-red-500 group-hover:shadow-md transition-all shrink-0">
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-700 group-hover:text-red-800 transition-colors truncate">
                      {source.title}
                    </p>
                    <p className="text-[10px] text-stone-400 group-hover:text-red-600/70 transition-colors">
                      {source.name}
                    </p>
                  </div>
                  <ExternalLink
                    size={12}
                    className="text-stone-300 group-hover:text-red-500 transition-colors shrink-0 mt-1"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="px-4 pb-4">
            <p className="text-[9px] text-stone-400 text-center leading-relaxed">
              資料來源：國史館臺灣文獻館檔案、學術論文、田野調查
              <br />
              最後更新：2025-12-04
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SourceAccordion;
