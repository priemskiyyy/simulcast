import { expect, test, vi } from "vitest";
import { createMockAdapter } from "src/mock/createMockAdapter";
import type {
  MockAdapterOptions,
  MockConnection,
} from "src/mock/createMockAdapter";
import { RealtimeClient } from "src/utils/RealtimeClient";

const createClient = (options?: MockAdapterOptions) => {
  const { adapter, connections } = createMockAdapter(options);
  return { client: new RealtimeClient({ adapter }), connections };
};

const connectionAt = (connections: MockConnection[], index: number) => {
  const connection = connections.at(index);

  if (connection === undefined) {
    throw new Error(`Expected connection ${index}`);
  }

  return connection;
};

const activeChannels = (connection: MockConnection) =>
  connection.subscriptions
    .filter((subscription) => subscription.disposeCount === 0)
    .map((subscription) => subscription.channel);

const subscriptionFor = (connection: MockConnection, channel: string) => {
  const subscription = connection.subscriptions
    .filter((candidate) => candidate.channel === channel)
    .filter((candidate) => candidate.disposeCount === 0)
    .at(-1);

  if (subscription === undefined) {
    throw new Error(`Expected an active subscription to ${channel}`);
  }

  return subscription;
};

test("native observation reports identity changes and stops independently of the session", () => {
  const { client, connections } = createClient();
  const observed: unknown[] = [];
  const stopObserving = client.native.subscribe(() =>
    observed.push(client.native.get()),
  );
  expect(client.native.get()).toBeNull();

  const stopFirst = client.connect();
  const first = client.native.get();
  expect(first).toBe(connectionAt(connections, 0));
  const stopSecond = client.connect();
  const second = client.native.get();
  expect(second).toBe(connectionAt(connections, 1));
  expect(observed).toEqual([first, null, second]);

  stopFirst();
  expect(observed).toEqual([first, null, second]);
  stopObserving();
  stopObserving();
  expect(client.native.get()).toBe(second);
  stopSecond();
  expect(client.native.get()).toBeNull();
  expect(observed).toEqual([first, null, second]);
});

test("client methods remain bound when passed as callbacks", () => {
  const { client, connections } = createClient();
  const { connect, channel, connection, native } = client;
  const stop = connect();
  const unsubscribe = channel("rooms:one").subscribe(() => {});
  const current = connectionAt(connections, 0);

  expect(native.get()).toBe(current);
  expect(activeChannels(current)).toEqual(["rooms:one"]);
  current.observer.state("connected");
  expect(connection.get()).toBe("connected");
  unsubscribe();
  stop();
  expect(native.get()).toBeNull();
});

test("connection state follows adapter reports and resets after teardown", () => {
  const { client, connections } = createClient();
  const stop = client.connect();
  const connection = connectionAt(connections, 0);
  connection.observer.state("connecting");
  connection.observer.state("connected");
  expect(client.connection.get()).toBe("connected");
  const states: string[] = [];
  const stopObserving = client.connection.subscribe(() =>
    states.push(client.connection.get()),
  );

  stop();
  connection.observer.state("connected");

  expect(connection.disposeCount).toBe(1);
  expect(states).toEqual(["disconnected"]);
  expect(client.connection.get()).toBe("disconnected");
  stopObserving();
});

test("stale session cleanup and state events cannot affect the next session", () => {
  const { client, connections } = createClient();
  const stopFirst = client.connect();
  const previous = connectionAt(connections, 0);
  const stopSecond = client.connect();
  const current = connectionAt(connections, 1);

  stopFirst();
  previous.observer.state("connected");
  expect(client.native.get()).toBe(current);
  expect(client.connection.get()).toBe("disconnected");
  stopSecond();
  expect(client.native.get()).toBeNull();
});

test("publications reach consumers with their event name and native context intact", () => {
  const { client, connections } = createClient();
  const handler = vi.fn();
  const stop = client.connect();
  const unsubscribe = client.channel("rooms:one").subscribe(handler);
  const native = { offset: 7 };
  const publication = { data: "hello", event: "message-created", native };

  subscriptionFor(
    connectionAt(connections, 0),
    "rooms:one",
  ).observer.publication(publication);

  expect(handler).toHaveBeenCalledExactlyOnceWith(publication);
  expect(handler.mock.calls[0]?.[0].native).toBe(native);
  unsubscribe();
  stop();
});

