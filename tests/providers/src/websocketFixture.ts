import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import { websocket } from "@priemskiyyy/simulcast-websocket";
import type { WebSocketPublication } from "@priemskiyyy/simulcast-websocket";
import { expect, onTestFinished } from "vitest";
import { listen } from "./listen";
import type { NetworkProviderFixture } from "./ProviderFixture";

export const websocketFixture = async () => {
  const http = createServer();
  const server = new WebSocketServer({ server: http });
  const subscriptions = new Map<WebSocket, Set<string>>();
  const subscribeRequests: string[] = [];
  let accepted = 0;
  server.on("connection", (socket) => {
    accepted++;
    const channels = new Set<string>();
    subscriptions.set(socket, channels);
    socket.on("close", () => subscriptions.delete(socket));
    socket.on("message", (data) => {
      const frame: { type: string; channel: string } = JSON.parse(
        data.toString(),
      );
      if (frame.type === "subscribe") {
        subscribeRequests.push(frame.channel);
        channels.add(frame.channel);
        return;
      }
      if (frame.type === "unsubscribe") channels.delete(frame.channel);
    });
  });
  onTestFinished(async () => {
    for (const socket of server.clients) socket.terminate();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await new Promise<void>((resolve, reject) =>
      http.close((error) => (error ? reject(error) : resolve())),
    );
  });
  const count = (channel: string) =>
    [...subscriptions.values()].filter((channels) => channels.has(channel))
      .length;

  return {
    count,
    subscribeRequests,
    adapter: websocket({
      url: `ws://${await listen(http)}`,
      reconnectDelay: 30,
      protocol: {
        subscribe: (channel) => JSON.stringify({ type: "subscribe", channel }),
        unsubscribe: (channel) =>
          JSON.stringify({ type: "unsubscribe", channel }),
        decode: ({ data }): WebSocketPublication => JSON.parse(String(data)),
      },
    }),
    publish: async (channel, text) => {
      for (const [socket, channels] of subscriptions) {
        if (channels.has(channel))
          socket.send(JSON.stringify({ channel, data: text }));
      }
    },
    ready: async (channel) => {
      await expect.poll(() => count(channel)).toBe(1);
    },
    connections: () => server.clients.size,
    accepted: () => accepted,
    drop: () => {
      for (const socket of server.clients) socket.terminate();
    },
  } satisfies NetworkProviderFixture & {
    count: (channel: string) => number;
    subscribeRequests: string[];
  };
};
