import type { LearningCoachmarkPlacement, TouchControlToken } from '../core/learning';

const COACHMARK_GAP_PX = 10;
const COACHMARK_SAFE_PX = 12;
const COACHMARK_SAFE_TOP_PX = 64;

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

interface CandidatePosition {
  left: number;
  top: number;
}

function overlaps(
  left: number,
  top: number,
  width: number,
  height: number,
  rect: DOMRect,
): boolean {
  return (
    left < rect.right && left + width > rect.left && top < rect.bottom && top + height > rect.top
  );
}

function overlapArea(
  left: number,
  top: number,
  width: number,
  height: number,
  rect: DOMRect,
): number {
  const overlapWidth = Math.max(0, Math.min(left + width, rect.right) - Math.max(left, rect.left));
  const overlapHeight = Math.max(0, Math.min(top + height, rect.bottom) - Math.max(top, rect.top));
  return overlapWidth * overlapHeight;
}

function controlRects(): DOMRect[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#joy-zone, [data-btn]'))
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
}

/**
 * 位置候選會先避開整個搖桿 hit area 與所有虛擬鍵，而不是只避開被 highlight 的
 * 那顆鍵。卡片內容本身可穿透到遊戲，只有明確的關閉／練習按鈕接收指標，
 * 因此即使 fallback 位置貼近控制區也不會阻斷實作。
 */
export function positionLearningCoachmark(
  root: HTMLElement,
  anchorSelector?: LearningAnchor,
  placement: LearningCoachmarkPlacement = 'auto',
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
  const avoid = controlRects();
  const maxLeft = Math.max(COACHMARK_SAFE_PX, viewportWidth - cardRect.width - COACHMARK_SAFE_PX);
  const maxTop = Math.max(COACHMARK_SAFE_PX, viewportHeight - cardRect.height - COACHMARK_SAFE_PX);
  const centerLeft = (viewportWidth - cardRect.width) / 2;

  const isInsideViewport = ({ left, top }: CandidatePosition): boolean =>
    left >= COACHMARK_SAFE_PX &&
    top >= COACHMARK_SAFE_PX &&
    left + cardRect.width <= viewportWidth - COACHMARK_SAFE_PX &&
    top + cardRect.height <= viewportHeight - COACHMARK_SAFE_PX;

  const isClear = ({ left, top }: CandidatePosition): boolean =>
    avoid.every((rect) => !overlaps(left, top, cardRect.width, cardRect.height, rect));

  const candidates: CandidatePosition[] = [];
  const addCandidate = (left: number, top: number): void => {
    const candidate = { left, top };
    if (isInsideViewport(candidate) && isClear(candidate)) candidates.push(candidate);
  };

  if (anchorRect && placement === 'auto') {
    const isLargeTouchTarget = anchorRect.width >= viewportWidth * 0.4;
    const centeredLeft = anchorRect.left + (anchorRect.width - cardRect.width) / 2;
    const aboveTop = anchorRect.top - cardRect.height - COACHMARK_GAP_PX;
    const belowTop = anchorRect.bottom + COACHMARK_GAP_PX;
    const centeredTop = anchorRect.top + (anchorRect.height - cardRect.height) / 2;

    if (isLargeTouchTarget) {
      // 橫向時 #joy-zone 的右側是控制安全帶；直向時則退回到上方候選。
      addCandidate(anchorRect.right + COACHMARK_GAP_PX, centeredTop);
      addCandidate(anchorRect.left - cardRect.width - COACHMARK_GAP_PX, centeredTop);
    }
    addCandidate(centeredLeft, aboveTop);
    addCandidate(centeredLeft, belowTop);
    addCandidate(centerLeft, aboveTop);
    addCandidate(centerLeft, belowTop);
  } else if (placement === 'bottom') {
    addCandidate(centerLeft, maxTop);
  } else if (placement === 'safe-top') {
    addCandidate(centerLeft, Math.min(COACHMARK_SAFE_TOP_PX, maxTop));
    addCandidate(centerLeft, maxTop);
  } else {
    addCandidate(centerLeft, COACHMARK_SAFE_PX);
    addCandidate(centerLeft, maxTop);
  }

  // 極端尺寸或控制區填滿視窗時仍要保持可見；先用 16px 網格搜尋重疊面積最小的位置，
  // 再以距離原本偏好位置排序。這比無條件置中更能保護搖桿／按鍵的視覺與操作邊界；
  // 實際卡片仍由 CSS pointer-events:none 直通遊戲控制，只有關閉鈕接收指標。
  const axisValues = (limit: number): number[] => {
    const values = [COACHMARK_SAFE_PX];
    for (let value = COACHMARK_SAFE_PX + 16; value < limit; value += 16) values.push(value);
    if (limit > COACHMARK_SAFE_PX) values.push(limit);
    return [...new Set(values)];
  };
  const fallbackPositions = (): CandidatePosition[] => {
    const positions: CandidatePosition[] = [];
    for (const left of axisValues(maxLeft)) {
      for (const top of axisValues(maxTop)) {
        const candidate = { left, top };
        if (isInsideViewport(candidate)) positions.push(candidate);
      }
    }
    return positions;
  };
  const preferredTop =
    placement === 'bottom'
      ? maxTop
      : Math.min(placement === 'safe-top' ? COACHMARK_SAFE_TOP_PX : COACHMARK_SAFE_PX, maxTop);
  const distanceFromPreferred = ({ left, top }: CandidatePosition): number =>
    Math.hypot(left - centerLeft, top - preferredTop);
  const overlapScore = ({ left, top }: CandidatePosition): number =>
    avoid.reduce(
      (total, rect) => total + overlapArea(left, top, cardRect.width, cardRect.height, rect),
      0,
    );
  const selected = candidates[0] ??
    fallbackPositions().reduce<CandidatePosition | null>((best, candidate) => {
      if (!best) return candidate;
      const candidateScore = overlapScore(candidate);
      const bestScore = overlapScore(best);
      return candidateScore < bestScore ||
        (candidateScore === bestScore &&
          distanceFromPreferred(candidate) < distanceFromPreferred(best))
        ? candidate
        : best;
    }, null) ?? {
      left: Math.min(Math.max(centerLeft, COACHMARK_SAFE_PX), maxLeft),
      top: preferredTop,
    };
  root.style.left = `${Math.min(Math.max(selected.left, COACHMARK_SAFE_PX), maxLeft)}px`;
  root.style.top = `${Math.min(Math.max(selected.top, COACHMARK_SAFE_PX), maxTop)}px`;
  root.style.visibility = 'visible';
}