test("identical callbacks retain independent subscriptions and cleanup is idempotent", () => {
  const { client, connections } = createClient();
  const handler = vi.fn();
  const first = client.channel("rooms:one").subscribe(handler);
  const second = client.channel("rooms:one").subscribe(handler);
  const stop = client.connect();
  const connection = connectionAt(connections, 0);
  const subscription = subscriptionFor(connection, "rooms:one");

  subscription.observer.publication({ data: 1, native: null });
  expect(handler).toHaveBeenCalledTimes(2);
  first();
  first();
  subscription.observer.publication({ data: 2, native: null });
  expect(handler).toHaveBeenCalledTimes(3);
  second();
  expect(activeChannels(connection)).toEqual([]);
  stop();
});

test("status keeps the last error until the subscription succeeds", () => {
  const { client, connections } = createClient();
  const channel = client.channel("rooms:one");
  const stop = client.connect();
  const unsubscribe = channel.subscribe(() => {});
  const { observer } = subscriptionFor(
    connectionAt(connections, 0),
    "rooms:one",
  );
  const error = { error: "denied" };

  observer.state("subscribing");
  observer.error(error);
  expect(channel.status.get()).toEqual({
    state: "subscribing",
    error,
    recovered: false,
  });
  observer.state("unsubscribed");
  expect(channel.status.get()).toEqual({
    state: "unsubscribed",
    error,
    recovered: false,
  });
  observer.state("subscribed");
  expect(channel.status.get()).toEqual({
    state: "subscribed",
    error: null,
    recovered: false,
  });
  unsubscribe();
  expect(channel.status.get()).toEqual({
    state: "detached",
    error: null,
    recovered: false,
  });
  stop();
});

test("status reports whether the provider replayed the gap", () => {
  const { client, connections } = createClient();
  const channel = client.channel("rooms:one");
  const stop = client.connect();
  const unsubscribe = channel.subscribe(() => {});
  const { observer } = subscriptionFor(
    connectionAt(connections, 0),
    "rooms:one",
  );

  observer.state("subscribed");
  expect(channel.status.get().recovered).toBe(false);
  observer.state("subscribing");
  observer.state("subscribed", { recovered: true });
  expect(channel.status.get()).toEqual({
    state: "subscribed",
    error: null,
    recovered: true,
  });

  // A subscription that drops recovered nothing, whatever the last one replayed.
  observer.state("subscribing");
  expect(channel.status.get().recovered).toBe(false);

  unsubscribe();
  stop();
});

test("channel consumers follow session changes and stop listening while the session is inactive", () => {
  const { client, connections } = createClient();
  const channel = client.channel("rooms:one");
  const onPublication = vi.fn();
  const states: string[] = [];
  const stopPublications = channel.subscribe(onPublication);
  const stopStatus = channel.status.subscribe(() =>
    states.push(channel.status.get().state),
  );
  const first = client.connect();
  const firstConnection = connectionAt(connections, 0);
  const firstSubscription = subscriptionFor(firstConnection, "rooms:one");
  firstSubscription.observer.state("subscribing");

  const second = client.connect();
  const secondConnection = connectionAt(connections, 1);
  const secondSubscription = subscriptionFor(secondConnection, "rooms:one");

  expect(firstSubscription.disposeCount).toBe(1);
  expect(states).toEqual(["subscribing", "detached"]);
  firstSubscription.observer.publication({ data: 1, native: null });
  secondSubscription.observer.publication({ data: 2, native: null });
  expect(onPublication).toHaveBeenCalledExactlyOnceWith({
    data: 2,
    native: null,
  });

  first();
  expect(client.native.get()).toBe(secondConnection);
  second();
  expect(secondSubscription.disposeCount).toBe(1);
  expect(channel.status.get()).toEqual({
    state: "detached",
    error: null,
    recovered: false,
  });
  stopPublications();

  const third = client.connect();
  expect(connectionAt(connections, 2).subscriptions).toEqual([]);
  stopStatus();
  stopStatus();
  third();
});

