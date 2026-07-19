import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import { SYMBOLS, type MarketSymbol } from '../config/market';
import {
  LEVERAGE_MAX,
  LEVERAGE_MIN,
  TOAST_MAX_VISIBLE,
  TRADE_STORAGE_KEY,
  TRADE_STORAGE_VERSION,
} from '../config/trading';
import {
  cancelOrder,
  closePositionMarket,
  createInitialAccount,
  openMarket,
  placeCloseLimit,
  placeLimitOrder,
  processTick,
  setTakeProfitStopLoss,
  setTrailingStop,
  type CloseLimitParams,
  type CloseParams,
  type LimitParams,
  type OpenParams,
  type TradeError,
  type TradeResult,
  type TrailingParams,
} from '../engine/engine';
import { type Account, type ClosedTrade, type TradeEvent } from '../engine/types';
import { SYMBOL_META } from '../config/market';
import { formatAmount, formatPrice, formatSignedPnl } from '../lib/format';
import { createDebouncedStorage, PERSIST_DEBOUNCE_MS } from '../lib/debouncedStorage';
import { playLiquidationSound } from '../lib/sound';
import { useSoundPrefsStore } from './soundPrefsStore';

export type ToastTone = 'long' | 'short' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

export type TradeActionResult = { ok: true } | { ok: false; error: TradeError };

export type CloseActionResult = { ok: true; trade: ClosedTrade } | { ok: false; error: TradeError };

const sideSchema = z.enum(['long', 'short']);
const symbolSchema = z.enum(SYMBOLS);
const finiteNumber = z.number().finite();
const positiveNumber = finiteNumber.positive();
const nonNegativeNumber = finiteNumber.min(0);

const trailingSchema = z.object({
  activationPrice: positiveNumber,
  distance: positiveNumber,
  active: z.boolean(),
  extremePrice: positiveNumber.nullable(),
});

const positionSchema = z.object({
  id: z.string().min(1),
  symbol: symbolSchema,
  side: sideSchema,
  qty: positiveNumber,
  entryPrice: positiveNumber,
  // margin 為衍生欄位：極小殘餘量部分平倉的捨入可使其為 0，域須與引擎輸出一致。
  margin: nonNegativeNumber,
  openFee: nonNegativeNumber,
  leverage: finiteNumber.min(LEVERAGE_MIN).max(LEVERAGE_MAX),
  // R6-2：保證金模式（per-position 快照）；v3 存檔由 migrate 補預設 isolated。
  marginMode: z.enum(['isolated', 'cross']),
  openedAt: finiteNumber,
  takeProfit: positiveNumber.nullable(),
  stopLoss: positiveNumber.nullable(),
  // R5-6：TP/SL 觸發平倉比例（0<r≤1）；v2 存檔由 migrate 補預設 1。
  tpSlCloseRatio: positiveNumber.max(1),
  trailing: trailingSchema.nullable(),
});

const orderSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['open', 'close']),
  symbol: symbolSchema,
  side: sideSchema,
  qty: positiveNumber,
  limitPrice: positiveNumber,
  leverage: finiteNumber.min(LEVERAGE_MIN).max(LEVERAGE_MAX),
  marginMode: z.enum(['isolated', 'cross']),
  margin: nonNegativeNumber,
  fee: nonNegativeNumber,
  positionId: z.string().min(1).nullable(),
  createdAt: finiteNumber,
  // R4-6 新增選填欄位：舊版存檔缺 key 時以 null 補齊，免 storage version bump。
  takeProfit: positiveNumber.nullable().default(null),
  stopLoss: positiveNumber.nullable().default(null),
});

const closedTradeSchema = z.object({
  id: z.string().min(1),
  symbol: symbolSchema,
  side: sideSchema,
  qty: positiveNumber,
  entryPrice: positiveNumber,
  exitPrice: positiveNumber,
  realizedPnl: finiteNumber,
  fee: nonNegativeNumber,
  openFee: nonNegativeNumber,
  reason: z.enum(['manual', 'tp', 'sl', 'trailing', 'liquidation']),
  closedAt: finiteNumber,
});

