import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import type {
  RealtimeAdapter,
  RealtimePublication,
} from "@priemskiyyy/simulcast";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { phoenixFixture, supabaseFixture } from "./serviceFixtures";

type ServiceFixture = {
  adapter: RealtimeAdapter;
  publish: (topic: string, text: string) => Promise<void>;
  connections: () => number;
  accepted: () => number;
  drop: () => void | Promise<void>;
};

const providers: {
  name: string;
  create: (token?: string) => ServiceFixture;
  deniedError: object;
}[] = [
  {
    name: "Phoenix",
    create: phoenixFixture,
    deniedError: { reason: "unauthorized" },
  },
  {
    name: "Supabase",
    create: supabaseFixture,
    deniedError: { message: expect.stringContaining("permissions") },
  },
];

describe.each(providers)("$name local server", ({ create, deniedError }) => {
  test("can dispose while the initial connection and channel join are pending", async () => {
    const fixture = create();
    const client = new RealtimeClient({ adapter: fixture.adapter });
    const room = client.channel(`room:${randomUUID()}`);
    const received = vi.fn();
    onTestFinished(room.subscribe(received));
    const stop = client.connect();
    onTestFinished(stop);
    stop();
    stop();
    await expect.poll(fixture.connections).toBe(0);
    await setTimeout(250);
    expect(fixture.connections()).toBe(0);
    expect(client.connection.get()).toBe("disconnected");
    expect(received).not.toHaveBeenCalled();
  });

  test("reports invalid connection credentials without accepting a connection", async () => {
    const fixture = create("invalid");
    const states = vi.fn();
    const errors = vi.fn();
    const connection = fixture.adapter.connect({
      state: states,
      error: errors,
    });
    onTestFinished(() => connection.dispose());
    await expect.poll(() => errors.mock.calls.length).toBeGreaterThan(0);
    expect(states).not.toHaveBeenCalledWith("connected");
    expect(fixture.accepted()).toBe(0);
    connection.dispose();
    await expect.poll(fixture.connections).toBe(0);
  });

  test("subscribes again after the last consumer leaves", async () => {
    const fixture = create();
    const client = new RealtimeClient({ adapter: fixture.adapter });
    const topic = `room:${randomUUID()}`;
    const room = client.channel(topic);
    const first = vi.fn();
    const next = vi.fn();
    const stopFirst = room.subscribe(first);
    onTestFinished(stopFirst);
    onTestFinished(client.connect());
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    stopFirst();
    await expect.poll(() => room.status.get().state).toBe("detached");
    onTestFinished(room.subscribe(next));
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    await fixture.publish(topic, "resubscribed");
    await fixture.publish(topic, "barrier");
    await expect.poll(() => next.mock.calls.length).toBe(2);
    expect(first).not.toHaveBeenCalled();
    expect(fixture.accepted()).toBe(1);
  });

  test("shares a channel, preserves metadata, isolates topics, and releases demand", async () => {
    const fixture = create();
    const client = new RealtimeClient({ adapter: fixture.adapter });
    const topic = `room:${randomUUID()}`;
    const room = client.channel(topic);
    const otherRoom = client.channel(`${topic}:other`);
    const first = vi.fn<(publication: RealtimePublication) => void>();
    const second = vi.fn<(publication: RealtimePublication) => void>();
    const other = vi.fn<(publication: RealtimePublication) => void>();
    const stopFirst = room.subscribe(first);
    const stopSecond = room.subscribe(second);
    onTestFinished(stopFirst);
    onTestFinished(stopSecond);
    onTestFinished(otherRoom.subscribe(other));
    expect(fixture.connections()).toBe(0);
    const stop = client.connect();
    onTestFinished(stop);
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    await expect.poll(() => otherRoom.status.get().state).toBe("subscribed");
    await fixture.publish(topic, "first");
    await expect.poll(() => second.mock.calls.length).toBe(1);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second.mock.calls[0]?.[0]).toMatchObject({
      event: "message",
      data: { text: "first" },
    });
    expect(other).not.toHaveBeenCalled();
    expect(fixture.accepted()).toBe(1);

    stopFirst();
    await fixture.publish(topic, "second");
    await expect.poll(() => second.mock.calls.length).toBe(2);
    expect(first).toHaveBeenCalledTimes(1);
    stopSecond();
    await fixture.publish(topic, "obsolete");
    await fixture.publish(`${topic}:other`, "barrier");
    await expect.poll(() => other.mock.calls.length).toBe(1);
    expect(second).toHaveBeenCalledTimes(2);
    stop();
    await expect.poll(fixture.connections).toBe(0);
  });

  test("rejoins after transport loss and delivers each publication once", async () => {
    const fixture = create();
    const client = new RealtimeClient({ adapter: fixture.adapter });
    const topic = `room:${randomUUID()}`;
    const room = client.channel(topic);
    const received: unknown[] = [];
    const states: string[] = [];
    onTestFinished(
      room.subscribe(({ data }) => {
        received.push(data);
      }),
    );
    onTestFinished(
      room.status.subscribe(() => states.push(room.status.get().state)),
    );
    onTestFinished(client.connect());
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    await fixture.publish(topic, "before");
    await expect.poll(() => received).toEqual([{ text: "before" }]);
    states.length = 0;
    await fixture.drop();
    await expect.poll(fixture.accepted).toBe(2);
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    expect(states).toContain("subscribing");
    await fixture.publish(topic, "after");
    await fixture.publish(topic, "barrier");
    await expect
      .poll(() => received)
      .toEqual([{ text: "before" }, { text: "after" }, { text: "barrier" }]);
  });

  test("preserves subscriptions through session replacement and ignores stale cleanup", async () => {
    const fixture = create();
    const client = new RealtimeClient({ adapter: fixture.adapter });
    const topic = `room:${randomUUID()}`;
    const room = client.channel(topic);
    const received: unknown[] = [];
    onTestFinished(
      room.subscribe(({ data }) => {
        received.push(data);
      }),
    );
    const stopPrevious = client.connect();
    onTestFinished(stopPrevious);
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    onTestFinished(client.connect());
    stopPrevious();
    stopPrevious();
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    await expect.poll(fixture.connections).toBe(1);
    await fixture.publish(topic, "replacement");
    await fixture.publish(topic, "barrier");
    await expect
      .poll(() => received)
      .toEqual([{ text: "replacement" }, { text: "barrier" }]);
  });

  test("reports a rejected channel and keeps it silent beside an allowed channel", async () => {
    const fixture = create();
    const client = new RealtimeClient({ adapter: fixture.adapter });
    const topic = `room:${randomUUID()}`;
    const denied = client.channel(`${topic}:denied`);
    const allowed = client.channel(topic);
    const rejected = vi.fn();
    const received = vi.fn();
    onTestFinished(denied.subscribe(rejected));
    onTestFinished(allowed.subscribe(received));
    onTestFinished(client.connect());
    await expect.poll(() => allowed.status.get().state).toBe("subscribed");
    await expect.poll(() => denied.status.get().error).not.toBeNull();
    expect(denied.status.get().error?.error).toMatchObject(deniedError);
    expect(denied.status.get().state).not.toBe("subscribed");
    await fixture.publish(`${topic}:denied`, "forbidden");
    await fixture.publish(topic, "barrier");
    await expect.poll(() => received.mock.calls.length).toBe(1);
    expect(rejected).not.toHaveBeenCalled();
  });

  test("disposal during reconnect cancels retries and releases the connection", async () => {
    const fixture = create();
    const client = new RealtimeClient({ adapter: fixture.adapter });
    const room = client.channel(`room:${randomUUID()}`);
    onTestFinished(room.subscribe(() => {}));
    const stop = client.connect();
    onTestFinished(stop);
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    onTestFinished(
      room.status.subscribe(() => {
        if (room.status.get().state === "subscribing") stop();
      }),
    );
    await fixture.drop();
    await expect.poll(fixture.connections).toBe(0);
    await setTimeout(250);
    expect(fixture.accepted()).toBe(1);
    expect(fixture.connections()).toBe(0);
    expect(client.connection.get()).toBe("disconnected");
  });
});
