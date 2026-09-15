import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { RealtimeClient } from "simulcast";
import { partykit } from "simulcast-partykit";
import { expect, inject, onTestFinished, test, vi } from "vitest";

const fixture = () => {
  const host = inject("partykitHost");
  const roomId = randomUUID();
  const endpoint = `http://${host}/parties/main/${roomId}`;
  const client = new RealtimeClient({
    adapter: partykit({
      host,
      protocol: "ws",
      query: { token: "local-test-token" },
      minReconnectionDelay: 30,
      maxReconnectionDelay: 30,
      minUptime: 0,
      connectionTimeout: 1_000,
    }),
  });
  const room = client.channel(roomId);
  const received: string[] = [];
  const remove = room.subscribe(({ data }) => {
    received.push(String(data));
  });
  onTestFinished(remove);
  const stop = client.connect();
  onTestFinished(stop);
  return {
    client,
    room,
    remove,
    stop,
    received,
    publish: async (text: string) => {
      const response = await fetch(endpoint, { method: "POST", body: text });
      expect(response.status).toBe(204);
    },
    stats: async () => {
      const value: unknown = await fetch(endpoint).then((response) =>
        response.json(),
      );
      if (
        typeof value !== "object" ||
        value === null ||
        !("connections" in value) ||
        typeof value.connections !== "number" ||
        !("accepted" in value) ||
        typeof value.accepted !== "number"
      ) {
        throw new Error("Expected PartyKit room counters");
      }
      return { connections: value.connections, accepted: value.accepted };
    },
    drop: async () => {
      const response = await fetch(`${endpoint}?drop`, { method: "POST" });
      expect(response.status).toBe(204);
    },
  };
};

test("shares a room socket between consumers and releases it with the last consumer", async () => {
  const provider = fixture();
  const second = vi.fn();
  const removeSecond = provider.room.subscribe(second);
  onTestFinished(removeSecond);
  await expect.poll(() => provider.room.status.get().state).toBe("subscribed");
  await expect.poll(provider.stats).toEqual({ connections: 1, accepted: 1 });
  await provider.publish("first");
  await expect.poll(() => provider.received).toEqual(["first"]);
  expect(second).toHaveBeenCalledTimes(1);
  expect(second.mock.calls[0]?.[0].native).toBeInstanceOf(MessageEvent);
  provider.remove();
  await provider.publish("second");
  await expect.poll(() => second.mock.calls.length).toBe(2);
  expect(provider.received).toEqual(["first"]);
  removeSecond();
  removeSecond();
  await expect.poll(provider.stats).toEqual({ connections: 0, accepted: 1 });
});

test("isolates independently connected rooms", async () => {
  const provider = fixture();
  const other = fixture();
  await expect.poll(() => provider.room.status.get().state).toBe("subscribed");
  await expect.poll(() => other.room.status.get().state).toBe("subscribed");
  await provider.publish("first room");
  await other.publish("other room");
  await expect.poll(() => provider.received).toEqual(["first room"]);
  await expect.poll(() => other.received).toEqual(["other room"]);
});

test("reconnects after a server close and delivers each publication once", async () => {
  const provider = fixture();
  const states: string[] = [];
  onTestFinished(
    provider.room.status.subscribe(() =>
      states.push(provider.room.status.get().state),
    ),
  );
  await expect.poll(() => provider.room.status.get().state).toBe("subscribed");
  await provider.publish("before");
  await expect.poll(() => provider.received).toEqual(["before"]);
  await provider.drop();
  await expect.poll(provider.stats).toEqual({ connections: 1, accepted: 2 });
  await expect.poll(() => provider.room.status.get().state).toBe("subscribed");
  expect(states).toContain("subscribing");
  await provider.publish("after");
  await provider.publish("barrier");
  await expect
    .poll(() => provider.received)
    .toEqual(["before", "after", "barrier"]);
});

test("disposing inside a reconnect notification cancels retries", async () => {
  const provider = fixture();
  await expect.poll(() => provider.room.status.get().state).toBe("subscribed");
  onTestFinished(
    provider.room.status.subscribe(() => {
      if (provider.room.status.get().state === "subscribing") provider.stop();
    }),
  );
  await provider.drop();
  await expect.poll(provider.stats).toEqual({ connections: 0, accepted: 1 });
  await setTimeout(150);
  expect(await provider.stats()).toEqual({ connections: 0, accepted: 1 });
  expect(provider.client.connection.get()).toBe("disconnected");
});

