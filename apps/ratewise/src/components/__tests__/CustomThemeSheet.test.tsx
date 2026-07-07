// @vitest-environment jsdom

/**
 * CustomThemeSheet - E7 wave-B/C UX 守門
 *
 * 1. HEX 欄位（QA-I #4）：focus 全選、paste 清洗（去 # 空白、統一大寫）、
 *    blur/Enter 才 commit、無效值回滾前值（wave-C 起收合於「自訂…」進階區）。
 * 2. 近白/近黑主色 gate（QA-I #2＋#670 S3）：警告不硬擋＋一鍵採用建議色。
 * 3. 取消／還原預設（QA-I #5/#7/D12）：取消回呼、還原預設二段確認。
 * 4. 預覽縮影卡（E7 wave-C，QA-I #3）：只消費全站語義 token（CSS 變數），
 *    CTA 與全站 addToHistory 同 bg-primary-strong token（preview-parity）。
 * 5. 色票收斂（QA-I #6）＋亮度滑桿（連續 tone）互動合約。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CustomThemeSheet } from '../CustomThemeSheet';
import { previewTheme } from '../../config/themes';
import {
  CUSTOM_PRIMARY_PRESETS,
  backgroundToneValueHex,
  continuousToneHexAtPosition,
  deriveCustomThemeCssVars,
  evaluatePrimaryContrastGate,
  isDarkBackgroundToneValue,
  isValidHexColor,
} from '../../config/custom-theme';

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      drag: _drag,
      dragConstraints: _dragConstraints,
      dragElastic: _dragElastic,
      onDragEnd: _onDragEnd,
      ...rest
    }: {
      children?: React.ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      drag?: unknown;
      dragConstraints?: unknown;
      dragElastic?: unknown;
      onDragEnd?: unknown;
    } & React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

function renderSheet(props: Partial<React.ComponentProps<typeof CustomThemeSheet>> = {}) {
  const handlers = {
    onClose: vi.fn(),
    onCancel: vi.fn(),
    onSelectPrimary: vi.fn(),
    onSelectBackgroundTone: vi.fn(),
    onReset: vi.fn(),
  };
  render(
    <CustomThemeSheet
      isOpen={true}
      customPrimary="#3182F6"
      customBackgroundTone="pure"
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

/** wave-C：色域盤與 HEX 收合於「自訂…」，測試前先展開進階區。 */
function openAdvanced(): void {
  fireEvent.click(screen.getByTestId('custom-theme-advanced-toggle'));
}

function getHexInput(): HTMLInputElement {
  return screen.getByTestId('custom-theme-hex-input') as HTMLInputElement;
}

afterEach(cleanup);

describe('HEX 欄位修復（QA-I #4）', () => {
  it('focus 自動全選', () => {
    renderSheet();
    openAdvanced();
    const input = getHexInput();
    fireEvent.focus(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
  });

  it('貼上「F8FAFC」：blur 才 commit 清洗後的 #F8FAFC', () => {
    const { onSelectPrimary } = renderSheet();
    openAdvanced();
    const input = getHexInput();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'F8FAFC' } });
    // 編輯中不 commit（消除半殘色碼陷阱）。
    expect(onSelectPrimary).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(onSelectPrimary).toHaveBeenCalledTimes(1);
    expect(onSelectPrimary).toHaveBeenCalledWith('#F8FAFC');
  });

  it('貼上「#3182f6 」：清洗去 # 空白、統一大寫，Enter commit', () => {
    const { onSelectPrimary } = renderSheet({ customPrimary: '#FF6B6B' });
    openAdvanced();
    const input = getHexInput();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '#3182f6 ' } });
    expect(input.value).toBe('3182F6');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelectPrimary).toHaveBeenCalledWith('#3182F6');
  });

  it('打半截值「3F」：blur 回滾前值且不 commit', () => {
    const { onSelectPrimary } = renderSheet();
    openAdvanced();
    const input = getHexInput();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '3F' } });
    expect(input.value).toBe('3F');
    fireEvent.blur(input);
    expect(onSelectPrimary).not.toHaveBeenCalled();
    expect(input.value).toBe('3182F6');
  });

  it('超長輸入截 6 碼；非 hex 字元即時剔除', () => {
    renderSheet();
    openAdvanced();
    const input = getHexInput();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'F8FAFCFFEE' } });
    expect(input.value).toBe('F8FAFC');
    fireEvent.change(input, { target: { value: 'xyz#12' } });
    expect(input.value).toBe('12');
  });

  it('非編輯態顯示值跟隨 customPrimary（色票/色盤變更同步；非精選色自動展開進階區）', () => {
    renderSheet({ customPrimary: '#14B8A6' });
    // '#14B8A6' 非精選票 → 進階區自動展開，HEX 欄位直接可見。
    expect(getHexInput().value).toBe('14B8A6');
  });
});

