import { Centrifuge, State } from "centrifuge";
import { beforeEach, vi } from "vitest";
import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
import { centrifugo } from "src/centrifugo";

beforeEach(() => {
  vi.spyOn(Centrifuge.prototype, "connect").mockImplementation(function (
    this: Centrifuge,
  ) {
    this.emit("state", {
      oldState: State.Disconnected,
      newState: State.Connecting,
    });
  });
});

testRealtimeAdapter({
  name: "centrifugo",
  createAdapter: () =>
    centrifugo({ transport: "ws://localhost:8000/connection/websocket" }),
  publish: (connection, channel, data) => {
    const subscription = connection.native.getSubscription(channel);

    if (subscription !== null) {
      subscription.emit("publication", { channel, data });
    }
  },
});
