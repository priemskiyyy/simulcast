import { cleanup, render, screen } from "@testing-library/svelte";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { createMockAdapter } from "@priemskiyyy/simulcast/mock";
import type {
  MockAdapterOptions,
  MockConnection,
} from "@priemskiyyy/simulcast/mock";
import { flushSync } from "svelte";
import { afterEach, expect, test, vi } from "vitest";
import Harness from "./Harness.fixture.svelte";
import Room from "./Room.fixture.svelte";

afterEach(cleanup);

const createHarness = (options?: MockAdapterOptions) => {
  const { adapter, connections } = createMockAdapter(options);
  const client = new RealtimeClient({ adapter });

  return { client, connections };
};

const activeChannels = (connection: MockConnection | undefined) =>
  connection?.subscriptions
    .filter((subscription) => subscription.disposeCount === 0)
    .map((subscription) => subscription.channel);

const subscriptionFor = (connections: MockConnection[], channel: string) => {
  const subscription = connections
    .flatMap((connection) => connection.subscriptions)
    .filter((candidate) => candidate.channel === channel)
    .filter((candidate) => candidate.disposeCount === 0)
    .at(-1);

  if (subscription === undefined) {
    throw new Error(`Expected an active subscription to ${channel}`);
  }

  return subscription;
};

const text = (testId: string) => screen.getByTestId(testId).textContent;

test("the provider connects, exposes the client, and disconnects on unmount", () => {
  const { client, connections } = createHarness();
  const onClient = vi.fn();
  const { unmount } = render(Harness, {
    client,
    room: { channel: "rooms:one", onClient },
  });

  expect(onClient).toHaveBeenCalledExactlyOnceWith(client);
  expect(connections).toHaveLength(1);
  expect(client.native.get()).toBe(connections[0]);
  unmount();
  expect(connections[0]?.disposeCount).toBe(1);
  expect(client.native.get()).toBeNull();
});

test("utilities require a provider", () => {
  expect(() => render(Room, { channel: "rooms:one" })).toThrow(
    "within a RealtimeProvider",
  );
});

test("the session ID and enabled flag control the connection while object identity is inert", async () => {
  const { client, connections } = createHarness({
    onConnect: (connection) => connection.observer.state("connecting"),
  });
  const room = { channel: "rooms:one" };
  const { rerender } = render(Harness, {
    client,
    session: { id: "one" },
    room,
  });

  expect(connections).toHaveLength(1);
  expect(activeChannels(connections[0])).toEqual(["rooms:one"]);
  expect(text("connection")).toBe("connecting");
  await rerender({ client, session: { id: "one" }, room });
  expect(connections).toHaveLength(1);
  await rerender({ client, session: { id: "two" }, room });
  expect(connections).toHaveLength(2);
  expect(connections[0]?.disposeCount).toBe(1);
  expect(activeChannels(connections[1])).toEqual(["rooms:one"]);
  await rerender({ client, session: { id: "two", enabled: false }, room });
  expect(connections[1]?.disposeCount).toBe(1);
  expect(text("connection")).toBe("disconnected");
  await rerender({ client, session: { id: "two", enabled: true }, room });
  expect(connections).toHaveLength(3);
});

test("useChannel shares a subscription, follows a getter channel, and honours enabled", async () => {
  const { client, connections } = createHarness();
  const onFirst = vi.fn();
  const onSecond = vi.fn();
  const { rerender, unmount } = render(Harness, {
    client,
    room: { channel: "rooms:one", onFirst, onSecond },
  });

  expect(activeChannels(connections[0])).toEqual(["rooms:one"]);
  const subscription = subscriptionFor(connections, "rooms:one");
  subscription.observer.publication({ data: "hello", native: null });
  expect(onFirst).toHaveBeenCalledExactlyOnceWith("hello!", {
    data: "hello",
    native: null,
  });
  expect(onSecond).toHaveBeenCalledTimes(1);

  await rerender({ client, room: { channel: "rooms:one", onFirst, onSecond } });
  expect(subscriptionFor(connections, "rooms:one")).toBe(subscription);
  await rerender({
    client,
    room: { channel: "rooms:one", enabled: false, onFirst, onSecond },
  });
  expect(subscriptionFor(connections, "rooms:one")).toBe(subscription);
  subscription.observer.publication({ data: "again", native: null });
  expect(onFirst).toHaveBeenCalledTimes(1);
  expect(onSecond).toHaveBeenCalledTimes(2);

  await rerender({
    client,
    room: { channel: "rooms:two", enabled: false, onFirst, onSecond },
  });
  expect(subscription.disposeCount).toBe(1);
  expect(activeChannels(connections[0])).toEqual(["rooms:two"]);
  unmount();
  expect(activeChannels(connections[0])).toEqual([]);
});

test("replacing the client releases its connection and subscribes on the new one", async () => {
  const first = createHarness();
  const second = createHarness();
  const room = { channel: "rooms:one" };
  const { rerender } = render(Harness, { client: first.client, room });

  expect(activeChannels(first.connections[0])).toEqual(["rooms:one"]);
  await rerender({ client: second.client, room });
  expect(first.connections[0]?.disposeCount).toBe(1);
  expect(first.client.native.get()).toBeNull();
  expect(activeChannels(first.connections[0])).toEqual([]);
  expect(second.connections).toHaveLength(1);
  expect(activeChannels(second.connections[0])).toEqual(["rooms:one"]);
});

test("status and connection state follow adapter reports", () => {
  const { client, connections } = createHarness({
    onSubscribe: (subscription) => subscription.observer.state("subscribing"),
  });
  render(Harness, { client, room: { channel: "rooms:one" } });

  expect(text("connection")).toBe("disconnected");
  expect(text("status")).toBe("subscribing");
  connections[0]?.observer.state("connected");
  subscriptionFor(connections, "rooms:one").observer.state("subscribed");
  flushSync();
  expect(text("connection")).toBe("connected");
  expect(text("status")).toBe("subscribed");
});

test("typed events match provider event names without a decoder", () => {
  const { client, connections } = createHarness();
  const onCreated = vi.fn();
  render(Harness, { client, room: { channel: "rooms", onCreated } });
  const subscription = subscriptionFor(connections, "rooms");

  subscription.observer.publication({
    event: "deleted",
    data: 1,
    native: null,
  });
  subscription.observer.publication({
    event: "created",
    data: 2,
    native: null,
  });

  expect(onCreated).toHaveBeenCalledExactlyOnceWith(2, {
    event: "created",
    data: 2,
    native: null,
  });
});
