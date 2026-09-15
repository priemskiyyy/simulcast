import { cleanup, renderHook } from "@solidjs/testing-library";
import { RealtimeClient } from "simulcast";
import { createMockAdapter } from "simulcast/mock";
import type { MockAdapterOptions, MockConnection } from "simulcast/mock";
import { createComponent, createSignal } from "solid-js";
import type { ParentProps } from "solid-js";
import { afterEach, expect, test, vi } from "vitest";
import { RealtimeProvider } from "src/components/RealtimeProvider";
import type { RealtimeProviderProps } from "src/components/RealtimeProvider";
import { createChannelEventHooks } from "src/primitives/createChannelEventHooks";
import { useChannel } from "src/primitives/useChannel";
import { useChannelStatus } from "src/primitives/useChannelStatus";
import { useConnectionState } from "src/primitives/useConnectionState";
import { useRealtimeClient } from "src/primitives/useRealtimeClient";

afterEach(cleanup);

const createHarness = (options?: MockAdapterOptions) => {
  const { adapter, connections } = createMockAdapter(options);
  const client = new RealtimeClient({ adapter });
  const wrapper = (props: ParentProps) =>
    createComponent(RealtimeProvider, {
      client,
      get children() {
        return props.children;
      },
    });

  return { client, connections, wrapper };
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

test("the provider connects, exposes the client as an accessor, and disconnects on cleanup", () => {
  const { client, connections, wrapper } = createHarness();
  const { result, cleanup: unmount } = renderHook(useRealtimeClient, {
    wrapper,
  });

  expect(result()).toBe(client);
  expect(connections).toHaveLength(1);
  expect(client.native.get()).toBe(connections[0]);
  unmount();
  expect(connections[0]?.disposeCount).toBe(1);
  expect(client.native.get()).toBeNull();
});

test("primitives require a provider", () => {
  expect(() => renderHook(useConnectionState)).toThrow(
    "within a RealtimeProvider",
  );
});

test("the session ID and enabled flag control the connection while object identity is inert", () => {
  const { client, connections } = createHarness({
    onConnect: (connection) => connection.observer.state("connecting"),
  });
  const [session, setSession] = createSignal<
    NonNullable<RealtimeProviderProps["session"]>
  >({ id: "one" });
  const { result } = renderHook(
    () => {
      useChannel("rooms:one", () => {});
      return useConnectionState();
    },
    {
      wrapper: (props: ParentProps) =>
        createComponent(RealtimeProvider, {
          client,
          get session() {
            return session();
          },
          get children() {
            return props.children;
          },
        }),
    },
  );

  expect(connections).toHaveLength(1);
  expect(activeChannels(connections[0])).toEqual(["rooms:one"]);
  expect(result()).toBe("connecting");
  setSession({ id: "one" });
  expect(connections).toHaveLength(1);
  setSession({ id: "two" });
  expect(connections).toHaveLength(2);
  expect(connections[0]?.disposeCount).toBe(1);
  expect(activeChannels(connections[1])).toEqual(["rooms:one"]);
  setSession({ id: "two", enabled: false });
  expect(connections[1]?.disposeCount).toBe(1);
  expect(result()).toBe("disconnected");
  setSession({ id: "two", enabled: true });
  expect(connections).toHaveLength(3);
});

test("useChannel shares a subscription, follows an accessor channel, and honours enabled", () => {
  const { connections, wrapper } = createHarness();
  const first = vi.fn();
  const second = vi.fn();
  const [channel, setChannel] = createSignal("rooms:one");
  const [enabled, setEnabled] = createSignal(true);
  const { cleanup: unmount } = renderHook(
    () => {
      useChannel(channel, first, {
        enabled,
        parse: (data) => `${String(data)}!`,
      });
      useChannel(() => channel(), second);
    },
    { wrapper },
  );

  expect(activeChannels(connections[0])).toEqual(["rooms:one"]);
  const subscription = subscriptionFor(connections, "rooms:one");
  subscription.observer.publication({ data: "hello", native: null });
  expect(first).toHaveBeenCalledExactlyOnceWith("hello!", {
    data: "hello",
    native: null,
  });
  expect(second).toHaveBeenCalledTimes(1);

  setEnabled(false);
  expect(subscriptionFor(connections, "rooms:one")).toBe(subscription);
  subscription.observer.publication({ data: "again", native: null });
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(2);

  setChannel("rooms:two");
  expect(subscription.disposeCount).toBe(1);
  expect(activeChannels(connections[0])).toEqual(["rooms:two"]);
  unmount();
  expect(activeChannels(connections[0])).toEqual([]);
});

test("equal channel values from a changed source do not resubscribe", () => {
  const { connections, wrapper } = createHarness();
  const [room, setRoom] = createSignal({ channel: "rooms:one", enabled: true });
  renderHook(
    () => {
      useChannel(
        () => room().channel,
        () => {},
        {
          enabled: () => room().enabled,
        },
      );
    },
    { wrapper },
  );
  const subscription = subscriptionFor(connections, "rooms:one");

  setRoom({ channel: "rooms:one", enabled: true });

  expect(subscriptionFor(connections, "rooms:one")).toBe(subscription);
  expect(subscription.disposeCount).toBe(0);
});

test("status and connection accessors follow adapter reports", () => {
  const { connections, wrapper } = createHarness({
    onSubscribe: (subscription) => subscription.observer.state("subscribing"),
  });
  const { result } = renderHook(
    () => {
      useChannel("rooms:one", () => {});
      return {
        status: useChannelStatus("rooms:one"),
        connection: useConnectionState(),
      };
    },
    { wrapper },
  );

  expect(result.connection()).toBe("disconnected");
  expect(result.status().state).toBe("subscribing");
  connections[0]?.observer.state("connected");
  subscriptionFor(connections, "rooms:one").observer.state("subscribed");
  expect(result.connection()).toBe("connected");
  expect(result.status()).toEqual({ state: "subscribed", error: null });
});

test("typed events match provider event names without a decoder", () => {
  const { connections, wrapper } = createHarness();
  type Events = { created: { channel: "rooms"; payload: unknown } };
  const { useChannelEvent } = createChannelEventHooks<Events>();
  const onCreated = vi.fn();
  renderHook(
    () => {
      useChannelEvent("rooms", "created", onCreated);
    },
    { wrapper },
  );
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
