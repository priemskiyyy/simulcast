import { RealtimeClient } from "@priemskiyyy/simulcast";
import type { RealtimePublication } from "@priemskiyyy/simulcast";
import { expect, onTestFinished, test } from "vitest";
import { sseFixture } from "./sseFixture";

test("SSE parses fragmented named events, preserves IDs, and resumes with Last-Event-ID", async () => {
  const provider = await sseFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const received: RealtimePublication[] = [];
  onTestFinished(
    client.channel("rooms/one").subscribe((publication) => {
      received.push(publication);
    }),
  );
  onTestFinished(client.connect());
  await provider.ready("rooms/one");
  provider.send("rooms/one", "id: event-42\nevent: cre");
  provider.send("rooms/one", "ated\ndata: first line\ndata: second line\n\n");
  await expect.poll(() => received.length).toBe(1);
  expect(received[0]).toMatchObject({
    event: "created",
    data: "first line\nsecond line",
    native: { lastEventId: "event-42" },
  });
  provider.drop();
  await expect
    .poll(() => provider.requests.at(-1)?.lastEventId)
    .toBe("event-42");
  await provider.ready("rooms/one");
  await provider.publish("rooms/one", "resumed");
  await expect
    .poll(() => received.map(({ data }) => data))
    .toEqual(["first line\nsecond line", "resumed"]);
});

test("SSE HTTP rejection becomes an unsubscribed channel with an error", async () => {
  const provider = await sseFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const channel = client.channel("denied");
  onTestFinished(channel.subscribe(() => {}));
  onTestFinished(client.connect());
  await expect.poll(() => channel.status.get().error).not.toBeNull();
  expect(channel.status.get().state).toBe("unsubscribed");
  expect(provider.connections()).toBe(0);
});

test("SSE opens one stream for shared demand and closes it after the last consumer", async () => {
  const provider = await sseFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const channel = client.channel("rooms/one");
  const first = channel.subscribe(() => {});
  const second = channel.subscribe(() => {});
  onTestFinished(first);
  onTestFinished(second);
  onTestFinished(client.connect());
  await provider.ready("rooms/one");
  expect(provider.accepted()).toBe(1);
  first();
  expect(provider.count("rooms/one")).toBe(1);
  second();
  await expect.poll(provider.connections).toBe(0);
});
