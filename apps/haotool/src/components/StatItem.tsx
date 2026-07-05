import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

interface StatItemProps {
  value: number;
  suffix?: string;
  label: string;
}

const REEL_GLYPHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

interface DigitSpec {
  /** 顯示終值數位。 */
  digit: number;
  /** 滾輪目標 --d：非首位的 0 補尾滾整圈（--d:10），每一位都有動作。 */
  target: number;
  glyphs: readonly number[];
  /** --i 由低位到高位（個位先動，滾輪儀表的機械語意）。 */
  delayIndex: number;
}

function buildDigits(value: number): DigitSpec[] {
  const chars = String(value).split('');
  return chars.map((char, position) => {
    const digit = Number(char);
    const fullCircle = digit === 0 && position > 0;
    return {
      digit,
      target: fullCircle ? 10 : digit,
      glyphs: fullCircle ? [...REEL_GLYPHS, 0] : REEL_GLYPHS,
      delayIndex: chars.length - 1 - position,
    };
  });
}

/**
 * 統計數字 odometer（motion-deep-dive §2 S3，M8 取代 count-up）。
 * SSG 與未觸發前輸出純文字終值（AEO 可讀、無 hydration mismatch）；
 * inView once 換入滾輪結構並於下一幀開始滾動（900ms spring-reveal＋低位優先 stagger）。
 * 統計 0 不滾動——「零」的靜止本身是訊息；reduced-motion 維持純文字路徑。
 * ghost 佔位字承載 baseline 與 tabular 寬度，換入瞬間零抖動。
 */
export default function StatItem({ value, suffix, label }: StatItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reducedMotion = useReducedMotion();
  const [rolled, setRolled] = useState(false);

  const showReel = inView && !reducedMotion && value !== 0;

  useEffect(() => {
    if (!showReel) return undefined;
    // 雙 rAF：--d:0 起手態先完成一次繪製，第二幀設目標數位才會觸發 transition。
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setRolled(true));
    });
    return () => {
      cancelAnimationFrame(first);
      if (second) cancelAnimationFrame(second);
    };
  }, [showReel]);

  const finalText = `${value}${suffix ?? ''}`;

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <p className="text-stat tabular-nums text-text" aria-label={finalText}>
        {showReel ? (
          <span aria-hidden="true">
            {buildDigits(value).map((spec, index) => (
              <span key={index} className="odo-cell">
                <span className="odo-ghost">{spec.digit}</span>
                <span className="odo-window">
                  <span
                    className="odo-reel"
                    style={
                      {
                        '--d': rolled ? spec.target : 0,
                        '--i': spec.delayIndex,
                      } as CSSProperties
                    }
                  >
                    {spec.glyphs.map((glyph, glyphIndex) => (
                      <span key={glyphIndex} className="odo-glyph">
                        {glyph}
                      </span>
                    ))}
                  </span>
                </span>
              </span>
            ))}
            {suffix}
          </span>
        ) : (
          finalText
        )}
      </p>
      <p className="mt-2 text-caption text-text-muted">{label}</p>
    </div>
  );
}
