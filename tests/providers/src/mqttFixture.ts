import { Buffer } from "node:buffer";
import { createServer } from "node:net";
import { Aedes } from "aedes";
import type { Client } from "aedes";
import { mqtt } from "simulcast-mqtt";
import { expect, onTestFinished } from "vitest";
import { listen } from "./listen";
import type { NetworkProviderFixture } from "./ProviderFixture";

export const mqttFixture = async () => {
  const broker = await Aedes.createBroker({
    authenticate: (_client, username, password, done) => {
      done(
        null,
        username === "test-user" && password?.toString() === "test-token",
      );
    },
    authorizeSubscribe: (_client, subscription, done) => {
      done(null, subscription.topic === "denied" ? null : subscription);
    },
  });
  const clients = new Set<Client>();
  const subscriptions = new Map<Client, Set<string>>();
  let accepted = 0;
  broker.on("clientReady", (client) => {
    clients.add(client);
    accepted++;
  });
  broker.on("clientDisconnect", (client) => {
    clients.delete(client);
    subscriptions.delete(client);
  });
  broker.on("subscribe", (topics, client) => {
    const channels = subscriptions.get(client) ?? new Set<string>();
    // Aedes includes rejected filters in this event with the SUBACK failure code.
    for (const { topic, qos } of topics) {
      if (qos < 128) channels.add(topic);
    }
    subscriptions.set(client, channels);
  });
  broker.on("unsubscribe", (topics, client) => {
    for (const topic of topics) subscriptions.get(client)?.delete(topic);
  });
  const server = createServer(broker.handle);
  onTestFinished(async () => {
    await new Promise<void>((resolve) => broker.close(() => resolve()));
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });
  const url = `mqtt://${await listen(server)}`;
  const count = (channel: string) =>
    [...subscriptions.values()].filter((channels) => channels.has(channel))
      .length;

  return {
    url,
    count,
    adapter: mqtt({
      url,
      options: {
        username: "test-user",
        password: "test-token",
        reconnectPeriod: 30,
      },
      getSubscribeOptions: () => ({ qos: 1 }),
    }),
    publish: (channel, text) =>
      new Promise<void>((resolve, reject) => {
        broker.publish(
          {
            cmd: "publish",
            topic: channel,
            payload: Buffer.from(text),
            qos: 1,
            retain: false,
            dup: false,
          },
          (error) => (error ? reject(error) : resolve()),
        );
      }),
    ready: async (channel) => {
      await expect.poll(() => count(channel)).toBe(1);
    },
    connections: () => clients.size,
    accepted: () => accepted,
    drop: () => {
      for (const client of clients) client.conn.destroy();
    },
  } satisfies NetworkProviderFixture & {
    url: string;
    count: (channel: string) => number;
  };
};
