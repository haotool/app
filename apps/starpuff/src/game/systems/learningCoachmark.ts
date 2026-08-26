const COACHMARK_GAP_PX = 10;
const COACHMARK_SAFE_PX = 8;

export function clearLearningFocus(): void {
  document.querySelectorAll('.learning-focus, .guidance-focus').forEach((element) => {
    element.classList.remove('learning-focus', 'guidance-focus');
  });
}

/**
 * 將提示放到真正控制元件旁邊。座標取自 getBoundingClientRect，因此能跟著
 * 直持旋轉殼、按鈕配置與 viewport resize 更新；root 本身不攔截遊戲 pointer。
 */
export type LearningAnchor = string | (() => string | undefined);

function resolveAnchor(anchor: LearningAnchor | undefined): string | undefined {
  return typeof anchor === 'function' ? anchor() : anchor;
}

export function positionLearningCoachmark(
  root: HTMLElement,
  anchorSelector?: LearningAnchor,
): void {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const card = root.querySelector<HTMLElement>('[data-learning-card]') ?? root.firstElementChild;
  if (!card) return;

  root.style.visibility = 'hidden';
  root.style.left = `${COACHMARK_SAFE_PX}px`;
  root.style.top = `${COACHMARK_SAFE_PX}px`;
  root.style.transform = 'none';
  const cardRect = card.getBoundingClientRect();
  const selector = resolveAnchor(anchorSelector);
  const anchor = selector ? document.querySelector<HTMLElement>(selector) : null;
  const anchorRect = anchor?.getBoundingClientRect();

  let left = (viewportWidth - cardRect.width) / 2;
  let top = COACHMARK_SAFE_PX;
  if (anchorRect) {
    const isLargeTouchTarget = anchorRect.width >= viewportWidth * 0.4;
    const rightSideLeft = anchorRect.right + COACHMARK_GAP_PX;
    const leftSideLeft = anchorRect.left - cardRect.width - COACHMARK_GAP_PX;
    if (isLargeTouchTarget && rightSideLeft + cardRect.width <= viewportWidth - COACHMARK_SAFE_PX) {
      // #joy-zone is intentionally a large hit area rather than a small button. On a short
      // landscape viewport, place the compact practice card in the adjacent safe lane instead
      // of treating the entire hit area as a visual anchor and covering its touch surface.
      left = rightSideLeft;
    } else if (isLargeTouchTarget && leftSideLeft >= COACHMARK_SAFE_PX) {
      left = leftSideLeft;
    } else {
      left = anchorRect.left + (anchorRect.width - cardRect.width) / 2;
    }
    const aboveTop = anchorRect.top - cardRect.height - COACHMARK_GAP_PX;
    const belowTop = anchorRect.bottom + COACHMARK_GAP_PX;
    top = aboveTop >= COACHMARK_SAFE_PX ? aboveTop : belowTop;
    if (top + cardRect.height > viewportHeight - COACHMARK_SAFE_PX) {
      top = Math.max(COACHMARK_SAFE_PX, aboveTop);
    }
  }

  const maxLeft = Math.max(COACHMARK_SAFE_PX, viewportWidth - cardRect.width - COACHMARK_SAFE_PX);
  const maxTop = Math.max(COACHMARK_SAFE_PX, viewportHeight - cardRect.height - COACHMARK_SAFE_PX);
  root.style.left = `${Math.min(Math.max(left, COACHMARK_SAFE_PX), maxLeft)}px`;
  root.style.top = `${Math.min(Math.max(top, COACHMARK_SAFE_PX), maxTop)}px`;
  root.style.visibility = 'visible';
}

export function addLearningCoachmarkViewportListeners(
  root: HTMLElement,
  anchorSelector?: LearningAnchor,
): () => void {
  const reposition = (): void => positionLearningCoachmark(root, anchorSelector);
  window.addEventListener('resize', reposition, { passive: true });
  window.addEventListener('orientationchange', reposition, { passive: true });
  return () => {
    window.removeEventListener('resize', reposition);
    window.removeEventListener('orientationchange', reposition);
  };
}
