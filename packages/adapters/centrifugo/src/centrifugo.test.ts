import { Centrifuge, State, Subscription, SubscriptionState } from "centrifuge";
import type {
  PublicationContext,
  SubscribedContext,
  SubscriptionErrorContext,
} from "centrifuge";
import { RealtimeClient, createRealtimeAdapter } from "@priemskiyyy/simulcast";
import type { RealtimeChannel } from "@priemskiyyy/simulcast";
import { beforeEach, expect, expectTypeOf, test, vi } from "vitest";
import { centrifugo } from "src/centrifugo";

const transport = "ws://localhost:8000/connection/websocket";

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

beforeEach(() => {
  vi.spyOn(Centrifuge.prototype, "connect").mockImplementation(function (
    this: Centrifuge,
  ) {
    this.emit("state", {
      oldState: State.Disconnected,
      newState: State.Connecting,
    });
  });
});

const subscribedContext = ({
  wasRecovering = false,
  recovered = false,
}): SubscribedContext => ({
  channel: "rooms:one",
  recoverable: true,
  positioned: false,
  wasRecovering,
  recovered,
  hasRecoveredPublications: recovered,
});

test("creating the adapter opens nothing", () => {
  centrifugo({ transport });

  expect(Centrifuge.prototype.connect).not.toHaveBeenCalled();
});

test("each connect creates a fresh client that reports mapped states until disposed", () => {
  const adapter = centrifugo({ transport });
  const disconnect = vi.spyOn(Centrifuge.prototype, "disconnect");
  const first = connectionObserver();
  const second = connectionObserver();
  const connection = adapter.connect(first);
  const other = adapter.connect(second);

  expect(connection.native).toBeInstanceOf(Centrifuge);
  expect(other.native).not.toBe(connection.native);
  expect(first.state).toHaveBeenCalledExactlyOnceWith("connecting");
  connection.native.emit("state", {
    oldState: State.Connecting,
    newState: State.Connected,
  });
  const error = { type: "transport", error: { code: 1, message: "boom" } };
  connection.native.emit("error", error);
  expect(first.state).toHaveBeenLastCalledWith("connected");
  expect(first.error).toHaveBeenCalledExactlyOnceWith({ error });
  expect(second.state).toHaveBeenCalledExactlyOnceWith("connecting");

  connection.dispose();
  connection.dispose();
  connection.native.emit("state", {
    oldState: State.Connected,
    newState: State.Disconnected,
  });
  connection.native.emit("error", error);

  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(connection.native.listeners("state")).toEqual([]);
  expect(first.state).toHaveBeenCalledTimes(2);
  expect(first.error).toHaveBeenCalledTimes(1);
  other.dispose();
});

test("resubscribing reports whether Centrifugo replayed the gap", () => {
  const adapter = centrifugo({ transport });
  const connection = adapter.connect(connectionObserver());
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({
    channel: "rooms:one",
    observer,
  });

  subscription.native.emit(
    "subscribed",
    subscribedContext({ wasRecovering: true, recovered: true }),
  );
  expect(observer.state).toHaveBeenLastCalledWith("subscribed", {
    recovered: true,
  });

  // Recovery was attempted and failed, so publications were missed.
  subscription.native.emit(
    "subscribed",
    subscribedContext({ wasRecovering: true, recovered: false }),
  );
  expect(observer.state).toHaveBeenLastCalledWith("subscribed", {
    recovered: false,
  });

  subscription.dispose();
  subscription.native.emit("subscribed", subscribedContext({}));
  expect(observer.state).toHaveBeenCalledTimes(3);
  connection.dispose();
});

