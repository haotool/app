/**
 * 元件測試：Accordion（單題展開 / a11y）、CopyField（複製與 fallback）、
 * Toast（生命週期）、MailtoLink（SSG 零 mailto）、ToolCard（四態結構）、HeroStage（裝飾語意）。
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Accordion from '../components/Accordion';
import CopyField from '../components/CopyField';
import HeroStage from '../components/HeroStage';
import MailtoLink from '../components/MailtoLink';
import Toast from '../components/Toast';
import ToolCard from '../components/ToolCard';
import Header from '../components/Header';
import { ABOUT_FAQS } from '../config/faq';
import { TOOLS } from '../config/tools';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Accordion', () => {
  it('渲染全部題目且一次僅展開一題', () => {
    render(<Accordion items={ABOUT_FAQS} />);
    const triggers = screen.getAllByRole('button');
    expect(triggers).toHaveLength(ABOUT_FAQS.length);
    expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(triggers[1]!);
    expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
  });

  it('點擊已展開題目可收合', () => {
    render(<Accordion items={ABOUT_FAQS} />);
    const first = screen.getAllByRole('button')[0]!;
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'false');
  });

  it('觸發列以 aria-controls 對應內容面板', () => {
    render(<Accordion items={ABOUT_FAQS} />);
    const first = screen.getAllByRole('button')[0]!;
    const panelId = first.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).not.toBeNull();
  });
});

describe('CopyField', () => {
  it('複製成功時觸發成功 toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const onToast = vi.fn();
    render(<CopyField value="haotool.org@gmail.com" onToast={onToast} />);

    fireEvent.click(screen.getByRole('button', { name: '複製 Email' }));
    await vi.waitFor(() => {
      expect(onToast).toHaveBeenCalledWith('已複製 Email', true);
    });
    expect(writeText).toHaveBeenCalledWith('haotool.org@gmail.com');
  });

  it('剪貼簿不可用時退回全選並提示手動複製', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const onToast = vi.fn();
    render(<CopyField value="haotool.org@gmail.com" onToast={onToast} />);

    fireEvent.click(screen.getByRole('button', { name: '複製 Email' }));
    await vi.waitFor(() => {
      expect(onToast).toHaveBeenCalledWith('請按 ⌘C 複製', false);
    });
  });
});

describe('Toast', () => {
  it('以 role=status 呈現並於生命週期結束後移除', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <Toast toast={{ id: 1, message: '已複製 Email', success: true }} onDismiss={onDismiss} />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('已複製 Email');
    vi.advanceTimersByTime(2400);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('MailtoLink（CF Email Obfuscation 治理）', () => {
  it('SSG 輸出零 mailto: href（以 button 呈現）', () => {
    const { container } = render(
      <MailtoLink email="haotool.org@gmail.com" subject="專案合作洽詢">
        Email
      </MailtoLink>,
    );
    expect(container.innerHTML).not.toContain('mailto:');
    expect(screen.getByRole('button', { name: 'Email' })).toHaveAttribute('type', 'button');
  });
});

describe('ToolCard', () => {
  const ratewise = TOOLS.find((tool) => tool.id === 'ratewise');
  if (!ratewise) throw new Error('缺少 ratewise 工具資料');

  it('整卡為單一連結、含 Live 圓點與開啟箭頭', () => {
    render(<ToolCard tool={ratewise} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://app.haotool.org/ratewise/');
    expect(link).toHaveTextContent('Live');
    expect(link).toHaveTextContent('開啟');
    expect(link).toHaveTextContent(ratewise.category);
  });

  it('技術 chips 僅於 showChips 時常駐渲染（FR-011）', () => {
    const { rerender } = render(<ToolCard tool={ratewise} />);
    expect(screen.queryByText('React 19')).toBeNull();
    rerender(<ToolCard tool={ratewise} showChips />);
    expect(screen.getByText('React 19')).toBeInTheDocument();
  });

  it('截圖載入失敗時以品牌淡藍佔位卡呈現（不得 broken image）', () => {
    render(<ToolCard tool={ratewise} />);
    const screenshot = screen.getByAltText(`${ratewise.name} 介面截圖`);
    fireEvent.error(screenshot);
    // 佔位卡以工具 icon 承接同一描述性 alt。
    expect(screen.getByAltText(`${ratewise.name} 介面截圖`)).toHaveAttribute(
      'src',
      'https://app.haotool.org/ratewise/pwa-192x192.png',
    );
  });
});

describe('HeroStage', () => {
  it('舞台為純裝飾（aria-hidden）且渲染 5 張疊層卡', () => {
    render(<HeroStage />);
    const stage = screen.getByTestId('hero-stage');
    expect(stage).toHaveAttribute('aria-hidden', 'true');
    expect(stage.querySelectorAll('.stage-card')).toHaveLength(5);
    // 全部截圖 lazy + 低優先權（PRD §10.2 hero 資產預算）。
    for (const img of Array.from(stage.querySelectorAll('img'))) {
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute('fetchpriority', 'low');
    }
  });
});

describe('Header / MobileMenu', () => {
  function renderHeader() {
    return render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
  }

  it('漢堡鈕以 aria-expanded / aria-controls 對應全屏選單', () => {
    renderHeader();
    const trigger = screen.getByRole('button', { name: '開啟選單' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls', 'mobile-menu');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('mobile-menu')).toHaveAttribute('data-open', 'true');
  });

  it('Esc 關閉選單並解除 body scroll 鎖定', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: '開啟選單' }));
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.getElementById('mobile-menu')).toHaveAttribute('data-open', 'false');
    expect(document.body.style.overflow).toBe('');
  });
});
