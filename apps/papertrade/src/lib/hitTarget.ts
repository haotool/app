// 44px 觸控目標防回歸：互動元件必須帶下列尺寸 class 之一（或位於帶尺寸 class 的 label 內）。
const APPROVED_SIZE_PATTERN =
  /(?:^|\s)(?:h-11|h-12|h-14|min-h-11|min-h-12|min-h-13|min-h-16|size-11|inset-0)(?:\s|$)/;

const INTERACTIVE_SELECTOR = 'button, a[href], input, select, textarea';

export function findHitTargetViolations(root: ParentNode): string[] {
  const violations: string[] = [];
  for (const element of root.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)) {
    const ownClass = element.className;
    const labelClass = element.closest('label')?.className ?? '';
    if (APPROVED_SIZE_PATTERN.test(ownClass) || APPROVED_SIZE_PATTERN.test(labelClass)) continue;
    const name = element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '';
    violations.push(`${element.tagName.toLowerCase()}[${name.slice(0, 24)}] class="${ownClass}"`);
  }
  return violations;
}