export function addLearningCoachmarkViewportListeners(
  root: HTMLElement,
  anchorSelector?: LearningAnchor,
  placement: LearningCoachmarkPlacement | (() => LearningCoachmarkPlacement) = 'auto',
): () => void {
  const reposition = (): void => {
    const nextPlacement = typeof placement === 'function' ? placement() : placement;
    positionLearningCoachmark(root, anchorSelector, nextPlacement);
  };
  window.addEventListener('resize', reposition, { passive: true });
  window.addEventListener('orientationchange', reposition, { passive: true });
  return () => {
    window.removeEventListener('resize', reposition);
    window.removeEventListener('orientationchange', reposition);
  };
}

const TOUCH_CONTROL_LABELS: Record<TouchControlToken, string> = {
  joystick: '左側圓形搖桿',
  jump: '薄荷綠跳躍鈕',
  action: '珊瑚粉星形鈕',
  transform: '金色變身鈕',
  starburst: '金色星暴鈕',
};

/** 以真正虛擬鍵的顏色、形狀與圖形建立非互動的說明 token。 */
export function appendTouchControlTokens(
  parent: HTMLElement,
  tokens: readonly TouchControlToken[] | undefined,
): void {
  if (!tokens?.length) return;
  const strip = document.createElement('div');
  strip.className = 'learning-control-strip';
  strip.dataset['learningControls'] = 'true';
  strip.setAttribute('aria-label', '對應觸控控制');
  for (const token of tokens) {
    const item = document.createElement('span');
    item.className = 'learning-control-token';
    item.dataset['controlToken'] = token;
    item.setAttribute('role', 'img');
    item.setAttribute('aria-label', TOUCH_CONTROL_LABELS[token]);
    const glyph = document.createElement('span');
    glyph.className = 'learning-control-glyph';
    glyph.setAttribute('aria-hidden', 'true');
    item.appendChild(glyph);
    const label = document.createElement('span');
    label.className = 'learning-control-token-label';
    label.textContent = TOUCH_CONTROL_LABELS[token];
    item.appendChild(label);
    strip.appendChild(item);
  }
  parent.appendChild(strip);
}