test("subscribe creates one native subscription that maps states, publications, and errors until disposed", () => {
  const adapter = centrifugo({ transport });
  const connection = adapter.connect(connectionObserver());
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({
    channel: "rooms:one",
    observer,
  });

  expect(connection.native.getSubscription("rooms:one")).toBe(
    subscription.native,
  );
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  const publication = { channel: "rooms:one", data: { text: "hi" }, offset: 7 };
  subscription.native.emit("publication", publication);
  expect(observer.publication).toHaveBeenCalledExactlyOnceWith({
    data: { text: "hi" },
    native: publication,
  });
  expect(observer.publication.mock.calls[0]?.[0].native).toBe(publication);
  // Centrifugo emits `state` first, but only `subscribed` knows what was recovered.
  subscription.native.emit("state", {
    channel: "rooms:one",
    oldState: SubscriptionState.Subscribing,
    newState: SubscriptionState.Subscribed,
  });
  subscription.native.emit("subscribed", subscribedContext({}));
  expect(observer.state).toHaveBeenLastCalledWith("subscribed", {
    recovered: false,
  });
  const error: SubscriptionErrorContext = {
    channel: "rooms:one",
    type: "subscribe",
    error: { code: 1, message: "denied" },
  };
  subscription.native.emit("error", error);
  expect(observer.error).toHaveBeenCalledExactlyOnceWith({ error });

  subscription.dispose();
  subscription.dispose();
  subscription.native.emit("publication", publication);
  subscription.native.emit("error", error);

  expect(connection.native.subscriptions()).toEqual({});
  expect(subscription.native.state).toBe(SubscriptionState.Unsubscribed);
  expect(observer.state).toHaveBeenCalledTimes(2);
  expect(observer.publication).toHaveBeenCalledTimes(1);
  expect(observer.error).toHaveBeenCalledTimes(1);
  connection.dispose();
});

test("per-channel subscription options reach the native subscription", () => {
  const create = vi.spyOn(Centrifuge.prototype, "newSubscription");
  const adapter = centrifugo({
    transport,
    getSubscriptionOptions: (channel) => ({ token: `${channel}-token` }),
  });
  const connection = adapter.connect(connectionObserver());

  connection.subscribe({
    channel: "rooms:one",
    observer: subscriptionObserver(),
  });

  expect(create).toHaveBeenCalledExactlyOnceWith("rooms:one", {
    token: "rooms:one-token",
  });
  connection.dispose();
});

test("disposing the connection releases its subscriptions without observer calls", () => {
  const adapter = centrifugo({ transport });
  const connection = adapter.connect(connectionObserver());
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({
    channel: "rooms:one",
    observer,
  });

  connection.dispose();
  subscription.dispose();

  expect(connection.native.subscriptions()).toEqual({});
  expect(subscription.native.listeners("state")).toEqual([]);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
});

test("a failing subscribe leaves no native subscription behind so the channel can be retried", () => {
  const failure = new Error("subscribe failed");
  vi.spyOn(Subscription.prototype, "subscribe").mockImplementationOnce(() => {
    throw failure;
  });
  const adapter = centrifugo({ transport });
  const connection = adapter.connect(connectionObserver());
  const observer = subscriptionObserver();

  expect(() =>
    connection.subscribe({ channel: "rooms:one", observer }),
  ).toThrow(failure);
  expect(connection.native.subscriptions()).toEqual({});
  const retry = connection.subscribe({ channel: "rooms:one", observer });
  expect(connection.native.getSubscription("rooms:one")).toBe(retry.native);
  connection.dispose();
});

test("a failing connect disconnects the client and reports nothing", () => {
  const failure = new Error("connect failed");
  vi.mocked(Centrifuge.prototype.connect).mockImplementationOnce(() => {
    throw failure;
  });
  const disconnect = vi.spyOn(Centrifuge.prototype, "disconnect");
  const observer = connectionObserver();

  expect(() => centrifugo({ transport }).connect(observer)).toThrow(failure);
  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(observer.state).not.toHaveBeenCalled();
});

test("native types flow from the adapter into the client without extra generics", () => {
  const client = new RealtimeClient({ adapter: centrifugo({ transport }) });

  expectTypeOf(client.native.get()).toEqualTypeOf<Centrifuge | null>();
  expectTypeOf(client.channel("rooms:one")).toEqualTypeOf<
    RealtimeChannel<PublicationContext>
  >();

  type Client = { id: string };
  type Message = { body: string };
  type Channel = { name: string };
  const custom = new RealtimeClient({
    adapter: createRealtimeAdapter<Client, Message, Channel>({
      name: "custom",
      connect: () => {
        throw new Error("Type-only adapter");
      },
    }),
  });

  expectTypeOf(custom.native.get()).toEqualTypeOf<Client | null>();
  expectTypeOf(custom.channel("rooms:one")).toEqualTypeOf<
    RealtimeChannel<Message>
  >();
});
