import { createServer } from "node:http";
import { Server } from "socket.io";
import { socketio } from "simulcast-socketio";
import { expect, onTestFinished } from "vitest";
import { listen } from "./listen";
import type { NetworkProviderFixture } from "./ProviderFixture";

export const socketioFixture = async () => {
  const http = createServer();
  const server = new Server(http);
  let accepted = 0;
  server.on("connection", () => accepted++);
  server.use((socket, next) => {
    next(
      socket.handshake.auth.token === "test-token"
        ? undefined
        : new Error("Unauthorized"),
    );
  });
  onTestFinished(
    () => new Promise<void>((resolve) => server.close(() => resolve())),
  );
  const url = `http://${await listen(http)}`;

  return {
    server,
    url,
    adapter: socketio({
      url,
      options: {
        auth: { token: "test-token" },
        reconnectionDelay: 30,
        reconnectionDelayMax: 30,
        randomizationFactor: 0,
      },
    }),
    publish: async (channel, text) => {
      server.emit(channel, text);
    },
    ready: async () => {
      await expect.poll(() => server.of("/").sockets.size).toBe(1);
    },
    connections: () => server.of("/").sockets.size,
    accepted: () => accepted,
    // Closing the transport exercises the SDK's automatic reconnect path.
    drop: () => {
      for (const socket of server.of("/").sockets.values()) socket.conn.close();
    },
  } satisfies NetworkProviderFixture & { server: Server; url: string };
};
