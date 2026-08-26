// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appendTouchControlTokens, positionLearningCoachmark } from './learningCoachmark';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

function makeCoachmark(width: number, height: number): HTMLDivElement {
  const root = document.createElement('div');
  const card = document.createElement('section');
  card.dataset['learningCard'] = 'true';
  vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(rect(0, 0, width, height));
  root.appendChild(card);
  document.body.appendChild(root);
  return root;
}

describe('learningCoachmark 行動版定位與控制 token', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('直向提示放在搖桿上方，不覆蓋整個搖桿 hit area', () => {
    setViewport(390, 844);
    const joy = document.createElement('div');
    joy.id = 'joy-zone';
    vi.spyOn(joy, 'getBoundingClientRect').mockReturnValue(rect(20, 422, 370, 422));
    document.body.appendChild(joy);
    const root = makeCoachmark(280, 120);

    positionLearningCoachmark(root, '#joy-zone');

    expect(root.style.left).toBe('65px');
    expect(root.style.top).toBe('292px');
  });

  it('橫向提示移到搖桿右側安全帶，不遮住左半屏操作面', () => {
    setViewport(844, 390);
    const joy = document.createElement('div');
    joy.id = 'joy-zone';
    vi.spyOn(joy, 'getBoundingClientRect').mockReturnValue(rect(0, 20, 422, 370));
    document.body.appendChild(joy);
    const root = makeCoachmark(224, 96);

    positionLearningCoachmark(root, '#joy-zone');

    expect(root.style.left).toBe('432px');
    expect(root.style.top).toBe('157px');
  });

  it('方向提示使用安全頂端，不貼住行動瀏覽器上緣', () => {
    setViewport(390, 844);
    const joy = document.createElement('div');
    joy.id = 'joy-zone';
    vi.spyOn(joy, 'getBoundingClientRect').mockReturnValue(rect(20, 422, 370, 422));
    document.body.appendChild(joy);
    const root = makeCoachmark(300, 64);

    positionLearningCoachmark(root, undefined, 'safe-top');

    expect(root.style.left).toBe('45px');
    expect(root.style.top).toBe('64px');
  });

  it('控制 token 顯示真實按鈕色彩語意與可讀標籤', () => {
    const parent = document.createElement('section');

    appendTouchControlTokens(parent, ['action', 'jump']);

    expect(parent.querySelectorAll('[data-control-token]')).toHaveLength(2);
    expect(parent.querySelector('[data-control-token="action"]')?.getAttribute('aria-label')).toBe(
      '珊瑚粉星形鈕',
    );
    expect(parent.querySelector('[data-control-token="jump"]')?.textContent).toContain(
      '薄荷綠跳躍鈕',
    );
  });
});
