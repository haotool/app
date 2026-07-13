/**
 * E3 wave-C 美感升級測試（mobile-beauty §2/§5）：
 * A1 bento variant 與 DOM 順序、feature 數據帶靜態性、A6 貼紙家族數量紀律、
 * A5 kinetic a11y 雙軌（aria-label 完整句＋aria-hidden 拆詞）、A7 pattern 唯一授權處。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TOOLS } from '../config/tools';
import StickerBadge from '../components/StickerBadge';
import ToolCard from '../components/ToolCard';
import Home from '../pages/Home';

afterEach(() => {
  cleanup();
});

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

const ratewise = TOOLS.find((tool) => tool.id === 'ratewise');
if (!ratewise) throw new Error('缺少 ratewise 工具資料');

describe('A1 bento 網格（Home 區 4）', () => {
  it('bento 卡片 DOM 順序 = TOOLS SSOT 順序，且 slot class 依序放置（閱讀順序不交叉）', () => {
    const { container } = renderHome();
    const items = Array.from(container.querySelectorAll<HTMLLIElement>('.bento > li'));
    expect(items.map((item) => item.dataset['toolId'])).toEqual(TOOLS.map((tool) => tool.id));
    expect(items.map((item) => item.className)).toEqual([
      'bento-feature',
      'bento-sm-a',
      'bento-sm-b',
      'bento-wide-a',
      'bento-wide-b',
    ]);
  });

  it('feature 卡渲染數據帶 slot 與 Live 角標貼紙；mini 卡不掛貼紙（全站 ≤3 枚紀律）', () => {
    const { container } = renderHome();
    const feature = container.querySelector('.bento-feature');
    expect(feature?.querySelector('[data-testid="feature-data-band"]')).not.toBeNull();
    expect(feature?.querySelector('.sticker-live')).not.toBeNull();
    for (const slot of ['.bento-sm-a', '.bento-sm-b', '.bento-wide-a', '.bento-wide-b']) {
      expect(container.querySelector(`${slot} .sticker`)).toBeNull();
    }
  });

  it('mini 卡 DOM 完整輸出描述與分類（N3：<768px 僅以 CSS 隱藏，SSG/AEO 內容不減損）', () => {
    const { container } = render(<ToolCard tool={ratewise} variant="mini" />);
    const description = container.querySelector('p');
    expect(description).toHaveTextContent(ratewise.description);
    expect(description?.className).toContain('hidden');
    expect(container.textContent).toContain(ratewise.category);
    expect(container.querySelector('.bento-mini-frame')).not.toBeNull();
  });

  it('default variant 維持 Tools 頁現行卡結構（零 bento class）', () => {
    const { container } = render(<ToolCard tool={ratewise} showChips headingLevel="h2" />);
    expect(container.querySelector('.bento-mini-frame')).toBeNull();
    expect(container.querySelector('.bento-feature-frame')).toBeNull();
    expect(container.querySelector('.sticker')).toBeNull();
    expect(screen.getByText('React 19')).toBeInTheDocument();
  });
});

describe('A1 feature 數據帶（禁時效數值）', () => {
  it('sparkline 為靜態 aria-hidden SVG 形狀，內容零匯率數字、含五枚幣別徽章', () => {
    const { container } = renderHome();
    const band = container.querySelector<HTMLElement>('[data-testid="feature-data-band"]');
    expect(band).not.toBeNull();
    // 禁止清單：匯率值、更新時間、漲跌百分比（會過期的內容）。
    expect(band!.textContent).not.toMatch(/\d+\.\d+/);
    expect(band!.textContent).toContain('30 天趨勢');
    const svg = band!.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelector('path')).not.toBeNull();
    const chips = Array.from(band!.querySelectorAll('li')).map((chip) => chip.textContent);
    expect(chips).toEqual(['USD', 'JPY', 'KRW', 'EUR', 'GBP']);
  });
});

describe('A6 貼紙徽章家族', () => {
  it('hero 貼紙列：sticker-primary「OPEN SOURCE · 台灣」＋ sticker-ink「100% FREE」（N5）', () => {
    const { container } = renderHome();
    const primary = container.querySelector('.sticker-primary');
    const ink = container.querySelector('.sticker-ink');
    expect(primary).toHaveTextContent('OPEN SOURCE · 台灣');
    expect(primary?.querySelector('.bg-success')).not.toBeNull();
    expect(ink).toHaveTextContent('100% FREE');
  });

  it('全頁貼紙數量 ≤3（hero 2 枚＋feature 角標 1 枚封頂）', () => {
    const { container } = renderHome();
    expect(container.querySelectorAll('.sticker')).toHaveLength(3);
  });

  it('三變體 class 對應（純樣式殼；旋轉/底/框由 CSS token 承載）', () => {
    const { container } = render(
      <>
        <StickerBadge variant="primary">P</StickerBadge>
        <StickerBadge variant="ink">I</StickerBadge>
        <StickerBadge variant="live" withDot>
          Live
        </StickerBadge>
      </>,
    );
    expect(container.querySelector('.sticker-primary')).not.toBeNull();
    expect(container.querySelector('.sticker-ink')).not.toBeNull();
    expect(container.querySelector('.sticker-live')).not.toBeNull();
  });
});

describe('A5 H2 詞級 kinetic（僅區 4/6；H1 永不拆）', () => {
  it('區 4 H2：aria-label 完整句、視覺層 aria-hidden、4 段 --i 依序', () => {
    renderHome();
    const heading = document.getElementById('tools-heading');
    expect(heading).toHaveAttribute('aria-label', '五個正在服務真實使用者的工具');
    expect(heading!.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
    const words = Array.from(heading!.querySelectorAll<HTMLSpanElement>('.kinetic-word'));
    expect(words.map((word) => word.textContent)).toEqual([
      '五個',
      '正在服務',
      '真實使用者',
      '的工具',
    ]);
    expect(words.map((word) => word.style.getPropertyValue('--i'))).toEqual(['0', '1', '2', '3']);
  });

  it('區 6 H2：3 段拆詞、品牌色 span 併入所屬段、aria-label 完整句', () => {
    renderHome();
    const heading = document.getElementById('author-heading');
    expect(heading).toHaveAttribute('aria-label', '寫程式之前，先想像使用的人。');
    const words = heading!.querySelectorAll('.kinetic-word');
    expect(words).toHaveLength(3);
    expect(words[2]!.querySelector('.text-primary-strong')).toHaveTextContent('使用的人');
  });

  it('H1 與區 5 H2 不拆詞（N2：pin 場景視口排除）；每 H2 段數 ≤5', () => {
    const { container } = renderHome();
    expect(document.getElementById('hero-heading')!.querySelector('.kinetic-word')).toBeNull();
    expect(document.getElementById('craft-heading')!.querySelector('.kinetic-word')).toBeNull();
    for (const heading of Array.from(container.querySelectorAll('h1, h2'))) {
      expect(heading.querySelectorAll('.kinetic-word').length).toBeLessThanOrEqual(5);
    }
  });
});

describe('A7 dot-grid pattern（全站唯一授權處＝區 3）', () => {
  it('僅信任列 section 掛 trust-pattern，其他 section 零 pattern class', () => {
    const { container } = renderHome();
    const sections = Array.from(container.querySelectorAll('section'));
    const patterned = sections.filter((section) => section.classList.contains('trust-pattern'));
    expect(patterned).toHaveLength(1);
    expect(patterned[0]!.getAttribute('aria-labelledby')).toBe('stats-heading');
  });
});
