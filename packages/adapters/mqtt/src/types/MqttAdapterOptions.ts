import type { IClientOptions, IClientSubscribeOptions } from "mqtt";

export type MqttAdapterOptions = {
  url: string;
  options?: IClientOptions;
  /** Per-topic subscription options, such as `qos`. Defaults to QoS 0. */
  getSubscribeOptions?: (channel: string) => IClientSubscribeOptions;
};
