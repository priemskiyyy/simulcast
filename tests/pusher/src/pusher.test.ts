import { setTimeout } from "node:timers/promises";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import type {
  AdapterSubscriptionObserver,
  AdapterConnectionObserver,
  RealtimePublication,
} from "@priemskiyyy/simulcast";
import { pusher } from "@priemskiyyy/simulcast-pusher";
import { expect, onTestFinished, test, vi } from "vitest";
import { pusherFixture } from "./pusherFixture";

test.each(["public", "private", "presence"])(
  "%s channels share demand, preserve metadata, and isolate consumers",
  async (kind) => {
    const provider = await pusherFixture();
    const client = new RealtimeClient({ adapter: provider.adapter });
    const name = provider.channel(kind);
    const room = client.channel(name);
    const otherName = provider.channel(kind);
    const otherRoom = client.channel(otherName);
    const first = vi.fn<(publication: RealtimePublication) => void>();
    const second = vi.fn<(publication: RealtimePublication) => void>();
    const other = vi.fn<(publication: RealtimePublication) => void>();
    const stopFirst = room.subscribe(first);
    const stopSecond = room.subscribe(second);
    onTestFinished(stopFirst);
    onTestFinished(stopSecond);
    onTestFinished(otherRoom.subscribe(other));
    onTestFinished(client.connect());
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    await expect.poll(() => otherRoom.status.get().state).toBe("subscribed");
    expect(provider.connections()).toBe(1);
    expect(provider.authorizations()).toBe(kind === "public" ? 0 : 2);
    expect(first).not.toHaveBeenCalled();
    await provider.publisher.trigger(name, "message", {
      text: "hello",
      nested: { count: 2 },
    });
    await expect.poll(() => second.mock.calls.length).toBe(1);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second.mock.calls[0]?.[0]).toEqual({
      event: "message",
      data: { text: "hello", nested: { count: 2 } },
      native: {
        event: "message",
        data: { text: "hello", nested: { count: 2 } },
      },
    });
    expect(other).not.toHaveBeenCalled();
    stopFirst();
    stopFirst();
    await provider.publisher.trigger(name, "updated", "second");
    await expect.poll(() => second.mock.calls.length).toBe(2);
    expect(first).toHaveBeenCalledTimes(1);
    stopSecond();
    await expect.poll(() => provider.occupied(name)).toBe(false);
    await provider.publisher.trigger(name, "message", "obsolete");
    await provider.publisher.trigger(otherName, "message", "barrier");
    await expect.poll(() => other.mock.calls.length).toBe(1);
    expect(second).toHaveBeenCalledTimes(2);

    onTestFinished(room.subscribe(second));
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    await provider.publisher.trigger(name, "message", "resubscribed");
    await expect.poll(() => second.mock.calls.length).toBe(3);
  },
);

test.each(["before", "after"])(
  "private channel authorization rejection %s connection stays silent while public subscriptions work",
  async (timing) => {
    const provider = await pusherFixture();
    const connectionState = vi.fn<AdapterConnectionObserver["state"]>();
    const connection = provider.adapter.connect({
      state: connectionState,
      error: () => {},
    });
    onTestFinished(connection.dispose);
    if (timing === "after") {
      await expect
        .poll(() => connectionState.mock.lastCall?.[0])
        .toBe("connected");
    }
    const denied = provider.channel("private-denied");
    const error = vi.fn<AdapterSubscriptionObserver["error"]>();
    const state = vi.fn<AdapterSubscriptionObserver["state"]>();
    const publication = vi.fn<AdapterSubscriptionObserver["publication"]>();
    const subscription = connection.subscribe({
      channel: denied,
      observer: { error, state, publication },
    });
    onTestFinished(subscription.dispose);
    await expect.poll(() => error.mock.calls.length).toBe(1);
    expect(state).toHaveBeenLastCalledWith("unsubscribed");
    expect(await provider.occupied(denied)).toBe(false);
    await provider.publisher.trigger(denied, "message", "not authorized");
    const allowed = provider.channel();
    const allowedMessages = vi.fn<AdapterSubscriptionObserver["publication"]>();
    const allowedState = vi.fn<AdapterSubscriptionObserver["state"]>();
    const allowedSubscription = connection.subscribe({
      channel: allowed,
      observer: { error, state: allowedState, publication: allowedMessages },
    });
    onTestFinished(allowedSubscription.dispose);
    await expect.poll(() => allowedState.mock.lastCall?.[0]).toBe("subscribed");
    await provider.publisher.trigger(allowed, "message", "barrier");
    await expect.poll(() => allowedMessages.mock.calls.length).toBe(1);
    expect(publication).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
  },
);

test("server rejects an invalid private channel signature", async () => {
  const provider = await pusherFixture();
  const errors = vi.fn<AdapterConnectionObserver["error"]>();
  const connection = pusher({
    key: "test-key",
    options: {
      ...provider.options,
      channelAuthorization: {
        customHandler: (_, callback) =>
          callback(null, { auth: "test-key:invalid-signature" }),
      },
    },
  }).connect({ state: () => {}, error: errors });
  onTestFinished(connection.dispose);
  const name = provider.channel("private");
  const publication = vi.fn<AdapterSubscriptionObserver["publication"]>();
  const subscription = connection.subscribe({
    channel: name,
    observer: { state: () => {}, error: errors, publication },
  });
  onTestFinished(subscription.dispose);
  await expect.poll(() => errors.mock.calls.length).toBeGreaterThan(0);
  expect(await provider.occupied(name)).toBe(false);
  expect(publication).not.toHaveBeenCalled();
});

