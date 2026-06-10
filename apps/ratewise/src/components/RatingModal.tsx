/**
 * RatingModal — PWA 五星評分 Modal
 *
 * 功能：
 * - SSR 安全（伺服器端不渲染）
 * - AnimatePresence 底部滑入動畫，與 UpdatePrompt 風格一致
 * - 1-5 星評分 UI，hover/active 互動
 * - 提交至 RATING_API_URL（Cloudflare KV Worker）
 * - 網路失敗時優雅降級（本地關閉，不顯示錯誤）
 * - prefers-reduced-motion 支援
 * - i18n 多語系
 * - ARIA role="dialog" + focus trap
 */
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { notificationTokens } from '../config/design-tokens';
import { notificationAnimations, safeTransition } from '../config/animations';
import type { UseRatingPromptReturn } from '../hooks/useRatingPrompt';

const RATING_API_URL = import.meta.env['VITE_RATING_API_URL'] as string | undefined;

const MIN_RATING = 1;
const MAX_RATING = 5;

type RatingModalProps = UseRatingPromptReturn;

/** SSR 安全入口。 */
export function RatingModal(props: RatingModalProps) {
  if (typeof window === 'undefined') return null;
  return <RatingModalClient {...props} />;
}

function RatingModalClient({
  isVisible,
  markRated,
  snooze,
  dismiss,
  isFinalChance,
}: RatingModalProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  const handleStarClick = useCallback((star: number) => {
    setSelectedStar(star);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedStar === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (RATING_API_URL) {
        await fetch(RATING_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: selectedStar }),
        });
      }
    } catch {
      // 網路失敗時靜默降級，仍視為已評分。
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
      // 1.5 秒後關閉，讓使用者看到感謝訊息。
      setTimeout(() => {
        markRated();
      }, 1500);
    }
  }, [selectedStar, isSubmitting, markRated]);

  const displayStar = hoveredStar || selectedStar;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="rating-modal"
          className={`${notificationTokens.position} pointer-events-none`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rating-modal-title"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={notificationAnimations.enter.variants}
          transition={safeTransition(
            {
              ...notificationAnimations.enter.transition,
              delay: 0.2,
            },
            prefersReducedMotion,
          )}
          onAnimationComplete={() => {
            firstButtonRef.current?.focus();
          }}
        >
          <div
            className={`
              relative overflow-hidden pointer-events-auto ${notificationTokens.borderRadius}
              ${notificationTokens.background.brand}
              ${notificationTokens.background.brandBorder}
              ${notificationTokens.shadow}
            `}
          >
            {/* 裝飾光球（非必要，與 UpdatePrompt 一致） */}
            {!prefersReducedMotion && (
              <>
                <div
                  className={`absolute top-0 right-0 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.topRight} ${notificationTokens.decoration.blur}`}
                  aria-hidden="true"
                />
                <div
                  className={`absolute bottom-0 left-0 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.bottomLeft} ${notificationTokens.decoration.blur}`}
                  aria-hidden="true"
                />
              </>
            )}

            <div className={`relative ${notificationTokens.padding}`}>
              {submitted ? (
                /* 感謝畫面 */
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    🎉
                  </span>
                  <p
                    id="rating-modal-title"
                    className={`text-sm font-semibold ${notificationTokens.text.brandTitle}`}
                  >
                    {t('rating.thankYou')}
                  </p>
                </div>
              ) : (
                /* 評分畫面 */
                <div className="space-y-3">
                  {/* 標題列 */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2
                        id="rating-modal-title"
                        className={`text-sm font-semibold ${notificationTokens.text.brandTitle}`}
                      >
                        {t('rating.title')}
                      </h2>
                      <p className={`mt-0.5 text-xs ${notificationTokens.text.brandDescription}`}>
                        {t('rating.subtitle')}
                      </p>
                    </div>

                    {/* 關閉按鈕 */}
                    <button
                      type="button"
                      ref={firstButtonRef}
                      onClick={isFinalChance ? dismiss : snooze}
                      className={`${notificationTokens.actions.icon} flex-shrink-0`}
                      aria-label={t('rating.dismiss')}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 星評列 */}
                  <div
                    className="flex items-center gap-1.5 justify-center"
                    role="radiogroup"
                    aria-label={t('rating.starsLabel')}
                  >
                    {Array.from({ length: MAX_RATING }, (_, i) => i + MIN_RATING).map((star) => (
                      <StarButton
                        key={star}
                        star={star}
                        filled={star <= displayStar}
                        onClick={handleStarClick}
                        onHover={setHoveredStar}
                        onLeave={() => setHoveredStar(0)}
                        selected={star === selectedStar}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    ))}
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={isFinalChance ? dismiss : snooze}
                      className={notificationTokens.actions.text}
                    >
                      {isFinalChance ? t('rating.dismiss') : t('rating.later')}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleSubmit()}
                      disabled={selectedStar === 0 || isSubmitting}
                      className={`${notificationTokens.actions.primary} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border/70 disabled:hover:bg-surface-elevated disabled:hover:text-text disabled:hover:scale-100`}
                    >
                      {isSubmitting ? t('rating.submitting') : t('rating.submit')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface StarButtonProps {
  star: number;
  filled: boolean;
  selected: boolean;
  prefersReducedMotion: boolean;
  onClick: (star: number) => void;
  onHover: (star: number) => void;
  onLeave: () => void;
}

function StarButton({
  star,
  filled,
  selected,
  prefersReducedMotion,
  onClick,
  onHover,
  onLeave,
}: StarButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${star} 星`}
      onClick={() => onClick(star)}
      onMouseEnter={() => onHover(star)}
      onMouseLeave={onLeave}
      onFocus={() => onHover(star)}
      onBlur={onLeave}
      className={`
        flex h-11 w-11 items-center justify-center rounded-full
        ${prefersReducedMotion ? '' : 'transition-transform duration-100 hover:scale-110 active:scale-95'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
      `}
    >
      <svg
        viewBox="0 0 24 24"
        className={`w-6 h-6 transition-colors duration-100 ${
          filled ? 'fill-favorite stroke-favorite' : 'fill-transparent stroke-text-muted'
        }`}
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    </button>
  );
}
