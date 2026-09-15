import { Socket } from "socket.io-client";
import { beforeEach, expect, test, vi } from "vitest";
import { socketio } from "src/socketio";

const configuration = { url: "http://localhost:1" };

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

const fire = (socket: Socket, event: string, ...args: unknown[]) => {
  for (const listener of socket.listeners(event)) {
    listener(...args);
  }
};

// `active` reads Socket.IO's reconnection bookkeeping, which never runs without a network.
const setActive = (socket: Socket, active: boolean) => {
  Object.defineProperty(socket, "active", {
    value: active,
    configurable: true,
  });
};

beforeEach(() => {
  vi.spyOn(Socket.prototype, "connect").mockImplementation(function (
    this: Socket,
  ) {
    return this;
  });
});

test("creating the adapter opens nothing", () => {
  socketio(configuration);

  expect(Socket.prototype.connect).not.toHaveBeenCalled();
});

test("each connect creates a fresh socket that reports mapped states and errors until disposed", () => {
  const adapter = socketio(configuration);
  const disconnect = vi.spyOn(Socket.prototype, "disconnect");
  const observer = connectionObserver();
  const connection = adapter.connect(observer);
  const other = adapter.connect(connectionObserver());
  const error = new Error("refused");

  expect(connection.native).toBeInstanceOf(Socket);
  expect(other.native).not.toBe(connection.native);
  expect(Socket.prototype.connect).toHaveBeenCalledTimes(2);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("connecting");
  fire(connection.native, "connect");
  setActive(connection.native, true);
  fire(connection.native, "disconnect", "transport close");
  fire(connection.native, "connect_error", error);
  setActive(connection.native, false);
  fire(connection.native, "disconnect", "io server disconnect");
  expect(observer.state.mock.calls).toEqual([
    ["connecting"],
    ["connected"],
    ["connecting"],
    ["connecting"],
    ["disconnected"],
  ]);
  expect(observer.error).toHaveBeenCalledExactlyOnceWith({ error });

  connection.dispose();
  connection.dispose();
  fire(connection.native, "connect");

  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(connection.native.listeners("connect")).toEqual([]);
  expect(observer.state).toHaveBeenCalledTimes(5);
  other.dispose();
});

test("subscribe listens to one event and mirrors the connection until disposed", () => {
  const adapter = socketio(configuration);
  const connection = adapter.connect(connectionObserver());
  const socket = connection.native;
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({
    channel: "message-created",
    observer,
  });

  expect(subscription.native).toBe(socket);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  fire(socket, "connect");
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");
  fire(socket, "message-created", { id: 1 }, "extra");
  expect(observer.publication).toHaveBeenCalledExactlyOnceWith({
    event: "message-created",
    data: { id: 1 },
    native: [{ id: 1 }, "extra"],
  });
  setActive(socket, true);
  fire(socket, "disconnect", "transport close");
  expect(observer.state).toHaveBeenLastCalledWith("subscribing");
  setActive(socket, false);
  fire(socket, "disconnect", "io client disconnect");
  expect(observer.state).toHaveBeenLastCalledWith("unsubscribed");

  subscription.dispose();
  subscription.dispose();
  fire(socket, "message-created", { id: 2 });
  fire(socket, "connect");

  expect(socket.listeners("message-created")).toEqual([]);
  expect(observer.publication).toHaveBeenCalledTimes(1);
  expect(observer.state).toHaveBeenCalledTimes(4);
  connection.dispose();
});

test("disposing the connection releases its subscriptions without observer calls", () => {
  const adapter = socketio(configuration);
  const connection = adapter.connect(connectionObserver());
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "rooms", observer });

  connection.dispose();
  subscription.dispose();
  fire(connection.native, "rooms", {});

  expect(connection.native.listeners("rooms")).toEqual([]);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  expect(observer.publication).not.toHaveBeenCalled();
});