describe('預覽縮影卡與實際渲染一致性（E7 wave-C，QA-I #3）', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-style');
  });

  it('預覽卡 CTA 與全站 addToHistory CTA 使用同一 bg-primary-strong token', () => {
    renderSheet();
    const previewCta = screen.getByTestId('custom-theme-preview-cta');
    expect(previewCta.className).toContain('bg-primary-strong');

    // 全站 CTA 源（SingleConverter addToHistory）必須同 token——預覽卡 computed style
    // 與全站 CTA 消費同一 --color-primary-strong 變數，preview == 實際渲染。
    const singleConverter = readFileSync(
      resolve(__dirname, '../../features/ratewise/components/SingleConverter.tsx'),
      'utf-8',
    );
    expect(singleConverter).toContain('bg-primary-strong');
  });

  it('draft previewTheme 寫入的 inline 變數即預覽卡消費值（與演算 SSOT 一致，含深色調）', () => {
    previewTheme({ style: 'custom', customPrimary: '#FF6B6B', customBackgroundTone: 'midnight' });
    const expected = deriveCustomThemeCssVars('#FF6B6B', 'midnight');
    const rootStyle = document.documentElement.style;
    // 預覽卡消費的語義 token（bg-background/bg-surface/text-text/bg-primary-strong/
    // text-primary-on-surface）全部由同一 inline 變數供給。
    for (const cssVar of [
      '--color-background',
      '--color-surface',
      '--color-text',
      '--color-text-muted',
      '--color-primary-strong',
      '--color-primary-light',
      '--color-primary-text',
      '--color-primary-on-surface',
      '--color-border',
      '--color-chart-line',
    ] as const) {
      expect(rootStyle.getPropertyValue(cssVar), cssVar).toBe(expected[cssVar]);
    }
  });

  it('預覽卡禁止獨立配色計算：所有跟色面皆走語義 token class，無 inline 色值', () => {
    renderSheet();
    const preview = screen.getByTestId('custom-theme-live-preview');
    // 容器與內層皆不得出現 inline background/color 十六進位或 rgb 常數。
    expect(preview.getAttribute('style')).toBeNull();
    const styledDescendants = Array.from(preview.querySelectorAll('[style]'));
    expect(styledDescendants).toEqual([]);
    // 語義 token 消費面（與全站相同 CSS 變數）。
    expect(preview.className).toContain('bg-background');
    expect(preview.querySelector('.bg-surface')).not.toBeNull();
    expect(preview.querySelector('.bg-primary-light')).not.toBeNull();
    // 底部導覽 active 指示（on-surface 錨點，同 BottomNavigation token）。
    const nav = screen.getByTestId('custom-theme-preview-nav');
    expect(nav.querySelector('.text-primary-on-surface')).not.toBeNull();
    expect(nav.querySelector('.text-text-muted')).not.toBeNull();
  });
});

describe('色票網格收斂（E7 wave-C，QA-I #6）', () => {
  it('精選色票 8–12 格全數渲染，「自訂…」預設收合色域盤', () => {
    renderSheet();
    for (const preset of CUSTOM_PRIMARY_PRESETS) {
      expect(screen.getByRole('button', { name: `自訂主題色 ${preset}` })).toBeInTheDocument();
    }
    expect(screen.queryByTestId('custom-theme-picker')).not.toBeInTheDocument();
    openAdvanced();
    expect(screen.getByTestId('custom-theme-picker')).toBeInTheDocument();
  });

  it('點精選色票觸發 onSelectPrimary（gate 由同一 customPrimary 管道評估）', () => {
    const { onSelectPrimary } = renderSheet();
    fireEvent.click(screen.getByRole('button', { name: '自訂主題色 #FF6B6B' }));
    expect(onSelectPrimary).toHaveBeenCalledWith('#FF6B6B');
  });
});

