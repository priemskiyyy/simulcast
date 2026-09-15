import { RealtimeClient } from "simulcast";
import { expect, onTestFinished, test } from "vitest";
import { websocketFixture } from "./websocketFixture";

test("WebSocket sends one subscription frame and unsubscribes only after the last consumer", async () => {
  const provider = await websocketFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const channel = client.channel("rooms/one");
  const first = channel.subscribe(() => {});
  const second = channel.subscribe(() => {});
  onTestFinished(first);
  onTestFinished(second);
  onTestFinished(client.connect());
  await provider.ready("rooms/one");
  expect(provider.subscribeRequests).toEqual(["rooms/one"]);
  first();
  expect(provider.count("rooms/one")).toBe(1);
  second();
  await expect.poll(() => provider.count("rooms/one")).toBe(0);
  expect(provider.connections()).toBe(1);
});
