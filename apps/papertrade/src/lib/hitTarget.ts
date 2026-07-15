// 44px 觸控目標防回歸：互動元件必須同時帶高度與寬度保證 class（或位於帶保證 class 的 label 內）。
const APPROVED_HEIGHT_PATTERN =
  /(?:^|\s)(?:h-11|h-12|h-14|min-h-11|min-h-12|min-h-13|min-h-16|size-11|inset-0)(?:\s|$)/;

// 寬度刻意不接受裸 flex-1：窄容器多顆均分時實寬可低於 44px（P2-1 前例），必須明確宣告最小寬度。
const APPROVED_WIDTH_PATTERN = /(?:^|\s)(?:w-full|min-w-11|min-w-12|size-11|inset-0)(?:\s|$)/;

const INTERACTIVE_SELECTOR = 'button, a[href], input, select, textarea';

export function findHitTargetViolations(root: ParentNode): string[] {
  const violations: string[] = [];
  for (const element of root.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)) {
    const ownClass = element.className;
    const labelClass = element.closest('label')?.className ?? '';
    const heightOk =
      APPROVED_HEIGHT_PATTERN.test(ownClass) || APPROVED_HEIGHT_PATTERN.test(labelClass);
    const widthOk =
      APPROVED_WIDTH_PATTERN.test(ownClass) || APPROVED_WIDTH_PATTERN.test(labelClass);
    if (heightOk && widthOk) continue;
    const missing = [heightOk ? null : 'height', widthOk ? null : 'width']
      .filter((item) => item !== null)
      .join('+');
    const name = element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '';
    violations.push(
      `${element.tagName.toLowerCase()}[${name.slice(0, 24)}] missing=${missing} class="${ownClass}"`,
    );
  }
  return violations;
}
