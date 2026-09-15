import { expect, test, vi } from "vitest";
import { createMockAdapter } from "src/mock/createMockAdapter";

const observer = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

test("records connections and subscriptions in call order with dispose counts", () => {
  const { adapter, connections } = createMockAdapter();

  const connection = adapter.connect(observer());
  const first = connection.subscribe({ channel: "a", observer: observer() });
  connection.subscribe({ channel: "b", observer: observer() });
  first.dispose();
  first.dispose();
  connection.dispose();

  expect(connections).toHaveLength(1);
  expect(connections[0]?.subscriptions.map((s) => s.channel)).toEqual([
    "a",
    "b",
  ]);
  expect(connections[0]?.subscriptions[0]?.disposeCount).toBe(2);
  expect(connections[0]?.disposeCount).toBe(1);
});

test("hooks run synchronously inside connect and subscribe", () => {
  const { adapter } = createMockAdapter({
    onConnect: (connection) => connection.observer.state("connected"),
    onSubscribe: (subscription) => subscription.observer.state("subscribed"),
  });
  const connectionObserver = observer();
  const subscriptionObserver = observer();

  adapter
    .connect(connectionObserver)
    .subscribe({ channel: "a", observer: subscriptionObserver });

  expect(connectionObserver.state).toHaveBeenCalledWith("connected");
  expect(subscriptionObserver.state).toHaveBeenCalledWith("subscribed");
});

test("a throwing hook propagates and records no resource", () => {
  const { adapter, connections } = createMockAdapter({
    onConnect: () => {
      throw new Error("connect failed");
    },
    onSubscribe: () => {
      throw new Error("subscribe failed");
    },
  });

  expect(() => adapter.connect(observer())).toThrow("connect failed");
  expect(connections).toHaveLength(0);
});
