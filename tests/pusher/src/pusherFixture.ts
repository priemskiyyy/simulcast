import { randomUUID } from "node:crypto";
import { connect, createServer } from "node:net";
import type { Socket } from "node:net";
import Pusher from "pusher";
import { pusher } from "@priemskiyyy/simulcast-pusher";
import type { PusherAdapterOptions } from "@priemskiyyy/simulcast-pusher";
import { inject, onTestFinished } from "vitest";
import { listen } from "../../providers/src/listen";

export const pusherFixture = async () => {
  const port = inject("soketiPort");
  const publisher = new Pusher({
    appId: "test-app",
    key: "test-key",
    secret: "test-secret",
    host: "127.0.0.1",
    port: String(port),
    useTLS: false,
  });
  const sockets = new Set<Socket>();
  let accepted = 0;
  let authorizations = 0;
  // A transparent TCP proxy lets each test interrupt only its own connections.
  const proxy = createServer((downstream) => {
    accepted++;
    sockets.add(downstream);
    const upstream = connect(port, "127.0.0.1");
    downstream.pipe(upstream).pipe(downstream);
    downstream.on("error", () => upstream.destroy());
    upstream.on("error", () => downstream.destroy());
    downstream.on("close", () => {
      sockets.delete(downstream);
      upstream.destroy();
    });
    upstream.on("close", () => downstream.destroy());
  });
  onTestFinished(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve, reject) =>
      proxy.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      }),
    );
  });
  const address = await listen(proxy);
  const userId = randomUUID();
  const options = {
    cluster: "local",
    wsHost: "127.0.0.1",
    wsPort: Number(address.split(":").at(-1)),
    forceTLS: false,
    enabledTransports: ["ws"],
    disableStats: true,
    channelAuthorization: {
      customHandler: ({ socketId, channelName }, callback) => {
        authorizations++;
        if (channelName.startsWith("private-denied-")) {
          callback(new Error("Test access denied"), null);
          return;
        }
        callback(
          null,
          publisher.authorizeChannel(
            socketId,
            channelName,
            channelName.startsWith("presence-")
              ? { user_id: userId, user_info: { name: "Test member" } }
              : undefined,
          ),
        );
      },
    },
  } satisfies PusherAdapterOptions["options"];

  return {
    adapter: pusher({ key: "test-key", options }),
    options,
    publisher,
    channel: (prefix = "room") => `${prefix}-${randomUUID()}`,
    connections: () => sockets.size,
    accepted: () => accepted,
    authorizations: () => authorizations,
    drop: () => {
      for (const socket of sockets) socket.destroy();
    },
    occupied: async (channel: string) => {
      const response = await publisher.get({ path: `/channels/${channel}` });
      const body: unknown = await response.json();
      if (
        typeof body !== "object" ||
        body === null ||
        !("occupied" in body) ||
        typeof body.occupied !== "boolean"
      ) {
        throw new Error(`Unexpected channel response: ${JSON.stringify(body)}`);
      }
      return body.occupied;
    },
  };
};
