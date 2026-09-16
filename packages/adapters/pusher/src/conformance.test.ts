import Pusher from "pusher-js";
import { beforeEach, vi } from "vitest";
import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
import { pusher } from "src/pusher";

beforeEach(() => {
  vi.spyOn(Pusher.prototype, "connect").mockImplementation(function (
    this: Pusher,
  ) {
    if (this.connection.state !== "initialized") {
      return;
    }

    const previous = this.connection.state;
    this.connection.state = "connecting";
    this.connection.emit("state_change", { previous, current: "connecting" });
  });
});

testRealtimeAdapter({
  name: "pusher",
  createAdapter: () => pusher({ key: "app-key", options: { cluster: "eu" } }),
  publish: (connection, channel, data) => {
    const native = connection.native.channel(channel);

    if (native !== undefined) {
      native.emit("created", data);
    }
  },
});
