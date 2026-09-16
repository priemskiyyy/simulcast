import { describe, expect, test, vi } from "vitest";
import type { AdapterConnection } from "src/types/AdapterConnection";
import type { RealtimeAdapter } from "src/types/RealtimeAdapter";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyAdapter = RealtimeAdapter<any, any, any>;
type AnyConnection = AdapterConnection<any, any, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type AdapterConformanceOptions = {
  /** Label for the generated `describe` block. */
  name: string;
  /** Creates a cold adapter; called once per test. */
  createAdapter: () => AnyAdapter;
  /** Makes the provider deliver `data` on `channel` to the given connection. */
  publish: (
    connection: AnyConnection,
    channel: string,
    data: unknown,
  ) => void | Promise<void>;
  /** Two distinct channel names the provider accepts. */
  channels?: [string, string];
};

const CONNECTION_STATES = ["connecting", "connected", "disconnected"];
const SUBSCRIPTION_STATES = ["subscribing", "subscribed", "unsubscribed"];

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

/**
 * Registers the adapter contract tests every adapter must pass. Provider
 * specific behavior stays in the adapter's own tests.
 *
 * @example
 * ```ts
 * testRealtimeAdapter({
 *   name: "provider",
 *   createAdapter: () => provider({ url: "ws://localhost" }),
 *   publish: (connection, channel, data) =>
 *     connection.native.emit("message", { channel, data }),
 * });
 * ```
 */
export const testRealtimeAdapter = ({
  name,
  createAdapter,
  publish,
  channels: [first, second] = ["conformance:one", "conformance:two"],
}: AdapterConformanceOptions) => {
  const connect = () => {
    const observer = connectionObserver();
    const connection = createAdapter().connect(observer);
    const subscribe = (channel: string) => {
      const subscriptionObserverInstance = subscriptionObserver();
      const subscription = connection.subscribe({
        channel,
        observer: subscriptionObserverInstance,
      });

      return { subscription, observer: subscriptionObserverInstance };
    };

    return { connection, observer, subscribe };
  };

  describe(`${name} adapter conformance`, () => {
    test("the factory names the adapter and exposes connect", () => {
      const adapter = createAdapter();

      expect(typeof adapter.name).toBe("string");
      expect(typeof adapter.connect).toBe("function");
    });

    test("connect returns an owned connection whose disposal is idempotent", () => {
      const { connection } = connect();

      expect(connection).toHaveProperty("native");
      expect(typeof connection.subscribe).toBe("function");
      expect(typeof connection.dispose).toBe("function");
      connection.dispose();
      expect(() => connection.dispose()).not.toThrow();
    });

    test("subscribe returns an owned subscription and rejects disposed connections", () => {
      const { connection, subscribe } = connect();
      const { subscription } = subscribe(first);

      expect(subscription).toHaveProperty("native");
      expect(typeof subscription.dispose).toBe("function");
      subscription.dispose();
      expect(() => subscription.dispose()).not.toThrow();

      connection.dispose();
      expect(() => subscribe(first)).toThrow();
    });

    test("publications reach the subscription with their native context", async () => {
      const { connection, subscribe } = connect();
      const { observer } = subscribe(first);

      await publish(connection, first, "conformance");

      // Payloads are provider-specific, from JSON to buffers, so only the
      // publication's shape is checked here.
      await vi.waitFor(() =>
        expect(observer.publication).toHaveBeenCalledOnce(),
      );
      expect(observer.publication.mock.calls[0]?.[0]).toHaveProperty("data");
      expect(observer.publication.mock.calls[0]?.[0]).toHaveProperty("native");
      connection.dispose();
    });

    test("subscriptions on different channels do not cross", async () => {
      const { connection, subscribe } = connect();
      const one = subscribe(first);
      const two = subscribe(second);

      await publish(connection, first, "one");
      await vi.waitFor(() =>
        expect(one.observer.publication).toHaveBeenCalled(),
      );
      await settle();

      expect(two.observer.publication).not.toHaveBeenCalled();
      connection.dispose();
    });

    test("a disposed subscription stays silent", async () => {
      const { connection, subscribe } = connect();
      const { subscription, observer } = subscribe(first);

      subscription.dispose();
      await publish(connection, first, "late");
      await settle();

      expect(observer.publication).not.toHaveBeenCalled();
      expect(observer.state).not.toHaveBeenCalledWith("unsubscribed");
      connection.dispose();
    });

    test("disposing the connection releases its subscriptions without observer calls", async () => {
      const { connection, observer, subscribe } = connect();
      const subscribed = subscribe(first);
      const stateCalls = subscribed.observer.state.mock.calls.length;
      const connectionStateCalls = observer.state.mock.calls.length;

      connection.dispose();
      await publish(connection, first, "late");
      await settle();

      expect(subscribed.observer.publication).not.toHaveBeenCalled();
      expect(subscribed.observer.state).toHaveBeenCalledTimes(stateCalls);
      expect(observer.state).toHaveBeenCalledTimes(connectionStateCalls);
    });

    test("observers report contract states and nothing else", async () => {
      const { connection, observer, subscribe } = connect();
      const subscribed = subscribe(first);

      await publish(connection, first, "state");
      await settle();
      connection.dispose();

      // An adapter that reports nothing leaves every channel detached, so a
      // subscription state is required before the states are checked. The
      // connection is exempt: a harness may stub the transport, and then the
      // provider never transitions.
      expect(subscribed.observer.state).toHaveBeenCalled();
      for (const [state] of observer.state.mock.calls) {
        expect(CONNECTION_STATES).toContain(state);
      }
      for (const [state] of subscribed.observer.state.mock.calls) {
        expect(SUBSCRIPTION_STATES).toContain(state);
      }
    });
  });
};