test("a late adapter callback after the last consumer leaves is ignored", () => {
  const { client, connections } = createClient();
  const channel = client.channel("rooms:one");
  const handler = vi.fn();
  const stop = client.connect();
  const unsubscribe = channel.subscribe(handler);
  const subscription = subscriptionFor(
    connectionAt(connections, 0),
    "rooms:one",
  );

  unsubscribe();
  subscription.observer.state("subscribed");
  subscription.observer.publication({ data: 1, native: null });

  expect(handler).not.toHaveBeenCalled();
  expect(channel.status.get()).toEqual({
    state: "detached",
    error: null,
    recovered: false,
  });
  stop();
});

test("subscription setup failure rolls back ownership so the channel can be retried", () => {
  const failure = new Error("subscription setup failed");
  let fail = true;
  const { client, connections } = createClient({
    onSubscribe: () => {
      if (!fail) {
        return;
      }

      fail = false;
      throw failure;
    },
  });
  const channel = client.channel("rooms:one");
  const stop = client.connect();
  const connection = connectionAt(connections, 0);

  expect(() => channel.subscribe(() => {})).toThrow(failure);
  expect(connection.subscriptions).toEqual([]);
  expect(channel.status.get()).toEqual({
    state: "detached",
    error: null,
    recovered: false,
  });
  const unsubscribe = channel.subscribe(() => {});
  expect(activeChannels(connection)).toEqual(["rooms:one"]);
  unsubscribe();
  stop();
});

test.each(["subscription", "connection"])(
  "a %s failure during session setup releases every acquired resource and allows retry",
  (stage) => {
    const failure = new Error("session setup failed");
    let fail = true;
    const { client, connections } = createClient({
      onConnect: () => {
        if (stage !== "connection" || !fail) {
          return;
        }

        fail = false;
        throw failure;
      },
      onSubscribe: (subscription) => {
        if (stage !== "subscription" || !fail) {
          return;
        }

        if (subscription.channel !== "rooms:two") {
          return;
        }

        fail = false;
        throw failure;
      },
    });
    const first = client.channel("rooms:one");
    const second = client.channel("rooms:two");
    const handler = vi.fn();
    const stopFirst = first.subscribe(handler);
    const stopSecond = second.subscribe(handler);
    const natives: unknown[] = [];
    const stopObserving = client.native.subscribe(() =>
      natives.push(client.native.get()),
    );

    expect(() => client.connect()).toThrow(failure);
    expect(connections).toHaveLength(stage === "connection" ? 0 : 1);
    if (stage === "subscription") {
      const failed = connectionAt(connections, 0);
      expect(failed.disposeCount).toBe(1);
      expect(activeChannels(failed)).toEqual([]);
      expect(natives).toEqual([failed, null]);
    }
    expect(client.native.get()).toBeNull();
    expect(client.connection.get()).toBe("disconnected");
    expect(first.status.get()).toEqual({
      state: "detached",
      error: null,
      recovered: false,
    });
    expect(second.status.get()).toEqual({
      state: "detached",
      error: null,
      recovered: false,
    });

    const stop = client.connect();
    const connection = connectionAt(connections, -1);
    expect(activeChannels(connection)).toEqual(["rooms:one", "rooms:two"]);
    subscriptionFor(connection, "rooms:one").observer.publication({
      data: 1,
      native: null,
    });
    subscriptionFor(connection, "rooms:two").observer.publication({
      data: 2,
      native: null,
    });
    expect(handler).toHaveBeenCalledTimes(2);
    stopFirst();
    stopSecond();
    stop();
    stopObserving();
  },
);

