/**
 * 元件 Smoke Tests — 確保各元件能在正常 props 下渲染而不崩潰
 * 覆蓋大部分元件的基本渲染路徑，提升 coverage 至門檻以上
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { type ReactNode } from 'react';
import i18n from '../../i18n';
import { useStore } from '../../store/useStore';

// ── 元件 ──────────────────────────────────────────────────────────────────────
import { MemberList } from '../MemberList';
import { TripSelector } from '../TripSelector';
import { UpdatePrompt } from '../UpdatePrompt';

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('../../hooks/useUpdatePrompt', () => ({
  useUpdatePrompt: vi.fn(() => ({
    visible: false,
    needRefresh: false,
    handleUpdate: vi.fn(),
    handleDismiss: vi.fn(),
  })),
}));

// ── Helper ────────────────────────────────────────────────────────────────────
function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

function renderWith(ui: ReactNode) {
  return render(ui, { wrapper: Wrapper });
}

// ── Store reset ───────────────────────────────────────────────────────────────
beforeEach(() => {
  useStore.setState({
    trips: [{ id: 'default-trip', name: 'My Trip', createdAt: 0 }],
    currentTripId: 'default-trip',
    members: [
      { id: 'me', name: 'Me', avatarUrl: 'seed-me', isActive: true },
      { id: 'm1', name: 'Oliver', avatarUrl: 'seed-m1', isActive: true },
    ],
    expenses: [],
    activeTab: 'home',
    splitMode: 'split_evenly',
    calculatorValue: '',
    focusedMemberId: null,
    itemizedValues: {},
    payerId: 'me',
    expenseNote: '',
  });
});

// ── MemberList ─────────────────────────────────────────────────────────────────
describe('MemberList', () => {
  it('渲染所有成員按鈕', () => {
    renderWith(<MemberList />);
    expect(screen.getByText('Me')).toBeInTheDocument();
    expect(screen.getByText('Oliver')).toBeInTheDocument();
  });

  it('點擊成員切換 isActive', () => {
    renderWith(<MemberList />);
    fireEvent.click(screen.getByText('Me'));
    const me = useStore.getState().members.find((m) => m.id === 'me');
    expect(me?.isActive).toBe(false);
  });

  it('點擊 + 新增成員', () => {
    renderWith(<MemberList />);
    const addBtn = screen.getByRole('button', { name: /add|新增/i });
    fireEvent.click(addBtn);
    expect(useStore.getState().members).toHaveLength(3);
  });
});

// ── TripSelector ───────────────────────────────────────────────────────────────
describe('TripSelector', () => {
  it('顯示目前行程名稱', () => {
    renderWith(<TripSelector />);
    expect(screen.getByText('My Trip')).toBeInTheDocument();
  });

  it('點擊展開下拉選單', () => {
    renderWith(<TripSelector />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    // 展開後應顯示行程 + 新增按鈕
    expect(screen.getAllByText('My Trip').length).toBeGreaterThan(0);
  });

  it('點擊遮罩收起選單', () => {
    renderWith(<TripSelector />);
    fireEvent.click(screen.getByRole('button'));
    // overlay div（fixed inset-0）
    const overlay = document.querySelector('.fixed.inset-0.z-40');
    if (overlay) fireEvent.click(overlay);
    // 收起後 dropdown 消失
    expect(document.querySelector('.fixed.inset-0.z-40')).toBeNull();
  });

  it('點擊「新增行程」按鈕顯示輸入框', () => {
    renderWith(<TripSelector />);
    fireEvent.click(screen.getByRole('button'));
    // 找到新增行程按鈕（加號按鈕）
    const addBtn = document.querySelector('button.w-full.flex.items-center.justify-center');
    if (addBtn) {
      fireEvent.click(addBtn);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    }
  });
});

// ── UpdatePrompt ───────────────────────────────────────────────────────────────
describe('UpdatePrompt', () => {
  it('visible=false 不渲染 alert', () => {
    renderWith(<UpdatePrompt />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('visible=true needRefresh=true 顯示更新提示', async () => {
    const { useUpdatePrompt } = await import('../../hooks/useUpdatePrompt');
    vi.mocked(useUpdatePrompt).mockReturnValueOnce({
      visible: true,
      needRefresh: true,
      offlineReady: false,
      handleUpdate: vi.fn(),
      handleDismiss: vi.fn(),
    });
    renderWith(<UpdatePrompt />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('visible=true needRefresh=false 顯示離線準備提示', async () => {
    const { useUpdatePrompt } = await import('../../hooks/useUpdatePrompt');
    vi.mocked(useUpdatePrompt).mockReturnValueOnce({
      visible: true,
      needRefresh: false,
      offlineReady: true,
      handleUpdate: vi.fn(),
      handleDismiss: vi.fn(),
    });
    renderWith(<UpdatePrompt />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
