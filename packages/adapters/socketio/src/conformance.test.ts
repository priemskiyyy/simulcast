import { Socket } from "socket.io-client";
import { beforeEach, vi } from "vitest";
import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
import { socketio } from "src/socketio";

const fire = (socket: Socket, event: string, ...args: unknown[]) => {
  for (const listener of socket.listeners(event)) {
    listener(...args);
  }
};

beforeEach(() => {
  vi.spyOn(Socket.prototype, "connect").mockImplementation(function (
    this: Socket,
  ) {
    return this;
  });
});

testRealtimeAdapter({
  name: "socketio",
  createAdapter: () => socketio({ url: "http://localhost:1" }),
  publish: (connection, channel, data) => {
    fire(connection.native, "connect");
    fire(connection.native, channel, data);
  },
});
