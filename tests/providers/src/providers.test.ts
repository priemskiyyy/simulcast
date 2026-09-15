import { setTimeout } from "node:timers/promises";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import type { RealtimePublication } from "@priemskiyyy/simulcast";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { broadcastChannelFixture } from "./broadcastChannelFixture";
import { mqttFixture } from "./mqttFixture";
import type {
  NetworkProviderFixture,
  ProviderFixture,
} from "./ProviderFixture";
import { socketioFixture } from "./socketioFixture";
import { sseFixture } from "./sseFixture";
import { websocketFixture } from "./websocketFixture";

const networkProviders: {
  name: string;
  create: () => Promise<NetworkProviderFixture>;
}[] = [
  { name: "Socket.IO", create: socketioFixture },
  { name: "MQTT", create: mqttFixture },
  { name: "WebSocket", create: websocketFixture },
  { name: "SSE", create: sseFixture },
];
const providers: { name: string; create: () => Promise<ProviderFixture> }[] = [
  ...networkProviders,
  { name: "BroadcastChannel", create: broadcastChannelFixture },
];

describe.each(providers)("$name over its real transport", ({ create }) => {
  test("shares demand, isolates channels, and stops delivering to removed consumers", async () => {
    const provider = await create();
    const client = new RealtimeClient({ adapter: provider.adapter });
    const room = client.channel("rooms/one");
    const first = vi.fn<(publication: RealtimePublication) => void>();
    const second = vi.fn<(publication: RealtimePublication) => void>();
    const other = vi.fn<(publication: RealtimePublication) => void>();
    const stopFirst = room.subscribe(first);
    onTestFinished(stopFirst);
    const stopSecond = room.subscribe(second);
    onTestFinished(stopSecond);
    onTestFinished(client.channel("rooms/two").subscribe(other));
    onTestFinished(client.connect());
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    await provider.ready("rooms/one");
    await provider.ready("rooms/two");

    await provider.publish("rooms/one", "first");
    await expect.poll(() => second.mock.calls.length).toBe(1);
    expect(first).toHaveBeenCalledTimes(1);
    expect(String(second.mock.calls[0]?.[0].data)).toBe("first");
    expect(other).not.toHaveBeenCalled();

    stopFirst();
    stopFirst();
    await provider.publish("rooms/one", "second");
    await expect.poll(() => second.mock.calls.length).toBe(2);
    expect(first).toHaveBeenCalledTimes(1);

    stopSecond();
    await provider.publish("rooms/one", "obsolete");
    await provider.publish("rooms/two", "still active");
    await expect.poll(() => other.mock.calls.length).toBe(1);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  test("keeps demand across session replacement and ignores stale cleanup", async () => {
    const provider = await create();
    const client = new RealtimeClient({ adapter: provider.adapter });
    const received: string[] = [];
    const room = client.channel("rooms/one");
    onTestFinished(
      room.subscribe(({ data }) => {
        received.push(String(data));
      }),
    );
    let stopPrevious = client.connect();
    onTestFinished(stopPrevious);

    for (let index = 0; index < 3; index++) {
      await expect.poll(() => room.status.get().state).toBe("subscribed");
      await provider.ready("rooms/one");
      await provider.publish("rooms/one", `session ${index}`);
      await expect
        .poll(() => received)
        .toEqual(
          Array.from({ length: index + 1 }, (_, value) => `session ${value}`),
        );
      const stopCurrent = client.connect();
      onTestFinished(stopCurrent);
      stopPrevious();
      stopPrevious = stopCurrent;
    }

    await expect.poll(() => room.status.get().state).toBe("subscribed");
    await provider.ready("rooms/one");
    await provider.publish("rooms/one", "replacement survived");
    await expect
      .poll(() => received)
      .toEqual(["session 0", "session 1", "session 2", "replacement survived"]);
  });
});

describe.each(networkProviders)("$name network lifecycle", ({ create }) => {
  test("disposing during reconnect cancels retries and releases the transport", async () => {
    const provider = await create();
    const client = new RealtimeClient({ adapter: provider.adapter });
    const room = client.channel("rooms/one");
    onTestFinished(room.subscribe(() => {}));
    const stop = client.connect();
    onTestFinished(stop);
    await provider.ready("rooms/one");
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    onTestFinished(
      room.status.subscribe(() => {
        if (room.status.get().state === "subscribing") stop();
      }),
    );
    provider.drop();
    await expect.poll(() => client.connection.get()).toBe("disconnected");
    await expect.poll(provider.connections).toBe(0);
    const accepted = provider.accepted();
    // Observe several configured retry periods to catch a leaked reconnect timer.
    await setTimeout(150);
    expect(provider.accepted()).toBe(accepted);
    expect(provider.connections()).toBe(0);
    expect(client.connection.get()).toBe("disconnected");
  });

  test("reconnects and delivers once after a server-side transport loss", async () => {
    const provider = await create();
    const client = new RealtimeClient({ adapter: provider.adapter });
    const received: string[] = [];
    const room = client.channel("rooms/one");
    const states: string[] = [];
    onTestFinished(
      room.status.subscribe(() => {
        states.push(room.status.get().state);
      }),
    );
    onTestFinished(
      room.subscribe(({ data }) => {
        received.push(String(data));
      }),
    );
    const stop = client.connect();
    onTestFinished(stop);
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    await provider.ready("rooms/one");
    await provider.publish("rooms/one", "before");
    await expect.poll(() => received).toEqual(["before"]);
    const accepted = provider.accepted();
    states.length = 0;

    provider.drop();
    await expect.poll(provider.accepted).toBe(accepted + 1);
    await provider.ready("rooms/one");
    await expect.poll(() => room.status.get().state).toBe("subscribed");
    expect(states).toContain("subscribing");
    await provider.publish("rooms/one", "after");
    await provider.publish("rooms/one", "barrier");
    await expect.poll(() => received).toEqual(["before", "after", "barrier"]);

    stop();
    stop();
    await expect.poll(provider.connections).toBe(0);
  });

  test("opens nothing before a session and releases network resources after every session", async () => {
    const provider = await create();
    const client = new RealtimeClient({ adapter: provider.adapter });
    const room = client.channel("rooms/one");
    onTestFinished(room.subscribe(() => {}));
    expect(provider.connections()).toBe(0);
    expect(provider.accepted()).toBe(0);

    for (let index = 0; index < 3; index++) {
      const stop = client.connect();
      onTestFinished(stop);
      await expect.poll(() => room.status.get().state).toBe("subscribed");
      await provider.ready("rooms/one");
      expect(provider.connections()).toBe(1);
      stop();
      await expect.poll(provider.connections).toBe(0);
      expect(client.connection.get()).toBe("disconnected");
    }
    expect(provider.accepted()).toBe(3);
  });
});