describe('亮度滑桿連續 tone（E7 wave-C）', () => {
  it('拖至深端：16ms debounce 後以正規化深色 hex 呼叫 onSelectBackgroundTone', () => {
    vi.useFakeTimers();
    try {
      const { onSelectBackgroundTone } = renderSheet();
      const slider = screen.getByTestId('custom-theme-tone-slider');
      fireEvent.change(slider, { target: { value: '10' } });
      expect(onSelectBackgroundTone).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(20);
      });
      expect(onSelectBackgroundTone).toHaveBeenCalledTimes(1);
      const tone = onSelectBackgroundTone.mock.calls[0]?.[0] as string;
      expect(isValidHexColor(tone)).toBe(true);
      expect(isDarkBackgroundToneValue(tone)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('拖至淺端：產生淺色 hex tone；hex tone 下八格圓票皆非選中態', () => {
    vi.useFakeTimers();
    try {
      const { onSelectBackgroundTone } = renderSheet({ customBackgroundTone: '#F0F4F8' });
      // hex tone：enum 圓票全部 aria-pressed=false。
      expect(screen.getByTestId('background-tone-pure')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('background-tone-black')).toHaveAttribute('aria-pressed', 'false');

      const slider = screen.getByTestId('custom-theme-tone-slider');
      fireEvent.change(slider, { target: { value: '90' } });
      act(() => {
        vi.advanceTimersByTime(20);
      });
      const tone = onSelectBackgroundTone.mock.calls[0]?.[0] as string;
      expect(isValidHexColor(tone)).toBe(true);
      expect(isDarkBackgroundToneValue(tone)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('點 preset 圓票回到 enum tone（滑桿本地拖動態清除）', () => {
    const { onSelectBackgroundTone } = renderSheet({ customBackgroundTone: '#10141A' });
    fireEvent.click(screen.getByTestId('background-tone-midnight'));
    expect(onSelectBackgroundTone).toHaveBeenCalledWith('midnight');
  });
});

describe('亮度滑桿 hue 錨（review 修正：拖動過程色相穩定）', () => {
  function renderWithHandlers(customBackgroundTone: string) {
    const handlers = {
      onClose: vi.fn(),
      onCancel: vi.fn(),
      onSelectPrimary: vi.fn(),
      onSelectBackgroundTone: vi.fn(),
      onReset: vi.fn(),
    };
    const view = render(
      <CustomThemeSheet
        isOpen={true}
        customPrimary="#3182F6"
        customBackgroundTone={customBackgroundTone}
        {...handlers}
      />,
    );
    return { handlers, view };
  }

  function rerenderWithTone(
    view: ReturnType<typeof render>,
    handlers: Record<string, ReturnType<typeof vi.fn>>,
    tone: string,
  ) {
    view.rerender(
      <CustomThemeSheet
        isOpen={true}
        customPrimary="#3182F6"
        customBackgroundTone={tone}
        {...(handlers as unknown as Pick<
          React.ComponentProps<typeof CustomThemeSheet>,
          'onClose' | 'onCancel' | 'onSelectPrimary' | 'onSelectBackgroundTone' | 'onReset'
        >)}
      />,
    );
  }

  it('連續兩步拖動皆以起始 tone 為色相源（不隨 debounced 回寫漂移）', () => {
    vi.useFakeTimers();
    try {
      const { handlers, view } = renderWithHandlers('cool');
      const coolHex = backgroundToneValueHex('cool');
      const slider = screen.getByTestId('custom-theme-tone-slider');

      // 第一步：拖至近黑端（hex 捨入處色相/飽和度失真最大）。
      fireEvent.change(slider, { target: { value: '4' } });
      act(() => {
        vi.advanceTimersByTime(20);
      });
      const first = handlers.onSelectBackgroundTone?.mock.calls[0]?.[0] as string;
      expect(first).toBe(continuousToneHexAtPosition(0.04, coolHex));

      // 模擬 draft 回寫：prop tone 更新為第一步輸出（未鎖錨時的漂移來源）。
      rerenderWithTone(view, handlers, first);

      // 第二步：拖回淺域——錨仍為起始 cool，非以近黑輸出（色相已失真）為源。
      fireEvent.change(slider, { target: { value: '80' } });
      act(() => {
        vi.advanceTimersByTime(20);
      });
      const second = handlers.onSelectBackgroundTone?.mock.calls[1]?.[0] as string;
      expect(second).toBe(continuousToneHexAtPosition(0.8, coolHex));
      // 護欄：漂移版（以近黑輸出為源）輸出不同，斷言非空洞。
      expect(continuousToneHexAtPosition(0.8, first)).not.toBe(second);
    } finally {
      vi.useRealTimers();
    }
  });

  it('pointerup 釋放錨：下一次拖動以當時 tone 重新取錨', () => {
    vi.useFakeTimers();
    try {
      const { handlers, view } = renderWithHandlers('cool');
      const slider = screen.getByTestId('custom-theme-tone-slider');

      fireEvent.change(slider, { target: { value: '4' } });
      act(() => {
        vi.advanceTimersByTime(20);
      });
      const first = handlers.onSelectBackgroundTone?.mock.calls[0]?.[0] as string;
      fireEvent.pointerUp(slider);
      rerenderWithTone(view, handlers, first);

      fireEvent.change(slider, { target: { value: '80' } });
      act(() => {
        vi.advanceTimersByTime(20);
      });
      const second = handlers.onSelectBackgroundTone?.mock.calls[1]?.[0] as string;
      expect(second).toBe(continuousToneHexAtPosition(0.8, backgroundToneValueHex(first)));
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('近白/近黑主色 gate（QA-I #2＋#670 S3）', () => {
  it('近白 #F8FAFC × 純淨白：顯示警告與一鍵採用建議色（不硬擋）', () => {
    const { onSelectPrimary } = renderSheet({ customPrimary: '#F8FAFC' });
    expect(screen.getByTestId('custom-theme-gate-notice')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('custom-theme-gate-adopt'));
    const suggested = evaluatePrimaryContrastGate('#F8FAFC', 'pure').suggestedPrimary;
    expect(onSelectPrimary).toHaveBeenCalledWith(suggested);
    expect(isValidHexColor(suggested)).toBe(true);
  });

  it('近黑 #0A0A0A × 深夜檔：鏡像同機制警告', () => {
    const { onSelectPrimary } = renderSheet({
      customPrimary: '#0A0A0A',
      customBackgroundTone: 'midnight',
    });
    expect(screen.getByTestId('custom-theme-gate-notice')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('custom-theme-gate-adopt'));
    const suggested = evaluatePrimaryContrastGate('#0A0A0A', 'midnight').suggestedPrimary;
    expect(onSelectPrimary).toHaveBeenCalledWith(suggested);
  });

  it('品牌藍 × 純淨白：不誤報', () => {
    renderSheet();
    expect(screen.queryByTestId('custom-theme-gate-notice')).not.toBeInTheDocument();
  });
});

describe('取消與還原預設（QA-I #5/#7/D12）', () => {
  it('「取消」觸發 onCancel（回滾開啟前快照由 draft hook 編排）', () => {
    const { onCancel, onClose } = renderSheet();
    fireEvent.click(screen.getByTestId('custom-theme-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('還原預設二段確認：第一次按進入確認態，第二次按才觸發 onReset', () => {
    const { onReset } = renderSheet();
    const reset = screen.getByTestId('custom-theme-reset');

    fireEvent.click(reset);
    expect(onReset).not.toHaveBeenCalled();
    expect(reset).toHaveTextContent('再點一次確認還原');

    fireEvent.click(reset);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('確認態逾時自動解除', () => {
    vi.useFakeTimers();
    try {
      const { onReset } = renderSheet();
      const reset = screen.getByTestId('custom-theme-reset');
      fireEvent.click(reset);
      expect(reset).toHaveTextContent('再點一次確認還原');

      act(() => {
        vi.advanceTimersByTime(4100);
      });
      expect(reset).toHaveTextContent('還原預設主題');

      fireEvent.click(reset);
      expect(onReset).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
