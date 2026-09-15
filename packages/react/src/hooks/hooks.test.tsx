// @vitest-environment jsdom
import { act, cleanup, render, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import type { PropsWithChildren } from "react";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { createMockAdapter } from "@priemskiyyy/simulcast/mock";
import type {
  MockAdapterOptions,
  MockConnection,
} from "@priemskiyyy/simulcast/mock";
import { afterEach, describe, expect, test, vi } from "vitest";
import { RealtimeProvider } from "src/context/RealtimeProvider";
import { createChannelEventHooks } from "src/hooks/createChannelEventHooks";
import { useChannel } from "src/hooks/useChannel";
import { useChannelStatus } from "src/hooks/useChannelStatus";
import { useConnectionState } from "src/hooks/useConnectionState";
import { useRealtimeClient } from "src/hooks/useRealtimeClient";

const createHarness = (options?: MockAdapterOptions) => {
  const { adapter, connections } = createMockAdapter(options);
  const client = new RealtimeClient({ adapter });
  const wrapper = ({ children }: PropsWithChildren) => (
    <RealtimeProvider client={client}>{children}</RealtimeProvider>
  );

  return { client, connections, wrapper };
};

const activeConnections = (connections: MockConnection[]) =>
  connections.filter((connection) => connection.disposeCount === 0);

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

afterEach(cleanup);

describe("provider and subscriptions", () => {
  test("exposes the client while the provider owns session cleanup", () => {
    const { client, connections, wrapper } = createHarness();
    const { result, rerender, unmount } = renderHook(useRealtimeClient, {
      wrapper,
    });

    expect(result.current).toBe(client);
    expect(connections).toHaveLength(1);
    expect(client.native.get()).toBe(connections[0]);
    rerender();
    expect(connections).toHaveLength(1);
    unmount();
    expect(connections[0]?.disposeCount).toBe(1);
    expect(client.native.get()).toBeNull();
    expect(client.connection.get()).toBe("disconnected");
  });

  test("requires an explicit provider", () => {
    expect(() => renderHook(() => useConnectionState())).toThrow(
      "within a RealtimeProvider",
    );
  });

  test("does not connect while the provider is disabled", () => {
    const { client, connections } = createHarness();
    const disabledWrapper = ({ children }: PropsWithChildren) => (
      <RealtimeProvider client={client} session={{ enabled: false }}>
        {children}
      </RealtimeProvider>
    );
    const { result } = renderHook(() => useConnectionState(), {
      wrapper: disabledWrapper,
    });

    expect(result.current).toBe("disconnected");
    expect(connections).toEqual([]);
  });

  test("the session ID and enabled flag control the connection while object identity is inert", () => {
    const { client, connections } = createHarness({
      onConnect: (connection) => connection.observer.state("connecting"),
    });
    const Capture = () => {
      useChannel("rooms:one", () => {});
      return <span>{useConnectionState()}</span>;
    };
    const View = ({ id, enabled }: { id: string; enabled: boolean }) => (
      <RealtimeProvider client={client} session={{ id, enabled }}>
        <Capture />
      </RealtimeProvider>
    );
    const view = render(<View id="one" enabled />);
    expect(connections).toHaveLength(1);
    expect(activeChannels(connections[0])).toEqual(["rooms:one"]);
    view.rerender(<View id="one" enabled />);
    expect(connections).toHaveLength(1);
    view.rerender(<View id="two" enabled />);
    expect(connections).toHaveLength(2);
    expect(connections[0]?.disposeCount).toBe(1);
    expect(activeChannels(connections[0])).toEqual([]);
    expect(activeChannels(connections[1])).toEqual(["rooms:one"]);
    expect(view.getByText("connecting")).toBeDefined();
    view.rerender(<View id="two" enabled={false} />);
    expect(view.getByText("disconnected")).toBeDefined();
    expect(connections[1]?.disposeCount).toBe(1);
    view.rerender(<View id="two" enabled />);
    expect(connections).toHaveLength(3);
    expect(activeChannels(connections[2])).toEqual(["rooms:one"]);
  });

  test("shares a subscription and removes it after the last consumer", () => {
    const { connections, wrapper } = createHarness();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ enabled }) => {
        useChannel("rooms:one", first, { enabled });
        useChannel("rooms:one", second);
      },
      { wrapper, initialProps: { enabled: true } },
    );
    const subscription = subscriptionFor(connections, "rooms:one");
    expect(activeChannels(connections[0])).toEqual(["rooms:one"]);
    const native = { offset: 7 };
    act(() => {
      subscription.observer.publication({ data: "first", native });
    });
    expect(first).toHaveBeenCalledWith("first", { data: "first", native });
    expect(second).toHaveBeenCalledTimes(1);
    rerender({ enabled: false });
    expect(subscriptionFor(connections, "rooms:one")).toBe(subscription);
    act(() => {
      subscription.observer.publication({ data: "second", native: null });
    });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
    unmount();
    expect(activeChannels(connections[0])).toEqual([]);
  });

  test("fresh callbacks and parsers do not recreate subscriptions", () => {
    const { connections, wrapper } = createHarness();
    const received: string[] = [];
    const { rerender } = renderHook(
      ({ label }) => {
        useChannel(
          "rooms:one",
          (data) => {
            received.push(`${label}:${data}`);
          },
          { parse: (data) => `${label}-${String(data)}` },
        );
      },
      { wrapper, initialProps: { label: "before" } },
    );
    const subscription = subscriptionFor(connections, "rooms:one");
    rerender({ label: "after" });
    expect(subscriptionFor(connections, "rooms:one")).toBe(subscription);
    act(() => {
      subscription.observer.publication({ data: "message", native: null });
    });
    expect(received).toEqual(["after:after-message"]);
  });

  test("changing a channel detaches the old subscription", () => {
    const { connections, wrapper } = createHarness();
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ channel }) => {
        useChannel(channel, handler);
      },
      { wrapper, initialProps: { channel: "rooms:one" } },
    );
    const previous = subscriptionFor(connections, "rooms:one");
    rerender({ channel: "rooms:two" });
    expect(previous.disposeCount).toBe(1);
    expect(activeChannels(connections[0])).toEqual(["rooms:two"]);
    act(() => {
      previous.observer.publication({ data: "stale", native: null });
    });
    expect(handler).not.toHaveBeenCalled();
  });

  test("status observers are passive and survive subscriber cleanup", () => {
    const { connections, wrapper } = createHarness({
      onSubscribe: (subscription) => subscription.observer.state("subscribing"),
    });
    const { result, rerender } = renderHook(
      ({ enabled }) => {
        useChannel("rooms:one", () => {}, { enabled });
        return useChannelStatus("rooms:one");
      },
      { wrapper, initialProps: { enabled: false } },
    );
    expect(connections[0]?.subscriptions).toEqual([]);
    expect(result.current.state).toBe("detached");
    rerender({ enabled: true });
    expect(result.current.state).toBe("subscribing");
    const subscription = subscriptionFor(connections, "rooms:one");
    const error = { error: { code: 1, message: "retry" } };
    act(() => {
      subscription.observer.error(error);
    });
    expect(result.current.error).toBe(error);
    act(() => {
      subscription.observer.state("subscribed");
    });
    expect(result.current).toEqual({ state: "subscribed", error: null });
    rerender({ enabled: false });
    expect(result.current).toEqual({ state: "detached", error: null });
    rerender({ enabled: true });
    expect(subscriptionFor(connections, "rooms:one")).not.toBe(subscription);
  });

  test("StrictMode leaves one connection and one registered subscription", () => {
    const { connections, wrapper } = createHarness();
    const strictWrapper = ({ children }: PropsWithChildren) => (
      <StrictMode>{wrapper({ children })}</StrictMode>
    );
    const { unmount } = renderHook(
      () => {
        useChannel("rooms:one", () => {});
      },
      { wrapper: strictWrapper },
    );
    const [connection] = activeConnections(connections);
    expect(activeConnections(connections)).toHaveLength(1);
    expect(activeChannels(connection)).toEqual(["rooms:one"]);
    unmount();
    expect(activeConnections(connections)).toEqual([]);
    expect(activeChannels(connection)).toEqual([]);
  });
});

