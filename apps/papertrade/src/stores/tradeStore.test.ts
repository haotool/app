import { beforeEach, describe, expect, it } from 'vitest';
import { flushTradePersist, parsePersistedTradeState, useTradeStore } from './tradeStore';
import { createInitialAccount } from '../engine/engine';
import { INITIAL_BALANCE_USDT, TRADE_STORAGE_KEY } from '../config/trading';

const NOW = 1_800_000_000_000;

function resetStore() {
  useTradeStore.setState({ account: createInitialAccount(), toasts: [] });
  flushTradePersist();
}

describe('useTradeStore', () => {
  beforeEach(resetStore);

  it('starts with the initial balance', () => {
    expect(useTradeStore.getState().account.balance).toBe(INITIAL_BALANCE_USDT);
  });

  it('opens a market position and deducts funds', () => {
    const result = useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    expect(result.ok).toBe(true);

    const { account } = useTradeStore.getState();
    expect(account.positions).toHaveLength(1);
    expect(account.balance).toBeCloseTo(INITIAL_BALANCE_USDT - 600 - 3.3, 8);
  });

  it('returns engine errors without mutating state', () => {
    const before = useTradeStore.getState().account;
    const result = useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 100,
      price: 60000,
      leverage: 10,
    });
    expect(result).toEqual({ ok: false, error: 'insufficient-balance' });
    expect(useTradeStore.getState().account).toBe(before);
  });

  it('skips ticks without exposure on the symbol', () => {
    const before = useTradeStore.getState().account;
    useTradeStore.getState().applyTick('BTCUSDT', 60000, NOW);
    expect(useTradeStore.getState().account).toBe(before);
  });

  it('liquidates on tick and pushes a warning toast', () => {
    useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    useTradeStore.getState().applyTick('BTCUSDT', 50000, NOW);

    const { account, toasts } = useTradeStore.getState();
    expect(account.positions).toHaveLength(0);
    expect(account.history[0]?.reason).toBe('liquidation');
    expect(toasts.some((toast) => toast.tone === 'warning')).toBe(true);
  });

  it('fills limit orders on tick and pushes a toast', () => {
    useTradeStore.getState().placeLimitOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      limitPrice: 58000,
      leverage: 10,
    });
    useTradeStore.getState().applyTick('BTCUSDT', 57900, NOW);

    const { account, toasts } = useTradeStore.getState();
    expect(account.orders).toHaveLength(0);
    expect(account.positions).toHaveLength(1);
    expect(toasts.length).toBeGreaterThan(0);
  });

  it('caps visible toasts at the configured maximum', () => {
    for (let index = 0; index < 5; index += 1) {
      useTradeStore.getState().pushToast({ tone: 'long', title: `toast-${index}` });
    }
    expect(useTradeStore.getState().toasts.length).toBeLessThanOrEqual(3);
  });

  it('resets the account back to the initial state', () => {
    useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    useTradeStore.getState().resetAccount();

    const { account } = useTradeStore.getState();
    expect(account.balance).toBe(INITIAL_BALANCE_USDT);
    expect(account.positions).toEqual([]);
    expect(account.history).toEqual([]);
  });

  it('debounces persist writes and lands the latest state after flush', () => {
    useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    expect(window.localStorage.getItem(TRADE_STORAGE_KEY)).not.toContain('BTCUSDT');

    flushTradePersist();
    const raw = window.localStorage.getItem(TRADE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).toContain('BTCUSDT');
  });
});

describe('parsePersistedTradeState', () => {
  it('accepts a valid persisted account', () => {
    const account = createInitialAccount();
    expect(parsePersistedTradeState({ account })).toEqual({ account });
  });

  it('rejects malformed payloads for a safe reset', () => {
    expect(parsePersistedTradeState(null)).toBeNull();
    expect(parsePersistedTradeState({})).toBeNull();
    expect(parsePersistedTradeState({ account: { balance: 'nope' } })).toBeNull();
    expect(
      parsePersistedTradeState({
        account: { balance: -5, positions: [], orders: [], history: [] },
      }),
    ).toBeNull();
    expect(
      parsePersistedTradeState({
        account: {
          balance: 100,
          positions: [{ id: 'x', symbol: 'FAKEUSDT' }],
          orders: [],
          history: [],
        },
      }),
    ).toBeNull();
  });

  it('accepts a persisted account with an open position and orders', () => {
    const state = {
      account: {
        balance: 9000,
        positions: [
          {
            id: 'p1',
            symbol: 'BTCUSDT',
            side: 'long',
            qty: 0.1,
            entryPrice: 60000,
            margin: 600,
            openFee: 3.3,
            leverage: 10,
            openedAt: NOW,
            takeProfit: null,
            stopLoss: 59000,
            trailing: {
              activationPrice: 61000,
              distance: 500,
              active: true,
              extremePrice: 61500,
            },
          },
        ],
        orders: [
          {
            id: 'o1',
            kind: 'open',
            symbol: 'ETHUSDT',
            side: 'short',
            qty: 1,
            limitPrice: 3200,
            leverage: 5,
            margin: 640,
            fee: 0.64,
            positionId: null,
            createdAt: NOW,
          },
        ],
        history: [
          {
            id: 't1',
            symbol: 'BTCUSDT',
            side: 'long',
            qty: 0.05,
            entryPrice: 59000,
            exitPrice: 60000,
            realizedPnl: 50,
            fee: 1.65,
            openFee: 1.6225,
            reason: 'manual',
            closedAt: NOW,
          },
        ],
      },
    };
    expect(parsePersistedTradeState(state)).toEqual(state);
  });

  it('rejects legacy payloads without the openFee ledger fields', () => {
    expect(
      parsePersistedTradeState({
        account: {
          balance: 9000,
          positions: [
            {
              id: 'p1',
              symbol: 'BTCUSDT',
              side: 'long',
              qty: 0.1,
              entryPrice: 60000,
              margin: 600,
              leverage: 10,
              openedAt: NOW,
              takeProfit: null,
              stopLoss: null,
              trailing: null,
            },
          ],
          orders: [],
          history: [],
        },
      }),
    ).toBeNull();
  });
});
