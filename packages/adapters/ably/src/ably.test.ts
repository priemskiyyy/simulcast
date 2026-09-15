import { ErrorInfo, Realtime } from "ably";
import type { InboundMessage } from "ably";
import { beforeEach, expect, test, vi } from "vitest";
import { ably } from "src/ably";

const configuration = { options: { key: "app.key:secret" } };

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

// Ably's emitters expose `emit` at runtime only; the SDK never reaches these states without a server.
const emit = (emitter: object, event: string, change: object) => {
  if (!("emit" in emitter)) {
    throw new Error("Expected an Ably event emitter");
  }

  if (typeof emitter.emit !== "function") {
    throw new Error("Expected an Ably event emitter");
  }

  emitter.emit(event, change);
};

const isMessageListener = (
  value: unknown,
): value is (message: InboundMessage) => void => typeof value === "function";

const createMessage = (
  id: string,
  fields: Pick<InboundMessage, "name" | "data">,
): InboundMessage => ({
  ...fields,
  id,
  timestamp: 1,
  action: "message.create",
  version: {},
  annotations: { summary: {} },
});

beforeEach(() => {
  vi.spyOn(Realtime.prototype, "connect").mockImplementation(() => {});
});

test("creating the adapter opens nothing", () => {
  ably(configuration);

  expect(Realtime.prototype.connect).not.toHaveBeenCalled();
});

test("each connect creates a fresh client that reports mapped states and errors until disposed", () => {
  const adapter = ably(configuration);
  const close = vi.spyOn(Realtime.prototype, "close");
  const observer = connectionObserver();
  const connection = adapter.connect(observer);
  const other = adapter.connect(connectionObserver());
  const reason = new ErrorInfo("refused", 40100, 401);

  expect(connection.native).toBeInstanceOf(Realtime);
  expect(other.native).not.toBe(connection.native);
  expect(Realtime.prototype.connect).toHaveBeenCalledTimes(2);
  emit(connection.native.connection, "connecting", {
    previous: "initialized",
    current: "connecting",
  });
  emit(connection.native.connection, "connected", {
    previous: "connecting",
    current: "connected",
  });
  emit(connection.native.connection, "disconnected", {
    previous: "connected",
    current: "disconnected",
    retryIn: 15000,
  });
  emit(connection.native.connection, "suspended", {
    previous: "disconnected",
    current: "suspended",
  });
  emit(connection.native.connection, "failed", {
    previous: "suspended",
    current: "failed",
    reason,
  });
  expect(observer.state.mock.calls).toEqual([
    ["connecting"],
    ["connected"],
    ["connecting"],
    ["connecting"],
    ["disconnected"],
  ]);
  expect(observer.error).toHaveBeenCalledExactlyOnceWith({ error: reason });

  connection.dispose();
  connection.dispose();
  emit(connection.native.connection, "connected", {
    previous: "connecting",
    current: "connected",
  });

  expect(close).toHaveBeenCalledTimes(1);
  expect(observer.state).toHaveBeenCalledTimes(5);
  other.dispose();
});

test("subscribe attaches one channel that maps states, messages, and errors until disposed", () => {
  const adapter = ably(configuration);
  const connection = adapter.connect(connectionObserver());
  const channel = connection.native.channels.get("rooms:one");
  const subscribe = vi.spyOn(channel, "subscribe");
  const unsubscribe = vi.spyOn(channel, "unsubscribe");
  const detach = vi.spyOn(channel, "detach");
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({
    channel: "rooms:one",
    observer,
  });
  const listener = subscribe.mock.calls[0]?.[0];

  if (!isMessageListener(listener)) {
    throw new Error("Expected the adapter to subscribe with a listener");
  }

  expect(subscription.native).toBe(channel);
  expect(channel.state).toBe("attaching");
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  emit(channel, "attached", {
    previous: "attaching",
    current: "attached",
    resumed: false,
  });
  emit(channel, "update", {
    previous: "attached",
    current: "attached",
    resumed: false,
  });
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");
  expect(observer.state).toHaveBeenCalledTimes(2);

  const named = createMessage("m1", { name: "created", data: { id: 1 } });
  const unnamed = createMessage("m2", { data: { id: 2 } });
  listener(named);
  listener(unnamed);
  expect(observer.publication.mock.calls).toEqual([
    [{ event: "created", data: { id: 1 }, native: named }],
    [{ data: { id: 2 }, native: unnamed }],
  ]);
  expect(observer.publication.mock.calls[0]?.[0].native).toBe(named);
  expect(observer.publication.mock.calls[1]?.[0]).not.toHaveProperty("event");

  const reason = new ErrorInfo("denied", 40160, 401);
  emit(channel, "suspended", {
    previous: "attached",
    current: "suspended",
    resumed: false,
  });
  emit(channel, "failed", {
    previous: "suspended",
    current: "failed",
    resumed: false,
    reason,
  });
  expect(observer.state.mock.calls.slice(2)).toEqual([
    ["subscribing"],
    ["unsubscribed"],
  ]);
  expect(observer.error).toHaveBeenCalledExactlyOnceWith({ error: reason });

  subscription.dispose();
  subscription.dispose();
  listener(named);
  emit(channel, "attached", {
    previous: "attaching",
    current: "attached",
    resumed: false,
  });

  expect(unsubscribe).toHaveBeenCalledExactlyOnceWith(listener);
  expect(detach).toHaveBeenCalledTimes(1);
  expect(observer.publication).toHaveBeenCalledTimes(2);
  expect(observer.state).toHaveBeenCalledTimes(4);
  connection.dispose();
});

test("per-channel options reach the native channel", () => {
  const adapter = ably({
    ...configuration,
    getChannelOptions: () => ({ params: { rewind: "1" } }),
  });
  const connection = adapter.connect(connectionObserver());
  const get = vi.spyOn(connection.native.channels, "get");

  connection.subscribe({
    channel: "rooms:one",
    observer: subscriptionObserver(),
  });

  expect(get).toHaveBeenCalledExactlyOnceWith("rooms:one", {
    params: { rewind: "1" },
  });
  connection.dispose();
});

test("a channel already attaching through the native client is reported without a transition", () => {
  const adapter = ably(configuration);
  const connection = adapter.connect(connectionObserver());
  connection.native.channels
    .get("rooms:one")
    .attach()
    .catch(() => {});
  const observer = subscriptionObserver();

  connection.subscribe({ channel: "rooms:one", observer });

  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  connection.dispose();
});

test("disposing the connection detaches its channels without observer calls", () => {
  const adapter = ably(configuration);
  const connection = adapter.connect(connectionObserver());
  const channel = connection.native.channels.get("rooms:one");
  const detach = vi.spyOn(channel, "detach");
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({
    channel: "rooms:one",
    observer,
  });

  connection.dispose();
  subscription.dispose();

  expect(detach).toHaveBeenCalledTimes(1);
  expect(channel.state).toBe("detached");
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
});
