import { expect, test, vi } from "vitest";
import { createMockAdapter } from "src/mock/createMockAdapter";
import { createRealtimeAdapter } from "src/utils/createRealtimeAdapter";

const observer = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

test("forwards native resources and events while the connection lives", () => {
  const mock = createMockAdapter();
  const adapter = createRealtimeAdapter(mock.adapter);
  const connectionObserver = observer();
  const subscriptionObserver = observer();
  const connection = adapter.connect(connectionObserver);
  const subscription = connection.subscribe({
    channel: "rooms:one",
    observer: subscriptionObserver,
  });
  const inner = mock.connections[0];
  const publication = { data: 1, native: null };

  expect(adapter.name).toBe("mock");
  expect(connection.native).toBe(inner);
  expect(subscription.native).toBe(inner?.subscriptions[0]);
  inner?.observer.state("connected");
  inner?.observer.error({ error: "boom" });
  inner?.subscriptions[0]?.observer.state("subscribed");
  inner?.subscriptions[0]?.observer.publication(publication);
  expect(connectionObserver.state).toHaveBeenCalledExactlyOnceWith("connected");
  expect(connectionObserver.error).toHaveBeenCalledExactlyOnceWith({
    error: "boom",
  });
  expect(subscriptionObserver.state).toHaveBeenCalledExactlyOnceWith(
    "subscribed",
  );
  expect(subscriptionObserver.publication).toHaveBeenCalledExactlyOnceWith(
    publication,
  );
});

test("a disposed subscription is released once and no longer reports", () => {
  const mock = createMockAdapter();
  const connection = createRealtimeAdapter(mock.adapter).connect(observer());
  const subscriptionObserver = observer();
  const subscription = connection.subscribe({
    channel: "rooms:one",
    observer: subscriptionObserver,
  });
  const inner = mock.connections[0]?.subscriptions[0];

  subscription.dispose();
  subscription.dispose();
  inner?.observer.state("unsubscribed");
  inner?.observer.publication({ data: 1, native: null });
  inner?.observer.error({ error: "late" });

  expect(inner?.disposeCount).toBe(1);
  expect(subscriptionObserver.state).not.toHaveBeenCalled();
  expect(subscriptionObserver.publication).not.toHaveBeenCalled();
  expect(subscriptionObserver.error).not.toHaveBeenCalled();
});

test("disposing the connection releases its subscriptions first, then rejects new ones", () => {
  const mock = createMockAdapter();
  const connectionObserver = observer();
  const connection = createRealtimeAdapter(mock.adapter).connect(
    connectionObserver,
  );
  const subscriptionObserver = observer();
  const subscription = connection.subscribe({
    channel: "rooms:one",
    observer: subscriptionObserver,
  });
  const inner = mock.connections[0];

  connection.dispose();
  connection.dispose();
  subscription.dispose();
  inner?.observer.state("disconnected");
  inner?.subscriptions[0]?.observer.state("unsubscribed");

  expect(inner?.disposeCount).toBe(1);
  expect(inner?.subscriptions[0]?.disposeCount).toBe(1);
  expect(connectionObserver.state).not.toHaveBeenCalled();
  expect(subscriptionObserver.state).not.toHaveBeenCalled();
  expect(() =>
    connection.subscribe({ channel: "rooms:two", observer: observer() }),
  ).toThrow("disposed mock connection");
});

test.each(
  [["first"], ["first", "second", "connection"]].map((failures) => ({
    failures,
  })),
)(
  "finishes cleanup in order when $failures throws and reports the original failures",
  ({ failures }) => {
    const cleaned: string[] = [];
    const errors = new Map(failures.map((name) => [name, new Error(name)]));
    const connection = createRealtimeAdapter({
      name: "cleanup-test",
      connect: () => ({
        native: "connection",
        subscribe: ({ channel }) => ({
          native: channel,
          dispose() {
            cleaned.push(this.native);
            if (errors.has(this.native)) throw errors.get(this.native);
          },
        }),
        dispose() {
          cleaned.push(this.native);
          if (errors.has(this.native)) throw errors.get(this.native);
        },
      }),
    }).connect(observer());
    const subscriptions = ["first", "second"].map((channel) =>
      connection.subscribe({ channel, observer: observer() }),
    );
    let failure: unknown;

    try {
      connection.dispose();
    } catch (error) {
      failure = error;
    }

    expect(cleaned).toEqual(["first", "second", "connection"]);
    if (errors.size === 1) {
      expect(failure).toBe(errors.get("first"));
    } else {
      expect(failure).toBeInstanceOf(AggregateError);
      if (!(failure instanceof AggregateError))
        throw new Error("Expected cleanup failures");
      expect(failure.errors).toEqual([...errors.values()]);
    }
    expect(() => connection.dispose()).not.toThrow();
    for (const subscription of subscriptions) subscription.dispose();
    expect(cleaned).toEqual(["first", "second", "connection"]);
  },
);
