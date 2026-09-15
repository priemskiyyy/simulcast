import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { WebSocketFrame } from "src/types/WebSocketProtocol";
import { websocket } from "src/websocket";

class FakeWebSocket extends EventTarget {
  static instances: FakeWebSocket[] = [];
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  readyState = 0;
  sent: string[] = [];

  constructor(readonly url: string) {
    super();
    FakeWebSocket.instances.push(this);
  }

  send(frame: WebSocketFrame) {
    if (typeof frame !== "string") {
      throw new Error("Expected string frames");
    }

    this.sent.push(frame);
  }

  close() {
    this.readyState = 3;
    this.dispatchEvent(Object.assign(new Event("close"), { code: 1000 }));
  }

  open() {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }

  drop(code: number) {
    this.readyState = 3;
    this.dispatchEvent(Object.assign(new Event("close"), { code }));
  }

  receive(data: unknown) {
    this.dispatchEvent(
      new MessageEvent("message", { data: JSON.stringify(data) }),
    );
  }
}

const protocol = {
  subscribe: (channel: string) =>
    JSON.stringify({ type: "subscribe", channel }),
  unsubscribe: (channel: string) =>
    JSON.stringify({ type: "unsubscribe", channel }),
  decode: ({ data }: MessageEvent) => {
    const frame: unknown = JSON.parse(String(data));

    if (typeof frame !== "object" || frame === null || !("channel" in frame)) {
      return null;
    }

    if (typeof frame.channel !== "string" || !("data" in frame)) {
      return null;
    }

    return { channel: frame.channel, data: frame.data };
  },
};
const configuration = () => ({
  url: "ws://localhost/realtime",
  protocol,
  webSocket: FakeWebSocket,
});
const latestSocket = () => {
  const socket = FakeWebSocket.instances.at(-1);

  if (socket === undefined) {
    throw new Error("Expected the adapter to open a socket");
  }

  return socket;
};

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

beforeEach(() => {
  vi.useFakeTimers();
  FakeWebSocket.instances = [];
});
afterEach(() => {
  vi.useRealTimers();
});

test("creating the adapter opens nothing", () => {
  websocket(configuration());

  expect(FakeWebSocket.instances).toEqual([]);
});

test("each connect opens a fresh socket and reports its lifecycle until disposed", () => {
  const adapter = websocket(configuration());
  const observer = connectionObserver();
  const connection = adapter.connect(observer);
  const socket = latestSocket();
  const other = adapter.connect(connectionObserver());

  expect(FakeWebSocket.instances).toHaveLength(2);
  expect(connection.native.socket).toBe(socket);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("connecting");
  socket.open();
  expect(observer.state).toHaveBeenLastCalledWith("connected");
  socket.dispatchEvent(new Event("error"));
  expect(observer.error).toHaveBeenCalledTimes(1);

  connection.dispose();
  connection.dispose();
  expect(socket.readyState).toBe(3);
  socket.open();

  expect(observer.state).toHaveBeenCalledTimes(2);
  other.dispose();
});

test("subscribe sends the protocol frames and routes decoded publications until disposed", () => {
  const adapter = websocket(configuration());
  const connection = adapter.connect(connectionObserver());
  const socket = latestSocket();
  const observer = subscriptionObserver();
  const early = connection.subscribe({ channel: "rooms:one", observer });

  expect(early.native).toBe("rooms:one");
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  expect(socket.sent).toEqual([]);
  socket.open();
  expect(socket.sent).toEqual([protocol.subscribe("rooms:one")]);
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");

  const late = subscriptionObserver();
  connection.subscribe({ channel: "rooms:two", observer: late });
  expect(socket.sent).toEqual([
    protocol.subscribe("rooms:one"),
    protocol.subscribe("rooms:two"),
  ]);
  expect(late.state).toHaveBeenCalledExactlyOnceWith("subscribed");

  socket.receive({ channel: "rooms:one", data: { id: 1 } });
  socket.receive({ channel: "rooms:three", data: { id: 2 } });
  socket.receive({ type: "pong" });
  expect(observer.publication).toHaveBeenCalledExactlyOnceWith({
    data: { id: 1 },
    native: expect.any(MessageEvent),
  });
  expect(late.publication).not.toHaveBeenCalled();
  expect(connection.native.send("ping")).toBe(true);
  expect(socket.sent.at(-1)).toBe("ping");

  early.dispose();
  early.dispose();
  socket.receive({ channel: "rooms:one", data: { id: 3 } });

  expect(socket.sent.at(-1)).toBe(protocol.unsubscribe("rooms:one"));
  expect(observer.publication).toHaveBeenCalledTimes(1);
  connection.dispose();
});

