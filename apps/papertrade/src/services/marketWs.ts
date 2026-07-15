import {
  BYBIT_WS_URL,
  WS_PING_INTERVAL_MS,
  WS_RECONNECT_BASE_MS,
  WS_RECONNECT_MAX_MS,
} from '../config/market';

export type WsStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting';

type MessageHandler = (message: unknown) => void;
type StatusHandler = (status: WsStatus) => void;

export interface MarketWsClient {
  subscribe(topic: string, handler: MessageHandler): () => void;
  onStatus(handler: StatusHandler): () => void;
  getStatus(): WsStatus;
}

function hasTopic(message: unknown): message is { topic: string } {
  return (
    typeof message === 'object' &&
    message !== null &&
    'topic' in message &&
    typeof message.topic === 'string'
  );
}

export function createMarketWsClient(url: string): MarketWsClient {
  let ws: WebSocket | null = null;
  let status: WsStatus = 'idle';
  let reconnectAttempt = 0;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const topicHandlers = new Map<string, Set<MessageHandler>>();
  const statusHandlers = new Set<StatusHandler>();

  function setStatus(next: WsStatus): void {
    if (status === next) return;
    status = next;
    statusHandlers.forEach((handler) => handler(next));
  }

  function send(payload: Record<string, unknown>): void {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  function stopPing(): void {
    if (pingTimer !== null) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  function startPing(): void {
    stopPing();
    pingTimer = setInterval(() => send({ op: 'ping' }), WS_PING_INTERVAL_MS);
  }

  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function handleOpen(): void {
    reconnectAttempt = 0;
    setStatus('connected');
    const topics = [...topicHandlers.keys()];
    if (topics.length > 0) {
      send({ op: 'subscribe', args: topics });
    }
    startPing();
  }

  function handleMessage(event: MessageEvent): void {
    let message: unknown;
    try {
      message = JSON.parse(String(event.data));
    } catch {
      return;
    }
    if (!hasTopic(message)) return;
    const handlers = topicHandlers.get(message.topic);
    handlers?.forEach((handler) => handler(message));
  }

  function scheduleReconnect(): void {
    clearReconnectTimer();
    reconnectAttempt += 1;
    const delay = Math.min(WS_RECONNECT_BASE_MS * 2 ** (reconnectAttempt - 1), WS_RECONNECT_MAX_MS);
    reconnectTimer = setTimeout(connect, delay);
  }

  function handleClose(): void {
    stopPing();
    ws = null;
    if (topicHandlers.size === 0) {
      setStatus('idle');
      return;
    }
    setStatus('reconnecting');
    scheduleReconnect();
  }

  function connect(): void {
    if (ws !== null) return;
    setStatus(reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
    const socket = new WebSocket(url);
    ws = socket;
    socket.onopen = handleOpen;
    socket.onmessage = handleMessage;
    socket.onclose = handleClose;
  }

  function teardown(): void {
    clearReconnectTimer();
    stopPing();
    reconnectAttempt = 0;
    if (ws !== null) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.close();
      ws = null;
    }
    setStatus('idle');
  }

  function subscribe(topic: string, handler: MessageHandler): () => void {
    let handlers = topicHandlers.get(topic);
    const isNewTopic = handlers === undefined;
    if (handlers === undefined) {
      handlers = new Set();
      topicHandlers.set(topic, handlers);
    }
    handlers.add(handler);

    if (ws === null && reconnectTimer === null) {
      connect();
    } else if (isNewTopic) {
      send({ op: 'subscribe', args: [topic] });
    }

    return () => {
      const current = topicHandlers.get(topic);
      if (current === undefined) return;
      current.delete(handler);
      if (current.size > 0) return;
      topicHandlers.delete(topic);
      send({ op: 'unsubscribe', args: [topic] });
      if (topicHandlers.size === 0) {
        teardown();
      }
    };
  }

  function onStatus(handler: StatusHandler): () => void {
    statusHandlers.add(handler);
    handler(status);
    return () => {
      statusHandlers.delete(handler);
    };
  }

  return {
    subscribe,
    onStatus,
    getStatus: () => status,
  };
}

export const marketWs = createMarketWsClient(BYBIT_WS_URL);
