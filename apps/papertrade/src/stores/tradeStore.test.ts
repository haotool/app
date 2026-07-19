import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushTradePersist, parsePersistedTradeState, useTradeStore } from './tradeStore';
import { useMarketStore } from './marketStore';
import { useSoundPrefsStore } from './soundPrefsStore';
import { playLiquidationSound } from '../lib/sound';
import { createInitialAccount } from '../engine/engine';
import { INITIAL_BALANCE_USDT, TRADE_STORAGE_KEY, TRADE_STORAGE_VERSION } from '../config/trading';
import { type Ticker } from '../services/ticker';

vi.mock('../lib/sound', () => ({
  playLiquidationSound: vi.fn(),
}));

const playLiquidationSoundMock = vi.mocked(playLiquidationSound);

const NOW = 1_800_000_000_000;

function resetStore() {
  useTradeStore.setState({ account: createInitialAccount(), toasts: [] });
  useMarketStore.setState({ tickers: {} });
  useSoundPrefsStore.setState({ liquidationSound: true });
  playLiquidationSoundMock.mockClear();
  flushTradePersist();
}

function seedTicker(symbol: Ticker['symbol'], price: number) {
  useMarketStore.getState().setTicker({
    symbol,
    lastPrice: price,
    markPrice: price,
    price24hPcnt: 0,
    highPrice24h: price,
    lowPrice24h: price,
    turnover24h: 0,
    volume24h: 0,
  });
}

