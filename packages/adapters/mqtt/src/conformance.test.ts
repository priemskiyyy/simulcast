import { MqttClient } from "mqtt";
import { beforeEach, vi } from "vitest";
import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
import { mqtt } from "src/mqtt";

beforeEach(() => {
  vi.spyOn(MqttClient.prototype, "connect").mockImplementation(function (
    this: MqttClient,
  ) {
    return this;
  });
  vi.spyOn(MqttClient.prototype, "end").mockImplementation(function (
    this: MqttClient,
  ) {
    return this;
  });
});

testRealtimeAdapter({
  name: "mqtt",
  createAdapter: () => mqtt({ url: "mqtt://localhost:1" }),
  channels: ["conformance/one", "conformance/two"],
  publish: (connection, channel, data) => {
    const payload = Buffer.from(String(data));

    connection.native.emit("message", channel, payload, {
      cmd: "publish",
      qos: 0,
      dup: false,
      retain: false,
      topic: channel,
      payload,
    });
  },
});