test("a dropped socket reopens after the delay and resubscribes demanded channels", () => {
  const delays: number[] = [];
  const adapter = websocket({
    ...configuration(),
    reconnectDelay: (attempt) => {
      delays.push(attempt);
      return 500;
    },
  });
  const connectionObserverInstance = connectionObserver();
  const connection = adapter.connect(connectionObserverInstance);
  const first = latestSocket();
  const observer = subscriptionObserver();
  connection.subscribe({ channel: "rooms:one", observer });
  first.open();

  first.drop(1006);

  expect(connectionObserverInstance.state).toHaveBeenLastCalledWith(
    "connecting",
  );
  expect(observer.state).toHaveBeenLastCalledWith("subscribing");
  expect(connection.native.socket).toBeNull();
  expect(connection.native.send("ping")).toBe(false);
  expect(FakeWebSocket.instances).toHaveLength(1);
  vi.advanceTimersByTime(500);
  const second = latestSocket();
  expect(second).not.toBe(first);
  second.open();
  expect(second.sent).toEqual([protocol.subscribe("rooms:one")]);
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");
  expect(connectionObserverInstance.state).toHaveBeenLastCalledWith(
    "connected",
  );
  expect(delays).toEqual([0]);

  second.drop(1006);
  connection.dispose();
  vi.advanceTimersByTime(5_000);

  expect(FakeWebSocket.instances).toHaveLength(2);
});

test("a zero delay stops reconnecting and releases every channel", () => {
  const adapter = websocket({ ...configuration(), reconnectDelay: 0 });
  const connectionObserverInstance = connectionObserver();
  const connection = adapter.connect(connectionObserverInstance);
  const socket = latestSocket();
  const observer = subscriptionObserver();
  connection.subscribe({ channel: "rooms:one", observer });
  socket.open();

  socket.drop(1006);
  vi.advanceTimersByTime(5_000);

  expect(connectionObserverInstance.state).toHaveBeenLastCalledWith(
    "disconnected",
  );
  expect(observer.state).toHaveBeenLastCalledWith("unsubscribed");
  expect(FakeWebSocket.instances).toHaveLength(1);
  connection.dispose();
});

test("disposing inside a reconnect notification cancels the scheduled socket", () => {
  const adapter = websocket(configuration());
  const connection = adapter.connect(connectionObserver());
  const socket = latestSocket();
  socket.open();
  connection.subscribe({
    channel: "rooms:one",
    observer: {
      ...subscriptionObserver(),
      state: (state) => {
        if (state === "subscribing") connection.dispose();
      },
    },
  });

  socket.drop(1006);
  vi.advanceTimersByTime(5_000);

  expect(FakeWebSocket.instances).toHaveLength(1);
  expect(connection.native.socket).toBeNull();
});

test("a missing WebSocket implementation fails at connect with a clear message", () => {
  const original = globalThis.WebSocket;
  Object.defineProperty(globalThis, "WebSocket", {
    value: undefined,
    configurable: true,
  });

  try {
    expect(() =>
      websocket({ url: "ws://localhost", protocol }).connect(
        connectionObserver(),
      ),
    ).toThrow("No WebSocket implementation");
  } finally {
    Object.defineProperty(globalThis, "WebSocket", {
      value: original,
      configurable: true,
    });
  }
});
