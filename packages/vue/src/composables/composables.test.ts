// @vitest-environment jsdom
import { mount } from "@vue/test-utils";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { createMockAdapter } from "@priemskiyyy/simulcast/mock";
import type {
  MockAdapterOptions,
  MockConnection,
} from "@priemskiyyy/simulcast/mock";
import { defineComponent, h, nextTick, ref } from "vue";
import type { Ref } from "vue";
import { expect, test, vi } from "vitest";
import { RealtimeProvider } from "src/components/RealtimeProvider";
import type { RealtimeProviderProps } from "src/components/RealtimeProvider";
import { createChannelEventHooks } from "src/composables/createChannelEventHooks";
import { useChannel } from "src/composables/useChannel";
import { useChannelStatus } from "src/composables/useChannelStatus";
import { useConnectionState } from "src/composables/useConnectionState";
import { useRealtimeClient } from "src/composables/useRealtimeClient";

const createHarness = (options?: MockAdapterOptions) => {
  const { adapter, connections } = createMockAdapter(options);
  const client = new RealtimeClient({ adapter });

  return { client, connections };
};

const mountInProvider = (
  props: RealtimeProviderProps,
  setup: () => () => ReturnType<typeof h> | null,
) =>
  mount(
    defineComponent(() => {
      const Child = defineComponent(setup);

      return () => h(RealtimeProvider, props, { default: () => h(Child) });
    }),
  );

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

test("the provider connects after mount, exposes the client as a ref, and disconnects on unmount", () => {
  const { client, connections } = createHarness();
  let injected: Readonly<Ref<RealtimeClient>> | undefined;
  const wrapper = mountInProvider({ client }, () => {
    injected = useRealtimeClient();
    return () => null;
  });

  expect(injected?.value).toBe(client);
  expect(connections).toHaveLength(1);
  expect(client.native.get()).toBe(connections[0]);
  wrapper.unmount();
  expect(connections[0]?.disposeCount).toBe(1);
  expect(client.native.get()).toBeNull();
});

test("composables require a provider", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(() =>
    mount(
      defineComponent(() => {
        useConnectionState();
        return () => null;
      }),
    ),
  ).toThrow("within a RealtimeProvider");
  warn.mockRestore();
});

test("the session ID and enabled flag control the connection while object identity is inert", async () => {
  const { client, connections } = createHarness({
    onConnect: (connection) => connection.observer.state("connecting"),
  });
  const session = ref<NonNullable<RealtimeProviderProps["session"]>>({
    id: "one",
  });
  const wrapper = mount(
    defineComponent(() => {
      const Child = defineComponent(() => {
        useChannel("rooms:one", () => {});
        const connection = useConnectionState();
        return () => h("span", connection.value);
      });

      return () =>
        h(
          RealtimeProvider,
          { client, session: session.value },
          { default: () => h(Child) },
        );
    }),
  );

  await nextTick();
  expect(connections).toHaveLength(1);
  expect(activeChannels(connections[0])).toEqual(["rooms:one"]);
  expect(wrapper.text()).toBe("connecting");
  session.value = { id: "one" };
  await nextTick();
  expect(connections).toHaveLength(1);
  session.value = { id: "two" };
  await nextTick();
  expect(connections).toHaveLength(2);
  expect(connections[0]?.disposeCount).toBe(1);
  expect(activeChannels(connections[1])).toEqual(["rooms:one"]);
  session.value = { id: "two", enabled: false };
  await nextTick();
  expect(connections[1]?.disposeCount).toBe(1);
  expect(wrapper.text()).toBe("disconnected");
  session.value = { id: "two", enabled: true };
  await nextTick();
  expect(connections).toHaveLength(3);
  wrapper.unmount();
});

test("useChannel shares a subscription, follows a reactive channel, and honours enabled", async () => {
  const { client, connections } = createHarness();
  const first = vi.fn();
  const second = vi.fn();
  const channel = ref("rooms:one");
  const enabled = ref(true);
  const wrapper = mountInProvider({ client }, () => {
    useChannel(channel, first, {
      enabled,
      parse: (data) => `${String(data)}!`,
    });
    useChannel(() => channel.value, second);
    return () => null;
  });

  expect(activeChannels(connections[0])).toEqual(["rooms:one"]);
  const subscription = subscriptionFor(connections, "rooms:one");
  subscription.observer.publication({ data: "hello", native: null });
  expect(first).toHaveBeenCalledExactlyOnceWith("hello!", {
    data: "hello",
    native: null,
  });
  expect(second).toHaveBeenCalledTimes(1);

  enabled.value = false;
  await nextTick();
  expect(subscriptionFor(connections, "rooms:one")).toBe(subscription);
  subscription.observer.publication({ data: "again", native: null });
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(2);

  channel.value = "rooms:two";
  await nextTick();
  expect(subscription.disposeCount).toBe(1);
  expect(activeChannels(connections[0])).toEqual(["rooms:two"]);
  wrapper.unmount();
  expect(activeChannels(connections[0])).toEqual([]);
});

test("equal channel values from a changed source do not resubscribe", async () => {
  const { client, connections } = createHarness();
  const room = ref({ channel: "rooms:one", enabled: true });
  const wrapper = mountInProvider({ client }, () => {
    useChannel(
      () => room.value.channel,
      () => {},
      {
        enabled: () => room.value.enabled,
      },
    );
    return () => null;
  });
  const subscription = subscriptionFor(connections, "rooms:one");

  room.value = { channel: "rooms:one", enabled: true };
  await nextTick();

  expect(subscriptionFor(connections, "rooms:one")).toBe(subscription);
  expect(subscription.disposeCount).toBe(0);
  wrapper.unmount();
});

test("status and connection refs follow adapter reports", async () => {
  const { client, connections } = createHarness({
    onSubscribe: (subscription) => subscription.observer.state("subscribing"),
  });
  const wrapper = mountInProvider({ client }, () => {
    useChannel("rooms:one", () => {});
    const status = useChannelStatus("rooms:one");
    const connection = useConnectionState();
    return () => h("span", `${connection.value}/${status.value.state}`);
  });

  await nextTick();
  expect(wrapper.text()).toBe("disconnected/subscribing");
  connections[0]?.observer.state("connected");
  subscriptionFor(connections, "rooms:one").observer.state("subscribed");
  await nextTick();
  expect(wrapper.text()).toBe("connected/subscribed");
  wrapper.unmount();
});

test("typed events match provider event names without a decoder", () => {
  const { client, connections } = createHarness();
  type Events = { created: { channel: "rooms"; payload: unknown } };
  const { useChannelEvent } = createChannelEventHooks<Events>();
  const onCreated = vi.fn();
  const wrapper = mountInProvider({ client }, () => {
    useChannelEvent("rooms", "created", onCreated);
    return () => null;
  });
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
  wrapper.unmount();
});
