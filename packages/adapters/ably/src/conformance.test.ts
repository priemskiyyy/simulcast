import { Realtime } from "ably";
import { beforeEach, vi } from "vitest";
import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
import { ably } from "src/ably";

beforeEach(() => {
  vi.spyOn(Realtime.prototype, "connect").mockImplementation(() => {});
});

testRealtimeAdapter({
  name: "ably",
  createAdapter: () => ably({ options: { key: "app.key:secret" } }),
  publish: (connection, channel, data) => {
    // The SDK's channel keeps its listeners in a runtime-only emitter.
    connection.native.channels.get(channel).subscriptions.emit("created", {
      id: "m1",
      name: "created",
      data,
      timestamp: 1,
      action: "message.create",
      version: {},
      annotations: { summary: {} },
    });
  },
});