test.each([false, true])(
  "failed preparation leaves one inactive session without duplicate notifications; replacing: %s",
  (replaceExisting) => {
    const failure = new Error("invalid connection options");
    let fail = false;
    const { client, connections } = createClient({
      onConnect: () => {
        if (!fail) {
          return;
        }

        fail = false;
        expect(client.native.get()).toBeNull();
        throw failure;
      },
    });
    const natives: unknown[] = [];
    const stopObserving = client.native.subscribe(() =>
      natives.push(client.native.get()),
    );
    const stopPublications = client.channel("rooms:one").subscribe(() => {});
    const stopPrevious = replaceExisting ? client.connect() : () => {};
    const previous = connections.at(0);

    fail = true;
    expect(() => client.connect()).toThrow(failure);
    expect(client.native.get()).toBeNull();
    expect(natives).toEqual(replaceExisting ? [previous, null] : []);
    if (previous !== undefined) {
      expect(previous.disposeCount).toBe(1);
      expect(activeChannels(previous)).toEqual([]);
    }

    const stopCurrent = client.connect();
    const current = connectionAt(connections, -1);
    expect(activeChannels(current)).toEqual(["rooms:one"]);
    stopPrevious();
    expect(client.native.get()).toBe(current);
    stopCurrent();
    stopPublications();
    stopObserving();
  },
);

test("channel handles remain reusable after cleanup without passive observers retaining subscriptions", () => {
  const { client, connections } = createClient();
  const channel = client.channel("rooms:one");
  const stop = client.connect();
  const connection = connectionAt(connections, 0);
  const stopObserving = channel.status.subscribe(() => {});

  expect(connection.subscriptions).toEqual([]);
  const first = channel.subscribe(() => {});
  const firstSubscription = subscriptionFor(connection, "rooms:one");
  firstSubscription.observer.state("subscribing");
  expect(channel.status.get().state).toBe("subscribing");
  first();
  expect(firstSubscription.disposeCount).toBe(1);
  expect(channel.status.get().state).toBe("detached");
  stopObserving();

  const second = channel.subscribe(() => {});
  const secondSubscription = subscriptionFor(connection, "rooms:one");
  expect(secondSubscription).not.toBe(firstSubscription);
  first();
  stopObserving();
  expect(secondSubscription.disposeCount).toBe(0);
  second();
  expect(activeChannels(connection)).toEqual([]);
  stop();
});

test("a status observer can resubscribe immediately after the previous subscription is released", () => {
  const { client, connections } = createClient();
  const channel = client.channel("rooms:one");
  const stop = client.connect();
  const connection = connectionAt(connections, 0);
  const first = channel.subscribe(() => {});
  const previous = subscriptionFor(connection, "rooms:one");
  const cleanups: Array<() => void> = [];
  const stopObserving = channel.status.subscribe(() => {
    if (channel.status.get().state !== "detached") {
      return;
    }

    cleanups.push(channel.subscribe(() => {}));
  });

  previous.observer.state("subscribing");
  first();

  expect(cleanups).toHaveLength(1);
  expect(previous.disposeCount).toBe(1);
  expect(subscriptionFor(connection, "rooms:one")).not.toBe(previous);
  stopObserving();
  cleanups.forEach((cleanup) => cleanup());
  expect(activeChannels(connection)).toEqual([]);
  stop();
});

test("replacing the session from a channel state callback keeps only the latest connection and subscriptions", () => {
  let replace = true;
  let stopLatest = () => {};
  const { client, connections } = createClient({
    onSubscribe: (subscription) => subscription.observer.state("subscribing"),
  });
  const first = client.channel("rooms:one");
  const second = client.channel("rooms:two");
  const publication = vi.fn();
  const stopFirst = first.subscribe(publication);
  const stopSecond = second.subscribe(publication);
  const stopStates = first.status.subscribe(() => {
    if (!replace) {
      return;
    }

    if (first.status.get().state !== "subscribing") {
      return;
    }

    replace = false;
    stopLatest = client.connect();
  });

  const stopInitial = client.connect();

  try {
    expect(connections).toHaveLength(2);
    const previous = connectionAt(connections, 0);
    const current = connectionAt(connections, 1);
    expect(previous.disposeCount).toBe(1);
    expect(activeChannels(previous)).toEqual([]);
    expect(client.native.get()).toBe(current);
    expect(activeChannels(current)).toEqual(["rooms:one", "rooms:two"]);
    stopInitial();
    expect(client.native.get()).toBe(current);
    subscriptionFor(current, "rooms:two").observer.publication({
      data: 1,
      native: null,
    });
    expect(publication).toHaveBeenCalledTimes(1);
  } finally {
    stopInitial();
    stopLatest();
    stopStates();
    stopFirst();
    stopSecond();
  }
});

