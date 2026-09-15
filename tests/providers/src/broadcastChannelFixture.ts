import { randomUUID } from "node:crypto";
import { broadcastChannel } from "@priemskiyyy/simulcast-broadcast-channel";
import { onTestFinished } from "vitest";
import type { ProviderFixture } from "./ProviderFixture";

export const broadcastChannelFixture = async () => {
  const prefix = `${randomUUID()}:`;
  const publishers = new Map<string, BroadcastChannel>();
  onTestFinished(() => {
    for (const publisher of publishers.values()) publisher.close();
  });

  return {
    adapter: broadcastChannel({ prefix }),
    publish: async (channel, text) => {
      let publisher = publishers.get(channel);
      if (publisher === undefined) {
        publisher = new BroadcastChannel(`${prefix}${channel}`);
        publishers.set(channel, publisher);
      }
      publisher.postMessage(text);
    },
    ready: async () => {},
  } satisfies ProviderFixture;
};