describe("parsing and typed events", () => {
  test("parser failures and rejected handlers are reported without interrupting sibling delivery", async () => {
    const { connections, wrapper } = createHarness();
    const scheduledErrors: Array<() => void> = [];
    vi.spyOn(globalThis, "queueMicrotask").mockImplementation((callback) => {
      scheduledErrors.push(callback);
    });
    const sibling = vi.fn();
    const parseError = new Error("invalid payload");
    const callbackError = new Error("handler rejected");
    renderHook(
      () => {
        useChannel("rooms:one", () => {}, {
          parse: () => {
            throw parseError;
          },
        });
        useChannel("rooms:one", () => Promise.reject(callbackError));
        useChannel("rooms:one", sibling);
      },
      { wrapper },
    );
    act(() => {
      subscriptionFor(connections, "rooms:one").observer.publication({
        data: null,
        native: null,
      });
    });
    await Promise.resolve();
    expect(sibling).toHaveBeenCalledTimes(1);
    expect(scheduledErrors).toHaveLength(2);
    expect(scheduledErrors[0]).toThrow(parseError);
    expect(scheduledErrors[1]).toThrow(callbackError);
  });

  test("matches provider event names without a decoder", () => {
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
    act(() => {
      subscription.observer.publication({ data: 1, native: null });
      subscription.observer.publication({
        event: "deleted",
        data: 2,
        native: null,
      });
      subscription.observer.publication({
        event: "created",
        data: 3,
        native: null,
      });
    });
    expect(onCreated).toHaveBeenCalledExactlyOnceWith(3, {
      event: "created",
      data: 3,
      native: null,
    });
  });

  test("decodes events from the publication and parses only matching payloads", () => {
    const { connections, wrapper } = createHarness();
    type Events = {
      "message.created": { channel: `rooms:${string}`; payload: string };
    };
    const { useChannelEvent } = createChannelEventHooks<Events>({
      decode: ({ event, data }) => {
        if (event === undefined) {
          return null;
        }

        return { eventType: event, payload: data };
      },
    });
    const parse = vi.fn((data: unknown) => String(data));
    const onMessage = vi.fn();
    renderHook(
      () => {
        useChannelEvent("rooms:one", "message.created", onMessage, { parse });
      },
      { wrapper },
    );
    const subscription = subscriptionFor(connections, "rooms:one");
    act(() => {
      subscription.observer.publication({ data: 1, native: null });
      subscription.observer.publication({
        event: "other",
        data: 1,
        native: null,
      });
      subscription.observer.publication({
        event: "message.created",
        data: 42,
        native: null,
      });
    });
    expect(parse).toHaveBeenCalledExactlyOnceWith(42);
    expect(onMessage).toHaveBeenCalledExactlyOnceWith("42", {
      event: "message.created",
      data: 42,
      native: null,
    });
  });
});