test("replacing the session from a native observer during teardown keeps only the latest connection", () => {
  const { client, connections } = createClient();
  let replace = true;
  let stopLatest = () => {};
  const channel = client.channel("rooms:one");
  const onPublication = vi.fn();
  const stopPublications = channel.subscribe(onPublication);
  const stopNative = client.native.subscribe(() => {
    if (!replace) {
      return;
    }

    if (client.native.get() !== null) {
      return;
    }

    replace = false;
    stopLatest = client.connect();
  });
  const stopFirst = client.connect();
  const previous = connectionAt(connections, 0);

  stopFirst();

  const latest = connectionAt(connections, 1);
  expect(connections).toHaveLength(2);
  expect(previous.disposeCount).toBe(1);
  expect(activeChannels(previous)).toEqual([]);
  expect(client.native.get()).toBe(latest);
  expect(activeChannels(latest)).toEqual(["rooms:one"]);
  subscriptionFor(latest, "rooms:one").observer.publication({
    data: 1,
    native: null,
  });
  expect(onPublication).toHaveBeenCalledTimes(1);
  stopFirst();
  expect(client.native.get()).toBe(latest);
  stopNative();
  stopPublications();
  stopLatest();
  expect(client.native.get()).toBeNull();
});

test("channel changes during session startup skip evicted channels and subscribe newly retained ones once", () => {
  const { client, connections } = createClient({
    onSubscribe: (subscription) => subscription.observer.state("subscribing"),
  });
  const first = client.channel("rooms:one");
  const stopFirst = first.subscribe(() => {});
  const stopSecond = client.channel("rooms:two").subscribe(() => {});
  let stopThird = () => {};
  const publication = vi.fn();
  const stopStates = first.status.subscribe(() => {
    if (first.status.get().state !== "subscribing") {
      return;
    }

    stopSecond();
    stopThird = client.channel("rooms:three").subscribe(publication);
  });
  const stopSession = client.connect();

  try {
    const connection = connectionAt(connections, 0);
    expect(activeChannels(connection)).toEqual(["rooms:one", "rooms:three"]);
    expect(connection.subscriptions).toHaveLength(2);
    subscriptionFor(connection, "rooms:three").observer.publication({
      data: 1,
      native: null,
    });
    expect(publication).toHaveBeenCalledTimes(1);
  } finally {
    stopSession();
    stopFirst();
    stopSecond();
    stopThird();
    stopStates();
  }
});

test.each(["listener", "channel", "session"])(
  "ending a %s during publication dispatch skips later consumers",
  (target) => {
    const { client, connections } = createClient();
    const channel = client.channel("rooms:one");
    const handler = vi.fn();
    const stopFirst = channel.subscribe(() => {
      if (target === "session") {
        stopSession();
        return;
      }

      stopSecond();

      if (target === "channel") {
        stopFirst();
      }
    });
    const stopSecond = channel.subscribe(handler);
    const stopSession = client.connect();

    subscriptionFor(
      connectionAt(connections, 0),
      "rooms:one",
    ).observer.publication({ data: 1, native: null });

    expect(handler).not.toHaveBeenCalled();
    stopFirst();
    stopSecond();
    stopSession();
  },
);

test("many consumers share a single adapter subscription across session replacements", () => {
  const { client, connections } = createClient();
  const handler = vi.fn();
  const channel = client.channel("rooms:one");
  const cleanups = Array.from({ length: 25 }, () => channel.subscribe(handler));
  const statusCleanups = Array.from({ length: 25 }, () =>
    channel.status.subscribe(() => {}),
  );
  const first = client.connect();
  const second = client.connect();
  const connection = connectionAt(connections, 1);

  expect(connectionAt(connections, 0).subscriptions).toHaveLength(1);
  expect(connection.subscriptions).toHaveLength(1);
  subscriptionFor(connection, "rooms:one").observer.publication({
    data: 1,
    native: null,
  });
  expect(handler).toHaveBeenCalledTimes(25);
  cleanups.forEach((stop) => stop());
  expect(activeChannels(connection)).toEqual([]);
  statusCleanups.forEach((stop) => stop());
  first();
  second();
});