const persistedTradeSchema = z.object({
  account: z.object({
    // R6-2：cross 盈利可作開倉依據，現金（balance）可暫為負值；域須與引擎輸出一致。
    balance: finiteNumber,
    positions: z.array(positionSchema),
    orders: z.array(orderSchema),
    history: z.array(closedTradeSchema),
  }),
});

export interface PersistedTradeState {
  account: Account;
}

export function parsePersistedTradeState(value: unknown): PersistedTradeState | null {
  const parsed = persistedTradeSchema.safeParse(value);
  if (!parsed.success) return null;
  return parsed.data;
}

const tradeStorage = createDebouncedStorage(window.localStorage, PERSIST_DEBOUNCE_MS);

export function flushTradePersist(): void {
  tradeStorage.flush();
}

window.addEventListener('pagehide', flushTradePersist);

function sideLabel(side: 'long' | 'short'): string {
  return side === 'long' ? '多' : '空';
}

function pairLabel(symbol: MarketSymbol): string {
  return `${SYMBOL_META[symbol].base}/USDT`;
}

function pnlText(pnl: number): string {
  return `${formatSignedPnl(pnl)} USDT`;
}

function eventToToast(event: TradeEvent): Omit<ToastItem, 'id'> {
  switch (event.type) {
    case 'limit-filled':
      return {
        tone: event.side,
        title: `限價委託成交：${pairLabel(event.symbol)} ${sideLabel(event.side)}單`,
        description: `${formatAmount(event.qty, 6)} @ ${formatPrice(event.price)}`,
      };
    case 'close-filled':
      return {
        tone: event.pnl >= 0 ? 'long' : 'short',
        title: `限價平倉成交：${pairLabel(event.symbol)}`,
        description: pnlText(event.pnl),
      };
    case 'tp':
      return {
        tone: 'long',
        title: `止盈觸發：${pairLabel(event.symbol)} ${sideLabel(event.side)}單平倉`,
        description: pnlText(event.pnl),
      };
    case 'sl':
      return {
        tone: 'short',
        title: `止損觸發：${pairLabel(event.symbol)} ${sideLabel(event.side)}單平倉`,
        description: pnlText(event.pnl),
      };
    case 'trailing':
      return {
        tone: event.pnl >= 0 ? 'long' : 'short',
        title: `追蹤止損出場：${pairLabel(event.symbol)} ${sideLabel(event.side)}單`,
        description: pnlText(event.pnl),
      };
    case 'liquidation':
      return {
        tone: 'warning',
        title: `強制平倉：${pairLabel(event.symbol)} ${sideLabel(event.side)}單`,
        description: `保證金 ${formatAmount(event.loss, 2)} USDT 已全數損失`,
      };
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}

function appendToasts(current: ToastItem[], incoming: Omit<ToastItem, 'id'>[]): ToastItem[] {
  if (incoming.length === 0) return current;
  const next = [...current, ...incoming.map((toast) => ({ ...toast, id: crypto.randomUUID() }))];
  return next.slice(-TOAST_MAX_VISIBLE);
}

interface TradeState {
  account: Account;
  toasts: ToastItem[];
  openMarketOrder: (params: Omit<OpenParams, 'now'>) => TradeActionResult;
  closeMarketOrder: (params: Omit<CloseParams, 'now'>) => CloseActionResult;
  placeLimitOrder: (params: Omit<LimitParams, 'now'>) => TradeActionResult;
  placeCloseLimitOrder: (params: Omit<CloseLimitParams, 'now'>) => TradeActionResult;
  cancelPendingOrder: (orderId: string) => TradeActionResult;
  setPositionTpSl: (
    positionId: string,
    takeProfit: number | null,
    stopLoss: number | null,
    closeRatio?: number,
  ) => TradeActionResult;
  setPositionTrailing: (positionId: string, params: TrailingParams | null) => TradeActionResult;
  applyTick: (symbol: MarketSymbol, mark: number, now: number) => void;
  resetAccount: () => void;
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => {
      function commit(result: TradeResult): TradeActionResult {
        if (!result.ok) return result;
        set({ account: result.account });
        return { ok: true };
      }

      return {
        account: createInitialAccount(),
        toasts: [],
        openMarketOrder: (params) => commit(openMarket(get().account, params)),
        closeMarketOrder: (params) => {
          // 回傳引擎實際成交結果，供 UI 以真實值（非預覽值）呈現。
          const result = closePositionMarket(get().account, params);
          if (!result.ok) return result;
          set({ account: result.account });
          return { ok: true, trade: result.trade };
        },
        placeLimitOrder: (params) => commit(placeLimitOrder(get().account, params)),
        placeCloseLimitOrder: (params) => commit(placeCloseLimit(get().account, params)),
        cancelPendingOrder: (orderId) => commit(cancelOrder(get().account, orderId)),
        // 原子套用：TP、SL 皆通過引擎驗證才 commit，任一失敗不留半套設定。
        setPositionTpSl: (positionId, takeProfit, stopLoss, closeRatio) =>
          commit(
            setTakeProfitStopLoss(get().account, positionId, takeProfit, stopLoss, closeRatio),
          ),
        setPositionTrailing: (positionId, params) =>
          commit(setTrailingStop(get().account, positionId, params)),
        applyTick: (symbol, mark, now) => {
          const { account } = get();
          const exposed =
            account.positions.some((position) => position.symbol === symbol) ||
            account.orders.some((order) => order.symbol === symbol);
          if (!exposed) return;

          const { account: next, events } = processTick(account, symbol, mark, now);
          if (next === account && events.length === 0) return;
          // 強平提示音與強平 toast 同路徑觸發；受設定開關管控。
          if (
            events.some((event) => event.type === 'liquidation') &&
            useSoundPrefsStore.getState().liquidationSound
          ) {
            playLiquidationSound();
          }
          set((state) => ({
            account: next,
            toasts: appendToasts(state.toasts, events.map(eventToToast)),
          }));
        },
        resetAccount: () => set({ account: createInitialAccount() }),
        pushToast: (toast) => set((state) => ({ toasts: appendToasts(state.toasts, [toast]) })),
        dismissToast: (id) =>
          set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
      };
    },
    {
      name: TRADE_STORAGE_KEY,
      version: TRADE_STORAGE_VERSION,
      storage: createJSONStorage(() => tradeStorage),
      partialize: (state) => ({ account: state.account }),
      // 逐段補欄的無損遷移：v2 → v3 持倉補 tpSlCloseRatio；v3 → v4 持倉與掛單補 marginMode。
      // 更舊版本一律重置：回傳空物件哨兵使 parse 失敗，沿用 merge 的存檔失效一次性告知路徑。
      migrate: (persisted, version) => {
        if (typeof persisted !== 'object' || persisted === null) return {};
        if (version !== 2 && version !== 3) return {};
        const legacy = persisted as { account?: { positions?: unknown[]; orders?: unknown[] } };
        const positions = legacy.account?.positions;
        const orders = legacy.account?.orders;
        if (!Array.isArray(positions) || !Array.isArray(orders)) return {};
        const fill = (items: unknown[], defaults: Record<string, unknown>): unknown[] =>
          items.map((item) =>
            typeof item === 'object' && item !== null ? { ...defaults, ...item } : item,
          );
        const positionDefaults =
          version === 2
            ? { tpSlCloseRatio: 1, marginMode: 'isolated' }
            : { marginMode: 'isolated' };
        return {
          ...legacy,
          account: {
            ...legacy.account,
            positions: fill(positions, positionDefaults),
            orders: fill(orders, { marginMode: 'isolated' }),
          },
        };
      },
      merge: (persisted, current) => {
        const parsed = parsePersistedTradeState(persisted);
        if (parsed === null) {
          // 首次使用（無存檔）不提示；存檔存在但損壞時重置並一次性告知。
          if (persisted === null || persisted === undefined) return current;
          return {
            ...current,
            toasts: appendToasts(current.toasts, [
              {
                tone: 'warning',
                title: '模擬帳戶已重置',
                description: '偵測到本機存檔損壞，已重新配發初始資金。',
              },
            ]),
          };
        }
        return { ...current, account: parsed.account };
      },
    },
  ),
);
