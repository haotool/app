import { beforeEach, describe, expect, it } from 'vitest';
import { flushTradePersist, parsePersistedTradeState, useTradeStore } from './tradeStore';
import { createInitialAccount } from '../engine/engine';
import { INITIAL_BALANCE_USDT, TRADE_STORAGE_KEY, TRADE_STORAGE_VERSION } from '../config/trading';

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

  it('applies TP/SL atomically: a rejected SL leaves the position untouched', () => {
    const opened = useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    expect(opened.ok).toBe(true);

    const before = useTradeStore.getState().account;
    const positionId = before.positions[0]?.id ?? '';
    // 多單止損須低於開倉價；61000 方向錯誤，有效 TP 不得被半套寫入。
    const result = useTradeStore.getState().setPositionTpSl(positionId, 62000, 61000);
    expect(result).toEqual({ ok: false, error: 'invalid-sl-direction' });

    const after = useTradeStore.getState().account;
    expect(after).toBe(before);
    expect(after.positions[0]?.takeProfit).toBeNull();
    expect(after.positions[0]?.stopLoss).toBeNull();
  });

  it('applies TP/SL atomically when both prices are valid', () => {
    const opened = useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    expect(opened.ok).toBe(true);

    const positionId = useTradeStore.getState().account.positions[0]?.id ?? '';
    const result = useTradeStore.getState().setPositionTpSl(positionId, 62000, 58000);
    expect(result).toEqual({ ok: true });

    const position = useTradeStore.getState().account.positions[0];
    expect(position?.takeProfit).toBe(62000);
    expect(position?.stopLoss).toBe(58000);
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

  it('resets with a one-time warning toast when persisted data is corrupted', async () => {
    window.localStorage.setItem(
      TRADE_STORAGE_KEY,
      JSON.stringify({
        state: { account: { balance: -5, positions: [], orders: [], history: [] } },
        version: TRADE_STORAGE_VERSION,
      }),
    );
    await useTradeStore.persist.rehydrate();

    const { account, toasts } = useTradeStore.getState();
    expect(account.balance).toBe(INITIAL_BALANCE_USDT);
    expect(account.positions).toEqual([]);
    expect(
      toasts.filter((toast) => toast.tone === 'warning' && toast.title.includes('重置')),
    ).toHaveLength(1);
  });

  it('resets with the same one-time warning toast when the persisted version is stale', async () => {
    // v2 以前的版本不可遷移；重置不得靜默，必須沿用存檔失效的一次性告知路徑。
    window.localStorage.setItem(
      TRADE_STORAGE_KEY,
      JSON.stringify({
        state: { account: { ...createInitialAccount(), balance: 7777 } },
        version: TRADE_STORAGE_VERSION - 2,
      }),
    );
    await useTradeStore.persist.rehydrate();

    const { account, toasts } = useTradeStore.getState();
    expect(account.balance).toBe(INITIAL_BALANCE_USDT);
    expect(account.positions).toEqual([]);
    expect(
      toasts.filter((toast) => toast.tone === 'warning' && toast.title.includes('重置')),
    ).toHaveLength(1);
  });

  it('migrates a v2 account by filling tpSlCloseRatio without a reset', async () => {
    const legacyPosition = {
      id: 'p1',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      entryPrice: 60000,
      margin: 600,
      openFee: 3.3,
      leverage: 10,
      openedAt: NOW,
      takeProfit: 61000,
      stopLoss: null,
      trailing: null,
    };
    window.localStorage.setItem(
      TRADE_STORAGE_KEY,
      JSON.stringify({
        state: {
          account: { balance: 7777, positions: [legacyPosition], orders: [], history: [] },
        },
        version: 2,
      }),
    );
    await useTradeStore.persist.rehydrate();

    const { account, toasts } = useTradeStore.getState();
    expect(account.balance).toBe(7777);
    expect(account.positions[0]?.tpSlCloseRatio).toBe(1);
    expect(account.positions[0]?.takeProfit).toBe(61000);
    expect(toasts.some((toast) => toast.tone === 'warning')).toBe(false);
  });

  it('rehydrates a valid persisted account without a reset toast', async () => {
    const account = { ...createInitialAccount(), balance: 8888 };
    window.localStorage.setItem(
      TRADE_STORAGE_KEY,
      JSON.stringify({ state: { account }, version: TRADE_STORAGE_VERSION }),
    );
    await useTradeStore.persist.rehydrate();

    const state = useTradeStore.getState();
    expect(state.account.balance).toBe(8888);
    expect(state.toasts.some((toast) => toast.tone === 'warning')).toBe(false);
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

  it('accepts a kept position whose margin rounded down to zero (engine edge output)', () => {
    // 極小殘餘量的部分平倉可使 margin 捨入至 0：schema 不得比引擎輸出域更嚴。
    const state = {
      account: {
        balance: 9000,
        positions: [
          {
            id: 'p1',
            symbol: 'DOGEUSDT',
            side: 'long',
            qty: 0.000002,
            entryPrice: 0.3,
            margin: 0,
            openFee: 0,
            leverage: 125,
            openedAt: NOW,
            takeProfit: null,
            stopLoss: null,
            tpSlCloseRatio: 1,
            trailing: null,
          },
        ],
        orders: [],
        history: [],
      },
    };
    expect(parsePersistedTradeState(state)).toEqual(state);
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
            tpSlCloseRatio: 0.5,
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
            takeProfit: 3000,
            stopLoss: 3400,
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

  it('fills null tp/sl for legacy orders persisted before R4-6', () => {
    const legacyOrder = {
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
    };
    const parsed = parsePersistedTradeState({
      account: { balance: 9000, positions: [], orders: [legacyOrder], history: [] },
    });
    expect(parsed?.account.orders[0]).toEqual({
      ...legacyOrder,
      takeProfit: null,
      stopLoss: null,
    });
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
