import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMarketWsClient, type WsStatus } from './marketWs';
import { WS_PING_INTERVAL_MS, WS_RECONNECT_BASE_MS } from '../config/market';

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  simulateMessage(payload: unknown): void {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  simulateDrop(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  sentOps(): { op: string; args?: string[] }[] {
    return this.sent.map((raw) => JSON.parse(raw) as { op: string; args?: string[] });
  }
}

function latestSocket(): MockWebSocket {
  const socket = MockWebSocket.instances.at(-1);
  if (socket === undefined) throw new Error('No MockWebSocket instance');
  return socket;
}

describe('createMarketWsClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('connects lazily and sends subscribe on open', () => {
    const client = createMarketWsClient('wss://test');
    expect(MockWebSocket.instances).toHaveLength(0);

    client.subscribe('tickers.BTCUSDT', vi.fn());
    expect(MockWebSocket.instances).toHaveLength(1);

    const socket = latestSocket();
    socket.simulateOpen();
    expect(socket.sentOps()).toContainEqual({ op: 'subscribe', args: ['tickers.BTCUSDT'] });
    expect(client.getStatus()).toBe('connected');
  });

  it('dispatches messages only to matching topic handlers', () => {
    const client = createMarketWsClient('wss://test');
    const btcHandler = vi.fn();
    const ethHandler = vi.fn();
    client.subscribe('tickers.BTCUSDT', btcHandler);
    client.subscribe('tickers.ETHUSDT', ethHandler);

    const socket = latestSocket();
    socket.simulateOpen();
    socket.simulateMessage({ topic: 'tickers.BTCUSDT', data: { symbol: 'BTCUSDT' } });

    expect(btcHandler).toHaveBeenCalledTimes(1);
    expect(ethHandler).not.toHaveBeenCalled();
  });

  it('deduplicates subscription for the same topic', () => {
    const client = createMarketWsClient('wss://test');
    client.subscribe('tickers.BTCUSDT', vi.fn());
    const socket = latestSocket();
    socket.simulateOpen();
    client.subscribe('tickers.BTCUSDT', vi.fn());

    const subscribeOps = socket.sentOps().filter((op) => op.op === 'subscribe');
    expect(subscribeOps).toHaveLength(1);
  });

  it('sends ping every 20 seconds while connected', () => {
    const client = createMarketWsClient('wss://test');
    client.subscribe('tickers.BTCUSDT', vi.fn());
    const socket = latestSocket();
    socket.simulateOpen();

    vi.advanceTimersByTime(WS_PING_INTERVAL_MS * 2);
    const pings = socket.sentOps().filter((op) => op.op === 'ping');
    expect(pings).toHaveLength(2);
  });

  it('reconnects with exponential backoff and resubscribes all topics', () => {
    const client = createMarketWsClient('wss://test');
    const statuses: WsStatus[] = [];
    client.onStatus((status) => statuses.push(status));
    client.subscribe('tickers.BTCUSDT', vi.fn());
    client.subscribe('kline.60.BTCUSDT', vi.fn());

    const first = latestSocket();
    first.simulateOpen();
    first.simulateDrop();
    expect(client.getStatus()).toBe('reconnecting');
    expect(MockWebSocket.instances).toHaveLength(1);

    vi.advanceTimersByTime(WS_RECONNECT_BASE_MS);
    expect(MockWebSocket.instances).toHaveLength(2);

    const second = latestSocket();
    second.simulateDrop();
    vi.advanceTimersByTime(WS_RECONNECT_BASE_MS);
    expect(MockWebSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(WS_RECONNECT_BASE_MS);
    expect(MockWebSocket.instances).toHaveLength(3);

    const third = latestSocket();
    third.simulateOpen();
    const resubscribe = third.sentOps().find((op) => op.op === 'subscribe');
    expect(resubscribe?.args).toEqual(['tickers.BTCUSDT', 'kline.60.BTCUSDT']);
    expect(client.getStatus()).toBe('connected');
    expect(statuses).toContain('reconnecting');
  });

  it('stops ping after disconnect', () => {
    const client = createMarketWsClient('wss://test');
    client.subscribe('tickers.BTCUSDT', vi.fn());
    const socket = latestSocket();
    socket.simulateOpen();
    socket.simulateDrop();

    const pingsBefore = socket.sentOps().filter((op) => op.op === 'ping').length;
    vi.advanceTimersByTime(WS_PING_INTERVAL_MS * 3);
    const pingsAfter = socket.sentOps().filter((op) => op.op === 'ping').length;
    expect(pingsAfter).toBe(pingsBefore);
  });

  it('unsubscribes topic and closes connection when no topics remain', () => {
    const client = createMarketWsClient('wss://test');
    const stopBtc = client.subscribe('tickers.BTCUSDT', vi.fn());
    const stopEth = client.subscribe('tickers.ETHUSDT', vi.fn());
    const socket = latestSocket();
    socket.simulateOpen();

    stopBtc();
    expect(socket.sentOps()).toContainEqual({ op: 'unsubscribe', args: ['tickers.BTCUSDT'] });
    expect(client.getStatus()).toBe('connected');

    stopEth();
    expect(client.getStatus()).toBe('idle');
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('does not dispatch to removed handlers', () => {
    const client = createMarketWsClient('wss://test');
    const handler = vi.fn();
    const keepAlive = vi.fn();
    const stop = client.subscribe('tickers.BTCUSDT', handler);
    client.subscribe('tickers.ETHUSDT', keepAlive);
    const socket = latestSocket();
    socket.simulateOpen();

    stop();
    socket.simulateMessage({ topic: 'tickers.BTCUSDT', data: {} });
    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores malformed JSON payloads', () => {
    const client = createMarketWsClient('wss://test');
    const handler = vi.fn();
    client.subscribe('tickers.BTCUSDT', handler);
    const socket = latestSocket();
    socket.simulateOpen();

    socket.onmessage?.({ data: 'not-json' });
    expect(handler).not.toHaveBeenCalled();
    expect(client.getStatus()).toBe('connected');
  });
});
