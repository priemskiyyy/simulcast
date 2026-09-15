import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { EventSource } from "eventsource";
import { sse } from "@priemskiyyy/simulcast-sse";
import { expect, onTestFinished } from "vitest";
import { listen } from "./listen";
import type { NetworkProviderFixture } from "./ProviderFixture";

export const sseFixture = async () => {
  const streams = new Map<ServerResponse, string>();
  const requests: { channel: string; lastEventId: string | undefined }[] = [];
  let accepted = 0;
  const server = createServer((request, response) => {
    const channel = decodeURIComponent(
      new URL(request.url ?? "/", "http://localhost").pathname.slice(1),
    );
    if (channel === "denied") {
      response.writeHead(403).end();
      return;
    }
    accepted++;
    requests.push({
      channel,
      lastEventId: request.headers["last-event-id"]?.toString(),
    });
    streams.set(response, channel);
    response.on("close", () => streams.delete(response));
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });
    response.write("retry: 30\n\n");
  });
  onTestFinished(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });
  const url = `http://${await listen(server)}`;
  const send = (channel: string, frame: string) => {
    for (const [response, name] of streams) {
      if (name === channel) response.write(frame);
    }
  };
  const count = (channel: string) =>
    [...streams.values()].filter((name) => name === channel).length;

  return {
    requests,
    send,
    count,
    adapter: sse({
      url: (channel) => `${url}/${encodeURIComponent(channel)}`,
      eventSource: EventSource,
      events: ["created"],
    }),
    publish: async (channel, text) => {
      send(channel, `data: ${text}\n\n`);
    },
    ready: async (channel) => {
      await expect.poll(() => count(channel)).toBe(1);
    },
    connections: () => streams.size,
    accepted: () => accepted,
    drop: () => {
      for (const response of streams.keys()) response.destroy();
    },
  } satisfies NetworkProviderFixture & {
    requests: typeof requests;
    send: typeof send;
    count: typeof count;
  };
};