test("keeps demand through session replacement and ignores stale disposal", async () => {
  const provider = fixture();
  await expect.poll(() => provider.room.status.get().state).toBe("subscribed");
  await provider.publish("before");
  await expect.poll(() => provider.received).toEqual(["before"]);
  const stopReplacement = provider.client.connect();
  onTestFinished(stopReplacement);
  provider.stop();
  await expect.poll(provider.stats).toEqual({ connections: 1, accepted: 2 });
  await expect.poll(() => provider.room.status.get().state).toBe("subscribed");
  await provider.publish("replacement");
  await expect.poll(() => provider.received).toEqual(["before", "replacement"]);
  stopReplacement();
  await expect.poll(provider.stats).toEqual({ connections: 0, accepted: 2 });
});

test("resubscribes after the last consumer leaves", async () => {
  const provider = fixture();
  await expect.poll(() => provider.room.status.get().state).toBe("subscribed");
  provider.remove();
  await expect.poll(provider.stats).toEqual({ connections: 0, accepted: 1 });
  const received = vi.fn();
  onTestFinished(provider.room.subscribe(received));
  await expect.poll(provider.stats).toEqual({ connections: 1, accepted: 2 });
  await expect.poll(() => provider.room.status.get().state).toBe("subscribed");
  await provider.publish("new consumer");
  await expect.poll(() => received.mock.calls.length).toBe(1);
  expect(provider.received).toEqual([]);
});

test("reports a rejected WebSocket handshake and cancels pending retries on disposal", async () => {
  const host = inject("partykitHost");
  const roomId = randomUUID();
  const rejected = async () => {
    const response = await fetch(
      `http://${host}/parties/main/${roomId}?rejected`,
    );
    const value: unknown = await response.json();
    if (typeof value !== "number")
      throw new Error("Expected rejected handshake count");
    return value;
  };
  const before = await rejected();
  const errors = vi.fn();
  const client = new RealtimeClient({
    adapter: partykit({
      host,
      protocol: "ws",
      query: { token: "wrong" },
      minReconnectionDelay: 30,
      maxReconnectionDelay: 30,
    }),
  });
  const room = client.channel(roomId);
  const received = vi.fn();
  onTestFinished(
    room.status.subscribe(() => {
      if (room.status.get().error !== null) errors();
    }),
  );
  onTestFinished(room.subscribe(received));
  const stop = client.connect();
  onTestFinished(stop);
  await expect.poll(() => errors.mock.calls.length).toBeGreaterThan(0);
  expect(await rejected()).toBeGreaterThan(before);
  expect(room.status.get().state).toBe("subscribing");
  expect(received).not.toHaveBeenCalled();
  stop();
  const errorCount = errors.mock.calls.length;
  const rejectedCount = await rejected();
  await setTimeout(150);
  expect(errors).toHaveBeenCalledTimes(errorCount);
  expect(await rejected()).toBe(rejectedCount);
  expect(client.connection.get()).toBe("disconnected");
});

test("low-level subscriptions expose the native socket for sending", async () => {
  const adapter = partykit({
    host: inject("partykitHost"),
    protocol: "ws",
    query: { token: "local-test-token" },
  });
  const connection = adapter.connect({ state: vi.fn(), error: vi.fn() });
  onTestFinished(connection.dispose);
  const publication = vi.fn();
  const state = vi.fn();
  const subscription = connection.subscribe({
    channel: randomUUID(),
    observer: { state, error: vi.fn(), publication },
  });
  onTestFinished(subscription.dispose);
  await expect.poll(() => state.mock.lastCall?.[0]).toBe("subscribed");
  subscription.native.send("sent through PartySocket");
  await expect.poll(() => publication.mock.calls.length).toBe(1);
  expect(publication.mock.calls[0]?.[0].data).toBe("sent through PartySocket");
  expect(connection.native).toBeNull();
});

test("disposing before the initial handshake finishes prevents a live room socket", async () => {
  const provider = fixture();
  provider.stop();
  await setTimeout(150);
  expect((await provider.stats()).connections).toBe(0);
  expect(provider.received).toEqual([]);
  expect(provider.client.connection.get()).toBe("disconnected");
});