describe('useTradeStore', () => {
  beforeEach(resetStore);

  it('starts with the initial balance', () => {
    expect(useTradeStore.getState().account.balance).toBe(INITIAL_BALANCE_USDT);
  });

  it('opens a market position and deducts funds', () => {
    const result = useTradeStore.getState().openMarketOrder({
      marginMode: 'isolated',
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
      marginMode: 'isolated',
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
      marginMode: 'isolated',
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
      marginMode: 'isolated',
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
      marginMode: 'isolated',
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
    // 強平提示音與 toast 同路徑觸發（設定預設開啟）。
    expect(playLiquidationSoundMock).toHaveBeenCalledTimes(1);
  });

  it('keeps silent on liquidation when the sound preference is off', () => {
    useSoundPrefsStore.setState({ liquidationSound: false });
    useTradeStore.getState().openMarketOrder({
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    useTradeStore.getState().applyTick('BTCUSDT', 50000, NOW);

    expect(useTradeStore.getState().account.history[0]?.reason).toBe('liquidation');
    expect(playLiquidationSoundMock).not.toHaveBeenCalled();
  });

  it('does not play the liquidation sound on ordinary fills', () => {
    useTradeStore.getState().placeLimitOrder({
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      limitPrice: 58000,
      leverage: 10,
    });
    useTradeStore.getState().applyTick('BTCUSDT', 57900, NOW);

    expect(useTradeStore.getState().account.positions).toHaveLength(1);
    expect(playLiquidationSoundMock).not.toHaveBeenCalled();
  });

  it('fills limit orders on tick and pushes a toast', () => {
    useTradeStore.getState().placeLimitOrder({
      marginMode: 'isolated',
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

  it('lets a cross opening draw on unrealized profit and allows negative cash (R6-2)', () => {
    seedTicker('BTCUSDT', 60000);
    const first = useTradeStore.getState().openMarketOrder({
      marginMode: 'cross',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    expect(first.ok).toBe(true);

    // BTC 標記價漲至 70000：cross uPnL +1000 計入可用餘額。
    seedTicker('BTCUSDT', 70000);
    // 成本 9605.28 > 現金 9396.7，但 ≤ 可用 10396.7 → 放行，現金轉負。
    const second = useTradeStore.getState().openMarketOrder({
      marginMode: 'cross',
      symbol: 'ETHUSDT',
      side: 'long',
      qty: 3.2,
      price: 3000,
      leverage: 1,
    });
    expect(second.ok).toBe(true);
    expect(useTradeStore.getState().account.balance).toBeCloseTo(9396.7 - 9605.28, 8);
  });

  it('keeps the isolated opening bound to bare cash without cross positions', () => {
    seedTicker('BTCUSDT', 60000);
    const result = useTradeStore.getState().openMarketOrder({
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 100,
      price: 60000,
      leverage: 10,
    });
    expect(result).toEqual({ ok: false, error: 'insufficient-balance' });
  });

  it('aggregates cross liquidation across symbols on tick (R6-2)', () => {
    seedTicker('BTCUSDT', 60000);
    seedTicker('ETHUSDT', 3000);
    useTradeStore.getState().openMarketOrder({
      marginMode: 'cross',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.5,
      price: 60000,
      leverage: 100,
    });
    useTradeStore.getState().openMarketOrder({
      marginMode: 'cross',
      symbol: 'ETHUSDT',
      side: 'long',
      qty: 10,
      price: 3000,
      leverage: 100,
    });
    expect(useTradeStore.getState().account.balance).toBeCloseTo(9367, 8);

    // ETH 標記價崩至 1900（uPnL −11000 最虧）；BTC tick 40000（−10000）觸發聚合級聯強平。
    seedTicker('ETHUSDT', 1900);
    useTradeStore.getState().applyTick('BTCUSDT', 40000, NOW);

    const { account, toasts } = useTradeStore.getState();
    expect(account.positions).toHaveLength(0);
    expect(account.history.map((trade) => trade.symbol)).toEqual(['BTCUSDT', 'ETHUSDT']);
    expect(account.history.every((trade) => trade.reason === 'liquidation')).toBe(true);
    expect(toasts.some((toast) => toast.tone === 'warning')).toBe(true);
    expect(playLiquidationSoundMock).toHaveBeenCalledTimes(1);
  });

  it('skips the cross aggregation when another cross symbol lacks a mark', () => {
    seedTicker('BTCUSDT', 60000);
    seedTicker('ETHUSDT', 3000);
    useTradeStore.getState().openMarketOrder({
      marginMode: 'cross',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.5,
      price: 60000,
      leverage: 100,
    });
    useTradeStore.getState().openMarketOrder({
      marginMode: 'cross',
      symbol: 'ETHUSDT',
      side: 'long',
      qty: 10,
      price: 3000,
      leverage: 100,
    });

    // ETH 行情缺席（重置 tickers 僅留 BTC）：整輪略過，不以殘缺行情誤判強平。
    useMarketStore.setState({ tickers: {} });
    seedTicker('BTCUSDT', 40000);
    useTradeStore.getState().applyTick('BTCUSDT', 40000, NOW);

    expect(useTradeStore.getState().account.positions).toHaveLength(2);
  });

  it('caps visible toasts at the configured maximum', () => {
    for (let index = 0; index < 5; index += 1) {
      useTradeStore.getState().pushToast({ tone: 'long', title: `toast-${index}` });
    }
    expect(useTradeStore.getState().toasts.length).toBeLessThanOrEqual(3);
  });

  it('resets the account back to the initial state', () => {
    useTradeStore.getState().openMarketOrder({
      marginMode: 'isolated',
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
        state: { account: { balance: 'nope', positions: [], orders: [], history: [] } },
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
        version: 1,
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
    // v2 → v4 鏈式遷移：tpSlCloseRatio 與 marginMode 一次補齊。
    expect(account.positions[0]?.marginMode).toBe('isolated');
    expect(account.positions[0]?.takeProfit).toBe(61000);
    expect(toasts.some((toast) => toast.tone === 'warning')).toBe(false);
  });

  it('migrates a v3 account by filling marginMode on positions and orders (R6-2)', async () => {
    const v3Position = {
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
      tpSlCloseRatio: 0.5,
      trailing: null,
    };
    const v3Order = {
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
      takeProfit: null,
      stopLoss: null,
    };
    window.localStorage.setItem(
      TRADE_STORAGE_KEY,
      JSON.stringify({
        state: {
          account: { balance: 7777, positions: [v3Position], orders: [v3Order], history: [] },
        },
        version: 3,
      }),
    );
    await useTradeStore.persist.rehydrate();

    const { account, toasts } = useTradeStore.getState();
    expect(account.balance).toBe(7777);
    expect(account.positions[0]?.marginMode).toBe('isolated');
    // 既有欄位無損保留（含部分平倉比例）。
    expect(account.positions[0]?.tpSlCloseRatio).toBe(0.5);
    expect(account.orders[0]?.marginMode).toBe('isolated');
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
      marginMode: 'isolated',
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
        account: {
          balance: 100,
          positions: [{ id: 'x', symbol: 'FAKEUSDT' }],
          orders: [],
          history: [],
        },
      }),
    ).toBeNull();
  });

  it('accepts a negative cash balance (cross opening against unrealized profit)', () => {
    // R6-2：cross 可用餘額含未實現盈利，開倉後現金可暫為負；schema 不得比引擎輸出域更嚴。
    const state = {
      account: { balance: -503.3, positions: [], orders: [], history: [] },
    };
    expect(parsePersistedTradeState(state)).toEqual(state);
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
            marginMode: 'isolated',
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
            marginMode: 'isolated',
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
            marginMode: 'isolated',
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
      marginMode: 'isolated',
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
