import Pusher from "pusher-js";
import { beforeEach, expect, test, vi } from "vitest";
import { pusher } from "src/pusher";

const configuration = { key: "app-key", options: { cluster: "eu" } };

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

const changeConnectionState = (client: Pusher, current: string) => {
  const previous = client.connection.state;
  client.connection.state = current;
  client.connection.emit("state_change", { previous, current });
};

beforeEach(() => {
  // Like the SDK, connecting is a no-op once a connection attempt exists.
  vi.spyOn(Pusher.prototype, "connect").mockImplementation(function (
    this: Pusher,
  ) {
    if (this.connection.state !== "initialized") {
      return;
    }

    changeConnectionState(this, "connecting");
  });
});

test("creating the adapter opens nothing", () => {
  pusher(configuration);

  expect(Pusher.prototype.connect).not.toHaveBeenCalled();
});

test("each connect creates a fresh client that reports mapped states until disposed", async () => {
  const adapter = pusher(configuration);
  const disconnect = vi.spyOn(Pusher.prototype, "disconnect");
  const observer = connectionObserver();
  const connection = adapter.connect(observer);
  const other = adapter.connect(connectionObserver());

  expect(connection.native).toBeInstanceOf(Pusher);
  expect(other.native).not.toBe(connection.native);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("connecting");
  changeConnectionState(connection.native, "connected");
  changeConnectionState(connection.native, "unavailable");
  changeConnectionState(connection.native, "failed");
  const error = { type: "WebSocketError", error: { code: 4001 } };
  connection.native.connection.emit("error", error);
  expect(observer.state.mock.calls.slice(1)).toEqual([
    ["connected"],
    ["connecting"],
    ["disconnected"],
  ]);
  expect(observer.error).toHaveBeenCalledExactlyOnceWith({ error });

  connection.dispose();
  connection.dispose();
  changeConnectionState(connection.native, "connected");
  connection.native.connection.emit("error", error);

  await Promise.resolve();
  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(observer.state).toHaveBeenCalledTimes(4);
  expect(observer.error).toHaveBeenCalledTimes(1);
  other.dispose();
});

test("subscribe binds one channel that maps protocol events to states and the rest to publications", () => {
  const adapter = pusher(configuration);
  const connection = adapter.connect(connectionObserver());
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({
    channel: "private-rooms",
    observer,
  });
  const channel = subscription.native;

  expect(connection.native.channel("private-rooms")).toBe(channel);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  channel.emit("pusher:subscription_succeeded", {});
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");
  channel.emit("pusher:member_added", { id: "user" });
  channel.emit("message-created", { id: 1 });
  expect(observer.publication).toHaveBeenCalledExactlyOnceWith({
    event: "message-created",
    data: { id: 1 },
    native: { event: "message-created", data: { id: 1 } },
  });
  const failure = { type: "AuthError", status: 403 };
  channel.emit("pusher:subscription_error", failure);
  expect(observer.error).toHaveBeenCalledExactlyOnceWith({ error: failure });
  expect(observer.state).toHaveBeenLastCalledWith("unsubscribed");

  subscription.dispose();
  subscription.dispose();
  channel.emit("message-created", { id: 2 });
  channel.emit("pusher:subscription_succeeded", {});

  expect(connection.native.channel("private-rooms")).toBeUndefined();
  expect(observer.state).toHaveBeenCalledTimes(3);
  expect(observer.publication).toHaveBeenCalledTimes(1);
  connection.dispose();
});

test("a subscribed channel reports subscribing across a reconnect exactly once", () => {
  const adapter = pusher(configuration);
  const connection = adapter.connect(connectionObserver());
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "rooms", observer });

  changeConnectionState(connection.native, "connected");
  subscription.native.emit("pusher:subscription_succeeded", {});
  changeConnectionState(connection.native, "connecting");
  changeConnectionState(connection.native, "unavailable");
  changeConnectionState(connection.native, "connected");
  subscription.native.emit("pusher:subscription_succeeded", {});

  expect(observer.state.mock.calls).toEqual([
    ["subscribing"],
    ["subscribed"],
    ["subscribing"],
    ["subscribed"],
  ]);
  connection.dispose();
});

test("a channel already subscribed through the native client reports subscribed immediately", () => {
  const adapter = pusher(configuration);
  const connection = adapter.connect(connectionObserver());
  connection.native.subscribe("rooms").subscribed = true;
  const observer = subscriptionObserver();

  connection.subscribe({ channel: "rooms", observer });

  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribed");
  connection.dispose();
});

test("disposing the connection releases its subscriptions without observer calls", () => {
  const adapter = pusher(configuration);
  const connection = adapter.connect(connectionObserver());
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "rooms", observer });

  connection.dispose();
  changeConnectionState(connection.native, "disconnected");
  subscription.native.emit("message-created", {});
  subscription.dispose();

  expect(connection.native.channel("rooms")).toBeUndefined();
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  expect(observer.publication).not.toHaveBeenCalled();
});

test("a client that fails while its constructor connects reports nothing", () => {
  const failure = new Error("connect failed");
  vi.mocked(Pusher.prototype.connect).mockImplementationOnce(() => {
    throw failure;
  });
  const observer = connectionObserver();

  expect(() => pusher(configuration).connect(observer)).toThrow(failure);
  expect(observer.state).not.toHaveBeenCalled();
});

test("synchronous custom authorization rejection reaches a late subscription", async () => {
  const failure = new Error("Access denied");
  const customHandler = vi.fn<Pusher["config"]["channelAuthorizer"]>(
    (params, callback) => {
      expect(params.channelName).toBe("private-rooms");
      callback(failure, null);
    },
  );
  const connection = pusher({
    key: "app-key",
    options: { cluster: "eu", channelAuthorization: { customHandler } },
  }).connect(connectionObserver());
  changeConnectionState(connection.native, "connected");
  const observer = subscriptionObserver();
  connection.subscribe({ channel: "private-rooms", observer });
  await Promise.resolve();

  expect(customHandler).toHaveBeenCalledTimes(1);
  expect(customHandler.mock.contexts[0]).toBe(connection.native.config);
  expect(observer.error).toHaveBeenCalledExactlyOnceWith({
    error: { type: "AuthError", error: "Access denied" },
  });
  expect(observer.state).toHaveBeenLastCalledWith("unsubscribed");
  expect(observer.publication).not.toHaveBeenCalled();
  connection.dispose();
});