test("reconnects private subscriptions, reauthorizes, and delivers once", async () => {
  const provider = await pusherFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const name = provider.channel("private");
  const room = client.channel(name);
  const messages = vi.fn<(publication: RealtimePublication) => void>();
  const states: string[] = [];
  onTestFinished(room.subscribe(messages));
  onTestFinished(
    room.status.subscribe(() => states.push(room.status.get().state)),
  );
  onTestFinished(client.connect());
  await expect.poll(() => room.status.get().state).toBe("subscribed");
  await provider.publisher.trigger(name, "message", "before");
  await expect.poll(() => messages.mock.calls.length).toBe(1);
  states.length = 0;
  provider.drop();
  await expect.poll(provider.accepted).toBe(2);
  await expect.poll(() => room.status.get().state).toBe("subscribed");
  expect(states).toContain("subscribing");
  expect(provider.authorizations()).toBe(2);
  await provider.publisher.trigger(name, "message", "after");
  await provider.publisher.trigger(name, "message", "barrier");
  await expect
    .poll(() => messages.mock.calls.map(([message]) => message.data))
    .toEqual(["before", "after", "barrier"]);
});

test("session replacement preserves demand and stale cleanup cannot disconnect it", async () => {
  const provider = await pusherFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const name = provider.channel();
  const room = client.channel(name);
  const messages = vi.fn<(publication: RealtimePublication) => void>();
  onTestFinished(room.subscribe(messages));
  const previous = client.connect();
  onTestFinished(previous);
  await expect.poll(() => room.status.get().state).toBe("subscribed");
  onTestFinished(client.connect());
  previous();
  previous();
  await expect.poll(() => room.status.get().state).toBe("subscribed");
  await expect.poll(provider.connections).toBe(1);
  await provider.publisher.trigger(name, "message", "replacement");
  await provider.publisher.trigger(name, "message", "barrier");
  await expect
    .poll(() => messages.mock.calls.map(([message]) => message.data))
    .toEqual(["replacement", "barrier"]);
});

test("opens nothing before a session and disposes idempotently across repeated sessions", async () => {
  const provider = await pusherFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const name = provider.channel();
  const room = client.channel(name);
  onTestFinished(room.subscribe(() => {}));
  expect(provider.accepted()).toBe(0);
  for (let index = 0; index < 3; index++) {
    const stop = client.connect();
    onTestFinished(stop);
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    stop();
    stop();
    await expect.poll(provider.connections).toBe(0);
    await expect.poll(() => provider.occupied(name)).toBe(false);
    expect(client.connection.get()).toBe("disconnected");
  }
  expect(provider.accepted()).toBe(3);
});

test("disposal inside the reconnect notification releases the pending SDK attempt", async () => {
  const provider = await pusherFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const name = provider.channel();
  const room = client.channel(name);
  onTestFinished(room.subscribe(() => {}));
  const stop = client.connect();
  onTestFinished(stop);
  await expect.poll(() => room.status.get().state).toBe("subscribed");
  onTestFinished(
    room.status.subscribe(() => {
      if (room.status.get().state === "subscribing") stop();
    }),
  );
  provider.drop();
  await expect.poll(() => client.connection.get()).toBe("disconnected");
  await expect.poll(provider.connections).toBe(0);
  // pusher-js retries a closed transport after one second.
  await setTimeout(1_200);
  // An in-flight TCP attempt may be accepted before the SDK closes it.
  expect(provider.accepted()).toBeLessThanOrEqual(2);
  expect(provider.connections()).toBe(0);
});

test("presence membership events remain native and are not publications", async () => {
  const provider = await pusherFixture();
  const other = await pusherFixture();
  const name = provider.channel("presence");
  const first = new RealtimeClient({ adapter: provider.adapter });
  const second = new RealtimeClient({ adapter: other.adapter });
  const room = first.channel(name);
  const messages = vi.fn<(publication: RealtimePublication) => void>();
  onTestFinished(room.subscribe(messages));
  onTestFinished(first.connect());
  await expect.poll(() => room.status.get().state).toBe("subscribed");
  const native = first.native.get()?.channel(name);
  expect(native).toBeDefined();
  if (!native) throw new Error("Expected native presence channel");
  const joined = vi.fn();
  const left = vi.fn();
  native.bind("pusher:member_added", joined);
  native.bind("pusher:member_removed", left);
  onTestFinished(() => {
    native.unbind("pusher:member_added", joined);
    native.unbind("pusher:member_removed", left);
  });
  const secondRoom = second.channel(name);
  onTestFinished(secondRoom.subscribe(() => {}));
  const stopSecond = second.connect();
  onTestFinished(stopSecond);
  await expect.poll(() => joined.mock.calls.length).toBe(1);
  expect(messages).not.toHaveBeenCalled();
  stopSecond();
  await expect.poll(() => left.mock.calls.length).toBe(1);
  await provider.publisher.trigger(name, "message", "barrier");
  await expect.poll(() => messages.mock.calls.length).toBe(1);
  expect(messages.mock.calls[0]?.[0].data).toBe("barrier");
});
